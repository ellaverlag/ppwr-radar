import type { Metadata } from "next";
import { VideoIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { LegalCard } from "@/components/ui";

export const metadata: Metadata = {
  title: "Webinare – PPWR Radar",
};

export default function WebinarePage() {
  return (
    <>
      <PageHeader
        title="Webinare"
        description="Aufzeichnungen und Termine unserer Compliance-Webinare zur EU-Verpackungsverordnung."
      />
      <LegalCard>
        <div className="flex min-h-64 flex-col items-center justify-center gap-4 p-10 text-center">
          <VideoIcon className="h-8 w-8 text-ink-muted" />
          <p className="max-w-md text-body text-ink-muted">
            Der Webinar-Bereich wird in einem späteren Arbeitspaket umgesetzt.
            Hier erscheinen künftig Termine und Aufzeichnungen.
          </p>
        </div>
      </LegalCard>
    </>
  );
}
