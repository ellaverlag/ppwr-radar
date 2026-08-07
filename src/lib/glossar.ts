import "server-only";

import {
  createClient as createBareClient,
  type SupabaseClient,
} from "@supabase/supabase-js";
import { isPreviewMode } from "@/lib/preview";
import {
  anforderungUrl,
  glossarBegriffUrl,
  praxisfrageUrl,
} from "@/lib/wissen-links";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import type { RollenSet } from "@/lib/rollen-engine";
import {
  getAnforderungen,
  getAuslegungen,
  getRollenDefinitionen,
} from "@/lib/wissensbasis";

/**
 * Glossar = Zugangsschicht über die bestehende Wissensbasis. Es werden keine
 * eigenen Inhalte gepflegt: Jeder Eintrag ist eine Projektion aus
 * rollen_definitionen, anforderungen oder auslegungen und verlinkt – wo es
 * eine gibt – auf die bestehende Detailseite. Lesepfad wie überall über
 * wissensbasis.ts (Freigabe-Filter, im Preview-Modus Service-Role).
 */

export type GlossarTyp =
  | "begriff"
  | "anforderung"
  | "praxisfrage"
  | "verpackung_material";

export interface GlossarEintrag {
  id: string;
  typ: GlossarTyp;
  /** Nachschlage-Begriff (prominent). */
  begriff: string;
  /** EN-Begriff (Übersetzungsfalle) – nur bei Rollen/Begriffen. */
  begriff_en: string | null;
  /** Kurzdefinition unter dem Begriff. */
  kurztext: string | null;
  /** Quelle-Chip (Fundstelle bzw. Rechtsquelle); null = kein Chip. */
  quelle: string | null;
  /** Nur Praxisfragen: vollständige Frage (Zeile zeigt den Kurztitel). */
  frageVoll?: string | null;
  /** Bestehende Detailseite; null, wenn der Eintrag selbst das Ziel ist. */
  href: string | null;
  /** Für den Verpackungsart-Filter (nur Anforderungen tragen diese Daten). */
  verpackungstypen: string[];
  /** Volltext-Suchanker (inkl. Alt-Begriffen und Verwechslungsfällen). */
  suchtext: string;
  /** Nur Praxisfragen: vollständige Antwort für die Accordion-Darstellung. */
  antwort: string | null;
  /** Nur Praxisfragen: Code für den Deep-Link (#A01) in die Praxisfragen. */
  code: string | null;
  /** Nur Praxis-Glossar (glossar_lemmata): Merkmale-Zeile. */
  merkmale?: string | null;
  /** Nur Praxis-Glossar: klickbare Verweis-Chips. */
  verweisChips?: { label: string; href: string }[];
  /** Profil vorhanden und Matching greift. */
  betrifft_mich: boolean;
}

/** anforderungen.betrifft_rollen nutzt teils Kurzformen der rolle_ids. */
const ROLLEN_ALIAS: Record<string, string> = {
  fulfillment: "fulfillment_dienstleister",
};

const normRolle = (rolle: string) => ROLLEN_ALIAS[rolle] ?? rolle;

function kuerze(text: string, max = 200): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const geschnitten = t.slice(0, max);
  const letzterRaum = geschnitten.lastIndexOf(" ");
  return `${geschnitten.slice(0, letzterRaum > max / 2 ? letzterRaum : max)} …`;
}

const alsSuchtext = (...teile: (string | null | undefined)[]) =>
  teile.filter(Boolean).join(" ").toLowerCase();

/**
 * Praxis-Glossar „Verpackungen & Materialien“ aus glossar_lemmata
 * (60 Lemmata: Objekte, Materialien, Begriffe). Lesepfad wie überall:
 * live Session-Client (RLS: freigegeben + ausspielen), im Preview-Modus
 * Service-Role inkl. Entwürfen. Fail-soft: Fehler/leer → keine Einträge,
 * der Typ-Filter bleibt ausgeblendet.
 */
interface LemmaZeile {
  nr: number;
  code: string | null;
  lemma: string;
  synonyme: string[] | null;
  typ: "objekt" | "material" | "begriff";
  kurzerklaerung: string | null;
  merkmale: string | null;
  verweis_anforderungen: number[] | null;
  verweis_auslegungen: string[] | null;
  verweis_rollen: string[] | null;
}

async function lemmataClient(): Promise<SupabaseClient> {
  if (isPreviewMode() && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    return createBareClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }
  return createSessionClient();
}

async function ladeLemmata(
  anforderungen: { id: string; nr: number | null; titel: string }[],
  rollen: { rolle_id: string; begriff_de: string }[],
  auslegungen: { code: string | null; kurztitel: string | null; frage: string }[]
): Promise<GlossarEintrag[]> {
  try {
    const client = await lemmataClient();
    let query = client.from("glossar_lemmata").select("*").order("nr");
    if (!isPreviewMode()) {
      query = query
        .eq("review_status", "cattwyk_freigegeben")
        .eq("ausspielen", true);
    }
    const { data, error } = await query;
    if (error || !data) return [];

    const anfNachNr = new Map(
      anforderungen.filter((a) => a.nr != null).map((a) => [a.nr as number, a])
    );
    const rolleNachId = new Map(rollen.map((r) => [r.rolle_id, r.begriff_de]));
    const auslegungNachCode = new Map(
      auslegungen
        .filter((a) => a.code)
        .map((a) => [a.code as string, a.kurztitel ?? kuerze(a.frage, 40)])
    );

    return (data as LemmaZeile[]).map((lemma) => {
      const chips: { label: string; href: string }[] = [];
      for (const nr of lemma.verweis_anforderungen ?? []) {
        const anforderung = anfNachNr.get(nr);
        if (anforderung) {
          chips.push({
            label: `#${String(nr).padStart(2, "0")} ${kuerze(anforderung.titel, 32)}`,
            href: anforderungUrl(anforderung.id),
          });
        }
      }
      for (const code of lemma.verweis_auslegungen ?? []) {
        // Nur Chips für Codes, die es (in dieser Ausspielung) gibt – sonst
        // zeigte der Anker ins Leere. Sprechendes Label statt internem Code.
        const label = auslegungNachCode.get(code);
        if (label) {
          chips.push({ label, href: praxisfrageUrl(code) });
        }
      }
      for (const rolleId of lemma.verweis_rollen ?? []) {
        const begriff = rolleNachId.get(rolleId);
        chips.push({
          label: begriff ?? rolleId,
          href: glossarBegriffUrl(begriff ?? rolleId),
        });
      }

      return {
        id: `lemma:${lemma.nr}`,
        typ:
          lemma.typ === "begriff"
            ? ("begriff" as const)
            : ("verpackung_material" as const),
        begriff: lemma.lemma,
        begriff_en: null,
        kurztext: lemma.kurzerklaerung,
        // Interner Datensatz-Code (L01 …) bleibt aus der Nutzer-Ansicht heraus
        quelle: null,
        href: null,
        verpackungstypen: [],
        // Synonyme sind Suchanker: „Twist-off“ findet das Marmeladenglas
        suchtext: alsSuchtext(
          lemma.lemma,
          ...(lemma.synonyme ?? []),
          lemma.kurzerklaerung,
          lemma.merkmale
        ),
        antwort: null,
        code: null,
        merkmale: lemma.merkmale,
        verweisChips: chips,
        betrifft_mich: false,
      };
    });
  } catch {
    return [];
  }
}

/**
 * Begriffs-Lemmata (typ=begriff) für Erklärhilfen im Onboarding-Wizard –
 * gleicher Lesepfad/Freigabefilter wie das Glossar, fail-soft.
 */
export async function ladeBegriffsLemmata(): Promise<
  { code: string | null; lemma: string; kurzerklaerung: string | null }[]
> {
  try {
    const client = await lemmataClient();
    let query = client
      .from("glossar_lemmata")
      .select("code, lemma, kurzerklaerung")
      .eq("typ", "begriff");
    if (!isPreviewMode()) {
      query = query
        .eq("review_status", "cattwyk_freigegeben")
        .eq("ausspielen", true);
    }
    const { data, error } = await query;
    if (error || !data) return [];
    return data;
  } catch {
    return [];
  }
}

/** Rollen des eingeloggten Nutzers über alle Produktlinien (leer ohne Profil). */
async function ladeNutzerRollen(): Promise<Set<string>> {
  const rollen = new Set<string>();
  const supabase = await createSessionClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return rollen;

  const { data: profil } = await supabase
    .from("profile")
    .select("id, onboarding_abgeschlossen")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profil?.onboarding_abgeschlossen) return rollen;

  const { data } = await supabase
    .from("rollen_ergebnisse")
    .select("rollen_set")
    .eq("profil_id", profil.id);
  for (const zeile of data ?? []) {
    const set = zeile.rollen_set as RollenSet;
    for (const rolle of set?.rollen ?? []) rollen.add(rolle);
  }
  return rollen;
}

export async function ladeGlossar(): Promise<{
  eintraege: GlossarEintrag[];
  hatProfil: boolean;
  hatLemmata: boolean;
}> {
  const [rollen, anforderungen, auslegungen, nutzerRollen] = await Promise.all([
    getRollenDefinitionen(),
    getAnforderungen(),
    getAuslegungen(),
    ladeNutzerRollen().catch(() => new Set<string>()),
  ]);
  // Lemmata brauchen Anforderungen + Rollen-Begriffe für die Verweis-Chips
  const lemmata = await ladeLemmata(anforderungen, rollen, auslegungen);
  const hatProfil = nutzerRollen.size > 0;

  const eintraege: GlossarEintrag[] = [];

  for (const r of rollen) {
    eintraege.push({
      id: `rolle:${r.rolle_id}`,
      typ: "begriff",
      begriff: r.begriff_de,
      begriff_en:
        r.begriff_en && r.begriff_en !== "—" ? r.begriff_en : null,
      kurztext: r.definition_kurz,
      quelle: r.fundstelle_ppwr,
      // Rollen/Begriffe haben (noch) keine eigene Detailseite – der
      // Glossar-Eintrag ist hier selbst das Nachschlage-Ziel.
      href: null,
      verpackungstypen: [],
      // Alt-Begriffe aus dem VerpackG und Verwechslungsfälle sind Suchanker!
      suchtext: alsSuchtext(
        r.begriff_de,
        r.begriff_en,
        r.alt_bedeutung_verpackg,
        r.verwechslungsfaelle
      ),
      antwort: null,
      code: null,
      betrifft_mich: hatProfil && nutzerRollen.has(r.rolle_id),
    });
  }

  const betroffeneNrn = new Set<number>();
  for (const a of anforderungen) {
    const betrifft =
      hatProfil &&
      a.betrifft_rollen.some((rolle) => nutzerRollen.has(normRolle(rolle)));
    if (betrifft && a.nr != null) betroffeneNrn.add(a.nr);
    eintraege.push({
      id: `anforderung:${a.id}`,
      typ: "anforderung",
      begriff: a.titel,
      begriff_en: null,
      kurztext: a.kurzerklaerung ? kuerze(a.kurzerklaerung) : null,
      quelle: a.rechtsquelle,
      href: anforderungUrl(a.id),
      verpackungstypen: a.betrifft_verpackungstypen,
      suchtext: alsSuchtext(a.titel, a.kurzerklaerung),
      antwort: null,
      code: null,
      betrifft_mich: betrifft,
    });
  }

  for (const a of auslegungen) {
    const betrifft =
      hatProfil && (a.bezug_nr ?? []).some((nr) => betroffeneNrn.has(nr));
    eintraege.push({
      id: `auslegung:${a.id}`,
      typ: "praxisfrage",
      // Kurztitel als Nachschlage-Zeile; die volle Frage erscheint aufgeklappt
      begriff: a.kurztitel ?? a.frage,
      frageVoll: a.frage,
      begriff_en: null,
      kurztext: kuerze(a.antwort),
      // Interne Codes (A01 …) bleiben aus der Nutzer-Ansicht heraus
      quelle: a.quellen[0] ?? null,
      // Deep-Link in die Praxisfragen (#Code); ohne Code Volltext-Fallback
      href: praxisfrageUrl(a.code, a.frage),
      suchtext: alsSuchtext(a.kurztitel, a.frage, a.antwort),
      verpackungstypen: [],
      antwort: a.antwort,
      code: a.code,
      betrifft_mich: betrifft,
    });
  }

  eintraege.push(...lemmata);

  eintraege.sort((a, b) => a.begriff.localeCompare(b.begriff, "de"));
  return { eintraege, hatProfil, hatLemmata: lemmata.length > 0 };
}

/** Registerbuchstabe eines Eintrags (Umlaute unter dem Grundbuchstaben). */
export function registerBuchstabe(begriff: string): string {
  const erster = begriff
    .trim()
    .charAt(0)
    .toUpperCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
  return /[A-Z]/.test(erster) ? erster : "#";
}
