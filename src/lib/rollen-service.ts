import "server-only";

import { createClient as createBareClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Antwort, WizardState } from "@/lib/onboarding";
import {
  ENGINE_VERSION,
  evaluiereAlle,
  type LinienErgebnis,
  type LinienKontext,
  type RegelRow,
  type UnternehmenKontext,
} from "@/lib/rollen-engine";
import { createClient as createSessionClient } from "@/lib/supabase/server";

/**
 * IO-Schicht der Rollen-Engine.
 *
 * Die RLS-Policies erlauben eingeloggten Nutzern nur das Lesen
 * freigegebener Regeln und kein Schreiben in rollen_ergebnisse. Die Engine
 * muss aber laut Fachkonzept auch ungeprüfte Regeln auswerten (Flag-'!'-
 * Markierung statt Ausschluss). Deshalb nutzt dieses Modul den
 * Service-Role-Client, sobald der Schlüssel vorhanden ist (Preview UND
 * Produktion), und fällt sonst auf den Session-Client zurück.
 */
function privilegierterClient(): SupabaseClient | null {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) return null;
  return createBareClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

async function leseClient(): Promise<SupabaseClient> {
  return privilegierterClient() ?? (await createSessionClient());
}

export async function ladeRegeln(): Promise<RegelRow[]> {
  const client = await leseClient();
  const { data, error } = await client
    .from("rollen_regeln")
    .select("*")
    .eq("aktiv", true)
    .order("prioritaet", { ascending: true });
  if (error) {
    throw new Error(`Rollen-Regeln konnten nicht geladen werden: ${error.message}`);
  }
  return (data ?? []) as RegelRow[];
}

/** Begriffe (auch ungeprüfte) für Labels und die Verwechslungsfalle-Karte. */
export async function ladeRollenBegriffe(): Promise<
  Record<string, { begriff_de: string; fundstelle_ppwr: string; verwechslungsfaelle: string | null }>
> {
  const client = await leseClient();
  const { data } = await client
    .from("rollen_definitionen")
    .select("rolle_id, begriff_de, fundstelle_ppwr, verwechslungsfaelle")
    .eq("aktiv", true);
  const map: Record<
    string,
    { begriff_de: string; fundstelle_ppwr: string; verwechslungsfaelle: string | null }
  > = {};
  for (const row of data ?? []) {
    map[row.rolle_id as string] = {
      begriff_de: row.begriff_de as string,
      fundstelle_ppwr: row.fundstelle_ppwr as string,
      verwechslungsfaelle: row.verwechslungsfaelle as string | null,
    };
  }
  return map;
}

/**
 * Wizard-Fragen für den öffentlichen Betroffenheits-Check. Der reguläre
 * Datenpfad (wissensbasis.getWizardFragen) läuft für anonyme Besucher gegen
 * die authenticated-RLS und liefert nichts – daher derselbe privilegierte
 * Fallback wie bei den Regeln.
 */
export async function ladeWizardFragenOeffentlich(frageIds: string[]) {
  const client = await leseClient();
  const { data, error } = await client
    .from("wizard_fragen")
    .select("*")
    .in("frage_id", frageIds)
    .order("reihenfolge", { ascending: true });
  if (error) {
    throw new Error(`Wizard-Fragen konnten nicht geladen werden: ${error.message}`);
  }
  return data ?? [];
}

export async function ladeAppConfig(key: string): Promise<string | null> {
  const client = await leseClient();
  const { data } = await client
    .from("app_config")
    .select("value")
    .eq("key", key)
    .maybeSingle();
  return (data?.value as string | undefined) ?? null;
}

// ---------------------------------------------------------------------------
// WizardState → Engine-Kontexte
// ---------------------------------------------------------------------------

const einzel = (a: Antwort | undefined): string | null =>
  typeof a === "string" && a !== "" ? a : null;

const mehrfach = (a: Antwort | undefined): string[] =>
  Array.isArray(a) ? a : [];

export function unternehmenAusState(state: WizardState): UnternehmenKontext {
  const sitz = (einzel(state.unternehmen.sitz) ?? "DE") as UnternehmenKontext["sitz"];
  return {
    sitz,
    niederlassungDE:
      sitz === "DE" || einzel(state.unternehmen.niederlassung_DE) === "ja",
    kleinstunternehmen:
      einzel(state.unternehmen.unternehmensgroesse) === "kleinstunternehmen",
  };
}

export function linienAusState(state: WizardState): LinienKontext[] {
  return state.produktlinien.map((name, index) => {
    const a = state.linien[String(index)] ?? {};
    return {
      name,
      verpackungsart: mehrfach(a.verpackungsart),
      taetigkeit: mehrfach(a.taetigkeit),
      marke: einzel(a.marke_auf_verpackung) as LinienKontext["marke"],
      lieferantSitz: einzel(
        a.verpackungslieferant_sitz
      ) as LinienKontext["lieferantSitz"],
      ersteBereitstellung: einzel(
        a.erste_bereitstellung_aus_DE_in_DE
      ) as LinienKontext["ersteBereitstellung"],
      vertriebsweg: mehrfach(a.vertriebsweg),
      istEndabnehmer: einzel(a.ist_endabnehmer) as LinienKontext["istEndabnehmer"],
      dienstleistungen: mehrfach(a.dienstleistungen),
      lebensmittelkontakt:
        einzel(a.lebensmittelkontakt) === null
          ? null
          : einzel(a.lebensmittelkontakt) === "ja",
    };
  });
}

// ---------------------------------------------------------------------------
// Auswerten + Persistieren
// ---------------------------------------------------------------------------

function ermittleRechtsstand(regeln: RegelRow[]): string {
  return (
    regeln
      .map((r) => r.rechtsstand)
      .filter(Boolean)
      .sort()
      .at(-1) ?? new Date().toISOString().slice(0, 10)
  );
}

function erfordereSchreibClient(): SupabaseClient {
  const schreibClient = privilegierterClient();
  if (!schreibClient) {
    throw new Error(
      "Rollen-Ergebnisse können ohne SUPABASE_SERVICE_ROLE_KEY nicht gespeichert werden."
    );
  }
  return schreibClient;
}

/**
 * Ergebnisse schreiben mit Versionierung: alte Zeilen der betroffenen
 * Produktlinien werden nicht gelöscht, sondern als überholt markiert
 * (aktuell = false) – bestehende Dokumente behalten ihren Erstellungs-Bezug.
 */
async function speichereErgebnisse(
  schreibClient: SupabaseClient,
  profilId: string,
  ergebnisse: LinienErgebnis[],
  rechtsstand: string
): Promise<void> {
  const namen = ergebnisse.map((e) => e.produktlinie);
  const { error: updError } = await schreibClient
    .from("rollen_ergebnisse")
    .update({ aktuell: false })
    .eq("profil_id", profilId)
    .in("produktlinie", namen)
    .eq("aktuell", true);
  if (updError) {
    throw new Error(
      `Alte Rollen-Ergebnisse nicht markierbar: ${updError.message}`
    );
  }

  const { error: insError } = await schreibClient.from("rollen_ergebnisse").insert(
    ergebnisse.map((e) => ({
      profil_id: profilId,
      produktlinie: e.produktlinie,
      rollen_set: e.rollen_set,
      herleitung: e.herleitung,
      rechtsstand,
      engine_version: ENGINE_VERSION,
    }))
  );
  if (insError) {
    throw new Error(`Rollen-Ergebnisse nicht speicherbar: ${insError.message}`);
  }
}

export async function werteAusUndSpeichere(
  profilId: string,
  state: WizardState
): Promise<LinienErgebnis[]> {
  const regeln = await ladeRegeln();
  if (regeln.length === 0) {
    throw new Error(
      "Keine Rollen-Regeln verfügbar (Service-Role-Key fehlt oder Regeln nicht freigegeben)."
    );
  }

  const ergebnisse = evaluiereAlle(
    regeln,
    unternehmenAusState(state),
    linienAusState(state)
  );

  const schreibClient = erfordereSchreibClient();

  // Vollständiger Durchlauf: auch Ergebnisse entfallener Linien überholen
  const { error: altError } = await schreibClient
    .from("rollen_ergebnisse")
    .update({ aktuell: false })
    .eq("profil_id", profilId)
    .eq("aktuell", true);
  if (altError) {
    throw new Error(
      `Alte Rollen-Ergebnisse nicht markierbar: ${altError.message}`
    );
  }

  await speichereErgebnisse(
    schreibClient,
    profilId,
    ergebnisse,
    ermittleRechtsstand(regeln)
  );
  return ergebnisse;
}

/**
 * Engine-Lauf für GENAU EINE Produktlinie (Mini-Wizard der Verpackungs-
 * Verwaltung). Liefert zusätzlich das vorherige Rollen-Set der Linie,
 * damit der Aufrufer betroffene Dokumente mit dem Update-Flag versehen
 * kann. Gleiche Engine, gleiche Kontext-Ableitung wie das Onboarding.
 */
export async function werteLinieAusUndSpeichere(
  profilId: string,
  state: WizardState,
  linie: number
): Promise<{ ergebnis: LinienErgebnis; vorherigeRollen: string[] | null }> {
  const regeln = await ladeRegeln();
  if (regeln.length === 0) {
    throw new Error(
      "Keine Rollen-Regeln verfügbar (Service-Role-Key fehlt oder Regeln nicht freigegeben)."
    );
  }

  const kontext = linienAusState(state)[linie];
  if (!kontext) {
    throw new Error(`Produktlinie ${linie} existiert nicht im Profil.`);
  }

  const [ergebnis] = evaluiereAlle(regeln, unternehmenAusState(state), [
    kontext,
  ]);

  const schreibClient = erfordereSchreibClient();
  const { data: vorher } = await schreibClient
    .from("rollen_ergebnisse")
    .select("rollen_set")
    .eq("profil_id", profilId)
    .eq("produktlinie", kontext.name)
    .eq("aktuell", true)
    .maybeSingle();
  const vorherigeRollen = vorher
    ? ((vorher.rollen_set as { rollen?: string[] })?.rollen ?? [])
    : null;

  await speichereErgebnisse(
    schreibClient,
    profilId,
    [ergebnis],
    ermittleRechtsstand(regeln)
  );
  return { ergebnis, vorherigeRollen };
}

/**
 * Umbenennen einer Linie: rollen_ergebnisse hängen am Produktlinien-Namen –
 * beim Ändern des Kurznamens werden alle Zeilen (auch überholte) nachgezogen,
 * damit Historie und Anzeige konsistent bleiben.
 */
export async function benenneLinienErgebnisseUm(
  profilId: string,
  alterName: string,
  neuerName: string
): Promise<void> {
  const schreibClient = erfordereSchreibClient();
  const { error } = await schreibClient
    .from("rollen_ergebnisse")
    .update({ produktlinie: neuerName })
    .eq("profil_id", profilId)
    .eq("produktlinie", alterName);
  if (error) {
    throw new Error(`Rollen-Ergebnisse nicht umbenennbar: ${error.message}`);
  }
}

/** Harte Löschung der Ergebnisse einer Linie (nur für Linien ohne Dokumente). */
export async function loescheLinienErgebnisse(
  profilId: string,
  produktlinie: string
): Promise<void> {
  const schreibClient = erfordereSchreibClient();
  const { error } = await schreibClient
    .from("rollen_ergebnisse")
    .delete()
    .eq("profil_id", profilId)
    .eq("produktlinie", produktlinie);
  if (error) {
    throw new Error(`Rollen-Ergebnisse nicht löschbar: ${error.message}`);
  }
}
