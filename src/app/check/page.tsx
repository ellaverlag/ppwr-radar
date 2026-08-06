import type { Metadata } from "next";
import Link from "next/link";
import type { WizardFrage } from "@/lib/wissensbasis";
import { OPTION_KEYS, parseOptionen } from "@/lib/onboarding";
import { ladeWizardFragenOeffentlich } from "@/lib/rollen-service";
import { checkAntwortSpeichern } from "./actions";
import { CHECK_FRAGE_IDS, leseCheckAntworten } from "./check-config";

export const metadata: Metadata = {
  title: "Betroffenheits-Check – PPWR Radar",
};

export const dynamic = "force-dynamic";

export default async function CheckPage({
  searchParams,
}: {
  searchParams: Promise<{ frage?: string; fehler?: string }>;
}) {
  const params = await searchParams;

  let fragen: WizardFrage[] = [];
  try {
    fragen = (await ladeWizardFragenOeffentlich(
      CHECK_FRAGE_IDS
    )) as WizardFrage[];
  } catch {
    fragen = [];
  }
  // Reihenfolge des Checks, nicht die Wizard-Reihenfolge
  fragen.sort(
    (a, b) =>
      CHECK_FRAGE_IDS.indexOf(a.frage_id) - CHECK_FRAGE_IDS.indexOf(b.frage_id)
  );

  if (fragen.length === 0) {
    return (
      <div className="rounded border border-line bg-canvas p-8 text-center">
        <p className="text-body text-ink-muted">
          Der Betroffenheits-Check ist gerade nicht verfügbar. Bitte versuchen
          Sie es später erneut.
        </p>
        <Link href="/" className="mt-6 inline-block text-body-sm font-medium text-legal hover:underline">
          Zurück zur Startseite
        </Link>
      </div>
    );
  }

  const antworten = await leseCheckAntworten();
  const zielVon = (f: WizardFrage) => f.ziel_variable.split(";")[0].trim();
  const ersteOffene = fragen.findIndex((f) => antworten[zielVon(f)] == null);
  const offenIndex = ersteOffene === -1 ? fragen.length - 1 : ersteOffene;

  let aktivIndex = offenIndex;
  if (params.frage) {
    const idx = Number(params.frage) - 1;
    if (Number.isInteger(idx) && idx >= 0 && idx <= offenIndex) aktivIndex = idx;
  }
  const frage = fragen[aktivIndex];
  const bisherige = antworten[zielVon(frage)];
  const optionen = parseOptionen(frage);
  const keys = OPTION_KEYS[frage.frage_id] ?? optionen;

  return (
    <>
      <header className="mb-10 text-center">
        <h1 className="font-plex text-display-sm tracking-[-0.04em] text-ink">
          Die PPWR gilt.
          <br />
          Betrifft sie Ihre Verpackungen?
        </h1>
        <p className="mt-3 text-body-lg text-ink-muted">
          {fragen.length} Fragen, 2 Minuten – Ihre kostenlose Ersteinschätzung.
        </p>
      </header>

      <div className="mb-8">
        <p className="mb-2 text-label uppercase tracking-[0.02em] text-ink-muted">
          Frage {aktivIndex + 1} von {fragen.length}
        </p>
        <div className="h-1.5 w-full rounded-full bg-line">
          <div
            className="h-1.5 rounded-full bg-primary"
            style={{ width: `${Math.round(((aktivIndex + 1) / fragen.length) * 100)}%` }}
          />
        </div>
      </div>

      {params.fehler && (
        <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
          Bitte wählen Sie eine Antwort aus.
        </p>
      )}

      <div className="rounded border border-line bg-canvas p-6 md:p-10">
        <form action={checkAntwortSpeichern}>
          <input type="hidden" name="frage_id" value={frage.frage_id} />
          <h2 className="font-plex text-headline tracking-[-0.04em] text-ink">
            {frage.frage_text}
          </h2>
          {frage.antwort_typ === "multi_select" && (
            <p className="mt-2 text-body-sm text-ink-muted">
              Mehrfachauswahl möglich.
            </p>
          )}

          <div className="mt-8 space-y-3">
            {optionen.map((label, i) => {
              const wert = keys[i] ?? label;
              const checked = Array.isArray(bisherige)
                ? bisherige.includes(wert)
                : bisherige === wert;
              return (
                <label
                  key={wert}
                  className="flex cursor-pointer items-start gap-4 rounded border border-line-strong bg-canvas px-5 py-4 transition-colors hover:border-ink-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type={frage.antwort_typ === "multi_select" ? "checkbox" : "radio"}
                    name="antwort"
                    value={wert}
                    defaultChecked={checked}
                    required={frage.antwort_typ !== "multi_select"}
                    className="mt-1.5 h-4 w-4 accent-[#006950]"
                  />
                  <span className="text-body font-semibold text-ink">{label}</span>
                </label>
              );
            })}
          </div>

          <div className="mt-10 flex items-center justify-between">
            {aktivIndex > 0 ? (
              <Link
                href={`/check?frage=${aktivIndex}`}
                className="text-body-sm font-medium text-ink-muted hover:text-ink"
              >
                ← Zurück
              </Link>
            ) : (
              <Link
                href="/"
                className="text-body-sm font-medium text-ink-muted hover:text-ink"
              >
                ← Zur Startseite
              </Link>
            )}
            <button
              type="submit"
              className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
            >
              Weiter →
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
