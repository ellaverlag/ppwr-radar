import { NextResponse } from "next/server";
import type { EmailOtpType } from "@supabase/supabase-js";
import { basisUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

/**
 * Auth-Callback für Magic Links.
 * Unterstützt beide Supabase-Varianten: PKCE (`?code=`) und
 * OTP-Links (`?token_hash=&type=`). Ziel nach Login ist immer ein
 * relativer `next`-Pfad (Default /dashboard) – nie eine fremde URL.
 */
function sicheresZiel(next: string | null): string {
  if (next && next.startsWith("/") && !next.startsWith("//")) {
    return next;
  }
  return "/dashboard";
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

  const supabase = await createClient();

  if (code) {
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  } else if (tokenHash && type) {
    const { error } = await supabase.auth.verifyOtp({
      type,
      token_hash: tokenHash,
    });
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth_failed`);
}
