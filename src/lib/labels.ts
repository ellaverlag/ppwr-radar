import type { GiltStatus, Kategorie, Verbindlichkeit } from "@/lib/wissensbasis";

export const KATEGORIE_LABELS: Record<Kategorie, string> = {
  stoffrecht: "Stoffrecht",
  mehrweg: "Mehrweg",
  konformitaet: "Konformität",
  kennzeichnung: "Kennzeichnung",
  rollen_epr: "Rollen & EPR",
  verbote: "Verbote",
  sonstiges: "Sonstiges",
};

export const GILT_STATUS_LABELS: Record<GiltStatus, string> = {
  in_kraft: "In Kraft",
  kuenftig: "Künftig",
  rechtsakt_ausstehend: "Rechtsakt ausstehend",
  entwurf_eu: "EU-Entwurf",
};

export const VERBINDLICHKEIT_LABELS: Record<Verbindlichkeit, string> = {
  rechtsverbindlich: "Rechtsverbindlich",
  unverbindliche_auslegung: "Unverbindliche Auslegung",
};

/** Werte aus anforderungen.betrifft_verpackungstypen. */
export const VERPACKUNGSTYP_LABELS: Record<string, string> = {
  alle: "Alle Verpackungsarten",
  verkauf: "Verkaufsverpackung",
  umverpackung: "Umverpackung",
  transport: "Transportverpackung",
  service: "Serviceverpackung",
  primaerproduktion: "Primärproduktionsverpackung",
  ecommerce_versand: "E-Commerce-Versand",
  mehrweg: "Mehrweg",
};

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return "–";
  return new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}
