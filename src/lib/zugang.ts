import "server-only";

import { redirect } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/**
 * Zugangs-Gating („Vorzimmer“): Vollzugriff hat, wer ein aktives Abo besitzt
 * (subscriptions.status = 'active', gepflegt vom Stripe-Webhook) oder dessen
 * E-Mail in ADMIN_EMAILS (kommagetrennt) steht.
 */

export interface Zugang {
  user: User;
  freigeschaltet: boolean;
  grund: "admin" | "abo" | null;
  /** Für „Zahlung verwalten“ (Billing-Portal) */
  stripeCustomerId: string | null;
  laufzeitEnde: string | null;
}

export function istAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const liste = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
  return liste.includes(email.toLowerCase());
}

export async function pruefeZugang(): Promise<Zugang | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: abo } = await supabase
    .from("subscriptions")
    .select("status, laufzeit_ende, stripe_customer_id")
    .eq("user_id", user.id)
    .maybeSingle();

  const heute = new Date().toISOString().slice(0, 10);
  const aboAktiv =
    abo?.status === "active" &&
    (abo.laufzeit_ende == null || abo.laufzeit_ende >= heute);

  if (istAdmin(user.email)) {
    return {
      user,
      freigeschaltet: true,
      grund: "admin",
      stripeCustomerId: abo?.stripe_customer_id ?? null,
      laufzeitEnde: abo?.laufzeit_ende ?? null,
    };
  }

  return {
    user,
    freigeschaltet: aboAktiv,
    grund: aboAktiv ? "abo" : null,
    stripeCustomerId: abo?.stripe_customer_id ?? null,
    laufzeitEnde: abo?.laufzeit_ende ?? null,
  };
}

/**
 * Guard für geschützte Bereiche: leitet Nicht-Eingeloggte zum Login und
 * Nicht-Freigeschaltete ins Dashboard-Vorzimmer.
 */
export async function erforderePaket(): Promise<Zugang> {
  const zugang = await pruefeZugang();
  if (!zugang) redirect("/login");
  if (!zugang.freigeschaltet) redirect("/dashboard?gesperrt=1");
  return zugang;
}
