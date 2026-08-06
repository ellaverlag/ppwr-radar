import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { LegalCard } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import { getAnforderungen, type GiltStatus } from "@/lib/wissensbasis";
import { WissenTabsNav } from "./tabs-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("wissen") };
}

export const dynamic = "force-dynamic";

function giltStatusVariant(status: GiltStatus) {
  if (status === "in_kraft") return "green" as const;
  if (status === "entwurf_eu") return "neutral" as const;
  return "gold" as const;
}

export default async function WissenPage() {
  const anforderungen = await getAnforderungen();
  const t = await getTranslations("Wissen");
  const tLabels = await getTranslations("Labels");

  return (
    <>
      <PageHeader
        title={t("titel")}
        description={t("beschreibungAnforderungen")}
      />
      <WissenTabsNav />

      {anforderungen.length === 0 ? (
        <LegalCard>
          <p className="p-6 text-body text-ink-muted">
            {t("keineAnforderungen")}
          </p>
        </LegalCard>
      ) : (
        <LegalCard>
          <div className="hidden grid-cols-12 gap-4 rounded-t bg-surface px-6 py-3 text-label uppercase text-ink-muted md:grid">
            <span className="col-span-6">{t("spalteAnforderung")}</span>
            <span className="col-span-2">{t("spalteGiltAb")}</span>
            <span className="col-span-4">{t("spalteStatus")}</span>
          </div>
          <ul className="divide-y divide-line">
            {anforderungen.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/wissen/anforderungen/${a.id}`}
                  className="group grid grid-cols-1 gap-3 px-6 py-5 transition-colors hover:bg-surface md:grid-cols-12 md:items-center md:gap-4"
                >
                  <div className="md:col-span-6">
                    <p className="text-body-lg font-bold text-ink group-hover:text-primary">
                      {a.nr != null && (
                        <span className="mr-2 font-mono text-mono-sm font-normal text-ink-muted">
                          #{String(a.nr).padStart(2, "0")}
                        </span>
                      )}
                      {a.titel}
                    </p>
                    <p className="mt-1 font-mono text-mono-sm text-ink-muted">
                      {a.rechtsquelle}
                    </p>
                  </div>
                  <div className="text-body-sm text-ink-muted md:col-span-2">
                    {formatDate(a.gilt_ab)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:col-span-4">
                    <Badge variant="green">
                      {tLabels(`kategorien.${a.kategorie}`)}
                    </Badge>
                    <Badge variant={giltStatusVariant(a.gilt_status)}>
                      {tLabels(`giltStatus.${a.gilt_status}`)}
                    </Badge>
                    <Badge variant="neutral" title={t("rechtsstandTitle")}>
                      {t("rechtsstandChip", { datum: formatDate(a.rechtsstand) })}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </LegalCard>
      )}
    </>
  );
}
