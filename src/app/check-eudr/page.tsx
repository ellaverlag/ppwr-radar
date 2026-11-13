import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { eudrCheckAntwortSpeichern } from "./actions";
import {
  EUDR_CHECK_FRAGEN,
  EUDR_CHECK_MAX,
  leseEudrCheck,
  relevanteFragen,
} from "./check-eudr-config";

export const dynamic = "force-dynamic";

/**
 * Kostenloser EUDR-Check (Muster /check): eine Frage je Schritt, Antworten
 * im Cookie, Auswertung unter /check-eudr/ergebnis. Grundlage der
 * pj-Infoseite (EUDR-Strang Schritt 3).
 */
export default async function CheckEudrPage({
  searchParams,
}: {
  searchParams: Promise<{ frage?: string; fehler?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("CheckEudr");

  const antworten = await leseEudrCheck();
  const fragen = relevanteFragen(antworten);
  const ersteOffene = fragen.findIndex((f) => antworten[f] == null);
  const offenIndex = ersteOffene === -1 ? fragen.length - 1 : ersteOffene;

  let aktivIndex = offenIndex;
  if (params.frage) {
    const idx = Number(params.frage) - 1;
    if (Number.isInteger(idx) && idx >= 0 && idx <= offenIndex) aktivIndex = idx;
  }
  const frage = fragen[aktivIndex];
  const bisherige = antworten[frage];

  return (
    <>
      <header className="mb-10 text-center">
        <h1 className="font-plex text-display-sm tracking-[-0.04em] text-ink">
          {t.rich("titel", { br: () => <br /> })}
        </h1>
        <p className="mt-3 text-body-lg text-ink-muted">{t("untertitel")}</p>
      </header>

      <div className="mb-8">
        <p className="mb-2 text-label uppercase tracking-[0.02em] text-ink-muted">
          {t("fortschritt", { aktuell: aktivIndex + 1, gesamt: EUDR_CHECK_MAX })}
        </p>
        <div className="h-1.5 w-full rounded-full bg-line">
          <div
            className="h-1.5 rounded-full bg-primary"
            style={{ width: `${Math.round(((aktivIndex + 1) / EUDR_CHECK_MAX) * 100)}%` }}
          />
        </div>
      </div>

      {params.fehler && (
        <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
          {t("fehlerAntwort")}
        </p>
      )}

      <div className="rounded border border-line bg-canvas p-6 md:p-10">
        <form action={eudrCheckAntwortSpeichern}>
          <input type="hidden" name="frage" value={frage} />
          <h2 className="font-plex text-headline tracking-[-0.04em] text-ink">
            {t(`fragen.${frage}.text`)}
          </h2>
          <p className="mt-2 text-body-sm text-ink-muted">{t(`fragen.${frage}.hilfe`)}</p>

          <div className="mt-8 space-y-3">
            {EUDR_CHECK_FRAGEN[frage].map((wert) => (
              <label
                key={wert}
                className="flex cursor-pointer items-start gap-4 rounded border border-line-strong bg-canvas px-5 py-4 transition-colors hover:border-ink-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5"
              >
                <input
                  type="radio"
                  name="antwort"
                  value={wert}
                  defaultChecked={bisherige === wert}
                  required
                  className="mt-1.5 h-4 w-4 accent-[#006950]"
                />
                <span className="text-body font-semibold text-ink">
                  {t(`fragen.${frage}.optionen.${wert}`)}
                </span>
              </label>
            ))}
          </div>

          <div className="mt-10 flex items-center justify-between">
            {aktivIndex > 0 ? (
              <Link
                href={`/check-eudr?frage=${aktivIndex}`}
                className="text-body-sm font-medium text-ink-muted hover:text-ink"
              >
                {t("zurueck")}
              </Link>
            ) : (
              <Link href="/" className="text-body-sm font-medium text-ink-muted hover:text-ink">
                {t("zurStartseiteKurz")}
              </Link>
            )}
            <button
              type="submit"
              className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
            >
              {t("weiter")}
            </button>
          </div>
        </form>
      </div>
    </>
  );
}
