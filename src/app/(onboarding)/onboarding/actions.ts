"use server";

import { redirect } from "next/navigation";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import {
  OPTION_KEYS,
  parseOptionen,
  parseState,
  type WizardState,
} from "@/lib/onboarding";
import { werteAusUndSpeichere } from "@/lib/rollen-service";
import { createClient } from "@/lib/supabase/server";
import { getWizardFragen } from "@/lib/wissensbasis";

async function profilLaden(supabase: SupabaseClient, user: User) {
  const { data: profil, error } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  if (error) throw new Error(`Profil nicht lesbar: ${error.message}`);
  if (profil) return profil;

  const { data: neu, error: insError } = await supabase
    .from("profile")
    .insert({ user_id: user.id })
    .select("*")
    .single();
  if (insError) throw new Error(`Profil nicht anlegbar: ${insError.message}`);
  return neu;
}

async function kontext() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const profil = await profilLaden(supabase, user);
  const state = parseState(profil.taetigkeiten);
  return { supabase, user, profil, state };
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

/** Antwort eines Frage-Schritts speichern und zum nächsten Schritt gehen. */
export async function antwortSpeichern(formData: FormData) {
  const frageId = String(formData.get("frage_id") ?? "");
  const linieRaw = formData.get("linie");
  const linie = linieRaw == null || linieRaw === "" ? null : Number(linieRaw);

  const { supabase, profil, state } = await kontext();
  const fragen = await getWizardFragen();
  const frage = fragen.find((f) => f.frage_id === frageId);
  if (!frage) redirect("/onboarding");

  if (frage.frage_id === "F04") {
    const roh = String(formData.get("produktlinien") ?? "");
    const linien = [
      ...new Set(
        roh
          .split("\n")
          .map((z) => z.trim())
          .filter(Boolean)
      ),
    ].slice(0, 20);
    if (linien.length === 0) {
      redirect("/onboarding?fehler=produktlinien");
    }
    state.produktlinien = linien;
    // Antworten für weggefallene Linien entfernen
    for (const key of Object.keys(state.linien)) {
      if (Number(key) >= linien.length) delete state.linien[key];
    }
  } else {
    const zielVariable = frage.ziel_variable.split(";")[0].trim();
    const optionKeys = OPTION_KEYS[frage.frage_id] ?? [];
    const gueltig = new Set(optionKeys.length ? optionKeys : parseOptionen(frage));

    let antwort: string | string[];
    if (frage.antwort_typ === "multi_select") {
      antwort = formData
        .getAll("antwort")
        .map(String)
        .filter((w) => gueltig.has(w));
    } else {
      const wert = String(formData.get("antwort") ?? "");
      if (!gueltig.has(wert)) {
        redirect(`/onboarding?fehler=antwort`);
      }
      antwort = wert;
    }

    if (frage.ebene === "unternehmen") {
      state.unternehmen[zielVariable] = antwort;
    } else {
      const key = String(linie ?? 0);
      state.linien[key] = { ...(state.linien[key] ?? {}), [zielVariable]: antwort };
    }
  }

  await stateSpeichern(supabase, profil.id, state);
  redirect("/onboarding");
}

/** Stammdaten-Schritt speichern. */
export async function stammdatenSpeichern(formData: FormData) {
  const { supabase, profil, state } = await kontext();

  const feld = (name: string) => {
    const wert = String(formData.get(name) ?? "").trim();
    return wert === "" ? null : wert;
  };

  const firmenname = feld("firmenname");
  if (!firmenname) redirect("/onboarding?fehler=firmenname");

  const { error } = await supabase
    .from("profile")
    .update({
      firmenname,
      strasse: feld("strasse"),
      hausnummer: feld("hausnummer"),
      plz: feld("plz"),
      ort: feld("ort"),
      land: feld("land") ?? "Deutschland",
      sitz: (state.unternehmen.sitz as string) ?? null,
      zeichnungsberechtigter_name: feld("zeichnungsberechtigter_name"),
      zeichnungsberechtigter_funktion: feld("zeichnungsberechtigter_funktion"),
      lucid_nummer: feld("lucid_nummer"),
      war_verpackg_registriert: formData.get("war_verpackg_registriert") === "ja",
    })
    .eq("id", profil.id);
  if (error) throw new Error(`Stammdaten nicht speicherbar: ${error.message}`);

  state.stammdaten_ok = true;
  await stateSpeichern(supabase, profil.id, state);
  redirect("/onboarding");
}

/** Abschluss: Verpackungsprofile schreiben, Engine laufen lassen, fertig. */
export async function onboardingAbschliessen() {
  const { supabase, profil, state } = await kontext();

  if (state.produktlinien.length === 0 || !state.stammdaten_ok) {
    redirect("/onboarding");
  }

  // Verpackungsprofile je Produktlinie neu anlegen (Own-Row-RLS)
  const { error: delError } = await supabase
    .from("profil_verpackungen")
    .delete()
    .eq("profil_id", profil.id);
  if (delError) {
    throw new Error(`Verpackungsprofile nicht ersetzbar: ${delError.message}`);
  }

  const zeilen = state.produktlinien.map((name, index) => {
    const antworten = state.linien[String(index)] ?? {};
    const arten = Array.isArray(antworten.verpackungsart)
      ? antworten.verpackungsart
      : [];
    return {
      profil_id: profil.id,
      bezeichnung: name,
      produktlinie: name,
      verpackungstyp: arten.join(", ") || "unbestimmt",
      materialien: [] as string[],
      lebensmittelkontakt: antworten.lebensmittelkontakt === "ja",
      mehrweg: false,
    };
  });
  const { error: insError } = await supabase
    .from("profil_verpackungen")
    .insert(zeilen);
  if (insError) {
    throw new Error(`Verpackungsprofile nicht speicherbar: ${insError.message}`);
  }

  let engineFehler: string | null = null;
  try {
    await werteAusUndSpeichere(profil.id, state);
  } catch (e) {
    engineFehler = e instanceof Error ? e.message : "Unbekannter Fehler";
    console.error("Rollen-Engine fehlgeschlagen:", engineFehler);
  }
  if (engineFehler) {
    redirect("/onboarding?fehler=engine");
  }

  // Abgeleitete Profilfelder + Abschluss-Flag
  const alleWege = new Set<string>();
  let grenzueberschreitend = false;
  state.produktlinien.forEach((_, index) => {
    const wege = state.linien[String(index)]?.vertriebsweg;
    (Array.isArray(wege) ? wege : []).forEach((w) => alleWege.add(w));
  });
  if (
    alleWege.has("online_endkunden_EU") ||
    (state.unternehmen.sitz !== "DE" && alleWege.has("online_endkunden_DE"))
  ) {
    grenzueberschreitend = true;
  }

  const { error: updError } = await supabase
    .from("profile")
    .update({
      onboarding_abgeschlossen: true,
      vertriebswege: [...alleWege],
      grenzueberschreitender_direktvertrieb: grenzueberschreitend,
      maerkte: state.unternehmen.sitz === "DE" ? ["DE"] : ["DE", "EU"],
    })
    .eq("id", profil.id);
  if (updError) {
    throw new Error(`Profil-Abschluss nicht speicherbar: ${updError.message}`);
  }

  redirect("/onboarding/ergebnis");
}
