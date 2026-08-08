import "server-only";

import type { HerleitungsEintrag, RollenSet } from "@/lib/rollen-engine";
import { createClient } from "@/lib/supabase/server";

/**
 * Profil-Kontext für den Assistant: Rollen je Produktlinie (aktuelle
 * Engine-Ergebnisse mit Kurzherleitung) und die erfassten Verpackungs-
 * merkmale. Gelesen über den Session-Client (own-row-RLS); stillgelegte
 * Linien bleiben außen vor. Firmenname und andere Personen-/Firmendaten
 * gehören bewusst NICHT hinein – der Kontext dient nur der fachlichen
 * Einordnung (und anonymisiert dem Frage-Kandidaten-Baustein).
 */

export interface ProfilKontextAssistant {
  /** Für den Verlaufs-Insert; null, wenn kein (fertiges) Profil existiert. */
  profilId: string | null;
  linien: {
    name: string;
    rollen: string[];
    herleitungKurz: string[];
    merkmale: string[];
    lebensmittelkontakt: boolean;
  }[];
  /** Namen ALLER aktiven Linien (auch bei nurLinie-Filter, für den Prompt). */
  alleLinienNamen: string[];
  /** Vereinigte Rollen/Verpackungstypen – für frage_kandidaten.kontext. */
  rollen: string[];
  verpackungstypen: string[];
}

export async function ladeProfilKontext(
  userId: string,
  /** Kontext-Umschalter: nur diese Produktlinie in den Prompt geben. */
  nurLinie?: string | null
): Promise<ProfilKontextAssistant> {
  const supabase = await createClient();
  const leer: ProfilKontextAssistant = {
    profilId: null,
    linien: [],
    alleLinienNamen: [],
    rollen: [],
    verpackungstypen: [],
  };

  const { data: profil } = await supabase
    .from("profile")
    .select("id, onboarding_abgeschlossen")
    .eq("user_id", userId)
    .maybeSingle();
  if (!profil?.onboarding_abgeschlossen) return leer;

  const [{ data: verpackungen }, { data: ergebnisse }] = await Promise.all([
    supabase
      .from("profil_verpackungen")
      .select("bezeichnung, verpackungstyp, materialien, lebensmittelkontakt, mehrweg, status")
      .eq("profil_id", profil.id),
    supabase
      .from("rollen_ergebnisse")
      .select("produktlinie, rollen_set, herleitung")
      .eq("profil_id", profil.id)
      .eq("aktuell", true),
  ]);

  const alleAktiven = (verpackungen ?? []).filter(
    (zeile) => zeile.status !== "stillgelegt"
  );
  const aktive = nurLinie
    ? alleAktiven.filter((zeile) => zeile.bezeichnung === nurLinie)
    : alleAktiven;
  const ergebnisNachName = new Map(
    (ergebnisse ?? []).map((zeile) => [zeile.produktlinie as string, zeile])
  );

  const alleRollen = new Set<string>();
  const alleTypen = new Set<string>();

  const linien = aktive.map((zeile) => {
    const name = zeile.bezeichnung as string;
    const ergebnis = ergebnisNachName.get(name);
    const rollenSet = (ergebnis?.rollen_set ?? null) as RollenSet | null;
    const herleitung = (ergebnis?.herleitung ?? []) as HerleitungsEintrag[];

    const rollen = rollenSet?.rollen ?? [];
    for (const rolle of rollen) alleRollen.add(rolle);
    // verpackungstyp ist die kommagetrennte F05-Auswahl („verkauf, transport“)
    for (const typ of ((zeile.verpackungstyp as string | null) ?? "")
      .split(",")
      .map((t) => t.trim())
      .filter((t) => t && t !== "unbestimmt")) {
      alleTypen.add(typ);
    }

    const merkmale: string[] = [];
    if (zeile.verpackungstyp) merkmale.push(zeile.verpackungstyp as string);
    for (const material of (zeile.materialien as string[] | null) ?? []) {
      merkmale.push(material);
    }
    if (zeile.mehrweg) merkmale.push("mehrweg");

    return {
      name,
      rollen,
      herleitungKurz: herleitung
        .filter((h) => h.erlaeuterung)
        .slice(0, 3)
        .map((h) => `${h.erlaeuterung} (${h.fundstelle_primaer})`),
      merkmale,
      lebensmittelkontakt: Boolean(zeile.lebensmittelkontakt),
    };
  });

  return {
    profilId: profil.id as string,
    linien,
    alleLinienNamen: alleAktiven.map((zeile) => zeile.bezeichnung as string),
    rollen: [...alleRollen],
    verpackungstypen: [...alleTypen],
  };
}
