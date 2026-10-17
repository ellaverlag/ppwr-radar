/**
 * Rollen-Engine (v0.91) – wertet die 18 Regeln aus rollen_regeln je
 * Produktlinie aus. Die WENN-Bedingungen der DSL sind hier als typisierte
 * Funktionen implementiert (Schlüssel = regel_id); Prioritäten, Texte,
 * Fundstellen und Flags kommen aus der Datenbank.
 *
 * Pur und ohne IO – das Laden der Regeln und das Persistieren der
 * Ergebnisse übernimmt lib/rollen-service.ts.
 */

export const ENGINE_VERSION = "v0.91";

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
  const taetigkeit = linie.taetigkeit.filter((t) => {
    // Befüllen betrifft nur Verkaufs-/Umverpackung, die nicht fertig
    // bezogen und unverändert verwendet wird.
    if (t === "befuellt_versiegelt") {
      return (v.art === "verkauf" || v.art === "um") && v.bezug !== "fertig_gekauft";
    }
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
      ersteBereitstellung =
        v.lieferantSitz === "DE"
          ? "vorgelagert"
          : v.lieferantSitz == null
            ? linie.ersteBereitstellung
            : "ja";
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
  // Fertig bezogene formstabile Transport-/Service-/Primärproduktions-
  // verpackung eines DE-Lieferanten: Erzeuger und Hersteller ist der
  // Lieferant. Laut Erläuterung nur ohne eigene Marke (sonst A2/A5).
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
