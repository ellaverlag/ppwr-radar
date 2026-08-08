"use server";

import { frageClaude } from "@/lib/assistant/antwort";
import {
  FRAGEN_PRO_STUNDE,
  pruefeRateLimit,
  setzeVerlaufGemerkt,
  speichereFrageKandidat,
  speichereVerlauf,
  zaehleFrage,
} from "@/lib/assistant/nutzung";
import { ladeProfilKontext } from "@/lib/assistant/profil-kontext";
import {
  baueSystemPrompt,
  ESKALATION_FALLBACK,
  GRENZE_MARKER,
  type Erklaertiefe,
} from "@/lib/assistant/prompt";
import {
  anforderungenAlsChunks,
  ladeKontextChunks,
  type KontextChunk,
} from "@/lib/assistant/retrieval";
import { isPreviewMode } from "@/lib/preview";
import { ladeAppConfig } from "@/lib/rollen-service";
import { ladeStatusAnalyse } from "@/lib/status-analyse";
import { pruefeZugang } from "@/lib/zugang";
import type { Kategorie, Verbindlichkeit } from "@/lib/wissensbasis";

/**
 * Server Actions des Assistant. Fehlerpfade liefern Status-Codes statt
 * Stacktraces – die Texte dazu kommen aus den i18n-Labels der Seite.
 * Jede erfolgreiche Antwort wird automatisch im Verlauf gespeichert.
 */

export interface QuellenChip {
  typ: "anforderung" | "auslegung" | "rolle";
  code: string;
  titel: string;
  url: string;
  kategorie: Kategorie;
  verbindlichkeit: Verbindlichkeit;
  fundstellen: string[];
}

export type AssistantAntwort =
  | {
      status: "ok";
      antwort: string;
      quellen: QuellenChip[];
      grenze: boolean;
      preview: boolean;
      rechtsstand: string;
      /** null, wenn der Verlauf nicht gespeichert werden konnte (kein Profil). */
      verlaufId: string | null;
      createdAt: string;
    }
  | { status: "rate_limit"; limit: number }
  | { status: "fehler"; art: "eingabe" | "zugang" | "timeout" | "ueberlastet" | "unbekannt" };

const TIEFEN: Erklaertiefe[] = ["einfach", "fachlich", "rechtstext"];
const MAX_FRAGE = 1000;

const alsChip = (chunk: KontextChunk): QuellenChip => ({
  typ: chunk.typ,
  code: chunk.code,
  titel: chunk.titel,
  url: chunk.url,
  kategorie: chunk.kategorie,
  verbindlichkeit: chunk.verbindlichkeit,
  fundstellen: chunk.fundstellen,
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
  /** Kontext-Umschalter: Name der Produktlinie oder null = alle. */
  kontextLinie: string | null;
}): Promise<AssistantAntwort> {
  const zugang = await pruefeZugang();
  if (!zugang?.freigeschaltet) return { status: "fehler", art: "zugang" };

  const frage = input.frage?.trim() ?? "";
  const tiefe = TIEFEN.includes(input.tiefe) ? input.tiefe : "fachlich";
  const kontextLinie =
    typeof input.kontextLinie === "string" && input.kontextLinie.trim()
      ? input.kontextLinie.trim().slice(0, 80)
      : null;
  if (frage.length < 3 || frage.length > MAX_FRAGE) {
    return { status: "fehler", art: "eingabe" };
  }

  if (!(await pruefeRateLimit(zugang.user.id))) {
    return { status: "rate_limit", limit: FRAGEN_PRO_STUNDE };
  }
  await zaehleFrage(zugang.user.id);

  try {
    const [{ chunks: suchChunks, rechtsstand }, profil, eskalation] =
      await Promise.all([
        ladeKontextChunks(frage),
        ladeProfilKontext(zugang.user.id, kontextLinie),
        ladeAppConfig("cattwyk_erstgespraech_hinweis"),
      ]);

    // Generische Frage ohne Suchtreffer („Was muss ich bis wann tun?“):
    // die zutreffenden Anforderungen des Profils als Kontext heranziehen.
    let chunks = suchChunks;
    if (chunks.length === 0) {
      const analyse = await ladeStatusAnalyse().catch(() => null);
      if (analyse && analyse.zutreffend.length > 0) {
        chunks = anforderungenAlsChunks(
          analyse.zutreffend.map((zeile) => zeile.anforderung)
        );
      }
    }

    const systemPrompt = baueSystemPrompt({
      chunks,
      profil,
      rechtsstand,
      tiefe,
      eskalationsHinweis: eskalation?.trim() || ESKALATION_FALLBACK,
      kontextLinie,
    });

    const ergebnis = await frageClaude(systemPrompt, [], frage, tiefe);
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

    const preview = isPreviewMode();

    // Automatisch in den Verlauf – „vergessen zu sichern“ gibt es nicht
    let verlaufId: string | null = null;
    let createdAt = new Date().toISOString();
    if (profil.profilId) {
      const gespeichert = await speichereVerlauf({
        profilId: profil.profilId,
        frage,
        antwortMarkdown: antwort,
        erklaertiefe: tiefe,
        quellen,
        rechtsstand,
        preview,
        produktlinieKontext: kontextLinie,
      });
      if (gespeichert) {
        verlaufId = gespeichert.id;
        createdAt = gespeichert.createdAt;
      }
    }

    return {
      status: "ok",
      antwort,
      quellen,
      grenze: antwort.includes(GRENZE_MARKER),
      preview,
      rechtsstand,
      verlaufId,
      createdAt,
    };
  } catch (fehler) {
    console.error(
      "Assistant: Frage fehlgeschlagen:",
      fehler instanceof Error ? fehler.message : fehler
    );
    return { status: "fehler", art: "unbekannt" };
  }
}

/** Merken-Flag einer gespeicherten Antwort umschalten. */
export async function merkeAntwort(
  verlaufId: string,
  gemerkt: boolean
): Promise<{ ok: boolean }> {
  const zugang = await pruefeZugang();
  if (!zugang?.freigeschaltet) return { ok: false };
  if (!/^[0-9a-f-]{36}$/i.test(verlaufId)) return { ok: false };

  const profil = await ladeProfilKontext(zugang.user.id);
  if (!profil.profilId) return { ok: false };
  const ok = await setzeVerlaufGemerkt(profil.profilId, verlaufId, gemerkt);
  return { ok };
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
