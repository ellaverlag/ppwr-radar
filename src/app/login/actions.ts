"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

export async function loginWithMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();

  if (!email) {
    redirect("/login?error=missing_email");
  }

  const headerList = await headers();
  const origin = headerList.get("origin") ?? "http://localhost:3000";

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: {
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    console.error("Magic-Link-Versand fehlgeschlagen:", error.message);
    redirect("/login?error=send_failed");
  }

  redirect(`/login?sent=1&email=${encodeURIComponent(email)}`);
}
