"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { SupabaseClient } from "@supabase/supabase-js";
import {
  leseAntwort,
  linieVollstaendig,
  parseState,
  type WizardState,
} from "@/lib/onboarding";
import {
  benenneLinienErgebnisseUm,
  loescheLinienErgebnisse,
  werteLinieAusUndSpeichere,
} from "@/lib/rollen-service";
import { createClient } from "@/lib/supabase/server";
import { getWizardFragen } from "@/lib/wissensbasis";
import { erforderePaket } from "@/lib/zugang";

/**
 * Server Actions der Produktlinien-Verwaltung. Der Mini-Wizard arbeitet auf
 * demselben Wizard-Zustand (profile.taetigkeiten) und derselben Engine wie
 * das Onboarding – nur fokussiert auf genau eine Linie.
 */

async function kontext() {
  const zugang = await erforderePaket();
  const supabase = await createClient();
  const { data: profil, error } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", zugang.user.id)
    .maybeSingle();
  if (error || !profil) redirect("/onboarding");
  const state = parseState(profil.taetigkeiten);
  return { zugang, supabase, profil, state };
}

async function stateSpeichern(
  supabase: SupabaseClient,
  profilId: string,
  state: WizardState
) {
  const { error } = await supabase
    .from("profile")
    .update({ taetigkeiten: state })
    .eq("id", profilId);
  if (error) throw new Error(`Fortschritt nicht speicherbar: ${error.message}`);
}

/** Schlüssel der Beschreibung im Linien-Zustand (kein Engine-Ziel-Variable). */
const BESCHREIBUNG_KEY = "_beschreibung";

/**
 * Kurzname + Beschreibung einer Linie speichern: legt eine neue Linie an
 * (ohne ?linie) oder benennt eine bestehende um – inkl. Nachziehen von
 * Verpackungsprofil und rollen_ergebnisse, damit die Namens-Verknüpfung
 * hält. Danach geht es in die Fragen des Mini-Wizards.
 */
export async function linieBenennen(formData: FormData) {
  const { supabase, profil, state } = await kontext();

  const linieRaw = formData.get("linie");
  const linie =
    linieRaw == null || linieRaw === "" ? null : Number(linieRaw);
  const fehlerUrl = (code: string) =>
    linie == null
      ? `/verpackungen/wizard?fehler=${code}`
      : `/verpackungen/wizard?linie=${linie}&fehler=${code}`;

  // Kurzname: Pflicht, knapp (Etikett für Listen und Dokumente)
  const name = String(formData.get("name") ?? "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 60);
  if (!name) redirect(fehlerUrl("name"));

  // Beschreibung: optional, bewusst ohne Limit (KI-Kontext)
  const beschreibung = String(formData.get("beschreibung") ?? "").trim();

  if (linie == null) {
    // ----- Neue Linie ----------------------------------------------------
    if (
      state.produktlinien.some((n) => n.toLowerCase() === name.toLowerCase())
    ) {
      redirect(fehlerUrl("doppelt"));
    }
    if (state.produktlinien.length >= 20) {
      redirect("/verpackungen?fehler=limit");
    }
    state.produktlinien.push(name);
    const key = String(state.produktlinien.length - 1);
    if (beschreibung) {
      state.linien[key] = {
        ...(state.linien[key] ?? {}),
        [BESCHREIBUNG_KEY]: beschreibung,
      };
    }
    await stateSpeichern(supabase, profil.id, state);
    redirect(`/verpackungen/wizard?linie=${state.produktlinien.length - 1}&s=0`);
  }

  // ----- Bestehende Linie ------------------------------------------------
  if (
    !Number.isInteger(linie) ||
    linie < 0 ||
    linie >= state.produktlinien.length
  ) {
    redirect("/verpackungen");
  }
  const alterName = state.produktlinien[linie];
  if (
    name.toLowerCase() !== alterName.toLowerCase() &&
    state.produktlinien.some(
      (n, i) => i !== linie && n.toLowerCase() === name.toLowerCase()
    )
  ) {
    redirect(fehlerUrl("doppelt"));
  }

  state.produktlinien[linie] = name;
  const key = String(linie);
  state.linien[key] = {
    ...(state.linien[key] ?? {}),
    [BESCHREIBUNG_KEY]: beschreibung,
  };
  await stateSpeichern(supabase, profil.id, state);

  // Verpackungsprofil (falls die Linie schon abgeschlossen wurde) nachziehen
  const { data: zeile } = await supabase
    .from("profil_verpackungen")
    .select("id")
    .eq("profil_id", profil.id)
    .eq("bezeichnung", alterName)
    .maybeSingle();
  if (zeile) {
    const { error } = await supabase
      .from("profil_verpackungen")
      .update({
        bezeichnung: name,
        produktlinie: name,
        zusatzangaben: beschreibung || null,
      })
      .eq("id", zeile.id);
    if (error) {
      throw new Error(`Verpackungsprofil nicht speicherbar: ${error.message}`);
    }
    if (name !== alterName) {
      try {
        await benenneLinienErgebnisseUm(profil.id, alterName, name);
      } catch (e) {
        console.error(
          "Ergebnis-Umbenennung fehlgeschlagen:",
          e instanceof Error ? e.message : e
        );
      }
    }
  }

  redirect(`/verpackungen/wizard?linie=${linie}&s=0`);
}

/** Antwort eines Mini-Wizard-Schritts speichern und weiterblättern. */
export async function linienAntwortSpeichern(formData: FormData) {
  const { supabase, profil, state } = await kontext();

  const linie = Number(formData.get("linie"));
  const schritt = Number(formData.get("schritt"));
  const frageId = String(formData.get("frage_id") ?? "");
  if (
    !Number.isInteger(linie) ||
    linie < 0 ||
    linie >= state.produktlinien.length
  ) {
    redirect("/verpackungen");
  }

  const fragen = await getWizardFragen();
  const frage = fragen.find((f) => f.frage_id === frageId);
  if (!frage) redirect(`/verpackungen/wizard?linie=${linie}`);

  const antwort = leseAntwort(frage, formData);
  if (antwort == null) {
    redirect(`/verpackungen/wizard?linie=${linie}&s=${schritt}&fehler=antwort`);
  }

  const zielVariable = frage.ziel_variable.split(";")[0].trim();
  const key = String(linie);
  state.linien[key] = { ...(state.linien[key] ?? {}), [zielVariable]: antwort };
  await stateSpeichern(supabase, profil.id, state);

  redirect(
    `/verpackungen/wizard?linie=${linie}&s=${Number.isInteger(schritt) ? schritt + 1 : 0}`
  );
}

/** Abschluss: Verpackungsprofil upserten, Engine für diese Linie, Update-Flags. */
export async function linieAbschliessen(formData: FormData) {
  const { supabase, profil, state } = await kontext();

  const linie = Number(formData.get("linie"));
  if (
    !Number.isInteger(linie) ||
    linie < 0 ||
    linie >= state.produktlinien.length
  ) {
    redirect("/verpackungen");
  }

  const fragen = await getWizardFragen();
  if (!linieVollstaendig(fragen, state, linie)) {
    redirect(`/verpackungen/wizard?linie=${linie}`);
  }

  const name = state.produktlinien[linie];
  const antworten = state.linien[String(linie)] ?? {};
  const arten = Array.isArray(antworten.verpackungsart)
    ? antworten.verpackungsart
    : [];
  const werte: {
    bezeichnung: string;
    produktlinie: string;
    verpackungstyp: string;
    lebensmittelkontakt: boolean;
    zusatzangaben?: string | null;
  } = {
    bezeichnung: name,
    produktlinie: name,
    verpackungstyp: arten.join(", ") || "unbestimmt",
    lebensmittelkontakt: antworten.lebensmittelkontakt === "ja",
  };
  // Beschreibung nur schreiben, wenn sie im Wizard erfasst wurde – sonst
  // bleibt ein direkt in der DB vorbelegter Freitext (Migration) erhalten.
  if (BESCHREIBUNG_KEY in antworten) {
    const beschreibung =
      typeof antworten[BESCHREIBUNG_KEY] === "string"
        ? (antworten[BESCHREIBUNG_KEY] as string).trim()
        : "";
    werte.zusatzangaben = beschreibung || null;
  }

  // Verpackungsprofil der Linie anlegen bzw. aktualisieren (Own-Row-RLS)
  const { data: vorhandene } = await supabase
    .from("profil_verpackungen")
    .select("id")
    .eq("profil_id", profil.id)
    .eq("bezeichnung", name)
    .maybeSingle();

  let verpackungId: string;
  if (vorhandene) {
    verpackungId = vorhandene.id as string;
    const { error } = await supabase
      .from("profil_verpackungen")
      .update(werte)
      .eq("id", verpackungId);
    if (error) {
      throw new Error(`Verpackungsprofil nicht speicherbar: ${error.message}`);
    }
  } else {
    const { data: neu, error } = await supabase
      .from("profil_verpackungen")
      .insert({ profil_id: profil.id, materialien: [], mehrweg: false, ...werte })
      .select("id")
      .single();
    if (error) {
      throw new Error(`Verpackungsprofil nicht anlegbar: ${error.message}`);
    }
    verpackungId = neu.id as string;
  }

  // Engine nur für diese Linie; altes Ergebnis wird als überholt markiert
  let vorherigeRollen: string[] | null = null;
  let neueRollen: string[] = [];
  try {
    const resultat = await werteLinieAusUndSpeichere(profil.id, state, linie);
    vorherigeRollen = resultat.vorherigeRollen;
    neueRollen = resultat.ergebnis.rollen_set.rollen;
  } catch (e) {
    console.error(
      "Rollen-Engine (Linie) fehlgeschlagen:",
      e instanceof Error ? e.message : e
    );
    redirect(`/verpackungen/wizard?linie=${linie}&fehler=engine`);
  }

  // Ändert sich das Rollen-Set, tragen bestehende Dokumente der Linie das
  // Update-Flag – rückwirkend verändert wird nichts.
  let updateFlagGesetzt = false;
  if (
    vorherigeRollen != null &&
    [...vorherigeRollen].sort().join(",") !== [...neueRollen].sort().join(",")
  ) {
    const { data: geflaggt, error } = await supabase
      .from("dokumente")
      .update({ status: "update_verfuegbar" })
      .eq("verpackung_id", verpackungId)
      .select("id");
    if (error) {
      console.error("Update-Flag nicht setzbar:", error.message);
    } else {
      updateFlagGesetzt = (geflaggt ?? []).length > 0;
    }
  }

  revalidatePath("/verpackungen");
  redirect(
    `/verpackungen/ergebnis?name=${encodeURIComponent(name)}${
      updateFlagGesetzt ? "&update=1" : ""
    }`
  );
}

/** Stilllegen: raus aus Generator-Auswahl und Status-Analyse, Rest bleibt. */
export async function linieStilllegen(formData: FormData) {
  await statusSetzen(formData, "stillgelegt");
}

export async function linieReaktivieren(formData: FormData) {
  await statusSetzen(formData, "aktiv");
}

async function statusSetzen(formData: FormData, status: "aktiv" | "stillgelegt") {
  const { supabase, profil } = await kontext();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/verpackungen");

  const { error } = await supabase
    .from("profil_verpackungen")
    .update({ status })
    .eq("id", id)
    .eq("profil_id", profil.id);
  if (error) {
    console.error("Status nicht setzbar:", error.message);
    redirect("/verpackungen?fehler=status");
  }
  revalidatePath("/verpackungen");
  redirect("/verpackungen");
}

/** Harte Löschung – nur für Linien ohne erzeugte Dokumente. */
export async function linieLoeschen(formData: FormData) {
  const { zugang, supabase, profil, state } = await kontext();
  const id = String(formData.get("id") ?? "");
  if (!id) redirect("/verpackungen");

  const { data: zeile } = await supabase
    .from("profil_verpackungen")
    .select("id, bezeichnung")
    .eq("id", id)
    .eq("profil_id", profil.id)
    .maybeSingle();
  if (!zeile) redirect("/verpackungen");

  const { count } = await supabase
    .from("dokumente")
    .select("id", { count: "exact", head: true })
    .eq("user_id", zugang.user.id)
    .eq("verpackung_id", id);
  if ((count ?? 0) > 0) {
    redirect("/verpackungen?fehler=dokumente");
  }

  const { error: delError } = await supabase
    .from("profil_verpackungen")
    .delete()
    .eq("id", id)
    .eq("profil_id", profil.id);
  if (delError) {
    console.error("Linie nicht löschbar:", delError.message);
    redirect("/verpackungen?fehler=loeschen");
  }

  // Linie aus dem Wizard-Zustand nehmen und Indizes nachziehen
  const name = zeile.bezeichnung as string;
  const index = state.produktlinien.findIndex((n) => n === name);
  if (index >= 0) {
    state.produktlinien.splice(index, 1);
    const neueLinien: WizardState["linien"] = {};
    for (const [key, antworten] of Object.entries(state.linien)) {
      const i = Number(key);
      if (i < index) neueLinien[key] = antworten;
      else if (i > index) neueLinien[String(i - 1)] = antworten;
    }
    state.linien = neueLinien;
    await stateSpeichern(supabase, profil.id, state);
  }

  try {
    await loescheLinienErgebnisse(profil.id, name);
  } catch (e) {
    console.error(
      "Rollen-Ergebnisse nicht löschbar:",
      e instanceof Error ? e.message : e
    );
  }

  revalidatePath("/verpackungen");
  redirect(`/verpackungen?geloescht=${encodeURIComponent(name)}`);
}

/**
 * Angefangene, nie abgeschlossene Linie (nur im Wizard-Zustand, ohne
 * Verpackungsprofil) wieder verwerfen.
 */
export async function linieVerwerfen(formData: FormData) {
  const { supabase, profil, state } = await kontext();
  const linie = Number(formData.get("linie"));
  if (
    !Number.isInteger(linie) ||
    linie < 0 ||
    linie >= state.produktlinien.length
  ) {
    redirect("/verpackungen");
  }

  const name = state.produktlinien[linie];
  const { data: zeile } = await supabase
    .from("profil_verpackungen")
    .select("id")
    .eq("profil_id", profil.id)
    .eq("bezeichnung", name)
    .maybeSingle();
  if (zeile) redirect("/verpackungen"); // abgeschlossene Linien: nur Löschen-Weg

  state.produktlinien.splice(linie, 1);
  const neueLinien: WizardState["linien"] = {};
  for (const [key, antworten] of Object.entries(state.linien)) {
    const i = Number(key);
    if (i < linie) neueLinien[key] = antworten;
    else if (i > linie) neueLinien[String(i - 1)] = antworten;
  }
  state.linien = neueLinien;
  await stateSpeichern(supabase, profil.id, state);

  revalidatePath("/verpackungen");
  redirect("/verpackungen");
}
