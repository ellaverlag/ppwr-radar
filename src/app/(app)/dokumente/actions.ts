"use server";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { redirect } from "next/navigation";
import { createClient as createBareClient } from "@supabase/supabase-js";
import { revalidatePath } from "next/cache";
import {
  NUTZER_FELDER,
  type NutzerEingaben,
} from "@/lib/dokumente/nutzer-felder";
import { RendererFehler } from "@/lib/dokumente/renderer";
import {
  erzeugeUndSpeichereDokument,
  loescheDokument,
  TEMPLATE_TYPEN,
  type TemplateKey,
} from "@/lib/dokumente/service";
import { erforderePaket, istAdmin } from "@/lib/zugang";

/** f_<key>-Felder des Ausfüll-Schritts aus dem Formular lesen. */
function leseEingaben(formData: FormData, key: TemplateKey): NutzerEingaben {
  const eingaben: NutzerEingaben = {};
  for (const feld of NUTZER_FELDER[key]) {
    const wert = formData.get(`f_${feld.key}`);
    if (typeof wert === "string" && wert.trim()) {
      eingaben[feld.key] = wert.trim();
    }
  }
  return eingaben;
}

function neuUrl(
  key: TemplateKey,
  verpackungId: string,
  dokumentId: string | null,
  eingaben: NutzerEingaben,
  extra = ""
): string {
  const params = new URLSearchParams({ typ: key, verpackung: verpackungId });
  if (dokumentId) params.set("dokument", dokumentId);
  for (const [feldKey, wert] of Object.entries(eingaben)) {
    params.set(`f_${feldKey}`, wert);
  }
  return `/dokumente/neu?${params.toString()}${extra}`;
}

export async function dokumentErstellen(formData: FormData) {
  const zugang = await erforderePaket();
  const key = String(formData.get("typ") ?? "") as TemplateKey;
  const verpackungId = String(formData.get("verpackung") ?? "");
  const dokumentId = String(formData.get("dokument") ?? "") || null;
  if (!(key in TEMPLATE_TYPEN) || !verpackungId) redirect("/dokumente/neu");
  const eingaben = leseEingaben(formData, key);

  let docNummer: string | null = null;
  let version = 1;
  try {
    ({ docNummer, version } = await erzeugeUndSpeichereDokument(
      zugang.user.id,
      key,
      verpackungId,
      eingaben,
      dokumentId ?? undefined
    ));
  } catch (e) {
    if (e instanceof RendererFehler) {
      redirect(
        neuUrl(key, verpackungId, dokumentId, eingaben,
          `&fehler=render&detail=${encodeURIComponent(e.fehlend.join(", "))}`)
      );
    }
    console.error(
      "Dokument-Erzeugung fehlgeschlagen:",
      e instanceof Error ? e.message : e
    );
    redirect(neuUrl(key, verpackungId, dokumentId, eingaben, "&fehler=erzeugung"));
  }

  redirect(
    dokumentId
      ? `/dokumente?aktualisiert=${encodeURIComponent(docNummer!)}&version=${version}`
      : `/dokumente?erstellt=${encodeURIComponent(docNummer!)}`
  );
}

/** Ausfüll-Schritt: Eingaben in die URL übernehmen und Vorschau neu rendern. */
export async function vorschauAktualisieren(formData: FormData) {
  await erforderePaket();
  const key = String(formData.get("typ") ?? "") as TemplateKey;
  const verpackungId = String(formData.get("verpackung") ?? "");
  const dokumentId = String(formData.get("dokument") ?? "") || null;
  if (!(key in TEMPLATE_TYPEN) || !verpackungId) redirect("/dokumente/neu");
  redirect(neuUrl(key, verpackungId, dokumentId, leseEingaben(formData, key)));
}

export async function dokumentLoeschen(formData: FormData) {
  const zugang = await erforderePaket();
  const dokumentId = String(formData.get("id") ?? "");
  if (!dokumentId) redirect("/dokumente");

  let docNummer: string | null = null;
  try {
    ({ docNummer } = await loescheDokument(zugang.user.id, dokumentId));
  } catch (e) {
    console.error("Dokument-Löschung fehlgeschlagen:", e instanceof Error ? e.message : e);
    redirect("/dokumente?fehler=loeschen");
  }
  revalidatePath("/dokumente");
  redirect(`/dokumente?geloescht=${encodeURIComponent(docNummer ?? "")}`);
}

/**
 * Einmaliger Template-Import aus content/templates/ – Admin-Bypass-Konten
 * vorbehalten (das CLI-Pendant ist scripts/import-templates.mjs).
 */
const IMPORT_DATEIEN: Record<TemplateKey, string> = {
  konformitaetserklaerung: "Template_1_EU-Konformitaetserklaerung_v0_1.md",
  techdoku: "Template_2_Technische-Dokumentation_Geruest_v0_1.md",
  pflichtenuebersicht: "Template_3_Pflichtenuebersicht_Produktlinie_v0_1.md",
  lieferantenanfragen: "Template_4_Lieferantenanfragen_v0_1.md",
};

export async function templatesImportieren() {
  const zugang = await erforderePaket();
  if (!istAdmin(zugang.user.email)) redirect("/dokumente/neu");

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) redirect("/dokumente/neu?fehler=erzeugung");
  const service = createBareClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  for (const [key, datei] of Object.entries(IMPORT_DATEIEN)) {
    const inhalt = readFileSync(
      resolve(process.cwd(), "content/templates", datei),
      "utf8"
    );
    const { error } = await service.from("generator_templates").upsert(
      {
        key,
        version: "v0.1",
        inhalt,
        review_status: "entwurf",
        rechtsstand: "2026-07-17",
        aktiv: true,
      },
      { onConflict: "key,version" }
    );
    if (error) {
      console.error(`Template-Import ${key}:`, error.message);
      redirect("/dokumente/neu?fehler=erzeugung");
    }
  }

  redirect("/dokumente/neu?importiert=1");
}
