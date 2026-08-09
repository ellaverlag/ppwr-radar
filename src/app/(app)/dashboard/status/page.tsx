import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { DokumentErstellenLink } from "@/components/dokument-erstellen-link";
import { BearbeitungIcon, GiltStatusIcon } from "@/components/kategorie-icons";
import { PageHeader } from "@/components/page-header";
import { TrafficDot } from "@/components/ui";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/labels";
import {
  ladeStatusAnalyse,
  type ZutreffendeAnforderung,
} from "@/lib/status-analyse";
import { erforderePaket } from "@/lib/zugang";
import { anforderungUrl } from "@/lib/wissen-links";
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

export default async function StatusPage({
  searchParams,
}: {
  searchParams: Promise<{ filter?: string }>;
}) {
  const zugang = await erforderePaket();
  // ?filter=offen: nur die offenen „gilt bereits“-Anforderungen – exakt die
  // Menge hinter „Offen – gilt bereits“ im Dashboard und den dringendsten
  // Schritten. Die Ampel-Zusammenfassung bleibt ungefiltert.
  const filterOffen = (await searchParams).filter === "offen";

  const supabase = await createClient();
  const [t, tLabels, analyse] = await Promise.all([
    getTranslations("StatusAnalyse"),
    getTranslations("Labels"),
    ladeStatusAnalyse(),
  ]);

  // Eindeutige Produktlinie für den „Dokument erstellen“-Link: nur bei genau
  // einer aktiven Linie vorwählen (sonst wählt der Nutzer im Generator).
  let eindeutigeVerpackungId: string | null = null;
  {
    const { data: profil } = await supabase
      .from("profile")
      .select("id")
      .eq("user_id", zugang.user.id)
      .maybeSingle();
    if (profil) {
      const { data: verpackungen } = await supabase
        .from("profil_verpackungen")
        .select("id, status")
        .eq("profil_id", profil.id);
      const aktive = (verpackungen ?? []).filter(
        (zeile) => zeile.status !== "stillgelegt"
      );
      if (aktive.length === 1) eindeutigeVerpackungId = aktive[0].id as string;
    }
  }

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
  const sichtbar = filterOffen
    ? analyse.zutreffend.filter(
        (zeile) =>
          zeile.status === "offen" &&
          zeile.anforderung.gilt_status === "in_kraft"
      )
    : analyse.zutreffend;

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

      {filterOffen && (
        <div className="mb-6 flex flex-wrap items-center gap-3">
          <Badge variant="red">
            {t("filterHinweis", { anzahl: sichtbar.length })}
          </Badge>
          <Link
            href="/dashboard/status"
            className="text-body-sm font-medium text-legal hover:underline"
          >
            {t("filterAlle", { gesamt: zahlen.gesamt })}
          </Link>
        </div>
      )}

      {sichtbar.length === 0 ? (
        <div className="rounded border border-line bg-canvas p-6">
          <p className="text-body text-ink-muted">{t("keineTreffer")}</p>
        </div>
      ) : (
        <div className="rounded border border-line bg-canvas">
          <ul className="divide-y divide-line">
            {sichtbar.map((zeile) => {
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
                        href={anforderungUrl(anforderung.id)}
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
                        <GiltStatusIcon status={anforderung.gilt_status} />
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
                    {anforderung.generator_key && (
                      <div className="mt-2">
                        <DokumentErstellenLink
                          generatorKey={anforderung.generator_key}
                          verpackungId={eindeutigeVerpackungId}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    {/* Bearbeitungs-Ampel als Icon: Punkt/Uhr/Haken */}
                    <BearbeitungIcon
                      status={zeile.status}
                      className={`h-4 w-4 shrink-0 ${
                        zeile.status === "erledigt"
                          ? "text-primary"
                          : zeile.status === "in_bearbeitung"
                            ? "text-gold-ink"
                            : kritisch
                              ? "text-danger"
                              : "text-ink-muted"
                      }`}
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
