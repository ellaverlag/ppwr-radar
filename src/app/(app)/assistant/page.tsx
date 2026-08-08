import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { PageHeader } from "@/components/page-header";
import { GRENZE_MARKER, type Erklaertiefe } from "@/lib/assistant/prompt";
import { createClient } from "@/lib/supabase/server";
import { erforderePaket } from "@/lib/zugang";
import type { QuellenChip } from "./actions";
import {
  AssistantChat,
  type AssistantLabels,
  type VerlaufEintrag,
} from "./assistant-chat";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("assistant") };
}

export const dynamic = "force-dynamic";

const TIEFEN: Erklaertiefe[] = ["einfach", "fachlich", "rechtstext"];

export default async function AssistantPage() {
  const zugang = await erforderePaket();
  const t = await getTranslations("Assistant");
  const tLabels = await getTranslations("Labels");

  // Aktive Produktlinien (Kontext-Umschalter) + gespeicherter Verlauf –
  // beides über den Session-Client (own-row-RLS).
  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profile")
    .select("id")
    .eq("user_id", zugang.user.id)
    .maybeSingle();

  let linien: string[] = [];
  let initialVerlauf: VerlaufEintrag[] = [];
  if (profil) {
    const [{ data: verpackungen }, { data: verlaufZeilen }] = await Promise.all([
      supabase
        .from("profil_verpackungen")
        .select("bezeichnung, status")
        .eq("profil_id", profil.id),
      supabase
        .from("assistant_verlauf")
        .select(
          "id, frage, antwort_markdown, erklaertiefe, quellen, rechtsstand, preview, gemerkt, produktlinie_kontext, created_at"
        )
        .eq("profil_id", profil.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    linien = (verpackungen ?? [])
      .filter((zeile) => zeile.status !== "stillgelegt")
      .map((zeile) => zeile.bezeichnung as string);

    initialVerlauf = (verlaufZeilen ?? []).map((zeile) => {
      const antwort = zeile.antwort_markdown as string;
      return {
        id: zeile.id as string,
        frage: zeile.frage as string,
        antwort,
        tiefe: TIEFEN.includes(zeile.erklaertiefe as Erklaertiefe)
          ? (zeile.erklaertiefe as Erklaertiefe)
          : "fachlich",
        quellen: (zeile.quellen ?? []) as QuellenChip[],
        grenze: antwort.includes(GRENZE_MARKER),
        preview: Boolean(zeile.preview),
        rechtsstand: (zeile.rechtsstand as string | null) ?? "",
        gemerkt: Boolean(zeile.gemerkt),
        produktlinieKontext: zeile.produktlinie_kontext as string | null,
        createdAt: zeile.created_at as string,
      };
    });
  }

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
    kontextLabel: t("kontextLabel"),
    kontextAlle: t("kontextAlle"),
    verlaufTab: t("verlaufTab"),
    verlaufLeer: t("verlaufLeer"),
    ausVerlauf: t("ausVerlauf"),
    neueFrage: t("neueFrage"),
    merken: t("merken"),
    gemerkt: t("gemerkt"),
    pdfButton: t("pdfButton"),
    pdfFehler: t("pdfFehler"),
  };

  return (
    <>
      <PageHeader title={t("titel")} description={t("beschreibung")} />
      <AssistantChat
        labels={labels}
        linien={linien}
        initialVerlauf={initialVerlauf}
      />
    </>
  );
}
