"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { MessageCircleQuestion } from "lucide-react";
import { KategorieIcon } from "@/components/kategorie-icons";
import type { Erklaertiefe } from "@/lib/assistant/prompt";
import {
  schlageFrageKandidatVor,
  stelleAssistantFrage,
  type AssistantAntwort,
  type QuellenChip,
} from "./actions";

/**
 * Chat des Assistant: Verlauf nur im Client-State der laufenden Session
 * (kein Speichern darüber hinaus), Erklärtiefen-Umschalter (Standard
 * Fachlich), Beispiel-Einstiegsfragen, Quellen-Chips mit Deep-Links,
 * Disclaimer je Antwort und der Frage-Kandidaten-Baustein.
 */

export interface AssistantLabels {
  fragePlaceholder: string;
  fragen: string;
  denken: string;
  erklaertiefeLabel: string;
  tiefen: Record<Erklaertiefe, string>;
  beispielTitel: string;
  beispielFragen: string[];
  leerTitel: string;
  leerText: string;
  quellenLabel: string;
  disclaimer: string;
  previewHinweis: string;
  kandidatFrage: string;
  kandidatGrenze: string;
  kandidatCta: string;
  kandidatDanke: string;
  kandidatFehler: string;
  rateLimit: string;
  fehler: Record<string, string>;
  verbindlichkeit: Record<string, string>;
}

interface EintragNutzer {
  art: "nutzer";
  text: string;
}

interface EintragAntwort {
  art: "antwort";
  text: string;
  quellen: QuellenChip[];
  grenze: boolean;
  preview: boolean;
  /** Die Nutzerfrage, auf die sich die Antwort bezieht (Kandidaten-Baustein). */
  frage: string;
}

interface EintragHinweis {
  art: "hinweis";
  text: string;
}

type Eintrag = EintragNutzer | EintragAntwort | EintragHinweis;

const TIEFEN: Erklaertiefe[] = ["einfach", "fachlich", "rechtstext"];

export function AssistantChat({ labels }: { labels: AssistantLabels }) {
  const [eintraege, setEintraege] = useState<Eintrag[]>([]);
  const [eingabe, setEingabe] = useState("");
  const [tiefe, setTiefe] = useState<Erklaertiefe>("fachlich");
  const [laufend, setLaufend] = useState(false);
  const [vorgeschlagen, setVorgeschlagen] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const endeRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (eintraege.length > 0 || laufend) {
      endeRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
    }
  }, [eintraege, laufend]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(timer);
  }, [toast]);

  const stelleFrage = async (frageRoh: string) => {
    const frage = frageRoh.trim();
    if (!frage || laufend) return;

    // Verlauf VOR dieser Frage – nur Text, Quellen bleiben clientseitig
    const verlauf = eintraege
      .filter((e): e is EintragNutzer | EintragAntwort => e.art !== "hinweis")
      .map((e) => ({
        rolle: e.art === "nutzer" ? ("nutzer" as const) : ("assistant" as const),
        text: e.text,
      }));

    setEintraege((alt) => [...alt, { art: "nutzer", text: frage }]);
    setEingabe("");
    setLaufend(true);

    let ergebnis: AssistantAntwort;
    try {
      ergebnis = await stelleAssistantFrage({ frage, tiefe, verlauf });
    } catch {
      ergebnis = { status: "fehler", art: "unbekannt" };
    }
    setLaufend(false);

    if (ergebnis.status === "ok") {
      setEintraege((alt) => [
        ...alt,
        {
          art: "antwort",
          text: ergebnis.antwort,
          quellen: ergebnis.quellen,
          grenze: ergebnis.grenze,
          preview: ergebnis.preview,
          frage,
        },
      ]);
    } else if (ergebnis.status === "rate_limit") {
      setEintraege((alt) => [
        ...alt,
        {
          art: "hinweis",
          text: labels.rateLimit.replace("{limit}", String(ergebnis.limit)),
        },
      ]);
    } else {
      setEintraege((alt) => [
        ...alt,
        {
          art: "hinweis",
          text: labels.fehler[ergebnis.art] ?? labels.fehler.unbekannt,
        },
      ]);
    }
  };

  const schlageVor = async (frage: string) => {
    if (vorgeschlagen.has(frage)) return;
    // Optimistisch sperren – kein Doppel-Submit derselben Frage in der Session
    setVorgeschlagen((alt) => new Set(alt).add(frage));
    const { ok } = await schlageFrageKandidatVor(frage);
    if (ok) {
      setToast(labels.kandidatDanke);
    } else {
      setToast(labels.kandidatFehler);
      setVorgeschlagen((alt) => {
        const neu = new Set(alt);
        neu.delete(frage);
        return neu;
      });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Erklärtiefen-Umschalter */}
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-label uppercase text-ink-muted">
          {labels.erklaertiefeLabel}
        </span>
        <div className="flex rounded border border-line-strong" role="group">
          {TIEFEN.map((wert) => (
            <button
              key={wert}
              type="button"
              onClick={() => setTiefe(wert)}
              aria-pressed={tiefe === wert}
              className={`px-4 py-2 text-body-sm font-semibold transition-colors ${
                tiefe === wert
                  ? "bg-primary text-white"
                  : "bg-surface text-ink-muted hover:text-ink"
              }`}
            >
              {labels.tiefen[wert]}
            </button>
          ))}
        </div>
      </div>

      {/* Verlauf bzw. Leerzustand mit Beispiel-Einstiegsfragen */}
      <div className="rounded border border-line bg-canvas">
        {eintraege.length === 0 && !laufend ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <MessageCircleQuestion
              strokeWidth={1.5}
              aria-hidden="true"
              className="h-14 w-14 text-ink-muted/50"
            />
            <h2 className="mt-5 text-headline text-ink">{labels.leerTitel}</h2>
            <p className="mt-2 max-w-md text-body text-ink-muted">
              {labels.leerText}
            </p>
            <div className="mt-8 w-full max-w-xl">
              <p className="mb-3 text-label uppercase text-ink-muted">
                {labels.beispielTitel}
              </p>
              <div className="grid grid-cols-1 gap-3">
                {labels.beispielFragen.map((frage) => (
                  <button
                    key={frage}
                    type="button"
                    onClick={() => stelleFrage(frage)}
                    className="rounded border border-line bg-canvas px-4 py-3 text-left text-body-sm font-semibold text-ink transition-colors hover:border-primary hover:text-primary"
                  >
                    {frage}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <ul className="divide-y divide-line">
            {eintraege.map((eintrag, index) => (
              <li key={index} className="p-6">
                {eintrag.art === "nutzer" && (
                  <div className="flex justify-end">
                    <p className="max-w-[85%] whitespace-pre-line rounded border border-primary/30 bg-primary/5 px-4 py-3 text-body text-ink">
                      {eintrag.text}
                    </p>
                  </div>
                )}

                {eintrag.art === "hinweis" && (
                  <p className="rounded border border-gold bg-gold/10 px-4 py-3 text-body-sm text-gold-ink">
                    {eintrag.text}
                  </p>
                )}

                {eintrag.art === "antwort" && (
                  <div className="max-w-[92%]">
                    {eintrag.preview && (
                      <p className="mb-3 inline-block rounded border border-gold bg-gold/10 px-2 py-1 text-label uppercase text-gold-ink">
                        {labels.previewHinweis}
                      </p>
                    )}
                    <div className="whitespace-pre-line text-body text-ink">
                      {eintrag.text}
                    </div>

                    {eintrag.quellen.length > 0 && (
                      <div className="mt-5">
                        <p className="text-label uppercase text-ink-muted">
                          {labels.quellenLabel}
                        </p>
                        <p className="mt-2 flex flex-wrap gap-2">
                          {eintrag.quellen.map((quelle) => (
                            <Link
                              key={`${quelle.typ}:${quelle.code}`}
                              href={quelle.url}
                              title={
                                labels.verbindlichkeit[quelle.verbindlichkeit] ??
                                quelle.verbindlichkeit
                              }
                              className="inline-flex items-center gap-1.5 rounded border border-legal-tint bg-legal-tint px-2 py-1 text-label font-medium text-legal transition-colors hover:bg-chip-hover"
                            >
                              <KategorieIcon kategorie={quelle.kategorie} />
                              <span className="font-mono">{quelle.code}</span>
                              <span className="max-w-[22ch] truncate font-sans normal-case">
                                {quelle.titel}
                              </span>
                            </Link>
                          ))}
                        </p>
                      </div>
                    )}

                    {/* Frage-Kandidat: anonymisiert zur Redaktion */}
                    <div className="mt-5 flex flex-wrap items-center gap-3 rounded border border-line bg-surface px-4 py-3">
                      <p className="text-body-sm text-ink-muted">
                        {eintrag.grenze
                          ? labels.kandidatGrenze
                          : labels.kandidatFrage}
                      </p>
                      <button
                        type="button"
                        onClick={() => schlageVor(eintrag.frage)}
                        disabled={vorgeschlagen.has(eintrag.frage)}
                        className="rounded border border-primary px-3 py-1.5 text-label uppercase text-primary transition-colors hover:bg-primary/5 disabled:cursor-default disabled:border-line-strong disabled:text-ink-muted"
                      >
                        {vorgeschlagen.has(eintrag.frage)
                          ? labels.kandidatDanke
                          : labels.kandidatCta}
                      </button>
                    </div>

                    <p className="mt-4 border-t border-line pt-3 font-mono text-mono-sm uppercase text-legal">
                      {labels.disclaimer}
                    </p>
                  </div>
                )}
              </li>
            ))}
            {laufend && (
              <li className="p-6">
                <p className="text-body-sm text-ink-muted">{labels.denken}</p>
              </li>
            )}
          </ul>
        )}
        <div ref={endeRef} />
      </div>

      {/* Eingabe */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          stelleFrage(eingabe);
        }}
        className="flex flex-col gap-4 rounded border border-line bg-canvas p-6 sm:flex-row sm:items-center"
      >
        <input
          type="text"
          value={eingabe}
          onChange={(e) => setEingabe(e.target.value)}
          maxLength={1000}
          placeholder={labels.fragePlaceholder}
          aria-label={labels.fragePlaceholder}
          className="w-full rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
        />
        <button
          type="submit"
          disabled={laufend || eingabe.trim().length < 3}
          className="inline-flex shrink-0 items-center justify-center rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {labels.fragen}
        </button>
      </form>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded border border-primary bg-canvas px-4 py-3 text-body-sm font-semibold text-primary shadow-none"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
