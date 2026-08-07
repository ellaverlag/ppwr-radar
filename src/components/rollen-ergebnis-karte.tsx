import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import type { HerleitungsEintrag, RollenSet } from "@/lib/rollen-engine";

/**
 * Aufklappbare Ergebnis-Karte einer Produktlinie (Rollen-Set + Herleitung) –
 * genutzt vom Onboarding-Ergebnis und vom Ergebnis-Screen des Mini-Wizards
 * der Produktlinien-Verwaltung.
 */
export async function RollenErgebnisKarte({
  produktlinie,
  rollenSet,
  herleitung,
  eskalationsText,
  begriffe,
  offen = false,
}: {
  produktlinie: string;
  rollenSet: RollenSet;
  herleitung: HerleitungsEintrag[];
  eskalationsText: string;
  begriffe: Record<string, { begriff_de: string }>;
  offen?: boolean;
}) {
  const t = await getTranslations("OnboardingErgebnis");
  const tLabels = await getTranslations("Labels");

  const label = (rolle: string) =>
    begriffe[rolle]?.begriff_de ??
    (tLabels.has(`rollen.${rolle}`) ? tLabels(`rollen.${rolle}`) : rolle);
  const istRolle = (wert: string) => tLabels.has(`rollen.${wert}`);
  const istPflicht = (wert: string) => tLabels.has(`pflichten.${wert}`);
  const istEntlastung = (wert: string) => tLabels.has(`entlastungen.${wert}`);

  return (
    <div className="rounded border border-line bg-canvas">
      {rollenSet.unklar ? (
        <div className="p-6">
          <p className="text-label uppercase tracking-widest text-ink-muted">
            {t("produktlinie")}
          </p>
          <h2 className="mt-1 text-headline text-ink">{produktlinie}</h2>
          <div className="mt-6 border-l-4 border-line-strong bg-surface p-5">
            <h3 className="text-label uppercase text-ink-muted">
              {t("einordnungOffen")}
            </h3>
            <p className="mt-2 text-body text-ink">{eskalationsText}</p>
          </div>
        </div>
      ) : (
        <details className="group" open={offen}>
          <summary className="flex cursor-pointer list-none flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between [&::-webkit-details-marker]:hidden">
            <div>
              <p className="text-label uppercase tracking-widest text-ink-muted">
                {t("produktlinie")}
              </p>
              <h2 className="mt-1 text-headline text-ink">{produktlinie}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {rollenSet.rollen.map((rolle) => (
                <Badge key={rolle} variant="blue">
                  {label(rolle)}
                </Badge>
              ))}
              {rollenSet.vorbehalt && (
                <Badge variant="neutral">{t("vorbehalt")}</Badge>
              )}
              <span
                aria-hidden="true"
                className="ml-1 text-ink-muted transition-transform group-open:rotate-180"
              >
                ▾
              </span>
            </div>
          </summary>

          <div className="border-t border-line-strong px-6 pb-6">
            {herleitung.map((schritt) => (
              <div
                key={schritt.regel_id}
                className="mt-6 border-l border-line-strong pl-4"
              >
                <p className="text-body text-ink">
                  <span className="font-semibold">
                    {t("sieGeltenAls", {
                      rollen:
                        schritt.ergebnis
                          .filter(istRolle)
                          .map(label)
                          .join(" und ") || t("betroffen"),
                    })}
                  </span>{" "}
                  {t("weil", {
                    grund: schritt.erlaeuterung ?? t("sieheFundstelle"),
                  })}
                </p>
                {schritt.ergebnis.some(istPflicht) && (
                  <ul className="mt-2 space-y-1">
                    {schritt.ergebnis.filter(istPflicht).map((p) => (
                      <li key={p} className="text-body-sm text-ink-muted">
                        {t("pflichtPrefix", {
                          pflicht: tLabels(`pflichten.${p}`),
                        })}
                      </li>
                    ))}
                  </ul>
                )}
                {schritt.ergebnis.some(istEntlastung) && (
                  <ul className="mt-2 space-y-1">
                    {schritt.ergebnis.filter(istEntlastung).map((p) => (
                      <li key={p} className="text-body-sm text-ink-muted">
                        {t("entlastungPrefix", {
                          entlastung: tLabels(`entlastungen.${p}`),
                        })}
                      </li>
                    ))}
                  </ul>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <Badge variant="blue">{schritt.fundstelle_primaer}</Badge>
                  {schritt.fundstelle_sekundaer && (
                    <Badge variant="neutral" title={t("sekundaerquelle")}>
                      {schritt.fundstelle_sekundaer.length > 60
                        ? `${schritt.fundstelle_sekundaer.slice(0, 57)}…`
                        : schritt.fundstelle_sekundaer}
                    </Badge>
                  )}
                  {schritt.vorbehalt && (
                    <Badge variant="neutral">{t("vorbehalt")}</Badge>
                  )}
                </div>
              </div>
            ))}

            {rollenSet.pflichten.length > 0 && (
              <div className="mt-6 border-l-4 border-gold bg-surface p-4">
                <h3 className="text-label uppercase text-gold-ink">
                  {t("pflichtenTitel")}
                </h3>
                <ul className="mt-2 space-y-1">
                  {rollenSet.pflichten.map((p) => (
                    <li key={p} className="text-body-sm text-ink">
                      {istPflicht(p) ? tLabels(`pflichten.${p}`) : p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </details>
      )}
    </div>
  );
}
