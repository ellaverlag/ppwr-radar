"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { Bookmark, Download, History, MessageCircleQuestion } from "lucide-react";
import { KategorieIcon } from "@/components/kategorie-icons";
import type { Erklaertiefe } from "@/lib/assistant/prompt";
import { AntwortMarkdown } from "./antwort-markdown";
import {
  merkeAntwort,
  schlageFrageKandidatVor,
  stelleAssistantFrage,
  type AssistantAntwort,
  type QuellenChip,
} from "./actions";

/**
 * Fokussierte Assistant-Ansicht: gezeigt wird genau EINE Frage-Antwort;
 * jede neue Frage öffnet eine frische Ansicht, die vorige Antwort wandert
 * automatisch in den Verlauf („Meine Fragen“, own-row in assistant_verlauf).
 * Dazu: Erklärtiefen, Kontext-Umschalter je Produktlinie, Markdown-
 * Rendering, PDF-Export und Merken – auch aus dem Verlauf heraus.
 */

export interface VerlaufEintrag {
  /** null = Antwort konnte nicht gespeichert werden (kein Profil). */
  id: string | null;
  frage: string;
  antwort: string;
  tiefe: Erklaertiefe;
  quellen: QuellenChip[];
  grenze: boolean;
  preview: boolean;
  rechtsstand: string;
  gemerkt: boolean;
  produktlinieKontext: string | null;
  createdAt: string;
}

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
  kontextLabel: string;
  kontextAlle: string;
  verlaufTab: string;
  verlaufLeer: string;
  ausVerlauf: string;
  neueFrage: string;
  merken: string;
  gemerkt: string;
  pdfButton: string;
  pdfFehler: string;
}

type Ansicht =
  | { typ: "eingabe" }
  | { typ: "laedt"; frage: string }
  | { typ: "antwort"; eintrag: VerlaufEintrag; ausVerlauf: boolean }
  | { typ: "verlauf" };

const TIEFEN: Erklaertiefe[] = ["einfach", "fachlich", "rechtstext"];

const datumKurz = (iso: string) =>
  new Date(iso).toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });

export function AssistantChat({
  labels,
  linien,
  initialVerlauf,
}: {
  labels: AssistantLabels;
  /** Namen der aktiven Produktlinien (für den Kontext-Umschalter). */
  linien: string[];
  initialVerlauf: VerlaufEintrag[];
}) {
  const [ansicht, setAnsicht] = useState<Ansicht>({ typ: "eingabe" });
  const [verlauf, setVerlauf] = useState<VerlaufEintrag[]>(initialVerlauf);
  const [eingabe, setEingabe] = useState("");
  const [tiefe, setTiefe] = useState<Erklaertiefe>("fachlich");
  const [kontext, setKontext] = useState<string | null>(null);
  const [hinweis, setHinweis] = useState<string | null>(null);
  const [vorgeschlagen, setVorgeschlagen] = useState<Set<string>>(new Set());
  const [toast, setToast] = useState<string | null>(null);
  const eingabeRef = useRef<HTMLInputElement>(null);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const zeigeToast = (text: string) => {
    setToast(text);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(null), 4000);
  };

  const laufend = ansicht.typ === "laedt";

  const stelleFrage = async (frageRoh: string) => {
    const frage = frageRoh.trim();
    if (!frage || laufend) return;

    setHinweis(null);
    setAnsicht({ typ: "laedt", frage });
    setEingabe("");

    let ergebnis: AssistantAntwort;
    try {
      ergebnis = await stelleAssistantFrage({
        frage,
        tiefe,
        kontextLinie: kontext,
      });
    } catch {
      ergebnis = { status: "fehler", art: "unbekannt" };
    }

    if (ergebnis.status === "ok") {
      const eintrag: VerlaufEintrag = {
        id: ergebnis.verlaufId,
        frage,
        antwort: ergebnis.antwort,
        tiefe,
        quellen: ergebnis.quellen,
        grenze: ergebnis.grenze,
        preview: ergebnis.preview,
        rechtsstand: ergebnis.rechtsstand,
        gemerkt: false,
        produktlinieKontext: kontext,
        createdAt: ergebnis.createdAt,
      };
      setVerlauf((alt) => [eintrag, ...alt]);
      setAnsicht({ typ: "antwort", eintrag, ausVerlauf: false });
    } else {
      setHinweis(
        ergebnis.status === "rate_limit"
          ? labels.rateLimit.replace("{limit}", String(ergebnis.limit))
          : (labels.fehler[ergebnis.art] ?? labels.fehler.unbekannt)
      );
      setAnsicht({ typ: "eingabe" });
    }
  };

  const neueFrage = () => {
    setAnsicht({ typ: "eingabe" });
    setHinweis(null);
    requestAnimationFrame(() => eingabeRef.current?.focus());
  };

  const oeffneVerlaufEintrag = (eintrag: VerlaufEintrag) => {
    setAnsicht({ typ: "antwort", eintrag, ausVerlauf: true });
  };

  const toggleMerken = async (eintrag: VerlaufEintrag) => {
    if (!eintrag.id) return;
    const neu = !eintrag.gemerkt;
    const patch = (e: VerlaufEintrag) =>
      e.id === eintrag.id ? { ...e, gemerkt: neu } : e;
    setVerlauf((alt) => alt.map(patch));
    setAnsicht((alt) =>
      alt.typ === "antwort" ? { ...alt, eintrag: patch(alt.eintrag) } : alt
    );
    const { ok } = await merkeAntwort(eintrag.id, neu);
    if (!ok) {
      const zurueck = (e: VerlaufEintrag) =>
        e.id === eintrag.id ? { ...e, gemerkt: !neu } : e;
      setVerlauf((alt) => alt.map(zurueck));
      setAnsicht((alt) =>
        alt.typ === "antwort" ? { ...alt, eintrag: zurueck(alt.eintrag) } : alt
      );
    }
  };

  const ladePdf = async (eintrag: VerlaufEintrag) => {
    try {
      const antwort = await fetch("/assistant/pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          frage: eintrag.frage,
          antwortMarkdown: eintrag.antwort,
          tiefe: eintrag.tiefe,
          quellen: eintrag.quellen.map((q) => ({
            code: q.code,
            titel: q.titel,
            fundstellen: q.fundstellen,
          })),
          rechtsstand: eintrag.rechtsstand,
          preview: eintrag.preview,
        }),
      });
      if (!antwort.ok) throw new Error(String(antwort.status));
      const blob = await antwort.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `PPWR-Radar-Antwort_${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      zeigeToast(labels.pdfFehler);
    }
  };

  const schlageVor = async (frage: string) => {
    if (vorgeschlagen.has(frage)) return;
    setVorgeschlagen((alt) => new Set(alt).add(frage));
    const { ok } = await schlageFrageKandidatVor(frage);
    if (ok) {
      zeigeToast(labels.kandidatDanke);
    } else {
      zeigeToast(labels.kandidatFehler);
      setVorgeschlagen((alt) => {
        const neu = new Set(alt);
        neu.delete(frage);
        return neu;
      });
    }
  };

  // Gemerkte zuerst, darin jeweils neueste oben
  const sortierterVerlauf = [...verlauf].sort((a, b) => {
    if (a.gemerkt !== b.gemerkt) return a.gemerkt ? -1 : 1;
    return a.createdAt < b.createdAt ? 1 : -1;
  });

  const knopfKlasse =
    "inline-flex items-center gap-1.5 rounded border border-line-strong px-3 py-1.5 text-label uppercase text-ink-muted transition-colors hover:border-primary hover:text-primary";

  return (
    <div className="flex flex-col gap-6">
      {/* Kopfzeile: Erklärtiefe + Verlaufs-Tab */}
      <div className="flex flex-wrap items-center justify-between gap-3">
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
        <button
          type="button"
          onClick={() =>
            setAnsicht(
              ansicht.typ === "verlauf" ? { typ: "eingabe" } : { typ: "verlauf" }
            )
          }
          aria-pressed={ansicht.typ === "verlauf"}
          className={`inline-flex items-center gap-2 rounded border px-4 py-2 text-body-sm font-semibold transition-colors ${
            ansicht.typ === "verlauf"
              ? "border-primary bg-primary text-white"
              : "border-line-strong bg-surface text-ink-muted hover:text-ink"
          }`}
        >
          <History strokeWidth={2} aria-hidden="true" className="h-3.5 w-3.5" />
          {labels.verlaufTab} ({verlauf.length})
        </button>
      </div>

      {hinweis && (
        <p className="rounded border border-gold bg-gold/10 px-4 py-3 text-body-sm text-gold-ink">
          {hinweis}
        </p>
      )}

      {/* Hauptfläche */}
      <div className="rounded border border-line bg-canvas">
        {ansicht.typ === "eingabe" && (
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
        )}

        {ansicht.typ === "laedt" && (
          <div className="p-6">
            <p className="rounded border border-primary/30 bg-primary/5 px-4 py-3 text-body text-ink">
              {ansicht.frage}
            </p>
            <p className="mt-5 text-body-sm text-ink-muted">{labels.denken}</p>
          </div>
        )}

        {ansicht.typ === "antwort" && (
          <div className="p-6">
            {/* Meta: Herkunft, Datum, Kontext, Tiefe */}
            <div className="mb-4 flex flex-wrap items-center gap-2 text-label uppercase text-ink-muted">
              {ansicht.ausVerlauf && (
                <span className="rounded border border-line-strong px-2 py-0.5">
                  {labels.ausVerlauf}
                </span>
              )}
              <span>{datumKurz(ansicht.eintrag.createdAt)}</span>
              <span>· {labels.tiefen[ansicht.eintrag.tiefe]}</span>
              {ansicht.eintrag.produktlinieKontext && (
                <span className="rounded border border-primary px-2 py-0.5 normal-case text-primary">
                  {labels.kontextLabel}: {ansicht.eintrag.produktlinieKontext}
                </span>
              )}
              {ansicht.eintrag.gemerkt && (
                <span className="inline-flex items-center gap-1 rounded border border-gold bg-gold/10 px-2 py-0.5 text-gold-ink">
                  <Bookmark
                    strokeWidth={2}
                    aria-hidden="true"
                    className="h-3 w-3"
                  />
                  {labels.gemerkt}
                </span>
              )}
            </div>

            <p className="mb-5 rounded border border-primary/30 bg-primary/5 px-4 py-3 text-body font-semibold text-ink">
              {ansicht.eintrag.frage}
            </p>

            {ansicht.eintrag.preview && (
              <p className="mb-4 inline-block rounded border border-gold bg-gold/10 px-2 py-1 text-label uppercase text-gold-ink">
                {labels.previewHinweis}
              </p>
            )}

            <AntwortMarkdown markdown={ansicht.eintrag.antwort} />

            {ansicht.eintrag.quellen.length > 0 && (
              <div className="mt-6">
                <p className="text-label uppercase text-ink-muted">
                  {labels.quellenLabel}
                </p>
                <p className="mt-2 flex flex-wrap gap-2">
                  {ansicht.eintrag.quellen.map((quelle) => (
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

            {/* Aktionen: PDF, Merken, neue Frage */}
            <div className="mt-6 flex flex-wrap items-center gap-2.5">
              <button
                type="button"
                onClick={() => ladePdf(ansicht.eintrag)}
                className={knopfKlasse}
              >
                <Download
                  strokeWidth={2}
                  aria-hidden="true"
                  className="h-3.5 w-3.5"
                />
                {labels.pdfButton}
              </button>
              {ansicht.eintrag.id && (
                <button
                  type="button"
                  onClick={() => toggleMerken(ansicht.eintrag)}
                  aria-pressed={ansicht.eintrag.gemerkt}
                  className={
                    ansicht.eintrag.gemerkt
                      ? "inline-flex items-center gap-1.5 rounded border border-gold bg-gold/10 px-3 py-1.5 text-label uppercase text-gold-ink"
                      : knopfKlasse
                  }
                >
                  <Bookmark
                    strokeWidth={2}
                    aria-hidden="true"
                    className="h-3.5 w-3.5"
                  />
                  {ansicht.eintrag.gemerkt ? labels.gemerkt : labels.merken}
                </button>
              )}
              <button type="button" onClick={neueFrage} className={knopfKlasse}>
                {labels.neueFrage}
              </button>
            </div>

            {/* Frage-Kandidat: anonymisiert zur Redaktion */}
            <div className="mt-5 flex flex-wrap items-center gap-3 rounded border border-line bg-surface px-4 py-3">
              <p className="text-body-sm text-ink-muted">
                {ansicht.eintrag.grenze
                  ? labels.kandidatGrenze
                  : labels.kandidatFrage}
              </p>
              <button
                type="button"
                onClick={() => schlageVor(ansicht.eintrag.frage)}
                disabled={vorgeschlagen.has(ansicht.eintrag.frage)}
                className="rounded border border-primary px-3 py-1.5 text-label uppercase text-primary transition-colors hover:bg-primary/5 disabled:cursor-default disabled:border-line-strong disabled:text-ink-muted"
              >
                {vorgeschlagen.has(ansicht.eintrag.frage)
                  ? labels.kandidatDanke
                  : labels.kandidatCta}
              </button>
            </div>

            <p className="mt-4 border-t border-line pt-3 font-mono text-mono-sm uppercase text-legal">
              {labels.disclaimer}
            </p>
          </div>
        )}

        {ansicht.typ === "verlauf" && (
          <div>
            {sortierterVerlauf.length === 0 ? (
              <div className="flex flex-col items-center px-6 py-14 text-center">
                <History
                  strokeWidth={1.5}
                  aria-hidden="true"
                  className="h-14 w-14 text-ink-muted/50"
                />
                <p className="mt-5 max-w-md text-body text-ink-muted">
                  {labels.verlaufLeer}
                </p>
              </div>
            ) : (
              <ul className="divide-y divide-line">
                {sortierterVerlauf.map((eintrag, index) => (
                  <li key={eintrag.id ?? `${eintrag.createdAt}-${index}`}>
                    <button
                      type="button"
                      onClick={() => oeffneVerlaufEintrag(eintrag)}
                      className="flex w-full items-start justify-between gap-4 px-6 py-4 text-left transition-colors hover:bg-surface"
                    >
                      <span className="min-w-0">
                        <span className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
                          {eintrag.gemerkt && (
                            <Bookmark
                              strokeWidth={2}
                              aria-hidden="true"
                              className="h-3.5 w-3.5 shrink-0 text-gold-ink"
                            />
                          )}
                          <span className="truncate text-body font-semibold text-ink">
                            {eintrag.frage}
                          </span>
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2.5 text-label uppercase text-ink-muted">
                          <span>{datumKurz(eintrag.createdAt)}</span>
                          <span>· {labels.tiefen[eintrag.tiefe]}</span>
                          {eintrag.produktlinieKontext && (
                            <span className="normal-case">
                              · {eintrag.produktlinieKontext}
                            </span>
                          )}
                        </span>
                      </span>
                      <span aria-hidden="true" className="mt-1 shrink-0 text-ink-muted">
                        ›
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Kontext-Umschalter (nur bei mehreren aktiven Linien) + Eingabe */}
      <div className="rounded border border-line bg-canvas p-6">
        {linien.length > 1 && (
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <label
              htmlFor="assistant-kontext"
              className="text-label uppercase text-ink-muted"
            >
              {labels.kontextLabel}
            </label>
            <select
              id="assistant-kontext"
              value={kontext ?? ""}
              onChange={(e) => setKontext(e.target.value || null)}
              className="rounded border border-line-strong bg-canvas px-3 py-2 text-body-sm text-ink focus:border-ink focus:outline-none"
            >
              <option value="">{labels.kontextAlle}</option>
              {linien.map((linie) => (
                <option key={linie} value={linie}>
                  {linie}
                </option>
              ))}
            </select>
          </div>
        )}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            stelleFrage(eingabe);
          }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center"
        >
          <input
            ref={eingabeRef}
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
      </div>

      {toast && (
        <div
          role="status"
          className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded border border-primary bg-canvas px-4 py-3 text-body-sm font-semibold text-primary"
        >
          {toast}
        </div>
      )}
    </div>
  );
}
