import type { Metadata } from "next";
import { PageHeader, Placeholder } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Meine Dokumente – PPWR Radar",
};

export default function DokumentePage() {
  return (
    <>
      <PageHeader
        title="Meine Dokumente"
        description="Ihre generierten Compliance-Dokumente – Konformitätserklärungen, Pflichtenübersichten und mehr."
      />
      <Placeholder text="Der Dokumenten-Generator wird in einem späteren Arbeitspaket umgesetzt." />
    </>
  );
}
