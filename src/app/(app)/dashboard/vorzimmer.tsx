import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { LockIcon } from "@/components/icons";
import { LegalCard, LegalCardFooter, TrafficDot } from "@/components/ui";
import { ladePpwrNews, ladePpwrVideos, ladeUpdateMemos } from "@/lib/radar";
import {
  AenderungslogKarte,
  PjNewsKarte,
  PjVideosKarte,
} from "./radar-module";
import { checkoutStarten, zahlungVerwalten } from "./actions";

/**
 * Vorzimmer: das Dashboard im gesperrten Zustand für Nutzer ohne aktives
 * Paket. Gleiche Struktur wie das echte Dashboard – Status, Rollen und
 * nächste Schritte als gedimmte Platzhalter, die generische
 * Fristen-Timeline bleibt voll sichtbar, oben die Freischalten-Karte.
 */

function GesperrtInhalt({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none select-none opacity-60 blur-[3px]"
    >
      {children}
    </div>
  );
}

function GesperrtTitel({ titel }: { titel: string }) {
  return (
    <h2 className="mb-8 flex items-center gap-2 text-headline text-ink">
      <LockIcon className="h-5 w-5 text-ink-muted" />
      <span>{titel}</span>
    </h2>
  );
}

export async function Vorzimmer({
  hatStripeKunde,
  zeigeGesperrtHinweis,
  zeigeCheckoutFehler,
}: {
  hatStripeKunde: boolean;
  zeigeGesperrtHinweis: boolean;
  zeigeCheckoutFehler: boolean;
}) {
  const t = await getTranslations("Dashboard");
  const tv = await getTranslations("Vorzimmer");
  const tLanding = await getTranslations("Landing");
  const leistungen = tLanding.raw("preise.leistungen") as string[];
  const schritte = t.raw("schritte") as { titel: string; text: string }[];
  const [memos, news, videos] = await Promise.all([
    ladeUpdateMemos(),
    ladePpwrNews(),
    ladePpwrVideos(),
  ]);

  return (
    <>
      <header className="mb-8">
        <h1 className="text-display-sm text-ink lg:text-display">
          {t("titel")}
        </h1>
      </header>

      {zeigeGesperrtHinweis && (
        <p className="mb-6 flex items-center gap-2 rounded border border-line-strong bg-surface px-4 py-3 text-body-sm text-ink-muted">
          <LockIcon className="h-4 w-4 shrink-0" />
          {tv("gesperrtHinweis")}
        </p>
      )}
      {zeigeCheckoutFehler && (
        <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
          {tv("checkoutFehler")}
        </p>
      )}

      {/* Freischalten-Karte */}
      <div
        id="freischalten"
        className="relative mb-6 scroll-mt-24 rounded border-2 border-primary bg-canvas"
      >
        <span className="absolute -top-3 left-6 rounded bg-primary px-2.5 py-1 font-mono text-[0.68rem] uppercase tracking-[0.06em] text-white">
          {tv("badge")}
        </span>
        <div className="grid grid-cols-1 gap-8 p-6 pt-8 md:grid-cols-[1.1fr_1fr] md:p-8">
          <div>
            <h2 className="text-headline text-ink">{tv("titel")}</h2>
            <p className="mt-3 text-display-sm font-bold tracking-[-0.02em] text-ink">
              {tv("preis")}
            </p>
            <p className="mt-2 max-w-md text-body-sm text-ink-muted">
              {tv("konditionen")}
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-4">
              <form action={checkoutStarten}>
                <button
                  type="submit"
                  className="rounded bg-primary px-8 py-4 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                >
                  {tv("checkoutCta")}
                </button>
              </form>
              {hatStripeKunde && (
                <form action={zahlungVerwalten}>
                  <button
                    type="submit"
                    className="text-body-sm font-medium text-legal hover:underline"
                  >
                    {tv("zahlungVerwalten")}
                  </button>
                </form>
              )}
            </div>
          </div>
          <ul className="space-y-2.5 md:pt-2">
            {leistungen.map((punkt) => (
              <li
                key={punkt}
                className="relative pl-6 text-body-sm text-ink-muted"
              >
                <span className="absolute left-0 top-0.5 font-bold text-primary">
                  ✓
                </span>
                {punkt}
              </li>
            ))}
          </ul>
        </div>
        <LegalCardFooter>{tv("stripeFooter")}</LegalCardFooter>
      </div>

      {/* Status-Leiste (gesperrt) + Fristen (sichtbar) */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <LegalCard>
          <div className="flex-1 p-6">
            <GesperrtTitel titel={t("statusTitel")} />
            <GesperrtInhalt>
              <div className="space-y-4">
                {[t("statusVollstaendig"), t("statusOffen"), t("statusInBearbeitung")].map(
                  (label, i) => (
                    <div
                      key={label}
                      className={`flex items-center justify-between pb-2 ${
                        i < 2 ? "border-b border-line-strong" : ""
                      }`}
                    >
                      <span className="text-body-lg text-ink-muted">{label}</span>
                      <span className="flex gap-1">
                        <TrafficDot color="dim" />
                        <TrafficDot color="dim" />
                      </span>
                    </div>
                  )
                )}
              </div>
            </GesperrtInhalt>
          </div>
          <LegalCardFooter>{t("statusFooter")}</LegalCardFooter>
        </LegalCard>

        <LegalCard>
          <div className="flex-1 p-6">
            <GesperrtTitel titel={t("rollenTitel")} />
            <GesperrtInhalt>
              <div className="space-y-4">
                <p className="text-body font-bold text-ink-muted">
                  Produktlinie A
                </p>
                <div className="flex gap-2">
                  <Badge variant="blue">Erzeuger</Badge>
                  <Badge variant="blue">Hersteller</Badge>
                </div>
                <p className="border-t border-line-strong pt-4 text-body font-bold text-ink-muted">
                  Produktlinie B
                </p>
                <div className="flex gap-2">
                  <Badge variant="blue">Importeur</Badge>
                </div>
              </div>
            </GesperrtInhalt>
          </div>
          <LegalCardFooter>{t("rollenFooter")}</LegalCardFooter>
        </LegalCard>

        {/* Fristen-Timeline: generische PPWR-Stufen, voll sichtbar */}
        <LegalCard>
          <div className="flex-1 p-6">
            <h2 className="mb-8 text-headline text-ink">{t("fristenTitel")}</h2>
            <div className="relative mx-2 mt-12 h-0.5 bg-line">
              <span className="absolute -top-[5px] left-0 h-3 w-3 rounded-full border-2 border-white bg-gold shadow-[0_0_0_1px_#1b1b1b]" />
              <span className="absolute -top-[5px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-ink" />
              <span className="absolute -top-[5px] right-0 h-3 w-3 rounded-full bg-ink" />
              <div className="absolute left-0 top-4 -translate-x-1/4 text-center">
                <div className="text-label font-bold uppercase text-gold-ink">
                  {t("fristGeltungDatum")}
                </div>
                <div className="text-body-sm text-ink-muted">
                  {t("fristGeltung")}
                </div>
              </div>
              <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center">
                <div className="text-label uppercase">{t("fristStufe2Jahr")}</div>
                <div className="text-body-sm text-ink-muted">
                  {t("fristStufe2")}
                </div>
              </div>
              <div className="absolute right-0 top-4 translate-x-1/4 text-center">
                <div className="text-label uppercase">{t("fristStufe3Jahr")}</div>
                <div className="text-body-sm text-ink-muted">
                  {t("fristStufe3")}
                </div>
              </div>
            </div>
            <div className="mt-20 border-t border-line-strong pt-4">
              <p className="text-body-sm text-ink-muted">
                <span className="font-bold text-ink">{t("naechsteFrist")}</span>{" "}
                {t("naechsteFristText")}
              </p>
            </div>
          </div>
          <LegalCardFooter>{t("fristenFooter")}</LegalCardFooter>
        </LegalCard>
      </div>

      {/* Meine nächsten Schritte (gesperrt) */}
      <LegalCard className="mt-6">
        <div className="flex-1 p-6">
          <GesperrtTitel titel={t("schritteTitel")} />
          <GesperrtInhalt>
            <ol className="space-y-6 border-l border-line-strong pl-6">
              {schritte.map((schritt, i) => (
                <li key={schritt.titel} className="flex gap-4">
                  <span className="font-mono text-mono-sm text-ink-muted">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <div>
                    <h3 className="text-label uppercase text-ink">
                      {schritt.titel}
                    </h3>
                    <p className="mt-1 text-body-sm text-ink-muted">
                      {schritt.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          </GesperrtInhalt>
        </div>
        <LegalCardFooter>{t("schritteFooter")}</LegalCardFooter>
      </LegalCard>

      {/* Radar-Änderungslog (nur Titel) + öffentliche PJ-Inhalte */}
      <AenderungslogKarte memos={memos} gesperrt />
      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-2">
        <PjNewsKarte news={news} />
        <PjVideosKarte videos={videos} />
      </div>
    </>
  );
}
