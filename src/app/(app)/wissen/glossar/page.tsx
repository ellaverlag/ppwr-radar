import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
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
import { WissenTabsNav } from "../tabs-server";

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
  const tPraxis = await getTranslations("Praxisfragen");
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
          {eintrag.betrifft_mich && (
            <span
              title={t("betrifftMichTitle")}
              className="inline-flex items-center gap-1.5 text-label uppercase text-primary"
            >
              <span
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-primary"
              />
              {t("betrifftMich")}
            </span>
          )}
        </p>
        {eintrag.kurztext && (
          <p className="mt-1.5 max-w-[80ch] text-body-sm text-ink-muted">
            {eintrag.kurztext}
          </p>
        )}
        {eintrag.merkmale && (
          <p className="mt-1.5 font-mono text-mono-sm text-ink-muted">
            {eintrag.merkmale}
          </p>
        )}
        <p className="mt-3 flex flex-wrap items-center gap-2">
          <Badge variant="neutral">{t(`typBadge.${eintrag.typ}`)}</Badge>
          <span className="rounded border border-legal-tint bg-legal-tint px-2 py-0.5 font-mono text-label font-medium text-legal">
            {eintrag.quelle}
          </span>
          {eintrag.href && (
            <span className="text-body-sm font-medium text-legal">
              {eintrag.typ === "anforderung"
                ? t("zurAnforderung")
                : t("zurAntwort")}
            </span>
          )}
        </p>
        {(eintrag.verweisChips?.length ?? 0) > 0 && (
          <p className="mt-2 flex flex-wrap gap-2">
            {eintrag.verweisChips!.map((chip) => (
              <Link
                key={`${chip.href}-${chip.label}`}
                href={chip.href}
                className="rounded border border-legal px-2 py-0.5 font-mono text-label font-medium text-legal transition-colors hover:bg-chip-hover"
              >
                {chip.label}
              </Link>
            ))}
          </p>
        )}
      </>
    );
  }

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
          <div className="p-6">
            <p className="text-body text-ink-muted">
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
        <div className="space-y-10">
          {gruppen.map((gruppe) => (
            <section key={gruppe.buchstabe}>
              <h2 className="mb-3 text-headline text-primary">
                {gruppe.buchstabe}
              </h2>
              <LegalCard>
                <ul className="divide-y divide-line">
                  {gruppe.eintraege.map((eintrag) =>
                    eintrag.typ === "praxisfrage" && eintrag.antwort ? (
                      /* Gleiche Accordion-Anatomie wie die Praxisfragen-
                         Liste: Frage-Zeile aufklappbar, Antwort mit
                         Fundstelle und Deep-Link (#Code) im Panel */
                      <li key={eintrag.id}>
                        <details className="group/frage">
                          <summary className="flex cursor-pointer list-none items-start justify-between gap-4 px-6 py-5 transition-colors hover:bg-surface [&::-webkit-details-marker]:hidden">
                            <span className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1.5">
                              <Badge variant="neutral">
                                {t(`typBadge.${eintrag.typ}`)}
                              </Badge>
                              <span className="text-body-lg font-bold text-ink">
                                {eintrag.begriff}
                              </span>
                            </span>
                            <span
                              aria-hidden="true"
                              className="mt-1 shrink-0 text-ink-muted transition-transform group-open/frage:rotate-180"
                            >
                              ▾
                            </span>
                          </summary>
                          <div className="border-t border-line-strong bg-surface px-6 py-5">
                            <p className="max-w-[80ch] whitespace-pre-line text-body text-ink">
                              {eintrag.antwort}
                            </p>
                            <p className="mt-4 flex flex-wrap items-center gap-3">
                              <span className="rounded border border-legal-tint bg-legal-tint px-2 py-0.5 font-mono text-label font-medium text-legal">
                                {eintrag.quelle}
                              </span>
                              {eintrag.href && (
                                <Link
                                  href={eintrag.href}
                                  className="text-body-sm font-medium text-legal hover:underline"
                                >
                                  {tPraxis("zurFrage")}
                                </Link>
                              )}
                            </p>
                          </div>
                        </details>
                      </li>
                    ) : eintrag.href ? (
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
