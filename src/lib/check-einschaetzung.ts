import type { LinienErgebnis } from "@/lib/rollen-engine";

/**
 * Ersteinschätzung für den öffentlichen Betroffenheits-Check (pur, testbar).
 * Bewusst grob: hoch/mittel/gering plus Eskalation, wenn trotz angegebener
 * Tätigkeiten keine Rolle ableitbar war (entspricht der „unklar“-Logik des
 * Wizards – dort über F09, hier mangels Detailfragen).
 */
export type BetroffenheitsStufe = "hoch" | "mittel" | "gering";

export interface Ersteinschaetzung {
  stufe: BetroffenheitsStufe;
  unklar: boolean;
  aussage: string;
}

const KERNROLLEN = ["erzeuger", "hersteller", "importeur"];

export function ersteinschaetzung(
  ergebnis: LinienErgebnis,
  taetigkeit: string[]
): Ersteinschaetzung {
  const { rollen, pflichten } = ergebnis.rollen_set;

  const unklar = rollen.length === 0 && taetigkeit.length > 0;
  const stufe: BetroffenheitsStufe = unklar
    ? "gering"
    : rollen.some((r) => KERNROLLEN.includes(r)) || pflichten.length > 0
      ? "hoch"
      : rollen.length > 0
        ? "mittel"
        : "gering";

  const aussage =
    stufe === "hoch"
      ? "Die PPWR betrifft Ihr Unternehmen voraussichtlich in mehreren Bereichen."
      : stufe === "mittel"
        ? "Die PPWR betrifft Ihr Unternehmen voraussichtlich in einzelnen Bereichen."
        : "Nach Ihren Angaben ist Ihr Unternehmen voraussichtlich nur am Rande betroffen.";

  return { stufe, unklar, aussage };
}
