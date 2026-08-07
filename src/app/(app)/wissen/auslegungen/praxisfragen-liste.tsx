"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/badge";
import { SearchIcon } from "@/components/icons";
import { formatDate } from "@/lib/labels";
import { anforderungUrl } from "@/lib/wissen-links";
import type { Kategorie, Verbindlichkeit } from "@/lib/wissensbasis";

/**
 * Praxisfragen als verdichtete Accordion-Liste: nur die Fragen sichtbar,
 * genau eine offen, Live-Suche und Kategorie-Chips, Deep-Link je Frage
 * über #code (z. B. /wissen/auslegungen#A01) – so können Assistant und
 * Dossiers direkt auf eine Frage verlinken.
 */

export interface PraxisFrage {
  id: string;
  code: string | null;
  rechtsstand: string;
  frage: string;
  antwort: string;
  kategorie: Kategorie;
  quellen: string[];
  verbindlichkeit: Verbindlichkeit;
  verwandte: { id: string; nr: number | null; titel: string }[];
}

export interface PraxisLabels {
  rechtsstand: string;
  meistgelesen: string;
  suchPlaceholder: string;
  suchLabel: string;
  alleChip: string;
  kategorien: Record<string, string>;
  verbindlichkeit: Record<string, string>;
  fundstellen: string;
  verwandte: string;
  keineTreffer: string;
}

const KATEGORIE_REIHENFOLGE: Kategorie[] = [
  "rollen_epr",
  "stoffrecht",
  "mehrweg",
  "kennzeichnung",
  "konformitaet",
  "verbote",
  "sonstiges",
];

/** Anker = Code; Fallback auf die interne ID, damit jede Frage ein Ziel hat. */
const anker = (frage: PraxisFrage) => frage.code ?? frage.id;

export function PraxisfragenListe({
  fragen,
  kuratiert,
  labels,
}: {
  fragen: PraxisFrage[];
  /** Codes der kuratierten Einstiege („Meistgelesen“-Platzhalter). */
  kuratiert: string[];
  labels: PraxisLabels;
}) {
  const [suche, setSuche] = useState("");
  const [kategorie, setKategorie] = useState<Kategorie | null>(null);
  const [offen, setOffen] = useState<string | null>(null);
  const listeRef = useRef<HTMLDivElement>(null);

  // Deep-Link beim Laden: #A01 öffnet und scrollt zur Frage
  useEffect(() => {
    const code = decodeURIComponent(window.location.hash.slice(1));
    if (!code || !fragen.some((f) => anker(f) === code)) return;
    const frame = requestAnimationFrame(() => {
      setOffen(code);
      document.getElementById(code)?.scrollIntoView({ block: "start" });
    });
    return () => cancelAnimationFrame(frame);
  }, [fragen]);

  const oeffne = (frage: PraxisFrage) => {
    const ziel = anker(frage);
    const neu = offen === ziel ? null : ziel;
    setOffen(neu);
    history.replaceState(null, "", neu ? `#${ziel}` : window.location.pathname);
  };

  const springeZu = (frage: PraxisFrage) => {
    setSuche("");
    setKategorie(null);
    setOffen(anker(frage));
    history.replaceState(null, "", `#${anker(frage)}`);
    requestAnimationFrame(() => {
      document.getElementById(anker(frage))?.scrollIntoView({ block: "start" });
    });
  };

  const kuratierteFragen = useMemo(
    () =>
      kuratiert
        .map((code) => fragen.find((f) => f.code === code))
        .filter((f): f is PraxisFrage => Boolean(f)),
    [fragen, kuratiert]
  );

  const gefiltert = useMemo(() => {
    const begriff = suche.trim().toLowerCase();
    return fragen.filter((f) => {
      if (kategorie && f.kategorie !== kategorie) return false;
      if (!begriff) return true;
      return `${f.frage} ${f.antwort}`.toLowerCase().includes(begriff);
    });
  }, [fragen, suche, kategorie]);

  const chipKlasse = (aktiv: boolean) =>
    `rounded border px-3 py-1.5 text-body-sm font-semibold transition-colors ${
      aktiv
        ? "border-primary bg-primary text-white"
        : "border-line-strong bg-canvas text-ink-muted hover:border-primary hover:text-primary"
    }`;

  return (
    <div ref={listeRef}>
      {/* Kuratierte Einstiege */}
      {kuratierteFragen.length > 0 && (
        <div className="mb-8">
          <p className="mb-3 text-label uppercase text-ink-muted">
            {labels.meistgelesen}
          </p>
          <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
            {kuratierteFragen.map((frage) => (
              <button
                key={frage.id}
                type="button"
                onClick={() => springeZu(frage)}
                className="rounded border border-line bg-canvas p-4 text-left text-body-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
              >
                {frage.frage}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Live-Suche + Kategorie-Chips */}
      <div className="mb-8 space-y-4">
        <div className="relative max-w-xl">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
          <input
            type="search"
            value={suche}
            onChange={(e) => setSuche(e.target.value)}
            placeholder={labels.suchPlaceholder}
            aria-label={labels.suchLabel}
            className="w-full rounded border border-line-strong bg-canvas py-3 pl-11 pr-4 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => setKategorie(null)}
            className={chipKlasse(kategorie === null)}
          >
            {labels.alleChip}
          </button>
          {KATEGORIE_REIHENFOLGE.map((wert) => (
            <button
              key={wert}
              type="button"
              onClick={() => setKategorie(kategorie === wert ? null : wert)}
              className={chipKlasse(kategorie === wert)}
            >
              {labels.kategorien[wert] ?? wert}
            </button>
          ))}
        </div>
      </div>

      {/* Accordion – genau eine Frage offen */}
      {gefiltert.length === 0 ? (
        <div className="rounded border border-line bg-canvas p-6">
          <p className="text-body text-ink-muted">{labels.keineTreffer}</p>
        </div>
      ) : (
        <div className="rounded border border-line bg-canvas">
          <ul className="divide-y divide-line">
            {gefiltert.map((frage) => {
              const ziel = anker(frage);
              const istOffen = offen === ziel;
              return (
                <li key={frage.id} id={ziel} className="scroll-mt-24">
                  <button
                    type="button"
                    onClick={() => oeffne(frage)}
                    aria-expanded={istOffen}
                    aria-controls={`panel-${ziel}`}
                    className="flex w-full items-start justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-surface"
                  >
                    <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                      <Badge variant="green">
                        {labels.kategorien[frage.kategorie] ?? frage.kategorie}
                      </Badge>
                      <span className="text-body font-semibold text-ink">
                        {frage.frage}
                      </span>
                      <span className="text-label uppercase text-ink-muted">
                        {labels.verbindlichkeit[frage.verbindlichkeit] ??
                          frage.verbindlichkeit}
                      </span>
                    </span>
                    <span
                      aria-hidden="true"
                      className={`mt-1 shrink-0 text-ink-muted transition-transform ${
                        istOffen ? "rotate-180" : ""
                      }`}
                    >
                      ▾
                    </span>
                  </button>

                  {istOffen && (
                    <div
                      id={`panel-${ziel}`}
                      className="border-t border-line-strong bg-surface px-6 py-5"
                    >
                      <p className="max-w-[80ch] whitespace-pre-line text-body text-ink">
                        {frage.antwort}
                      </p>
                      {frage.quellen.length > 0 && (
                        <div className="mt-5">
                          <p className="text-label uppercase text-ink-muted">
                            {labels.fundstellen}
                          </p>
                          <p className="mt-2 flex flex-wrap gap-2">
                            {frage.quellen.map((quelle) => (
                              <span
                                key={quelle}
                                className="rounded border border-legal-tint bg-legal-tint px-2 py-0.5 font-mono text-label font-medium text-legal"
                              >
                                {quelle}
                              </span>
                            ))}
                          </p>
                        </div>
                      )}
                      <p className="mt-5 font-mono text-mono-sm uppercase text-ink-muted">
                        {labels.rechtsstand} {formatDate(frage.rechtsstand)}
                      </p>
                      {frage.verwandte.length > 0 && (
                        <div className="mt-5">
                          <p className="text-label uppercase text-ink-muted">
                            {labels.verwandte}
                          </p>
                          <ul className="mt-2 space-y-1">
                            {frage.verwandte.map((anforderung) => (
                              <li key={anforderung.id}>
                                <Link
                                  href={anforderungUrl(anforderung.id)}
                                  className="text-body-sm font-medium text-legal hover:underline"
                                >
                                  {anforderung.nr != null && (
                                    <span className="mr-1.5 font-mono text-mono-sm">
                                      #{String(anforderung.nr).padStart(2, "0")}
                                    </span>
                                  )}
                                  {anforderung.titel}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}
