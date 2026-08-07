import { NextResponse } from "next/server";
import { basisUrl } from "@/lib/site-url";
import { createClient } from "@/lib/supabase/server";

export async function POST() {
  const supabase = await createClient();
  await supabase.auth.signOut();

  const origin = await basisUrl();
  return NextResponse.redirect(`${origin}/login`, { status: 302 });
}
