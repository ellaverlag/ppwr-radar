import { marked, type Token, type Tokens } from "marked";

/**
 * Markdown → .docx und PDF (pur, ohne Server-Abhängigkeiten – testbar).
 *
 * Bibliothekswahl (Begründung im README):
 * - .docx: html-to-docx über marked-HTML – reines JS, saubere Tabellen
 *   und Umlaute, keine nativen Abhängigkeiten.
 * - PDF: pdfmake 0.2 (stabile API) mit eingebetteter Roboto – kein
 *   Headless-Browser nötig; das Markdown wird über den marked-Lexer in
 *   eine pdfmake-Dokumentdefinition übersetzt.
 */


type Inline = { text: string; bold?: boolean; italics?: boolean };

function inlineRuns(tokens: Token[] | undefined, fett = false): Inline[] {
  if (!tokens) return [];
  const runs: Inline[] = [];
  for (const token of tokens) {
    switch (token.type) {
      case "strong":
        runs.push(...inlineRuns((token as Tokens.Strong).tokens, true));
        break;
      case "em": {
        const innen = inlineRuns((token as Tokens.Em).tokens, fett);
        runs.push(...innen.map((r) => ({ ...r, italics: true })));
        break;
      }
      case "codespan":
        runs.push({ text: (token as Tokens.Codespan).text, bold: fett });
        break;
      case "link":
        runs.push(...inlineRuns((token as Tokens.Link).tokens, fett));
        break;
      case "br":
        runs.push({ text: "\n" });
        break;
      default:
        if ("text" in token && typeof token.text === "string") {
          runs.push({ text: token.text, bold: fett || undefined });
        }
    }
  }
  return runs;
}

function markdownZuPdfInhalt(md: string): Record<string, unknown>[] {
  const inhalt: Record<string, unknown>[] = [];
  for (const token of marked.lexer(md)) {
    switch (token.type) {
      case "heading": {
        const t = token as Tokens.Heading;
        inhalt.push({
          text: inlineRuns(t.tokens),
          style: `h${Math.min(t.depth, 4)}`,
        });
        break;
      }
      case "paragraph":
        inhalt.push({
          text: inlineRuns((token as Tokens.Paragraph).tokens),
          margin: [0, 2, 0, 6],
        });
        break;
      case "list": {
        const t = token as Tokens.List;
        const punkte = t.items.map((item) =>
          inlineRuns(
            item.tokens.flatMap((it) =>
              "tokens" in it && it.tokens ? it.tokens : [it]
            )
          )
        );
        inhalt.push(
          t.ordered
            ? { ol: punkte.map((p) => ({ text: p })), margin: [0, 2, 0, 6] }
            : { ul: punkte.map((p) => ({ text: p })), margin: [0, 2, 0, 6] }
        );
        break;
      }
      case "table": {
        const t = token as Tokens.Table;
        const kopf = t.header.map((zelle) => ({
          text: inlineRuns(zelle.tokens),
          bold: true,
          fillColor: "#f3f3f3",
        }));
        const zeilen = t.rows.map((zeile) =>
          zeile.map((zelle) => ({ text: inlineRuns(zelle.tokens) }))
        );
        inhalt.push({
          table: {
            headerRows: 1,
            widths: t.header.map(() => "auto"),
            body: [kopf, ...zeilen],
          },
          layout: {
            hLineColor: "#bbbbbb",
            vLineColor: "#bbbbbb",
            hLineWidth: () => 0.5,
            vLineWidth: () => 0.5,
          },
          margin: [0, 4, 0, 8],
          fontSize: 9,
        });
        break;
      }
      case "blockquote":
        inhalt.push({
          text: inlineRuns(
            (token as Tokens.Blockquote).tokens.flatMap((t2) =>
              "tokens" in t2 && t2.tokens ? t2.tokens : [t2]
            )
          ),
          italics: true,
          color: "#3d4944",
          margin: [12, 2, 0, 6],
        });
        break;
      case "hr":
        inhalt.push({
          canvas: [
            {
              type: "line",
              x1: 0,
              y1: 0,
              x2: 515,
              y2: 0,
              lineWidth: 0.5,
              lineColor: "#bbbbbb",
            },
          ],
          margin: [0, 8, 0, 8],
        });
        break;
      default:
        break;
    }
  }
  return inhalt;
}

/** Zeichen, die Roboto (PDF) nicht abdeckt, durch abgedeckte ersetzen. */
function pdfTauglich(text: string): string {
  return text
    .replace(/[☐⬜]/g, "[ ]")
    .replace(/[☑✅✔]/g, "[x]")
    .replace(/[→⇒]/g, "->")
    .replace(/[\u{1F500}-\u{1FAFF}\u{2600}-\u{27BF}\uFE0F]/gu, "");
}

export async function erzeugePdf(md: string): Promise<Uint8Array> {
  md = pdfTauglich(md);
  const pdfMakeMod = await import("pdfmake/build/pdfmake.js");
  const pdfFontsMod = await import("pdfmake/build/vfs_fonts.js");
  const pdfMake = pdfMakeMod.default;
  pdfMake.vfs =
    pdfFontsMod.default?.vfs ?? pdfFontsMod.default?.pdfMake?.vfs ?? pdfMake.vfs;

  const def = {
    content: markdownZuPdfInhalt(md),
    defaultStyle: { fontSize: 10, lineHeight: 1.3 },
    styles: {
      h1: { fontSize: 16, bold: true, margin: [0, 0, 0, 8] },
      h2: { fontSize: 14, bold: true, margin: [0, 10, 0, 6] },
      h3: { fontSize: 12, bold: true, margin: [0, 8, 0, 4] },
      h4: { fontSize: 10.5, bold: true, margin: [0, 6, 0, 3] },
    },
    footer: (aktuelleSeite: number, seiten: number) => ({
      text: `Erstellt mit PPWR Radar – keine Rechtsberatung · Seite ${aktuelleSeite}/${seiten}`,
      fontSize: 8,
      color: "#767676",
      margin: [40, 0, 40, 0],
    }),
    pageMargins: [40, 40, 40, 50],
  };

  return new Promise((resolve) => {
    pdfMake.createPdf(def).getBuffer((buffer) => resolve(buffer));
  });
}

export async function erzeugeDocx(md: string): Promise<Buffer> {
  const { default: HTMLtoDOCX } = await import("html-to-docx");
  const html = await marked.parse(md);
  const ergebnis = await HTMLtoDOCX(
    `<!DOCTYPE html><html><head><meta charset="UTF-8"></head><body>${html}</body></html>`,
    null,
    {
      table: { row: { cantSplit: true } },
      font: "Calibri",
      footer: true,
      footerHTMLString: `<p style="font-size:8pt;color:#767676">Erstellt mit PPWR Radar – keine Rechtsberatung</p>`,
    }
  );
  return Buffer.isBuffer(ergebnis)
    ? ergebnis
    : Buffer.from(ergebnis as ArrayBuffer);
}

