import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { EUDR_AMPEL, eudrStatusText } from "@/components/eudr-ergebnis-karte";
import { TrafficDot } from "@/components/ui";
import { istComingSoon } from "@/lib/launch";
import { formatDate } from "@/lib/labels";
import { isPreviewMode } from "@/lib/preview";
import { evaluiereEudr, type RegelRow } from "@/lib/rollen-engine";
import { ladeAppConfig, ladeRegeln } from "@/lib/rollen-service";
import { istAusspielbar } from "@/lib/wissensbasis";
import { eudrCheckNeuStarten } from "../actions";
import { istVollstaendig, kontextAusEudrCheck, leseEudrCheck } from "../check-eudr-config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return {
    title: t("checkEudrErgebnis"),
    robots: { index: false },
  };
}

export const dynamic = "force-dynamic";

export default async function CheckEudrErgebnisPage() {
  const antworten = await leseEudrCheck();
  if (!istVollstaendig(antworten)) redirect("/check-eudr");

  const t = await getTranslations("CheckEudrErgebnis");
  const tEudr = await getTranslations("Eudr");
  const tLabels = await getTranslations("Labels");

  let regeln: RegelRow[] = [];
  try {
    regeln = await ladeRegeln();
  } catch {
    regeln = [];
  }
  if (!regeln.some((r) => r.block === "eudr")) {
    return (
      <div className="rounded border border-line bg-canvas p-8 text-center">
        <p className="text-body text-ink-muted">{t("nichtVerfuegbar")}</p>
        <Link href="/check-eudr" className="mt-6 inline-block text-body-sm font-medium text-legal hover:underline">
          {t("zurueckZumCheck")}
        </Link>
      </div>
    );
  }

  const ergebnis = evaluiereEudr(regeln, kontextAusEudrCheck(antworten));

  // Freigabe-Gate wie /check: Ergebnis nur, wenn jede tragende Regel
  // ausspielbaren Status hat (redaktion_geprueft / cattwyk_freigegeben).
  // Im Preview-Modus (PREVIEW_MODE=true) auch Entwürfe – zur Abnahme.
  const statusJeRegel = new Map(regeln.map((r) => [r.regel_id, r.review_status]));
  const ausspielbar =
    isPreviewMode() ||
    ergebnis.herleitung.every((h) => istAusspielbar(statusJeRegel.get(h.regel_id)));

  const neuStarten = (
    <form action={eudrCheckNeuStarten} className="mt-8 text-center">
      <button type="submit" className="text-body-sm font-medium text-ink-muted hover:text-ink">
        {t("neuStarten")}
      </button>
    </form>
  );

  if (!ausspielbar) {
    return (
      <>
        <header className="mb-10 text-center">
          <h1 className="font-plex text-display-sm tracking-[-0.04em] text-ink">{t("titel")}</h1>
        </header>
        <div className="mx-auto max-w-lg rounded border-2 border-primary bg-primary-tint p-8 text-center">
          <h2 className="font-plex text-headline tracking-[-0.04em] text-ink">{t("inKuerzeTitel")}</h2>
          <p className="mt-3 text-body text-ink-soft">{t("inKuerzeText")}</p>
          <Link
            href="/#vormerken"
            className="mt-6 inline-flex items-center gap-2 rounded bg-primary px-6 py-3 text-body font-semibold text-white transition-colors hover:bg-primary-dark"
          >
            {t("comingSoonCta")} →
          </Link>
        </div>
        {neuStarten}
      </>
    );
  }

  const rolle = ergebnis.rolle ? tLabels(`rollen.${ergebnis.rolle}`) : "";
  const statusText = await eudrStatusText(ergebnis);
  const cattwykText =
    (await ladeAppConfig("cattwyk_eudr_hinweis").catch(() => null)) ?? tEudr("cattwykFallback");
  const heute = new Date().toISOString().slice(0, 10);
  const akzent =
    ergebnis.status === "betroffen"
      ? "border-danger"
      : ergebnis.status === "unklar"
        ? "border-gold"
        : "border-primary";

  return (
    <>
      <header className="mb-10 text-center">
        <h1 className="font-plex text-display-sm tracking-[-0.04em] text-ink">{t("titel")}</h1>
        <p className="mt-3 text-body-lg text-ink-muted">{t("untertitel")}</p>
      </header>

      <div className="rounded border border-line bg-canvas">
        <div className="p-6 md:p-8">
          <div className="flex items-center gap-4 border border-line bg-surface p-5">
            <TrafficDot color={EUDR_AMPEL[ergebnis.status]} />
            <p className="text-body-lg font-bold text-ink">{statusText}</p>
          </div>

          <div className={`mt-6 border-l-4 ${akzent} pl-4`}>
            <p className="text-body text-ink">{tEudr(`grund.${ergebnis.grund}`, { rolle })}</p>
            {ergebnis.fundstelle && (
              <p className="mt-3 text-body-sm text-ink-muted">
                {tEudr("fundstelleLabel")}: {ergebnis.fundstelle}
              </p>
            )}
          </div>

          {ergebnis.rolle && (
            <section className="mt-8">
              <h2 className="text-label uppercase text-ink-muted">{t("pflichtenTitel")}</h2>
              <p className="mt-2 text-body text-ink">{t(`pflichten.${ergebnis.rolle}`)}</p>
              {ergebnis.frist && (
                <p className="mt-3 text-body text-ink">
                  {tEudr("fristLabel")} <b>{formatDate(ergebnis.frist)}</b>
                  {ergebnis.fristAlternativ && (
                    <span className="text-ink-muted">
                      {" "}
                      ({tEudr("fristAlternativ", { datum: formatDate(ergebnis.fristAlternativ) })})
                    </span>
                  )}
                </p>
              )}
            </section>
          )}

          {ergebnis.status === "nicht_betroffen" ? (
            <p className="mt-8 text-body-sm text-ink-muted">
              {t("nichtBetroffenHinweis")}{" "}
              <Link href="/check" className="font-medium text-legal hover:underline">
                {t("ppwrCheckLink")}
              </Link>
            </p>
          ) : (
            <div className="mt-8 border-l-4 border-legal bg-surface p-5">
              <h2 className="text-label uppercase text-legal">{tEudr("cattwykTitel")}</h2>
              <p className="mt-2 text-body text-ink">{cattwykText}</p>
            </div>
          )}

          {ergebnis.vorbehalt && (
            <p className="mt-6 text-body-sm text-ink-muted">{tEudr("vorbehaltText")}</p>
          )}
          <p className="mt-2 text-body-sm italic text-ink-muted">{tEudr("abgrenzung")}</p>
        </div>
        <div className="border-t border-line p-4 font-mono text-mono-sm uppercase text-legal">
          {t("rechtsstandZeile", { datum: formatDate(heute) })}
        </div>
      </div>

      <div className="mt-12 text-center">
        <h2 className="font-plex text-headline tracking-[-0.04em] text-ink">{t("ctaTitel")}</h2>
        <p className="mx-auto mt-3 max-w-lg text-body text-ink-muted">{t("ctaText")}</p>
        <Link
          href={istComingSoon() ? "/#vormerken" : "/login?next=dashboard"}
          className="mt-8 inline-flex items-center gap-2 rounded bg-primary px-8 py-4 text-body-lg font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          {istComingSoon() ? t("comingSoonCta") : t("ctaRegistrieren")} →
        </Link>
      </div>
      {neuStarten}
    </>
  );
}
