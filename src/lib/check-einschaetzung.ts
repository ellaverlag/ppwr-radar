import type {
  LinienErgebnis,
  LinienKontext,
  UnternehmenKontext,
} from "@/lib/rollen-engine";

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
}

const KERNROLLEN = ["erzeuger", "hersteller", "importeur"];

/** Engine-Kontexte aus den fünf Check-Antworten (Cookie-Format). */
export function kontexteAusCheckAntworten(
  antworten: Record<string, string | string[]>
): { unternehmen: UnternehmenKontext; linie: LinienKontext; taetigkeit: string[] } {
  const sitz = (typeof antworten.sitz === "string" ? antworten.sitz : "DE") as
    UnternehmenKontext["sitz"];
  const taetigkeit = Array.isArray(antworten.taetigkeit)
    ? antworten.taetigkeit
    : [];
  return {
    unternehmen: {
      sitz,
      niederlassungDE: sitz === "DE",
      kleinstunternehmen: false,
    },
    linie: {
      name: "Ihre Angaben",
      verpackungsart: Array.isArray(antworten.verpackungsart)
        ? antworten.verpackungsart
        : [],
      taetigkeit,
      marke: null,
      lieferantSitz: null,
      ersteBereitstellung: null,
      vertriebsweg: Array.isArray(antworten.vertriebsweg)
        ? antworten.vertriebsweg
        : [],
      istEndabnehmer: null,
      dienstleistungen: [],
      lebensmittelkontakt: antworten.lebensmittelkontakt === "ja",
    },
    taetigkeit,
  };
}

/**
 * Liefert nur die Einstufung; der zugehörige Aussagetext wird in der UI über
 * die Sprachdateien aufgelöst (CheckErgebnis.aussage.<stufe>).
 */
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

  return { stufe, unklar };
}
