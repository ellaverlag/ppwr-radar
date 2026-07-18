import type { Metadata } from "next";
import Link from "next/link";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { formatDate, GILT_STATUS_LABELS, KATEGORIE_LABELS } from "@/lib/labels";
import { getAnforderungen } from "@/lib/wissensbasis";
import { WissenTabs } from "./tabs";

export const metadata: Metadata = {
  title: "Wissen – PPWR Radar",
};

export const dynamic = "force-dynamic";

export default async function WissenPage() {
  const anforderungen = await getAnforderungen();

  return (
    <>
      <PageHeader
        title="Wissen"
        description="Die Anforderungen der EU-Verpackungsverordnung (PPWR) – redaktionell aufbereitet und juristisch geprüft."
      />
      <WissenTabs />

      {anforderungen.length === 0 ? (
        <p className="text-sm text-neutral-500">
          Aktuell sind keine freigegebenen Anforderungen verfügbar.
        </p>
      ) : (
        <ul className="divide-y divide-neutral-100">
          {anforderungen.map((a) => (
            <li key={a.id}>
              <Link
                href={`/wissen/anforderungen/${a.id}`}
                className="group flex flex-col gap-2 py-5 sm:flex-row sm:items-center sm:justify-between"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-neutral-900 group-hover:text-accent">
                    {a.nr != null && (
                      <span className="mr-2 text-neutral-400">#{a.nr}</span>
                    )}
                    {a.titel}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500">
                    Gilt ab: {formatDate(a.gilt_ab)}
                  </p>
                </div>
                <div className="flex shrink-0 flex-wrap items-center gap-2">
                  <Badge variant="accent">{KATEGORIE_LABELS[a.kategorie]}</Badge>
                  <Badge variant={a.gilt_status === "in_kraft" ? "green" : "neutral"}>
                    {GILT_STATUS_LABELS[a.gilt_status]}
                  </Badge>
                  <Badge variant="neutral" title="Rechtsstand">
                    Rechtsstand {formatDate(a.rechtsstand)}
                  </Badge>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
