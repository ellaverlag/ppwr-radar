import { NextResponse } from "next/server";
import { istComingSoon } from "@/lib/launch";
import { isPreviewMode } from "@/lib/preview";

/**
 * Öffentlicher Status-Endpunkt. Wird u. a. vom wöchentlichen Rechts-
 * monitoring abgefragt, um den Launch-Stand verlässlich zu erkennen
 * (Railway-Variablen sind über den Connector nicht lesbar).
 *   launch: "live" | "coming_soon"
 */
export const dynamic = "force-dynamic";

export function GET() {
  return NextResponse.json(
    {
      status: "ok",
      service: "ppwr-radar",
      launch: istComingSoon() ? "coming_soon" : "live",
      preview: isPreviewMode(),
      timestamp: new Date().toISOString(),
    },
    { headers: { "Cache-Control": "no-store" } }
  );
}
