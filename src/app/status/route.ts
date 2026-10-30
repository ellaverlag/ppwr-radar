import { GET as healthGet } from "@/app/api/health/route";

/**
 * Öffentlicher Status-Endpunkt unter /status (außerhalb von /api, weil
 * manche Abruf-Dienste robots-Disallow auf /api/ strenger auslegen als die
 * Allow-Ausnahme). Gleicher Inhalt wie /api/health.
 */
export const dynamic = "force-dynamic";

export function GET() {
  return healthGet();
}
