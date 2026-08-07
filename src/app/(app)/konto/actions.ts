"use server";

import { redirect } from "next/navigation";
import { createClient as createBareClient } from "@supabase/supabase-js";
import { getStripe } from "@/lib/stripe";
import { createClient } from "@/lib/supabase/server";

/** Stammdaten aus dem Konto-Formular speichern (gleiche Felder wie der Wizard). */
export async function stammdatenSpeichern(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const feld = (name: string) => {
    const wert = String(formData.get(name) ?? "").trim();
    return wert === "" ? null : wert;
  };

  const firmenname = feld("firmenname");
  if (!firmenname) redirect("/konto?fehler=firmenname");

  const werte = {
    firmenname,
    strasse: feld("strasse"),
    hausnummer: feld("hausnummer"),
    plz: feld("plz"),
    ort: feld("ort"),
    land: feld("land") ?? "Deutschland",
    zeichnungsberechtigter_name: feld("zeichnungsberechtigter_name"),
    zeichnungsberechtigter_funktion: feld("zeichnungsberechtigter_funktion"),
    lucid_nummer: feld("lucid_nummer"),
    war_verpackg_registriert: formData.get("war_verpackg_registriert") === "ja",
  };

  const { data: profil } = await supabase
    .from("profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const { error } = profil
    ? await supabase.from("profile").update(werte).eq("id", profil.id)
    : await supabase.from("profile").insert({ user_id: user.id, ...werte });
  if (error) throw new Error(`Stammdaten nicht speicherbar: ${error.message}`);

  redirect("/konto?gespeichert=1");
}

/**
 * Konto endgültig löschen: bei aktivem Abo zuerst Stripe-Kündigung zum
 * Laufzeitende, dann profile (Kaskade auf Produktlinien/Ergebnisse),
 * subscriptions-Zeile, zuletzt der Auth-User über die Admin-API.
 */
export async function kontoLoeschen(formData: FormData) {
  if (String(formData.get("bestaetigung") ?? "").trim() !== "LÖSCHEN") {
    redirect("/konto?fehler=bestaetigung");
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    console.error("Konto-Löschung ohne SUPABASE_SERVICE_ROLE_KEY nicht möglich.");
    redirect("/konto?fehler=loeschung");
  }
  const service = createBareClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );

  // 1. Aktives Abo zum Laufzeitende kündigen – scheitert Stripe, wird NICHT
  //    gelöscht (sonst liefe die Zahlung weiter).
  const { data: abo } = await supabase
    .from("subscriptions")
    .select("status, stripe_subscription_id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (abo?.status === "active" && abo.stripe_subscription_id) {
    try {
      await getStripe().subscriptions.update(abo.stripe_subscription_id, {
        cancel_at_period_end: true,
      });
    } catch (e) {
      console.error(
        "Stripe-Kündigung fehlgeschlagen:",
        e instanceof Error ? e.message : e
      );
      redirect("/konto?fehler=stripe");
    }
  }

  // 2. Profil (Kaskade: profil_verpackungen, rollen_ergebnisse) + Abo-Zeile
  const { error: profilFehler } = await supabase
    .from("profile")
    .delete()
    .eq("user_id", user.id);
  if (profilFehler) {
    console.error("Profil-Löschung fehlgeschlagen:", profilFehler.message);
    redirect("/konto?fehler=loeschung");
  }
  const { error: aboFehler } = await service
    .from("subscriptions")
    .delete()
    .eq("user_id", user.id);
  if (aboFehler) {
    console.error("Abo-Zeile nicht löschbar:", aboFehler.message);
  }

  // 3. Auth-User zuletzt (Admin-API, Service Role)
  const { error: userFehler } = await service.auth.admin.deleteUser(user.id);
  if (userFehler) {
    console.error("Auth-User nicht löschbar:", userFehler.message);
    redirect("/konto?fehler=loeschung");
  }

  try {
    await supabase.auth.signOut();
  } catch {
    // Session ist mit dem gelöschten User ohnehin ungültig
  }

  redirect("/?abschied=1");
}
