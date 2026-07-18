import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/badge";
import { ArrowBackIcon } from "@/components/icons";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { formatDate, GILT_STATUS_LABELS, KATEGORIE_LABELS } from "@/lib/labels";
import { getAnforderung, type GiltStatus } from "@/lib/wissensbasis";

export const metadata: Metadata = {
  title: "Anforderung – PPWR Radar",
};

export const dynamic = "force-dynamic";

function giltStatusVariant(status: GiltStatus) {
  if (status === "in_kraft") return "green" as const;
  if (status === "entwurf_eu") return "neutral" as const;
  return "gold" as const;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-label uppercase text-ink-muted">{title}</h2>
      <div className="mt-3 border-l border-line-strong pl-4 text-body text-ink">
        {children}
      </div>
    </section>
  );
}

export default async function AnforderungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const anforderung = await getAnforderung(id).catch(() => null);

  if (!anforderung) {
    notFound();
  }

  return (
    <article className="max-w-3xl">
      <Link
        href="/wissen"
        className="inline-flex items-center gap-2 text-body-sm font-medium text-legal hover:underline"
      >
        <ArrowBackIcon className="h-4 w-4" />
        <span>Zurück zur Übersicht</span>
      </Link>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="green">
            {KATEGORIE_LABELS[anforderung.kategorie]}
          </Badge>
          <Badge variant={giltStatusVariant(anforderung.gilt_status)}>
            {GILT_STATUS_LABELS[anforderung.gilt_status]}
          </Badge>
          <Badge variant="neutral">
            Rechtsstand {formatDate(anforderung.rechtsstand)}
          </Badge>
        </div>
        <h1 className="mt-6 text-display-sm text-ink">
          {anforderung.nr != null && (
            <span className="mr-3 font-mono text-headline font-normal text-ink-muted">
              #{String(anforderung.nr).padStart(2, "0")}
            </span>
          )}
          {anforderung.titel}
        </h1>
        <p className="mt-3 font-mono text-mono-sm uppercase text-ink-muted">
          Gilt ab {formatDate(anforderung.gilt_ab)}
        </p>
      </header>

      {anforderung.kurzerklaerung && (
        <p className="mt-8 text-body-lg text-ink">
          {anforderung.kurzerklaerung}
        </p>
      )}

      {anforderung.erklaerung_fachlich && (
        <Section title="Fachliche Erklärung">
          <p className="whitespace-pre-line">
            {anforderung.erklaerung_fachlich}
          </p>
        </Section>
      )}

      {anforderung.handlungsanweisung && (
        <Section title="Handlungsanweisung">
          <p className="whitespace-pre-line">{anforderung.handlungsanweisung}</p>
        </Section>
      )}

      {anforderung.risiko_bei_verstoss && (
        <Section title="Risiko bei Verstoß">
          <p className="whitespace-pre-line">
            {anforderung.risiko_bei_verstoss}
          </p>
        </Section>
      )}

      {anforderung.ausnahmen && (
        <Section title="Ausnahmen">
          <p className="whitespace-pre-line">{anforderung.ausnahmen}</p>
        </Section>
      )}

      {anforderung.uebergangsregeln && (
        <Section title="Übergangsregeln">
          <p className="whitespace-pre-line">{anforderung.uebergangsregeln}</p>
        </Section>
      )}

      <Section title="Betrifft">
        <dl className="space-y-2 text-body">
          <div>
            <dt className="inline font-semibold text-ink">Rollen: </dt>
            <dd className="inline text-ink-muted">
              {anforderung.betrifft_rollen.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ink">Verpackungstypen: </dt>
            <dd className="inline text-ink-muted">
              {anforderung.betrifft_verpackungstypen.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ink">Materialien: </dt>
            <dd className="inline text-ink-muted">
              {anforderung.betrifft_materialien.join(", ")}
            </dd>
          </div>
        </dl>
      </Section>

      <LegalCard className="mt-12">
        <div className="p-6">
          <h2 className="text-label uppercase text-ink-muted">Quellenangabe</h2>
          <dl className="mt-4 space-y-3 text-body">
            <div>
              <dt className="inline font-semibold text-ink">Rechtsquelle: </dt>
              <dd className="inline">
                {anforderung.rechtsquelle_link ? (
                  <a
                    href={anforderung.rechtsquelle_link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-legal underline-offset-2 hover:underline"
                  >
                    {anforderung.rechtsquelle}
                  </a>
                ) : (
                  <span className="text-ink-muted">
                    {anforderung.rechtsquelle}
                  </span>
                )}
              </dd>
            </div>
            {anforderung.verpackdg_quelle && (
              <div>
                <dt className="inline font-semibold text-ink">
                  Bezug VerpackG:{" "}
                </dt>
                <dd className="inline text-ink-muted">
                  {anforderung.verpackdg_quelle}
                </dd>
              </div>
            )}
            {anforderung.verweise && anforderung.verweise.length > 0 && (
              <div>
                <dt className="inline font-semibold text-ink">Verweise: </dt>
                <dd className="inline text-ink-muted">
                  {anforderung.verweise.join(", ")}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <LegalCardFooter>
          {anforderung.rechtsquelle} · Stand {formatDate(anforderung.rechtsstand)}
        </LegalCardFooter>
      </LegalCard>
    </article>
  );
}
