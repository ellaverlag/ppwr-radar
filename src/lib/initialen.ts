/**
 * Initialen-Monogramm für den Avatar (pur, testbar).
 * „ella Verlag“ → „eV“ (Originalschreibung bleibt erhalten),
 * Einzelwörter → erster Buchstabe, E-Mail-Fallback → erster Buchstabe groß.
 */
export function initialen(name: string | null | undefined): string {
  const wert = (name ?? "").trim();
  if (!wert) return "?";

  if (wert.includes("@")) {
    return wert[0].toUpperCase();
  }

  const woerter = wert.split(/\s+/).filter(Boolean);
  if (woerter.length >= 2) {
    return `${woerter[0][0]}${woerter[1][0]}`;
  }
  return woerter[0][0];
}
