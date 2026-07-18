import type { WizardFrage } from "@/lib/wissensbasis";

/**
 * Wizard-Logik für das Onboarding (pur, ohne IO – testbar).
 *
 * Antworten werden als kanonische Schlüssel gespeichert (nicht als
 * Anzeigetexte), damit die Rollen-Engine stabil auswerten kann. Das Mapping
 * erfolgt über die Options-POSITION in wizard_fragen.antwort_optionen –
 * ändert die Redaktion die Reihenfolge der Optionen, muss dieses Mapping
 * nachgezogen werden.
 */

// ---------------------------------------------------------------------------
// Kanonische Options-Schlüssel je Frage (Index = Position in antwort_optionen)
// ---------------------------------------------------------------------------

export const OPTION_KEYS: Record<string, string[]> = {
  F01: ["DE", "EU", "drittland"],
  F02: ["ja", "nein"],
  F03: ["kleinstunternehmen", "groesser"],
  F05: ["verkauf", "um", "transport", "ecommerce", "service", "primaerproduktion"],
  F06: [
    "stellt_verpackung_physisch_her",
    "befuellt_versiegelt",
    "herstellen_lassen",
    "kauft_verpackte_ware",
    "importiert_drittland",
    "liefert_an_endabnehmer",
    "packt_aus",
    "lagert_und_versendet_fuer_dritte",
    "liefert_verpackungen_oder_material",
  ],
  F07: ["eigene", "fremde", "keine"],
  F08: ["DE", "EU", "drittland", "selbst"],
  F09: ["ja", "vorgelagert", "unklar"],
  F10: [
    "stationaer_b2b_DE",
    "online_endkunden_DE",
    "online_endkunden_EU",
    "export_drittland",
    "wiederverkaeufer_EU",
  ],
  F11: ["ja", "nein"],
  F12: ["lagerhaltung", "verpackung", "adressierung", "versand", "eigentum_ware"],
  F13: ["ja", "nein"],
};

/** Anzeige-Optionen einer Frage (pipe-getrennt in der DB). */
export function parseOptionen(frage: WizardFrage): string[] {
  if (!frage.antwort_optionen || frage.antwort_optionen.trim() === "—") {
    return [];
  }
  return frage.antwort_optionen.split("|").map((o) => o.trim());
}

// ---------------------------------------------------------------------------
// Wizard-Zustand (persistiert in profile.taetigkeiten als jsonb)
// ---------------------------------------------------------------------------

export type Antwort = string | string[];

export interface WizardState {
  unternehmen: Record<string, Antwort>;
  produktlinien: string[];
  linien: Record<string, Record<string, Antwort>>;
  stammdaten_ok?: boolean;
}

export function emptyState(): WizardState {
  return { unternehmen: {}, produktlinien: [], linien: {} };
}

export function parseState(raw: unknown): WizardState {
  if (!raw || typeof raw !== "object") return emptyState();
  const s = raw as Partial<WizardState>;
  return {
    unternehmen: s.unternehmen ?? {},
    produktlinien: Array.isArray(s.produktlinien) ? s.produktlinien : [],
    linien: s.linien ?? {},
    stammdaten_ok: s.stammdaten_ok,
  };
}

// ---------------------------------------------------------------------------
// bedingung_anzeige – kleiner Auswerter für die DSL der wizard_fragen
// Unterstützt: "immer", "<var> = <wert>", "<var> != <wert>",
// "<var> ENTHÄLT <token>", "<var> ENTHÄLT (<a> ODER <b>)"
// ---------------------------------------------------------------------------

/** Aliase: Anzeigetexte/Kurzformen der DSL → kanonische Schlüssel. */
const WERT_ALIASE: Record<string, string> = {
  deutschland: "DE",
  befuellt: "befuellt_versiegelt",
  herstellen_lassen: "herstellen_lassen",
  packt_aus: "packt_aus",
  lagert_und_versendet_fuer_dritte: "lagert_und_versendet_fuer_dritte",
};

function normWert(wert: string): string {
  const key = wert.trim().toLowerCase();
  return WERT_ALIASE[key] ?? wert.trim();
}

export function evalBedingung(
  bedingung: string | null,
  variablen: Record<string, Antwort>
): boolean {
  if (!bedingung || bedingung.trim().toLowerCase() === "immer") return true;
  const expr = bedingung.trim();

  const enthaeltMatch = expr.match(/^(\w+)\s+ENTHÄLT\s+(.+)$/i);
  if (enthaeltMatch) {
    const wert = variablen[enthaeltMatch[1]];
    const liste = Array.isArray(wert) ? wert : wert ? [wert] : [];
    const rest = enthaeltMatch[2].replace(/^\(|\)$/g, "");
    const tokens = rest.split(/\s+ODER\s+/i).map(normWert);
    return tokens.some((t) => liste.includes(t));
  }

  const neqMatch = expr.match(/^(\w+)\s*!=\s*(.+)$/);
  if (neqMatch) {
    return variablen[neqMatch[1]] !== normWert(neqMatch[2]);
  }

  const eqMatch = expr.match(/^(\w+)\s*=\s*(.+)$/);
  if (eqMatch) {
    return variablen[eqMatch[1]] === normWert(eqMatch[2]);
  }

  // Unbekannte Ausdrücke: Frage lieber anzeigen als stillschweigend überspringen
  return true;
}

// ---------------------------------------------------------------------------
// Schrittfolge
// ---------------------------------------------------------------------------

export type WizardStep =
  | { art: "frage"; frage: WizardFrage; linie?: number }
  | { art: "stammdaten" }
  | { art: "abschluss" };

export function stepKey(step: WizardStep): string {
  if (step.art === "frage") {
    return step.linie != null ? `${step.frage.frage_id}:${step.linie}` : step.frage.frage_id;
  }
  return step.art;
}

/** Vollständige Schrittfolge aus Fragen + aktuellem Zustand. */
export function computeSteps(
  fragen: WizardFrage[],
  state: WizardState
): WizardStep[] {
  const sortiert = [...fragen].sort((a, b) => a.reihenfolge - b.reihenfolge);
  const steps: WizardStep[] = [];

  for (const frage of sortiert.filter((f) => f.ebene === "unternehmen")) {
    if (evalBedingung(frage.bedingung_anzeige, state.unternehmen)) {
      steps.push({ art: "frage", frage });
    }
  }

  const f04 = sortiert.find((f) => f.frage_id === "F04");
  if (f04) steps.push({ art: "frage", frage: f04 });

  const linienFragen = sortiert.filter(
    (f) => f.ebene === "produktlinie" && f.frage_id !== "F04"
  );
  state.produktlinien.forEach((_, index) => {
    const antworten = {
      ...state.unternehmen,
      ...(state.linien[String(index)] ?? {}),
    };
    for (const frage of linienFragen) {
      if (evalBedingung(frage.bedingung_anzeige, antworten)) {
        steps.push({ art: "frage", frage, linie: index });
      }
    }
  });

  steps.push({ art: "stammdaten" });
  steps.push({ art: "abschluss" });
  return steps;
}

export function isAnswered(step: WizardStep, state: WizardState): boolean {
  if (step.art === "stammdaten") return state.stammdaten_ok === true;
  if (step.art === "abschluss") return false;
  const { frage, linie } = step;
  if (frage.frage_id === "F04") return state.produktlinien.length > 0;
  const quelle =
    frage.ebene === "unternehmen"
      ? state.unternehmen
      : state.linien[String(linie ?? 0)] ?? {};
  const antwort = quelle[frage.ziel_variable.split(";")[0].trim()];
  if (antwort == null) return false;
  return Array.isArray(antwort) ? true : antwort !== "";
}

/** Erster unbeantworteter Schritt (= Wiederaufnahme-Punkt). */
export function firstOpenStep(steps: WizardStep[], state: WizardState): WizardStep {
  return steps.find((s) => !isAnswered(s, state)) ?? steps[steps.length - 1];
}
