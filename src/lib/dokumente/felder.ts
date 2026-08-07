import "server-only";

import type { FeldMap } from "@/lib/dokumente/renderer";
import type { HerleitungsEintrag, RollenSet } from "@/lib/rollen-engine";

/**
 * Feld-Auflösung für die Generator-Templates v0.1.
 *
 * Grundlage sind die Platzhalter der vier Template-Master (extrahiert aus
 * content/templates/). Das separate Platzhalter-Mapping-Dokument
 * (Platzhalter-Mapping_Templates_v0_1.md) lag bei der Umsetzung noch nicht
 * in content/ – die Zuordnung hier ist aus den Templates selbst abgeleitet
 * und beim Eintreffen des Mappings gegenzuprüfen.
 *
 * Alle Labels sind bewusst fest deutsch: Die erzeugten Dokumente sind
 * deutsche Rechtsdokumente, unabhängig von der UI-Sprache.
 *
 * Leere NUTZER-Daten (z. B. fehlende Kennung) werden als sichtbare
 * Ausfülllücke gerendert – ein Fehler entsteht nur bei Platzhaltern ohne
 * Mapping (RendererFehler).
 */

const LUECKE = "____________________ [NUTZER-PFLICHT: bitte ergänzen]";

const SITZ_LABELS: Record<string, string> = {
  DE: "Deutschland",
  EU: "anderer EU-/EWR-Mitgliedstaat",
  drittland: "Drittland (außerhalb EU/EWR)",
};

const TYP_LABELS: Record<string, string> = {
  verkauf: "Verkaufsverpackung",
  um: "Umverpackung",
  transport: "Transportverpackung",
  ecommerce: "Verpackung für den elektronischen Handel",
  service: "Serviceverpackung",
  primaerproduktion: "Primärproduktionsverpackung",
  unbestimmt: "Verpackung (Typ noch nicht bestimmt)",
};

const ROLLEN_LABELS: Record<string, string> = {
  erzeuger: "Erzeuger",
  hersteller: "Hersteller",
  importeur: "Importeur",
  vertreiber: "Vertreiber",
  endvertreiber: "Endvertreiber",
  fulfillment_dienstleister: "Fulfillment-Dienstleister",
  lieferant: "Lieferant",
};

const ROLLEN_KEYS: Record<string, string> = {
  erzeuger: "erzeuger",
  hersteller: "hersteller",
  importeur: "importeur",
  vertreiber: "vertreiber",
  endvertreiber: "endvertreiber",
  fulfillment: "fulfillment_dienstleister",
  lieferant: "lieferant",
};

export interface ProfilZeile {
  firmenname: string | null;
  strasse: string | null;
  hausnummer: string | null;
  plz: string | null;
  ort: string | null;
  land: string | null;
  sitz: string | null;
  lucid_nummer: string | null;
  war_verpackg_registriert: boolean | null;
  zeichnungsberechtigter_name: string | null;
  zeichnungsberechtigter_funktion: string | null;
  bevollmaechtigter_art17_name: string | null;
  bevollmaechtigter_art17_anschrift: string | null;
}

export interface VerpackungZeile {
  id: string;
  bezeichnung: string;
  produktlinie: string | null;
  verpackungstyp: string;
  materialien: string[];
  lebensmittelkontakt: boolean;
  mehrweg: boolean;
  eindeutige_kennung: string | null;
  fuellgut: string | null;
  zusatzangaben: string | null;
  techdoku_referenz: string | null;
  weitere_rechtsakte: string | null;
  lieferanten: unknown;
}

export interface RollenErgebnisZeile {
  produktlinie: string;
  rollen_set: RollenSet;
  herleitung: HerleitungsEintrag[];
}

function formatDatum(iso: string | Date): string {
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const oder = (wert: string | null | undefined, fallback = LUECKE): string =>
  wert && wert.trim() !== "" ? wert : fallback;

function typLabel(verpackungstyp: string): string {
  return verpackungstyp
    .split(",")
    .map((teil) => TYP_LABELS[teil.trim()] ?? teil.trim())
    .filter(Boolean)
    .join(" / ");
}

function lieferant1(lieferanten: unknown): string {
  if (Array.isArray(lieferanten) && lieferanten.length > 0) {
    const erster = lieferanten[0];
    if (typeof erster === "string") return erster;
    if (erster && typeof erster === "object") {
      const o = erster as Record<string, unknown>;
      const name = o.name ?? o.firma ?? o.firmenname;
      if (typeof name === "string" && name) return name;
    }
  }
  return LUECKE;
}

/** rollen.*-Felder aus dem Rollen-Ergebnis der passenden Produktlinie. */
function rollenFelder(ergebnis: RollenErgebnisZeile | null): FeldMap {
  const felder: FeldMap = {};
  const set = ergebnis?.rollen_set;
  const herleitung = ergebnis?.herleitung ?? [];
  const rollen = new Set(set?.rollen ?? []);
  const pflichten = new Set(set?.pflichten ?? []);

  const eintragFuer = (rolle: string): HerleitungsEintrag | undefined =>
    herleitung.find((h) => h.ergebnis.includes(rolle));

  for (const [kurz, rolle] of Object.entries(ROLLEN_KEYS)) {
    const aktiv = rollen.has(rolle);
    const eintrag = eintragFuer(rolle);
    felder[`rollen.ist_${kurz}`] = aktiv;
    felder[`rollen.ist_${kurz}_label`] = aktiv ? "Ja" : "Nein";
    felder[`rollen.fundstelle_${kurz}`] = aktiv
      ? (eintrag?.fundstelle_primaer ?? "siehe Rollen-Ergebnis")
      : "—";
    felder[`rollen.herleitung_${kurz}`] = aktiv
      ? (eintrag?.erlaeuterung ?? "siehe Rollen-Ergebnis im Onboarding")
      : "entfällt";
  }

  const brauchtEhv = pflichten.has("bevollmaechtigter_ehv");
  const ehvEintrag = eintragFuer("bevollmaechtigter_ehv");
  felder["rollen.braucht_ehv_bevollmaechtigten"] = brauchtEhv;
  felder["rollen.braucht_ehv_bevollmaechtigten_label"] = brauchtEhv
    ? "Ja"
    : "Nein";
  felder["rollen.herleitung_ehv"] = brauchtEhv
    ? `${ehvEintrag?.erlaeuterung ?? "Pflicht aus dem Rollen-Ergebnis"} (${ehvEintrag?.fundstelle_primaer ?? "Art. 45 Abs. 3 VO (EU) 2025/40"})`
    : "entfällt";

  felder["rollen.rollen_set_label"] =
    [...rollen].map((r) => ROLLEN_LABELS[r] ?? r).join(", ") ||
    "keine Rolle ermittelt";
  // Kernrollen tragen die Konformitäts-/EPR-Verantwortung → hohes Risiko
  felder["rollen.risiko_hoch"] = ["erzeuger", "hersteller", "importeur"].some(
    (r) => rollen.has(r)
  );
  felder["rollen.hat_leitfaden_bezug"] = herleitung.some((h) =>
    (h.fundstelle_sekundaer ?? "").includes("Leitfaden")
  );
  // Gap-Liste kommt aus der Status-Analyse (Folgepaket) – bis dahin Hinweis
  felder["rollen.gap_liste"] =
    "Die detaillierte Gap-Analyse folgt mit der Status-Analyse in PPWR Radar.";

  return felder;
}

export function baueFelder({
  profil,
  verpackung,
  rollenErgebnis,
  docNummer,
  templateVersion,
  templateRechtsstand,
  cattwykHinweis,
}: {
  profil: ProfilZeile;
  verpackung: VerpackungZeile;
  rollenErgebnis: RollenErgebnisZeile | null;
  docNummer: string;
  templateVersion: string;
  templateRechtsstand: string;
  cattwykHinweis: string | null;
}): FeldMap {
  const materialLabel =
    verpackung.materialien.filter(Boolean).join(", ") ||
    "____________________ [NUTZER-PFLICHT: Material angeben]";

  return {
    // profil.*
    "profil.firmenname": oder(profil.firmenname),
    "profil.strasse": oder(profil.strasse),
    "profil.hausnummer": oder(profil.hausnummer, ""),
    "profil.plz": oder(profil.plz),
    "profil.ort": oder(profil.ort),
    "profil.land": oder(profil.land, "Deutschland"),
    "profil.sitz_label": SITZ_LABELS[profil.sitz ?? ""] ?? oder(profil.sitz),
    "profil.lucid_nummer": profil.lucid_nummer ?? "",
    "profil.war_verpackg_registriert": Boolean(profil.war_verpackg_registriert),
    "profil.zeichnungsberechtigter_name": oder(
      profil.zeichnungsberechtigter_name
    ),
    "profil.zeichnungsberechtigter_funktion": oder(
      profil.zeichnungsberechtigter_funktion
    ),
    "profil.bevollmaechtigter_art17_vorhanden": Boolean(
      profil.bevollmaechtigter_art17_name
    ),
    "profil.bevollmaechtigter_art17_name": oder(
      profil.bevollmaechtigter_art17_name,
      ""
    ),
    "profil.bevollmaechtigter_art17_anschrift": oder(
      profil.bevollmaechtigter_art17_anschrift,
      ""
    ),

    // verpackung.*
    "verpackung.doc_nummer": docNummer,
    "verpackung.bezeichnung": verpackung.bezeichnung,
    "verpackung.produktlinie":
      verpackung.produktlinie ?? verpackung.bezeichnung,
    "verpackung.eindeutige_kennung": oder(verpackung.eindeutige_kennung),
    "verpackung.fuellgut": oder(verpackung.fuellgut),
    "verpackung.typ_label": typLabel(verpackung.verpackungstyp),
    "verpackung.material_label": materialLabel,
    "verpackung.lebensmittelkontakt": verpackung.lebensmittelkontakt,
    "verpackung.lebensmittelkontakt_label": verpackung.lebensmittelkontakt
      ? "Ja"
      : "Nein",
    "verpackung.mehrweg": verpackung.mehrweg,
    "verpackung.mehrweg_label": verpackung.mehrweg ? "Ja" : "Nein",
    "verpackung.zusatzangaben": verpackung.zusatzangaben ?? "",
    "verpackung.techdoku_referenz": oder(
      verpackung.techdoku_referenz,
      "____________________"
    ),
    "verpackung.weitere_rechtsakte_vorhanden": Boolean(
      verpackung.weitere_rechtsakte
    ),
    "verpackung.lieferant_1": lieferant1(verpackung.lieferanten),

    // dokument.*
    "dokument.erstellt_am": formatDatum(new Date()),
    "dokument.rechtsstand": formatDatum(templateRechtsstand),
    "dokument.version": templateVersion,

    // app_config (optional – fehlender Wert lässt die Zeile entfallen)
    "cattwyk.erstgespraech_hinweis": cattwykHinweis,

    // rollen.*
    ...rollenFelder(rollenErgebnis),
  };
}
