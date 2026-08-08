import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { isPreviewMode } from "@/lib/preview";
import { createClient as createSessionClient } from "@/lib/supabase/server";

/**
 * Zentrale Datenzugriffs-Schicht für die Wissensbasis
 * (anforderungen, auslegungen, rollen_definitionen, wizard_fragen).
 *
 * Zentrale Regel: Standardmäßig werden nur freigegebene Inhalte gelesen
 * (review_status = 'cattwyk_freigegeben' AND ausspielen = true) – über den
 * Session-Client des eingeloggten Nutzers; die RLS-Policies erlauben
 * Lesen ausschließlich für `authenticated` und erzwingen denselben Filter
 * serverseitig. Nur wenn PREVIEW_MODE=true, wird stattdessen der
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
  /**
   * In der Live-DB jsonb: je nach Import ein String ODER ein Objekt
   * {text: "…"}. NIE direkt rendern – immer über tatbestandText() lesen,
   * sonst crasht React am Objekt-Child (äußerte sich als „404“ auf der
   * Anforderungs-Detailseite, weil der Fehler ins gestreamte HTML fiel).
   */
  tatbestand: string | { text?: string } | null;
  rechtsfolgen_je_rolle: Record<string, string> | null;
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
  kurztitel: string | null;
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
  alt_bedeutung_verpackg: string | null;
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

/** Tatbestand als Anzeigetext – normalisiert String- und {text}-Form. */
export function tatbestandText(
  tatbestand: Anforderung["tatbestand"]
): string | null {
  if (typeof tatbestand === "string") return tatbestand.trim() || null;
  if (
    tatbestand &&
    typeof tatbestand === "object" &&
    typeof tatbestand.text === "string"
  ) {
    return tatbestand.text.trim() || null;
  }
  return null;
}

// ---------------------------------------------------------------------------
// Client
// ---------------------------------------------------------------------------

const FREIGEGEBEN: ReviewStatus = "cattwyk_freigegeben";

async function wissensbasisClient(): Promise<SupabaseClient> {
  if (isPreviewMode()) {
    return createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
  }

  // Session-Client des eingeloggten Nutzers – nur so greifen die
  // RLS-Policies für `authenticated` (anon darf nichts lesen).
  return createSessionClient();
}

// ---------------------------------------------------------------------------
// Zugriffsfunktionen
// ---------------------------------------------------------------------------

export async function getAnforderungen(): Promise<Anforderung[]> {
  const client = await wissensbasisClient();
  let query = client
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

/**
 * Detail-Lookup per UUID oder Nummer. Numerische Referenzen (aus Verweisen
 * wie „#12“) lösen über anforderungen.nr auf – eine Nummer, die es nicht
 * gibt, liefert null (→ 404), eine gültige führt immer zur Detailseite.
 */
export async function getAnforderung(ref: string): Promise<Anforderung | null> {
  const client = await wissensbasisClient();
  const alsNr = /^\d{1,4}$/.test(ref) ? Number(ref) : null;
  let query = client.from("anforderungen").select("*");
  query = alsNr != null ? query.eq("nr", alsNr) : query.eq("id", ref);

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
  const client = await wissensbasisClient();
  let query = client
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
  const client = await wissensbasisClient();
  let query = client
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

// ---------------------------------------------------------------------------
// Suche für den Assistant (RAG-Retrieval)
// ---------------------------------------------------------------------------

export interface SuchTreffer {
  typ: "anforderung" | "auslegung" | "rolle";
  /** UUID bei anforderungen/auslegungen, rolle_id bei Rollen. */
  ref: string;
  rang: number;
}

/**
 * Postgres-Volltextsuche (websearch_to_tsquery, Konfiguration german) über
 * anforderungen, auslegungen und rollen_definitionen. Die DB-Funktion läuft
 * als SECURITY INVOKER: über den Session-Client greifen die RLS-Policies
 * (nur Freigegebenes), im PREVIEW_MODE sieht der Service-Role-Client alles –
 * derselbe Datenpfad wie bei den Gettern oben.
 */
export async function sucheWissensbasis(
  query: string,
  limit = 8
): Promise<SuchTreffer[]> {
  const client = await wissensbasisClient();
  const { data, error } = await client.rpc("assistant_suche", {
    p_query: query,
    p_limit: limit,
  });
  if (error) {
    throw new Error(`Wissensbasis-Suche fehlgeschlagen: ${error.message}`);
  }
  return ((data ?? []) as { typ: string; ref: string; rang: number }[]).map(
    (t) => ({ typ: t.typ as SuchTreffer["typ"], ref: t.ref, rang: t.rang })
  );
}

/**
 * ilike-Fallback über Titel/Frage/Begriff, wenn die Volltextsuche leer
 * ausgeht (z. B. Tippfehler oder zu spezifische Formulierung). Gleiche
 * Freigabe-Filter wie die Getter; Treffer ohne Ranking in Tabellenordnung.
 */
export async function sucheWissensbasisIlike(
  begriffe: string[],
  limitJeTabelle = 4
): Promise<SuchTreffer[]> {
  const terme = begriffe
    .map((b) => b.trim())
    .filter((b) => b.length >= 3)
    .slice(0, 5)
    .map((b) => `%${b.replaceAll("%", "\\%").replaceAll("_", "\\_")}%`);
  if (terme.length === 0) return [];

  const client = await wissensbasisClient();
  const freigabe = !isPreviewMode();

  let anfQuery = client.from("anforderungen").select("id");
  if (freigabe) {
    anfQuery = anfQuery.eq("review_status", FREIGEGEBEN).eq("ausspielen", true);
  }
  let ausQuery = client.from("auslegungen").select("id");
  if (freigabe) {
    ausQuery = ausQuery.eq("review_status", FREIGEGEBEN).eq("ausspielen", true);
  }
  let rolQuery = client.from("rollen_definitionen").select("rolle_id");
  if (freigabe) {
    rolQuery = rolQuery.eq("review_status", FREIGEGEBEN).eq("aktiv", true);
  }

  const [anf, aus, rol] = await Promise.all([
    anfQuery
      .or(terme.map((t) => `titel.ilike.${t}`).join(","))
      .limit(limitJeTabelle),
    ausQuery
      .or(
        terme
          .flatMap((t) => [`frage.ilike.${t}`, `kurztitel.ilike.${t}`])
          .join(",")
      )
      .limit(limitJeTabelle),
    rolQuery
      .or(terme.map((t) => `begriff_de.ilike.${t}`).join(","))
      .limit(limitJeTabelle),
  ]);

  return [
    ...(anf.data ?? []).map((z) => ({
      typ: "anforderung" as const,
      ref: z.id as string,
      rang: 0,
    })),
    ...(aus.data ?? []).map((z) => ({
      typ: "auslegung" as const,
      ref: z.id as string,
      rang: 0,
    })),
    ...(rol.data ?? []).map((z) => ({
      typ: "rolle" as const,
      ref: z.rolle_id as string,
      rang: 0,
    })),
  ];
}

export async function getWizardFragen(): Promise<WizardFrage[]> {
  // wizard_fragen hat keine review-/ausspielen-Spalten und wird immer
  // vollständig gelesen.
  const client = await wissensbasisClient();
  const { data, error } = await client
    .from("wizard_fragen")
    .select("*")
    .order("reihenfolge", { ascending: true });

  if (error) {
    throw new Error(`Wizard-Fragen konnten nicht geladen werden: ${error.message}`);
  }
  return (data ?? []) as WizardFrage[];
}
