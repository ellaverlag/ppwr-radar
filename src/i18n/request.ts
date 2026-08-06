import { getRequestConfig } from "next-intl/server";

/**
 * i18n-Fundament (Phase 1): Standardsprache Deutsch, keine englische Route,
 * kein Sprachumschalter. Alle UI-Texte liegen in /messages/<locale>.json –
 * der spätere EN-Ausbau („PPWR Radar EU“, Phase 2) ersetzt hier nur die
 * Locale-Auflösung und füllt messages/en.json; ein Umbau ist nicht nötig.
 *
 * Wissensbasis-Inhalte (Anforderungen, Auslegungen, Rollen-Definitionen,
 * Wizard-Fragen) kommen ausschließlich aus der Datenbank und laufen NICHT
 * über diese Sprachdateien.
 */
export const defaultLocale = "de" as const;

export default getRequestConfig(async () => {
  const locale = defaultLocale;

  return {
    locale,
    messages: (await import(`../../messages/${locale}.json`)).default,
  };
});
