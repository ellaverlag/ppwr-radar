import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { EinblickLink } from "@/components/einblick-link";
import { PruefstatusBadge } from "@/components/pruefstatus-badge";
import { formatDate } from "@/lib/labels";
import type { Einordnung, RadarMeldung } from "@/lib/radar";
import {
  anforderungEinblickUrl,
  anforderungUrl,
  praxisfrageEinblickUrl,
  praxisfrageUrl,
} from "@/lib/wissen-links";

/**
 * Eine Radar-Meldung als Ticker-Eintrag: Datum, Quelle, Einordnung,
 * Titel, Text, Fundstellen und Verweise (Anforderungen / Praxisfragen im
 * Schiebefenster). `kompakt` (Dashboard) kürzt auf Titel + erste zwei
 * Sätze; `nurTitel` ist die gesperrte Vorzimmer-Variante.
 */

const EINORDNUNG_VARIANT: Record<Einordnung, "blue" | "neutral" | "gold" | "green"> = {
  rechtsverbindlich: "blue",
  unverbindliche_auslegung: "neutral",
  behoerdeninformation: "neutral",
  verfahren: "gold",
  gericht: "gold",
  verbandsmeinung: "neutral",
  stand: "green",
};

function ersteSaetze(text: string, n: number): string {
  const teile = text.match(/[^.!?]+[.!?]+(\s|$)/g);
  if (!teile || teile.length <= n) return text;
  return teile.slice(0, n).join("").trim();
}

export async function RadarMeldungEintrag({
  meldung,
  anforderungIdNachNr,
  kompakt = false,
  nurTitel = false,
}: {
  meldung: RadarMeldung;
  anforderungIdNachNr: Map<number, string>;
  kompakt?: boolean;
  nurTitel?: boolean;
}) {
  const t = await getTranslations("Updates");
  const tLabels = await getTranslations("Labels");
  const tEinblick = await getTranslations("Einblick");
  const einblickLabels = {
    schliessen: tEinblick("schliessen"),
    imWissenOeffnen: tEinblick("imWissenOeffnen"),
  };
  const istStand = meldung.einordnung === "stand";
  const verweise = !nurTitel && (meldung.bezug_nr.length > 0 || meldung.verweis_auslegungen.length > 0);

  return (
    <li className={istStand ? "text-ink-muted" : ""}>
      <div className="flex flex-wrap items-center gap-2">
        <span className="font-mono text-mono-sm text-ink-muted">{formatDate(meldung.datum)}</span>
        <Badge variant={EINORDNUNG_VARIANT[meldung.einordnung] ?? "neutral"}>
          {t(`einordnung.${meldung.einordnung}`)}
        </Badge>
        <span className="text-body-sm text-ink-muted">{meldung.quelle}</span>
        {!kompakt && !istStand && (
          <PruefstatusBadge status={meldung.review_status} labels={tLabels.raw("pruefstatus")} />
        )}
      </div>
      <h3 className={`mt-1 font-bold ${istStand ? "text-body text-ink-muted" : "text-body-lg text-ink"}`}>
        {meldung.titel}
      </h3>
      {!nurTitel && (
        <p className="mt-1 whitespace-pre-line text-body-sm text-ink-muted">
          {kompakt ? ersteSaetze(meldung.text, 2) : meldung.text}
        </p>
      )}
      {!nurTitel && !kompakt && meldung.rechtslage_unveraendert && !istStand && (
        <p className="mt-1 text-body-sm italic text-ink-muted">{t("rechtslageUnveraendert")}</p>
      )}
      {!kompakt && !nurTitel && meldung.fundstellen.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-2">
          {meldung.fundstellen.map((f) => (
            <Badge key={f} variant="blue" title={f}>
              {f.length > 60 ? `${f.slice(0, 57)}…` : f}
            </Badge>
          ))}
        </div>
      )}
      {verweise && (
        <p className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm">
          {meldung.bezug_nr.map((nr) => {
            const id = anforderungIdNachNr.get(nr);
            if (!id) return null;
            return (
              <EinblickLink
                key={`a-${nr}`}
                href={anforderungUrl(id)}
                einblickHref={anforderungEinblickUrl(id)}
                titel={`${tEinblick("anforderung")} #${nr}`}
                labels={einblickLabels}
                className="font-medium text-legal hover:underline"
              >
                {t("anforderungLink", { nr: String(nr).padStart(2, "0") })}
              </EinblickLink>
            );
          })}
          {meldung.verweis_auslegungen.map((code) => (
            <EinblickLink
              key={`p-${code}`}
              href={praxisfrageUrl(code)}
              einblickHref={praxisfrageEinblickUrl(code)}
              titel={`${tEinblick("praxisfrage")} ${code}`}
              labels={einblickLabels}
              className="font-medium text-legal hover:underline"
            >
              {t("praxisfrageLink", { code })}
            </EinblickLink>
          ))}
          {!kompakt && meldung.quelle_url && (
            <a
              href={meldung.quelle_url}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-legal hover:underline"
            >
              {t("quelleLink")} ↗
            </a>
          )}
        </p>
      )}
    </li>
  );
}
