/**
 * Webinare-Inhalte – REDAKTIONELL PER COMMIT GEPFLEGT (kein CMS).
 *
 * Neue Einträge einfach ergänzen: „Nächste Webinare“ oben, Aufzeichnungen
 * unten (neueste zuerst). Ein Eintrag hat ENTWEDER embed_url (Aufzeichnung,
 * wird per Klick nachgeladen – kein Drittanbieter-Request beim Seitenaufruf)
 * ODER anmelde_url (kommender Termin mit Anmeldung) oder keins von beiden
 * (reine Ankündigung).
 */

export interface Webinar {
  titel: string;
  beschreibung?: string;
  /** ISO-Datum (JJJJ-MM-TT); leer bei „Termin folgt“. */
  datum?: string;
  /** z. B. "60 Min." */
  dauer?: string;
  /** Aufzeichnung: Embed-Player (StreamYard o. ä.), Klick-nachgeladen. */
  embed_url?: string;
  /** Kommender Termin: Anmeldelink. */
  anmelde_url?: string;
  badge: string;
  /** Einordnender Hinweis unter dem Titel (z. B. Rechtsstand der Aufnahme). */
  hinweis?: string;
  /** Optionales eigenes Standbild (Pfad unter /public, z. B. eine Folie). */
  thumbnail?: string;
}

export const NAECHSTE_WEBINARE: Webinar[] = [
  {
    titel: "Quartals-Webinar für PPWR|ready-Kunden",
    beschreibung:
      "Termin und Thema werden hier und per E-Mail angekündigt.",
    badge: "Ankündigung",
  },
];

export const AUFZEICHNUNGEN: Webinar[] = [
  {
    titel:
      "Die neue EU-Verpackungsverordnung (PPWR) kommt – Sind Sie vorbereitet?",
    datum: "2025-12-09",
    badge: "Aufzeichnung · Dezember 2025",
    hinweis:
      "Diese Aufzeichnung entstand vor Geltungsbeginn und Verkündung des VerpackDG – die Grundlagen gelten fort, den aktuellen Stand finden Sie in Wissen und Radar.",
    embed_url: "https://streamyard.com/e/pf4e3fb5kmug",
    // Gestaltetes Standbild im Token-Design (1280×720); eine echte Folie
    // kann es jederzeit ersetzen: Datei tauschen oder Pfad hier ändern.
    thumbnail: "/webinare/webinar-ppwr-2025-12.png",
  },
];
