import { notFound } from "next/navigation";
import { AnforderungArtikel } from "@/components/anforderung-artikel";
import { getAnforderung } from "@/lib/wissensbasis";

export const dynamic = "force-dynamic";

export default async function AnforderungEinblickPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const anforderung = await getAnforderung(id).catch(() => null);
  if (!anforderung) notFound();
  return <AnforderungArtikel anforderung={anforderung} kompakt />;
}
