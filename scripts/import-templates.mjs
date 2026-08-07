#!/usr/bin/env node
/**
 * Einmaliger Template-Import: liest die vier Generator-Master aus
 * content/templates/ und schreibt sie via Service-Role in
 * generator_templates (Upsert auf key+version).
 *
 *   npm run import:templates
 *
 * Erwartet NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY in der
 * Umgebung oder in .env.local.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const TEMPLATES = [
  { key: "konformitaetserklaerung", datei: "Template_1_EU-Konformitaetserklaerung_v0_1.md" },
  { key: "techdoku", datei: "Template_2_Technische-Dokumentation_Geruest_v0_1.md" },
  { key: "pflichtenuebersicht", datei: "Template_3_Pflichtenuebersicht_Produktlinie_v0_1.md" },
  { key: "lieferantenanfragen", datei: "Template_4_Lieferantenanfragen_v0_1.md" },
];
const VERSION = "v0.1";
const RECHTSSTAND = "2026-07-17";

function ladeEnv() {
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      for (const zeile of readFileSync(resolve(".env.local"), "utf8").split("\n")) {
        const m = zeile.match(/^([A-Z0-9_]+)=(.*)$/);
        if (m && !process.env[m[1]]) process.env[m[1]] = m[2].trim();
      }
    } catch {
      /* keine .env.local */
    }
  }
}

ladeEnv();
const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("NEXT_PUBLIC_SUPABASE_URL und SUPABASE_SERVICE_ROLE_KEY werden benötigt.");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

for (const { key: templateKey, datei } of TEMPLATES) {
  const inhalt = readFileSync(resolve("content/templates", datei), "utf8");
  const { error } = await supabase.from("generator_templates").upsert(
    {
      key: templateKey,
      version: VERSION,
      inhalt,
      review_status: "entwurf",
      rechtsstand: RECHTSSTAND,
      aktiv: true,
    },
    { onConflict: "key,version" }
  );
  if (error) {
    console.error(`✗ ${templateKey}: ${error.message}`);
    process.exit(1);
  }
  console.log(`✓ ${templateKey} (${inhalt.length} Zeichen, ${VERSION}, ${RECHTSSTAND})`);
}
console.log("Import abgeschlossen.");
