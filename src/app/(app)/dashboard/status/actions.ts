"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

const STATUS_WERTE = ["offen", "in_bearbeitung", "erledigt"] as const;

/** Bearbeitungsstatus einer Anforderung setzen (own-row per RLS). */
export async function statusSetzen(formData: FormData): Promise<void> {
  const nr = Number(formData.get("anforderung_nr"));
  const status = String(formData.get("status"));
  if (
    !Number.isInteger(nr) ||
    !STATUS_WERTE.includes(status as (typeof STATUS_WERTE)[number])
  ) {
    return;
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return;

  const { data: profil } = await supabase
    .from("profile")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profil) return;

  await supabase.from("anforderungs_status").upsert(
    {
      profil_id: profil.id,
      anforderung_nr: nr,
      status,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "profil_id,anforderung_nr" }
  );

  revalidatePath("/dashboard/status");
  revalidatePath("/dashboard");
}
