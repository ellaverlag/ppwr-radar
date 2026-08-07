"use server";

import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { redirect } from "next/navigation";
import { createClient as createBareClient } from "@supabase/supabase-js";
import { RendererFehler } from "@/lib/dokumente/renderer";
import {
  erzeugeUndSpeichereDokument,
  TEMPLATE_TYPEN,
  type TemplateKey,
} from "@/lib/dokumente/service";
import { erforderePaket, istAdmin } from "@/lib/zugang";

export async function dokumentErstellen(formData: FormData) {
  const zugang = await erforderePaket();
  const key = String(formData.get("typ") ?? "") as TemplateKey;
  const verpackungId = String(formData.get("verpackung") ?? "");
  if (!(key in TEMPLATE_TYPEN) || !verpackungId) redirect("/dokumente/neu");

  let docNummer: string | null = null;
  try {
    ({ docNummer } = await erzeugeUndSpeichereDokument(
      zugang.user.id,
      key,
      verpackungId
    ));
  } catch (e) {
    if (e instanceof RendererFehler) {
      redirect(
        `/dokumente/neu?typ=${key}&verpackung=${verpackungId}&fehler=render&detail=${encodeURIComponent(e.fehlend.join(", "))}`
      );
    }
    console.error(
      "Dokument-Erzeugung fehlgeschlagen:",
      e instanceof Error ? e.message : e
    );
    redirect(`/dokumente/neu?typ=${key}&verpackung=${verpackungId}&fehler=erzeugung`);
  }

  redirect(`/dokumente?erstellt=${encodeURIComponent(docNummer!)}`);
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
