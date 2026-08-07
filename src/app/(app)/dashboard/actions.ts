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
      // B2B-Rechnungsdaten: Rechnungsadresse Pflicht, USt-ID-Feld für
      // Firmen, Steuerberechnung über Stripe Tax. Der validierte Firmenname
      // aus der USt-ID wird von Stripe am Customer hinterlegt; zusätzlich
      // ein optionales Freitextfeld für den Rechnungs-Firmennamen.
      billing_address_collection: "required",
      tax_id_collection: { enabled: true },
      automatic_tax: { enabled: true },
      custom_fields: [
        {
          key: "firma",
          label: { type: "custom", custom: "Firmenname (für die Rechnung)" },
          type: "text",
          optional: true,
        },
      ],
      // Bestandskunde am Customer festmachen (customer_update ist Pflicht,
      // wenn tax_id_collection mit Bestands-Customer läuft), sonst E-Mail
      // vorbefüllen
      ...(zugang.stripeCustomerId
        ? {
            customer: zugang.stripeCustomerId,
            customer_update: { address: "auto" as const, name: "auto" as const },
          }
        : { customer_email: zugang.user.email }),
      // Abo-Rechnungen entstehen im Subscription-Modus automatisch je
      // Periode (invoice_creation ist hier weder nötig noch erlaubt); ob
      // Stripe die Rechnung auch per Mail verschickt, steuert die
      // Konto-Einstellung „Customer emails“ im Stripe-Dashboard.
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
