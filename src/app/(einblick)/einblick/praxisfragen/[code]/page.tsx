import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { PruefstatusBadge } from "@/components/pruefstatus-badge";
import { KategorieIcon } from "@/components/kategorie-icons";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import { anforderungUrl } from "@/lib/wissen-links";
import { getAnforderungen, getAuslegungen } from "@/lib/wissensbasis";

export const dynamic = "force-dynamic";

/** Einzelne Praxisfrage (nach Code, z. B. A01) für das Schiebefenster. */
export default async function PraxisfrageEinblickPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const wanted = decodeURIComponent(code).toUpperCase();
  const [auslegungen, anforderungen] = await Promise.all([
    getAuslegungen(),
    getAnforderungen(),
  ]);
  const frage = auslegungen.find(
    (a) => (a.code ?? "").toUpperCase() === wanted || a.id === code
  );
  if (!frage) notFound();

  const t = await getTranslations("Praxisfragen");
  const tLabels = await getTranslations("Labels");
  const nachNr = new Map(
    anforderungen.filter((a) => a.nr != null).map((a) => [a.nr as number, a])
  );
  const verwandte = (frage.bezug_nr ?? [])
    .map((nr) => nachNr.get(nr))
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
  const kategorien = t.raw("kategorien") as Record<string, string>;

  return (
    <article className="max-w-3xl">
      <div className="flex flex-wrap items-center gap-2">
        {frage.code && (
          <span className="font-mono text-mono-sm text-ink-muted">{frage.code}</span>
        )}
        <Badge variant="green">
          <KategorieIcon kategorie={frage.kategorie} />
          {kategorien[frage.kategorie] ?? frage.kategorie}
        </Badge>
        <Badge variant={frage.verbindlichkeit === "rechtsverbindlich" ? "blue" : "neutral"}>
          {tLabels(`verbindlichkeit.${frage.verbindlichkeit}`)}
        </Badge>
        <PruefstatusBadge status={frage.review_status} labels={tLabels.raw("pruefstatus")} />
      </div>
      <h1 className="mt-5 text-headline text-ink">{frage.frage}</h1>
      <p className="mt-2 font-mono text-mono-sm uppercase text-ink-muted">
        {t("rechtsstandLabel")} {formatDate(frage.rechtsstand)}
      </p>
      <div className="mt-6 whitespace-pre-line border-l border-line-strong pl-4 text-body text-ink">
        {frage.antwort}
      </div>

      {verwandte.length > 0 && (
        <section className="mt-8">
          <h2 className="text-label uppercase text-ink-muted">{t("verwandte")}</h2>
          <ul className="mt-3 space-y-1.5">
            {verwandte.map((a) => (
              <li key={a.id}>
                <Link href={anforderungUrl(a.id)} className="font-medium text-legal hover:underline">
                  {a.nr != null && (
                    <span className="mr-2 font-mono text-mono-sm text-ink-muted">
                      #{String(a.nr).padStart(2, "0")}
                    </span>
                  )}
                  {a.titel}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {frage.quellen.length > 0 && (
        <LegalCard className="mt-10">
          <div className="p-6">
            <h2 className="text-label uppercase text-ink-muted">{t("fundstellen")}</h2>
            <ul className="mt-3 space-y-1 text-body text-ink-muted">
              {frage.quellen.map((q) => (
                <li key={q}>{q}</li>
              ))}
            </ul>
          </div>
          <LegalCardFooter>
            {tLabels(`verbindlichkeit.${frage.verbindlichkeit}`)} · {t("rechtsstandLabel")}{" "}
            {formatDate(frage.rechtsstand)}
          </LegalCardFooter>
        </LegalCard>
      )}
    </article>
  );
}
