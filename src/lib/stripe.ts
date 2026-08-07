import "server-only";

import Stripe from "stripe";

/**
 * Stripe-Client (Live-Modus). Keine explizite apiVersion: Das SDK pinnt
 * automatisch die aktuelle Version seines Releases (22.x → 2026-07-29).
 * Lazy initialisiert, damit Builds ohne STRIPE_SECRET_KEY nicht scheitern.
 */
let client: Stripe | null = null;

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY ist nicht gesetzt.");
  }
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}
