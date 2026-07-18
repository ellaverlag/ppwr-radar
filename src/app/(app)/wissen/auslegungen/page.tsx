import type { Metadata } from "next";
import { Badge } from "@/components/badge";
import { SearchIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { LegalCard } from "@/components/ui";
import {
  formatDate,
  KATEGORIE_LABELS,
  VERBINDLICHKEIT_LABELS,
} from "@/lib/labels";
import { getAuslegungen } from "@/lib/wissensbasis";
import { WissenTabs } from "../tabs";

export const metadata: Metadata = {
  title: "Auslegungen – PPWR Radar",
};

export const dynamic = "force-dynamic";

export default async function AuslegungenPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const auslegungen = await getAuslegungen(q);

  return (
    <>
      <PageHeader
        title="Wissen"
        description="Auslegungsfragen zur PPWR – konkrete Antworten auf häufige Zweifelsfälle aus der Praxis."
      />
      <WissenTabs />

      <form method="get" className="mb-10">
        <label htmlFor="q" className="sr-only">
          Auslegungen durchsuchen
        </label>
        <div className="flex max-w-xl gap-3">
          <div className="relative w-full">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q ?? ""}
              placeholder="Frage oder Stichwort suchen …"
              className="w-full rounded border border-line-strong bg-canvas py-3 pl-11 pr-4 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="shrink-0 rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          >
            Suchen
          </button>
        </div>
      </form>

      {auslegungen.length === 0 ? (
        <LegalCard>
          <p className="p-6 text-body text-ink-muted">
            {q
              ? `Keine Auslegungen zu „${q}“ gefunden.`
              : "Aktuell sind keine freigegebenen Auslegungen verfügbar."}
          </p>
        </LegalCard>
      ) : (
        <div className="space-y-4">
          {auslegungen.map((a) => (
            <details
              key={a.id}
              className="group rounded border border-line bg-canvas"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 [&::-webkit-details-marker]:hidden">
                <span className="text-body-lg font-semibold text-ink">
                  {a.nr != null && (
                    <span className="mr-2 font-mono text-mono-sm font-normal text-ink-muted">
                      #{String(a.nr).padStart(2, "0")}
                    </span>
                  )}
                  {a.frage}
                </span>
                <span
                  aria-hidden="true"
                  className="mt-1 shrink-0 text-ink-muted transition-transform group-open:rotate-180"
                >
                  ▾
                </span>
              </summary>
              <div className="border-t border-line px-6 py-5">
                <p className="whitespace-pre-line text-body text-ink">
                  {a.antwort}
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-2">
                  <Badge variant="green">{KATEGORIE_LABELS[a.kategorie]}</Badge>
                  <Badge
                    variant={
                      a.verbindlichkeit === "rechtsverbindlich"
                        ? "blue"
                        : "neutral"
                    }
                  >
                    {VERBINDLICHKEIT_LABELS[a.verbindlichkeit]}
                  </Badge>
                </div>
              </div>
              <div className="border-t border-line px-6 py-4 font-mono text-mono-sm uppercase text-legal">
                {a.quellen.length > 0
                  ? `${a.quellen.join(" · ")} · Stand ${formatDate(a.rechtsstand)}`
                  : `Stand ${formatDate(a.rechtsstand)}`}
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
