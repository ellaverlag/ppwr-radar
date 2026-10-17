/**
 * Engine-Check der Verpackungs-Ebene (ohne Test-Framework, ohne DB).
 *
 * Aufruf: node scripts/engine-check.mjs
 * Node ≥ 22.18 strippt die Typen der Engine direkt (kein tsx nötig).
 * Regeln kommen aus scripts/fixtures/rollen_regeln.json (Dummy-Texte,
 * echte IDs/Prioritäten/Flags) – geprüft wird die Logik, nicht der Inhalt.
 */

import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { evaluiereVerpackung } from "../src/lib/rollen-engine.ts";

const hier = dirname(fileURLToPath(import.meta.url));
const regeln = JSON.parse(
  readFileSync(resolve(hier, "fixtures/rollen_regeln.json"), "utf8")
);

const unternehmen = { sitz: "DE", niederlassungDE: true, kleinstunternehmen: false };

// Verlag: Zeitschriften an Leser (Verkaufs- und Transportverpackung,
// befüllt, liefert an Endabnehmer, Online-Versand an Endkunden in DE)
const linie = {
  name: "Zeitschriften an Leser",
  verpackungsart: ["verkauf", "transport"],
  taetigkeit: ["befuellt_versiegelt", "liefert_an_endabnehmer"],
  marke: "eigene",
  lieferantSitz: "DE",
  ersteBereitstellung: "ja",
  vertriebsweg: ["online_endkunden_DE"],
  istEndabnehmer: "nein",
  dienstleistungen: [],
  lebensmittelkontakt: false,
};

const basis = { lebensmittelkontakt: false, mehrweg: false };
const verpackungen = [
  {
    ...basis,
    bezeichnung: "Versandumschlag",
    art: "transport",
    form: "formstabil",
    bezug: "fertig_gekauft",
    lieferantSitz: "DE",
    marke: "keine",
  },
  {
    ...basis,
    bezeichnung: "Schrumpffolie",
    art: "transport",
    form: "flexibel",
    bezug: "selbst_hergestellt",
    lieferantSitz: null,
    marke: "keine",
  },
  {
    ...basis,
    bezeichnung: "Karton aus Polen",
    art: "transport",
    form: "formstabil",
    bezug: "fertig_gekauft",
    lieferantSitz: "EU",
    marke: "keine",
  },
];

let fehler = 0;
function erwarte(bedingung, text) {
  if (!bedingung) {
    fehler += 1;
    console.log(`   FEHLT: ${text}`);
  }
}
const pflicht = (e, key) => e.pflichten.find((p) => p.key === key)?.gilt;

for (const v of verpackungen) {
  const e = evaluiereVerpackung(regeln, unternehmen, linie, v, verpackungen.length);
  console.log(`\n${v.bezeichnung} (${v.art}, ${v.form}, ${v.bezug}${v.lieferantSitz ? ", " + v.lieferantSitz : ""})`);
  console.log(`   Rollen:      ${e.rollen_set.rollen.join(", ") || "–"}${e.rollen_set.vorbehalt ? "  [Vorbehalt]" : ""}${e.rollen_set.unklar ? "  [unklar]" : ""}`);
  console.log(`   Regeln:      ${e.herleitung.map((h) => h.regel_id).join(" → ")}`);
  console.log(`   Entlastung:  ${e.rollen_set.entlastungen.join(", ") || "–"}`);
  console.log(
    `   Pflichten:   ${e.pflichten
      .filter((p) => p.gilt !== "nein")
      .map((p) => `${p.key}=${p.gilt}`)
      .join(", ")}`
  );
  console.log(`   Hinweise:    ${e.hinweisKeys.join(", ") || "–"}`);

  const rollen = new Set(e.rollen_set.rollen);
  if (v.bezeichnung === "Versandumschlag") {
    erwarte(rollen.has("vertreiber"), "Rolle vertreiber");
    erwarte(rollen.has("endvertreiber"), "Rolle endvertreiber");
    erwarte(!rollen.has("hersteller"), "keine Rolle hersteller");
    erwarte(!rollen.has("erzeuger"), "keine Rolle erzeuger");
    erwarte(pflicht(e, "konformitaetserklaerung") === "nein", "Konformitätserklärung nein");
    erwarte(pflicht(e, "lucid_registrierung") === "nein", "LUCID nein");
    erwarte(pflicht(e, "lieferant_pruefen") === "ja", "Lieferant prüfen ja");
    erwarte(e.hinweisKeys.includes("vertreiber_lieferant_pruefen"), "Hinweis vertreiber_lieferant_pruefen");
  }
  if (v.bezeichnung === "Schrumpffolie") {
    erwarte(rollen.has("erzeuger") && rollen.has("hersteller"), "Rollen erzeuger + hersteller");
    erwarte(pflicht(e, "konformitaetserklaerung") === "ja", "Konformitätserklärung ja");
    erwarte(pflicht(e, "lucid_registrierung") === "ja", "LUCID ja");
    erwarte(e.hinweisKeys.includes("folie_selbst_angewendet"), "Hinweis folie_selbst_angewendet");
    erwarte(e.hinweisKeys.includes("erzeuger_mehrere_bestandteile"), "Hinweis erzeuger_mehrere_bestandteile");
  }
  if (v.bezeichnung === "Karton aus Polen") {
    erwarte(rollen.has("hersteller"), "Rolle hersteller");
    erwarte(!rollen.has("erzeuger"), "keine Rolle erzeuger");
    erwarte(pflicht(e, "lucid_registrierung") === "ja", "LUCID ja");
    erwarte(e.hinweisKeys.includes("lieferant_ausland_formstabil"), "Hinweis lieferant_ausland_formstabil");
  }
}

// Lohnfertigung: keine Rolle, unklar
const lohn = evaluiereVerpackung(regeln, unternehmen, linie, {
  ...basis,
  bezeichnung: "Beilage durch Druckerei",
  art: "transport",
  form: "flexibel",
  bezug: "lohnfertigung",
  lieferantSitz: "DE",
  marke: "keine",
});
console.log(`\nBeilage durch Druckerei (lohnfertigung)`);
console.log(`   unklar=${lohn.rollen_set.unklar}, Rollen: ${lohn.rollen_set.rollen.join(", ") || "–"}`);
erwarte(lohn.rollen_set.unklar && lohn.rollen_set.rollen.length === 0, "D5: unklar ohne Rollen");
erwarte(pflicht(lohn, "konformitaetserklaerung") === "unklar", "D5: KE unklar");

console.log(fehler === 0 ? "\nEngine-Check bestanden." : `\nEngine-Check: ${fehler} Abweichung(en).`);
process.exit(fehler === 0 ? 0 : 1);
