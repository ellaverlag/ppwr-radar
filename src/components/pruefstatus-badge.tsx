import { Badge } from "@/components/badge";
import type { ReviewStatus } from "@/lib/wissensbasis";

/**
 * Dezente Statuskennzeichnung je Datensatz der Wissensbasis.
 *
 * - cattwyk_freigegeben → „Juristisch plausibilisiert“ (grün)
 * - redaktion_geprueft  → „Redaktionell geprüft, juristische Prüfung läuft“ (neutral)
 * - entwurf             → „Entwurf – ungeprüft“ (gold; nur im Preview-Modus sichtbar)
 *
 * Die Texte kommen aus Labels.pruefstatus (next-intl) und werden als
 * `labels`-Map übergeben, damit die Komponente auch in Client-Komponenten
 * ohne eigenen Übersetzungs-Hook nutzbar ist.
 */
export type PruefstatusLabels = Partial<Record<ReviewStatus, string>>;

const VARIANT: Record<ReviewStatus, "green" | "neutral" | "gold"> = {
  cattwyk_freigegeben: "green",
  redaktion_geprueft: "neutral",
  entwurf: "gold",
};

export function PruefstatusBadge({
  status,
  labels,
}: {
  status: ReviewStatus | string;
  labels: PruefstatusLabels;
}) {
  const key = (status in VARIANT ? status : "entwurf") as ReviewStatus;
  const text = labels[key] ?? key;
  return (
    <Badge variant={VARIANT[key]} title={text}>
      {text}
    </Badge>
  );
}
