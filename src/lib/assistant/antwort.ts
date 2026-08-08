import "server-only";

import Anthropic from "@anthropic-ai/sdk";
import type { Erklaertiefe } from "./prompt";

/**
 * Claude-Aufruf des Assistant. Modell und Grenzen sind bewusst fest:
 * claude-sonnet-4-6, max_tokens 1500, 45-s-Timeout ohne SDK-Retries –
 * schlägt der Aufruf fehl, liefert der Aufrufer einen sauberen
 * Fallback-Hinweis statt eines Stacktraces.
 */

const MODELL = "claude-sonnet-4-6";
const MAX_TOKENS = 1500;
const TIMEOUT_MS = 45_000;

export interface ChatNachricht {
  rolle: "nutzer" | "assistant";
  text: string;
}

export type ClaudeErgebnis =
  | { ok: true; text: string }
  | { ok: false; fehler: "timeout" | "ueberlastet" | "konfiguration" | "unbekannt" };

export async function frageClaude(
  systemPrompt: string,
  verlauf: ChatNachricht[],
  frage: string,
  tiefe: Erklaertiefe
): Promise<ClaudeErgebnis> {
  if (!process.env.ANTHROPIC_API_KEY) {
    return { ok: false, fehler: "konfiguration" };
  }

  const client = new Anthropic({
    timeout: TIMEOUT_MS,
    maxRetries: 1,
  });

  const messages: Anthropic.MessageParam[] = [
    ...verlauf.map((n) => ({
      role: n.rolle === "nutzer" ? ("user" as const) : ("assistant" as const),
      content: n.text,
    })),
    {
      role: "user" as const,
      content: `[Erklärtiefe: ${tiefe}]\n${frage}`,
    },
  ];

  try {
    const antwort = await client.messages.create({
      model: MODELL,
      max_tokens: MAX_TOKENS,
      system: systemPrompt,
      messages,
    });
    const text = antwort.content
      .filter((block): block is Anthropic.TextBlock => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();
    if (!text) return { ok: false, fehler: "unbekannt" };
    return { ok: true, text };
  } catch (fehler) {
    if (fehler instanceof Anthropic.APIConnectionTimeoutError) {
      return { ok: false, fehler: "timeout" };
    }
    if (
      fehler instanceof Anthropic.RateLimitError ||
      fehler instanceof Anthropic.InternalServerError
    ) {
      return { ok: false, fehler: "ueberlastet" };
    }
    if (fehler instanceof Anthropic.AuthenticationError) {
      console.error("Assistant: ANTHROPIC_API_KEY ungültig.");
      return { ok: false, fehler: "konfiguration" };
    }
    console.error(
      "Assistant: Claude-Aufruf fehlgeschlagen:",
      fehler instanceof Error ? fehler.message : fehler
    );
    return { ok: false, fehler: "unbekannt" };
  }
}
