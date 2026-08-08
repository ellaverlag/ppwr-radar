import "server-only";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Rate-Limit und Frage-Kandidaten – beide Tabellen sind RLS-deny-all und
 * werden ausschließlich über den Service-Role-Client beschrieben.
 */

export const FRAGEN_PRO_STUNDE = 20;

function serviceClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * true, wenn der Nutzer im laufenden Stundenfenster noch fragen darf.
 * Ohne Service-Role-Key (lokale Sonderfälle) wird nicht blockiert –
 * der Zähler ist Schutz, kein Feature.
 */
export async function pruefeRateLimit(userId: string): Promise<boolean> {
  const client = serviceClient();
  if (!client) return true;

  const fensterStart = new Date(Date.now() - 60 * 60 * 1000).toISOString();
  const { count, error } = await client
    .from("assistant_nutzung")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .gte("gefragt_am", fensterStart);
  if (error) {
    console.error("Assistant: Rate-Limit-Prüfung fehlgeschlagen:", error.message);
    return true;
  }
  return (count ?? 0) < FRAGEN_PRO_STUNDE;
}

/** Eine gestellte Frage zählen (fire-and-forget im Fehlerfall). */
export async function zaehleFrage(userId: string): Promise<void> {
  const client = serviceClient();
  if (!client) return;
  const { error } = await client
    .from("assistant_nutzung")
    .insert({ user_id: userId });
  if (error) {
    console.error("Assistant: Nutzung nicht zählbar:", error.message);
  }
}

/**
 * Anonymisierter Frage-Vorschlag für die Redaktion: nur der Fragetext und
 * als Kontext Rollen/Verpackungstypen – keine Firmen- oder Personendaten.
 */
export async function speichereFrageKandidat(
  frageText: string,
  kontext: { rollen: string[]; verpackungstypen: string[] }
): Promise<boolean> {
  const client = serviceClient();
  if (!client) return false;
  const { error } = await client.from("frage_kandidaten").insert({
    frage_text: frageText,
    kontext,
    quelle: "assistant",
  });
  if (error) {
    console.error("Assistant: Frage-Kandidat nicht speicherbar:", error.message);
    return false;
  }
  return true;
}
