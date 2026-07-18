import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Badge } from "@/components/badge";
import { formatDate, GILT_STATUS_LABELS, KATEGORIE_LABELS } from "@/lib/labels";
import { getAnforderung } from "@/lib/wissensbasis";

export const metadata: Metadata = {
  title: "Anforderung – PPWR Radar",
};

export const dynamic = "force-dynamic";

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <h2 className="text-sm font-semibold uppercase tracking-wide text-neutral-400">
        {title}
      </h2>
      <div className="mt-2 text-sm leading-relaxed text-neutral-700">
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
        className="text-sm font-medium text-accent hover:underline"
      >
        ← Zurück zur Übersicht
      </Link>

      <header className="mt-6">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="accent">
            {KATEGORIE_LABELS[anforderung.kategorie]}
          </Badge>
          <Badge
            variant={anforderung.gilt_status === "in_kraft" ? "green" : "neutral"}
          >
            {GILT_STATUS_LABELS[anforderung.gilt_status]}
          </Badge>
          <Badge variant="neutral">
            Rechtsstand {formatDate(anforderung.rechtsstand)}
          </Badge>
        </div>
        <h1 className="mt-4 text-2xl font-semibold tracking-tight text-neutral-900">
          {anforderung.nr != null && (
            <span className="mr-2 text-neutral-400">#{anforderung.nr}</span>
          )}
          {anforderung.titel}
        </h1>
        <p className="mt-2 text-sm text-neutral-500">
          Gilt ab: {formatDate(anforderung.gilt_ab)}
        </p>
      </header>

      {anforderung.kurzerklaerung && (
        <Section title="Kurzerklärung">
          <p className="whitespace-pre-line">{anforderung.kurzerklaerung}</p>
        </Section>
      )}

      {anforderung.erklaerung_fachlich && (
        <Section title="Fachliche Erklärung">
          <p className="whitespace-pre-line">{anforderung.erklaerung_fachlich}</p>
        </Section>
      )}

      {anforderung.handlungsanweisung && (
        <Section title="Handlungsanweisung">
          <p className="whitespace-pre-line">{anforderung.handlungsanweisung}</p>
        </Section>
      )}

      {anforderung.risiko_bei_verstoss && (
        <Section title="Risiko bei Verstoß">
          <p className="whitespace-pre-line">{anforderung.risiko_bei_verstoss}</p>
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

      <Section title="Quellenangabe">
        <dl className="space-y-2">
          <div>
            <dt className="inline font-medium text-neutral-900">Rechtsquelle: </dt>
            <dd className="inline">
              {anforderung.rechtsquelle_link ? (
                <a
                  href={anforderung.rechtsquelle_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-accent hover:underline"
                >
                  {anforderung.rechtsquelle}
                </a>
              ) : (
                anforderung.rechtsquelle
              )}
            </dd>
          </div>
          {anforderung.verpackdg_quelle && (
            <div>
              <dt className="inline font-medium text-neutral-900">
                Bezug VerpackG:{" "}
              </dt>
              <dd className="inline">{anforderung.verpackdg_quelle}</dd>
            </div>
          )}
          {anforderung.verweise && anforderung.verweise.length > 0 && (
            <div>
              <dt className="inline font-medium text-neutral-900">Verweise: </dt>
              <dd className="inline">{anforderung.verweise.join(", ")}</dd>
            </div>
          )}
          <div>
            <dt className="inline font-medium text-neutral-900">Rechtsstand: </dt>
            <dd className="inline">{formatDate(anforderung.rechtsstand)}</dd>
          </div>
        </dl>
      </Section>

      <Section title="Betrifft">
        <dl className="space-y-2">
          <div>
            <dt className="inline font-medium text-neutral-900">Rollen: </dt>
            <dd className="inline">{anforderung.betrifft_rollen.join(", ")}</dd>
          </div>
          <div>
            <dt className="inline font-medium text-neutral-900">
              Verpackungstypen:{" "}
            </dt>
            <dd className="inline">
              {anforderung.betrifft_verpackungstypen.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="inline font-medium text-neutral-900">Materialien: </dt>
            <dd className="inline">
              {anforderung.betrifft_materialien.join(", ")}
            </dd>
          </div>
        </dl>
      </Section>
    </article>
  );
}
