import type { Metadata } from "next";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { LegalCard, LegalCardFooter } from "@/components/ui";

export const metadata: Metadata = {
  title: "Assistant – PPWR Radar",
};

const ERKLAERTIEFEN = ["Einfach erklärt", "Fachlich", "Rechtstext"];

export default function AssistantPage() {
  return (
    <>
      <PageHeader
        title="Wie kann ich Ihnen helfen?"
        description="Stellen Sie rechtliche Fragen zur EU-Verpackungsverordnung (PPWR)."
      />

      <LegalCard>
        <div className="flex flex-col gap-4 p-6 sm:flex-row sm:items-center">
          <input
            type="text"
            disabled
            placeholder="Ihre Frage zur PPWR …"
            className="w-full rounded border border-line-strong bg-surface px-4 py-3 text-body text-ink placeholder:text-ink-muted/60"
          />
          <span className="inline-flex shrink-0 cursor-not-allowed items-center justify-center rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white opacity-60">
            Fragen
          </span>
        </div>
      </LegalCard>

      <LegalCard className="mt-6">
        <div className="flex flex-wrap items-center justify-between gap-4 border-b border-line p-4">
          <div className="flex rounded border border-line-strong">
            {ERKLAERTIEFEN.map((tiefe, i) => (
              <span
                key={tiefe}
                className={`px-4 py-2 text-body-sm font-semibold ${
                  i === 1
                    ? "bg-primary text-white"
                    : "bg-surface text-ink-muted"
                }`}
              >
                {tiefe}
              </span>
            ))}
          </div>
          <Badge variant="neutral">Beispielansicht</Badge>
        </div>
        <div className="p-6 md:p-10">
          <h2 className="border-b border-ink pb-3 text-headline text-ink">
            Kennzeichnungspflichten für Kunststoffvliese
          </h2>
          <p className="mt-6 text-body text-ink">
            So wird eine Antwort des Assistant aufgebaut sein: eine fachliche
            Einordnung mit Rechtsstand, gegliederte Pflichten und ein Hinweis
            auf Grenzen der Auslegung.
          </p>
          <ol className="mt-8 space-y-6 border-l border-line-strong pl-6">
            <li>
              <h3 className="text-label uppercase text-ink">
                01 · Materialidentifikation
              </h3>
              <p className="mt-1 text-body-sm text-ink-muted">
                Gliederungspunkte nennen die konkrete Pflicht mit Fundstelle.
              </p>
            </li>
            <li>
              <h3 className="text-label uppercase text-ink">
                02 · Hinweise zur Entsorgung
              </h3>
              <p className="mt-1 text-body-sm text-ink-muted">
                Jede Antwort trennt Pflichten, Fristen und Empfehlungen.
              </p>
            </li>
          </ol>
          <div className="mt-8 border-l-4 border-gold bg-surface p-4">
            <p className="text-body-sm text-ink">
              <span className="font-bold">Wichtiger Hinweis:</span> Antworten
              sind redaktionell geprüfte Auslegungen und keine Rechtsberatung.
            </p>
          </div>
        </div>
        <LegalCardFooter>
          Beispielansicht · Der Assistant folgt in einem späteren Paket
        </LegalCardFooter>
      </LegalCard>
    </>
  );
}
