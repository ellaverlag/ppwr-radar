import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { RadarMeldungEintrag } from "@/components/radar-meldung";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import { ladeLetztenMonitoringStand, ladeRadarMeldungen } from "@/lib/radar";
import { getAnforderungen } from "@/lib/wissensbasis";
import { erforderePaket } from "@/lib/zugang";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("updates") };
}

export const dynamic = "force-dynamic";

/**
 * Updates: der vollständige Ticker des wöchentlichen Rechtsmonitorings –
 * jede Meldung mit Quelle, Einordnung, Fundstellen und Verweisen in die
 * Wissensbasis. Wochenläufe ohne Neuerung erscheinen als „Stand“-Zeile,
 * damit sichtbar bleibt, dass geprüft wurde.
 */
export default async function UpdatesPage() {
  await erforderePaket();
  const [meldungen, letzterStand, anforderungen] = await Promise.all([
    ladeRadarMeldungen(200),
    ladeLetztenMonitoringStand(),
    getAnforderungen().catch(() => []),
  ]);
  const t = await getTranslations("Updates");
  const anforderungIdNachNr = new Map(
    anforderungen.filter((a) => a.nr != null).map((a) => [a.nr as number, a.id])
  );
  const ereignisse = meldungen.filter((m) => m.einordnung !== "stand").length;

  // Nach Monat gruppieren (neueste zuerst)
  const gruppen = new Map<string, typeof meldungen>();
  for (const m of meldungen) {
    const key = m.datum.slice(0, 7);
    gruppen.set(key, [...(gruppen.get(key) ?? []), m]);
  }
  const monatsname = (key: string) =>
    new Date(`${key}-01T00:00:00`).toLocaleDateString("de-DE", { month: "long", year: "numeric" });

  return (
    <>
      <PageHeader title={t("titel")} description={t("beschreibung")} titelVersteckt />

      <div className="mb-8 flex flex-wrap items-center gap-3">
        <Badge variant="green">{t("zaehler", { anzahl: ereignisse })}</Badge>
        {letzterStand && (
          <span className="text-body-sm text-ink-muted">
            {t("letzterLauf", { datum: formatDate(letzterStand) })}
          </span>
        )}
      </div>

      <LegalCard>
        <div className="p-6">
          {meldungen.length === 0 ? (
            <p className="text-body text-ink-muted">{t("leer")}</p>
          ) : (
            <div className="space-y-10">
              {[...gruppen.entries()].map(([key, liste]) => (
                <section key={key}>
                  <h2 className="mb-5 text-label uppercase tracking-widest text-ink-muted">
                    {monatsname(key)}
                  </h2>
                  <ol className="space-y-7 border-l border-line-strong pl-6">
                    {liste.map((m) => (
                      <RadarMeldungEintrag
                        key={m.id}
                        meldung={m}
                        anforderungIdNachNr={anforderungIdNachNr}
                      />
                    ))}
                  </ol>
                </section>
              ))}
            </div>
          )}
        </div>
        <LegalCardFooter>{t("footer")}</LegalCardFooter>
      </LegalCard>
    </>
  );
}
