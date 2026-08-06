import "server-only";

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

export type GlossarTyp = "begriff" | "anforderung" | "praxisfrage";

export interface GlossarEintrag {
  id: string;
  typ: GlossarTyp;
  /** Nachschlage-Begriff (prominent). */
  begriff: string;
  /** EN-Begriff (Übersetzungsfalle) – nur bei Rollen/Begriffen. */
  begriff_en: string | null;
  /** Kurzdefinition unter dem Begriff. */
  kurztext: string | null;
  /** Quelle-Chip (Fundstelle bzw. Rechtsquelle). */
  quelle: string;
  /** Bestehende Detailseite; null, wenn der Eintrag selbst das Ziel ist. */
  href: string | null;
  /** Für den Verpackungsart-Filter (nur Anforderungen tragen diese Daten). */
  verpackungstypen: string[];
  /** Volltext-Suchanker (inkl. Alt-Begriffen und Verwechslungsfällen). */
  suchtext: string;
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
}> {
  const [rollen, anforderungen, auslegungen, nutzerRollen] = await Promise.all([
    getRollenDefinitionen(),
    getAnforderungen(),
    getAuslegungen(),
    ladeNutzerRollen().catch(() => new Set<string>()),
  ]);
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
      href: `/wissen/anforderungen/${a.id}`,
      verpackungstypen: a.betrifft_verpackungstypen,
      suchtext: alsSuchtext(a.titel, a.kurzerklaerung),
      betrifft_mich: betrifft,
    });
  }

  for (const a of auslegungen) {
    const betrifft =
      hatProfil && (a.bezug_nr ?? []).some((nr) => betroffeneNrn.has(nr));
    eintraege.push({
      id: `auslegung:${a.id}`,
      typ: "praxisfrage",
      begriff: a.frage,
      begriff_en: null,
      kurztext: kuerze(a.antwort),
      // Sprachneutral: fehlt eine Quelle, trägt der Chip den Auslegungs-Code.
      quelle: a.quellen[0] ?? a.code ?? "—",
      href: `/wissen/auslegungen?q=${encodeURIComponent(a.frage)}`,
      suchtext: alsSuchtext(a.frage),
      verpackungstypen: [],
      betrifft_mich: betrifft,
    });
  }

  eintraege.sort((a, b) => a.begriff.localeCompare(b.begriff, "de"));
  return { eintraege, hatProfil };
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
