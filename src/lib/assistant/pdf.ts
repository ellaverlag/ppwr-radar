import "server-only";

import { readFile } from "node:fs/promises";
import path from "node:path";
import {
  markdownZuPdfInhalt,
  pdfTauglich,
} from "@/lib/dokumente/konvertierung";

/**
 * Flüchtiger PDF-Export einer Assistant-Antwort – dieselbe pdfmake-Pipeline
 * wie der Dokumenten-Generator (eingebettete Roboto → Umlaute sicher, kein
 * Headless-Browser). Kein Speichern in der Dokumenten-Bibliothek.
 */

export interface AssistantPdfArgs {
  frage: string;
  antwortMarkdown: string;
  tiefeLabel: string;
  quellen: { code: string; titel: string; fundstellen: string[] }[];
  rechtsstand: string;
  preview: boolean;
  labels: {
    titel: string;
    byline: string;
    erklaertiefeLabel: string;
    rechtsstandLabel: string;
    quellenLabel: string;
    previewHinweis: string;
    disclaimer: string;
    erzeugtAm: string; // enthält {datum} und {stand}
  };
}

const GRUEN = "#006950";
const GRAU = "#767676";

export async function erzeugeAssistantPdf(
  args: AssistantPdfArgs
): Promise<Uint8Array> {
  const { labels } = args;
  const datum = new Date().toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

  const logoSvg = await readFile(
    path.join(process.cwd(), "public", "ppwr-radar-logo.svg"),
    "utf8"
  );

  const pdfMakeMod = await import("pdfmake/build/pdfmake.js");
  const pdfFontsMod = await import("pdfmake/build/vfs_fonts.js");
  const pdfMake = pdfMakeMod.default;
  pdfMake.vfs =
    pdfFontsMod.default?.vfs ?? pdfFontsMod.default?.pdfMake?.vfs ?? pdfMake.vfs;

  const inhalt: Record<string, unknown>[] = [
    // Kopf: Logo + „by packaging journal“
    { svg: logoSvg, width: 150, margin: [0, 0, 0, 2] },
    { text: labels.byline, fontSize: 8, color: GRAU, margin: [0, 0, 0, 14] },
    { text: pdfTauglich(labels.titel), fontSize: 15, bold: true, color: GRUEN },
    // Metazeile
    {
      text: `${datum} · ${labels.rechtsstandLabel} ${args.rechtsstand} · ${labels.erklaertiefeLabel}: ${args.tiefeLabel}`,
      fontSize: 8.5,
      color: GRAU,
      margin: [0, 3, 0, 12],
    },
  ];

  if (args.preview) {
    inhalt.push({
      table: {
        widths: ["*"],
        body: [
          [
            {
              text: pdfTauglich(labels.previewHinweis),
              fontSize: 9,
              color: "#745b00",
              fillColor: "#fff8e0",
              margin: [6, 5, 6, 5],
            },
          ],
        ],
      },
      layout: "noBorders",
      margin: [0, 0, 0, 12],
    });
  }

  // Die gestellte Frage als Überschrift, darunter die Antwort
  inhalt.push({
    text: pdfTauglich(args.frage),
    fontSize: 12.5,
    bold: true,
    margin: [0, 0, 0, 8],
  });
  inhalt.push(...markdownZuPdfInhalt(pdfTauglich(args.antwortMarkdown)));

  if (args.quellen.length > 0) {
    inhalt.push({
      text: labels.quellenLabel,
      fontSize: 11,
      bold: true,
      margin: [0, 14, 0, 4],
    });
    inhalt.push({
      ul: args.quellen.map((quelle) => ({
        text: pdfTauglich(
          `${quelle.fundstellen.join("; ") || quelle.code} – ${quelle.titel}`
        ),
        margin: [0, 1, 0, 1],
      })),
      fontSize: 9.5,
    });
  }

  const fusszeile = `${pdfTauglich(labels.disclaimer)}\n${labels.erzeugtAm
    .replace("{datum}", datum)
    .replace("{stand}", args.rechtsstand)}`;

  const def = {
    content: inhalt,
    defaultStyle: { fontSize: 10, lineHeight: 1.3 },
    styles: {
      h1: { fontSize: 13, bold: true, margin: [0, 8, 0, 4] },
      h2: { fontSize: 12, bold: true, margin: [0, 8, 0, 4] },
      h3: { fontSize: 11, bold: true, margin: [0, 8, 0, 4] },
      h4: { fontSize: 10.5, bold: true, margin: [0, 6, 0, 3] },
    },
    footer: (aktuelleSeite: number, seiten: number) => ({
      stack: [
        { text: fusszeile, fontSize: 7, color: GRAU },
        {
          text: `Seite ${aktuelleSeite}/${seiten}`,
          fontSize: 7,
          color: GRAU,
          margin: [0, 2, 0, 0],
        },
      ],
      margin: [40, 4, 40, 0],
    }),
    pageMargins: [40, 40, 40, 78],
  };

  return new Promise((resolve) => {
    pdfMake.createPdf(def).getBuffer((buffer: Uint8Array) => resolve(buffer));
  });
}
