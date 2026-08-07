import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { LegalCard } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import { SearchIcon } from "@/components/icons";
import {
  getAnforderungen,
  type GiltStatus,
  type Kategorie,
} from "@/lib/wissensbasis";
import { WissenTabsNav } from "./tabs-server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("wissen") };
}

export const dynamic = "force-dynamic";

const KATEGORIEN: Kategorie[] = [
  "stoffrecht",
  "mehrweg",
  "konformitaet",
  "kennzeichnung",
  "rollen_epr",
  "verbote",
  "sonstiges",
];
const GILT_STATUS: GiltStatus[] = [
  "in_kraft",
  "kuenftig",
  "rechtsakt_ausstehend",
  "entwurf_eu",
];
const SORTIERUNGEN = ["nummer", "gilt_ab", "kategorie"] as const;
type Sortierung = (typeof SORTIERUNGEN)[number];

function giltStatusVariant(status: GiltStatus) {
  if (status === "in_kraft") return "green" as const;
  if (status === "entwurf_eu") return "neutral" as const;
  return "gold" as const;
}

export default async function WissenPage({
  searchParams,
}: {
  searchParams: Promise<{
    q?: string;
    kategorie?: string;
    status?: string;
    sort?: string;
  }>;
}) {
  const params = await searchParams;
  const alle = await getAnforderungen();
  const t = await getTranslations("Wissen");
  const tCommon = await getTranslations("Common");
  const tLabels = await getTranslations("Labels");

  const q = (params.q ?? "").trim();
  const kategorie = KATEGORIEN.find((wert) => wert === params.kategorie);
  const status = GILT_STATUS.find((wert) => wert === params.status);
  const sort: Sortierung =
    SORTIERUNGEN.find((wert) => wert === params.sort) ?? "nummer";

  const suchbegriff = q.toLowerCase();
  const anforderungen = alle
    .filter((a) => {
      if (kategorie && a.kategorie !== kategorie) return false;
      if (status && a.gilt_status !== status) return false;
      if (!suchbegriff) return true;
      return [a.titel, a.rechtsquelle, a.kurzerklaerung ?? ""]
        .join(" ")
        .toLowerCase()
        .includes(suchbegriff);
    })
    .sort((a, b) => {
      if (sort === "gilt_ab") {
        return (a.gilt_ab ?? "9999").localeCompare(b.gilt_ab ?? "9999");
      }
      if (sort === "kategorie") {
        return tLabels(`kategorien.${a.kategorie}`).localeCompare(
          tLabels(`kategorien.${b.kategorie}`),
          "de"
        );
      }
      return (a.nr ?? Number.MAX_SAFE_INTEGER) - (b.nr ?? Number.MAX_SAFE_INTEGER);
    });
  const filterAktiv = Boolean(q || kategorie || status);

  const selectKlasse =
    "rounded border border-line-strong bg-canvas px-3 py-3 text-body text-ink focus:border-ink focus:outline-none";

  return (
    <>
      <PageHeader
        title={t("titel")}
        description={t("beschreibungAnforderungen")}
        titelVersteckt
      />
      <WissenTabsNav />

      {/* Suche + Filter + Sortierung */}
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
              placeholder={t("suchPlaceholderAnforderungen")}
              className="w-full rounded border border-line-strong bg-canvas py-3 pl-11 pr-4 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
            />
          </div>
          <label htmlFor="kategorie" className="sr-only">
            {t("filterKategorieLabel")}
          </label>
          <select
            id="kategorie"
            name="kategorie"
            defaultValue={kategorie ?? ""}
            className={selectKlasse}
          >
            <option value="">{t("alleKategorien")}</option>
            {KATEGORIEN.map((wert) => (
              <option key={wert} value={wert}>
                {tLabels(`kategorien.${wert}`)}
              </option>
            ))}
          </select>
          <label htmlFor="status" className="sr-only">
            {t("filterStatusLabel")}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className={selectKlasse}
          >
            <option value="">{t("alleStatus")}</option>
            {GILT_STATUS.map((wert) => (
              <option key={wert} value={wert}>
                {tLabels(`giltStatus.${wert}`)}
              </option>
            ))}
          </select>
          <label htmlFor="sort" className="sr-only">
            {t("sortLabel")}
          </label>
          <select id="sort" name="sort" defaultValue={sort} className={selectKlasse}>
            <option value="nummer">{`${t("sortLabel")}: ${t("sortNummer")}`}</option>
            <option value="gilt_ab">{`${t("sortLabel")}: ${t("sortGiltAb")}`}</option>
            <option value="kategorie">{`${t("sortLabel")}: ${t("sortKategorie")}`}</option>
          </select>
          <button
            type="submit"
            className="shrink-0 rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
          >
            {tCommon("suchen")}
          </button>
        </div>
      </form>

      {anforderungen.length === 0 ? (
        <LegalCard>
          <p className="p-6 text-body text-ink-muted">
            {filterAktiv ? t("keineTrefferAnforderungen") : t("keineAnforderungen")}
          </p>
        </LegalCard>
      ) : (
        <LegalCard>
          <div className="hidden grid-cols-12 gap-4 rounded-t bg-surface px-6 py-3 text-label uppercase text-ink-muted md:grid">
            <span className="col-span-6">{t("spalteAnforderung")}</span>
            <span className="col-span-2">{t("spalteGiltAb")}</span>
            <span className="col-span-4">{t("spalteStatus")}</span>
          </div>
          <ul className="divide-y divide-line">
            {anforderungen.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/wissen/anforderungen/${a.id}`}
                  className="group grid grid-cols-1 gap-3 px-6 py-5 transition-colors hover:bg-surface md:grid-cols-12 md:items-center md:gap-4"
                >
                  <div className="md:col-span-6">
                    <p className="text-body-lg font-bold text-ink group-hover:text-primary">
                      {a.nr != null && (
                        <span className="mr-2 font-mono text-mono-sm font-normal text-ink-muted">
                          #{String(a.nr).padStart(2, "0")}
                        </span>
                      )}
                      {a.titel}
                    </p>
                    <p className="mt-1 font-mono text-mono-sm text-ink-muted">
                      {a.rechtsquelle}
                    </p>
                  </div>
                  <div className="text-body-sm text-ink-muted md:col-span-2">
                    {formatDate(a.gilt_ab)}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:col-span-4">
                    <Badge variant="green">
                      {tLabels(`kategorien.${a.kategorie}`)}
                    </Badge>
                    <Badge variant={giltStatusVariant(a.gilt_status)}>
                      {tLabels(`giltStatus.${a.gilt_status}`)}
                    </Badge>
                    <Badge variant="neutral" title={t("rechtsstandTitle")}>
                      {t("rechtsstandChip", { datum: formatDate(a.rechtsstand) })}
                    </Badge>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </LegalCard>
      )}
    </>
  );
}
