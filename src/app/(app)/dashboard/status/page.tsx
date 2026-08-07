import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { TrafficDot } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import {
  ladeStatusAnalyse,
  type ZutreffendeAnforderung,
} from "@/lib/status-analyse";
import { erforderePaket } from "@/lib/zugang";
import { statusSetzen } from "./actions";
import { StatusDropdown } from "./status-dropdown";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("status") };
}

export const dynamic = "force-dynamic";

function listeAufzaehlen(teile: string[]): string {
  if (teile.length <= 1) return teile[0] ?? "";
  return `${teile.slice(0, -1).join(", ")} und ${teile[teile.length - 1]}`;
}

export default async function StatusPage() {
  await erforderePaket();

  const [t, tLabels, analyse] = await Promise.all([
    getTranslations("StatusAnalyse"),
    getTranslations("Labels"),
    ladeStatusAnalyse(),
  ]);

  if (!analyse) {
    return (
      <>
        <PageHeader title={t("titel")} description={t("beschreibung")} />
        <div className="rounded border border-line bg-canvas p-6">
          <p className="text-body text-ink-muted">{t("ohneOnboarding")}</p>
          <Link
            href="/onboarding"
            className="mt-4 inline-flex items-center rounded bg-primary px-5 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          >
            {t("onboardingCta")}
          </Link>
        </div>
      </>
    );
  }

  const rollenLabel = (rolle: string) =>
    tLabels.has(`rollen.${rolle}`) ? tLabels(`rollen.${rolle}`) : rolle;
  const typLabel = (typ: string) =>
    tLabels.has(`verpackungstypen.${typ}`)
      ? tLabels(`verpackungstypen.${typ}`)
      : typ;
  const materialLabel = (material: string) =>
    tLabels.has(`materialien.${material}`)
      ? tLabels(`materialien.${material}`)
      : material;

  const grundText = (zeile: ZutreffendeAnforderung) => {
    const rollen = listeAufzaehlen(zeile.grund.rollen.map(rollenLabel));
    if (zeile.grund.verpackungstypen.length === 0) {
      return t("grundAlleTypen", { rollen });
    }
    return t("grund", {
      rollen,
      typen: listeAufzaehlen(zeile.grund.verpackungstypen.map(typLabel)),
    });
  };

  const statusLabels = {
    offen: t("status.offen"),
    in_bearbeitung: t("status.in_bearbeitung"),
    erledigt: t("status.erledigt"),
  };

  const { zahlen } = analyse;

  return (
    <>
      <PageHeader title={t("titel")} description={t("beschreibung")} />

      {/* Ampel-Zusammenfassung */}
      <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 rounded border border-line bg-canvas px-6 py-4">
        <span className="text-body font-bold text-ink">
          {t("zusammenfassung", { anzahl: zahlen.gesamt })}
        </span>
        <span className="flex items-center gap-2 text-body-sm text-ink-muted">
          <TrafficDot color="green" /> {t("zahlErledigt", { anzahl: zahlen.erledigt })}
        </span>
        <span className="flex items-center gap-2 text-body-sm text-ink-muted">
          <TrafficDot color="gold" />{" "}
          {t("zahlInBearbeitung", { anzahl: zahlen.inBearbeitung })}
        </span>
        <span className="flex items-center gap-2 text-body-sm text-ink-muted">
          <TrafficDot color={zahlen.kritisch > 0 ? "red" : "dim"} />{" "}
          {t("zahlKritisch", { anzahl: zahlen.kritisch })}
        </span>
        <span className="flex items-center gap-2 text-body-sm text-ink-muted">
          <TrafficDot color="dim" />{" "}
          {t("zahlVormerkung", { anzahl: zahlen.vormerkung })}
        </span>
      </div>

      {analyse.zutreffend.length === 0 ? (
        <div className="rounded border border-line bg-canvas p-6">
          <p className="text-body text-ink-muted">{t("keineTreffer")}</p>
        </div>
      ) : (
        <div className="rounded border border-line bg-canvas">
          <ul className="divide-y divide-line">
            {analyse.zutreffend.map((zeile) => {
              const { anforderung } = zeile;
              const kritisch =
                zeile.status === "offen" &&
                anforderung.gilt_status === "in_kraft";
              return (
                <li
                  key={anforderung.id}
                  className="flex flex-col gap-4 px-6 py-5 md:flex-row md:items-start md:justify-between"
                >
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      {anforderung.nr != null && (
                        <span className="font-mono text-mono-sm text-ink-muted">
                          #{String(anforderung.nr).padStart(2, "0")}
                        </span>
                      )}
                      <Link
                        href={`/wissen/anforderungen/${anforderung.id}`}
                        className="text-body font-bold text-ink hover:text-primary"
                      >
                        {anforderung.titel}
                      </Link>
                      <Badge
                        variant={
                          anforderung.gilt_status === "in_kraft"
                            ? kritisch
                              ? "red"
                              : "green"
                            : "gold"
                        }
                      >
                        {tLabels(`giltStatus.${anforderung.gilt_status}`)}
                        {anforderung.gilt_ab
                          ? ` · ${formatDate(anforderung.gilt_ab)}`
                          : ""}
                      </Badge>
                    </div>
                    <p className="mt-1.5 text-body-sm text-ink-muted">
                      {grundText(zeile)}
                    </p>
                    {zeile.grund.materialEinschraenkung && (
                      <p className="mt-1 text-body-sm text-ink-muted">
                        {t("materialHinweis", {
                          materialien: listeAufzaehlen(
                            zeile.grund.materialEinschraenkung.map(
                              materialLabel
                            )
                          ),
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <TrafficDot
                      color={
                        zeile.status === "erledigt"
                          ? "green"
                          : zeile.status === "in_bearbeitung"
                            ? "gold"
                            : kritisch
                              ? "red"
                              : "dim"
                      }
                    />
                    <StatusDropdown
                      anforderungNr={anforderung.nr!}
                      status={zeile.status}
                      action={statusSetzen}
                      labels={statusLabels}
                      ariaLabel={t("statusLabel", {
                        titel: anforderung.titel,
                      })}
                    />
                  </div>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <p className="mt-6 text-body-sm text-ink-muted">{t("fussnote")}</p>
    </>
  );
}
