"use server";

import { redirect } from "next/navigation";
import { OPTION_KEYS, parseOptionen } from "@/lib/onboarding";
import { ladeWizardFragenOeffentlich } from "@/lib/rollen-service";
import {
  CHECK_FRAGE_IDS,
  leseCheckAntworten,
  schreibeCheckAntworten,
} from "./check-config";

export async function checkAntwortSpeichern(formData: FormData) {
  const frageId = String(formData.get("frage_id") ?? "");
  if (!CHECK_FRAGE_IDS.includes(frageId)) redirect("/check");

  const fragen = await ladeWizardFragenOeffentlich(CHECK_FRAGE_IDS);
  const frage = fragen.find((f) => f.frage_id === frageId);
  if (!frage) redirect("/check");

  const zielVariable = String(frage.ziel_variable).split(";")[0].trim();
  const optionKeys = OPTION_KEYS[frageId] ?? [];
  const gueltig = new Set(optionKeys.length ? optionKeys : parseOptionen(frage));

  const antworten = await leseCheckAntworten();

  if (frage.antwort_typ === "multi_select") {
    antworten[zielVariable] = formData
      .getAll("antwort")
      .map(String)
      .filter((w) => gueltig.has(w));
  } else {
    const wert = String(formData.get("antwort") ?? "");
    if (!gueltig.has(wert)) redirect("/check?fehler=antwort");
    antworten[zielVariable] = wert;
  }

  await schreibeCheckAntworten(antworten);

  const beantwortet = fragen.filter((f) => {
    const ziel = String(f.ziel_variable).split(";")[0].trim();
    return antworten[ziel] != null;
  });
  if (beantwortet.length >= fragen.length) {
    redirect("/check/ergebnis");
  }
  redirect("/check");
}

export async function checkNeuStarten() {
  await schreibeCheckAntworten({});
  redirect("/check");
}
