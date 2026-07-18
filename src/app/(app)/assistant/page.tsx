import type { Metadata } from "next";
import { PageHeader, Placeholder } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Assistant – PPWR Radar",
};

export default function AssistantPage() {
  return (
    <>
      <PageHeader
        title="Assistant"
        description="Ihr KI-Assistent für Fragen rund um PPWR und Verpackungs-Compliance."
      />
      <Placeholder text="Der Assistant wird in einem späteren Arbeitspaket umgesetzt." />
    </>
  );
}
