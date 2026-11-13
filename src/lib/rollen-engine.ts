/**
 * Rollen-Engine (v0.91) – wertet die 18 Regeln aus rollen_regeln je
 * Produktlinie aus. Die WENN-Bedingungen der DSL sind hier als typisierte
 * Funktionen implementiert (Schlüssel = regel_id); Prioritäten, Texte,
 * Fundstellen und Flags kommen aus der Datenbank.
 *
 * Pur und ohne IO – das Laden der Regeln und das Persistieren der
 * Ergebnisse übernimmt lib/rollen-service.ts.
 */

/**
 * v0.91 (Rollen-Engine A–C, Z1) + Verpackungsregeln D1–D5 (Verpackungs-Ebene,
 * v0.92) + EUDR-Strang E1–E9 (v0.93, eigener Strang evaluiereEudr).
 */
export const ENGINE_VERSION = "v0.93";

// ---------------------------------------------------------------------------
// Eingaben
// ---------------------------------------------------------------------------

export interface RegelRow {
  regel_id: string;
  block: string;
  prioritaet: number;
  wenn_bedingung: string;
  dann_rollen: string;
  fundstelle_primaer: string;
  fundstelle_sekundaer: string | null;
  erlaeuterung: string | null;
  flag: string | null;
  aktiv: boolean;
  review_status: string;
  rechtsstand?: string;
}

export interface UnternehmenKontext {
  sitz: "DE" | "EU" | "drittland";
  niederlassungDE: boolean;
  kleinstunternehmen: boolean;
}

export interface LinienKontext {
  name: string;
  verpackungsart: string[];
  taetigkeit: string[];
  marke: "eigene" | "fremde" | "keine" | null;
  lieferantSitz: "DE" | "EU" | "drittland" | "selbst" | null;
  ersteBereitstellung: "ja" | "vorgelagert" | "unklar" | null;
  vertriebsweg: string[];
  istEndabnehmer: "ja" | "nein" | null;
  dienstleistungen: string[];
  lebensmittelkontakt: boolean | null;
}

// ---------------------------------------------------------------------------
// Ergebnis
// ---------------------------------------------------------------------------

export interface HerleitungsEintrag {
  regel_id: string;
  ergebnis: string[];
  erlaeuterung: string | null;
  fundstelle_primaer: string;
  fundstelle_sekundaer: string | null;
  vorbehalt: boolean;
}

export interface RollenSet {
  rollen: string[];
  pflichten: string[];
  entlastungen: string[];
  unklar: boolean;
  vorbehalt: boolean;
}

export interface LinienErgebnis {
  produktlinie: string;
  rollen_set: RollenSet;
  herleitung: HerleitungsEintrag[];
}

// ---------------------------------------------------------------------------
// Verpackungs-Ebene (v2.4): eine Produktlinie hat 0..n Verpackungen, je
// Verpackung ein eigenes Rollen-Set (Regeln A–C auf dem abgeleiteten
// Linien-Kontext + Regeln D1–D5) und eine Pflichten-Matrix.
// ---------------------------------------------------------------------------

export type VerpackungArt =
  | "verkauf"
  | "um"
  | "transport"
  | "ecommerce"
  | "service"
  | "primaerproduktion";

export interface VerpackungKontext {
  bezeichnung: string;
  art: VerpackungArt;
  form: "formstabil" | "flexibel";
  bezug:
    | "fertig_gekauft"
    | "selbst_zusammengefuegt"
    | "selbst_hergestellt"
    | "lohnfertigung";
  lieferantSitz: "DE" | "EU" | "drittland" | null;
  marke: "eigene" | "fremde" | "keine";
  lebensmittelkontakt: boolean;
  mehrweg: boolean;
}

export interface PflichtEintrag {
  key: string;
  /** Deutsches Anzeige-Label (Fallback; die UI löst Labels.verpackungPflichten.* auf). */
  label: string;
  gilt: "ja" | "nein" | "unklar";
  anforderung_nr: number | null;
  grund: string;
}

export interface VerpackungErgebnis {
  bezeichnung: string;
  rollen_set: RollenSet;
  pflichten: PflichtEintrag[];
  hinweisKeys: string[];
  herleitung: HerleitungsEintrag[];
}

// ---------------------------------------------------------------------------
// Auswertungskontext
// ---------------------------------------------------------------------------

interface Ctx {
  u: UnternehmenKontext;
  l: LinienKontext;
  rollen: Set<string>;
  pflichten: Set<string>;
  entlastungen: Set<string>;
  gefeuert: Set<string>;
}

const hat = (liste: string[], ...werte: string[]) =>
  werte.some((w) => liste.includes(w));

/** Abgeleitete Variable: bringt die Linie überhaupt Verpackungen in Verkehr? */
function bringtInVerkehr(ctx: Ctx): boolean {
  return (
    hat(
      ctx.l.taetigkeit,
      "befuellt_versiegelt",
      "herstellen_lassen",
      "kauft_verpackte_ware",
      "importiert_drittland",
      "liefert_an_endabnehmer",
      "liefert_verpackungen_oder_material",
      "stellt_verpackung_physisch_her"
    ) || ctx.l.vertriebsweg.length > 0
  );
}

/** Abgeleitet: EU-Rechtspersönlichkeit (Sitz EU/DE oder eigene DE-Gesellschaft). */
function euRechtspersoenlichkeit(ctx: Ctx): boolean {
  return ctx.u.sitz !== "drittland" || ctx.u.niederlassungDE;
}

/** Abgeleitet: Linie handhabt LEERE Verpackungen (Herstellung/Lieferung). */
function zustandLeer(ctx: Ctx): boolean {
  return hat(
    ctx.l.taetigkeit,
    "stellt_verpackung_physisch_her",
    "liefert_verpackungen_oder_material"
  );
}

/** A2 ohne die NOT-A3-Klausel – wird von A3 referenziert. */
function a2Basis(ctx: Ctx): boolean {
  return (
    ctx.l.marke === "eigene" && hat(ctx.l.taetigkeit, "herstellen_lassen")
  );
}

// ---------------------------------------------------------------------------
// Die typisierten WENN-Bedingungen (regel_id → Prädikat).
// Reihenfolge der Auswertung bestimmt das Prioritätsfeld der DB
// (A3 mit Priorität 5 vor A1/A2; „NOT regel A3“ via ctx.gefeuert).
// ---------------------------------------------------------------------------

type Wirkung = {
  rollen?: string[];
  pflichten?: string[];
  entlastungen?: string[];
};

const REGELN: Record<string, { wenn: (ctx: Ctx) => boolean; dann: Wirkung }> = {
  // Output-Prinzip: keine Bedingung, keine Rolle – reine Systematik (Z1).
  Z1: { wenn: () => false, dann: {} },

  // Kleinstunternehmen-Ausnahme: Lieferant wird Erzeuger, Markeninhaber entlastet
  A3: {
    wenn: (ctx) =>
      a2Basis(ctx) &&
      ctx.u.kleinstunternehmen &&
      ctx.u.sitz === "DE" &&
      ctx.l.lieferantSitz === "DE",
    dann: { entlastungen: ["lieferant_als_erzeuger"] },
  },

  // Abfüller-Regel: Verkaufs-/Umverpackung befüllt + in Verkehr gebracht
  A1: {
    wenn: (ctx) =>
      hat(ctx.l.verpackungsart, "verkauf", "um") &&
      hat(ctx.l.taetigkeit, "befuellt_versiegelt") &&
      bringtInVerkehr(ctx) &&
      !ctx.gefeuert.has("A3"),
    dann: { rollen: ["erzeuger"] },
  },

  // Leere Transport-/Service-/Primärproduktionsverpackung, Erst-Bereitstellung DE
  B1: {
    wenn: (ctx) =>
      hat(ctx.l.verpackungsart, "transport", "service", "primaerproduktion") &&
      zustandLeer(ctx) &&
      ctx.u.sitz === "DE" &&
      ctx.l.ersteBereitstellung === "ja",
    dann: { rollen: ["hersteller"] },
  },

  // Importeur: Drittlandsimport mit EU-Rechtspersönlichkeit
  C1: {
    wenn: (ctx) =>
      hat(ctx.l.taetigkeit, "importiert_drittland") &&
      bringtInVerkehr(ctx) &&
      euRechtspersoenlichkeit(ctx),
    dann: { rollen: ["importeur"] },
  },

  // Art.-21-Zurechnung: Importeur/Vertreiber mit Eigenmarke wird Erzeuger.
  // NOT A3: Die Kleinstunternehmen-Ausnahme (Nr. 13 lit. b) entlastet den
  // Markeninhaber gezielt – die Zurechnung darf sie nicht wieder aushebeln.
  A5: {
    wenn: (ctx) =>
      (ctx.rollen.has("importeur") || ctx.rollen.has("vertreiber")) &&
      ctx.l.marke === "eigene" &&
      !ctx.gefeuert.has("A3"),
    dann: { rollen: ["erzeuger"] },
  },

  // Markenkriterium: unter eigener Marke entwickeln/herstellen lassen
  A2: {
    wenn: (ctx) => a2Basis(ctx) && !ctx.gefeuert.has("A3"),
    dann: { rollen: ["erzeuger"] },
  },

  // Verpackte Produkte: Erst-Bereitsteller in DE ist Hersteller
  B2: {
    wenn: (ctx) =>
      hat(ctx.l.verpackungsart, "verkauf", "um", "ecommerce") &&
      ctx.u.sitz === "DE" &&
      ctx.l.ersteBereitstellung === "ja",
    dann: { rollen: ["hersteller"] },
  },

  // Auffangrolle Vertreiber (nicht neben Erzeuger/Importeur)
  C2: {
    wenn: (ctx) =>
      bringtInVerkehr(ctx) &&
      !ctx.rollen.has("erzeuger") &&
      !ctx.rollen.has("importeur"),
    dann: { rollen: ["vertreiber"] },
  },

  // Physischer Hersteller leerer Gebrauchsverpackungen ohne Nutzer-Branding
  A4: {
    wenn: (ctx) =>
      hat(ctx.l.verpackungsart, "transport", "service", "primaerproduktion") &&
      ctx.l.marke !== "fremde" &&
      hat(ctx.l.taetigkeit, "stellt_verpackung_physisch_her"),
    dann: { rollen: ["erzeuger"] },
  },

  // Fernabsatz aus dem Ausland direkt an Endabnehmer in DE
  B3: {
    wenn: (ctx) =>
      hat(ctx.l.vertriebsweg, "online_endkunden_DE") &&
      (ctx.u.sitz === "EU" || ctx.u.sitz === "drittland"),
    dann: { rollen: ["hersteller"], pflichten: ["bevollmaechtigter_ehv"] },
  },

  // Endvertreiber als Zusatzrolle
  C3: {
    wenn: (ctx) => hat(ctx.l.taetigkeit, "liefert_an_endabnehmer"),
    dann: { rollen: ["endvertreiber"] },
  },

  // Auspacker-Auffangtatbestand (lit. e)
  B4: {
    wenn: (ctx) =>
      hat(ctx.l.taetigkeit, "packt_aus") &&
      ctx.l.istEndabnehmer === "nein" &&
      !ctx.rollen.has("hersteller"),
    dann: { rollen: ["hersteller"] },
  },

  // Fulfillment-Dienstleister: ≥2 Dienstleistungen ohne Eigentum
  C4: {
    wenn: (ctx) =>
      hat(ctx.l.taetigkeit, "lagert_und_versendet_fuer_dritte") &&
      !ctx.l.dienstleistungen.includes("eigentum_ware") &&
      ctx.l.dienstleistungen.filter((d) =>
        ["lagerhaltung", "verpackung", "adressierung", "versand"].includes(d)
      ).length >= 2,
    dann: { rollen: ["fulfillment_dienstleister"] },
  },

  // Export: keine EPR in DE für diese Mengen
  B5: {
    wenn: (ctx) => hat(ctx.l.vertriebsweg, "export_drittland"),
    dann: { entlastungen: ["kein_hersteller_export"] },
  },

  // Lieferant leerer Verpackungen / von Verpackungsmaterial
  C5: {
    wenn: (ctx) =>
      hat(ctx.l.taetigkeit, "liefert_verpackungen_oder_material"),
    dann: { rollen: ["lieferant"] },
  },

  // Rechtsfolgen-Kaskade DE bei systembeteiligungspflichtigen Verpackungen
  B6: {
    wenn: (ctx) =>
      ctx.rollen.has("hersteller") &&
      hat(ctx.l.verpackungsart, "verkauf", "um", "ecommerce", "service"),
    dann: {
      pflichten: ["registrierung_zsvr", "systembeteiligung", "datenmeldung"],
    },
  },

  // Bevollmächtigter EHV bei Auslands-Hersteller ohne DE-Niederlassung
  C6: {
    wenn: (ctx) =>
      ctx.rollen.has("hersteller") &&
      ctx.u.sitz !== "DE" &&
      !ctx.u.niederlassungDE,
    dann: { pflichten: ["bevollmaechtigter_ehv"] },
  },
};

// ---------------------------------------------------------------------------
// Engine
// ---------------------------------------------------------------------------

interface Lauf {
  ctx: Ctx;
  herleitung: HerleitungsEintrag[];
  sortiert: RegelRow[];
  anwenden: (regel: RegelRow) => void;
}

function istVorbehalt(regel: RegelRow): boolean {
  return regel.flag === "!" && regel.review_status !== "cattwyk_freigegeben";
}

/** Gemeinsamer Regel-Lauf (A–C) für Linie und abgeleiteten Verpackungs-Kontext. */
function starteLauf(
  regeln: RegelRow[],
  unternehmen: UnternehmenKontext,
  linie: LinienKontext
): Lauf {
  const ctx: Ctx = {
    u: unternehmen,
    l: linie,
    rollen: new Set(),
    pflichten: new Set(),
    entlastungen: new Set(),
    gefeuert: new Set(),
  };
  const herleitung: HerleitungsEintrag[] = [];

  const sortiert = [...regeln]
    .filter((r) => r.aktiv)
    .sort(
      (a, b) => a.prioritaet - b.prioritaet || a.regel_id.localeCompare(b.regel_id)
    );

  const anwenden = (regel: RegelRow) => {
    const impl = REGELN[regel.regel_id];
    if (!impl || ctx.gefeuert.has(regel.regel_id)) return;
    if (!impl.wenn(ctx)) return;

    ctx.gefeuert.add(regel.regel_id);
    impl.dann.rollen?.forEach((r) => ctx.rollen.add(r));
    impl.dann.pflichten?.forEach((p) => ctx.pflichten.add(p));
    impl.dann.entlastungen?.forEach((e) => ctx.entlastungen.add(e));
    herleitung.push({
      regel_id: regel.regel_id,
      ergebnis: [
        ...(impl.dann.rollen ?? []),
        ...(impl.dann.pflichten ?? []),
        ...(impl.dann.entlastungen ?? []),
      ],
      erlaeuterung: regel.erlaeuterung,
      fundstelle_primaer: regel.fundstelle_primaer,
      fundstelle_sekundaer: regel.fundstelle_sekundaer,
      vorbehalt: istVorbehalt(regel),
    });
  };

  // Pass 1: strikt nach Priorität
  sortiert.forEach(anwenden);
  // Pass 2: Regeln mit Rollen-Abhängigkeit (Art. 21, Rechtsfolgen), die durch
  // später vergebene Basisrollen erfüllbar geworden sind – monoton, kein Entzug.
  sortiert
    .filter((r) => ["A5", "B6", "C6"].includes(r.regel_id))
    .forEach(anwenden);

  normalisiereVertreiber(ctx, herleitung);
  return { ctx, herleitung, sortiert, anwenden };
}

/**
 * Normalisierung: Vertreiber ist per Definition (Art. 3 Abs. 1 Nr. 18)
 * ausgeschlossen, sobald Erzeuger- oder Importeur-Rolle vorliegt.
 */
function normalisiereVertreiber(ctx: Ctx, herleitung: HerleitungsEintrag[]) {
  if (
    ctx.rollen.has("vertreiber") &&
    (ctx.rollen.has("erzeuger") || ctx.rollen.has("importeur"))
  ) {
    ctx.rollen.delete("vertreiber");
    const idx = herleitung.findIndex((h) => h.regel_id === "C2");
    if (idx >= 0) herleitung.splice(idx, 1);
    ctx.gefeuert.delete("C2");
  }
}

export function evaluiereLinie(
  regeln: RegelRow[],
  unternehmen: UnternehmenKontext,
  linie: LinienKontext
): LinienErgebnis {
  const { ctx, herleitung } = starteLauf(regeln, unternehmen, linie);

  const unklar = linie.ersteBereitstellung === "unklar";
  const vorbehalt = herleitung.some((h) => h.vorbehalt);

  return {
    produktlinie: linie.name,
    rollen_set: {
      rollen: [...ctx.rollen],
      pflichten: [...ctx.pflichten],
      entlastungen: [...ctx.entlastungen],
      unklar,
      vorbehalt,
    },
    herleitung,
  };
}

// ---------------------------------------------------------------------------
// Verpackungs-Ebene
// ---------------------------------------------------------------------------

const D1_ARTEN: VerpackungArt[] = [
  "transport",
  "ecommerce",
  "service",
  "primaerproduktion",
];
const D2_ARTEN: VerpackungArt[] = ["transport", "ecommerce"];

/**
 * Aus Linie + Verpackung den Linien-Kontext ableiten, auf dem die Regeln
 * A–C je Verpackung laufen. Die Verpackung präzisiert Art, Tätigkeit,
 * Marke, Lieferantensitz und Erst-Bereitstellung; alles Übrige (Vertriebs-
 * weg, Endabnehmer, Dienstleistungen) kommt aus der Linie.
 */
export function leiteLinienKontextAb(
  linie: LinienKontext,
  v: VerpackungKontext
): LinienKontext {
  // Leere Verpackung (Transport/E-Commerce/Service/Primärproduktion):
  // Hersteller-Anker ist die Erst-Bereitstellung der LEEREN Verpackung
  // (Nr. 15 lit. a) – fertig gekauft in DE liegt sie beim Lieferanten.
  // Verkaufs-/Umverpackung: wer befüllt/versiegelt und erstmals bereitstellt,
  // ist Erzeuger (A1) und Hersteller (B2) – auch bei fertig gekauften
  // Gläsern, Flaschen, Faltschachteln.
  const leereArt = D1_ARTEN.includes(v.art);

  const taetigkeit = linie.taetigkeit.filter((t) => {
    // Befüllen betrifft nur Verkaufs-/Umverpackung.
    if (t === "befuellt_versiegelt") return !leereArt;
    // Physische Herstellung ergibt sich je Verpackung aus dem Bezug.
    if (t === "stellt_verpackung_physisch_her") return false;
    return true;
  });
  if (v.bezug === "selbst_hergestellt") {
    taetigkeit.push("stellt_verpackung_physisch_her");
  }

  let ersteBereitstellung: LinienKontext["ersteBereitstellung"];
  switch (v.bezug) {
    case "fertig_gekauft":
      if (!leereArt) {
        ersteBereitstellung = "ja";
      } else {
        ersteBereitstellung =
          v.lieferantSitz === "DE"
            ? "vorgelagert"
            : v.lieferantSitz == null
              ? linie.ersteBereitstellung
              : "ja";
      }
      break;
    case "lohnfertigung":
      ersteBereitstellung = "unklar";
      break;
    default:
      ersteBereitstellung = "ja";
  }

  return {
    ...linie,
    verpackungsart: [v.art],
    taetigkeit,
    marke: v.marke,
    lieferantSitz: v.lieferantSitz,
    ersteBereitstellung,
    lebensmittelkontakt: v.lebensmittelkontakt,
  };
}

interface VCtx extends Ctx {
  v: VerpackungKontext;
}

/**
 * Regeln D1–D5 (Block „verpackung“). Texte/Fundstellen kommen aus
 * rollen_regeln; hier stehen nur die typisierten WENN-Bedingungen und die
 * Wirkung. `entzug` dokumentiert Rollen, die für DIESE Verpackung beim
 * Lieferanten liegen (D1) – die einzige Stelle, an der die Engine eine
 * zuvor vergebene Rolle wieder nimmt.
 */
const D_REGELN: Record<
  string,
  {
    wenn: (ctx: VCtx) => boolean;
    dann: Wirkung & { entzug?: string[]; unklar?: boolean; vorbehaltImmer?: boolean };
  }
> = {
  // Fertig bezogene formstabile Transport-/E-Commerce-/Service-/Primär-
  // produktionsverpackung eines DE-Lieferanten: Erzeuger und Hersteller ist
  // der Lieferant. Auf diese Arten beschränkt (D1_ARTEN) – nie Verkaufs-/
  // Umverpackung. Die DB-WENN-Bedingung enthält seit 17.10.2026 auch
  // „UND verpackung.marke != eigene“ (sonst A2/A5) – hier identisch.
  D1: {
    wenn: (ctx) =>
      D1_ARTEN.includes(ctx.v.art) &&
      ctx.v.form === "formstabil" &&
      ctx.v.bezug === "fertig_gekauft" &&
      ctx.v.lieferantSitz === "DE" &&
      ctx.u.sitz === "DE" &&
      ctx.v.marke !== "eigene",
    dann: {
      entlastungen: ["epr_beim_lieferanten"],
      rollen: ["vertreiber"],
      entzug: ["hersteller", "erzeuger"],
    },
  },
  // Flexible Verpackung, selbst angewendet (Folie, Umreifung)
  D2: {
    wenn: (ctx) =>
      D2_ARTEN.includes(ctx.v.art) &&
      ctx.v.form === "flexibel" &&
      (ctx.v.bezug === "selbst_hergestellt" ||
        ctx.v.bezug === "selbst_zusammengefuegt") &&
      ctx.u.sitz === "DE",
    dann: { rollen: ["erzeuger", "hersteller"] },
  },
  // Formstabile Versandverpackung aus Teilen zusammengefügt – stets Vorbehalt
  D3: {
    wenn: (ctx) =>
      D2_ARTEN.includes(ctx.v.art) &&
      ctx.v.form === "formstabil" &&
      ctx.v.bezug === "selbst_zusammengefuegt" &&
      ctx.u.sitz === "DE",
    dann: { rollen: ["erzeuger", "hersteller"], vorbehaltImmer: true },
  },
  // Leere Verpackung aus EU/Drittland bezogen, erstmals in DE bereitgestellt
  D4: {
    wenn: (ctx) =>
      D1_ARTEN.includes(ctx.v.art) &&
      ctx.v.bezug === "fertig_gekauft" &&
      (ctx.v.lieferantSitz === "EU" || ctx.v.lieferantSitz === "drittland") &&
      ctx.u.sitz === "DE",
    dann: { rollen: ["hersteller"] },
  },
  // Lohnfertigung: Rollen hängen vom Vertrag ab – keine Rolle, unklar
  D5: {
    wenn: (ctx) => ctx.v.bezug === "lohnfertigung",
    dann: { unklar: true },
  },
};

/** Pflichten-Matrix je Verpackung. Labels/Gründe bewusst deutsch (wie Dokumente). */
export function bauePflichtenMatrix(
  rollen: Set<string>,
  pflichtenSet: Set<string>,
  v: VerpackungKontext,
  linie: LinienKontext,
  unklar: boolean
): PflichtEintrag[] {
  const erzeuger = rollen.has("erzeuger");
  const hersteller = rollen.has("hersteller");
  const importeur = rollen.has("importeur");
  const vertreiber = rollen.has("vertreiber");
  const anEndkunden =
    hat(linie.taetigkeit, "liefert_an_endabnehmer") ||
    hat(linie.vertriebsweg, "online_endkunden_DE", "online_endkunden_EU");

  const rollenabhaengig = (
    key: string,
    label: string,
    nr: number,
    gilt: "ja" | "nein",
    grundJa: string,
    grundNein: string
  ): PflichtEintrag => ({
    key,
    label,
    anforderung_nr: nr,
    gilt: unklar ? "unklar" : gilt,
    grund: unklar
      ? "Rolle hängt vom Vertrag mit dem Dienstleister ab."
      : gilt === "ja"
        ? grundJa
        : grundNein,
  });

  const systembeteiligungArten: VerpackungArt[] = [
    "verkauf",
    "um",
    "ecommerce",
    "service",
    "transport",
  ];
  let systembeteiligung: PflichtEintrag;
  if (unklar) {
    systembeteiligung = rollenabhaengig(
      "systembeteiligung",
      "Systembeteiligung",
      32,
      "nein",
      "",
      ""
    );
  } else if (!hersteller || !systembeteiligungArten.includes(v.art)) {
    systembeteiligung = {
      key: "systembeteiligung",
      label: "Systembeteiligung",
      anforderung_nr: 32,
      gilt: "nein",
      grund: hersteller
        ? "Verpackungsart ohne Systembeteiligungspflicht."
        : "Keine Herstellerrolle für diese Verpackung.",
    };
  } else if (v.art === "transport") {
    systembeteiligung = {
      key: "systembeteiligung",
      label: "Systembeteiligung",
      anforderung_nr: 32,
      gilt: anEndkunden ? "ja" : "unklar",
      grund: anEndkunden
        ? "Transportverpackung, die beim Versand an Endkunden anfällt, ist systembeteiligungspflichtig (ZSVR-Katalog)."
        : "Transportverpackung ist nur systembeteiligungspflichtig, wenn sie typischerweise beim privaten Endverbraucher anfällt (ZSVR-Katalog prüfen).",
    };
  } else {
    systembeteiligung = {
      key: "systembeteiligung",
      label: "Systembeteiligung",
      anforderung_nr: 32,
      gilt: "ja",
      grund: "Herstellerrolle für systembeteiligungspflichtige Verpackung.",
    };
  }

  return [
    rollenabhaengig(
      "konformitaetserklaerung",
      "EU-Konformitätserklärung",
      6,
      erzeuger ? "ja" : "nein",
      "Erzeugerrolle für diese Verpackung.",
      "Keine Erzeugerrolle – die Erklärung stellt der Erzeuger der Verpackung aus."
    ),
    rollenabhaengig(
      "konformitaetsbewertung",
      "Konformitätsbewertung",
      4,
      erzeuger ? "ja" : "nein",
      "Erzeugerrolle für diese Verpackung.",
      "Keine Erzeugerrolle für diese Verpackung."
    ),
    rollenabhaengig(
      "technische_dokumentation",
      "Technische Dokumentation",
      5,
      erzeuger ? "ja" : "nein",
      "Erzeugerrolle für diese Verpackung.",
      "Keine Erzeugerrolle für diese Verpackung."
    ),
    rollenabhaengig(
      "erzeugerkennzeichnung",
      "Erzeugerkennzeichnung",
      7,
      erzeuger ? "ja" : "nein",
      "Erzeugerrolle für diese Verpackung.",
      "Keine Erzeugerrolle für diese Verpackung."
    ),
    {
      key: "stoffe_schwermetalle",
      label: "Stoffanforderungen / Schwermetalle",
      anforderung_nr: 1,
      gilt: "ja",
      grund: unklar
        ? "Gilt für jede Verpackung; Nachweis je nach Rolle selbst führen oder vom Lieferanten einholen."
        : erzeuger
          ? "Erzeugerrolle: Einhaltung nachweisen (Konformitätsbewertung)."
          : "Nachweis vom Lieferanten einholen.",
    },
    {
      key: "pfas",
      label: "PFAS-Beschränkung (Lebensmittelkontakt)",
      anforderung_nr: 2,
      gilt: v.lebensmittelkontakt ? "ja" : "nein",
      grund: v.lebensmittelkontakt
        ? "Verpackung mit Lebensmittelkontakt."
        : "Kein Lebensmittelkontakt angegeben.",
    },
    rollenabhaengig(
      "lucid_registrierung",
      "Registrierung im Verpackungsregister LUCID",
      31,
      hersteller ? "ja" : "nein",
      "Herstellerrolle für diese Verpackung.",
      "Keine Herstellerrolle für diese Verpackung."
    ),
    systembeteiligung,
    rollenabhaengig(
      "datenmeldung",
      "Datenmeldung an die ZSVR",
      33,
      hersteller ? "ja" : "nein",
      "Herstellerrolle für diese Verpackung.",
      "Keine Herstellerrolle für diese Verpackung."
    ),
    rollenabhaengig(
      "lieferant_pruefen",
      "Registrierung des Lieferanten prüfen",
      38,
      vertreiber && !hersteller ? "ja" : "nein",
      "Vertreiberrolle: Hersteller dieser Verpackung ist der Lieferant.",
      vertreiber
        ? "Sie sind selbst Hersteller dieser Verpackung."
        : "Keine Vertreiberrolle für diese Verpackung."
    ),
    rollenabhaengig(
      "importeurspflichten",
      "Importeurspflichten (Art. 18)",
      37,
      importeur ? "ja" : "nein",
      "Importeurrolle für diese Verpackung.",
      "Keine Importeurrolle für diese Verpackung."
    ),
    {
      key: "leerraum_2030",
      label: "Leerraumquote (max. 50 %)",
      anforderung_nr: 18,
      gilt: ["um", "transport", "ecommerce"].includes(v.art) ? "ja" : "nein",
      grund: ["um", "transport", "ecommerce"].includes(v.art)
        ? "Gilt ab 01.01.2030 für Um-, Transport- und E-Commerce-Verpackung."
        : "Nur für Um-, Transport- und E-Commerce-Verpackung.",
    },
    {
      key: "umweltaussagen",
      label: "Umweltaussagen auf der Verpackung",
      anforderung_nr: 23,
      gilt: "ja",
      grund: "Gilt für jede Verpackung mit Umweltaussagen.",
    },
    rollenabhaengig(
      "bevollmaechtigter_ehv",
      "Bevollmächtigter für die erweiterte Herstellerverantwortung",
      9,
      pflichtenSet.has("bevollmaechtigter_ehv") ? "ja" : "nein",
      "Herstellerrolle ohne Niederlassung in Deutschland.",
      "Keine Pflicht aus dem Rollen-Set."
    ),
    {
      key: "mehrweg_anforderungen",
      label: "Anforderungen an Mehrwegverpackung",
      anforderung_nr: 3,
      gilt: v.mehrweg ? "ja" : "nein",
      grund: v.mehrweg ? "Als Mehrweg angelegt." : "Nicht als Mehrweg angelegt.",
    },
  ];
}

export function evaluiereVerpackung(
  regeln: RegelRow[],
  unternehmen: UnternehmenKontext,
  linie: LinienKontext,
  verpackung: VerpackungKontext,
  anzahlVerpackungenInLinie = 1
): VerpackungErgebnis {
  const abgeleitet = leiteLinienKontextAb(linie, verpackung);
  const lauf = starteLauf(regeln, unternehmen, abgeleitet);
  const ctx: VCtx = Object.assign(lauf.ctx, { v: verpackung });
  const { herleitung } = lauf;
  let unklar = false;

  // D-Regeln nach Priorität (70–78) anwenden
  lauf.sortiert
    .filter((r) => r.regel_id in D_REGELN)
    .forEach((regel) => {
      const impl = D_REGELN[regel.regel_id];
      if (ctx.gefeuert.has(regel.regel_id) || !impl.wenn(ctx)) return;
      ctx.gefeuert.add(regel.regel_id);

      impl.dann.entzug?.forEach((r) => ctx.rollen.delete(r));
      if (impl.dann.rollen) {
        for (const r of impl.dann.rollen) {
          if (
            r === "vertreiber" &&
            (ctx.rollen.has("erzeuger") || ctx.rollen.has("importeur"))
          ) {
            continue;
          }
          ctx.rollen.add(r);
        }
      }
      impl.dann.pflichten?.forEach((p) => ctx.pflichten.add(p));
      impl.dann.entlastungen?.forEach((e) => ctx.entlastungen.add(e));
      if (impl.dann.unklar) unklar = true;

      herleitung.push({
        regel_id: regel.regel_id,
        ergebnis: [
          ...(impl.dann.rollen ?? []),
          ...(impl.dann.pflichten ?? []),
          ...(impl.dann.entlastungen ?? []),
          ...(impl.dann.entzug ?? []).map((r) => `entzug:${r}`),
        ],
        erlaeuterung: regel.erlaeuterung,
        fundstelle_primaer: regel.fundstelle_primaer,
        fundstelle_sekundaer: regel.fundstelle_sekundaer,
        vorbehalt: impl.dann.vorbehaltImmer || istVorbehalt(regel),
      });
    });

  // Rechtsfolgen-Kaskade erneut (B6/C6 können durch D-Rollen greifen)
  lauf.sortiert
    .filter((r) => ["B6", "C6"].includes(r.regel_id))
    .forEach(lauf.anwenden);
  normalisiereVertreiber(ctx, herleitung);

  if (unklar) {
    // D5: Das System gibt keine Rolle vor.
    ctx.rollen.clear();
    ctx.pflichten.clear();
  }

  const vorbehalt = herleitung.some((h) => h.vorbehalt);
  const pflichten = bauePflichtenMatrix(
    ctx.rollen,
    ctx.pflichten,
    verpackung,
    abgeleitet,
    unklar
  );

  const hinweisKeys: string[] = [];
  if (ctx.gefeuert.has("D2") && verpackung.form === "flexibel") {
    hinweisKeys.push("folie_selbst_angewendet");
  }
  if (ctx.gefeuert.has("D4")) hinweisKeys.push("lieferant_ausland_formstabil");
  if (ctx.gefeuert.has("D3")) hinweisKeys.push("selbst_zusammengefuegt");
  if (
    unternehmen.kleinstunternehmen &&
    verpackung.marke === "eigene" &&
    verpackung.lieferantSitz !== null &&
    verpackung.lieferantSitz !== "DE"
  ) {
    hinweisKeys.push("kleinst_lieferant_eu");
  }
  if (["um", "transport", "ecommerce"].includes(verpackung.art)) {
    hinweisKeys.push("transport_leerraum");
  }
  if (ctx.gefeuert.has("D1")) hinweisKeys.push("vertreiber_lieferant_pruefen");
  if (ctx.rollen.has("erzeuger")) {
    if (anzahlVerpackungenInLinie > 1) {
      hinweisKeys.push("erzeuger_mehrere_bestandteile");
    }
    hinweisKeys.push("erzeuger_lagerware");
  }

  return {
    bezeichnung: verpackung.bezeichnung,
    rollen_set: {
      rollen: [...ctx.rollen],
      pflichten: [...ctx.pflichten],
      entlastungen: [...ctx.entlastungen],
      unklar,
      vorbehalt,
    },
    pflichten,
    hinweisKeys,
    herleitung,
  };
}

export function evaluiereAlle(
  regeln: RegelRow[],
  unternehmen: UnternehmenKontext,
  linien: LinienKontext[]
): LinienErgebnis[] {
  return linien.map((linie) => evaluiereLinie(regeln, unternehmen, linie));
}

// ===========================================================================
// EUDR-Strang (v0.93): Betroffenheits-Check zur EU-Entwaldungsverordnung
// (VO (EU) 2023/1115 i. d. F. VO (EU) 2025/2650 und Del. VO (EU) 2026/2102)
// je Verpackung. Eigener Strang neben A–D: andere Rollen (eudr_*), andere
// Pflichten (Anforderungen 41–44), keine Wechselwirkung mit den PPWR-Rollen.
// Regeln E1–E9 (Block „eudr“) aus rollen_regeln liefern Texte, Fundstellen
// und Prüfstatus; hier stehen die typisierten WENN-Bedingungen.
// Das Ergebnis stellt nur die Betroffenheit fest – Sorgfaltserklärung,
// Geolokalisierung und Risikobewertung sind Beratungs- bzw. Software-
// leistung Dritter.
// ===========================================================================

export type EudrMaterial =
  | "holz"
  | "papier_pappe"
  | "naturkautschuk"
  | "nicht_relevant"
  | "verbund"
  | "unbekannt";
export type EudrVerwendung = "nur_genutzt" | "leer_verkauft";
export type EudrBezug =
  | "import_drittland"
  | "selbst_hergestellt_aus_eu_vormaterial"
  | "fertig_gekauft_eu";
export type EudrRezyklat = "keins" | "teilweise" | "vollstaendig" | "unbekannt";
export type EudrErzeugnis = "neu" | "gebraucht_oder_mehrweg_nach_erstnutzung";
export type UnternehmensGroesse2024 = "kleinst" | "klein" | "mittel" | "gross";
export type EudrRolle = "eudr_marktteilnehmer" | "eudr_nachgelagert" | "eudr_haendler";
export type EudrStatus = "nicht_betroffen" | "betroffen" | "unklar";
export type EudrFrage =
  | "material"
  | "verwendung"
  | "bezug"
  | "rezyklat"
  | "erzeugnis"
  | "groesse_2024";
/** Schlüssel des tragenden Grundes (UI: Labels.eudr.grund.*). */
export type EudrGrund =
  | "material_nicht_relevant"
  | "nur_genutzt"
  | "rezyklat_vollstaendig"
  | "gebraucht_mehrweg"
  | "marktteilnehmer"
  | "nachgelagert"
  | "haendler"
  | "rezyklat_teilweise"
  | "material_offen"
  | "verwendung_offen"
  | "bezug_offen";

export const EUDR_VERWENDUNGEN: EudrVerwendung[] = ["nur_genutzt", "leer_verkauft"];
export const EUDR_BEZUEGE: EudrBezug[] = [
  "import_drittland",
  "selbst_hergestellt_aus_eu_vormaterial",
  "fertig_gekauft_eu",
];
export const EUDR_REZYKLATE: EudrRezyklat[] = ["keins", "teilweise", "vollstaendig", "unbekannt"];
export const EUDR_ERZEUGNISSE: EudrErzeugnis[] = ["neu", "gebraucht_oder_mehrweg_nach_erstnutzung"];
export const GROESSEN_2024: UnternehmensGroesse2024[] = ["kleinst", "klein", "mittel", "gross"];

/** Geltungsbeginn Art. 38 Abs. 2 und Abs. 3 i. d. F. VO (EU) 2025/2650. */
export const EUDR_FRIST_ALLGEMEIN = "2026-12-30";
export const EUDR_FRIST_KLEIN = "2027-06-30";

export interface EudrKontext {
  material: EudrMaterial;
  /** null = nicht beantwortet → Rückfrage */
  verwendung: EudrVerwendung | null;
  bezug: EudrBezug | null;
  rezyklat: EudrRezyklat | null;
  erzeugnis: EudrErzeugnis | null;
  groesse2024: UnternehmensGroesse2024 | null;
  /** Felder, deren Wert die Engine aus PPWR-Angaben abgeleitet hat (Anzeige). */
  abgeleitet?: EudrFrage[];
}

export interface EudrErgebnis {
  status: EudrStatus;
  /** Bei „unklar“ (E8) die vorläufige Rolle, von der bis zur Klärung auszugehen ist. */
  rolle: EudrRolle | null;
  grund: EudrGrund;
  material: EudrMaterial;
  /** Geltungsbeginn der Pflichten für diese Rolle (ISO), nur bei Rolle. */
  frist: string | null;
  /** Abweichende Frist, falls die Unternehmensgröße 2024 noch fehlt. */
  fristAlternativ: string | null;
  fundstelle: string | null;
  anforderungen: number[];
  praxisfragen: string[];
  offeneFragen: EudrFrage[];
  abgeleitet: EudrFrage[];
  herleitung: HerleitungsEintrag[];
  vorbehalt: boolean;
}

const RELEVANT: EudrMaterial[] = ["holz", "papier_pappe", "naturkautschuk"];

/**
 * Material-Mapping aus dem Freitextfeld `verpackungen.material`
 * (EUDR-Strang-Doc, Abschnitt „Für die Engine“): Papier/Karton, Holz →
 * relevant; Kunststoff, Glas, Metall, Textil → nicht relevant; Verbund oder
 * gemischte Angaben → Rückfrage „enthält Papier/Pappe?“; leer → unbekannt.
 * Bambus, Rattan u. a. gelten nicht als Holz (Del. VO 2026/2102, Fußnote).
 */
export function eudrMaterialAusText(text: string | null | undefined): EudrMaterial {
  const t = (text ?? "").toLowerCase().trim();
  if (!t) return "unbekannt";
  if (/verbund|tetra|getränkekarton|getraenkekarton|kaschiert|beschichtet|composite|laminat/.test(t)) {
    return "verbund";
  }
  const papier = /papier|pappe|karton|kraft|zellstoff|faltschachtel|paper|cardboard|carton|paperboard|pulp/.test(t);
  const holz = /holz|palette|kiste|wood|pallet|crate|furnier|spankorb/.test(t);
  const kautschuk = /naturkautschuk|kautschuk|naturlatex|latex|natural rubber/.test(t);
  const anderes =
    /kunststoff|plastik|plastic|folie|film|\bpe\b|\bpp\b|\bpet\b|\bps\b|\beps\b|\bpvc\b|\bhdpe\b|\bldpe\b|styropor|glas|glass|metall|metal|alu|weißblech|weissblech|stahl|steel|blech|\btin\b|textil|textile|jute|baumwolle|cotton|bambus|bamboo|rattan/.test(
      t
    );
  const relevante = [papier, holz, kautschuk].filter(Boolean).length;
  if (relevante > 0 && anderes) return "verbund";
  if (papier) return "papier_pappe";
  if (holz) return "holz";
  if (kautschuk) return "naturkautschuk";
  if (anderes) return "nicht_relevant";
  return "unbekannt";
}

/** Rohe EUDR-Eingaben einer Verpackung (Spalten aus Migration 021). */
export interface EudrEingaben {
  material: string | null;
  verwendung: EudrVerwendung | null;
  bezug: EudrBezug | null;
  rezyklat: EudrRezyklat | null;
  erzeugnis: EudrErzeugnis | null;
}

/**
 * EUDR-Kontext aus Verpackung, Linie und Profil ableiten. Defaults laut
 * Strang-Doc: Verwendung aus `bezug` (fertig gekauft/Lohnfertigung →
 * nur_genutzt; selbst hergestellt → Rückfrage) – zusätzlich Rückfrage, wenn
 * die Linie leere Verpackung liefert (Tätigkeit liefert_verpackungen_oder_
 * material). EUDR-Bezug aus Lieferantensitz + Bezug (nur fertig gekauft
 * eindeutig ableitbar). Erzeugnis-Default „neu“.
 */
export function leiteEudrKontextAb(
  eingaben: EudrEingaben,
  v: Pick<VerpackungKontext, "bezug" | "lieferantSitz">,
  linieTaetigkeit: string[],
  groesse2024: UnternehmensGroesse2024 | null
): EudrKontext {
  const abgeleitet: EudrFrage[] = [];
  const liefertLeer = linieTaetigkeit.includes("liefert_verpackungen_oder_material");

  let verwendung = eingaben.verwendung;
  if (!verwendung && !liefertLeer && v.bezug !== "selbst_hergestellt") {
    verwendung = "nur_genutzt";
    abgeleitet.push("verwendung");
  }

  let bezug = eingaben.bezug;
  if (!bezug && verwendung === "leer_verkauft" && v.bezug === "fertig_gekauft" && v.lieferantSitz) {
    bezug = v.lieferantSitz === "drittland" ? "import_drittland" : "fertig_gekauft_eu";
    abgeleitet.push("bezug");
  }

  let erzeugnis = eingaben.erzeugnis;
  if (!erzeugnis && verwendung === "leer_verkauft") {
    erzeugnis = "neu";
    abgeleitet.push("erzeugnis");
  }

  return {
    material: eudrMaterialAusText(eingaben.material),
    verwendung,
    bezug,
    rezyklat: eingaben.rezyklat,
    erzeugnis,
    groesse2024,
    abgeleitet,
  };
}

const EUDR_ROLLE_NACH_BEZUG: Record<EudrBezug, { regel: string; rolle: EudrRolle; grund: EudrGrund }> = {
  import_drittland: { regel: "E4", rolle: "eudr_marktteilnehmer", grund: "marktteilnehmer" },
  selbst_hergestellt_aus_eu_vormaterial: { regel: "E5", rolle: "eudr_nachgelagert", grund: "nachgelagert" },
  fertig_gekauft_eu: { regel: "E6", rolle: "eudr_haendler", grund: "haendler" },
};

const PRAXISFRAGEN_NACH_ROLLE: Record<EudrRolle, string[]> = {
  eudr_marktteilnehmer: ["E03", "E09", "E06", "E07"],
  eudr_nachgelagert: ["E02", "E06", "E08", "E07"],
  eudr_haendler: ["E06", "E08", "E07"],
};

/** Vorbehalt: jede nicht von Cattwyk freigegebene EUDR-Regel oder ein (!) im Text. */
function istEudrVorbehalt(regel: RegelRow): boolean {
  return (
    regel.review_status !== "cattwyk_freigegeben" ||
    (regel.erlaeuterung ?? "").includes("(!)") ||
    regel.flag === "!"
  );
}

export function evaluiereEudr(regeln: RegelRow[], k: EudrKontext): EudrErgebnis {
  const eRegeln = new Map(
    regeln.filter((r) => r.aktiv && r.block === "eudr").map((r) => [r.regel_id, r])
  );
  const herleitung: HerleitungsEintrag[] = [];
  const feuern = (regelId: string, ergebnis: string[]) => {
    const r = eRegeln.get(regelId);
    herleitung.push({
      regel_id: regelId,
      ergebnis,
      erlaeuterung: r?.erlaeuterung ?? null,
      fundstelle_primaer: r?.fundstelle_primaer ?? "",
      fundstelle_sekundaer: r?.fundstelle_sekundaer ?? null,
      // Fehlt die Regel in der DB, gilt das Ergebnis stets unter Vorbehalt.
      vorbehalt: r ? istEudrVorbehalt(r) : true,
    });
  };
  const offeneFragen: EudrFrage[] = [];
  const abgeleitet = k.abgeleitet ?? [];
  const praxisfragen = new Set<string>();

  const fertig = (
    status: EudrStatus,
    grund: EudrGrund,
    extra: Partial<Pick<EudrErgebnis, "rolle" | "frist" | "fristAlternativ" | "anforderungen">> = {}
  ): EudrErgebnis => ({
    status,
    rolle: extra.rolle ?? null,
    grund,
    material: k.material,
    frist: extra.frist ?? null,
    fristAlternativ: extra.fristAlternativ ?? null,
    fundstelle: herleitung.find((h) => h.regel_id !== "E9")?.fundstelle_primaer || null,
    anforderungen: extra.anforderungen ?? [41],
    praxisfragen: [...praxisfragen],
    offeneFragen,
    abgeleitet,
    herleitung,
    vorbehalt: herleitung.some((h) => h.vorbehalt) || status === "unklar",
  });

  // E1: kein relevantes Material
  if (k.material === "nicht_relevant") {
    feuern("E1", ["eudr_nicht_betroffen"]);
    praxisfragen.add("E14");
    return fertig("nicht_betroffen", "material_nicht_relevant");
  }

  // E2: Verpackung nur genutzt (gilt unabhängig vom Material)
  if (k.verwendung === "nur_genutzt") {
    feuern("E2", ["eudr_nicht_betroffen"]);
    praxisfragen.add("E01");
    if (k.material === "holz") praxisfragen.add("E04");
    praxisfragen.add("E14");
    return fertig("nicht_betroffen", "nur_genutzt");
  }

  if (k.verwendung === null) {
    offeneFragen.push("verwendung");
    if (!RELEVANT.includes(k.material)) offeneFragen.push("material");
    praxisfragen.add("E01");
    praxisfragen.add("E06");
    return fertig("unklar", "verwendung_offen");
  }

  // Ab hier: leer verkauft
  if (!RELEVANT.includes(k.material)) {
    offeneFragen.push("material");
    praxisfragen.add("E01");
    return fertig("unklar", "material_offen");
  }

  // E7 (Vorrang vor E4–E6): gebraucht oder Mehrweg nach Erstnutzung
  if (k.erzeugnis === "gebraucht_oder_mehrweg_nach_erstnutzung") {
    feuern("E7", ["eudr_nicht_betroffen"]);
    praxisfragen.add("E12");
    if (k.material === "holz") praxisfragen.add("E04");
    return fertig("nicht_betroffen", "gebraucht_mehrweg");
  }

  // E3: vollständig Rezyklat
  if (k.rezyklat === "vollstaendig") {
    feuern("E3", ["eudr_nicht_betroffen"]);
    praxisfragen.add("E05");
    return fertig("nicht_betroffen", "rezyklat_vollstaendig");
  }
  if (k.rezyklat === null) offeneFragen.push("rezyklat");

  // E4–E6: Rolle nach Bezug
  if (k.bezug === null) {
    offeneFragen.push("bezug");
    praxisfragen.add("E06");
    return fertig("unklar", "bezug_offen");
  }
  const zuordnung = EUDR_ROLLE_NACH_BEZUG[k.bezug];
  feuern(zuordnung.regel, [zuordnung.rolle]);
  PRAXISFRAGEN_NACH_ROLLE[zuordnung.rolle].forEach((c) => praxisfragen.add(c));
  const anforderungen =
    zuordnung.rolle === "eudr_marktteilnehmer" ? [41, 42, 44] : [41, 43, 44];

  // E8: teilweise Rezyklat → unklar, vorläufig von Betroffenheit ausgehen
  const teilweise = k.rezyklat === "teilweise";
  if (teilweise) {
    feuern("E8", ["eudr_unklar"]);
    praxisfragen.add("E05");
  }

  // E9: Fristbestimmung
  let frist = EUDR_FRIST_ALLGEMEIN;
  let fristAlternativ: string | null = null;
  if (k.material === "naturkautschuk") {
    // Kein EUTR-Anhang-Erzeugnis: Kleinst-/Kleinunternehmen ab 30.06.2027
    if (k.groesse2024 === "kleinst" || k.groesse2024 === "klein") {
      frist = EUDR_FRIST_KLEIN;
    } else if (k.groesse2024 === null) {
      fristAlternativ = EUDR_FRIST_KLEIN;
      offeneFragen.push("groesse_2024");
    }
  }
  feuern("E9", [`frist:${frist}`]);
  praxisfragen.add("E13");

  return fertig(teilweise ? "unklar" : "betroffen", teilweise ? "rezyklat_teilweise" : zuordnung.grund, {
    rolle: zuordnung.rolle,
    frist,
    fristAlternativ,
    anforderungen,
  });
}
