"use server";

import { redirect } from "next/navigation";
import {
  istEudrCheckFrage,
  istGueltigeAntwort,
  istVollstaendig,
  leseEudrCheck,
  schreibeEudrCheck,
} from "./check-eudr-config";

export async function eudrCheckAntwortSpeichern(formData: FormData) {
  const frage = String(formData.get("frage") ?? "");
  if (!istEudrCheckFrage(frage)) redirect("/check-eudr");
  const wert = String(formData.get("antwort") ?? "");
  if (!istGueltigeAntwort(frage, wert)) redirect("/check-eudr?fehler=antwort");

  const antworten = await leseEudrCheck();
  antworten[frage] = wert;
  await schreibeEudrCheck(antworten);

  if (istVollstaendig(antworten)) redirect("/check-eudr/ergebnis");
  redirect("/check-eudr");
}

export async function eudrCheckNeuStarten() {
  await schreibeEudrCheck({});
  redirect("/check-eudr");
}
