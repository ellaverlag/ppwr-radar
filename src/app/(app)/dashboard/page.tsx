import type { Metadata } from "next";
import { Badge } from "@/components/badge";
import { ChatIcon, PlusIcon } from "@/components/icons";
import {
  LegalCard,
  LegalCardFooter,
  PrimaryButtonLink,
  SecondaryButtonLink,
  TrafficDot,
} from "@/components/ui";

export const metadata: Metadata = {
  title: "Dashboard – PPWR Radar",
};

const NAECHSTE_SCHRITTE = [
  {
    nr: "01",
    titel: "Betroffenheits-Check durchführen",
    text: "Beantworten Sie fünf Fragen zu Ihrem Unternehmen – daraus leiten wir Ihre Rollen nach PPWR ab.",
  },
  {
    nr: "02",
    titel: "Verpackungsprofil anlegen",
    text: "Erfassen Sie Ihre Produktlinien und Verpackungen, damit Anforderungen zugeordnet werden können.",
  },
  {
    nr: "03",
    titel: "Status-Analyse starten",
    text: "Die Gap-Analyse zeigt, welche Pflichten erfüllt sind und wo Handlungsbedarf besteht.",
  },
];

const RADAR_BEISPIELE = [
  {
    datum: "01.10.2026",
    titel: "Delegierter Rechtsakt: Entwurf veröffentlicht",
    text: "Die Kommission hat den ersten Entwurf zur Berechnung der Rezyklatanteile vorgelegt.",
    chip: { label: "Betrifft Ihre Verpackungstypen", variant: "green" as const },
    aktiv: true,
  },
  {
    datum: "15.09.2026",
    titel: "Q&A-Dokument aktualisiert",
    text: "Klarstellungen zum Begriff „Inverkehrbringen“ wurden hinzugefügt.",
    chip: { label: "Allgemeine Info", variant: "neutral" as const },
    aktiv: false,
  },
  {
    datum: "02.09.2026",
    titel: "Normungsmandat erteilt",
    text: "CEN erhält offizielles Mandat zur Entwicklung harmonisierter Normen für Design for Recycling.",
    chip: { label: "Betrifft Ihre Produktlinien", variant: "green" as const },
    aktiv: false,
  },
];

export default function DashboardPage() {
  return (
    <>
      <header className="mb-12">
        <h1 className="mb-4 text-display-sm text-ink lg:text-display">
          Dashboard
        </h1>
        <div className="flex flex-wrap gap-4">
          <PrimaryButtonLink href="/dokumente">
            <PlusIcon className="h-4 w-4" />
            <span>Neues Dokument erstellen</span>
          </PrimaryButtonLink>
          <SecondaryButtonLink href="/assistant">
            <ChatIcon className="h-4 w-4" />
            <span>Assistant fragen</span>
          </SecondaryButtonLink>
        </div>
      </header>

      {/* Status-Leiste */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <LegalCard>
          <div className="flex-1 p-6">
            <h2 className="mb-8 text-headline text-ink">
              Ihr Compliance-Status
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-line-strong pb-2">
                <span className="text-body-lg text-ink-muted">Vollständig</span>
                <span className="flex gap-1">
                  <TrafficDot color="dim" />
                  <TrafficDot color="dim" />
                  <TrafficDot color="dim" />
                </span>
              </div>
              <div className="flex items-center justify-between border-b border-line-strong pb-2">
                <span className="text-body-lg text-ink-muted">
                  Offen (Kritisch)
                </span>
                <TrafficDot color="dim" />
              </div>
              <div className="flex items-center justify-between pb-2">
                <span className="text-body-lg text-ink-muted">
                  In Bearbeitung
                </span>
                <TrafficDot color="dim" />
              </div>
            </div>
            <p className="mt-6 text-body-sm text-ink-muted">
              Die Status-Analyse wird nach dem Onboarding für Ihre Verpackungen
              erstellt.
            </p>
          </div>
          <LegalCardFooter>Verordnung (EU) 2025/40 · PPWR</LegalCardFooter>
        </LegalCard>

        <LegalCard>
          <div className="flex-1 p-6">
            <h2 className="mb-8 text-headline text-ink">Ihre Rollen</h2>
            <p className="text-body text-ink-muted">
              Noch keine Rollen ermittelt. Ihre Rollen je Produktlinie –
              etwa Erzeuger, Hersteller oder Importeur – ergeben sich aus dem
              Betroffenheits-Check.
            </p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="neutral">Onboarding folgt</Badge>
            </div>
          </div>
          <LegalCardFooter>Art. 3 PPWR · Begriffsbestimmungen</LegalCardFooter>
        </LegalCard>

        <LegalCard>
          <div className="flex-1 p-6">
            <h2 className="mb-8 text-headline text-ink">Fristen</h2>
            <div className="relative mx-2 mt-12 h-0.5 bg-line">
              <span className="absolute -top-[5px] left-0 h-3 w-3 rounded-full border-2 border-white bg-gold shadow-[0_0_0_1px_#1b1b1b]" />
              <span className="absolute -top-[5px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-ink" />
              <span className="absolute -top-[5px] right-0 h-3 w-3 rounded-full bg-ink" />
              <div className="absolute left-0 top-4 -translate-x-1/4 text-center">
                <div className="text-label font-bold uppercase text-gold-ink">
                  12.08.2026
                </div>
                <div className="text-body-sm text-ink-muted">Geltung</div>
              </div>
              <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center">
                <div className="text-label uppercase">2028</div>
                <div className="text-body-sm text-ink-muted">Stufe 2</div>
              </div>
              <div className="absolute right-0 top-4 translate-x-1/4 text-center">
                <div className="text-label uppercase">2030</div>
                <div className="text-body-sm text-ink-muted">Stufe 3</div>
              </div>
            </div>
            <div className="mt-20 border-t border-line-strong pt-4">
              <p className="text-body-sm text-ink-muted">
                <span className="font-bold text-ink">Nächste Frist:</span>{" "}
                Geltungsbeginn der PPWR am 12.08.2026.
              </p>
            </div>
          </div>
          <LegalCardFooter>Art. 71 PPWR · Geltungsbeginn</LegalCardFooter>
        </LegalCard>
      </div>

      {/* Meine nächsten Schritte */}
      <LegalCard className="mt-6">
        <div className="flex-1 p-6">
          <h2 className="mb-8 text-headline text-ink">Meine nächsten Schritte</h2>
          <ol className="space-y-6 border-l border-line-strong pl-6">
            {NAECHSTE_SCHRITTE.map((schritt) => (
              <li key={schritt.nr} className="flex gap-4">
                <span className="font-mono text-mono-sm text-ink-muted">
                  {schritt.nr}
                </span>
                <div>
                  <h3 className="text-label uppercase text-ink">
                    {schritt.titel}
                  </h3>
                  <p className="mt-1 text-body-sm text-ink-muted">
                    {schritt.text}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
        <LegalCardFooter>
          Onboarding und Status-Analyse folgen im nächsten Paket
        </LegalCardFooter>
      </LegalCard>

      {/* Radar-Feed */}
      <LegalCard className="mt-6">
        <div className="flex-1 p-6">
          <div className="mb-8 flex flex-wrap items-center gap-3">
            <h2 className="text-headline text-ink">Radar-Updates</h2>
            <Badge variant="neutral">Beispieldaten</Badge>
          </div>
          <div className="grid grid-cols-1 gap-6 border-l border-line-strong pl-4 md:grid-cols-3">
            {RADAR_BEISPIELE.map((memo) => (
              <div key={memo.datum} className="relative pl-4">
                <span
                  aria-hidden="true"
                  className={`absolute -left-[22px] top-1.5 h-2 w-2 rounded-full ${
                    memo.aktiv ? "bg-ink" : "bg-dim"
                  }`}
                />
                <div className="mb-1 font-mono text-mono-sm text-ink-muted">
                  {memo.datum}
                </div>
                <h3 className="mb-2 text-body-lg font-bold text-ink">
                  {memo.titel}
                </h3>
                <p className="mb-4 text-body-sm text-ink-muted">{memo.text}</p>
                <Badge variant={memo.chip.variant}>{memo.chip.label}</Badge>
              </div>
            ))}
          </div>
        </div>
        <LegalCardFooter>
          Update-Memos erscheinen hier nach redaktioneller Freigabe
        </LegalCardFooter>
      </LegalCard>
    </>
  );
}
