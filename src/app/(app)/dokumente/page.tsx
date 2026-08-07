import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { DocumentIcon, PlusIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import { TEMPLATE_TYPEN, type TemplateKey } from "@/lib/dokumente/service";
import { createClient } from "@/lib/supabase/server";
import { erforderePaket } from "@/lib/zugang";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("dokumente") };
}

export const dynamic = "force-dynamic";

/** dokument_typ (DB) → Template-Key für Labels. */
const DB_TYP_ZU_KEY: Record<string, TemplateKey> = Object.fromEntries(
  Object.entries(TEMPLATE_TYPEN).map(([key, wert]) => [wert.dbTyp, key])
) as Record<string, TemplateKey>;

interface DokumentZeile {
  id: string;
  typ: string;
  doc_nummer: string | null;
  status: string;
  rechtsstand_bei_erstellung: string;
  created_at: string;
  verpackung: { bezeichnung: string } | null;
}

export default async function DokumentePage({
  searchParams,
}: {
  searchParams: Promise<{ erstellt?: string }>;
}) {
  const zugang = await erforderePaket();
  const params = await searchParams;
  const t = await getTranslations("Dokumente");

  const supabase = await createClient();
  const { data } = await supabase
    .from("dokumente")
    .select(
      "id, typ, doc_nummer, status, rechtsstand_bei_erstellung, created_at, verpackung:profil_verpackungen(bezeichnung)"
    )
    .eq("user_id", zugang.user.id)
    .order("created_at", { ascending: false });
  const dokumente = (data ?? []) as unknown as DokumentZeile[];

  return (
    <>
      <PageHeader
        title={t("titel")}
        description={t("beschreibung")}
        titelVersteckt
      />

      {params.erstellt && (
        <p className="mb-6 rounded border border-primary bg-primary/5 px-4 py-3 text-body-sm text-ink">
          {t("erstelltErfolg", { nr: params.erstellt })}
        </p>
      )}

      <div className="mb-8 flex justify-end">
        <Link
          href="/dokumente/neu"
          className="inline-flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
        >
          <PlusIcon className="h-4 w-4" />
          <span>{t("neuesDokument")}</span>
        </Link>
      </div>

      {dokumente.length === 0 ? (
        <LegalCard>
          <div className="flex min-h-48 flex-col items-center justify-center gap-3 p-10 text-center">
            <DocumentIcon className="h-8 w-8 text-ink-muted" />
            <p className="max-w-md text-body text-ink-muted">{t("leer")}</p>
          </div>
        </LegalCard>
      ) : (
        <LegalCard>
          <div className="hidden grid-cols-12 gap-4 rounded-t bg-surface px-6 py-3 text-label uppercase text-ink-muted md:grid">
            <span className="col-span-5">{t("spalteDokument")}</span>
            <span className="col-span-3">{t("spalteVerpackung")}</span>
            <span className="col-span-2">{t("spalteRechtsstand")}</span>
            <span className="col-span-2">{t("spalteAktionen")}</span>
          </div>
          <ul className="divide-y divide-line">
            {dokumente.map((dok) => {
              const key = DB_TYP_ZU_KEY[dok.typ];
              return (
                <li
                  key={dok.id}
                  className="grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-12 md:items-center md:gap-4"
                >
                  <div className="flex items-start gap-3 md:col-span-5">
                    <DocumentIcon className="mt-1 h-5 w-5 shrink-0 text-ink-muted" />
                    <div>
                      <p className="text-body-lg font-bold text-ink">
                        {key ? t(`typen.${key}`) : dok.typ}
                      </p>
                      <p className="mt-0.5 flex flex-wrap items-center gap-2">
                        {dok.doc_nummer && (
                          <span className="rounded bg-surface px-2 py-0.5 font-mono text-mono-sm text-ink">
                            {dok.doc_nummer}
                          </span>
                        )}
                        {dok.status === "update_verfuegbar" && (
                          <Badge variant="gold">{t("updateFlag")}</Badge>
                        )}
                      </p>
                    </div>
                  </div>
                  <div className="text-body-sm text-ink-muted md:col-span-3">
                    {dok.verpackung?.bezeichnung ?? "—"}
                  </div>
                  <div className="md:col-span-2">
                    <Badge variant="neutral">
                      {formatDate(dok.rechtsstand_bei_erstellung)}
                    </Badge>
                  </div>
                  <div className="flex gap-2 md:col-span-2">
                    <a
                      href={`/dokumente/download/${dok.id}?format=docx`}
                      className="rounded border border-ink px-3 py-1.5 text-label uppercase tracking-widest text-ink transition-colors hover:bg-surface"
                    >
                      {t("downloadDocx")}
                    </a>
                    <a
                      href={`/dokumente/download/${dok.id}?format=pdf`}
                      className="rounded border border-ink px-3 py-1.5 text-label uppercase tracking-widest text-ink transition-colors hover:bg-surface"
                    >
                      {t("downloadPdf")}
                    </a>
                  </div>
                </li>
              );
            })}
          </ul>
          <LegalCardFooter>
            {t("beschreibung")}
          </LegalCardFooter>
        </LegalCard>
      )}
    </>
  );
}
