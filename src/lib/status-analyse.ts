import { parseState, type Antwort } from "@/lib/onboarding";
import type { RollenSet } from "@/lib/rollen-engine";
import { createClient } from "@/lib/supabase/server";
import { getAnforderungen, type Anforderung } from "@/lib/wissensbasis";

/**
 * Status-Analyse: Welche Anforderungen treffen auf ein Profil zu, und wie
 * weit ist die Umsetzung?
 *
 * Matching = Schnittmenge aus betrifft_rollen × Engine-Rollen (über alle
 * Produktlinien), betrifft_verpackungstypen × erfassten Verpackungsarten
 * und Lebensmittelkontakt-Flag. Materialien werden im Wizard nicht erfasst –
 * materialbeschränkte Anforderungen gelten daher als potenziell zutreffend
 * und tragen die Einschränkung als Hinweis (kein stilles Wegfiltern).
 *
 * Lesepfad wie überall: Anforderungen kommen über getAnforderungen()
 * (Preview → alles, live → nur Freigegebenes); Profildaten own-row per RLS.
 */

// ---------------------------------------------------------------------------
// Vokabular-Mappings
// ---------------------------------------------------------------------------

/** Engine-Rollen-IDs → Tokens in anforderungen.betrifft_rollen. */
const ROLLEN_TOKEN: Record<string, string> = {
  fulfillment_dienstleister: "fulfillment",
};

/**
 * Wizard-Verpackungsarten (F05) → Tokens in betrifft_verpackungstypen.
 * Service- und Primärproduktionsverpackungen sind Unterfälle der
 * Verkaufsverpackung (Art. 3 Abs. 1 Nr. 1 lit. a PPWR) und matchen daher
 * auf "verkauf". "mehrweg" wird im Wizard nicht erfasst und matcht nie –
 * Mehrweg-Pflichten erscheinen nur über "alle".
 */
const VERPACKUNGSART_TOKEN: Record<string, string> = {
  verkauf: "verkauf",
  um: "umverpackung",
  transport: "transport",
  ecommerce: "ecommerce_versand",
  service: "verkauf",
  primaerproduktion: "verkauf",
};

export type Bearbeitungsstatus = "offen" | "in_bearbeitung" | "erledigt";

export interface ProfilKontext {
  /** Engine-Rollen-IDs, vereinigt über alle Produktlinien. */
  rollen: string[];
  /** Kanonische F05-Schlüssel, vereinigt über alle Produktlinien. */
  verpackungsarten: string[];
  /** true, wenn mindestens eine Produktlinie Lebensmittelkontakt hat (F13). */
  lebensmittelkontakt: boolean;
}

export interface ZutreffenGrund {
  /** Getroffene Rollen (Engine-IDs, für Label-Auflösung im UI). */
  rollen: string[];
  /** Getroffene Verpackungstypen (betrifft-Vokabular); leer bei "alle". */
  verpackungstypen: string[];
  /** true, wenn die Anforderung nur wegen Lebensmittelkontakt greift. */
  lebensmittelkontakt: boolean;
  /** Materialbeschränkung der Anforderung (nicht profilgeprüft), sonst null. */
  materialEinschraenkung: string[] | null;
}

export interface ZutreffendeAnforderung {
  anforderung: Anforderung;
  grund: ZutreffenGrund;
  status: Bearbeitungsstatus;
  notiz: string | null;
}

export interface StatusAnalyse {
  kontext: ProfilKontext;
  zutreffend: ZutreffendeAnforderung[];
  /** Ampel-Zahlen. kritisch = offen + in Kraft, vormerkung = offen + später. */
  zahlen: {
    gesamt: number;
    erledigt: number;
    inBearbeitung: number;
    offen: number;
    kritisch: number;
    vormerkung: number;
  };
}

// ---------------------------------------------------------------------------
// Pures Matching (testbar ohne IO)
// ---------------------------------------------------------------------------

export function matchAnforderung(
  anforderung: Anforderung,
  kontext: ProfilKontext
): ZutreffenGrund | null {
  // Rollen: Schnittmenge zwingend (kein "alle"-Token im Vokabular)
  const rollenTreffer = kontext.rollen.filter((rolle) =>
    anforderung.betrifft_rollen.includes(ROLLEN_TOKEN[rolle] ?? rolle)
  );
  if (rollenTreffer.length === 0) return null;

  // Verpackungstypen: "alle" matcht immer, sonst Schnittmenge
  const profilTypen = new Set(
    kontext.verpackungsarten
      .map((art) => VERPACKUNGSART_TOKEN[art])
      .filter(Boolean)
  );
  const typenTreffer = anforderung.betrifft_verpackungstypen.includes("alle")
    ? []
    : anforderung.betrifft_verpackungstypen.filter((typ) =>
        profilTypen.has(typ)
      );
  if (
    !anforderung.betrifft_verpackungstypen.includes("alle") &&
    typenTreffer.length === 0
  ) {
    return null;
  }

  // Lebensmittelkontakt: "nur_lmk" nur bei bejahtem F13
  if (
    anforderung.lebensmittelkontakt === "nur_lmk" &&
    !kontext.lebensmittelkontakt
  ) {
    return null;
  }

  const materialEinschraenkung = anforderung.betrifft_materialien.includes(
    "alle"
  )
    ? null
    : anforderung.betrifft_materialien;

  return {
    rollen: rollenTreffer,
    verpackungstypen: typenTreffer,
    lebensmittelkontakt: anforderung.lebensmittelkontakt === "nur_lmk",
    materialEinschraenkung,
  };
}

/** Dringlichkeit: in Kraft vor künftig, darin nach gilt_ab, dann nach Nr. */
export function sortiereNachDringlichkeit(
  a: ZutreffendeAnforderung,
  b: ZutreffendeAnforderung
): number {
  const rang = (z: ZutreffendeAnforderung) =>
    z.anforderung.gilt_status === "in_kraft" ? 0 : 1;
  if (rang(a) !== rang(b)) return rang(a) - rang(b);
  const datumA = a.anforderung.gilt_ab ?? "9999-12-31";
  const datumB = b.anforderung.gilt_ab ?? "9999-12-31";
  if (datumA !== datumB) return datumA < datumB ? -1 : 1;
  return (a.anforderung.nr ?? 999) - (b.anforderung.nr ?? 999);
}

// ---------------------------------------------------------------------------
// Kontext aus Profildaten
// ---------------------------------------------------------------------------

export function baueKontext(
  rollenSets: RollenSet[],
  taetigkeiten: unknown,
  /** Namen der aktiven Produktlinien; undefined = alle berücksichtigen. */
  aktiveNamen?: Set<string>
): ProfilKontext {
  const rollen = new Set<string>();
  for (const set of rollenSets) {
    for (const rolle of set.rollen) rollen.add(rolle);
  }

  const state = parseState(taetigkeiten);
  const verpackungsarten = new Set<string>();
  let lebensmittelkontakt = false;
  for (const [key, linie] of Object.entries(state.linien)) {
    const name = state.produktlinien[Number(key)];
    if (aktiveNamen && (name == null || !aktiveNamen.has(name))) continue;
    const arten: Antwort | undefined = linie.verpackungsart;
    for (const art of Array.isArray(arten) ? arten : arten ? [arten] : []) {
      verpackungsarten.add(art);
    }
    if (linie.lebensmittelkontakt === "ja") lebensmittelkontakt = true;
  }

  return {
    rollen: [...rollen],
    verpackungsarten: [...verpackungsarten],
    lebensmittelkontakt,
  };
}

// ---------------------------------------------------------------------------
// IO: Analyse für den eingeloggten Nutzer
// ---------------------------------------------------------------------------

/** null, wenn kein Profil existiert oder das Onboarding nicht abgeschlossen ist. */
export async function ladeStatusAnalyse(): Promise<StatusAnalyse | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profil } = await supabase
    .from("profile")
    .select("id, onboarding_abgeschlossen, taetigkeiten")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profil?.onboarding_abgeschlossen) return null;

  const [
    { data: ergebnisse },
    { data: statusZeilen },
    { data: verpackungen },
    anforderungen,
  ] = await Promise.all([
    supabase
      .from("rollen_ergebnisse")
      .select("produktlinie, rollen_set")
      .eq("profil_id", profil.id)
      .eq("aktuell", true),
    supabase
      .from("anforderungs_status")
      .select("anforderung_nr, status, notiz")
      .eq("profil_id", profil.id),
    supabase
      .from("profil_verpackungen")
      .select("bezeichnung, status")
      .eq("profil_id", profil.id),
    getAnforderungen(),
  ]);

  // Nur aktive Linien speisen die Analyse; stillgelegte fallen heraus.
  const aktiveNamen = new Set(
    (verpackungen ?? [])
      .filter((zeile) => zeile.status !== "stillgelegt")
      .map((zeile) => zeile.bezeichnung as string)
  );

  const kontext = baueKontext(
    (ergebnisse ?? [])
      .filter((zeile) => aktiveNamen.has(zeile.produktlinie as string))
      .map((zeile) => zeile.rollen_set as RollenSet),
    profil.taetigkeiten,
    aktiveNamen
  );

  const statusNachNr = new Map<number, { status: Bearbeitungsstatus; notiz: string | null }>(
    (statusZeilen ?? []).map((zeile) => [
      zeile.anforderung_nr as number,
      {
        status: zeile.status as Bearbeitungsstatus,
        notiz: zeile.notiz as string | null,
      },
    ])
  );

  const zutreffend: ZutreffendeAnforderung[] = [];
  for (const anforderung of anforderungen) {
    if (anforderung.nr == null) continue;
    const grund = matchAnforderung(anforderung, kontext);
    if (!grund) continue;
    const gespeichert = statusNachNr.get(anforderung.nr);
    zutreffend.push({
      anforderung,
      grund,
      status: gespeichert?.status ?? "offen",
      notiz: gespeichert?.notiz ?? null,
    });
  }
  zutreffend.sort(sortiereNachDringlichkeit);

  const erledigt = zutreffend.filter((z) => z.status === "erledigt").length;
  const inBearbeitung = zutreffend.filter(
    (z) => z.status === "in_bearbeitung"
  ).length;
  const offene = zutreffend.filter((z) => z.status === "offen");
  const kritisch = offene.filter(
    (z) => z.anforderung.gilt_status === "in_kraft"
  ).length;

  return {
    kontext,
    zutreffend,
    zahlen: {
      gesamt: zutreffend.length,
      erledigt,
      inBearbeitung,
      offen: offene.length,
      kritisch,
      vormerkung: offene.length - kritisch,
    },
  };
}
