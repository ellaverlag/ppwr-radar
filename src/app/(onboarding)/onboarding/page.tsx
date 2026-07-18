import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import {
  computeSteps,
  firstOpenStep,
  isAnswered,
  OPTION_KEYS,
  parseOptionen,
  parseState,
  stepKey,
  type WizardState,
  type WizardStep,
} from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import { getWizardFragen, type WizardFrage } from "@/lib/wissensbasis";
import {
  antwortSpeichern,
  onboardingAbschliessen,
  stammdatenSpeichern,
} from "./actions";

export const metadata: Metadata = {
  title: "Onboarding – PPWR Radar",
};

export const dynamic = "force-dynamic";

const FEHLER_TEXTE: Record<string, string> = {
  produktlinien: "Bitte legen Sie mindestens eine Produktlinie an.",
  antwort: "Bitte wählen Sie eine Antwort aus.",
  firmenname: "Bitte geben Sie Ihren Firmennamen an.",
  engine:
    "Die Rollen-Auswertung konnte nicht durchgeführt werden. Bitte versuchen Sie es erneut oder wenden Sie sich an den Support.",
};

function Fortschritt({
  aktuell,
  gesamt,
}: {
  aktuell: number;
  gesamt: number;
}) {
  const prozent = Math.round((aktuell / gesamt) * 100);
  return (
    <div className="mb-8">
      <p className="mb-2 text-label uppercase text-ink-muted">
        Schritt {aktuell} von {gesamt}
      </p>
      <div className="h-1.5 w-full rounded-full bg-line">
        <div
          className="h-1.5 rounded-full bg-primary"
          style={{ width: `${prozent}%` }}
        />
      </div>
    </div>
  );
}

function OptionRow({
  typ,
  wert,
  label,
  checked,
}: {
  typ: "radio" | "checkbox";
  wert: string;
  label: string;
  checked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded border border-line-strong bg-canvas px-5 py-4 transition-colors hover:border-ink-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
      <input
        type={typ}
        name="antwort"
        value={wert}
        defaultChecked={checked}
        required={typ === "radio"}
        className="mt-1.5 h-4 w-4 accent-[#006950]"
      />
      <span className="text-body font-semibold text-ink">{label}</span>
    </label>
  );
}

function FrageSchritt({
  frage,
  linie,
  linienName,
  state,
}: {
  frage: WizardFrage;
  linie: number | null;
  linienName: string | null;
  state: WizardState;
}) {
  const zielVariable = frage.ziel_variable.split(";")[0].trim();
  const bisherige =
    frage.frage_id === "F04"
      ? state.produktlinien
      : frage.ebene === "unternehmen"
        ? state.unternehmen[zielVariable]
        : state.linien[String(linie ?? 0)]?.[zielVariable];

  const optionen = parseOptionen(frage);
  const keys = OPTION_KEYS[frage.frage_id] ?? optionen;

  return (
    <form action={antwortSpeichern}>
      <input type="hidden" name="frage_id" value={frage.frage_id} />
      {linie != null && <input type="hidden" name="linie" value={linie} />}

      {linienName && (
        <p className="mb-3 text-label uppercase tracking-widest text-legal">
          Produktlinie · {linienName}
        </p>
      )}
      <h1 className="text-headline text-ink">{frage.frage_text}</h1>
      {frage.antwort_typ === "multi_select" && (
        <p className="mt-2 text-body-sm text-ink-muted">
          Mehrfachauswahl möglich.
        </p>
      )}

      {frage.hinweis_ui && (
        <div className="mt-6 border-l-4 border-legal bg-surface p-4">
          <p className="text-body-sm text-ink">{frage.hinweis_ui}</p>
        </div>
      )}

      <div className="mt-8 space-y-3">
        {frage.antwort_typ === "freitext_liste" ? (
          <>
            <label
              htmlFor="produktlinien"
              className="block text-label uppercase text-ink-muted"
            >
              Eine Produktlinie je Zeile
            </label>
            <textarea
              id="produktlinien"
              name="produktlinien"
              rows={5}
              required
              defaultValue={state.produktlinien.join("\n")}
              placeholder={"Feinkost im Glas\nErsatzteile im Versandkarton"}
              className="w-full rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
            />
          </>
        ) : (
          optionen.map((label, i) => {
            const wert = keys[i] ?? label;
            const checked = Array.isArray(bisherige)
              ? bisherige.includes(wert)
              : bisherige === wert;
            return (
              <OptionRow
                key={wert}
                typ={frage.antwort_typ === "multi_select" ? "checkbox" : "radio"}
                wert={wert}
                label={label}
                checked={checked}
              />
            );
          })
        )}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <ZurueckLink />
        <button
          type="submit"
          className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
        >
          Weiter →
        </button>
      </div>
    </form>
  );
}

function ZurueckLink() {
  return (
    <Link
      href="/onboarding?zurueck=1"
      className="text-body-sm font-medium text-ink-muted hover:text-ink"
    >
      ← Zurück
    </Link>
  );
}

function Eingabe({
  name,
  label,
  wert,
  required = false,
  breite = "",
}: {
  name: string;
  label: string;
  wert: string | null | undefined;
  required?: boolean;
  breite?: string;
}) {
  return (
    <div className={breite}>
      <label htmlFor={name} className="block text-label uppercase text-ink-muted">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        required={required}
        defaultValue={wert ?? ""}
        className="mt-2 w-full rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink focus:border-ink focus:outline-none"
      />
    </div>
  );
}

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ step?: string; fehler?: string; zurueck?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profil } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const state = parseState(profil?.taetigkeiten);

  const fragen = await getWizardFragen();
  if (fragen.length === 0) {
    return (
      <p className="text-body text-ink-muted">
        Die Wizard-Fragen sind aktuell nicht verfügbar. Bitte versuchen Sie es
        später erneut.
      </p>
    );
  }

  const steps = computeSteps(fragen, state);
  const open = firstOpenStep(steps, state);
  const openIndex = steps.findIndex((s) => stepKey(s) === stepKey(open));

  let aktiv: WizardStep = open;
  if (params.step) {
    const idx = steps.findIndex((s) => stepKey(s) === params.step);
    if (idx >= 0 && idx <= openIndex) aktiv = steps[idx];
  } else if (params.zurueck) {
    // Ein Schritt zurück: letzter beantworteter Schritt vor dem offenen
    for (let i = openIndex - 1; i >= 0; i--) {
      if (isAnswered(steps[i], state)) {
        aktiv = steps[i];
        break;
      }
    }
  }
  const aktivIndex = steps.findIndex((s) => stepKey(s) === stepKey(aktiv));

  const fehlerText = params.fehler ? FEHLER_TEXTE[params.fehler] : null;

  return (
    <>
      <Fortschritt aktuell={aktivIndex + 1} gesamt={steps.length} />

      {fehlerText && (
        <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
          {fehlerText}
        </p>
      )}

      <div className="rounded border border-line bg-canvas p-6 md:p-10">
        {aktiv.art === "frage" && (
          <FrageSchritt
            frage={aktiv.frage}
            linie={aktiv.linie ?? null}
            linienName={
              aktiv.linie != null ? state.produktlinien[aktiv.linie] ?? null : null
            }
            state={state}
          />
        )}

        {aktiv.art === "stammdaten" && (
          <form action={stammdatenSpeichern}>
            <h1 className="text-headline text-ink">Stammdaten</h1>
            <p className="mt-2 text-body text-ink-muted">
              Diese Angaben erscheinen später in Ihren Dokumenten (z. B.
              Konformitätserklärungen).
            </p>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-6">
              <Eingabe
                name="firmenname"
                label="Firmenname"
                wert={profil?.firmenname}
                required
                breite="sm:col-span-6"
              />
              <Eingabe
                name="strasse"
                label="Straße"
                wert={profil?.strasse}
                breite="sm:col-span-4"
              />
              <Eingabe
                name="hausnummer"
                label="Nr."
                wert={profil?.hausnummer}
                breite="sm:col-span-2"
              />
              <Eingabe name="plz" label="PLZ" wert={profil?.plz} breite="sm:col-span-2" />
              <Eingabe name="ort" label="Ort" wert={profil?.ort} breite="sm:col-span-4" />
              <Eingabe
                name="land"
                label="Land"
                wert={profil?.land ?? "Deutschland"}
                breite="sm:col-span-6"
              />
              <Eingabe
                name="zeichnungsberechtigter_name"
                label="Zeichnungsberechtigte Person"
                wert={profil?.zeichnungsberechtigter_name}
                breite="sm:col-span-4"
              />
              <Eingabe
                name="zeichnungsberechtigter_funktion"
                label="Funktion"
                wert={profil?.zeichnungsberechtigter_funktion}
                breite="sm:col-span-2"
              />
            </div>

            <fieldset className="mt-8">
              <legend className="text-label uppercase text-ink-muted">
                Waren Sie nach dem bisherigen VerpackG registriert (LUCID)?
              </legend>
              <div className="mt-3 flex gap-3">
                <label className="flex cursor-pointer items-center gap-3 rounded border border-line-strong px-5 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="war_verpackg_registriert"
                    value="ja"
                    defaultChecked={profil?.war_verpackg_registriert === true}
                    className="h-4 w-4 accent-[#006950]"
                  />
                  <span className="text-body font-semibold">Ja</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded border border-line-strong px-5 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="war_verpackg_registriert"
                    value="nein"
                    defaultChecked={profil?.war_verpackg_registriert === false}
                    className="h-4 w-4 accent-[#006950]"
                  />
                  <span className="text-body font-semibold">Nein</span>
                </label>
              </div>
            </fieldset>

            <div className="mt-6">
              <Eingabe
                name="lucid_nummer"
                label="LUCID-Registrierungsnummer (falls vorhanden)"
                wert={profil?.lucid_nummer}
              />
            </div>

            <div className="mt-10 flex items-center justify-between">
              <ZurueckLink />
              <button
                type="submit"
                className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
              >
                Weiter →
              </button>
            </div>
          </form>
        )}

        {aktiv.art === "abschluss" && (
          <form action={onboardingAbschliessen}>
            <h1 className="text-headline text-ink">Alles beisammen</h1>
            <p className="mt-2 text-body text-ink-muted">
              Sie haben {state.produktlinien.length}{" "}
              {state.produktlinien.length === 1 ? "Produktlinie" : "Produktlinien"}{" "}
              erfasst:{" "}
              <span className="font-semibold text-ink">
                {state.produktlinien.join(", ")}
              </span>
              . Die Rollen-Engine wertet Ihre Angaben jetzt regelbasiert aus –
              je Produktlinie, mit Herleitung und Fundstellen.
            </p>
            <div className="mt-10 flex items-center justify-between">
              <ZurueckLink />
              <button
                type="submit"
                className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
              >
                Rollen jetzt auswerten →
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
