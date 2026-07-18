import type { Metadata } from "next";
import { PageHeader, Placeholder } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Webinare – PPWR Radar",
};

export default function WebinarePage() {
  return (
    <>
      <PageHeader
        title="Webinare"
        description="Aufzeichnungen und Termine unserer Compliance-Webinare."
      />
      <Placeholder text="Der Webinar-Bereich wird in einem späteren Arbeitspaket umgesetzt." />
    </>
  );
}
