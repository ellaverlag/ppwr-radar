import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { basisUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth-Callback für Magic Links.
 *
 * Bevorzugter Weg ist der geräteunabhängige OTP-Link (`?token_hash=&type=`,
 * verifyOtp) – er funktioniert auch, wenn der Link in einem anderen Browser
 * oder auf einem anderen Gerät geöffnet wird als dem, das ihn angefordert
 * hat. Der PKCE-Weg (`?code=`, exchangeCodeForSession) bleibt als Fallback
 * unterstützt, scheitert bei Gerätewechsel aber systembedingt am fehlenden
 * code_verifier-Cookie (bad_code_verifier) – dann leiten wir mit einer
 * konkreten Fehlermeldung zurück zum Login.
 *
 * Ziel nach Login ist immer ein relativer `next`-Pfad (Default /dashboard).
 */
function sicheresZiel(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/dashboard";
}

/** Supabase-Fehlercode → Login-Fehlerschlüssel mit passender Meldung. */
function fehlerSchluessel(code: string | null | undefined): string {
  if (code === "bad_code_verifier") return "verifier";
  if (code === "otp_expired") return "expired";
  return "auth_failed";
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  // Nicht request.url verwenden: hinter dem Railway-Proxy zeigt die auf
  // localhost:{PORT} – die Basis-URL kommt zentral aus lib/site-url.
  const origin = await basisUrl();
  const code = searchParams.get("code");
  const tokenHash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = sicheresZiel(searchParams.get("next"));

  // Supabase kann Fehler bereits als Query mitgeben (z. B. abgelaufener
  // Link, der den Verify-Endpunkt gar nicht erst passiert hat)
  const verifyFehler = searchParams.get("error_code");
  if (verifyFehler && !code && !tokenHash) {
    return NextResponse.redirect(
      `${origin}/login?error=${fehlerSchluessel(verifyFehler)}`
    );
  }

  const supabase = await createClient();

  // Geräteunabhängig zuerst: token_hash braucht keinen lokalen Zustand
  if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error(
      "Magic-Link verifyOtp fehlgeschlagen:",
      error.code,
      error.message
    );
    return NextResponse.redirect(
      `${origin}/login?error=${fehlerSchluessel(error.code)}`
    );
  }

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
    console.error(
      "Magic-Link Code-Exchange fehlgeschlagen:",
      error.code,
      error.message
    );
    return NextResponse.redirect(
      `${origin}/login?error=${fehlerSchluessel(error.code)}`
    );
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
