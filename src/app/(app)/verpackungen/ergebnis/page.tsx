import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RollenErgebnisKarte } from "@/components/rollen-ergebnis-karte";
import type { HerleitungsEintrag, RollenSet } from "@/lib/rollen-engine";
import { ladeAppConfig, ladeRollenBegriffe } from "@/lib/rollen-service";
import { createClient } from "@/lib/supabase/server";
import { erforderePaket } from "@/lib/zugang";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("verpackungen") };
}

export const dynamic = "force-dynamic";

/** Ergebnis-Screen des Mini-Wizards: das neue Rollen-Set genau einer Linie. */
export default async function VerpackungsErgebnisPage({
  searchParams,
}: {
  searchParams: Promise<{ name?: string; update?: string }>;
}) {
  const zugang = await erforderePaket();
  const params = await searchParams;
  const name = params.name?.trim();
  if (!name) redirect("/verpackungen");

  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profile")
    .select("id")
    .eq("user_id", zugang.user.id)
    .maybeSingle();
  if (!profil) redirect("/verpackungen");

  const { data: ergebnis } = await supabase
    .from("rollen_ergebnisse")
    .select("produktlinie, rollen_set, herleitung")
    .eq("profil_id", profil.id)
    .eq("produktlinie", name)
    .eq("aktuell", true)
    .maybeSingle();
  if (!ergebnis) redirect("/verpackungen");

  const t = await getTranslations("Verpackungen");
  const tOnboardingErgebnis = await getTranslations("OnboardingErgebnis");
  const begriffe = await ladeRollenBegriffe();
  const eskalationsText =
    (await ladeAppConfig("cattwyk_erstgespraech_hinweis")) ??
    tOnboardingErgebnis("eskalationFallback");

  return (
    <div className="mx-auto w-full max-w-3xl">
      <header className="mb-10 text-center">
        <h1 className="text-display-sm text-ink">
          {t("ergebnisTitel", { name })}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-body-lg text-ink-muted">
          {t("ergebnisUntertitel")}
        </p>
      </header>

      {params.update === "1" && (
        <p className="mb-6 rounded border border-gold bg-gold-tint px-4 py-3 text-body-sm text-gold-ink">
          {t("ergebnisUpdateHinweis")}
        </p>
      )}

      <RollenErgebnisKarte
        produktlinie={ergebnis.produktlinie as string}
        rollenSet={ergebnis.rollen_set as RollenSet}
        herleitung={ergebnis.herleitung as HerleitungsEintrag[]}
        eskalationsText={eskalationsText}
        begriffe={begriffe}
        offen
      />

      <div className="mt-10 flex flex-wrap items-center justify-center gap-6">
        <Link
          href="/verpackungen"
          className="inline-flex items-center gap-2 rounded bg-primary px-6 py-4 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
        >
          {t("ergebnisZurUebersicht")}
        </Link>
        <Link
          href="/dokumente/neu"
          className="text-body-sm font-medium text-legal hover:underline"
        >
          {t("ergebnisDokument")}
        </Link>
      </div>
    </div>
  );
}
