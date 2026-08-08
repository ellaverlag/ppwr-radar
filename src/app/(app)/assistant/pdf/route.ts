import { getTranslations } from "next-intl/server";
import { erzeugeAssistantPdf } from "@/lib/assistant/pdf";
import { pruefeZugang } from "@/lib/zugang";

/**
 * Flüchtiger PDF-Export einer Assistant-Antwort: Der Client schickt die
 * anzuzeigenden Daten (Frage, Antwort-Markdown, Quellen, Rechtsstand) und
 * bekommt direkt das PDF – kein Speichern in der Dokumenten-Bibliothek.
 */

interface PdfAnfrage {
  frage?: string;
  antwortMarkdown?: string;
  tiefe?: string;
  quellen?: { code?: string; titel?: string; fundstellen?: string[] }[];
  rechtsstand?: string;
  preview?: boolean;
}

export async function POST(request: Request): Promise<Response> {
  const zugang = await pruefeZugang();
  if (!zugang?.freigeschaltet) {
    return new Response("Unauthorized", { status: 401 });
  }

  let body: PdfAnfrage;
  try {
    body = (await request.json()) as PdfAnfrage;
  } catch {
    return new Response("Bad Request", { status: 400 });
  }

  const frage = (body.frage ?? "").trim().slice(0, 1000);
  const antwort = (body.antwortMarkdown ?? "").trim().slice(0, 20000);
  if (!frage || !antwort) {
    return new Response("Bad Request", { status: 400 });
  }
  const quellen = (Array.isArray(body.quellen) ? body.quellen : [])
    .slice(0, 12)
    .map((q) => ({
      code: String(q.code ?? "").slice(0, 40),
      titel: String(q.titel ?? "").slice(0, 200),
      fundstellen: (Array.isArray(q.fundstellen) ? q.fundstellen : [])
        .slice(0, 6)
        .map((f) => String(f).slice(0, 120)),
    }));

  const t = await getTranslations("Assistant");
  const tiefen = t.raw("tiefen") as Record<string, string>;

  try {
    const pdf = await erzeugeAssistantPdf({
      frage,
      antwortMarkdown: antwort,
      tiefeLabel: tiefen[body.tiefe ?? ""] ?? tiefen.fachlich,
      quellen,
      rechtsstand: String(body.rechtsstand ?? "").slice(0, 20) || "–",
      preview: Boolean(body.preview),
      labels: {
        titel: t("pdf.titel"),
        byline: t("pdf.byline"),
        erklaertiefeLabel: t("erklaertiefeLabel"),
        rechtsstandLabel: t("pdf.rechtsstandLabel"),
        quellenLabel: t("quellenLabel"),
        previewHinweis: t("previewHinweis"),
        disclaimer: t("pdf.disclaimer"),
        erzeugtAm: t.raw("pdf.erzeugtAm") as string,
      },
    });

    const datum = new Date().toISOString().slice(0, 10);
    // Uint8Array in frisches ArrayBuffer kopieren (Response mag keine SharedArrayBuffer-Views)
    const bytes = new Uint8Array(pdf);
    return new Response(bytes.buffer as ArrayBuffer, {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="PPWR-Radar-Antwort_${datum}.pdf"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (fehler) {
    console.error(
      "Assistant: PDF-Export fehlgeschlagen:",
      fehler instanceof Error ? fehler.message : fehler
    );
    return new Response("PDF konnte nicht erzeugt werden", { status: 500 });
  }
}
