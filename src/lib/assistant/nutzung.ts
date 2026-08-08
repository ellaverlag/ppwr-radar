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
 * Jede beantwortete Frage automatisch in den Verlauf schreiben (Service
 * Role; Lesen läuft über own-row-RLS). Liefert die Zeilen-ID für Merken
 * und die Verlaufs-Ansicht – null, wenn nicht gespeichert werden konnte.
 */
export async function speichereVerlauf(eintrag: {
  profilId: string;
  frage: string;
  antwortMarkdown: string;
  erklaertiefe: string;
  quellen: unknown[];
  rechtsstand: string;
  preview: boolean;
  produktlinieKontext: string | null;
}): Promise<{ id: string; createdAt: string } | null> {
  const client = serviceClient();
  if (!client) return null;
  const { data, error } = await client
    .from("assistant_verlauf")
    .insert({
      profil_id: eintrag.profilId,
      frage: eintrag.frage,
      antwort_markdown: eintrag.antwortMarkdown,
      erklaertiefe: eintrag.erklaertiefe,
      quellen: eintrag.quellen,
      rechtsstand: eintrag.rechtsstand,
      preview: eintrag.preview,
      produktlinie_kontext: eintrag.produktlinieKontext,
    })
    .select("id, created_at")
    .single();
  if (error) {
    console.error("Assistant: Verlauf nicht speicherbar:", error.message);
    return null;
  }
  return { id: data.id as string, createdAt: data.created_at as string };
}

/**
 * Merken-Flag setzen – Service Role mit explizitem Eigentums-Filter
 * (profil_id), da die Tabelle bewusst keine Update-Policy hat.
 */
export async function setzeVerlaufGemerkt(
  profilId: string,
  verlaufId: string,
  gemerkt: boolean
): Promise<boolean> {
  const client = serviceClient();
  if (!client) return false;
  const { error } = await client
    .from("assistant_verlauf")
    .update({ gemerkt })
    .eq("id", verlaufId)
    .eq("profil_id", profilId);
  if (error) {
    console.error("Assistant: Merken nicht setzbar:", error.message);
    return false;
  }
  return true;
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
