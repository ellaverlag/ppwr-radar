import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { RollenErgebnisKarte } from "@/components/rollen-ergebnis-karte";
import { formatDate } from "@/lib/labels";
import type { HerleitungsEintrag, RollenSet } from "@/lib/rollen-engine";
import { ladeAppConfig, ladeRollenBegriffe } from "@/lib/rollen-service";
import { createClient } from "@/lib/supabase/server";
import { erforderePaket } from "@/lib/zugang";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("onboardingErgebnis") };
}

export const dynamic = "force-dynamic";

interface ErgebnisRow {
  id: string;
  produktlinie: string;
  rollen_set: RollenSet;
  herleitung: HerleitungsEintrag[];
  rechtsstand: string;
  engine_version: string;
}

export default async function ErgebnisPage() {
  await erforderePaket();
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profil } = await supabase
    .from("profile")
    .select("id, onboarding_abgeschlossen")
    .eq("user_id", user.id)
    .maybeSingle();
  if (!profil) redirect("/onboarding");

  const { data: rows } = await supabase
    .from("rollen_ergebnisse")
    .select("*")
    .eq("profil_id", profil.id)
    .eq("aktuell", true)
    .order("erstellt_am", { ascending: true });
  const ergebnisse = (rows ?? []) as ErgebnisRow[];

  if (ergebnisse.length === 0) redirect("/onboarding");

  const t = await getTranslations("OnboardingErgebnis");

  const begriffe = await ladeRollenBegriffe();

  const eskalationsText =
    (await ladeAppConfig("cattwyk_erstgespraech_hinweis")) ??
    t("eskalationFallback");

  const verwechslungsText = begriffe["erzeuger"]?.verwechslungsfaelle;
  const zeigeFalle = ergebnisse.some(
    (e) =>
      e.rollen_set.rollen.includes("erzeuger") ||
      e.rollen_set.rollen.includes("hersteller")
  );

  const irgendeinVorbehalt = ergebnisse.some((e) => e.rollen_set.vorbehalt);
  const stand = ergebnisse[0];

  return (
    <>
      <header className="mb-12 text-center">
        <h1 className="text-display-sm text-ink lg:text-display">
          {t("titel")}
        </h1>
        <p className="mx-auto mt-4 max-w-lg text-body-lg text-ink-muted">
          {t("untertitel")}
        </p>
      </header>

      <div className="flex flex-col gap-6">
        {ergebnisse.map((ergebnis) => (
          <RollenErgebnisKarte
            key={ergebnis.id}
            produktlinie={ergebnis.produktlinie}
            rollenSet={ergebnis.rollen_set}
            herleitung={ergebnis.herleitung}
            eskalationsText={eskalationsText}
            begriffe={begriffe}
          />
        ))}
      </div>

      {zeigeFalle && verwechslungsText && (
        <div className="mt-8 rounded border border-line bg-canvas">
          <div className="border-l-4 border-gold p-6">
            <h2 className="text-label uppercase text-gold-ink">
              {t("falleTitel")}
            </h2>
            <p className="mt-3 whitespace-pre-line text-body text-ink">
              {verwechslungsText}
            </p>
          </div>
        </div>
      )}

      <div className="mt-12 flex justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded bg-primary px-6 py-4 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
        >
          {t("zurStatusAnalyse")}
        </Link>
      </div>

      <p className="mt-10 border-t border-line pt-4 text-center font-mono text-mono-sm uppercase text-legal">
        {irgendeinVorbehalt ? t("fussUngeprueft") : ""}
        {t("fussZeile", {
          version: stand.engine_version,
          datum: formatDate(stand.rechtsstand),
        })}
      </p>
    </>
  );
}
