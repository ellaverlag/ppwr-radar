import type { Metadata } from "next";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
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

      <form method="get" className="mb-8">
        <label htmlFor="q" className="sr-only">
          Auslegungen durchsuchen
        </label>
        <div className="flex max-w-lg gap-2">
          <input
            id="q"
            name="q"
            type="search"
            defaultValue={q ?? ""}
            placeholder="Frage oder Stichwort suchen …"
            className="w-full rounded-lg border border-neutral-300 px-3.5 py-2.5 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
          />
          <button
            type="submit"
            className="shrink-0 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-dark"
          >
            Suchen
          </button>
        </div>
      </form>

      {auslegungen.length === 0 ? (
        <p className="text-sm text-neutral-500">
          {q
            ? `Keine Auslegungen zu „${q}" gefunden.`
            : "Aktuell sind keine freigegebenen Auslegungen verfügbar."}
        </p>
      ) : (
        <div className="space-y-4">
          {auslegungen.map((a) => (
            <details
              key={a.id}
              className="group rounded-xl border border-neutral-200 bg-white open:shadow-sm"
            >
              <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-5 py-4 [&::-webkit-details-marker]:hidden">
                <span className="text-sm font-medium leading-relaxed text-neutral-900">
                  {a.frage}
                </span>
                <span className="mt-0.5 shrink-0 text-neutral-400 transition-transform group-open:rotate-180">
                  ▾
                </span>
              </summary>
              <div className="border-t border-neutral-100 px-5 py-4">
                <p className="whitespace-pre-line text-sm leading-relaxed text-neutral-700">
                  {a.antwort}
                </p>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <Badge variant="accent">{KATEGORIE_LABELS[a.kategorie]}</Badge>
                  <Badge
                    variant={
                      a.verbindlichkeit === "rechtsverbindlich" ? "green" : "amber"
                    }
                  >
                    {VERBINDLICHKEIT_LABELS[a.verbindlichkeit]}
                  </Badge>
                  <Badge variant="neutral">
                    Rechtsstand {formatDate(a.rechtsstand)}
                  </Badge>
                </div>
                {a.quellen.length > 0 && (
                  <p className="mt-3 text-xs text-neutral-500">
                    Quellen: {a.quellen.join("; ")}
                  </p>
                )}
              </div>
            </details>
          ))}
        </div>
      )}
    </>
  );
}
