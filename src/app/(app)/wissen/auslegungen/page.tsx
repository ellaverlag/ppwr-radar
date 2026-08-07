import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { getAnforderungen, getAuslegungen } from "@/lib/wissensbasis";
import { WissenTabsNav } from "../tabs-server";
import {
  PraxisfragenListe,
  type PraxisFrage,
  type PraxisLabels,
} from "./praxisfragen-liste";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("auslegungen") };
}

export const dynamic = "force-dynamic";

/** „Meistgelesen“-Platzhalter – vorerst statisch kuratierte Codes. */
const KURATIERTE_CODES = ["A01", "A11", "B01"];

export default async function PraxisfragenPage() {
  const [auslegungen, anforderungen] = await Promise.all([
    getAuslegungen(),
    getAnforderungen(),
  ]);
  const t = await getTranslations("Praxisfragen");
  const tWissen = await getTranslations("Wissen");
  const tCommon = await getTranslations("Common");
  const tLabels = await getTranslations("Labels");

  // bezug_nr → verlinkbare Anforderungen
  const nachNr = new Map(
    anforderungen.filter((a) => a.nr != null).map((a) => [a.nr as number, a])
  );
  const fragen: PraxisFrage[] = auslegungen.map((a) => ({
    id: a.id,
    code: a.code,
    frage: a.frage,
    antwort: a.antwort,
    kategorie: a.kategorie,
    quellen: a.quellen,
    verbindlichkeit: a.verbindlichkeit,
    verwandte: (a.bezug_nr ?? [])
      .map((nr) => nachNr.get(nr))
      .filter((x): x is NonNullable<typeof x> => Boolean(x))
      .map((x) => ({ id: x.id, nr: x.nr, titel: x.titel })),
  }));

  const labels: PraxisLabels = {
    meistgelesen: t("meistgelesen"),
    suchPlaceholder: t("suchPlaceholder"),
    suchLabel: tCommon("suchen"),
    alleChip: t("alleChip"),
    kategorien: t.raw("kategorien") as Record<string, string>,
    verbindlichkeit: tLabels.raw("verbindlichkeit") as Record<string, string>,
    fundstellen: t("fundstellen"),
    verwandte: t("verwandte"),
    keineTreffer: t("keineTreffer"),
  };

  return (
    <>
      <PageHeader
        title={tWissen("titel")}
        description={tWissen("beschreibungAuslegungen")}
        titelVersteckt
      />
      <WissenTabsNav />

      {/* Editorial-Kopf mit Zähler */}
      <div className="mb-8 max-w-3xl">
        <div className="mb-3">
          <Badge variant="green">{t("zaehler", { anzahl: fragen.length })}</Badge>
        </div>
        <p className="text-body text-ink-muted">
          {t("editorial")}{" "}
          <span className="text-ink">{t("frageFehlt")}</span>{" "}
          <Link
            href="/assistant"
            className="font-medium text-legal hover:underline"
          >
            {t("assistantLink")}
          </Link>
        </p>
      </div>

      <PraxisfragenListe
        fragen={fragen}
        kuratiert={KURATIERTE_CODES}
        labels={labels}
      />
    </>
  );
}
