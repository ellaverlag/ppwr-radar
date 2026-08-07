import "server-only";

import { ladeBegriffsLemmata } from "@/lib/glossar";
import { getRollenDefinitionen } from "@/lib/wissensbasis";

/**
 * Erklärhilfen je Antwort-Option der Wizard-Fragen: Die STRUKTUR (welche
 * Option welchen Begriff erklärt) liegt hier, die TEXTE kommen aus der
 * Datenbank (glossar_lemmata typ=begriff bzw. rollen_definitionen).
 * Optionen ohne Zuordnung bleiben ohne Zweitzeile – nachpflegbar über neue
 * Lemmata. Genutzt vom Onboarding UND vom Mini-Wizard der Produktlinien-
 * Verwaltung (gleiche Fragen, gleiche Hilfen).
 */
const ERKLAERUNGS_QUELLEN: Record<
  string,
  Record<string, { art: "lemma"; code: string } | { art: "rolle"; id: string }>
> = {
  F05: {
    verkauf: { art: "lemma", code: "L52" },
    um: { art: "lemma", code: "L53" },
    transport: { art: "lemma", code: "L54" },
    service: { art: "lemma", code: "L51" },
    ecommerce: { art: "lemma", code: "L61" },
    primaerproduktion: { art: "lemma", code: "L62" },
  },
  F06: {
    herstellen_lassen: { art: "lemma", code: "L48" },
    kauft_verpackte_ware: { art: "rolle", id: "vertreiber" },
    importiert_drittland: { art: "rolle", id: "importeur" },
    liefert_an_endabnehmer: { art: "rolle", id: "hb_endabnehmer" },
    lagert_und_versendet_fuer_dritte: {
      art: "rolle",
      id: "fulfillment_dienstleister",
    },
    liefert_verpackungen_oder_material: { art: "rolle", id: "lieferant" },
    stellt_verpackung_physisch_her: { art: "lemma", code: "L63" },
    befuellt_versiegelt: { art: "lemma", code: "L64" },
    packt_aus: { art: "lemma", code: "L65" },
  },
  F07: {
    eigene: { art: "lemma", code: "L66" },
    fremde: { art: "lemma", code: "L48" },
    keine: { art: "lemma", code: "L67" },
  },
};

function kuerzeErklaerung(text: string, max = 180): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const geschnitten = t.slice(0, max);
  return `${geschnitten.slice(0, geschnitten.lastIndexOf(" "))} …`;
}

export async function ladeErklaerungen(
  frageId: string
): Promise<Record<string, string>> {
  const quellen = ERKLAERUNGS_QUELLEN[frageId];
  if (!quellen) return {};
  const [lemmata, rollen] = await Promise.all([
    ladeBegriffsLemmata(),
    getRollenDefinitionen().catch(() => []),
  ]);
  const ergebnis: Record<string, string> = {};
  for (const [option, quelle] of Object.entries(quellen)) {
    const text =
      quelle.art === "lemma"
        ? lemmata.find((l) => l.code === quelle.code)?.kurzerklaerung
        : rollen.find((r) => r.rolle_id === quelle.id)?.definition_kurz;
    if (text) ergebnis[option] = kuerzeErklaerung(text);
  }
  return ergebnis;
}
