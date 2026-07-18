import type { Metadata } from "next";
import { PageHeader, Placeholder } from "@/components/page-header";

export const metadata: Metadata = {
  title: "Dashboard – PPWR Radar",
};

export default function DashboardPage() {
  return (
    <>
      <PageHeader
        title="Dashboard"
        description="Ihr Überblick über Compliance-Status, offene Aufgaben und aktuelle Änderungen."
      />
      <Placeholder text="Das Dashboard wird in einem späteren Arbeitspaket umgesetzt." />
    </>
  );
}
