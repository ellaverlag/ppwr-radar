"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { SITE_URL } from "@/lib/site";
import { createClient } from "@/lib/supabase/server";

/** Nur relative Pfade als Login-Ziel zulassen; "dashboard" → "/dashboard". */
function sicheresZiel(roh: string): string {
  const next = roh.startsWith("/") ? roh : `/${roh}`;
  if (roh === "" || next.startsWith("//") || !/^\/[\w/-]*$/.test(next)) {
    return "/dashboard";
  }
  return next;
}

export async function loginWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  const next = sicheresZiel(String(formData.get("next") ?? ""));

  if (!email) {
    redirect("/login?error=missing_email");
  }

  const headerList = await headers();
  const origin = headerList.get("origin") ?? SITE_URL;

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      // next explizit in den Callback-Link einbetten: Landet der Link doch
      // auf der Site-URL statt im Callback (Supabase-Fallback), reicht die
      // Landingpage code+next an /auth/callback weiter.
      emailRedirectTo: `${origin}/auth/callback?next=${encodeURIComponent(next)}`,
    },
  });

  if (error) {
    console.error("Magic-Link-Versand fehlgeschlagen:", error.message);
    redirect("/login?error=send_failed");
  }

  redirect(`/login?sent=1&email=${encodeURIComponent(email)}`);
}
