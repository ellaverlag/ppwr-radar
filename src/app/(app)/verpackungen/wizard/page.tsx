import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { WizardOptionsListe } from "@/components/wizard-optionen";
import {
  computeLinienFragen,
  linienFrageBeantwortet,
  parseState,
} from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import { ladeErklaerungen } from "@/lib/wizard-erklaerungen";
import { getWizardFragen } from "@/lib/wissensbasis";
import { erforderePaket } from "@/lib/zugang";
import { linieAbschliessen, linieBenennen, linienAntwortSpeichern } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("verpackungen") };
}

export const dynamic = "force-dynamic";

const FEHLER_KEYS = ["name", "doppelt", "antwort", "engine"] as const;

/**
 * Mini-Wizard der Produktlinien-Verwaltung: exakt die produktlinien-
 * bezogenen Fragen des Onboardings (F05 ff.) für genau eine Linie –
 * Unternehmensfragen und Stammdaten werden nicht erneut gestellt.
 * Ohne ?linie: Namensschritt einer neuen Linie; mit ?linie: Fragen
 * (vorbelegt bei Bearbeitung), am Ende der Engine-Lauf für diese Linie.
 */
export default async function VerpackungsWizardPage({
  searchParams,
}: {
  searchParams: Promise<{ linie?: string; s?: string; fehler?: string }>;
}) {
  const zugang = await erforderePaket();
  const params = await searchParams;
  const t = await getTranslations("Verpackungen");
  const tOnboarding = await getTranslations("Onboarding");
  const tCommon = await getTranslations("Common");

  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profile")
    .select("id, onboarding_abgeschlossen, taetigkeiten")
    .eq("user_id", zugang.user.id)
    .maybeSingle();
  if (!profil?.onboarding_abgeschlossen) redirect("/verpackungen");

  const state = parseState(profil.taetigkeiten);
  const fehlerKey = FEHLER_KEYS.find((key) => key === params.fehler);
  const fehlerText = fehlerKey ? t(`wizardFehler.${fehlerKey}`) : null;

  const linie = params.linie == null ? null : Number(params.linie);
  if (linie != null && (!Number.isInteger(linie) || linie < 0 || linie >= state.produktlinien.length)) {
    redirect("/verpackungen");
  }

  // ----- Namensschritt: Kurzname + Beschreibung (Anlegen UND Bearbeiten) --
  // Zwei getrennte Zwecke: bezeichnung ist das knappe Anzeige-Etikett,
  // zusatzangaben der lange Freitext als Kontext für Assistant und Analyse.
  if (linie == null || params.s == null) {
    let nameVorbelegt = "";
    let beschreibungVorbelegt = "";
    if (linie != null) {
      nameVorbelegt = state.produktlinien[linie];
      const imState = state.linien[String(linie)]?.["_beschreibung"];
      if (typeof imState === "string") {
        beschreibungVorbelegt = imState;
      } else {
        const { data: zeile } = await supabase
          .from("profil_verpackungen")
          .select("zusatzangaben")
          .eq("profil_id", profil.id)
          .eq("bezeichnung", nameVorbelegt)
          .maybeSingle();
        beschreibungVorbelegt = (zeile?.zusatzangaben as string | null) ?? "";
      }
    }

    return (
      <div className="mx-auto w-full max-w-[680px]">
        <header className="mb-8">
          <h1 className="text-display-sm text-ink">
            {linie == null ? t("wizardTitelNeu") : t("wizardTitelBearbeiten")}
          </h1>
          <p className="mt-3 text-body text-ink-muted">
            {t("wizardNameHinweis")}
          </p>
        </header>

        {fehlerText && (
          <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
            {fehlerText}
          </p>
        )}

        <div className="rounded border border-line bg-canvas p-6 md:p-10">
          <form action={linieBenennen}>
            {linie != null && (
              <input type="hidden" name="linie" value={linie} />
            )}

            <label
              htmlFor="name"
              className="block text-label uppercase text-ink-muted"
            >
              {t("kurznameLabel")} *
            </label>
            <input
              id="name"
              name="name"
              type="text"
              required
              maxLength={60}
              defaultValue={nameVorbelegt}
              placeholder={t("kurznamePlaceholder")}
              className="mt-2 w-full rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
            />
            <p className="mt-2 text-body-sm text-ink-muted">
              {t("kurznameHilfe")}
            </p>

            <label
              htmlFor="beschreibung"
              className="mt-8 block text-label uppercase text-ink-muted"
            >
              {t("beschreibungLabel")}
            </label>
            <textarea
              id="beschreibung"
              name="beschreibung"
              rows={6}
              defaultValue={beschreibungVorbelegt}
              className="mt-2 w-full rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink focus:border-ink focus:outline-none"
            />
            <p className="mt-2 text-body-sm text-ink-muted">
              {t("beschreibungHilfe")}
            </p>

            <div className="mt-10 flex items-center justify-between">
              <Link
                href="/verpackungen"
                className="text-body-sm font-medium text-ink-muted hover:text-ink"
              >
                {t("wizardZurUebersicht")}
              </Link>
              <button
                type="submit"
                className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
              >
                {t("wizardStart")}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  // ----- Fragen einer bestehenden Linie ----------------------------------
  const name = state.produktlinien[linie];

  const fragen = await getWizardFragen();
  if (fragen.length === 0) {
    return (
      <p className="text-body text-ink-muted">
        {tOnboarding("fragenNichtVerfuegbar")}
      </p>
    );
  }

  const schritte = computeLinienFragen(fragen, state, linie);
  const ersterOffener = schritte.findIndex(
    (frage) => !linienFrageBeantwortet(frage, state, linie)
  );

  let aktivIndex =
    params.s != null && Number.isInteger(Number(params.s))
      ? Number(params.s)
      : ersterOffener === -1
        ? 0
        : ersterOffener;
  if (aktivIndex < 0) aktivIndex = 0;

  // Alle Fragen beantwortet und hinter der letzten Frage → Abschluss-Schritt
  const zeigeAbschluss = ersterOffener === -1 && aktivIndex >= schritte.length;
  if (!zeigeAbschluss && aktivIndex >= schritte.length) {
    // Unbeantwortete Fragen übrig: zurück zum ersten offenen Schritt
    aktivIndex = ersterOffener === -1 ? schritte.length - 1 : ersterOffener;
  }

  const frage = zeigeAbschluss ? null : schritte[aktivIndex];
  const erklaerungen = frage ? await ladeErklaerungen(frage.frage_id) : {};
  const bisherige = frage
    ? state.linien[String(linie)]?.[frage.ziel_variable.split(";")[0].trim()]
    : undefined;

  return (
    <div className="mx-auto w-full max-w-[680px]">
      <header className="mb-8">
        <p className="text-label uppercase tracking-widest text-legal">
          {tOnboarding("produktlinieLabel", { name })}
        </p>
        <h1 className="mt-1 text-display-sm text-ink">
          {t("wizardTitelBearbeiten")}
        </h1>
      </header>

      {!zeigeAbschluss && (
        <div className="mb-8">
          <p className="mb-2 text-label uppercase text-ink-muted">
            {t("wizardFortschritt", {
              aktuell: aktivIndex + 1,
              gesamt: schritte.length,
            })}
          </p>
          <div className="h-1.5 w-full rounded-full bg-line">
            <div
              className="h-1.5 rounded-full bg-primary"
              style={{
                width: `${Math.round(((aktivIndex + 1) / Math.max(schritte.length, 1)) * 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {fehlerText && (
        <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
          {fehlerText}
        </p>
      )}

      <div className="rounded border border-line bg-canvas p-6 md:p-10">
        {frage && (
          <form action={linienAntwortSpeichern}>
            <input type="hidden" name="frage_id" value={frage.frage_id} />
            <input type="hidden" name="linie" value={linie} />
            <input type="hidden" name="schritt" value={aktivIndex} />

            <h2 className="text-headline text-ink">{frage.frage_text}</h2>
            {frage.antwort_typ === "multi_select" && (
              <p className="mt-2 text-body-sm text-ink-muted">
                {tOnboarding("mehrfachauswahl")}
              </p>
            )}
            {frage.hinweis_ui && (
              <p className="mt-4 flex gap-2 text-body-sm text-ink-muted">
                <span aria-hidden="true" className="shrink-0 text-legal">
                  ⓘ
                </span>
                <span>{frage.hinweis_ui}</span>
              </p>
            )}

            <div className="mt-8 space-y-3">
              <WizardOptionsListe
                frage={frage}
                bisherige={
                  Array.isArray(bisherige) || typeof bisherige === "string"
                    ? bisherige
                    : undefined
                }
                erklaerungen={erklaerungen}
              />
            </div>

            <div className="mt-10 flex items-center justify-between">
              <Link
                href={
                  aktivIndex > 0
                    ? `/verpackungen/wizard?linie=${linie}&s=${aktivIndex - 1}`
                    : `/verpackungen/wizard?linie=${linie}`
                }
                className="text-body-sm font-medium text-ink-muted hover:text-ink"
              >
                {tCommon("zurueck")}
              </Link>
              <button
                type="submit"
                className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
              >
                {tCommon("weiter")}
              </button>
            </div>
          </form>
        )}

        {zeigeAbschluss && (
          <form action={linieAbschliessen}>
            <input type="hidden" name="linie" value={linie} />
            <h2 className="text-headline text-ink">
              {t("wizardAbschlussTitel")}
            </h2>
            <p className="mt-2 text-body text-ink-muted">
              {t("wizardAbschlussText", { name })}
            </p>
            <div className="mt-10 flex items-center justify-between">
              <Link
                href={`/verpackungen/wizard?linie=${linie}&s=${schritte.length - 1}`}
                className="text-body-sm font-medium text-ink-muted hover:text-ink"
              >
                {tCommon("zurueck")}
              </Link>
              <button
                type="submit"
                className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
              >
                {t("wizardAbschlussCta")}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
