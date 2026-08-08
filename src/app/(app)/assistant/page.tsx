import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import type { Erklaertiefe } from "@/lib/assistant/prompt";
import { erforderePaket } from "@/lib/zugang";
import { AssistantChat, type AssistantLabels } from "./assistant-chat";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("assistant") };
}

export const dynamic = "force-dynamic";

export default async function AssistantPage() {
  await erforderePaket();
  const t = await getTranslations("Assistant");
  const tLabels = await getTranslations("Labels");

  const labels: AssistantLabels = {
    fragePlaceholder: t("fragePlaceholder"),
    fragen: t("fragen"),
    denken: t("denken"),
    erklaertiefeLabel: t("erklaertiefeLabel"),
    tiefen: t.raw("tiefen") as Record<Erklaertiefe, string>,
    beispielTitel: t("beispielTitel"),
    beispielFragen: t.raw("beispielFragen") as string[],
    leerTitel: t("leerTitel"),
    leerText: t("leerText"),
    quellenLabel: t("quellenLabel"),
    disclaimer: t("disclaimer"),
    previewHinweis: t("previewHinweis"),
    kandidatFrage: t("kandidatFrage"),
    kandidatGrenze: t("kandidatGrenze"),
    kandidatCta: t("kandidatCta"),
    kandidatDanke: t("kandidatDanke"),
    kandidatFehler: t("kandidatFehler"),
    // Roh-String mit {limit}-Platzhalter – der Client setzt den Wert der Action ein
    rateLimit: t.raw("rateLimit") as string,
    fehler: t.raw("fehler") as Record<string, string>,
    verbindlichkeit: tLabels.raw("verbindlichkeit") as Record<string, string>,
  };

  return (
    <>
      <PageHeader title={t("titel")} description={t("beschreibung")} />
      <AssistantChat labels={labels} />
    </>
  );
}
