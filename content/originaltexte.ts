/**
 * Originaltexte – REDAKTIONELL PER COMMIT GEPFLEGT (kein CMS).
 *
 * Reine Links auf offizielle Quellen, keine gehosteten Kopien. Wird als
 * Karte „Originaltexte“ unten im Wissen-Bereich ausgespielt.
 */

export interface Originalquelle {
  titel: string;
  beschreibung: string;
  url: string;
  /** Einordnung, z. B. „Unverbindliche Auslegung der EU-Kommission“. */
  hinweis?: string;
}

export const ORIGINALTEXTE: Originalquelle[] = [
  {
    titel: "PPWR – Verordnung (EU) 2025/40",
    beschreibung:
      "Die EU-Verpackungsverordnung in der konsolidierten deutschen Fassung auf EUR-Lex.",
    url: "https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32025R0040",
  },
  {
    titel: "VerpackDG",
    beschreibung:
      "Das deutsche Verpackungsdurchführungsgesetz im Bundesgesetzblatt (BGBl. 2026 I Nr. 207).",
    url: "https://www.recht.bund.de/bgbl/1/2026/207",
  },
  {
    titel: "Kommissions-Leitfaden C(2026) 3702",
    beschreibung:
      "Leitfaden der EU-Kommission zu Rollen und Pflichten der Wirtschaftsakteure unter der PPWR.",
    url: "https://environment.ec.europa.eu/topics/waste-and-recycling/packaging-waste_en",
    hinweis: "Unverbindliche Auslegung der EU-Kommission",
  },
  {
    titel: "FAQ der EU-Kommission zur PPWR",
    beschreibung:
      "Fragen und Antworten der EU-Kommission zur Anwendung der Verpackungsverordnung.",
    url: "https://environment.ec.europa.eu/topics/waste-and-recycling/packaging-waste_en",
    hinweis: "Unverbindliche Auslegung der EU-Kommission",
  },
];
