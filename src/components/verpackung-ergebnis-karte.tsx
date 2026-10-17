import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { PruefstatusBadge } from "@/components/pruefstatus-badge";
import { LegalCardFooter } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import type { HerleitungsEintrag, PflichtEintrag } from "@/lib/rollen-engine";
import type { EntlastungsHinweis, VerpackungZeile } from "@/lib/verpackungen-service";
import { anforderungUrl, praxisfrageUrl } from "@/lib/wissen-links";

/**
 * Ergebnis-Karte einer VERPACKUNG (Stil wie rollen-ergebnis-karte.tsx):
 * Rollen-Chips mit aufklappbarer Herleitung, Pflichten-Matrix und die
 * redaktionellen „Ideen zur Vereinfachung“ aus entlastungs_hinweise.
 * Bei unklar (D5, Lohnfertigung): Hinweis-Box statt Rollen.
 */
export async function VerpackungErgebnisKarte({
  verpackung,
  rollen,
  pflichten,
  herleitung,
  vorbehalt,
  unklar,
  hinweise,
  anforderungIdNachNr,
  begriffe,
  engineVersion,
  rechtsstand,
  offen = false,
}: {
  verpackung: VerpackungZeile;
  rollen: string[];
  pflichten: PflichtEintrag[];
  herleitung: HerleitungsEintrag[];
  vorbehalt: boolean;
  unklar: boolean;
  hinweise: EntlastungsHinweis[];
  anforderungIdNachNr: Map<number, string>;
  begriffe: Record<string, { begriff_de: string }>;
  engineVersion: string;
  rechtsstand: string;
  offen?: boolean;
}) {
  const t = await getTranslations("VerpackungErgebnis");
  const tLabels = await getTranslations("Labels");

  const rollenLabel = (rolle: string) =>
    begriffe[rolle]?.begriff_de ??
    (tLabels.has(`rollen.${rolle}`) ? tLabels(`rollen.${rolle}`) : rolle);
  const istRolle = (wert: string) => tLabels.has(`rollen.${wert}`);
  const istPflicht = (wert: string) => tLabels.has(`pflichten.${wert}`);
  const istEntlastung = (wert: string) => tLabels.has(`entlastungen.${wert}`);
  const entzogen = (eintrag: HerleitungsEintrag) =>
    eintrag.ergebnis
      .filter((w) => w.startsWith("entzug:"))
      .map((w) => w.slice("entzug:".length));
  const pflichtLabel = (p: PflichtEintrag) =>
    tLabels.has(`verpackungPflichten.${p.key}`)
      ? tLabels(`verpackungPflichten.${p.key}`)
      : p.label;
  const giltVariant = (gilt: PflichtEintrag["gilt"]) =>
    gilt === "ja" ? "blue" : gilt === "unklar" ? "gold" : "neutral";

  const merkmale = [
    tLabels(`verpackung.art.${verpackung.art}`),
    tLabels(`verpackung.form.${verpackung.form}`),
    tLabels(`verpackung.bezug.${verpackung.bezug}`),
  ].join(" · ");

  return (
    <div id={`v-${verpackung.id}`} className="rounded border border-line bg-canvas">
      <details className="group" open={offen}>
        <summary className="flex cursor-pointer list-none flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between [&::-webkit-details-marker]:hidden">
          <div>
            <p className="text-label uppercase tracking-widest text-ink-muted">
              {t("verpackung")}
            </p>
            <h2 className="mt-1 text-headline text-ink">{verpackung.bezeichnung}</h2>
            <p className="mt-1 text-body-sm text-ink-muted">{merkmale}</p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {unklar ? (
              <Badge variant="gold">{t("unklarTitel")}</Badge>
            ) : rollen.length === 0 ? (
              <Badge variant="neutral">{t("keineRolle")}</Badge>
            ) : (
              rollen.map((rolle) => (
                <Badge key={rolle} variant="blue">
                  {rollenLabel(rolle)}
                </Badge>
              ))
            )}
            {vorbehalt && <Badge variant="neutral">{t("vorbehalt")}</Badge>}
            <span
              aria-hidden="true"
              className="ml-1 text-ink-muted transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </div>
        </summary>

        <div className="border-t border-line-strong px-6 pb-6">
          {unklar && (
            <div className="mt-6 border-l-4 border-gold bg-surface p-5">
              <h3 className="text-label uppercase text-gold-ink">{t("unklarTitel")}</h3>
              <p className="mt-2 text-body text-ink">{t("unklarText")}</p>
              <Link
                href={praxisfrageUrl("A01")}
                className="mt-3 inline-block text-body-sm font-medium text-legal hover:underline"
              >
                {t("unklarLink")}
              </Link>
            </div>
          )}

          {/* Herleitung */}
          {herleitung.length > 0 && (
            <section className="mt-6">
              <h3 className="text-label uppercase text-ink-muted">{t("herleitungTitel")}</h3>
              {herleitung.map((schritt) => {
                const rollenImSchritt = schritt.ergebnis.filter(istRolle).map(rollenLabel);
                const entzug = entzogen(schritt).map(rollenLabel);
                return (
                  <div
                    key={schritt.regel_id}
                    className="mt-4 border-l border-line-strong pl-4"
                  >
                    <p className="text-body text-ink">
                      <span className="font-mono text-mono-sm text-ink-muted">
                        {t("regel", { id: schritt.regel_id })}
                      </span>{" "}
                      {rollenImSchritt.length > 0 && (
                        <span className="font-semibold">{rollenImSchritt.join(", ")} – </span>
                      )}
                      {schritt.erlaeuterung ?? ""}
                    </p>
                    {entzug.length > 0 && (
                      <p className="mt-1 text-body-sm text-ink-muted">
                        {t("entzugPrefix", { rollen: entzug.join(", ") })}
                      </p>
                    )}
                    {schritt.ergebnis.some(istPflicht) && (
                      <ul className="mt-1 space-y-1">
                        {schritt.ergebnis.filter(istPflicht).map((p) => (
                          <li key={p} className="text-body-sm text-ink-muted">
                            → {tLabels(`pflichten.${p}`)}
                          </li>
                        ))}
                      </ul>
                    )}
                    {schritt.ergebnis.some(istEntlastung) && (
                      <ul className="mt-1 space-y-1">
                        {schritt.ergebnis.filter(istEntlastung).map((p) => (
                          <li key={p} className="text-body-sm text-ink-muted">
                            → {tLabels(`entlastungen.${p}`)}
                          </li>
                        ))}
                      </ul>
                    )}
                    <div className="mt-2 flex flex-wrap gap-2">
                      <Badge variant="blue">{schritt.fundstelle_primaer}</Badge>
                      {schritt.fundstelle_sekundaer && (
                        <Badge variant="neutral" title={schritt.fundstelle_sekundaer}>
                          {schritt.fundstelle_sekundaer.length > 60
                            ? `${schritt.fundstelle_sekundaer.slice(0, 57)}…`
                            : schritt.fundstelle_sekundaer}
                        </Badge>
                      )}
                      {schritt.vorbehalt && <Badge variant="neutral">{t("vorbehalt")}</Badge>}
                    </div>
                  </div>
                );
              })}
            </section>
          )}

          {/* Pflichten-Matrix */}
          <section className="mt-8">
            <h3 className="text-label uppercase text-ink-muted">{t("pflichtenTitel")}</h3>
            <div className="mt-3 overflow-x-auto">
              <table className="w-full text-left text-body-sm">
                <thead>
                  <tr className="border-b border-line-strong text-label uppercase text-ink-muted">
                    <th className="py-2 pr-4 font-medium">{t("spaltePflicht")}</th>
                    <th className="py-2 pr-4 font-medium">{t("spalteGilt")}</th>
                    <th className="py-2 pr-4 font-medium">{t("spalteWarum")}</th>
                    <th className="py-2 font-medium">{t("spalteMehr")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {pflichten.map((p) => {
                    const id = p.anforderung_nr != null ? anforderungIdNachNr.get(p.anforderung_nr) : undefined;
                    return (
                      <tr key={p.key} className={p.gilt === "nein" ? "text-ink-muted" : "text-ink"}>
                        <td className="py-2 pr-4 align-top font-medium">{pflichtLabel(p)}</td>
                        <td className="py-2 pr-4 align-top">
                          <Badge variant={giltVariant(p.gilt)}>{tLabels(`gilt.${p.gilt}`)}</Badge>
                        </td>
                        <td className="py-2 pr-4 align-top text-ink-muted">{p.grund}</td>
                        <td className="py-2 align-top">
                          {id ? (
                            <Link
                              href={anforderungUrl(id)}
                              className="whitespace-nowrap font-medium text-legal hover:underline"
                            >
                              {t("mehrLink")}
                            </Link>
                          ) : p.anforderung_nr != null ? (
                            <span className="font-mono text-mono-sm text-ink-muted">
                              #{p.anforderung_nr}
                            </span>
                          ) : null}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </section>

          {/* Ideen zur Vereinfachung */}
          <section className="mt-8">
            <h3 className="text-label uppercase text-ink-muted">{t("hinweiseTitel")}</h3>
            {hinweise.length === 0 ? (
              <p className="mt-3 text-body-sm text-ink-muted">{t("hinweiseLeer")}</p>
            ) : (
              <div className="mt-3 grid grid-cols-1 gap-4 md:grid-cols-2">
                {hinweise.map((h) => (
                  <div key={h.code} className="flex flex-col rounded border border-line bg-surface p-5">
                    <div className="flex flex-wrap items-start justify-between gap-2">
                      <h4 className="text-body font-bold text-ink">{h.titel}</h4>
                      <PruefstatusBadge status={h.review_status} labels={tLabels.raw("pruefstatus")} />
                    </div>
                    <p className="mt-2 flex-1 text-body-sm text-ink">{h.text}</p>
                    <div className="mt-3 flex flex-wrap gap-2">
                      {h.fundstellen.map((f) => (
                        <Badge key={f} variant="blue" title={f}>
                          {f.length > 60 ? `${f.slice(0, 57)}…` : f}
                        </Badge>
                      ))}
                    </div>
                    {h.verweis_auslegungen.length > 0 && (
                      <p className="mt-2 flex flex-wrap items-center gap-2 text-body-sm text-ink-muted">
                        <span>{t("hinweisVerweise")}</span>
                        {h.verweis_auslegungen.map((code) => (
                          <Link key={code} href={praxisfrageUrl(code)} className="hover:underline">
                            <Badge variant="neutral">{code}</Badge>
                          </Link>
                        ))}
                      </p>
                    )}
                    <p className="mt-3 text-body-sm italic text-ink-muted">{t("hinweisSatz")}</p>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      </details>
      <LegalCardFooter>
        {t("fussZeile", { version: engineVersion, datum: formatDate(rechtsstand) })}
      </LegalCardFooter>
    </div>
  );
}
