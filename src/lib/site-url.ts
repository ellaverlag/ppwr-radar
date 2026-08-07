import "server-only";

import { headers } from "next/headers";

/**
 * Kanonische Basis-URL für server-seitig gebaute absolute Selbst-URLs
 * (Magic-Link-Redirects, Stripe success/cancel, Auth-Redirects).
 *
 * Darf NIE auf localhost:{PORT} des Serverprozesses zurückfallen (Railway
 * bindet intern z. B. Port 8080). Reihenfolge:
 *   1. NEXT_PUBLIC_SITE_URL aus der Env
 *   2. x-forwarded-proto + x-forwarded-host (Railway-/Proxy-Header)
 *   3. http://localhost:3000 (nur lokale Entwicklung)
 */
export function basisUrlAus(
  envWert: string | undefined,
  header: (name: string) => string | null
): string {
  if (envWert) return envWert.replace(/\/+$/, "");

  const host = header("x-forwarded-host") ?? header("host");
  if (host && !/^localhost(:\d+)?$|^127\.0\.0\.1(:\d+)?$/.test(host)) {
    const proto = header("x-forwarded-proto") ?? "https";
    return `${proto}://${host}`;
  }

  return "http://localhost:3000";
}

export async function basisUrl(): Promise<string> {
  const headerList = await headers();
  return basisUrlAus(process.env.NEXT_PUBLIC_SITE_URL, (name) =>
    headerList.get(name)
  );
}
