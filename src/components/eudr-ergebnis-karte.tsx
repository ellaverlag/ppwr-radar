import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { EinblickLink } from "@/components/einblick-link";
import { KategorieIcon } from "@/components/kategorie-icons";
import { LegalCardFooter, TrafficDot } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import type { EudrErgebnis, EudrStatus } from "@/lib/rollen-engine";
import {
  anforderungEinblickUrl,
  anforderungUrl,
  praxisfrageEinblickUrl,
  praxisfrageUrl,
} from "@/lib/wissen-links";

export const EUDR_AMPEL: Record<EudrStatus, "green" | "red" | "gold"> = {
  nicht_betroffen: "green",
  betroffen: "red",
  unklar: "gold",
};

/** Statuszeile („Betroffen als …“) – auch für Dashboard und Listen. */
export async function eudrStatusText(e: EudrErgebnis): Promise<string> {
  const t = await getTranslations("Eudr");
  const tLabels = await getTranslations("Labels");
  const rolle = e.rolle ? tLabels(`rollen.${e.rolle}`) : "";
  if (e.status === "betroffen") return t("status.betroffen", { rolle });
  if (e.status === "unklar" && e.rolle) return t("status.unklarRolle", { rolle });
  return t(`status.${e.status}`);
}

/**
 * Ergebnis-Karte „EUDR“ je Verpackung (EUDR-Strang, Regeln E1–E9): Ampel
 * nicht betroffen / betroffen als … / unklar, tragender Grund mit
 * Fundstelle, Frist, offene Rückfragen, Herleitung und – im Einblick-Fenster
 * – die einschlägigen Anforderungen 41–44 und Praxisfragen E01–E14. Bei
 * betroffen/unklar der Cattwyk-Hinweis (Wortlaut aus app_config, Fallback
 * aus messages; Freigabe im Nachprüfpaket E, Punkt 8).
 *
 * Praxisfragen, die (noch) nicht ausspielbar sind, erscheinen als Code mit
 * „in Prüfung“ statt als Link.
 */
export async function EudrErgebnisKarte({
  ankerId,
  bezeichnung,
  materialText,
  ergebnis,
  verfuegbarePraxisfragen,
  anforderungIdNachNr,
  cattwykText,
  engineVersion,
  rechtsstand,
  offen = false,
}: {
  ankerId: string;
  bezeichnung: string;
  materialText: string | null;
  ergebnis: EudrErgebnis | null;
  verfuegbarePraxisfragen: Set<string>;
  anforderungIdNachNr: Map<number, string>;
  cattwykText: string;
  engineVersion: string;
  rechtsstand: string;
  offen?: boolean;
}) {
  const t = await getTranslations("Eudr");
  const tLabels = await getTranslations("Labels");
  const tEinblick = await getTranslations("Einblick");
  const einblickLabels = {
    schliessen: tEinblick("schliessen"),
    imWissenOeffnen: tEinblick("imWissenOeffnen"),
  };

  if (!ergebnis) {
    return (
      <div id={ankerId} className="rounded border border-line bg-canvas p-6">
        <p className="flex items-center gap-2 text-label uppercase tracking-widest text-ink-muted">
          <KategorieIcon kategorie="eudr" />
          {t("titel")}
        </p>
        <p className="mt-2 text-body-sm text-ink-muted">{t("keinErgebnis")}</p>
      </div>
    );
  }

  const rolle = ergebnis.rolle ? tLabels(`rollen.${ergebnis.rolle}`) : "";
  const statusText = await eudrStatusText(ergebnis);
  const grundText = t(`grund.${ergebnis.grund}`, { rolle });
  const akzent =
    ergebnis.status === "betroffen"
      ? "border-danger"
      : ergebnis.status === "unklar"
        ? "border-gold"
        : "border-primary";
  const feldname = (f: string) => t(`feldnamen.${f}`);

  return (
    <div id={ankerId} className="rounded border border-line bg-canvas">
      <details className="group" open={offen}>
        <summary className="flex cursor-pointer list-none flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between [&::-webkit-details-marker]:hidden">
          <div>
            <p className="flex items-center gap-2 text-label uppercase tracking-widest text-ink-muted">
              <KategorieIcon kategorie="eudr" />
              {t("titel")}
            </p>
            <h2 className="mt-1 text-headline text-ink">{bezeichnung}</h2>
            <p className="mt-1 text-body-sm text-ink-muted">
              {t("materialErkannt", { material: tLabels(`eudr.material.${ergebnis.material}`) })}
              {materialText ? ` („${materialText}“)` : ""}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <TrafficDot color={EUDR_AMPEL[ergebnis.status]} />
            <span className="text-body font-bold text-ink">{statusText}</span>
            {ergebnis.vorbehalt && <Badge variant="neutral">{t("vorbehalt")}</Badge>}
            <span
              aria-hidden="true"
              className="ml-1 text-ink-muted transition-transform group-open:rotate-180"
            >
              ▾
            </span>
          </div>
        </summary>

        <div className="border-t border-line-strong px-6 pb-6">
          <div className={`mt-6 border-l-4 ${akzent} bg-surface p-5`}>
            <p className="text-body text-ink">{grundText}</p>
            <dl className="mt-4 grid grid-cols-1 gap-3 text-body-sm md:grid-cols-2">
              {ergebnis.fundstelle && (
                <div>
                  <dt className="text-label uppercase text-ink-muted">{t("fundstelleLabel")}</dt>
                  <dd className="mt-1 text-ink">{ergebnis.fundstelle}</dd>
                </div>
              )}
              {ergebnis.frist && (
                <div>
                  <dt className="text-label uppercase text-ink-muted">{t("fristLabel")}</dt>
                  <dd className="mt-1 font-bold text-ink">
                    {formatDate(ergebnis.frist)}
                    {ergebnis.fristAlternativ && (
                      <span className="block font-normal text-ink-muted">
                        {t("fristAlternativ", { datum: formatDate(ergebnis.fristAlternativ) })}
                      </span>
                    )}
                  </dd>
                </div>
              )}
            </dl>
          </div>

          {ergebnis.offeneFragen.length > 0 && (
            <section className="mt-6">
              <h3 className="text-label uppercase text-gold-ink">{t("offeneFragenTitel")}</h3>
              <ul className="mt-2 space-y-1.5">
                {ergebnis.offeneFragen.map((f) => (
                  <li key={f} className="text-body-sm text-ink">
                    → {t(`frage.${f}`)}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {ergebnis.abgeleitet.length > 0 && (
            <p className="mt-4 text-body-sm text-ink-muted">
              {t("abgeleitet", { felder: ergebnis.abgeleitet.map(feldname).join(", ") })}
            </p>
          )}

          {(ergebnis.status !== "nicht_betroffen") && (
            <div className="mt-6 border-l-4 border-legal bg-surface p-5">
              <h3 className="text-label uppercase text-legal">{t("cattwykTitel")}</h3>
              <p className="mt-2 text-body text-ink">{cattwykText}</p>
            </div>
          )}

          {/* Einblick: Anforderungen und Praxisfragen */}
          <div className="mt-6 grid grid-cols-1 gap-6 md:grid-cols-2">
            <section>
              <h3 className="text-label uppercase text-ink-muted">{t("anforderungenTitel")}</h3>
              <p className="mt-2 flex flex-wrap gap-2">
                {ergebnis.anforderungen.map((nr) => {
                  const id = anforderungIdNachNr.get(nr);
                  return id ? (
                    <EinblickLink
                      key={nr}
                      href={anforderungUrl(id)}
                      einblickHref={anforderungEinblickUrl(id)}
                      titel={`${tEinblick("anforderung")} #${nr}`}
                      labels={einblickLabels}
                      className="hover:underline"
                    >
                      <Badge variant="blue">#{nr}</Badge>
                    </EinblickLink>
                  ) : (
                    <Badge key={nr} variant="neutral" title={t("inPruefung")}>
                      #{nr} · {t("inPruefung")}
                    </Badge>
                  );
                })}
              </p>
            </section>
            <section>
              <h3 className="text-label uppercase text-ink-muted">{t("praxisfragenTitel")}</h3>
              <p className="mt-2 flex flex-wrap gap-2">
                {ergebnis.praxisfragen.map((code) =>
                  verfuegbarePraxisfragen.has(code) ? (
                    <EinblickLink
                      key={code}
                      href={praxisfrageUrl(code)}
                      einblickHref={praxisfrageEinblickUrl(code)}
                      titel={`${tEinblick("praxisfrage")} ${code}`}
                      labels={einblickLabels}
                      className="hover:underline"
                    >
                      <Badge variant="blue">{code}</Badge>
                    </EinblickLink>
                  ) : (
                    <Badge key={code} variant="neutral" title={t("inPruefung")}>
                      {code} · {t("inPruefung")}
                    </Badge>
                  )
                )}
              </p>
            </section>
          </div>

          {/* Herleitung */}
          {ergebnis.herleitung.length > 0 && (
            <section className="mt-6">
              <h3 className="text-label uppercase text-ink-muted">{t("herleitungTitel")}</h3>
              {ergebnis.herleitung.map((schritt) => (
                <div key={schritt.regel_id} className="mt-4 border-l border-line-strong pl-4">
                  <p className="text-body-sm text-ink">
                    <span className="font-mono text-mono-sm text-ink-muted">
                      {t("regel", { id: schritt.regel_id })}
                    </span>{" "}
                    {schritt.erlaeuterung ?? ""}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    {schritt.fundstelle_primaer && (
                      <Badge variant="blue">{schritt.fundstelle_primaer}</Badge>
                    )}
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
              ))}
            </section>
          )}

          {ergebnis.vorbehalt && (
            <p className="mt-6 text-body-sm text-ink-muted">{t("vorbehaltText")}</p>
          )}
          <p className="mt-2 text-body-sm italic text-ink-muted">{t("abgrenzung")}</p>
        </div>
      </details>
      <LegalCardFooter>
        {t("fussZeile", { version: engineVersion, datum: formatDate(rechtsstand) })}
      </LegalCardFooter>
    </div>
  );
}
