import { IBM_Plex_Sans, Manrope } from "next/font/google";

/**
 * PJ-Online-Markenschrift – NUR für die öffentliche Strecke (/, /check,
 * /check/ergebnis). Das App-Innere bleibt vollständig bei Inter/JetBrains
 * Mono. Die Variablen werden deshalb nicht im Root-Layout, sondern auf den
 * Wurzel-Elementen der öffentlichen Seiten gesetzt – so laden die Fonts
 * auch nur dort. next/font hostet selbst, setzt font-display: swap und
 * berechnet eine metrik-angepasste Fallback-Schrift gegen Layout-Sprünge.
 */

export const ibmPlexSans = IBM_Plex_Sans({
  variable: "--font-ibm-plex-sans",
  subsets: ["latin"],
  weight: ["600", "700"],
  display: "swap",
});

export const manrope = Manrope({
  variable: "--font-manrope-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  display: "swap",
});

/** Klassen für das Wurzel-Element einer öffentlichen Seite. */
export const landingFontClasses = `${ibmPlexSans.variable} ${manrope.variable} font-landing`;
