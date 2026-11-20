import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { PruefstatusBadge } from "@/components/pruefstatus-badge";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { WochenberichtMarkdown } from "@/components/wochenbericht-markdown";
import { formatDate } from "@/lib/labels";
import { ladeWochenbericht, ladeWochenberichte } from "@/lib/radar";
import { erforderePaket } from "@/lib/zugang";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("wochenbericht") };
}

export const dynamic = "force-dynamic";

/**
 * Wochenbericht: die ausführliche Fassung des wöchentlichen
 * Rechtsmonitorings (radar_wochenberichte). Der Ticker auf /updates nennt
 * je Fund eine Meldung; hier stehen Einordnung und Zusammenhang je Fund mit
 * „Was gilt weiterhin“ und den Quellenlinks.
 */
export default async function WochenberichtPage({
  params,
}: {
  params: Promise<{ datum: string }>;
}) {
  await erforderePaket();
  const { datum } = await params;
  const [bericht, alle] = await Promise.all([
    ladeWochenbericht(datum),
    ladeWochenberichte(12),
  ]);
  if (!bericht) notFound();
  const t = await getTranslations("Updates");
  const tLabels = await getTranslations("Labels");
  const weitere = alle.filter((b) => b.id !== bericht.id);

  return (
    <>
      <nav className="mb-6 text-body-sm text-ink-muted">
        <Link href="/updates" className="font-medium text-legal hover:underline">
          ← {t("wochenbericht.zurueck")}
        </Link>
      </nav>

      <header className="mb-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="green">{t("wochenbericht.kicker")}</Badge>
          <span className="font-mono text-mono-sm text-ink-muted">
            {t("wochenbericht.zeitraum", {
              von: formatDate(bericht.zeitraum_von),
              bis: formatDate(bericht.zeitraum_bis),
            })}
          </span>
          <PruefstatusBadge status={bericht.review_status} labels={tLabels.raw("pruefstatus")} />
        </div>
        <h1 className="mt-3 text-display-sm text-ink">{bericht.titel}</h1>
        <p className="mt-3 max-w-2xl text-body-lg text-ink-muted">{bericht.teaser}</p>
      </header>

      <LegalCard>
        <div className="p-6 lg:p-8">
          <WochenberichtMarkdown markdown={bericht.body_markdown} />
        </div>
        <LegalCardFooter>
          {t("wochenbericht.footer", { rechtsstand: formatDate(bericht.rechtsstand) })}
        </LegalCardFooter>
      </LegalCard>

      {weitere.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-4 text-label uppercase tracking-widest text-ink-muted">
            {t("wochenbericht.weitere")}
          </h2>
          <ul className="space-y-2">
            {weitere.map((b) => (
              <li key={b.id} className="text-body">
                <span className="mr-3 font-mono text-mono-sm text-ink-muted">{formatDate(b.datum)}</span>
                <Link
                  href={`/updates/wochenbericht/${b.datum}`}
                  className="font-medium text-legal hover:underline"
                >
                  {b.titel}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </>
  );
}
