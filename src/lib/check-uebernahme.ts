import "server-only";

import { leseCheckAntworten } from "@/app/check/check-config";
import {
  ersteinschaetzung,
  kontexteAusCheckAntworten,
  type BetroffenheitsStufe,
} from "@/lib/check-einschaetzung";
import { evaluiereLinie } from "@/lib/rollen-engine";
import { ladeRegeln } from "@/lib/rollen-service";
import { createClient } from "@/lib/supabase/server";

/**
 * „Ergebnis sichern“: Beim ersten Dashboard-Besuch nach der Registrierung
 * wird die Ersteinschätzung aus dem Check-Session-Cookie ins Profil
 * übernommen (profile.taetigkeiten.check_ersteinschaetzung); den Cookie
 * löscht die Auth-Middleware auf derselben Response. Hinweis: Der spätere
 * Onboarding-Wizard überschreibt taetigkeiten – bis dahin hat die Karte im
 * Vorzimmer ihren Zweck erfüllt.
 */

export interface GesicherteEinschaetzung {
  stufe: BetroffenheitsStufe;
  unklar: boolean;
  rollen: string[];
  datum: string;
}

function gespeicherteEinschaetzung(
  taetigkeiten: unknown
): GesicherteEinschaetzung | null {
  if (!taetigkeiten || typeof taetigkeiten !== "object") return null;
  const wert = (taetigkeiten as Record<string, unknown>)
    .check_ersteinschaetzung as GesicherteEinschaetzung | undefined;
  return wert && typeof wert === "object" && "stufe" in wert ? wert : null;
}

export async function uebernehmeCheckErgebnis(
  userId: string
): Promise<GesicherteEinschaetzung | null> {
  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profile")
    .select("id, taetigkeiten")
    .eq("user_id", userId)
    .maybeSingle();

  const gespeichert = gespeicherteEinschaetzung(profil?.taetigkeiten);

  const antworten = await leseCheckAntworten();
  if (antworten.sitz == null || antworten.taetigkeit == null) {
    return gespeichert;
  }

  // Frisches Check-Ergebnis auswerten (gleiche Logik wie /check/ergebnis)
  let einschaetzung: GesicherteEinschaetzung;
  try {
    const regeln = await ladeRegeln();
    if (regeln.length === 0) return gespeichert;
    const { unternehmen, linie, taetigkeit } = kontexteAusCheckAntworten(antworten);
    const ergebnis = evaluiereLinie(regeln, unternehmen, linie);
    const { stufe, unklar } = ersteinschaetzung(ergebnis, taetigkeit);
    einschaetzung = {
      stufe,
      unklar,
      rollen: ergebnis.rollen_set.rollen,
      datum: new Date().toISOString().slice(0, 10),
    };
  } catch {
    return gespeichert;
  }

  // Ins Profil übernehmen (Zeile bei Bedarf anlegen; Own-Row-RLS)
  let profilId = profil?.id as string | undefined;
  let taetigkeiten = (profil?.taetigkeiten as Record<string, unknown>) ?? {};
  if (!profilId) {
    const { data: neu, error } = await supabase
      .from("profile")
      .insert({ user_id: userId })
      .select("id, taetigkeiten")
      .single();
    if (error || !neu) return einschaetzung; // anzeigen, auch wenn Sichern scheitert
    profilId = neu.id;
    taetigkeiten = (neu.taetigkeiten as Record<string, unknown>) ?? {};
  }

  const { error: updError } = await supabase
    .from("profile")
    .update({
      taetigkeiten: { ...taetigkeiten, check_ersteinschaetzung: einschaetzung },
    })
    .eq("id", profilId);
  if (updError) {
    console.error("Check-Ergebnis nicht speicherbar:", updError.message);
  }

  return einschaetzung;
}
