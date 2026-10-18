import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { AnforderungArtikel } from "@/components/anforderung-artikel";
import { getAnforderung } from "@/lib/wissensbasis";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("anforderung") };
}

export const dynamic = "force-dynamic";

export default async function AnforderungDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const anforderung = await getAnforderung(id).catch(() => null);
  if (!anforderung) notFound();
  return <AnforderungArtikel anforderung={anforderung} />;
}
