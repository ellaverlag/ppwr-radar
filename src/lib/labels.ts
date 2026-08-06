/**
 * UI-Labels für die Enum-Werte der Wissensbasis liegen seit dem
 * i18n-Fundament in den Sprachdateien (messages/<locale>.json unter
 * "Labels.*") und werden über next-intl aufgelöst – z. B.
 * t(`kategorien.${kategorie}`) mit getTranslations("Labels").
 * Hier bleiben nur sprachunabhängige Format-Helfer.
 */

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
