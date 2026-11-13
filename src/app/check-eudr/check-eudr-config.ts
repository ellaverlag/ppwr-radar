import "server-only";

import { cookies } from "next/headers";
import type { EudrKontext } from "@/lib/rollen-engine";

/**
 * Kostenloser EUDR-Check: bis zu fünf Fragen je Verpackung (Material,
 * Verwendung, Herkunft, Rezyklat, neu/gebraucht) – die Fragen entsprechen
 * den Engine-Eingaben des EUDR-Strangs (Regeln E1–E9). Antworten leben nur
 * im Session-Cookie, anonym, ohne Datenbank-Schreibzugriff (Muster /check).
 * Früher Ausstieg: kein EUDR-Material (E1) oder nur genutzt (E2).
 */
export const EUDR_CHECK_COOKIE = "ppwr_check_eudr";

export const EUDR_CHECK_FRAGEN = {
  material: ["papier_pappe", "holz", "naturkautschuk", "verbund_papier", "nicht_relevant"],
  verwendung: ["nur_genutzt", "leer_verkauft"],
  bezug: ["import_drittland", "selbst_hergestellt_aus_eu_vormaterial", "fertig_gekauft_eu"],
  rezyklat: ["vollstaendig", "teilweise", "keins", "unbekannt"],
  erzeugnis: ["neu", "gebraucht_oder_mehrweg_nach_erstnutzung"],
} as const;

export type EudrCheckFrage = keyof typeof EUDR_CHECK_FRAGEN;
export const EUDR_CHECK_REIHENFOLGE: EudrCheckFrage[] = [
  "material",
  "verwendung",
  "bezug",
  "rezyklat",
  "erzeugnis",
];
export const EUDR_CHECK_MAX = EUDR_CHECK_REIHENFOLGE.length;

export type EudrCheckAntworten = Partial<Record<EudrCheckFrage, string>>;

export function istEudrCheckFrage(wert: string): wert is EudrCheckFrage {
  return (EUDR_CHECK_REIHENFOLGE as string[]).includes(wert);
}

export function istGueltigeAntwort(frage: EudrCheckFrage, wert: string): boolean {
  return (EUDR_CHECK_FRAGEN[frage] as readonly string[]).includes(wert);
}

/** Fragen, die nach den bisherigen Antworten noch relevant sind (in Reihenfolge). */
export function relevanteFragen(a: EudrCheckAntworten): EudrCheckFrage[] {
  if (a.material === "nicht_relevant") return ["material"];
  if (a.verwendung === "nur_genutzt") return ["material", "verwendung"];
  return EUDR_CHECK_REIHENFOLGE;
}

export function istVollstaendig(a: EudrCheckAntworten): boolean {
  return relevanteFragen(a).every((f) => a[f] != null);
}

/** Check-Antworten → Engine-Kontext (Verbund mit Papieranteil zählt als Papier/Pappe). */
export function kontextAusEudrCheck(a: EudrCheckAntworten): EudrKontext {
  const material =
    a.material === "verbund_papier"
      ? "papier_pappe"
      : ((a.material ?? "unbekannt") as EudrKontext["material"]);
  return {
    material,
    verwendung: (a.verwendung ?? null) as EudrKontext["verwendung"],
    bezug: (a.bezug ?? null) as EudrKontext["bezug"],
    rezyklat: (a.rezyklat ?? null) as EudrKontext["rezyklat"],
    erzeugnis: (a.erzeugnis ?? null) as EudrKontext["erzeugnis"],
    groesse2024: null,
  };
}

export async function leseEudrCheck(): Promise<EudrCheckAntworten> {
  const store = await cookies();
  const raw = store.get(EUDR_CHECK_COOKIE)?.value;
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return {};
    const sauber: EudrCheckAntworten = {};
    for (const f of EUDR_CHECK_REIHENFOLGE) {
      const w = (parsed as Record<string, unknown>)[f];
      if (typeof w === "string" && istGueltigeAntwort(f, w)) sauber[f] = w;
    }
    return sauber;
  } catch {
    return {};
  }
}

export async function schreibeEudrCheck(antworten: EudrCheckAntworten) {
  const store = await cookies();
  store.set(EUDR_CHECK_COOKIE, JSON.stringify(antworten), {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 60 * 60,
    path: "/",
  });
}
