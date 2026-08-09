import "server-only";

import { ladeBegriffsLemmata } from "@/lib/glossar";
import { glossarBegriffUrl } from "@/lib/wissen-links";
import { getRollenDefinitionen } from "@/lib/wissensbasis";

/**
 * Erklärhilfen je Antwort-Option der Wizard-Fragen: Die STRUKTUR (welche
 * Option welchen Begriff erklärt) liegt hier, die TEXTE kommen aus der
 * Datenbank (glossar_lemmata typ=begriff bzw. rollen_definitionen).
 * Optionen ohne Zuordnung bleiben ohne Zweitzeile – nachpflegbar über neue
 * Lemmata. Genutzt vom Onboarding UND vom Mini-Wizard der Produktlinien-
 * Verwaltung (gleiche Fragen, gleiche Hilfen).
 *
 * Ausnahme F05 (häufigste Fehlerquelle: Transport- vs. Versand-/Verkaufs-
 * verpackung): Hier führen ABGRENZENDE Alltagsbeispiele mit Gegenbeispiel
 * als feste Override-Texte – die neutralen Lexikon-Definitionen reichen
 * zum Entwechseln nicht aus. Das Glossar-Lemma bleibt je Option als
 * „?“-Link erreichbar.
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

/** Feste Abgrenzungstexte (mit Gegenbeispiel) – gewinnen vor dem Lemma-Text. */
const ERKLAERUNGS_OVERRIDES: Record<string, Record<string, string>> = {
  F05: {
    verkauf:
      "Die Verpackung, in der das Produkt beim Endkunden ankommt – z. B. die Folie um eine einzelne Zeitschrift, das Glas, die Flasche.",
    um: "Fasst mehrere Verkaufseinheiten – z. B. der Tray um 12 Joghurts. NICHT die Palette.",
    transport:
      "Nur für den Transport zwischen Betrieben, wird vor dem Verkauf entfernt – z. B. Palette, Umkarton für den Versand ans Lager. NICHT die Verpackung, in der der Endkunde die Ware bekommt.",
    ecommerce:
      "Der Versandkarton/-umschlag beim Direktversand an Endkunden – z. B. der Karton, in dem eine Online-Bestellung ankommt.",
  },
};

export interface OptionErklaerung {
  text: string;
  /** Deep-Link auf das passende Glossar-Lemma („?“-Link an der Option). */
  glossarUrl?: string;
}

function kuerzeErklaerung(text: string, max = 180): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const geschnitten = t.slice(0, max);
  return `${geschnitten.slice(0, geschnitten.lastIndexOf(" "))} …`;
}

export async function ladeErklaerungen(
  frageId: string
): Promise<Record<string, OptionErklaerung>> {
  const quellen = ERKLAERUNGS_QUELLEN[frageId];
  if (!quellen) return {};
  const overrides = ERKLAERUNGS_OVERRIDES[frageId] ?? {};
  const [lemmata, rollen] = await Promise.all([
    ladeBegriffsLemmata(),
    getRollenDefinitionen().catch(() => []),
  ]);

  const ergebnis: Record<string, OptionErklaerung> = {};
  for (const [option, quelle] of Object.entries(quellen)) {
    let begriff: string | undefined;
    let lexikonText: string | undefined;
    if (quelle.art === "lemma") {
      const lemma = lemmata.find((l) => l.code === quelle.code);
      begriff = lemma?.lemma;
      lexikonText = lemma?.kurzerklaerung ?? undefined;
    } else {
      const rolle = rollen.find((r) => r.rolle_id === quelle.id);
      begriff = rolle?.begriff_de;
      lexikonText = rolle?.definition_kurz;
    }

    const text =
      overrides[option] ?? (lexikonText ? kuerzeErklaerung(lexikonText) : null);
    if (!text) continue;
    ergebnis[option] = {
      text,
      glossarUrl: begriff ? glossarBegriffUrl(begriff) : undefined,
    };
  }
  return ergebnis;
}
