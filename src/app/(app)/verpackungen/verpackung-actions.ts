"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { parseState } from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import {
  berechneUndSpeichereVerpackungsErgebnisse,
  brauchtLieferantSitz,
  LIEFERANT_SITZE,
  MARKEN,
  setzeVerpackungStatus,
  speichereVerpackung,
  VERPACKUNG_ARTEN,
  VERPACKUNG_BEZUEGE,
  VERPACKUNG_FORMEN,
  type VerpackungEingabe,
} from "@/lib/verpackungen-service";
import { erforderePaket } from "@/lib/zugang";

/**
 * Server Actions der Verpackungs-Ebene: Verpackungen einer Produktlinie
 * anlegen, bearbeiten, stilllegen. Nach jedem Speichern läuft die Engine
 * für die Verpackungen dieser Linie neu.
 */

const MAX_JE_LINIE = 30;

async function kontext(produktlinieId: string) {
  const zugang = await erforderePaket();
  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profile")
    .select("id, taetigkeiten")
    .eq("user_id", zugang.user.id)
    .maybeSingle();
  if (!profil) redirect("/onboarding");

  // Produktlinie muss dem Profil gehören (Own-Row-RLS filtert ohnehin)
  const { data: linie } = await supabase
    .from("profil_verpackungen")
    .select("id")
    .eq("id", produktlinieId)
    .eq("profil_id", profil.id)
    .maybeSingle();
  if (!linie) redirect("/verpackungen");

  return { supabase, profil, state: parseState(profil.taetigkeiten) };
}

function enthaelt<T extends string>(liste: readonly T[], wert: string): wert is T {
  return (liste as readonly string[]).includes(wert);
}

export async function verpackungSpeichern(formData: FormData) {
  const produktlinieId = String(formData.get("produktlinie") ?? "");
  if (!produktlinieId) redirect("/verpackungen");
  const { supabase, profil, state } = await kontext(produktlinieId);

  const id = String(formData.get("id") ?? "") || undefined;
  const basis = `/verpackungen/${produktlinieId}`;
  const fehlerUrl = (code: string) =>
    `${basis}?${id ? `bearbeiten=${id}&` : ""}fehler=${code}#formular`;

  const bezeichnung = String(formData.get("bezeichnung") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 80);
  if (!bezeichnung) redirect(fehlerUrl("bezeichnung"));

  const art = String(formData.get("art") ?? "");
  const form = String(formData.get("form") ?? "");
  const bezug = String(formData.get("bezug") ?? "");
  const marke = String(formData.get("marke") ?? "");
  if (
    !enthaelt(VERPACKUNG_ARTEN, art) ||
    !enthaelt(VERPACKUNG_FORMEN, form) ||
    !enthaelt(VERPACKUNG_BEZUEGE, bezug) ||
    !enthaelt(MARKEN, marke)
  ) {
    redirect(fehlerUrl("auswahl"));
  }

  const lieferantRoh = String(formData.get("lieferant_sitz") ?? "");
  let lieferantSitz: VerpackungEingabe["lieferant_sitz"] = null;
  if (brauchtLieferantSitz(bezug)) {
    if (!enthaelt(LIEFERANT_SITZE, lieferantRoh)) redirect(fehlerUrl("lieferant"));
    lieferantSitz = lieferantRoh;
  }

  if (!id) {
    const { count } = await supabase
      .from("verpackungen")
      .select("id", { count: "exact", head: true })
      .eq("produktlinie_id", produktlinieId);
    if ((count ?? 0) >= MAX_JE_LINIE) redirect(fehlerUrl("limit"));
  }

  const eingabe: VerpackungEingabe = {
    bezeichnung,
    art,
    form,
    bezug,
    lieferant_sitz: lieferantSitz,
    marke,
    material: String(formData.get("material") ?? "").trim().slice(0, 120) || null,
    lebensmittelkontakt: formData.get("lebensmittelkontakt") === "ja",
    mehrweg: formData.get("mehrweg") === "ja",
  };

  let gespeicherteId: string;
  try {
    gespeicherteId = await speichereVerpackung(profil.id, produktlinieId, eingabe, id);
  } catch (e) {
    console.error("Verpackung nicht speicherbar:", e instanceof Error ? e.message : e);
    redirect(fehlerUrl("speichern"));
  }

  try {
    await berechneUndSpeichereVerpackungsErgebnisse(profil.id, state, produktlinieId);
  } catch (e) {
    console.error("Verpackungs-Engine fehlgeschlagen:", e instanceof Error ? e.message : e);
  }

  revalidatePath(basis);
  revalidatePath("/verpackungen");
  revalidatePath("/dashboard");
  redirect(`${basis}?gespeichert=${encodeURIComponent(bezeichnung)}#v-${gespeicherteId}`);
}

/** Referenz „<produktlinieId>|<verpackungId>“ (ein Hidden-Feld für BestaetigenButton). */
async function statusSetzen(formData: FormData, status: "aktiv" | "stillgelegt") {
  const [produktlinieId = "", id = ""] = String(formData.get("ref") ?? "").split("|");
  if (!produktlinieId || !id) redirect("/verpackungen");
  const { profil, state } = await kontext(produktlinieId);

  try {
    await setzeVerpackungStatus(profil.id, id, status);
    await berechneUndSpeichereVerpackungsErgebnisse(profil.id, state, produktlinieId);
  } catch (e) {
    console.error("Verpackungs-Status:", e instanceof Error ? e.message : e);
    redirect(`/verpackungen/${produktlinieId}?fehler=speichern`);
  }
  revalidatePath(`/verpackungen/${produktlinieId}`);
  revalidatePath("/dashboard");
  redirect(`/verpackungen/${produktlinieId}`);
}

export async function verpackungStilllegen(formData: FormData) {
  await statusSetzen(formData, "stillgelegt");
}

export async function verpackungReaktivieren(formData: FormData) {
  await statusSetzen(formData, "aktiv");
}
