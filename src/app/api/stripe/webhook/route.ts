import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe";

/**
 * Stripe-Webhook: hält die Tabelle subscriptions synchron.
 * Schreibzugriff läuft über den Service-Role-Client (RLS erlaubt Nutzern
 * nur das Lesen der eigenen Zeile).
 */

function serviceClient() {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) throw new Error("SUPABASE_SERVICE_ROLE_KEY ist nicht gesetzt.");
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/** Periodenende: bei flexible billing liegt es auf dem Subscription-Item. */
function laufzeitEnde(sub: Stripe.Subscription): string | null {
  const unix =
    sub.items?.data?.[0]?.current_period_end ??
    (sub as unknown as { current_period_end?: number }).current_period_end;
  if (!unix) return null;
  return new Date(unix * 1000).toISOString().slice(0, 10);
}

function statusAus(sub: Stripe.Subscription): "active" | "inactive" {
  // Kündigung zum Laufzeitende: Status bleibt bis Periodenende "active";
  // erst customer.subscription.deleted setzt inaktiv.
  return sub.status === "active" || sub.status === "trialing"
    ? "active"
    : "inactive";
}

export async function POST(request: Request) {
  const signatur = request.headers.get("stripe-signature");
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!signatur || !secret) {
    return NextResponse.json({ error: "Signatur fehlt" }, { status: 400 });
  }

  const body = await request.text();
  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signatur, secret);
  } catch (e) {
    console.error(
      "Stripe-Signaturprüfung fehlgeschlagen:",
      e instanceof Error ? e.message : e
    );
    return NextResponse.json({ error: "Ungültige Signatur" }, { status: 400 });
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const supabase = serviceClient();
        const session = event.data.object;
        const userId = session.client_reference_id;
        if (!userId) {
          console.error("checkout.session.completed ohne client_reference_id");
          break;
        }
        const subscriptionId =
          typeof session.subscription === "string"
            ? session.subscription
            : session.subscription?.id ?? null;
        let ende: string | null = null;
        if (subscriptionId) {
          const sub = await getStripe().subscriptions.retrieve(subscriptionId);
          ende = laufzeitEnde(sub);
        }
        const { error } = await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            status: "active",
            paket: "ppwr_ready",
            stripe_customer_id:
              typeof session.customer === "string"
                ? session.customer
                : session.customer?.id ?? null,
            stripe_subscription_id: subscriptionId,
            laufzeit_ende: ende,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" }
        );
        if (error) throw new Error(error.message);
        break;
      }

      case "customer.subscription.updated":
      case "customer.subscription.deleted": {
        const supabase = serviceClient();
        const sub = event.data.object;
        const status =
          event.type === "customer.subscription.deleted"
            ? "inactive"
            : statusAus(sub);
        const { error } = await supabase
          .from("subscriptions")
          .update({
            status,
            laufzeit_ende: laufzeitEnde(sub),
            updated_at: new Date().toISOString(),
          })
          .eq("stripe_subscription_id", sub.id);
        if (error) throw new Error(error.message);
        break;
      }

      default:
        // Nicht relevante Ereignisse bestätigen, damit Stripe nicht retried
        break;
    }
  } catch (e) {
    console.error(
      "Webhook-Verarbeitung fehlgeschlagen:",
      e instanceof Error ? e.message : e
    );
    return NextResponse.json({ error: "Verarbeitung fehlgeschlagen" }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
