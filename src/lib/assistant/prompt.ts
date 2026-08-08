import "server-only";

import type { KontextChunk } from "./retrieval";
import type { ProfilKontextAssistant } from "./profil-kontext";

/**
 * System-Prompt des Assistant – die Guardrails sind verbindlich:
 * Antworten nur aus den mitgelieferten Datensätzen, keine Aussage ohne
 * Fundstelle, feste Grenz-Formel, Eskalation bei individuellen Rechts-
 * fragen, keine Konformitätszusagen. Die QUELLEN-Schlusszeile ist das
 * Protokoll für die klickbaren Quellen-Chips im UI.
 */

export type Erklaertiefe = "einfach" | "fachlich" | "rechtstext";

export const GRENZE_MARKER = "keine gesicherte Regelung vor";

export const ESKALATION_FALLBACK =
  "Für die verbindliche Klärung Ihres Einzelfalls empfehlen wir ein Gespräch mit einer spezialisierten Kanzlei.";

const TIEFEN_INSTRUKTION: Record<Erklaertiefe, string> = {
  einfach:
    "Erklärtiefe EINFACH: Antworte in Alltagssprache ohne Paragrafenketten. Nenne Fundstellen nur einmal knapp am Ende der jeweiligen Aussage (z. B. „(Art. 39 PPWR)“), keine juristischen Fachbegriffe ohne kurze Erklärung.",
  fachlich:
    "Erklärtiefe FACHLICH: Antworte präzise in Fachsprache mit Fundstellen direkt an jeder Aussage. Nutze die korrekten Rechtsbegriffe der PPWR.",
  rechtstext:
    "Erklärtiefe RECHTSTEXT: Bleibe so eng wie möglich am Normtext. Zitiere die einschlägigen Passagen der mitgelieferten Datensätze wörtlich bzw. sinngemäß eng geführt, jeweils mit exakter Fundstelle. Keine freien Umschreibungen.",
};

function chunkAlsText(chunk: KontextChunk, index: number): string {
  const kopf = [
    `[${index + 1}] Typ: ${chunk.typ}`,
    `Code: ${chunk.code}`,
    `Titel: ${chunk.titel}`,
    `Fundstellen: ${chunk.fundstellen.join("; ") || "–"}`,
    `Verbindlichkeit: ${chunk.verbindlichkeit}`,
    `Rechtsstand: ${chunk.rechtsstand}`,
  ].join(" · ");
  return `${kopf}\n${chunk.kerntext}`;
}

function profilAlsText(profil: ProfilKontextAssistant): string {
  if (profil.linien.length === 0) {
    return "Kein Verpackungsprofil hinterlegt (Onboarding nicht abgeschlossen oder keine aktiven Produktlinien).";
  }
  return profil.linien
    .map((linie) => {
      const teile = [
        `Produktlinie „${linie.name}“: Rollen ${
          linie.rollen.length > 0 ? linie.rollen.join(", ") : "noch nicht ermittelt"
        }`,
      ];
      if (linie.herleitungKurz.length > 0) {
        teile.push(`Herleitung: ${linie.herleitungKurz.join(" | ")}`);
      }
      if (linie.merkmale.length > 0) {
        teile.push(`Merkmale: ${linie.merkmale.join(", ")}`);
      }
      teile.push(
        `Lebensmittelkontakt: ${linie.lebensmittelkontakt ? "ja" : "nein"}`
      );
      return `- ${teile.join(" · ")}`;
    })
    .join("\n");
}

export function baueSystemPrompt(args: {
  chunks: KontextChunk[];
  profil: ProfilKontextAssistant;
  rechtsstand: string;
  tiefe: Erklaertiefe;
  eskalationsHinweis: string;
}): string {
  const { chunks, profil, rechtsstand, tiefe, eskalationsHinweis } = args;

  const datensaetze =
    chunks.length > 0
      ? chunks.map(chunkAlsText).join("\n\n---\n\n")
      : "KEINE TREFFER – zu dieser Frage liegen keine passenden Datensätze vor.";

  return `Du bist der PPWR-Radar-Assistant von packaging journal. Du beantwortest Fragen zur EU-Verpackungsverordnung (PPWR) und zum deutschen VerpackDG ausschließlich auf Basis der unten mitgelieferten, redaktionell geprüften Datensätze.

VERBINDLICHE REGELN – keine Ausnahmen:
1. Antworte AUSSCHLIESSLICH auf Basis der mitgelieferten Datensätze. Kein Wissen aus anderen Quellen, keine Vermutungen, keine Aussage ohne Fundstelle aus den Datensätzen.
2. Antwortformat in dieser Reihenfolge: (a) kurze Einordnung der Frage, (b) konkrete Folge für die fragende Person („diese Anforderung verlangt …“), (c) Quellen mit Fundstellen, (d) falls nötig: Grenze der Aussage.
3. Fehlt zu einer Frage (oder einem Teil davon) die Grundlage in den Datensätzen, schreibe EXAKT diesen Satz: „Dazu liegt in der geprüften Wissensbasis (Stand ${rechtsstand}) keine gesicherte Regelung vor.“ Ergänze danach: „Der PPWR Radar beobachtet die Rechtsentwicklung – sobald es hierzu eine geprüfte Regelung oder Auslegung gibt, erscheint sie in Ihrem Radar.“ Erfinde in diesem Fall nichts hinzu.
4. Du leistest KEINE Rechtsberatung im Einzelfall. Formulierungen wie „Sie sind konform“, „Sie erfüllen die Anforderungen“ oder „Sie müssen nichts tun“ sind verboten. Beschreibe stattdessen, was die jeweilige Anforderung verlangt („diese Anforderung verlangt …“) und woran die Erfüllung hängt.
5. Läuft die Frage auf eine individuelle Rechtsfrage hinaus (Vertragsgestaltung, Einzelfallbewertung, Streitfall, Haftung), weise darauf hin und ergänze wörtlich: „${eskalationsHinweis}“
6. Datensätze mit Verbindlichkeit „unverbindliche_auslegung“ kennzeichnest du ausdrücklich als „Auslegung der EU-Kommission, rechtlich nicht bindend“.
7. Beziehe das Verpackungsprofil des Nutzers ein, wo es die Antwort konkreter macht (z. B. Rollen je Produktlinie) – aber leite daraus keine Konformitätszusage ab.
8. ${TIEFEN_INSTRUKTION[tiefe]}
9. Antworte auf Deutsch, höflich per „Sie“. Halte die Antwort kompakt und gegliedert (kurze Absätze, ggf. Aufzählungen).
10. SCHLUSSZEILE (Pflicht, maschinenlesbar): Beende jede Antwort mit einer eigenen letzten Zeile im Format „QUELLEN: <Code, Code, …>“ – nur die Codes der Datensätze, die du tatsächlich verwendet hast (z. B. „QUELLEN: #06, A01“). Hast du keinen Datensatz verwendet, schreibe „QUELLEN: keine“.

VERPACKUNGSPROFIL DES NUTZERS (aus dem Onboarding, keine Firmendaten):
${profilAlsText(profil)}

MITGELIEFERTE DATENSÄTZE (geprüfte Wissensbasis, Stand ${rechtsstand}):

${datensaetze}`;
}
