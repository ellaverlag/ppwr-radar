import { NextResponse } from "next/server";
import { signierteUrl } from "@/lib/dokumente/service";
import { basisUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";
import { pruefeZugang } from "@/lib/zugang";

/**
 * Download über kurzlebige signierte URL. Ownership: die dokumente-Zeile
 * ist per Own-Row-RLS nur für den Eigentümer lesbar; der Storage-Bucket
 * selbst bleibt ohne Policies (Zugriff nur via Service-Role).
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const basis = await basisUrl();
  const zugang = await pruefeZugang();
  if (!zugang) return NextResponse.redirect(`${basis}/login`);
  if (!zugang.freigeschaltet) {
    return NextResponse.redirect(`${basis}/dashboard?gesperrt=1`);
  }

  const { id } = await params;
  const format =
    new URL(request.url).searchParams.get("format") === "pdf" ? "pdf" : "docx";

  const supabase = await createClient();
  const { data: dokument } = await supabase
    .from("dokumente")
    .select("storage_path")
    .eq("id", id)
    .maybeSingle();
  if (!dokument) {
    return NextResponse.redirect(`${basis}/dokumente`);
  }

  const url = await signierteUrl(dokument.storage_path, format);
  if (!url) {
    return NextResponse.redirect(`${basis}/dokumente`);
  }
  return NextResponse.redirect(url);
}
