"use server";

import { redirect } from "next/navigation";
import { createClient as createBareClient } from "@supabase/supabase-js";

/**
 * Coming-Soon: E-Mail für die Start-Benachrichtigung vormerken.
 * Schreibt über die Service-Role in launch_interessenten (Tabelle hat
 * bewusst keine anon-Policies); Duplikate sind stillschweigend okay.
 */
export async function interesseEintragen(formData: FormData) {
  const email = String(formData.get("email") ?? "")
    .trim()
    .toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
    redirect("/?vormerken=fehler#vormerken");
  }

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("Vormerken: SUPABASE_SERVICE_ROLE_KEY fehlt.");
    redirect("/?vormerken=fehler#vormerken");
  }
  const service = createBareClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  const { error } = await service
    .from("launch_interessenten")
    .upsert({ email }, { onConflict: "email", ignoreDuplicates: true });
  if (error) {
    console.error("Vormerken fehlgeschlagen:", error.message);
    redirect("/?vormerken=fehler#vormerken");
  }

  redirect("/?vormerken=ok#vormerken");
}
