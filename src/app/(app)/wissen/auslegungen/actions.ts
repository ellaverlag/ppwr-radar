"use server";

import { createClient as createBareClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Aufruf-Zähler der Praxisfragen: beim Aufklappen einer Frage wird
 * auslegungen.aufrufe atomar erhöht (DB-Funktion, nur service_role) –
 * fire-and-forget, ohne Personenbezug. Basis für die spätere Umstellung
 * der Einstiegs-Karten auf die echten Top-3.
 */
export async function zaehleAuslegungAufruf(id: string): Promise<void> {
  try {
    if (!/^[0-9a-f-]{36}$/i.test(id)) return;

    // Nur eingeloggte Nutzer zählen – schützt den Zähler vor anonymem Rauschen
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!key) return;
    const service = createBareClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      key,
      { auth: { persistSession: false, autoRefreshToken: false } }
    );
    await service.rpc("zaehle_auslegung_aufruf", { p_id: id });
  } catch {
    // fire-and-forget: ein verlorener Zähl-Klick ist folgenlos
  }
}
