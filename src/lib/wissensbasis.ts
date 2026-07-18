import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isPreviewMode } from "@/lib/preview";

/**
 * Zentrale Datenzugriffs-Schicht für die Wissensbasis
 * (anforderungen, auslegungen, rollen_definitionen, wizard_fragen).
 *
 * Zentrale Regel: Standardmäßig werden nur freigegebene Inhalte gelesen
 * (review_status = 'cattwyk_freigegeben' AND ausspielen = true) – über den
 * Anon-Client. Nur wenn PREVIEW_MODE=true, wird stattdessen der
 * Service-Role-Client ohne diesen Filter verwendet, damit die Redaktion
 * ungeprüfte Inhalte in der App sehen kann.
 *
 * Abweichungen je Tabelle (Schema-bedingt):
 * - rollen_definitionen hat kein `ausspielen`, dafür `aktiv`
 * - wizard_fragen hat weder `review_status` noch `ausspielen` und wird
 *   daher immer ungefiltert gelesen
 */

// ---------------------------------------------------------------------------
// Typen
// ---------------------------------------------------------------------------

export type Kategorie =
  | "stoffrecht"
  | "mehrweg"
  | "konformitaet"
  | "kennzeichnung"
  | "rollen_epr"
  | "verbote"
  | "sonstiges";

export type GiltStatus =
  | "in_kraft"
  | "kuenftig"
  | "rechtsakt_ausstehend"
  | "entwurf_eu";

export type ReviewStatus =
  | "entwurf"
  | "redaktion_geprueft"
  | "cattwyk_freigegeben";

export type Verbindlichkeit =
  | "rechtsverbindlich"
  | "unverbindliche_auslegung";

export interface Anforderung {
  id: string;
  nr: number | null;
  titel: string;
  kategorie: Kategorie;
  rechtsquelle: string;
  rechtsquelle_link: string | null;
  verpackdg_quelle: string | null;
  gilt_ab: string | null;
  gilt_status: GiltStatus;
  betrifft_rollen: string[];
  betrifft_verpackungstypen: string[];
  betrifft_materialien: string[];
  lebensmittelkontakt: string;
  ausnahmen: string | null;
  uebergangsregeln: string | null;
  verweise: string[] | null;
  kurzerklaerung: string | null;
  erklaerung_fachlich: string | null;
  erklaerung_rechtstext: string | null;
  handlungsanweisung: string | null;
  risiko_bei_verstoss: string | null;
  audio_url: string | null;
  review_status: ReviewStatus;
  rechtsstand: string;
  version: number;
  ausspielen: boolean;
}

export interface Auslegung {
  id: string;
  nr: number | null;
  code: string | null;
  frage: string;
  antwort: string;
  kategorie: Kategorie;
  quellen: string[];
  verbindlichkeit: Verbindlichkeit;
  audio_url: string | null;
  review_status: ReviewStatus;
  rechtsstand: string;
  bezug_nr: number[] | null;
  ausspielen: boolean;
}

export interface RollenDefinition {
  rolle_id: string;
  typ: "kernrolle" | "sammelbegriff" | "hilfsbegriff";
  begriff_de: string;
  begriff_en: string | null;
  fundstelle_ppwr: string;
  definition_kurz: string;
  funktion_im_system: string | null;
  abgrenzung: string | null;
  verwechslungsfaelle: string | null;
  verpackdg_bezug: string | null;
  review_status: ReviewStatus;
  rechtsstand: string;
  aktiv: boolean;
}

export interface WizardFrage {
  frage_id: string;
  reihenfolge: number;
  ebene: "unternehmen" | "produktlinie";
  frage_text: string;
  antwort_typ: "single_select" | "multi_select" | "freitext_liste";
  antwort_optionen: string | null;
  ziel_variable: string;
  bedingung_anzeige: string | null;
  gespeiste_regeln: string | null;
  hinweis_ui: string | null;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const FREIGEGEBEN: ReviewStatus = "cattwyk_freigegeben";

function wissensbasisClient(): SupabaseClient {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = isPreviewMode()
    ? process.env.SUPABASE_SERVICE_ROLE_KEY!
    : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// ---------------------------------------------------------------------------
// Zugriffsfunktionen
// ---------------------------------------------------------------------------

export async function getAnforderungen(): Promise<Anforderung[]> {
  let query = wissensbasisClient()
    .from("anforderungen")
    .select("*")
    .order("nr", { ascending: true, nullsFirst: false });

  if (!isPreviewMode()) {
    query = query.eq("review_status", FREIGEGEBEN).eq("ausspielen", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Anforderungen konnten nicht geladen werden: ${error.message}`);
  }
  return (data ?? []) as Anforderung[];
}

export async function getAnforderung(id: string): Promise<Anforderung | null> {
  let query = wissensbasisClient().from("anforderungen").select("*").eq("id", id);

  if (!isPreviewMode()) {
    query = query.eq("review_status", FREIGEGEBEN).eq("ausspielen", true);
  }

  const { data, error } = await query.maybeSingle();
  if (error) {
    throw new Error(`Anforderung konnte nicht geladen werden: ${error.message}`);
  }
  return (data as Anforderung | null) ?? null;
}

export async function getAuslegungen(search?: string): Promise<Auslegung[]> {
  let query = wissensbasisClient()
    .from("auslegungen")
    .select("*")
    .order("nr", { ascending: true, nullsFirst: false });

  if (!isPreviewMode()) {
    query = query.eq("review_status", FREIGEGEBEN).eq("ausspielen", true);
  }

  const term = search?.trim();
  if (term) {
    // Einfache Volltextsuche über Frage und Antwort
    const pattern = `%${term.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
    query = query.or(`frage.ilike.${pattern},antwort.ilike.${pattern}`);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Auslegungen konnten nicht geladen werden: ${error.message}`);
  }
  return (data ?? []) as Auslegung[];
}

export async function getRollenDefinitionen(): Promise<RollenDefinition[]> {
  // Kein `ausspielen`-Feld in dieser Tabelle – Sichtbarkeit steuert `aktiv`.
  let query = wissensbasisClient()
    .from("rollen_definitionen")
    .select("*")
    .order("rolle_id", { ascending: true });

  if (!isPreviewMode()) {
    query = query.eq("review_status", FREIGEGEBEN).eq("aktiv", true);
  }

  const { data, error } = await query;
  if (error) {
    throw new Error(`Rollen-Definitionen konnten nicht geladen werden: ${error.message}`);
  }
  return (data ?? []) as RollenDefinition[];
}

export async function getWizardFragen(): Promise<WizardFrage[]> {
  // wizard_fragen hat keine review-/ausspielen-Spalten und wird immer
  // vollständig gelesen.
  const { data, error } = await wissensbasisClient()
    .from("wizard_fragen")
    .select("*")
    .order("reihenfolge", { ascending: true });

  if (error) {
    throw new Error(`Wizard-Fragen konnten nicht geladen werden: ${error.message}`);
  }
  return (data ?? []) as WizardFrage[];
}
