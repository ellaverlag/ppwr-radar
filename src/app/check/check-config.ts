import "server-only";

import { cookies } from "next/headers";

/**
 * Der Betroffenheits-Check nutzt fünf ausgewählte Wizard-Fragen
 * (Sitz, Kerntätigkeiten, Verpackungsart, Vertriebsweg, Lebensmittelkontakt)
 * in dieser Reihenfolge. Antworten leben nur im Session-Cookie – anonym,
 * ohne Datenbank-Schreibzugriff.
 */
export const CHECK_FRAGE_IDS = ["F01", "F06", "F05", "F10", "F13"];

export const CHECK_COOKIE = "ppwr_check";

export type CheckAntworten = Record<string, string | string[]>;

export async function leseCheckAntworten(): Promise<CheckAntworten> {
  const store = await cookies();
  const raw = store.get(CHECK_COOKIE)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

export async function schreibeCheckAntworten(antworten: CheckAntworten) {
  const store = await cookies();
  store.set(CHECK_COOKIE, JSON.stringify(antworten), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });
}
