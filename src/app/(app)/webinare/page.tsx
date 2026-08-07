import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AUFZEICHNUNGEN, NAECHSTE_WEBINARE } from "../../../../content/webinare";
import { Badge } from "@/components/badge";
import { LockIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { WebinarPlayer } from "@/components/webinar-player";
import { formatDate } from "@/lib/labels";
import { pruefeZugang } from "@/lib/zugang";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("webinare") };
}

export const dynamic = "force-dynamic";

export default async function WebinarePage() {
  const zugang = await pruefeZugang();
  if (!zugang) redirect("/login");
  const freigeschaltet = zugang.freigeschaltet;

  const t = await getTranslations("Webinare");

  return (
    <>
      <PageHeader
        title={t("titel")}
        description={t("beschreibung")}
        titelVersteckt
      />

      {/* Nächste Webinare */}
      <section className="mb-10">
        <h2 className="mb-4 text-headline text-ink">{t("kommendeTitel")}</h2>
        <div className="space-y-4">
          {NAECHSTE_WEBINARE.map((webinar) => (
            <LegalCard key={webinar.titel}>
              <div className="flex items-start gap-4 p-6">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded bg-primary-tint">
                  {/* Kalender-Icon */}
                  <svg
                    viewBox="0 0 24 24"
                    fill="#006950"
                    className="h-5 w-5"
                    aria-hidden="true"
                  >
                    <path d="M19 4h-1V2h-2v2H8V2H6v2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V10h14v10zM5 8V6h14v2H5z" />
                  </svg>
                </span>
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-body-lg font-bold text-ink">
                      {webinar.titel}
                    </h3>
                    <Badge variant="neutral">{webinar.badge}</Badge>
                  </div>
                  {webinar.beschreibung && (
                    <p className="mt-1 text-body-sm text-ink-muted">
                      {webinar.beschreibung}
                    </p>
                  )}
                  {webinar.datum && (
                    <p className="mt-1 font-mono text-mono-sm text-ink-muted">
                      {formatDate(webinar.datum)}
                      {webinar.dauer ? ` · ${webinar.dauer}` : ""}
                    </p>
                  )}
                </div>
              </div>
            </LegalCard>
          ))}
        </div>
      </section>

      {/* Aufzeichnungen */}
      <section>
        <h2 className="mb-4 text-headline text-ink">
          {t("aufzeichnungenTitel")}
        </h2>
        <div className="space-y-6">
          {AUFZEICHNUNGEN.map((webinar) => (
            <LegalCard key={webinar.titel}>
              <div className="p-6">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-body-lg font-bold text-ink">
                    {webinar.titel}
                  </h3>
                  <Badge variant="green">{webinar.badge}</Badge>
                </div>
                {webinar.hinweis && (
                  <p className="mt-2 max-w-3xl text-body-sm text-ink-muted">
                    {webinar.hinweis}
                  </p>
                )}

                <div className="mt-5">
                  {freigeschaltet && webinar.embed_url ? (
                    <WebinarPlayer
                      embedUrl={webinar.embed_url}
                      titel={webinar.titel}
                      playHinweis={t("playHinweis")}
                    />
                  ) : (
                    /* Teaser für Nicht-Freigeschaltete: Titel sichtbar,
                       Player gesperrt */
                    <div className="relative w-full overflow-hidden rounded border border-line bg-surface pt-[56.25%]">
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 px-6 text-center">
                        <LockIcon className="h-8 w-8 text-ink-muted" />
                        <p className="max-w-md text-body text-ink-muted">
                          {t("gesperrt")}
                        </p>
                        <Link
                          href="/dashboard#freischalten"
                          className="text-body-sm font-medium text-legal hover:underline"
                        >
                          {t("gesperrtCta")}
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
              <LegalCardFooter>
                {webinar.datum ? `${formatDate(webinar.datum)} · ` : ""}
                PPWR Radar · by packaging journal
              </LegalCardFooter>
            </LegalCard>
          ))}
        </div>
      </section>
    </>
  );
}
