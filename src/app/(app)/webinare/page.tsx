import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { VideoIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { LegalCard } from "@/components/ui";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("webinare") };
}

export default async function WebinarePage() {
  const t = await getTranslations("Webinare");

  return (
    <>
      <PageHeader title={t("titel")} description={t("beschreibung")} titelVersteckt />
      <LegalCard>
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-10 text-center">
          <VideoIcon className="h-8 w-8 text-ink-muted" />
          <p className="max-w-md text-body text-ink-muted">
            {t("platzhalter")}
          </p>
        </div>
      </LegalCard>
    </>
  );
}
