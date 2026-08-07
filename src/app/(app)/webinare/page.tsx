import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AUFZEICHNUNGEN, NAECHSTE_WEBINARE } from "../../../../content/webinare";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { LegalCard } from "@/components/ui";
import { WebinarKarte } from "@/components/webinar-karte";
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

      {/* Aufzeichnungen – Mediathek-Grid, Player im Modal */}
      <section>
        <h2 className="mb-4 text-headline text-ink">
          {t("aufzeichnungenTitel")}
        </h2>
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          {AUFZEICHNUNGEN.filter((w) => w.embed_url).map((webinar) => (
            <WebinarKarte
              key={webinar.titel}
              titel={webinar.titel}
              badge={webinar.badge}
              beschreibung={webinar.beschreibung}
              hinweis={webinar.hinweis}
              embedUrl={webinar.embed_url!}
              thumbnail={webinar.thumbnail}
              gesperrt={!freigeschaltet}
              labels={{
                abspielen: t("abspielen"),
                schliessen: t("schliessen"),
                gesperrt: t("gesperrt"),
                gesperrtCta: t("gesperrtCta"),
              }}
            />
          ))}
        </div>
      </section>
    </>
  );
}