import type { Metadata } from "next";
import { Badge } from "@/components/badge";
import { DocumentIcon, PlusIcon, SearchIcon, WarningIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { LegalCard, LegalCardFooter } from "@/components/ui";

export const metadata: Metadata = {
  title: "Meine Dokumente – PPWR Radar",
};

const TABS = ["Alle", "Gültig", "Entwürfe", "Archiv"];

const BEISPIEL_DOKUMENTE = [
  {
    titel: "Konformitätserklärung PET-Flaschen",
    quelle: "Richtlinie 94/62/EG",
    version: "v1.2",
    rechtsstand: "12.08.2026",
    status: "update" as const,
  },
  {
    titel: "Recycling-Nachweis Transportverpackung",
    quelle: "DIN EN 13430",
    version: "v2.0",
    rechtsstand: "05.11.2026",
    status: "gueltig" as const,
  },
  {
    titel: "Materialspezifikation Folien",
    quelle: "Internes Dokument",
    version: "v1.0",
    rechtsstand: "14.02.2026",
    status: "archiviert" as const,
  },
];

export default function DokumentePage() {
  return (
    <>
      <PageHeader
        title="Meine Dokumente"
        description="Zentrales Archiv für alle Compliance-Nachweise, Zertifikate und regulatorischen Dokumente gemäß PPWR-Anforderungen."
      />

      <div className="mb-8 flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex gap-8 border-b border-line">
          {TABS.map((tab, i) => (
            <span
              key={tab}
              className={`-mb-px border-b-2 pb-3 text-body-sm ${
                i === 0
                  ? "border-primary font-bold text-primary"
                  : "border-transparent font-semibold text-ink-muted"
              }`}
            >
              {tab}
            </span>
          ))}
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="relative">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
            <input
              type="search"
              disabled
              placeholder="Dokument suchen …"
              className="w-64 rounded border border-line-strong bg-canvas py-2.5 pl-11 pr-4 text-body text-ink placeholder:text-ink-muted/60 disabled:bg-surface"
            />
          </div>
          <span className="inline-flex cursor-not-allowed items-center gap-2 rounded bg-primary px-5 py-2.5 text-label uppercase tracking-widest text-white opacity-60">
            <PlusIcon className="h-4 w-4" />
            <span>Neues Dokument</span>
          </span>
        </div>
      </div>

      <LegalCard>
        <div className="hidden grid-cols-12 gap-4 rounded-t bg-surface px-6 py-3 text-label uppercase text-ink-muted md:grid">
          <span className="col-span-6">Dokumententitel</span>
          <span className="col-span-2">Version</span>
          <span className="col-span-2">Rechtsstand</span>
          <span className="col-span-2">Status</span>
        </div>
        <ul className="divide-y divide-line">
          {BEISPIEL_DOKUMENTE.map((dok) => (
            <li
              key={dok.titel}
              className="grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-12 md:items-center md:gap-4"
            >
              <div className="flex items-start gap-3 md:col-span-6">
                <DocumentIcon className="mt-1 h-5 w-5 text-ink-muted" />
                <div>
                  <p
                    className={`text-body-lg font-bold ${
                      dok.status === "archiviert" ? "text-ink-muted" : "text-ink"
                    }`}
                  >
                    {dok.titel}
                  </p>
                  <p className="mt-0.5 text-body-sm text-ink-muted">
                    {dok.quelle}
                  </p>
                </div>
              </div>
              <div className="md:col-span-2">
                <span className="rounded bg-surface px-2 py-1 font-mono text-mono-sm text-ink">
                  {dok.version}
                </span>
              </div>
              <div className="text-body-sm text-ink-muted md:col-span-2">
                {dok.rechtsstand}
              </div>
              <div className="md:col-span-2">
                {dok.status === "update" && (
                  <Badge variant="gold">
                    <WarningIcon className="mr-1 h-3 w-3" />
                    Update verfügbar
                  </Badge>
                )}
                {dok.status === "gueltig" && <Badge variant="green">Gültig</Badge>}
                {dok.status === "archiviert" && (
                  <Badge variant="neutral">Archiviert</Badge>
                )}
              </div>
            </li>
          ))}
        </ul>
        <LegalCardFooter>
          Beispieldaten · Der Dokumenten-Generator folgt in einem späteren Paket
        </LegalCardFooter>
      </LegalCard>
    </>
  );
}
