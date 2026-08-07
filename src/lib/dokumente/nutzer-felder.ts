import type { FeldMap } from "@/lib/dokumente/renderer";
import type { TemplateKey } from "@/lib/dokumente/service";

/**
 * Feldkatalog für das Online-Ausfüllen der NUTZER-PFLICHT-Platzhalter.
 *
 * Zwei Zielarten:
 * - { feld }: überschreibt einen Daten-Platzhalter (nur wenn der aus dem
 *   Profil/der Verpackung kommende Wert leer ist – gepflegte Stammdaten
 *   gewinnen immer).
 * - { anker }: ersetzt im GERENDERTEN Text die Ausfülllücke der Zeile, die
 *   den Anker-Text enthält; der [NUTZER-PFLICHT]-Marker der Zeile wechselt
 *   auf [VORBEFÜLLT]. Anker sind wörtliche Ausschnitte der Template-Master
 *   (content/templates/) – ändert die Redaktion diese Passagen, muss der
 *   Katalog nachgezogen werden.
 *
 * Bewusst NICHT im Katalog: Unterschrift-/Signaturzeilen (bleiben
 * Leerzeilen im Dokument) und reine Prüf-/Beifügen-Hinweise.
 * Alle Felder sind optional – leere Felder bleiben sichtbare Lücken.
 */

export interface NutzerFeld {
  key: string;
  label: string;
  art: "text" | "mehrzeilig" | "datum";
  ziel: { feld: string } | { anker: string };
}

export type NutzerEingaben = Record<string, string>;

export const NUTZER_FELDER: Record<TemplateKey, NutzerFeld[]> = {
  konformitaetserklaerung: [
    {
      key: "kennung",
      label: "Eindeutige Kennung der Verpackung",
      art: "text",
      ziel: { feld: "verpackung.eindeutige_kennung" },
    },
    {
      key: "merkmale",
      label: "Format/Abmessungen und Rückverfolgbarkeits-Merkmale",
      art: "mehrzeilig",
      ziel: { anker: "Format/Abmessungen, ggf. Chargen-/Serienbezug" },
    },
    {
      key: "weitere_rechtsakte",
      label: "Weitere angewandte EU-Rechtsakte",
      art: "text",
      ziel: { anker: "Weitere angewandte Rechtsakte der Union" },
    },
    {
      key: "normen",
      label: "Harmonisierte Normen / technische Spezifikationen",
      art: "mehrzeilig",
      ziel: { anker: "Prüfnormen der Materialanalytik:" },
    },
    {
      key: "techdoku_referenz",
      label: "Interne Referenz der technischen Dokumentation",
      art: "text",
      ziel: { feld: "verpackung.techdoku_referenz" },
    },
    {
      key: "ausstellungsdatum",
      label: "Datum der Ausstellung",
      art: "datum",
      ziel: { anker: "(Ort und Datum der Ausstellung):" },
    },
    {
      key: "zeichnungsberechtigter_name",
      label: "Zeichnungsberechtigte Person (Name)",
      art: "text",
      ziel: { feld: "profil.zeichnungsberechtigter_name" },
    },
    {
      key: "zeichnungsberechtigter_funktion",
      label: "Funktion der zeichnungsberechtigten Person",
      art: "text",
      ziel: { feld: "profil.zeichnungsberechtigter_funktion" },
    },
  ],
  techdoku: [
    {
      key: "fuellgut",
      label: "Füllgut/Verwendung",
      art: "text",
      ziel: { feld: "verpackung.fuellgut" },
    },
    {
      key: "beschreibung",
      label: "Beschreibung der Verpackung (Funktion, Zielmarkt, Einsatz)",
      art: "mehrzeilig",
      ziel: { anker: "Beschreibung vervollständigen (Funktion, Zielmarkt" },
    },
    {
      key: "erlaeuterungen",
      label: "Erläuterungen zu Zeichnungen und Funktionsweise",
      art: "mehrzeilig",
      ziel: { anker: "Erläuterungstext, soweit für die Bewertung" },
    },
    {
      key: "normen_liste",
      label: "Angewandte Normen bzw. gewählte Lösungen",
      art: "mehrzeilig",
      ziel: { anker: "je Zeile ausfüllen; wo keine harmonisierten" },
    },
    {
      key: "mehrweg_bewertung",
      label: "Mehrweg-Bewertung nach Art. 11 (Kriterien a–i)",
      art: "mehrzeilig",
      ziel: { anker: "Bewertung je Kriterium lit. a–i" },
    },
    {
      key: "risiko_bewertung",
      label: "Risiko-Bewertung der Nichtkonformität",
      art: "mehrzeilig",
      ziel: { anker: "je geltender Anforderung aus Kapitel 0 bewerten" },
    },
    {
      key: "qs_prozess",
      label: "Qualitätssicherung und Herstellungsüberwachung",
      art: "mehrzeilig",
      ziel: { anker: "Beschreiben, wie Herstellungsprozess und Überwachung" },
    },
  ],
  pflichtenuebersicht: [
    {
      key: "lucid_nummer",
      label: "LUCID-Registrierungsnummer",
      art: "text",
      ziel: { feld: "profil.lucid_nummer" },
    },
    {
      key: "verantwortliche",
      label: "Verantwortliche und Termine",
      art: "mehrzeilig",
      ziel: { anker: "Verantwortliche und Termine ergänzen" },
    },
  ],
  lieferantenanfragen: [
    {
      key: "kennung",
      label: "Eindeutige Kennung der Verpackung (Betreff)",
      art: "text",
      ziel: { feld: "verpackung.eindeutige_kennung" },
    },
    {
      key: "antwortfrist",
      label: "Antwortfrist für Lieferanten",
      art: "datum",
      ziel: { anker: "bis zum [NUTZER-PFLICHT: Datum]" },
    },
  ],
};

const LUECKEN_MUSTER = /_{4,}|\[NUTZER-PFLICHT/;
const MARKER_MUSTER = /\[NUTZER-PFLICHT[^\]]*\]/;

function formatWert(feld: NutzerFeld, wert: string): string {
  if (feld.art === "datum" && /^\d{4}-\d{2}-\d{2}$/.test(wert)) {
    return new Date(`${wert}T12:00:00`).toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  return wert.trim();
}

function eingabeWert(
  eingaben: NutzerEingaben,
  feld: NutzerFeld
): string | null {
  const roh = (eingaben[feld.key] ?? "").trim();
  return roh ? formatWert(feld, roh) : null;
}

/** Daten-Platzhalter mit Nutzer-Eingaben füllen – Stammdaten gewinnen. */
export function overlayEingaben(
  felder: FeldMap,
  eingaben: NutzerEingaben,
  key: TemplateKey
): FeldMap {
  const ergebnis: FeldMap = { ...felder };
  for (const feld of NUTZER_FELDER[key]) {
    if (!("feld" in feld.ziel)) continue;
    const wert = eingabeWert(eingaben, feld);
    if (!wert) continue;
    const aktuell = ergebnis[feld.ziel.feld];
    const leer =
      aktuell == null ||
      aktuell === "" ||
      (typeof aktuell === "string" && LUECKEN_MUSTER.test(aktuell));
    if (leer) ergebnis[feld.ziel.feld] = wert;
  }
  return ergebnis;
}

/**
 * Anker-Felder in den gerenderten Text mergen: Lücke (____) der Anker-Zeile
 * wird durch den Wert ersetzt (ohne Lücke: Wert angehängt), der
 * NUTZER-PFLICHT-Marker der Zeile wechselt auf VORBEFÜLLT.
 */
export function mergeAnkerEingaben(
  text: string,
  eingaben: NutzerEingaben,
  key: TemplateKey
): string {
  const ankerFelder = NUTZER_FELDER[key].filter(
    (feld) => "anker" in feld.ziel
  );
  if (ankerFelder.length === 0) return text;

  return text
    .split("\n")
    .map((zeile) => {
      for (const feld of ankerFelder) {
        const anker = (feld.ziel as { anker: string }).anker;
        if (!zeile.includes(anker)) continue;
        const wert = eingabeWert(eingaben, feld);
        if (!wert) continue;
        let neu = zeile.replace(MARKER_MUSTER, "[VORBEFÜLLT]");
        neu = /_{4,}/.test(neu)
          ? neu.replace(/_{4,}/, wert)
          : `${neu} ${wert}`;
        return neu;
      }
      return zeile;
    })
    .join("\n");
}

/**
 * Formularfelder für den Ausfüll-Schritt: Daten-Felder nur, wenn der
 * zugrunde liegende Wert fehlt (sonst sind sie bereits VORBEFÜLLT);
 * Anker-Felder nur, wenn ihre Zeile im gerenderten Text vorkommt
 * (Bedingungsblöcke wie Mehrweg können sie entfernen).
 */
export function sichtbareNutzerFelder(
  key: TemplateKey,
  rohFelder: FeldMap,
  gerendert: string
): NutzerFeld[] {
  return NUTZER_FELDER[key].filter((feld) => {
    if ("feld" in feld.ziel) {
      const wert = rohFelder[feld.ziel.feld];
      return (
        wert == null ||
        wert === "" ||
        (typeof wert === "string" && LUECKEN_MUSTER.test(wert))
      );
    }
    return gerendert.includes(feld.ziel.anker);
  });
}

/** Nur bekannte, nicht-leere Eingaben (für die Ablage am Dokument). */
export function bereinigeEingaben(
  eingaben: NutzerEingaben,
  key: TemplateKey
): NutzerEingaben {
  const ergebnis: NutzerEingaben = {};
  for (const feld of NUTZER_FELDER[key]) {
    const wert = (eingaben[feld.key] ?? "").trim();
    if (wert) ergebnis[feld.key] = wert;
  }
  return ergebnis;
}
