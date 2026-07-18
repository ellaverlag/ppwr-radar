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

export function evaluiereLinie(
  regeln: RegelRow[],
  unternehmen: UnternehmenKontext,
  linie: LinienKontext
): LinienErgebnis {
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
      vorbehalt: regel.flag === "!" && regel.review_status !== "cattwyk_freigegeben",
    });
  };

  // Pass 1: strikt nach Priorität
  sortiert.forEach(anwenden);
  // Pass 2: Regeln mit Rollen-Abhängigkeit (Art. 21, Rechtsfolgen), die durch
  // später vergebene Basisrollen erfüllbar geworden sind – monoton, kein Entzug.
  sortiert
    .filter((r) => ["A5", "B6", "C6"].includes(r.regel_id))
    .forEach(anwenden);

  // Normalisierung: Vertreiber ist per Definition (Art. 3 Abs. 1 Nr. 18)
  // ausgeschlossen, sobald Erzeuger- oder Importeur-Rolle vorliegt.
  if (
    ctx.rollen.has("vertreiber") &&
    (ctx.rollen.has("erzeuger") || ctx.rollen.has("importeur"))
  ) {
    ctx.rollen.delete("vertreiber");
    const idx = herleitung.findIndex((h) => h.regel_id === "C2");
    if (idx >= 0) herleitung.splice(idx, 1);
    ctx.gefeuert.delete("C2");
  }

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

export function evaluiereAlle(
  regeln: RegelRow[],
  unternehmen: UnternehmenKontext,
  linien: LinienKontext[]
): LinienErgebnis[] {
  return linien.map((linie) => evaluiereLinie(regeln, unternehmen, linie));
}
