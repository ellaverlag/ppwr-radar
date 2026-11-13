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
import {
  eudrMaterialAusText,
  evaluiereEudr,
  evaluiereVerpackung,
  leiteEudrKontextAb,
} from "../src/lib/rollen-engine.ts";

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

// Verkaufsverpackung fertig gekauft: Abfüller bleibt Erzeuger (A1) + Hersteller (B2)
const glasLinie = {
  ...linie,
  name: "Feinkost im Glas",
  verpackungsart: ["verkauf"],
  taetigkeit: ["befuellt_versiegelt", "liefert_an_endabnehmer"],
  vertriebsweg: ["stationaer_b2b_DE"],
};
const glas = evaluiereVerpackung(regeln, unternehmen, glasLinie, {
  ...basis,
  bezeichnung: "Schraubglas",
  art: "verkauf",
  form: "formstabil",
  bezug: "fertig_gekauft",
  lieferantSitz: "DE",
  marke: "eigene",
});
console.log(`\nSchraubglas (verkauf, formstabil, fertig_gekauft, DE, eigene Marke) – Linie „Feinkost im Glas“`);
console.log(`   Rollen:      ${glas.rollen_set.rollen.join(", ") || "–"}${glas.rollen_set.vorbehalt ? "  [Vorbehalt]" : ""}`);
console.log(`   Regeln:      ${glas.herleitung.map((h) => h.regel_id).join(" → ")}`);
console.log(
  `   Pflichten:   ${glas.pflichten
    .filter((p) => p.gilt !== "nein")
    .map((p) => `${p.key}=${p.gilt}`)
    .join(", ")}`
);
{
  const rollen = new Set(glas.rollen_set.rollen);
  erwarte(rollen.has("erzeuger") && rollen.has("hersteller"), "Glas: erzeuger + hersteller");
  erwarte(pflicht(glas, "konformitaetserklaerung") === "ja", "Glas: KE ja");
  erwarte(pflicht(glas, "lucid_registrierung") === "ja", "Glas: LUCID ja");
  erwarte(!glas.herleitung.some((h) => h.regel_id === "D1"), "Glas: D1 feuert nicht");
}

// ---------------------------------------------------------------------------
// EUDR-Strang (E1–E9)
// ---------------------------------------------------------------------------
console.log("\nEUDR-Strang");
const eudrFaelle = [
  {
    name: "Versandumschlag Papier, nur genutzt (Default aus fertig_gekauft)",
    eingaben: { material: "Papier", verwendung: null, bezug: null, rezyklat: null, erzeugnis: null },
    v: { bezug: "fertig_gekauft", lieferantSitz: "DE" },
    taetigkeit: [],
    groesse: null,
    erwartet: { status: "nicht_betroffen", rolle: null, regel: "E2", abgeleitet: "verwendung" },
  },
  {
    name: "Schrumpffolie PE",
    eingaben: { material: "PE-Folie", verwendung: "leer_verkauft", bezug: null, rezyklat: null, erzeugnis: null },
    v: { bezug: "selbst_hergestellt", lieferantSitz: null },
    taetigkeit: [],
    groesse: null,
    erwartet: { status: "nicht_betroffen", rolle: null, regel: "E1" },
  },
  {
    name: "Rezyklat-Karton leer verkauft",
    eingaben: { material: "Wellpappe", verwendung: "leer_verkauft", bezug: "fertig_gekauft_eu", rezyklat: "vollstaendig", erzeugnis: "neu" },
    v: { bezug: "fertig_gekauft", lieferantSitz: "DE" },
    taetigkeit: ["liefert_verpackungen_oder_material"],
    groesse: "mittel",
    erwartet: { status: "nicht_betroffen", rolle: null, regel: "E3" },
  },
  {
    name: "Kartons aus der Türkei, weiterverkauft (Bezug abgeleitet)",
    eingaben: { material: "Karton", verwendung: "leer_verkauft", bezug: null, rezyklat: "keins", erzeugnis: null },
    v: { bezug: "fertig_gekauft", lieferantSitz: "drittland" },
    taetigkeit: ["liefert_verpackungen_oder_material"],
    groesse: "klein",
    erwartet: { status: "betroffen", rolle: "eudr_marktteilnehmer", regel: "E4", frist: "2026-12-30", abgeleitet: "bezug" },
  },
  {
    name: "Faltschachtel aus EU-Papier (Kartonagenhersteller)",
    eingaben: { material: "Faltschachtel Karton", verwendung: "leer_verkauft", bezug: "selbst_hergestellt_aus_eu_vormaterial", rezyklat: "keins", erzeugnis: "neu" },
    v: { bezug: "selbst_hergestellt", lieferantSitz: null },
    taetigkeit: ["stellt_verpackung_physisch_her", "liefert_verpackungen_oder_material"],
    groesse: "kleinst",
    erwartet: { status: "betroffen", rolle: "eudr_nachgelagert", regel: "E5", frist: "2026-12-30" },
  },
  {
    name: "Großhandel leere Kartons aus Polen",
    eingaben: { material: "Karton", verwendung: "leer_verkauft", bezug: "fertig_gekauft_eu", rezyklat: "keins", erzeugnis: "neu" },
    v: { bezug: "fertig_gekauft", lieferantSitz: "EU" },
    taetigkeit: ["liefert_verpackungen_oder_material"],
    groesse: "gross",
    erwartet: { status: "betroffen", rolle: "eudr_haendler", regel: "E6", frist: "2026-12-30" },
  },
  {
    name: "Gebrauchte Europaletten verkauft",
    eingaben: { material: "Holzpalette", verwendung: "leer_verkauft", bezug: "fertig_gekauft_eu", rezyklat: "keins", erzeugnis: "gebraucht_oder_mehrweg_nach_erstnutzung" },
    v: { bezug: "fertig_gekauft", lieferantSitz: "DE" },
    taetigkeit: ["liefert_verpackungen_oder_material"],
    groesse: "mittel",
    erwartet: { status: "nicht_betroffen", rolle: null, regel: "E7" },
  },
  {
    name: "Teilrezyklierte Wellpappe, selbst hergestellt",
    eingaben: { material: "Wellpappe", verwendung: "leer_verkauft", bezug: "selbst_hergestellt_aus_eu_vormaterial", rezyklat: "teilweise", erzeugnis: "neu" },
    v: { bezug: "selbst_hergestellt", lieferantSitz: null },
    taetigkeit: ["liefert_verpackungen_oder_material"],
    groesse: "gross",
    erwartet: { status: "unklar", rolle: "eudr_nachgelagert", regel: "E8", frist: "2026-12-30" },
  },
  {
    name: "Naturkautschuk-Erzeugnis, Kleinunternehmen (Frist 30.06.2027)",
    eingaben: { material: "Naturkautschuk", verwendung: "leer_verkauft", bezug: "import_drittland", rezyklat: "keins", erzeugnis: "neu" },
    v: { bezug: "fertig_gekauft", lieferantSitz: "drittland" },
    taetigkeit: ["liefert_verpackungen_oder_material"],
    groesse: "klein",
    erwartet: { status: "betroffen", rolle: "eudr_marktteilnehmer", regel: "E4", frist: "2027-06-30" },
  },
  {
    name: "Selbst hergestellt, Verwendung offen (Rückfrage)",
    eingaben: { material: "Karton", verwendung: null, bezug: null, rezyklat: null, erzeugnis: null },
    v: { bezug: "selbst_hergestellt", lieferantSitz: null },
    taetigkeit: [],
    groesse: null,
    erwartet: { status: "unklar", rolle: null, frage: "verwendung" },
  },
  {
    name: "Verbund leer verkauft (Rückfrage Material)",
    eingaben: { material: "Getränkekarton (Verbund)", verwendung: "leer_verkauft", bezug: "fertig_gekauft_eu", rezyklat: "keins", erzeugnis: "neu" },
    v: { bezug: "fertig_gekauft", lieferantSitz: "DE" },
    taetigkeit: ["liefert_verpackungen_oder_material"],
    groesse: null,
    erwartet: { status: "unklar", rolle: null, frage: "material" },
  },
];

for (const f of eudrFaelle) {
  const k = leiteEudrKontextAb(f.eingaben, f.v, f.taetigkeit, f.groesse);
  const e = evaluiereEudr(regeln, k);
  console.log(`\n${f.name}`);
  console.log(`   Material:    ${e.material}; Status: ${e.status}${e.rolle ? ` (${e.rolle})` : ""}${e.vorbehalt ? "  [Vorbehalt]" : ""}`);
  console.log(`   Regeln:      ${e.herleitung.map((h) => h.regel_id).join(" → ") || "–"}; Frist: ${e.frist ?? "–"}`);
  console.log(`   Offen:       ${e.offeneFragen.join(", ") || "–"}; abgeleitet: ${e.abgeleitet.join(", ") || "–"}; Praxisfragen: ${e.praxisfragen.join(", ")}`);
  erwarte(e.status === f.erwartet.status, `${f.name}: Status ${f.erwartet.status}`);
  erwarte(e.rolle === f.erwartet.rolle, `${f.name}: Rolle ${f.erwartet.rolle}`);
  if (f.erwartet.regel) erwarte(e.herleitung.some((h) => h.regel_id === f.erwartet.regel), `${f.name}: Regel ${f.erwartet.regel}`);
  if (f.erwartet.frist) erwarte(e.frist === f.erwartet.frist, `${f.name}: Frist ${f.erwartet.frist}`);
  if (f.erwartet.frage) erwarte(e.offeneFragen.includes(f.erwartet.frage), `${f.name}: Rückfrage ${f.erwartet.frage}`);
  if (f.erwartet.abgeleitet) erwarte(e.abgeleitet.includes(f.erwartet.abgeleitet), `${f.name}: ${f.erwartet.abgeleitet} abgeleitet`);
  erwarte(e.vorbehalt, `${f.name}: Vorbehalt (Regeln im Entwurf)`);
}

// Material-Mapping
const mapping = [
  ["Papier/Karton", "papier_pappe"],
  ["Holz", "holz"],
  ["Kunststoff (PP)", "nicht_relevant"],
  ["Glas", "nicht_relevant"],
  ["Bambus", "nicht_relevant"],
  ["Papier mit PE-Beschichtung", "verbund"],
  ["", "unbekannt"],
];
for (const [text, soll] of mapping) {
  erwarte(eudrMaterialAusText(text) === soll, `Material „${text}“ → ${soll}`);
}

console.log(fehler === 0 ? "\nEngine-Check bestanden." : `\nEngine-Check: ${fehler} Abweichung(en).`);
process.exit(fehler === 0 ? 0 : 1);
