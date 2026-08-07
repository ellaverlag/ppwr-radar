import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { erforderePaket } from "@/lib/zugang";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("assistant") };
}

export default async function AssistantPage() {
  await erforderePaket();
  const t = await getTranslations("Assistant");
  const erklaertiefen = t.raw("erklaertiefen") as string[];

  return (
    <>
      <PageHeader title={t("titel")} description={t("beschreibung")} />

      <LegalCard>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <input
            type="text"
            disabled
            placeholder={t("fragePlaceholder")}
            className="w-full rounded border border-line-strong bg-surface px-4 py-3 text-body text-ink placeholder:text-ink-muted/60"
          />
          <span className="inline-flex shrink-0 cursor-not-allowed items-center justify-center rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white opacity-60">
            {t("fragen")}
          </span>
        </div>
      </LegalCard>

      <LegalCard className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-4">
          <div className="flex rounded border border-line-strong">
            {erklaertiefen.map((tiefe, i) => (
              <span
                key={tiefe}
                className={`px-4 py-2 text-body-sm font-semibold ${
                  i === 1
                    ? "bg-primary text-white"
                    : "bg-surface text-ink-muted"
                }`}
              >
                {tiefe}
              </span>
            ))}
          </div>
          <Badge variant="neutral">{t("beispielansicht")}</Badge>
        </div>
        <div className="p-6 md:p-10">
          <h2 className="border-b border-ink pb-3 text-headline text-ink">
            {t("beispielTitel")}
          </h2>
          <p className="mt-6 text-body text-ink">{t("beispielText")}</p>
          <ol className="mt-8 space-y-6 border-l border-line-strong pl-6">
            <li>
              <h3 className="text-label uppercase text-ink">
                {t("punkt1Titel")}
              </h3>
              <p className="mt-1 text-body-sm text-ink-muted">
                {t("punkt1Text")}
              </p>
            </li>
            <li>
              <h3 className="text-label uppercase text-ink">
                {t("punkt2Titel")}
              </h3>
              <p className="mt-1 text-body-sm text-ink-muted">
                {t("punkt2Text")}
              </p>
            </li>
          </ol>
          <div className="mt-8 border-l-4 border-gold bg-surface p-4">
            <p className="text-body-sm text-ink">
              <span className="font-bold">{t("hinweisFett")}</span>{" "}
              {t("hinweisText")}
            </p>
          </div>
        </div>
        <LegalCardFooter>{t("footer")}</LegalCardFooter>
      </LegalCard>
    </>
  );
}
