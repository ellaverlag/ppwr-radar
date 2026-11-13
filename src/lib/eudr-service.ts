import "server-only";

import { getTranslations } from "next-intl/server";
import { parseState } from "@/lib/onboarding";
import { ladeAppConfig } from "@/lib/rollen-service";
import {
  berechneUndSpeichereVerpackungsErgebnisse,
  ladeVerpackungsErgebnisse,
  type VerpackungErgebnisZeile,
  type VerpackungZeile,
} from "@/lib/verpackungen-service";
import { getAuslegungen } from "@/lib/wissensbasis";

/**
 * Lesepfad des EUDR-Strangs für die App (Detailseite, Dashboard):
 * Cattwyk-Hinweis (app_config „cattwyk_eudr_hinweis“, sonst Fallback aus
 * messages – Wortlaut im Nachprüfpaket E, Punkt 8) und die Menge der
 * ausspielbaren EUDR-Praxisfragen (getAuslegungen filtert live auf
 * freigegebene Datensätze, im Preview-Modus auch Entwürfe).
 */
export async function ladeEudrAnzeigeDaten(): Promise<{
  cattwykText: string;
  verfuegbarePraxisfragen: Set<string>;
}> {
  const t = await getTranslations("Eudr");
  const [hinweis, auslegungen] = await Promise.all([
    ladeAppConfig("cattwyk_eudr_hinweis").catch(() => null),
    getAuslegungen().catch(() => []),
  ]);
  return {
    cattwykText: hinweis ?? t("cattwykFallback"),
    verfuegbarePraxisfragen: new Set(
      auslegungen
        .filter((a) => a.kategorie === "eudr" && a.code)
        .map((a) => a.code as string)
    ),
  };
}

/**
 * Ergebnisse vor Engine v0.93 haben kein EUDR-Ergebnis. Fehlt es für eine
 * aktive Verpackung, läuft die Engine für das Profil einmal neu (derselbe
 * Pfad wie nach jedem Speichern) und die Ergebnisse werden neu geladen.
 */
export async function ergebnisseMitEudr(
  profilId: string,
  taetigkeiten: unknown,
  verpackungen: VerpackungZeile[],
  ergebnisse: Map<string, VerpackungErgebnisZeile>
): Promise<Map<string, VerpackungErgebnisZeile>> {
  const fehlt = verpackungen.some(
    (v) => v.status === "aktiv" && ergebnisse.has(v.id) && ergebnisse.get(v.id)!.eudr == null
  );
  if (!fehlt) return ergebnisse;
  try {
    await berechneUndSpeichereVerpackungsErgebnisse(profilId, parseState(taetigkeiten));
    return await ladeVerpackungsErgebnisse(verpackungen.map((v) => v.id));
  } catch (e) {
    console.error("EUDR-Nachberechnung fehlgeschlagen:", e instanceof Error ? e.message : e);
    return ergebnisse;
  }
}
