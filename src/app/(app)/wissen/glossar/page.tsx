import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { SearchX } from "lucide-react";
import { SearchIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { LegalCard } from "@/components/ui";
import {
  ladeGlossar,
  registerBuchstabe,
  type GlossarEintrag,
  type GlossarTyp,
} from "@/lib/glossar";
import { WissenTabsNav } from "../tabs-server";
import { GlossarListe, type GlossarLabels } from "./glossar-liste";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("glossar") };
}

export const dynamic = "force-dynamic";

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const BASIS_TYPEN: GlossarTyp[] = ["begriff", "anforderung", "praxisfrage"];
const VERPACKUNGSTYP_KEYS = [
  "verkauf",
  "umverpackung",
  "transport",
  "service",
  "primaerproduktion",
  "ecommerce_versand",
  "mehrweg",
];

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

export default async function GlossarPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; typ?: string; art?: string; b?: string }>;
}) {
  const params = await searchParams;
  const t = await getTranslations("Glossar");
  const tWissen = await getTranslations("Wissen");
  const tCommon = await getTranslations("Common");
  const tLabels = await getTranslations("Labels");

  const q = params.q?.trim() ?? "";
  const { eintraege, hatLemmata } = await ladeGlossar();
  // „Verpackungen & Materialien“ erscheint erst, wenn glossar_lemmata
  // Inhalte liefert (fail-soft, Tabelle kommt mit Maltes Import)
  const glossarTypen: GlossarTyp[] = hatLemmata
    ? [...BASIS_TYPEN, "verpackung_material"]
    : BASIS_TYPEN;
  const typ = glossarTypen.find((wert) => wert === params.typ);
  const art =
    params.art && VERPACKUNGSTYP_KEYS.includes(params.art) ? params.art : "";
  const buchstabe =
    params.b && (ALPHABET.includes(params.b) || params.b === "#")
      ? params.b
      : "";


  // Verpackungsart-Optionen aus den tatsächlich vorhandenen Daten
  const artOptionen = VERPACKUNGSTYP_KEYS.filter((wert) =>
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

  const listenLabels: GlossarLabels = {
    typBadge: t.raw("typBadge") as Record<string, string>,
    betrifftMich: t("betrifftMich"),
    betrifftMichTitle: t("betrifftMichTitle"),
    zurAnforderung: t("zurAnforderung"),
    zurAntwort: t("zurAntwort"),
  };


  return (
    <>
      <PageHeader
        title={tWissen("titel")}
        description={tWissen("beschreibungGlossar")}
        titelVersteckt
      />
      <WissenTabsNav />

      {/* Suche + Filter */}
      <form method="get" className="mb-8">
        <label htmlFor="q" className="sr-only">
          {t("suchLabel")}
        </label>
        <div className="flex flex-wrap gap-3">
          <div className="relative w-full max-w-xl">
            <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-ink-muted" />
            <input
              id="q"
              name="q"
              type="search"
              defaultValue={q}
              placeholder={t("suchPlaceholder")}
              className="w-full rounded border border-line-strong bg-canvas py-3 pl-11 pr-4 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
            />
          </div>
          <label htmlFor="typ" className="sr-only">
            {t("typFilterLabel")}
          </label>
          <select
            id="typ"
            name="typ"
            defaultValue={typ ?? ""}
            className="rounded border border-line-strong bg-canvas px-3 py-3 text-body text-ink focus:border-ink focus:outline-none"
          >
            <option value="">{t("alleTypen")}</option>
            {glossarTypen.map((wert) => (
              <option key={wert} value={wert}>
                {t(`typFilter.${wert}`)}
              </option>
            ))}
          </select>
          <label htmlFor="art" className="sr-only">
            {t("artFilterLabel")}
          </label>
          <select
            id="art"
            name="art"
            defaultValue={art}
            className="rounded border border-line-strong bg-canvas px-3 py-3 text-body text-ink focus:border-ink focus:outline-none"
          >
            <option value="">{t("alleVerpackungsarten")}</option>
            {artOptionen.map((wert) => (
              <option key={wert} value={wert}>
                {tLabels(`verpackungstypen.${wert}`)}
              </option>
            ))}
          </select>
          <button
            type="submit"
            className="shrink-0 rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          >
            {tCommon("suchen")}
          </button>
        </div>
      </form>

      {/* Alphabet-Register */}
      <nav
        aria-label={t("registerLabel")}
        className="mb-10 flex flex-wrap items-center gap-1 border-b border-line pb-4"
      >
        {buchstabe ? (
          <Link
            href={glossarUrl({ q, typ, art })}
            className="mr-2 rounded px-2 py-1 text-body-sm font-semibold text-legal hover:bg-hover"
          >
            {t("alle")}
          </Link>
        ) : (
          <span className="mr-2 rounded bg-primary px-2 py-1 text-body-sm font-bold text-white">
            {t("alle")}
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
          <div className="flex flex-col items-center p-10 text-center">
            <SearchX
              strokeWidth={1.5}
              aria-hidden="true"
              className="h-14 w-14 text-ink-muted/50"
            />
            <p className="mt-5 max-w-md text-body text-ink-muted">
              {q ? t("keinEintragZu", { query: q }) : t("keinEintragAuswahl")}
            </p>
            {filterAktiv && (
              <p className="mt-3 text-body-sm">
                <Link
                  href="/wissen/glossar"
                  className="font-medium text-legal hover:underline"
                >
                  {t("blaettern")}
                </Link>
              </p>
            )}
          </div>
        </LegalCard>
      ) : (
        <GlossarListe gruppen={gruppen} labels={listenLabels} />
      )}
    </>
  );
}
