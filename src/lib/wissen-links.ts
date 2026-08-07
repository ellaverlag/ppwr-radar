/**
 * Zentrale URL-Helfer für den Wissen-Bereich – Komponenten bauen keine
 * Pfade mehr von Hand. Jede Änderung an den Routen passiert nur hier.
 *
 * Die Anforderungs-Detailroute akzeptiert UUID ODER Nummer (die Seite löst
 * numerische Parameter über anforderungen.nr auf) – damit führen auch
 * Nummern-basierte Verweise (z. B. aus glossar_lemmata.verweis_anforderungen)
 * nie ins Leere.
 */

/** Detailseite einer Anforderung – per UUID oder per Nummer (#12). */
export function anforderungUrl(ziel: string | number): string {
  return `/wissen/anforderungen/${ziel}`;
}

/**
 * Praxisfrage im Auslegungen-Tab: Deep-Link über den Anker (#A01) – die
 * Zeile selbst ist dort ein Accordion-Toggle, keine eigene Route. Ohne
 * Code fällt der Link auf die Volltextsuche zurück.
 */
export function praxisfrageUrl(
  code: string | null,
  fallbackFrage?: string
): string {
  if (code) return `/wissen/auslegungen#${encodeURIComponent(code)}`;
  if (fallbackFrage) {
    return `/wissen/auslegungen?q=${encodeURIComponent(fallbackFrage)}`;
  }
  return "/wissen/auslegungen";
}

/** Glossar-Eintrag über die Suche anspringen (Begriffe haben keine Route). */
export function glossarBegriffUrl(begriff: string): string {
  return `/wissen/glossar?q=${encodeURIComponent(begriff)}`;
}
