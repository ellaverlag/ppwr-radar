import "server-only";

import { praxisfrageUrl, anforderungUrl, glossarBegriffUrl } from "@/lib/wissen-links";
import {
  getAnforderungen,
  getAuslegungen,
  getRollenDefinitionen,
  sucheWissensbasis,
  sucheWissensbasisIlike,
  type Anforderung,
  type Auslegung,
  type RollenDefinition,
  type Kategorie,
  type SuchTreffer,
  type Verbindlichkeit,
} from "@/lib/wissensbasis";

/**
 * Retrieval des Assistant: je Frage werden Kandidaten über die Postgres-
 * Volltextsuche (websearch_to_tsquery, german) gesucht; bleibt sie leer,
 * greift der ilike-Fallback über Titel/Frage/Begriff. Die Treffer werden
 * über die bestehenden Wissensbasis-Getter (Preview-/Freigabe-Datenpfad)
 * zu kompakten Kontext-Chunks hydriert – nie Volltexte ganzer Tabellen.
 */

export interface KontextChunk {
  typ: "anforderung" | "auslegung" | "rolle";
  ref: string;
  /** Anzeige-/Zitier-Code: "#06", "A01" bzw. rolle_id. */
  code: string;
  titel: string;
  kerntext: string;
  fundstellen: string[];
  /** Für den Icon-Chip; Rollen-Definitionen laufen unter rollen_epr. */
  kategorie: Kategorie;
  verbindlichkeit: Verbindlichkeit;
  rechtsstand: string;
  /** Deep-Link für den Quellen-Chip. */
  url: string;
}

export interface RetrievalErgebnis {
  chunks: KontextChunk[];
  /** Jüngster Rechtsstand der geprüften Wissensbasis (für die Grenz-Formel). */
  rechtsstand: string;
}

const MAX_CHUNKS = 8;
const MAX_KERNTEXT = 1600;

const kuerze = (text: string): string =>
  text.length <= MAX_KERNTEXT ? text : `${text.slice(0, MAX_KERNTEXT)} …`;

const anforderungCode = (a: Anforderung): string =>
  a.nr != null ? `#${String(a.nr).padStart(2, "0")}` : a.id.slice(0, 8);

function anforderungChunk(a: Anforderung): KontextChunk {
  const teile: string[] = [];
  if (a.kurzerklaerung) teile.push(a.kurzerklaerung);
  if (a.erklaerung_fachlich) teile.push(a.erklaerung_fachlich);
  if (typeof a.tatbestand === "string" && a.tatbestand) {
    teile.push(`Tatbestand: ${a.tatbestand}`);
  }
  if (a.rechtsfolgen_je_rolle) {
    const folgen = Object.entries(a.rechtsfolgen_je_rolle)
      .map(([rolle, folge]) => `${rolle}: ${folge}`)
      .join(" · ");
    if (folgen) teile.push(`Rechtsfolgen je Rolle: ${folgen}`);
  }
  if (a.handlungsanweisung) teile.push(`Handlung: ${a.handlungsanweisung}`);
  if (a.ausnahmen) teile.push(`Ausnahmen: ${a.ausnahmen}`);
  if (a.uebergangsregeln) teile.push(`Übergang: ${a.uebergangsregeln}`);
  teile.push(
    `Gilt: ${a.gilt_status}${a.gilt_ab ? ` ab ${a.gilt_ab}` : ""}`
  );

  return {
    typ: "anforderung",
    ref: a.id,
    code: anforderungCode(a),
    titel: a.titel,
    kerntext: kuerze(teile.join("\n")),
    fundstellen: [a.rechtsquelle, a.verpackdg_quelle].filter(
      (f): f is string => Boolean(f)
    ),
    kategorie: a.kategorie,
    verbindlichkeit: "rechtsverbindlich",
    rechtsstand: a.rechtsstand,
    url: anforderungUrl(a.id),
  };
}

function auslegungChunk(u: Auslegung): KontextChunk {
  return {
    typ: "auslegung",
    ref: u.id,
    code: u.code ?? u.id.slice(0, 8),
    titel: u.kurztitel ?? u.frage,
    kerntext: kuerze(`Frage: ${u.frage}\nAntwort: ${u.antwort}`),
    fundstellen: u.quellen,
    kategorie: u.kategorie,
    verbindlichkeit: u.verbindlichkeit,
    rechtsstand: u.rechtsstand,
    url: praxisfrageUrl(u.code, u.frage),
  };
}

function rollenChunk(r: RollenDefinition): KontextChunk {
  const teile = [r.definition_kurz];
  if (r.abgrenzung) teile.push(`Abgrenzung: ${r.abgrenzung}`);
  if (r.verwechslungsfaelle) {
    teile.push(`Verwechslungsfälle: ${r.verwechslungsfaelle}`);
  }
  if (r.alt_bedeutung_verpackg) {
    teile.push(`Frühere VerpackG-Bedeutung: ${r.alt_bedeutung_verpackg}`);
  }
  return {
    typ: "rolle",
    ref: r.rolle_id,
    code: r.rolle_id,
    titel: r.begriff_de,
    kerntext: kuerze(teile.join("\n")),
    fundstellen: [r.fundstelle_ppwr],
    kategorie: "rollen_epr",
    verbindlichkeit: "rechtsverbindlich",
    rechtsstand: r.rechtsstand,
    url: glossarBegriffUrl(r.begriff_de),
  };
}

/** Stichwörter für Zweitsuche (or-verknüpft) und ilike-Fallback. */
function extrahiereBegriffe(frage: string): string[] {
  return frage
    .replace(/[?!.,;:„“"']/g, " ")
    .split(/\s+/)
    .filter((wort) => wort.length >= 4)
    .slice(0, 6);
}

export async function ladeKontextChunks(
  frage: string
): Promise<RetrievalErgebnis> {
  const [anforderungen, auslegungen, rollen] = await Promise.all([
    getAnforderungen(),
    getAuslegungen(),
    getRollenDefinitionen(),
  ]);

  const rechtsstand =
    [...anforderungen, ...auslegungen, ...rollen]
      .map((zeile) => zeile.rechtsstand)
      .filter(Boolean)
      .sort()
      .at(-1) ?? new Date().toISOString().slice(0, 10);

  // 1. Volltextsuche mit der ganzen Frage (websearch = UND-Verknüpfung) …
  let treffer: SuchTreffer[] = await sucheWissensbasis(frage, MAX_CHUNKS);

  // 2. … zu wenig? Stichwörter ODER-verknüpft nachschieben.
  if (treffer.length < 3) {
    const begriffe = extrahiereBegriffe(frage);
    if (begriffe.length > 0) {
      const breiter = await sucheWissensbasis(
        begriffe.join(" or "),
        MAX_CHUNKS
      );
      const bekannt = new Set(treffer.map((t) => `${t.typ}:${t.ref}`));
      treffer = [
        ...treffer,
        ...breiter.filter((t) => !bekannt.has(`${t.typ}:${t.ref}`)),
      ];
    }
  }

  // 3. Immer noch leer? ilike-Fallback über Titel/Frage/Begriff.
  if (treffer.length === 0) {
    treffer = await sucheWissensbasisIlike(extrahiereBegriffe(frage));
  }

  const anfNachId = new Map(anforderungen.map((a) => [a.id, a]));
  const ausNachId = new Map(auslegungen.map((u) => [u.id, u]));
  const rolNachId = new Map(rollen.map((r) => [r.rolle_id, r]));

  const chunks: KontextChunk[] = [];
  for (const t of treffer.slice(0, MAX_CHUNKS)) {
    if (t.typ === "anforderung") {
      const a = anfNachId.get(t.ref);
      if (a) chunks.push(anforderungChunk(a));
    } else if (t.typ === "auslegung") {
      const u = ausNachId.get(t.ref);
      if (u) chunks.push(auslegungChunk(u));
    } else {
      const r = rolNachId.get(t.ref);
      if (r) chunks.push(rollenChunk(r));
    }
  }

  return { chunks, rechtsstand };
}
