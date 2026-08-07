/**
 * Template-Renderer für die Generator-Master (pur, testbar).
 *
 * Syntax (Mustache-Subset gemäß Templates v0.1):
 *   {{pfad.feld}}                      – Wert einsetzen
 *   {{#wenn bedingung}} … {{/wenn}}    – Block nur bei wahrem Wert
 *   {{#wenn nicht bedingung}} … {{/wenn}} – Block nur bei falschem Wert
 *
 * Regeln:
 * - Unaufgelöste Pflicht-Platzhalter führen zu einem Fehler – nie zu
 *   leeren Strings im Dokument.
 * - Optionale Namensräume (app_config-Werte wie cattwyk.*): fehlt der
 *   Wert, entfällt die komplette Zeile des Platzhalters.
 * - HTML-Kommentare (Generator-Anmerkungen) werden vor der Ausgabe
 *   entfernt.
 */

export type FeldWert = string | boolean | null | undefined;
export type FeldMap = Record<string, FeldWert>;

/** Namensräume, deren Fehlen kein Fehler ist (Block/Zeile entfällt). */
const OPTIONALE_PRAEFIXE = ["cattwyk."];

const istWahr = (wert: FeldWert): boolean =>
  wert !== undefined && wert !== null && wert !== false && wert !== "";

export class RendererFehler extends Error {
  constructor(public readonly fehlend: string[]) {
    super(`Unaufgelöste Pflicht-Platzhalter: ${fehlend.join(", ")}`);
    this.name = "RendererFehler";
  }
}

/** {{#wenn …}}-Blöcke rekursiv auflösen (innerste zuerst). */
function loeseBedingungen(text: string, felder: FeldMap): string {
  const muster =
    /\{\{#wenn( nicht)? ([\w.]+)\}\}([\s\S]*?)\{\{\/wenn\}\}/g;
  let vorher = text;
  for (let tiefe = 0; tiefe < 10; tiefe++) {
    const nachher = vorher.replace(muster, (_, negiert, pfad, inhalt) => {
      const wert = felder[pfad];
      const erfuellt = negiert ? !istWahr(wert) : istWahr(wert);
      return erfuellt ? inhalt : "";
    });
    if (nachher === vorher) break;
    vorher = nachher;
  }
  return vorher;
}

export function rendereTemplate(
  template: string,
  felder: FeldMap
): { text: string; fehlend: string[] } {
  // Generator-Anmerkungen entfernen
  let text = template.replace(/<!--[\s\S]*?-->/g, "");

  text = loeseBedingungen(text, felder);

  const fehlend = new Set<string>();
  text = text
    .split("\n")
    .map((zeile) => {
      let optionalLeer = false;
      const ersetzt = zeile.replace(/\{\{([\w.]+)\}\}/g, (_, pfad: string) => {
        const wert = felder[pfad];
        if (wert === undefined || wert === null || wert === "") {
          if (OPTIONALE_PRAEFIXE.some((p) => pfad.startsWith(p))) {
            optionalLeer = true;
            return "";
          }
          fehlend.add(pfad);
          return `{{${pfad}}}`;
        }
        return typeof wert === "boolean" ? (wert ? "Ja" : "Nein") : wert;
      });
      // Zeile mit fehlendem optionalem Wert entfällt komplett
      return optionalLeer && ersetzt.trim() === "" ? null : ersetzt;
    })
    .filter((zeile): zeile is string => zeile !== null)
    .join("\n");

  if (fehlend.size > 0) {
    throw new RendererFehler([...fehlend]);
  }

  // Mehrfache Leerzeilen aus entfallenen Blöcken zusammenziehen
  text = text.replace(/\n{3,}/g, "\n\n").trim();
  // Entfallene Bedingungszeilen dürfen Markdown-Tabellen nicht spalten:
  // Leerzeilen zwischen zwei Tabellenzeilen wieder schließen
  for (let i = 0; i < 20; i++) {
    const geschlossen = text.replace(/(\|[^\n]*)\n\n+(?=\|)/g, "$1\n");
    if (geschlossen === text) break;
    text = geschlossen;
  }
  return { text, fehlend: [] };
}

/**
 * Liefert den Dokumentkörper für Dateien (docx/PDF): alles ab der ersten
 * ##-Überschrift – der Meta-Kopf (H1, Nutzer-Hinweisblock) gehört nicht
 * ins ausgestellte Dokument, wird aber in der Vorschau angezeigt.
 */
export function dokumentKoerper(gerendert: string): string {
  const index = gerendert.search(/^## /m);
  return index >= 0 ? gerendert.slice(index).trim() : gerendert;
}

/** Nutzer-Hinweisblock (Blockquote vor dem Dokumentkörper) für die Vorschau. */
export function hinweisBlock(gerendert: string): string | null {
  const koerperStart = gerendert.search(/^## /m);
  const kopf = koerperStart >= 0 ? gerendert.slice(0, koerperStart) : "";
  const zeilen = kopf
    .split("\n")
    .filter((z) => z.trim().startsWith(">"))
    .map((z) => z.replace(/^\s*>\s?/, ""));
  const text = zeilen.join("\n").trim();
  return text || null;
}
