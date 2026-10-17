import "server-only";

import { createClient as createBareClient, type SupabaseClient } from "@supabase/supabase-js";
import type { WizardState } from "@/lib/onboarding";
import { isPreviewMode } from "@/lib/preview";
import {
  ENGINE_VERSION,
  evaluiereVerpackung,
  type HerleitungsEintrag,
  type PflichtEintrag,
  type VerpackungErgebnis,
  type VerpackungKontext,
} from "@/lib/rollen-engine";
import { ladeRegeln, linienAusState, unternehmenAusState } from "@/lib/rollen-service";
import { createClient as createSessionClient } from "@/lib/supabase/server";
import { AUSSPIELBARE_STATUS, type ReviewStatus } from "@/lib/wissensbasis";

/**
 * IO-Schicht der Verpackungs-Ebene (Migration 018): Verpackungen je
 * Produktlinie (Own-Row-RLS über den Session-Client), Engine-Ergebnisse je
 * Verpackung (Schreiben über den privilegierten Client wie rollen_ergebnisse)
 * und die redaktionellen „Ideen zur Vereinfachung“ (entlastungs_hinweise –
 * Lesepfad wie die Wissensbasis: live nur ausspielbare Status, im
 * Preview-Modus auch Entwürfe).
 */

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

export interface VerpackungZeile {
  id: string;
  profil_id: string;
  produktlinie_id: string;
  bezeichnung: string;
  art: VerpackungKontext["art"];
  form: VerpackungKontext["form"];
  bezug: VerpackungKontext["bezug"];
  lieferant_sitz: VerpackungKontext["lieferantSitz"];
  marke: VerpackungKontext["marke"];
  material: string | null;
  lebensmittelkontakt: boolean;
  mehrweg: boolean;
  status: "aktiv" | "stillgelegt";
}

export interface VerpackungErgebnisZeile {
  verpackung_id: string;
  rollen: string[];
  pflichten: PflichtEintrag[];
  hinweise: string[];
  herleitung: HerleitungsEintrag[];
  vorbehalt: boolean;
  engine_version: string;
  rechtsstand: string;
}

export interface EntlastungsHinweis {
  code: string;
  bedingung_key: string;
  titel: string;
  text: string;
  fundstellen: string[];
  verweis_auslegungen: string[];
  flag: string | null;
  review_status: ReviewStatus;
  rechtsstand: string;
}

export type VerpackungEingabe = Omit<
  VerpackungZeile,
  "id" | "profil_id" | "produktlinie_id" | "status"
>;

export const VERPACKUNG_ARTEN: VerpackungKontext["art"][] = [
  "verkauf",
  "um",
  "transport",
  "ecommerce",
  "service",
  "primaerproduktion",
];
export const VERPACKUNG_FORMEN: VerpackungKontext["form"][] = ["formstabil", "flexibel"];
export const VERPACKUNG_BEZUEGE: VerpackungKontext["bezug"][] = [
  "fertig_gekauft",
  "selbst_zusammengefuegt",
  "selbst_hergestellt",
  "lohnfertigung",
];
export const LIEFERANT_SITZE: NonNullable<VerpackungKontext["lieferantSitz"]>[] = [
  "DE",
  "EU",
  "drittland",
];
export const MARKEN: VerpackungKontext["marke"][] = ["eigene", "fremde", "keine"];

/** Lieferantensitz nur bei Fremdbezug (fertig gekauft, Lohnfertigung) sinnvoll. */
export function brauchtLieferantSitz(bezug: VerpackungKontext["bezug"]): boolean {
  return bezug === "fertig_gekauft" || bezug === "lohnfertigung";
}

export function zuKontext(zeile: VerpackungZeile): VerpackungKontext {
  return {
    bezeichnung: zeile.bezeichnung,
    art: zeile.art,
    form: zeile.form,
    bezug: zeile.bezug,
    lieferantSitz: brauchtLieferantSitz(zeile.bezug) ? zeile.lieferant_sitz : null,
    marke: zeile.marke,
    lebensmittelkontakt: zeile.lebensmittelkontakt,
    mehrweg: zeile.mehrweg,
  };
}

// ---------------------------------------------------------------------------
// Clients
// ---------------------------------------------------------------------------

function privilegierterClient(): SupabaseClient {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "Verpackungs-Ergebnisse können ohne SUPABASE_SERVICE_ROLE_KEY nicht gespeichert werden."
    );
  }
  return createBareClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Verpackungen (Own-Row-RLS)
// ---------------------------------------------------------------------------

const VERPACKUNG_SPALTEN =
  "id, profil_id, produktlinie_id, bezeichnung, art, form, bezug, lieferant_sitz, marke, material, lebensmittelkontakt, mehrweg, status";

export async function ladeVerpackungen(
  produktlinieId: string
): Promise<VerpackungZeile[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("verpackungen")
    .select(VERPACKUNG_SPALTEN)
    .eq("produktlinie_id", produktlinieId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`Verpackungen konnten nicht geladen werden: ${error.message}`);
  }
  return (data ?? []) as VerpackungZeile[];
}

/** Alle Verpackungen eines Profils (Dashboard, Generator). */
export async function ladeAlleVerpackungen(
  profilId: string
): Promise<VerpackungZeile[]> {
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("verpackungen")
    .select(VERPACKUNG_SPALTEN)
    .eq("profil_id", profilId)
    .order("created_at", { ascending: true });
  if (error) {
    throw new Error(`Verpackungen konnten nicht geladen werden: ${error.message}`);
  }
  return (data ?? []) as VerpackungZeile[];
}

export async function ladeVerpackung(id: string): Promise<VerpackungZeile | null> {
  const supabase = await createSessionClient();
  const { data } = await supabase
    .from("verpackungen")
    .select(VERPACKUNG_SPALTEN)
    .eq("id", id)
    .maybeSingle();
  return (data as VerpackungZeile | null) ?? null;
}

/** Anlegen (ohne id) oder Aktualisieren (mit id); liefert die Zeilen-ID. */
export async function speichereVerpackung(
  profilId: string,
  produktlinieId: string,
  eingabe: VerpackungEingabe,
  id?: string
): Promise<string> {
  const supabase = await createSessionClient();
  const werte = {
    ...eingabe,
    lieferant_sitz: brauchtLieferantSitz(eingabe.bezug) ? eingabe.lieferant_sitz : null,
    updated_at: new Date().toISOString(),
  };
  if (id) {
    const { error } = await supabase
      .from("verpackungen")
      .update(werte)
      .eq("id", id)
      .eq("profil_id", profilId);
    if (error) throw new Error(`Verpackung nicht speicherbar: ${error.message}`);
    return id;
  }
  const { data, error } = await supabase
    .from("verpackungen")
    .insert({ profil_id: profilId, produktlinie_id: produktlinieId, ...werte })
    .select("id")
    .single();
  if (error) throw new Error(`Verpackung nicht anlegbar: ${error.message}`);
  return data.id as string;
}

export async function setzeVerpackungStatus(
  profilId: string,
  id: string,
  status: "aktiv" | "stillgelegt"
): Promise<void> {
  const supabase = await createSessionClient();
  const { error } = await supabase
    .from("verpackungen")
    .update({ status, updated_at: new Date().toISOString() })
    .eq("id", id)
    .eq("profil_id", profilId);
  if (error) throw new Error(`Status nicht setzbar: ${error.message}`);
}

/** Stilllegen = Status 'stillgelegt' (bleibt einsehbar, fällt aus Zählungen). */
export async function stilllegen(profilId: string, id: string): Promise<void> {
  await setzeVerpackungStatus(profilId, id, "stillgelegt");
}

// ---------------------------------------------------------------------------
// Ergebnisse
// ---------------------------------------------------------------------------

export async function ladeVerpackungsErgebnisse(
  verpackungIds: string[]
): Promise<Map<string, VerpackungErgebnisZeile>> {
  const map = new Map<string, VerpackungErgebnisZeile>();
  if (verpackungIds.length === 0) return map;
  const supabase = await createSessionClient();
  const { data, error } = await supabase
    .from("verpackung_ergebnisse")
    .select(
      "verpackung_id, rollen, pflichten, hinweise, herleitung, vorbehalt, engine_version, rechtsstand"
    )
    .in("verpackung_id", verpackungIds)
    .eq("aktuell", true);
  if (error) {
    throw new Error(`Verpackungs-Ergebnisse nicht ladbar: ${error.message}`);
  }
  for (const zeile of (data ?? []) as VerpackungErgebnisZeile[]) {
    map.set(zeile.verpackung_id, zeile);
  }
  return map;
}

/**
 * Engine je aktiver Verpackung des Profils (optional nur eine Produktlinie):
 * alte Ergebnisse werden als überholt markiert (aktuell = false), neue
 * eingefügt – über den privilegierten Client (RLS erlaubt nur Lesen).
 * Läuft nach jedem Speichern einer Linie oder Verpackung.
 */
export async function berechneUndSpeichereVerpackungsErgebnisse(
  profilId: string,
  state: WizardState,
  nurProduktlinieId?: string
): Promise<VerpackungErgebnis[]> {
  const schreibClient = privilegierterClient();

  let linienQuery = schreibClient
    .from("profil_verpackungen")
    .select("id, bezeichnung")
    .eq("profil_id", profilId);
  if (nurProduktlinieId) linienQuery = linienQuery.eq("id", nurProduktlinieId);
  const { data: linienZeilen, error: linienFehler } = await linienQuery;
  if (linienFehler) {
    throw new Error(`Produktlinien nicht ladbar: ${linienFehler.message}`);
  }
  const linienIds = (linienZeilen ?? []).map((z) => z.id as string);
  if (linienIds.length === 0) return [];

  const { data: verpackungen, error: vFehler } = await schreibClient
    .from("verpackungen")
    .select(VERPACKUNG_SPALTEN)
    .eq("profil_id", profilId)
    .in("produktlinie_id", linienIds)
    .eq("status", "aktiv");
  if (vFehler) {
    throw new Error(`Verpackungen nicht ladbar: ${vFehler.message}`);
  }
  const zeilen = (verpackungen ?? []) as VerpackungZeile[];

  // Alte Ergebnisse der betroffenen Linien überholen (auch stillgelegte)
  const { data: alleIds } = await schreibClient
    .from("verpackungen")
    .select("id")
    .eq("profil_id", profilId)
    .in("produktlinie_id", linienIds);
  const betroffeneIds = (alleIds ?? []).map((z) => z.id as string);
  if (betroffeneIds.length > 0) {
    const { error: altFehler } = await schreibClient
      .from("verpackung_ergebnisse")
      .update({ aktuell: false })
      .in("verpackung_id", betroffeneIds)
      .eq("aktuell", true);
    if (altFehler) {
      throw new Error(`Alte Verpackungs-Ergebnisse nicht markierbar: ${altFehler.message}`);
    }
  }
  if (zeilen.length === 0) return [];

  const regeln = await ladeRegeln();
  if (regeln.length === 0) {
    throw new Error("Keine Rollen-Regeln verfügbar.");
  }
  const rechtsstand =
    regeln.map((r) => r.rechtsstand).filter(Boolean).sort().at(-1) ??
    new Date().toISOString().slice(0, 10);

  const unternehmen = unternehmenAusState(state);
  const linienKontexte = linienAusState(state);
  const nameNachLinieId = new Map(
    (linienZeilen ?? []).map((z) => [z.id as string, z.bezeichnung as string])
  );
  const anzahlJeLinie = new Map<string, number>();
  for (const z of zeilen) {
    anzahlJeLinie.set(z.produktlinie_id, (anzahlJeLinie.get(z.produktlinie_id) ?? 0) + 1);
  }

  const ergebnisse: { zeile: VerpackungZeile; ergebnis: VerpackungErgebnis }[] = [];
  for (const zeile of zeilen) {
    const name = nameNachLinieId.get(zeile.produktlinie_id);
    const linie = linienKontexte.find((l) => l.name === name);
    if (!linie) continue; // Linie ohne Wizard-Zustand: kein Kontext, kein Ergebnis
    ergebnisse.push({
      zeile,
      ergebnis: evaluiereVerpackung(
        regeln,
        unternehmen,
        linie,
        zuKontext(zeile),
        anzahlJeLinie.get(zeile.produktlinie_id) ?? 1
      ),
    });
  }
  if (ergebnisse.length === 0) return [];

  const { error: insFehler } = await schreibClient.from("verpackung_ergebnisse").insert(
    ergebnisse.map(({ zeile, ergebnis }) => ({
      verpackung_id: zeile.id,
      profil_id: profilId,
      rollen: ergebnis.rollen_set.rollen,
      pflichten: ergebnis.pflichten,
      hinweise: ergebnis.hinweisKeys,
      herleitung: ergebnis.herleitung,
      vorbehalt: ergebnis.rollen_set.vorbehalt,
      engine_version: ENGINE_VERSION,
      rechtsstand,
    }))
  );
  if (insFehler) {
    throw new Error(`Verpackungs-Ergebnisse nicht speicherbar: ${insFehler.message}`);
  }
  return ergebnisse.map((e) => e.ergebnis);
}

// ---------------------------------------------------------------------------
// Entlastungs-Hinweise (Wissensbasis-Lesepfad)
// ---------------------------------------------------------------------------

export async function ladeHinweise(keys: string[]): Promise<EntlastungsHinweis[]> {
  if (keys.length === 0) return [];
  const client = isPreviewMode()
    ? createBareClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.SUPABASE_SERVICE_ROLE_KEY!,
        { auth: { persistSession: false, autoRefreshToken: false } }
      )
    : await createSessionClient();
  let query = client
    .from("entlastungs_hinweise")
    .select(
      "code, bedingung_key, titel, text, fundstellen, verweis_auslegungen, flag, review_status, rechtsstand"
    )
    .in("bedingung_key", keys)
    .order("code", { ascending: true });
  if (!isPreviewMode()) {
    query = query.in("review_status", AUSSPIELBARE_STATUS).eq("ausspielen", true);
  }
  const { data, error } = await query;
  if (error) {
    throw new Error(`Entlastungs-Hinweise nicht ladbar: ${error.message}`);
  }
  return (data ?? []) as EntlastungsHinweis[];
}

// ---------------------------------------------------------------------------
// Übersicht (Dashboard)
// ---------------------------------------------------------------------------

export interface VerpackungsUebersicht {
  anzahl: number;
  mitKonformitaetserklaerung: number;
  mitLucid: number;
}

/** Zählung je Produktlinie (nur aktive Verpackungen, aktuelle Ergebnisse). */
export async function ladeVerpackungsUebersicht(
  profilId: string
): Promise<Map<string, VerpackungsUebersicht>> {
  const alle = (await ladeAlleVerpackungen(profilId)).filter(
    (z) => z.status === "aktiv"
  );
  const ergebnisse = await ladeVerpackungsErgebnisse(alle.map((z) => z.id));
  const map = new Map<string, VerpackungsUebersicht>();
  for (const z of alle) {
    const eintrag = map.get(z.produktlinie_id) ?? {
      anzahl: 0,
      mitKonformitaetserklaerung: 0,
      mitLucid: 0,
    };
    eintrag.anzahl += 1;
    const e = ergebnisse.get(z.id);
    if (e?.pflichten.some((p) => p.key === "konformitaetserklaerung" && p.gilt === "ja")) {
      eintrag.mitKonformitaetserklaerung += 1;
    }
    if (e?.pflichten.some((p) => p.key === "lucid_registrierung" && p.gilt === "ja")) {
      eintrag.mitLucid += 1;
    }
    map.set(z.produktlinie_id, eintrag);
  }
  return map;
}
