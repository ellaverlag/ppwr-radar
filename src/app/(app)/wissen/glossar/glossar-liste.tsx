"use client";

import Link from "next/link";
import { useState } from "react";
import { Badge } from "@/components/badge";
import type { GlossarEintrag } from "@/lib/glossar";

/**
 * Einheitliche Aufklappliste über alle Glossar-Typen (Begriffe,
 * Anforderungen, Praxisfragen, Verpackungen & Materialien) – genau ein
 * Eintrag zugleich offen. Zeile: Begriff + Typ-Chip + erste Zeile der
 * Kurzerklärung gedimmt; aufgeklappt: volle Inhalte und Verweis-Chips.
 */

export interface GlossarLabels {
  typBadge: Record<string, string>;
  betrifftMich: string;
  betrifftMichTitle: string;
  zurAnforderung: string;
  zurAntwort: string;
}

export function GlossarListe({
  gruppen,
  labels,
}: {
  gruppen: { buchstabe: string; eintraege: GlossarEintrag[] }[];
  labels: GlossarLabels;
}) {
  const [offen, setOffen] = useState<string | null>(null);

  return (
    <div className="space-y-10">
      {gruppen.map((gruppe) => (
        <section key={gruppe.buchstabe}>
          <h2 className="mb-3 text-headline text-primary">
            {gruppe.buchstabe}
          </h2>
          <div className="rounded border border-line bg-canvas">
            <ul className="divide-y divide-line">
              {gruppe.eintraege.map((eintrag) => {
                const istOffen = offen === eintrag.id;
                return (
                  <li key={eintrag.id}>
                    <button
                      type="button"
                      onClick={() => setOffen(istOffen ? null : eintrag.id)}
                      aria-expanded={istOffen}
                      className="flex w-full items-start justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-surface"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                          <span className="text-body-lg font-bold text-ink">
                            {eintrag.begriff}
                          </span>
                          <Badge variant="neutral">
                            {labels.typBadge[eintrag.typ] ?? eintrag.typ}
                          </Badge>
                          {eintrag.betrifft_mich && (
                            <span
                              title={labels.betrifftMichTitle}
                              className="inline-flex items-center gap-1.5 text-label uppercase text-primary"
                            >
                              <span
                                aria-hidden="true"
                                className="h-2 w-2 rounded-full bg-primary"
                              />
                              {labels.betrifftMich}
                            </span>
                          )}
                        </span>
                        {!istOffen && eintrag.kurztext && (
                          <span className="mt-1 block truncate text-body-sm text-ink-muted">
                            {eintrag.kurztext}
                          </span>
                        )}
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
                      <div className="border-t border-line-strong bg-surface px-6 py-5">
                        {eintrag.begriff_en && (
                          <p className="mb-2 text-body-sm italic text-ink-muted">
                            EN: {eintrag.begriff_en}
                          </p>
                        )}
                        {/* Praxisfrage: volle Frage über der Antwort */}
                        {eintrag.frageVoll &&
                          eintrag.frageVoll !== eintrag.begriff && (
                            <p className="mb-2 text-body font-semibold text-ink">
                              {eintrag.frageVoll}
                            </p>
                          )}
                        {eintrag.antwort ? (
                          <p className="max-w-[80ch] whitespace-pre-line text-body text-ink">
                            {eintrag.antwort}
                          </p>
                        ) : (
                          eintrag.kurztext && (
                            <p className="max-w-[80ch] text-body text-ink">
                              {eintrag.kurztext}
                            </p>
                          )
                        )}
                        {eintrag.merkmale && (
                          <p className="mt-2 font-mono text-mono-sm text-ink-muted">
                            {eintrag.merkmale}
                          </p>
                        )}
                        {(eintrag.quelle ||
                          (eintrag.verweisChips?.length ?? 0) > 0 ||
                          eintrag.href) && (
                          <p className="mt-4 flex flex-wrap items-center gap-2">
                            {eintrag.quelle && (
                              <span className="rounded border border-legal-tint bg-legal-tint px-2 py-0.5 font-mono text-label font-medium text-legal">
                                {eintrag.quelle}
                              </span>
                            )}
                            {eintrag.verweisChips?.map((chip) => (
                              <Link
                                key={`${chip.href}-${chip.label}`}
                                href={chip.href}
                                className="rounded border border-legal px-2 py-0.5 font-mono text-label font-medium text-legal transition-colors hover:bg-chip-hover"
                              >
                                {chip.label}
                              </Link>
                            ))}
                            {eintrag.href && (
                              <Link
                                href={eintrag.href}
                                className="text-body-sm font-medium text-legal hover:underline"
                              >
                                {eintrag.typ === "anforderung"
                                  ? labels.zurAnforderung
                                  : labels.zurAntwort}
                              </Link>
                            )}
                          </p>
                        )}
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </section>
      ))}
    </div>
  );
}
