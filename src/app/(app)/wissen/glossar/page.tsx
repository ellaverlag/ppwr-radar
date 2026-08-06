import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/badge";
import { SearchIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { LegalCard } from "@/components/ui";
import {
  ladeGlossar,
  registerBuchstabe,
  type GlossarEintrag,
  type GlossarTyp,
} from "@/lib/glossar";
import { VERPACKUNGSTYP_LABELS } from "@/lib/labels";
import { WissenTabs } from "../tabs";

export const metadata: Metadata = {
  title: "Glossar – PPWR Radar",
};

export const dynamic = "force-dynamic";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

const TYP_FILTER_LABELS: Record<GlossarTyp, string> = {
  begriff: "Begriff/Rolle",
  anforderung: "Anforderung",
  praxisfrage: "Praxisfrage",
};

const TYP_BADGE_LABELS: Record<GlossarTyp, string> = {
  begriff: "Begriff",
  anforderung: "Anforderung",
  praxisfrage: "Praxisfrage",
};

function glossarUrl(params: {
  q?: string;
  typ?: string;
  art?: string;
  b?: string;
}): string {
  const search = new URLSearchParams();
  if (params.q) search.set("q", params.q);
  if (params.typ) search.set("typ", params.typ);
  if (params.art) search.set("art", params.art);
  if (params.b) search.set("b", params.b);
  const query = search.toString();
  return query ? `/wissen/glossar?${query}` : "/wissen/glossar";
}

function BetrifftMichPunkt() {
  return (
    <span
      title="Betrifft Sie laut Ihrem Profil"
      className="inline-flex items-center gap-1.5 text-label uppercase text-primary"
    >
      <span aria-hidden="true" className="h-2 w-2 rounded-full bg-primary" />
      Betrifft mich
    </span>
  );
}

function EintragInhalt({ eintrag }: { eintrag: GlossarEintrag }) {
  return (
    <>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span
          className={`text-body-lg font-bold text-ink ${
            eintrag.href ? "group-hover:text-primary" : ""
          }`}
        >
          {eintrag.begriff}
        </span>
        {eintrag.begriff_en && (
          <span className="text-body-sm italic text-ink-muted">
            {eintrag.begriff_en}
          </span>
        )}
        {eintrag.betrifft_mich && <BetrifftMichPunkt />}
      </p>
      {eintrag.kurztext && (
        <p className="mt-1.5 max-w-[80ch] text-body-sm text-ink-muted">
          {eintrag.kurztext}
        </p>
      )}
      <p className="mt-3 flex flex-wrap items-center gap-2">
        <Badge variant="neutral">{TYP_BADGE_LABELS[eintrag.typ]}</Badge>
        <span className="rounded border border-legal-tint bg-legal-tint px-2 py-0.5 font-mono text-label font-medium text-legal">
          {eintrag.quelle}
        </span>
        {eintrag.href && (
          <span className="text-body-sm font-medium text-legal">
            {eintrag.typ === "anforderung"
              ? "Zur Anforderung →"
              : "Zur Antwort →"}
          </span>
        )}
      </p>
    </>
  );
}

export default async function GlossarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; typ?: string; art?: string; b?: string }>;
}) {
  const params = await searchParams;
  const q = params.q?.trim() ?? "";
  const typ = (["begriff", "anforderung", "praxisfrage"] as const).find(
    (t) => t === params.typ
  );
  const art = params.art && VERPACKUNGSTYP_LABELS[params.art] ? params.art : "";
  const buchstabe =
    params.b && (ALPHABET.includes(params.b) || params.b === "#")
      ? params.b
      : "";

  const { eintraege } = await ladeGlossar();

  // Verpackungsart-Optionen aus den tatsächlich vorhandenen Daten
  const artOptionen = Object.keys(VERPACKUNGSTYP_LABELS).filter(
    (wert) =>
      wert !== "alle" &&
      eintraege.some((e) => e.verpackungstypen.includes(wert))
  );

  const suchbegriff = q.toLowerCase();
  const gefiltert = eintraege.filter((e) => {
    if (typ && e.typ !== typ) return false;
    if (
      art &&
      !e.verpackungstypen.includes(art) &&
      !e.verpackungstypen.includes("alle")
    ) {
      return false;
    }
    if (suchbegriff && !e.suchtext.includes(suchbegriff)) return false;
    return true;
  });

  const verfuegbareBuchstaben = new Set(
    gefiltert.map((e) => registerBuchstabe(e.begriff))
  );
  const sichtbar = buchstabe
    ? gefiltert.filter((e) => registerBuchstabe(e.begriff) === buchstabe)
    : gefiltert;

  const gruppen: { buchstabe: string; eintraege: GlossarEintrag[] }[] = [];
  for (const eintrag of sichtbar) {
    const b = registerBuchstabe(eintrag.begriff);
    const letzte = gruppen.at(-1);
    if (letzte && letzte.buchstabe === b) {
      letzte.eintraege.push(eintrag);
    } else {
      gruppen.push({ buchstabe: b, eintraege: [eintrag] });
    }
  }

  const filterAktiv = Boolean(q || typ || art || buchstabe);

  return (
    <>
      <PageHeader
        title="Wissen"
        description="Das Nachschlagewerk zur PPWR: Begriffe, Anforderungen und Praxisfragen von A bis Z – mit Quelle und Link in die Tiefe."
      />
      <WissenTabs />

      {/* Suche + Filter */}
      <form method="get" className="mb-8">
        <label htmlFor="q" className="sr-only">
          Glossar durchsuchen
        </label>
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full max-w-xl">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder="Begriff, Anforderung oder Frage suchen – auch alte VerpackG-Begriffe …"
              className="w-full rounded border border-line-strong bg-canvas py-3 pl-11 pr-4 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
            />
          </div>
          <label htmlFor="typ" className="sr-only">
            Nach Typ filtern
          </label>
          <select
            id="typ"
            name="typ"
            defaultValue={typ ?? ""}
            className="rounded border border-line-strong bg-canvas px-3 py-3 text-body text-ink focus:border-ink focus:outline-none"
          >
            <option value="">Alle Typen</option>
            {(Object.keys(TYP_FILTER_LABELS) as GlossarTyp[]).map((wert) => (
              <option key={wert} value={wert}>
                {TYP_FILTER_LABELS[wert]}
              </option>
            ))}
          </select>
          <label htmlFor="art" className="sr-only">
            Nach Verpackungsart filtern
          </label>
          <select
            id="art"
            name="art"
            defaultValue={art}
            className="rounded border border-line-strong bg-canvas px-3 py-3 text-body text-ink focus:border-ink focus:outline-none"
          >
            <option value="">Alle Verpackungsarten</option>
            {artOptionen.map((wert) => (
              <option key={wert} value={wert}>
                {VERPACKUNGSTYP_LABELS[wert]}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="shrink-0 rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          >
            Suchen
          </button>
        </div>
      </form>

      {/* Alphabet-Register */}
      <nav
        aria-label="Alphabet-Register"
        className="mb-10 flex flex-wrap items-center gap-1 border-b border-line pb-4"
      >
        {buchstabe ? (
          <Link
            href={glossarUrl({ q, typ, art })}
            className="mr-2 rounded px-2 py-1 text-body-sm font-semibold text-legal hover:bg-hover"
          >
            Alle
          </Link>
        ) : (
          <span className="mr-2 rounded bg-primary px-2 py-1 text-body-sm font-bold text-white">
            Alle
          </span>
        )}
        {ALPHABET.map((b) => {
          if (b === buchstabe) {
            return (
              <span
                key={b}
                aria-current="true"
                className="rounded bg-primary px-2 py-1 text-body-sm font-bold text-white"
              >
                {b}
              </span>
            );
          }
          if (!verfuegbareBuchstaben.has(b)) {
            return (
              <span
                key={b}
                className="px-2 py-1 text-body-sm text-dim"
                aria-hidden="true"
              >
                {b}
              </span>
            );
          }
          return (
            <Link
              key={b}
              href={glossarUrl({ q, typ, art, b })}
              className="rounded px-2 py-1 text-body-sm font-semibold text-ink-muted hover:bg-hover hover:text-ink"
            >
              {b}
            </Link>
          );
        })}
      </nav>

      {sichtbar.length === 0 ? (
        <LegalCard>
          <div className="p-6">
            <p className="text-body text-ink-muted">
              {q
                ? `Zu „${q}“ ist noch kein Eintrag verzeichnet.`
                : "Zu dieser Auswahl ist noch kein Eintrag verzeichnet."}
            </p>
            {filterAktiv && (
              <p className="mt-3 text-body-sm">
                <Link
                  href="/wissen/glossar"
                  className="font-medium text-legal hover:underline"
                >
                  Stattdessen von A bis Z blättern →
                </Link>
              </p>
            )}
          </div>
        </LegalCard>
      ) : (
        <div className="space-y-10">
          {gruppen.map((gruppe) => (
            <section key={gruppe.buchstabe}>
              <h2 className="mb-3 text-headline text-primary">
                {gruppe.buchstabe}
              </h2>
              <LegalCard>
                <ul className="divide-y divide-line">
                  {gruppe.eintraege.map((eintrag) =>
                    eintrag.href ? (
                      <li key={eintrag.id}>
                        <Link
                          href={eintrag.href}
                          className="group block px-6 py-5 transition-colors hover:bg-surface"
                        >
                          <EintragInhalt eintrag={eintrag} />
                        </Link>
                      </li>
                    ) : (
                      <li key={eintrag.id} className="px-6 py-5">
                        <EintragInhalt eintrag={eintrag} />
                      </li>
                    )
                  )}
                </ul>
              </LegalCard>
            </section>
          ))}
        </div>
      )}
    </>
  );
}
