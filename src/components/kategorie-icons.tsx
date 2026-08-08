import {
  Ban,
  Check,
  Circle,
  Clock,
  FlaskConical,
  Hourglass,
  Info,
  Recycle,
  ShieldCheck,
  Tag,
  Users,
  type LucideIcon,
} from "lucide-react";
import type { GiltStatus, Kategorie } from "@/lib/wissensbasis";

/**
 * Zentrale Icon-Zuordnung für Kategorie- und Status-Chips (Lucide, 14 px,
 * stroke 2). Die verbindliche Tabelle steht in design-reference/TOKENS.md –
 * neue Icons nur dort ergänzen, keine dekorativen Icons darüber hinaus.
 */

export const KATEGORIE_ICON: Record<Kategorie, LucideIcon> = {
  stoffrecht: FlaskConical,
  mehrweg: Recycle,
  kennzeichnung: Tag,
  konformitaet: ShieldCheck,
  rollen_epr: Users,
  verbote: Ban,
  sonstiges: Info,
};

export const GILT_STATUS_ICON: Record<GiltStatus, LucideIcon> = {
  in_kraft: Check,
  kuenftig: Clock,
  rechtsakt_ausstehend: Hourglass,
  entwurf_eu: Circle,
};

/** Bearbeitungs-Ampel der Status-Analyse (offen/in Bearbeitung/erledigt). */
export const BEARBEITUNG_ICON: Record<string, LucideIcon> = {
  offen: Circle,
  in_bearbeitung: Clock,
  erledigt: Check,
};

const CHIP_ICON_KLASSE = "h-3.5 w-3.5 shrink-0";

export function KategorieIcon({
  kategorie,
  className = CHIP_ICON_KLASSE,
}: {
  kategorie: Kategorie;
  className?: string;
}) {
  const IconKomponente = KATEGORIE_ICON[kategorie] ?? Info;
  return (
    <IconKomponente strokeWidth={2} aria-hidden="true" className={className} />
  );
}

export function GiltStatusIcon({
  status,
  className = CHIP_ICON_KLASSE,
}: {
  status: GiltStatus;
  className?: string;
}) {
  const IconKomponente = GILT_STATUS_ICON[status] ?? Circle;
  return (
    <IconKomponente strokeWidth={2} aria-hidden="true" className={className} />
  );
}

export function BearbeitungIcon({
  status,
  className = CHIP_ICON_KLASSE,
}: {
  status: string;
  className?: string;
}) {
  const IconKomponente = BEARBEITUNG_ICON[status] ?? Circle;
  return (
    <IconKomponente strokeWidth={2} aria-hidden="true" className={className} />
  );
}
