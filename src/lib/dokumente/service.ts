import "server-only";

import { createClient as createBareClient } from "@supabase/supabase-js";
import { erzeugeDocx, erzeugePdf } from "@/lib/dokumente/konvertierung";
import {
  baueFelder,
  type ProfilZeile,
  type RollenErgebnisZeile,
  type VerpackungZeile,
} from "@/lib/dokumente/felder";
import {
  dokumentKoerper,
  hinweisBlock,
  rendereTemplate,
} from "@/lib/dokumente/renderer";
import { isPreviewMode } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";

/**
 * Dokumenten-Generator (Säule B): lädt Templates ausschließlich aus
 * generator_templates (Single Source of Law – live nur freigegeben+aktiv
 * via RLS, im Preview-Modus auch Entwürfe via Service-Role), rendert,
 * erzeugt .docx und PDF und legt beide im privaten Storage-Bucket ab.
 *
 * Storage-Zugriff läuft komplett über die Service-Role: Der Bucket
 * `dokumente` hat bewusst keine Object-Policies (deny all); Ownership wird
 * über die dokumente-Tabelle (Own-Row-RLS) plus User-Pfadpräfix erzwungen
 * und Downloads laufen über kurzlebige signierte URLs.
 */

export const TEMPLATE_TYPEN = {
  konformitaetserklaerung: { dbTyp: "konformitaetserklaerung", kuerzel: "KE" },
  techdoku: { dbTyp: "doku_geruest", kuerzel: "TD" },
  pflichtenuebersicht: { dbTyp: "pflichtenuebersicht", kuerzel: "PU" },
  lieferantenanfragen: { dbTyp: "lieferantenanfrage", kuerzel: "LA" },
} as const;
export type TemplateKey = keyof typeof TEMPLATE_TYPEN;

export interface GeneratorTemplate {
  key: TemplateKey;
  version: string;
  inhalt: string;
  rechtsstand: string;
  review_status: string;
}

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ist nicht gesetzt.");
  return createBareClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Live: Session-Client (RLS = freigegeben+aktiv); Preview: auch Entwürfe. */
export async function ladeTemplate(
  key: TemplateKey
): Promise<GeneratorTemplate | null> {
  const client = isPreviewMode() ? serviceClient() : await createClient();
  let query = client
    .from("generator_templates")
    .select("key, version, inhalt, rechtsstand, review_status")
    .eq("key", key)
    .eq("aktiv", true)
    .order("version", { ascending: false })
    .limit(1);
  if (!isPreviewMode()) {
    // RLS filtert ohnehin – explizit für Lesbarkeit
    query = query.eq("review_status", "cattwyk_freigegeben");
  }
  const { data } = await query.maybeSingle();
  return (data as GeneratorTemplate | null) ?? null;
}

export async function ladeVerfuegbareTemplates(): Promise<
  Partial<Record<TemplateKey, GeneratorTemplate>>
> {
  const ergebnis: Partial<Record<TemplateKey, GeneratorTemplate>> = {};
  for (const key of Object.keys(TEMPLATE_TYPEN) as TemplateKey[]) {
    const template = await ladeTemplate(key);
    if (template) ergebnis[key] = template;
  }
  return ergebnis;
}

// ---------------------------------------------------------------------------
// Erzeugung + Ablage
// ---------------------------------------------------------------------------

async function naechsteDocNummer(
  userId: string,
  key: TemplateKey
): Promise<string> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("dokumente")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("typ", TEMPLATE_TYPEN[key].dbTyp);
  const jahr = new Date().getFullYear();
  return `${TEMPLATE_TYPEN[key].kuerzel}-${jahr}-${String((count ?? 0) + 1).padStart(4, "0")}`;
}

export interface VorschauDaten {
  markdown: string;
  hinweis: string | null;
  docNummer: string;
  templateVersion: string;
  templateRechtsstand: string;
  reviewStatus: string;
}

export async function ladeDatenFuerDokument(
  userId: string,
  key: TemplateKey,
  verpackungId: string
): Promise<{
  profil: ProfilZeile & { id: string };
  verpackung: VerpackungZeile;
  rollenErgebnis: RollenErgebnisZeile | null;
  template: GeneratorTemplate;
  cattwykHinweis: string | null;
} | null> {
  const supabase = await createClient();
  const template = await ladeTemplate(key);
  if (!template) return null;

  const { data: profil } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profil) return null;

  const { data: verpackung } = await supabase
    .from("profil_verpackungen")
    .select("*")
    .eq("id", verpackungId)
    .eq("profil_id", profil.id)
    .maybeSingle();
  if (!verpackung) return null;

  const { data: ergebnis } = await supabase
    .from("rollen_ergebnisse")
    .select("produktlinie, rollen_set, herleitung")
    .eq("profil_id", profil.id)
    .eq("produktlinie", verpackung.produktlinie ?? verpackung.bezeichnung)
    .maybeSingle();

  const { data: config } = await supabase
    .from("app_config")
    .select("value")
    .eq("key", "cattwyk_erstgespraech_hinweis")
    .maybeSingle();

  return {
    profil: profil as ProfilZeile & { id: string },
    verpackung: verpackung as VerpackungZeile,
    rollenErgebnis: (ergebnis as RollenErgebnisZeile | null) ?? null,
    template,
    cattwykHinweis: (config?.value as string | undefined) ?? null,
  };
}

export async function rendereVorschau(
  userId: string,
  key: TemplateKey,
  verpackungId: string
): Promise<VorschauDaten | null> {
  const daten = await ladeDatenFuerDokument(userId, key, verpackungId);
  if (!daten) return null;
  const docNummer = `${TEMPLATE_TYPEN[key].kuerzel}-${new Date().getFullYear()}-XXXX`;
  const felder = baueFelder({
    profil: daten.profil,
    verpackung: daten.verpackung,
    rollenErgebnis: daten.rollenErgebnis,
    docNummer: `${docNummer} (wird bei Erstellung vergeben)`,
    templateVersion: daten.template.version,
    templateRechtsstand: daten.template.rechtsstand,
    cattwykHinweis: daten.cattwykHinweis,
  });
  const { text } = rendereTemplate(daten.template.inhalt, felder);
  return {
    markdown: text,
    hinweis: hinweisBlock(text),
    docNummer,
    templateVersion: daten.template.version,
    templateRechtsstand: daten.template.rechtsstand,
    reviewStatus: daten.template.review_status,
  };
}

export async function erzeugeUndSpeichereDokument(
  userId: string,
  key: TemplateKey,
  verpackungId: string
): Promise<{ docNummer: string }> {
  const daten = await ladeDatenFuerDokument(userId, key, verpackungId);
  if (!daten) throw new Error("Vorlage oder Verpackung nicht verfügbar.");

  const docNummer = await naechsteDocNummer(userId, key);
  const felder = baueFelder({
    profil: daten.profil,
    verpackung: daten.verpackung,
    rollenErgebnis: daten.rollenErgebnis,
    docNummer,
    templateVersion: daten.template.version,
    templateRechtsstand: daten.template.rechtsstand,
    cattwykHinweis: daten.cattwykHinweis,
  });
  const { text } = rendereTemplate(daten.template.inhalt, felder);
  const koerper = dokumentKoerper(text);

  const [docx, pdf] = await Promise.all([
    erzeugeDocx(koerper),
    erzeugePdf(koerper),
  ]);

  const service = serviceClient();
  const basisPfad = `${userId}/${docNummer}`;
  const uploads = [
    service.storage.from("dokumente").upload(`${basisPfad}.docx`, docx, {
      contentType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      upsert: true,
    }),
    service.storage.from("dokumente").upload(`${basisPfad}.pdf`, pdf, {
      contentType: "application/pdf",
      upsert: true,
    }),
  ];
  for (const { error } of await Promise.all(uploads)) {
    if (error) throw new Error(`Storage-Upload fehlgeschlagen: ${error.message}`);
  }

  const supabase = await createClient();
  const { error: insertFehler } = await supabase.from("dokumente").insert({
    user_id: userId,
    verpackung_id: verpackungId,
    typ: TEMPLATE_TYPEN[key].dbTyp,
    doc_nummer: docNummer,
    storage_path: basisPfad,
    rechtsstand_bei_erstellung: daten.template.rechtsstand,
    version: 1,
  });
  if (insertFehler) {
    throw new Error(`Dokument-Metadaten nicht speicherbar: ${insertFehler.message}`);
  }

  return { docNummer };
}

/** Kurzlebige Download-URL – Ownership wurde zuvor über RLS geprüft. */
export async function signierteUrl(
  storagePath: string,
  format: "docx" | "pdf"
): Promise<string | null> {
  const service = serviceClient();
  const { data, error } = await service.storage
    .from("dokumente")
    .createSignedUrl(`${storagePath}.${format}`, 60);
  if (error) return null;
  return data.signedUrl;
}
