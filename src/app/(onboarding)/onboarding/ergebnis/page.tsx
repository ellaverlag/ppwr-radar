import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
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
    .order("erstellt_am", { ascending: true });
  const ergebnisse = (rows ?? []) as ErgebnisRow[];

  if (ergebnisse.length === 0) redirect("/onboarding");

  const t = await getTranslations("OnboardingErgebnis");
  const tLabels = await getTranslations("Labels");

  const begriffe = await ladeRollenBegriffe();
  const label = (rolle: string) =>
    begriffe[rolle]?.begriff_de ??
    (tLabels.has(`rollen.${rolle}`) ? tLabels(`rollen.${rolle}`) : rolle);
  const istRolle = (wert: string) => tLabels.has(`rollen.${wert}`);
  const istPflicht = (wert: string) => tLabels.has(`pflichten.${wert}`);
  const istEntlastung = (wert: string) => tLabels.has(`entlastungen.${wert}`);

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
          <div key={ergebnis.id} className="rounded border border-line bg-canvas">
            {ergebnis.rollen_set.unklar ? (
              <div className="p-6">
                <p className="text-label uppercase tracking-widest text-ink-muted">
                  {t("produktlinie")}
                </p>
                <h2 className="mt-1 text-headline text-ink">
                  {ergebnis.produktlinie}
                </h2>
                <div className="mt-6 border-l-4 border-line-strong bg-surface p-5">
                  <h3 className="text-label uppercase text-ink-muted">
                    {t("einordnungOffen")}
                  </h3>
                  <p className="mt-2 text-body text-ink">{eskalationsText}</p>
                </div>
              </div>
            ) : (
              <details className="group">
                <summary className="flex cursor-pointer list-none flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between [&::-webkit-details-marker]:hidden">
                  <div>
                    <p className="text-label uppercase tracking-widest text-ink-muted">
                      {t("produktlinie")}
                    </p>
                    <h2 className="mt-1 text-headline text-ink">
                      {ergebnis.produktlinie}
                    </h2>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {ergebnis.rollen_set.rollen.map((rolle) => (
                      <Badge key={rolle} variant="blue">
                        {label(rolle)}
                      </Badge>
                    ))}
                    {ergebnis.rollen_set.vorbehalt && (
                      <Badge variant="neutral">{t("vorbehalt")}</Badge>
                    )}
                    <span
                      aria-hidden="true"
                      className="ml-1 text-ink-muted transition-transform group-open:rotate-180"
                    >
                      ▾
                    </span>
                  </div>
                </summary>

                <div className="border-t border-line-strong px-6 pb-6">
                  {ergebnis.herleitung.map((schritt) => (
                    <div
                      key={schritt.regel_id}
                      className="mt-6 border-l border-line-strong pl-4"
                    >
                      <p className="text-body text-ink">
                        <span className="font-semibold">
                          {t("sieGeltenAls", {
                            rollen:
                              schritt.ergebnis
                                .filter(istRolle)
                                .map(label)
                                .join(" und ") || t("betroffen"),
                          })}
                        </span>{" "}
                        {t("weil", {
                          grund: schritt.erlaeuterung ?? t("sieheFundstelle"),
                        })}
                      </p>
                      {schritt.ergebnis.some(istPflicht) && (
                        <ul className="mt-2 space-y-1">
                          {schritt.ergebnis.filter(istPflicht).map((p) => (
                            <li key={p} className="text-body-sm text-ink-muted">
                              {t("pflichtPrefix", {
                                pflicht: tLabels(`pflichten.${p}`),
                              })}
                            </li>
                          ))}
                        </ul>
                      )}
                      {schritt.ergebnis.some(istEntlastung) && (
                        <ul className="mt-2 space-y-1">
                          {schritt.ergebnis.filter(istEntlastung).map((p) => (
                            <li key={p} className="text-body-sm text-ink-muted">
                              {t("entlastungPrefix", {
                                entlastung: tLabels(`entlastungen.${p}`),
                              })}
                            </li>
                          ))}
                        </ul>
                      )}
                      <div className="mt-3 flex flex-wrap gap-2">
                        <Badge variant="blue">{schritt.fundstelle_primaer}</Badge>
                        {schritt.fundstelle_sekundaer && (
                          <Badge variant="neutral" title={t("sekundaerquelle")}>
                            {schritt.fundstelle_sekundaer.length > 60
                              ? `${schritt.fundstelle_sekundaer.slice(0, 57)}…`
                              : schritt.fundstelle_sekundaer}
                          </Badge>
                        )}
                        {schritt.vorbehalt && (
                          <Badge variant="neutral">{t("vorbehalt")}</Badge>
                        )}
                      </div>
                    </div>
                  ))}

                  {ergebnis.rollen_set.pflichten.length > 0 && (
                    <div className="mt-6 border-l-4 border-gold bg-surface p-4">
                      <h3 className="text-label uppercase text-gold-ink">
                        {t("pflichtenTitel")}
                      </h3>
                      <ul className="mt-2 space-y-1">
                        {ergebnis.rollen_set.pflichten.map((p) => (
                          <li key={p} className="text-body-sm text-ink">
                            {istPflicht(p) ? tLabels(`pflichten.${p}`) : p}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </details>
            )}
          </div>
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
