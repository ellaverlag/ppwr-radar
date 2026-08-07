import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { ArrowBackIcon } from "@/components/icons";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import { getAnforderung, type GiltStatus } from "@/lib/wissensbasis";
import { Erklaertiefen, type Tiefe } from "./erklaertiefen";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("anforderung") };
}

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

  const t = await getTranslations("Anforderung");
  const tWissen = await getTranslations("Wissen");
  const tLabels = await getTranslations("Labels");

  const tiefen: Tiefe[] = [
    { key: "einfach", text: anforderung.kurzerklaerung },
    { key: "fachlich", text: anforderung.erklaerung_fachlich },
    { key: "rechtstext", text: anforderung.erklaerung_rechtstext },
  ]
    .filter((tiefe): tiefe is { key: string; text: string } =>
      Boolean(tiefe.text)
    )
    .map((tiefe) => ({ ...tiefe, label: tWissen(`tiefen.${tiefe.key}`) }));

  return (
    <article className="max-w-3xl">
      <Link
        href="/wissen"
        className="inline-flex items-center gap-2 text-body-sm font-medium text-legal hover:underline"
      >
        <ArrowBackIcon className="h-4 w-4" />
        <span>{t("zurueck")}</span>
      </Link>

      <header className="mt-8">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="green">
            {tLabels(`kategorien.${anforderung.kategorie}`)}
          </Badge>
          <Badge variant={giltStatusVariant(anforderung.gilt_status)}>
            {tLabels(`giltStatus.${anforderung.gilt_status}`)}
          </Badge>
          <Badge variant="neutral">
            {t("rechtsstandChip", { datum: formatDate(anforderung.rechtsstand) })}
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
          {t("giltAb", { datum: formatDate(anforderung.gilt_ab) })}
        </p>
      </header>

      {/* Erklärtiefen: Einfach (kurzerklaerung) | Fachlich | Rechtstext */}
      {tiefen.length > 0 ? (
        <div className="mt-8">
          <Erklaertiefen tiefen={tiefen} />
        </div>
      ) : (
        <p className="mt-8 rounded border border-line-strong bg-surface px-4 py-3 text-body-sm text-ink-muted">
          {tWissen("keineErklaerung")}
        </p>
      )}

      {anforderung.handlungsanweisung && (
        <Section title={tWissen("wasZuTun")}>
          <p className="whitespace-pre-line">{anforderung.handlungsanweisung}</p>
        </Section>
      )}

      {anforderung.tatbestand && (
        <Section title={tWissen("tatbestandTitel")}>
          <p className="whitespace-pre-line">{anforderung.tatbestand}</p>
        </Section>
      )}

      {anforderung.rechtsfolgen_je_rolle &&
        Object.keys(anforderung.rechtsfolgen_je_rolle).length > 0 && (
          <Section title={tWissen("rechtsfolgenTitel")}>
            <dl className="space-y-2">
              {Object.entries(anforderung.rechtsfolgen_je_rolle).map(
                ([rolle, folge]) => (
                  <div key={rolle}>
                    <dt className="inline font-semibold text-ink">
                      {tLabels.has(`rollen.${rolle}`)
                        ? tLabels(`rollen.${rolle}`)
                        : rolle}
                      :{" "}
                    </dt>
                    <dd className="inline text-ink-muted">{String(folge)}</dd>
                  </div>
                )
              )}
            </dl>
          </Section>
        )}

      {anforderung.risiko_bei_verstoss && (
        <Section title={t("risiko")}>
          <p className="whitespace-pre-line">
            {anforderung.risiko_bei_verstoss}
          </p>
        </Section>
      )}

      {anforderung.ausnahmen && (
        <Section title={t("ausnahmen")}>
          <p className="whitespace-pre-line">{anforderung.ausnahmen}</p>
        </Section>
      )}

      {anforderung.uebergangsregeln && (
        <Section title={t("uebergangsregeln")}>
          <p className="whitespace-pre-line">{anforderung.uebergangsregeln}</p>
        </Section>
      )}

      <Section title={t("betrifft")}>
        <dl className="space-y-2 text-body">
          <div>
            <dt className="inline font-semibold text-ink">{t("rollen")} </dt>
            <dd className="inline text-ink-muted">
              {anforderung.betrifft_rollen.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ink">
              {t("verpackungstypen")}{" "}
            </dt>
            <dd className="inline text-ink-muted">
              {anforderung.betrifft_verpackungstypen.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ink">
              {t("materialien")}{" "}
            </dt>
            <dd className="inline text-ink-muted">
              {anforderung.betrifft_materialien.join(", ")}
            </dd>
          </div>
        </dl>
      </Section>

      <LegalCard className="mt-12">
        <div className="p-6">
          <h2 className="text-label uppercase text-ink-muted">
            {t("quellenangabe")}
          </h2>
          <dl className="mt-4 space-y-3 text-body">
            <div>
              <dt className="inline font-semibold text-ink">
                {t("rechtsquelle")}{" "}
              </dt>
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
                  {t("bezugVerpackg")}{" "}
                </dt>
                <dd className="inline text-ink-muted">
                  {anforderung.verpackdg_quelle}
                </dd>
              </div>
            )}
            {anforderung.verweise && anforderung.verweise.length > 0 && (
              <div>
                <dt className="inline font-semibold text-ink">
                  {t("verweise")}{" "}
                </dt>
                <dd className="inline text-ink-muted">
                  {anforderung.verweise.join(", ")}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <LegalCardFooter>
          {t("footerZeile", {
            rechtsquelle: anforderung.rechtsquelle,
            datum: formatDate(anforderung.rechtsstand),
          })}
        </LegalCardFooter>
      </LegalCard>
    </article>
  );
}
