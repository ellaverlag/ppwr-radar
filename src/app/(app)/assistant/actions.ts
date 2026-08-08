"use server";

import { frageClaude, type ChatNachricht } from "@/lib/assistant/antwort";
import {
  FRAGEN_PRO_STUNDE,
  pruefeRateLimit,
  speichereFrageKandidat,
  zaehleFrage,
} from "@/lib/assistant/nutzung";
import { ladeProfilKontext } from "@/lib/assistant/profil-kontext";
import {
  baueSystemPrompt,
  ESKALATION_FALLBACK,
  GRENZE_MARKER,
  type Erklaertiefe,
} from "@/lib/assistant/prompt";
import { ladeKontextChunks, type KontextChunk } from "@/lib/assistant/retrieval";
import { isPreviewMode } from "@/lib/preview";
import { ladeAppConfig } from "@/lib/rollen-service";
import { pruefeZugang } from "@/lib/zugang";
import type { Kategorie, Verbindlichkeit } from "@/lib/wissensbasis";

/**
 * Server Actions des Assistant. Fehlerpfade liefern Status-Codes statt
 * Stacktraces – die Texte dazu kommen aus den i18n-Labels der Seite.
 */

export interface QuellenChip {
  typ: "anforderung" | "auslegung" | "rolle";
  code: string;
  titel: string;
  url: string;
  kategorie: Kategorie;
  verbindlichkeit: Verbindlichkeit;
}

export type AssistantAntwort =
  | {
      status: "ok";
      antwort: string;
      quellen: QuellenChip[];
      grenze: boolean;
      preview: boolean;
    }
  | { status: "rate_limit"; limit: number }
  | { status: "fehler"; art: "eingabe" | "zugang" | "timeout" | "ueberlastet" | "unbekannt" };

const TIEFEN: Erklaertiefe[] = ["einfach", "fachlich", "rechtstext"];
const MAX_FRAGE = 1000;
const MAX_VERLAUF = 12;

const alsChip = (chunk: KontextChunk): QuellenChip => ({
  typ: chunk.typ,
  code: chunk.code,
  titel: chunk.titel,
  url: chunk.url,
  kategorie: chunk.kategorie,
  verbindlichkeit: chunk.verbindlichkeit,
});

/** QUELLEN-Schlusszeile parsen und aus dem Antworttext entfernen. */
function trenneQuellenzeile(text: string): { antwort: string; codes: string[] | null } {
  const match = text.match(/\n?QUELLEN:\s*(.*)\s*$/i);
  if (!match) return { antwort: text, codes: null };
  const antwort = text.slice(0, match.index).trimEnd();
  const inhalt = match[1].trim();
  if (!inhalt || /^keine$/i.test(inhalt)) return { antwort, codes: [] };
  return {
    antwort,
    codes: inhalt
      .split(/[,;]/)
      .map((code) => code.trim())
      .filter(Boolean),
  };
}

export async function stelleAssistantFrage(input: {
  frage: string;
  tiefe: Erklaertiefe;
  verlauf: ChatNachricht[];
}): Promise<AssistantAntwort> {
  const zugang = await pruefeZugang();
  if (!zugang?.freigeschaltet) return { status: "fehler", art: "zugang" };

  const frage = input.frage?.trim() ?? "";
  const tiefe = TIEFEN.includes(input.tiefe) ? input.tiefe : "fachlich";
  if (frage.length < 3 || frage.length > MAX_FRAGE) {
    return { status: "fehler", art: "eingabe" };
  }
  const verlauf = (Array.isArray(input.verlauf) ? input.verlauf : [])
    .filter(
      (n) =>
        (n.rolle === "nutzer" || n.rolle === "assistant") &&
        typeof n.text === "string"
    )
    .slice(-MAX_VERLAUF)
    .map((n) => ({ rolle: n.rolle, text: n.text.slice(0, 6000) }));

  if (!(await pruefeRateLimit(zugang.user.id))) {
    return { status: "rate_limit", limit: FRAGEN_PRO_STUNDE };
  }
  await zaehleFrage(zugang.user.id);

  try {
    const [{ chunks, rechtsstand }, profil, eskalation] = await Promise.all([
      ladeKontextChunks(frage),
      ladeProfilKontext(zugang.user.id),
      ladeAppConfig("cattwyk_erstgespraech_hinweis"),
    ]);

    const systemPrompt = baueSystemPrompt({
      chunks,
      profil,
      rechtsstand,
      tiefe,
      eskalationsHinweis: eskalation?.trim() || ESKALATION_FALLBACK,
    });

    const ergebnis = await frageClaude(systemPrompt, verlauf, frage, tiefe);
    if (!ergebnis.ok) {
      const art =
        ergebnis.fehler === "timeout"
          ? "timeout"
          : ergebnis.fehler === "ueberlastet"
            ? "ueberlastet"
            : "unbekannt";
      return { status: "fehler", art };
    }

    const { antwort, codes } = trenneQuellenzeile(ergebnis.text);
    const quellen =
      codes === null
        ? chunks.map(alsChip)
        : chunks
            .filter((chunk) =>
              codes.some(
                (code) => code.toLowerCase() === chunk.code.toLowerCase()
              )
            )
            .map(alsChip);

    return {
      status: "ok",
      antwort,
      quellen,
      grenze: antwort.includes(GRENZE_MARKER),
      preview: isPreviewMode(),
    };
  } catch (fehler) {
    console.error(
      "Assistant: Frage fehlgeschlagen:",
      fehler instanceof Error ? fehler.message : fehler
    );
    return { status: "fehler", art: "unbekannt" };
  }
}

/** Frage anonymisiert als Praxisfragen-Kandidat vorschlagen. */
export async function schlageFrageKandidatVor(
  frage: string
): Promise<{ ok: boolean }> {
  const zugang = await pruefeZugang();
  if (!zugang?.freigeschaltet) return { ok: false };

  const text = frage?.trim() ?? "";
  if (text.length < 3 || text.length > MAX_FRAGE) return { ok: false };

  const profil = await ladeProfilKontext(zugang.user.id);
  const ok = await speichereFrageKandidat(text, {
    rollen: profil.rollen,
    verpackungstypen: profil.verpackungstypen,
  });
  return { ok };
}
