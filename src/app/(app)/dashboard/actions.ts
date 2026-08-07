"use server";

import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { basisUrl } from "@/lib/site-url";
import { pruefeZugang } from "@/lib/zugang";

/** Checkout für das PPWR|ready-Paket: 290 €/Jahr + 200 € Launch-Zusatz. */
export async function checkoutStarten() {
  const zugang = await pruefeZugang();
  if (!zugang) redirect("/login");
  if (zugang.freigeschaltet && zugang.grund === "abo") redirect("/dashboard");

  const preisJahr = process.env.STRIPE_PRICE_JAHR;
  const preisLaunch = process.env.STRIPE_PRICE_LAUNCH_ZUSATZ;
  if (!preisJahr || !preisLaunch) {
    console.error("Stripe-Preis-IDs fehlen (STRIPE_PRICE_JAHR/_LAUNCH_ZUSATZ).");
    redirect("/dashboard?checkout=fehler");
  }

  const basis = await basisUrl();
  let url: string | null = null;
  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [
        { price: preisJahr, quantity: 1 },
        { price: preisLaunch, quantity: 1 },
      ],
      // User-ID für die Webhook-Zuordnung – robuster als E-Mail-Abgleich
      client_reference_id: zugang.user.id,
      // Bestandskunde am Customer festmachen, sonst E-Mail vorbefüllen
      ...(zugang.stripeCustomerId
        ? { customer: zugang.stripeCustomerId }
        : { customer_email: zugang.user.email }),
      subscription_data: {
        billing_mode: { type: "flexible" },
      },
      // Hinweis: statement_descriptor_suffix unterstützt Stripe nur im
      // mode=payment (payment_intent_data) – im Subscription-Modus steuert
      // das die Rechnungs-/Kontoeinstellung im Stripe-Dashboard.
      success_url: `${basis}/onboarding?willkommen=1`,
      cancel_url: `${basis}/dashboard`,
      locale: "de",
    });
    url = session.url;
  } catch (e) {
    console.error(
      "Checkout-Session fehlgeschlagen:",
      e instanceof Error ? e.message : e
    );
  }

  if (!url) redirect("/dashboard?checkout=fehler");
  redirect(url);
}

/** Billing-Portal („Zahlung verwalten“) – Rückkehr-URL ist im Portal konfiguriert. */
export async function zahlungVerwalten() {
  const zugang = await pruefeZugang();
  if (!zugang) redirect("/login");
  if (!zugang.stripeCustomerId) redirect("/dashboard");

  let url: string | null = null;
  try {
    const stripe = getStripe();
    const session = await stripe.billingPortal.sessions.create({
      customer: zugang.stripeCustomerId,
    });
    url = session.url;
  } catch (e) {
    console.error(
      "Billing-Portal-Session fehlgeschlagen:",
      e instanceof Error ? e.message : e
    );
  }

  if (!url) redirect("/dashboard?checkout=fehler");
  redirect(url);
}
