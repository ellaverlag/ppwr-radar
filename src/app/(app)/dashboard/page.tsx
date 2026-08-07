import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { ChatIcon, PlusIcon } from "@/components/icons";
import {
  LegalCard,
  LegalCardFooter,
  PrimaryButtonLink,
  SecondaryButtonLink,
  TrafficDot,
} from "@/components/ui";
import type { RollenSet } from "@/lib/rollen-engine";
import { formatDate } from "@/lib/labels";
import { ladePpwrNews, ladePpwrVideos, ladeUpdateMemos } from "@/lib/radar";
import { ladeStatusAnalyse } from "@/lib/status-analyse";
import { anforderungUrl } from "@/lib/wissen-links";
import { createClient } from "@/lib/supabase/server";
import { pruefeZugang } from "@/lib/zugang";
import { AenderungslogKarte, AktuellesBereich } from "./radar-module";
import { Vorzimmer } from "./vorzimmer";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("dashboard") };
}

export const dynamic = "force-dynamic";

interface ErgebnisZeile {
  id: string;
  produktlinie: string;
  rollen_set: RollenSet;
}

export default async function DashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ gesperrt?: string; checkout?: string }>;
}) {
  const params = await searchParams;

  // Vorzimmer: ohne aktives Paket (und ohne Admin-Bypass) zeigt das
  // Dashboard die gesperrte Variante mit Freischalten-Karte.
  const zugang = await pruefeZugang();
  if (zugang && !zugang.freigeschaltet) {
    return (
      <Vorzimmer
        userId={zugang.user.id}
        hatStripeKunde={Boolean(zugang.stripeCustomerId)}
        zeigeGesperrtHinweis={params.gesperrt === "1"}
        zeigeCheckoutFehler={params.checkout === "fehler"}
      />
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const t = await getTranslations("Dashboard");
  const tLabels = await getTranslations("Labels");

  const { data: profil } = user
    ? await supabase
        .from("profile")
        .select("id, onboarding_abgeschlossen")
        .eq("user_id", user.id)
        .maybeSingle()
    : { data: null };

  let ergebnisse: ErgebnisZeile[] = [];
  if (profil?.onboarding_abgeschlossen) {
    const { data } = await supabase
      .from("rollen_ergebnisse")
      .select("id, produktlinie, rollen_set")
      .eq("profil_id", profil.id)
      .order("erstellt_am", { ascending: true });
    ergebnisse = (data ?? []) as ErgebnisZeile[];
  }
  const onboardingFertig = Boolean(profil?.onboarding_abgeschlossen);
  const analyse = onboardingFertig ? await ladeStatusAnalyse() : null;

  const rollenLabel = (rolle: string) =>
    tLabels.has(`rollen.${rolle}`) ? tLabels(`rollen.${rolle}`) : rolle;

  const schritteTexte = t.raw("schritte") as { titel: string; text: string }[];
  const schritte = schritteTexte.map((schritt, i) => ({
    nr: String(i + 1).padStart(2, "0"),
    ...schritt,
    erledigt: i < 2 ? onboardingFertig : false,
  }));

  // Nach dem Onboarding speisen sich die nächsten Schritte aus der
  // Status-Analyse: die drei dringendsten offenen Anforderungen.
  const offeneSchritte = (analyse?.zutreffend ?? [])
    .filter((zeile) => zeile.status === "offen")
    .slice(0, 3);

  const [memos, news, videos] = await Promise.all([
    ladeUpdateMemos(),
    ladePpwrNews(),
    ladePpwrVideos(),
  ]);

  return (
    <>
      <header className="mb-10">
        <h1 className="sr-only">{t("titel")}</h1>
        <div className="flex flex-wrap gap-4">
          {!onboardingFertig ? (
            <>
              <PrimaryButtonLink href="/onboarding">
                <span>{t("onboardingStarten")}</span>
              </PrimaryButtonLink>
              <SecondaryButtonLink href="/assistant">
                <ChatIcon className="h-4 w-4" />
                <span>{t("assistantFragen")}</span>
              </SecondaryButtonLink>
            </>
          ) : (
            <>
              <PrimaryButtonLink href="/dokumente">
                <PlusIcon className="h-4 w-4" />
                <span>{t("neuesDokument")}</span>
              </PrimaryButtonLink>
              <SecondaryButtonLink href="/assistant">
                <ChatIcon className="h-4 w-4" />
                <span>{t("assistantFragen")}</span>
              </SecondaryButtonLink>
            </>
          )}
        </div>
      </header>

      {/* Status-Leiste */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
        <LegalCard>
          <div className="flex-1 p-6">
            <h2 className="mb-8 text-headline text-ink">{t("statusTitel")}</h2>
            {analyse ? (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-line-strong pb-2">
                    <span className="text-body-lg text-ink-muted">
                      {t("statusZutreffend")}
                    </span>
                    <span className="text-body-lg font-bold text-ink">
                      {analyse.zahlen.gesamt}
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line-strong pb-2">
                    <span className="text-body-lg text-ink-muted">
                      {t("statusErledigt")}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-body-lg font-bold text-ink">
                        {analyse.zahlen.erledigt}
                      </span>
                      <TrafficDot
                        color={analyse.zahlen.erledigt > 0 ? "green" : "dim"}
                      />
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line-strong pb-2">
                    <span className="text-body-lg text-ink-muted">
                      {t("statusInBearbeitung")}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-body-lg font-bold text-ink">
                        {analyse.zahlen.inBearbeitung}
                      </span>
                      <TrafficDot
                        color={
                          analyse.zahlen.inBearbeitung > 0 ? "gold" : "dim"
                        }
                      />
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line-strong pb-2">
                    <span className="text-body-lg text-ink-muted">
                      {t("statusKritisch")}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-body-lg font-bold text-ink">
                        {analyse.zahlen.kritisch}
                      </span>
                      <TrafficDot
                        color={analyse.zahlen.kritisch > 0 ? "red" : "dim"}
                      />
                    </span>
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-body-lg text-ink-muted">
                      {t("statusVormerkung")}
                    </span>
                    <span className="flex items-center gap-2">
                      <span className="text-body-lg font-bold text-ink">
                        {analyse.zahlen.vormerkung}
                      </span>
                      <TrafficDot color="dim" />
                    </span>
                  </div>
                </div>
                <p className="mt-6 text-body-sm text-ink-muted">
                  {t("statusHinweisMitOnboarding", {
                    anzahl: analyse.zahlen.gesamt,
                  })}
                </p>
                <Link
                  href="/dashboard/status"
                  className="mt-3 inline-block text-body-sm font-medium text-legal hover:underline"
                >
                  {t("statusAnsehen")}
                </Link>
              </>
            ) : (
              <>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-line-strong pb-2">
                    <span className="text-body-lg text-ink-muted">
                      {t("statusVollstaendig")}
                    </span>
                    <span className="flex gap-1">
                      <TrafficDot color="dim" />
                      <TrafficDot color="dim" />
                      <TrafficDot color="dim" />
                    </span>
                  </div>
                  <div className="flex items-center justify-between border-b border-line-strong pb-2">
                    <span className="text-body-lg text-ink-muted">
                      {t("statusOffen")}
                    </span>
                    <TrafficDot color="dim" />
                  </div>
                  <div className="flex items-center justify-between pb-2">
                    <span className="text-body-lg text-ink-muted">
                      {t("statusInBearbeitung")}
                    </span>
                    <TrafficDot color="dim" />
                  </div>
                </div>
                <p className="mt-6 text-body-sm text-ink-muted">
                  {t("statusHinweisOhneOnboarding")}
                </p>
              </>
            )}
          </div>
          <LegalCardFooter>{t("statusFooter")}</LegalCardFooter>
        </LegalCard>

        <LegalCard>
          <div className="flex-1 p-6">
            <h2 className="mb-8 text-headline text-ink">{t("rollenTitel")}</h2>
            {!onboardingFertig ? (
              <>
                <p className="text-body text-ink-muted">{t("rollenLeer")}</p>
                <Link
                  href="/onboarding"
                  className="mt-6 inline-flex items-center rounded bg-primary px-5 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                >
                  {t("rollenOnboardingCta")}
                </Link>
              </>
            ) : (
              <div className="space-y-6">
                {ergebnisse.map((zeile, i) => (
                  <div
                    key={zeile.id}
                    className={
                      i > 0 ? "border-t border-line-strong pt-4" : undefined
                    }
                  >
                    <h3 className="mb-2 text-body font-bold text-ink-muted">
                      {zeile.produktlinie}
                    </h3>
                    <div className="flex flex-wrap gap-2">
                      {zeile.rollen_set.unklar ? (
                        <Badge variant="gold">{t("einordnungOffen")}</Badge>
                      ) : (
                        zeile.rollen_set.rollen.map((rolle) => (
                          <Badge key={rolle} variant="blue">
                            {rollenLabel(rolle)}
                          </Badge>
                        ))
                      )}
                    </div>
                  </div>
                ))}
                <Link
                  href="/onboarding/ergebnis"
                  className="inline-block text-body-sm font-medium text-legal hover:underline"
                >
                  {t("herleitungAnsehen")}
                </Link>
              </div>
            )}
          </div>
          <LegalCardFooter>{t("rollenFooter")}</LegalCardFooter>
        </LegalCard>

        <LegalCard>
          <div className="flex-1 p-6">
            <h2 className="mb-8 text-headline text-ink">{t("fristenTitel")}</h2>
            <div className="relative mx-2 mt-12 h-0.5 bg-line">
              <span className="absolute -top-[5px] left-0 h-3 w-3 rounded-full border-2 border-white bg-gold shadow-[0_0_0_1px_#1b1b1b]" />
              <span className="absolute -top-[5px] left-1/2 h-3 w-3 -translate-x-1/2 rounded-full bg-ink" />
              <span className="absolute -top-[5px] right-0 h-3 w-3 rounded-full bg-ink" />
              <div className="absolute left-0 top-4 -translate-x-1/4 text-center">
                <div className="text-label font-bold uppercase text-gold-ink">
                  {t("fristGeltungDatum")}
                </div>
                <div className="text-body-sm text-ink-muted">
                  {t("fristGeltung")}
                </div>
              </div>
              <div className="absolute left-1/2 top-4 -translate-x-1/2 text-center">
                <div className="text-label uppercase">{t("fristStufe2Jahr")}</div>
                <div className="text-body-sm text-ink-muted">
                  {t("fristStufe2")}
                </div>
              </div>
              <div className="absolute right-0 top-4 translate-x-1/4 text-center">
                <div className="text-label uppercase">{t("fristStufe3Jahr")}</div>
                <div className="text-body-sm text-ink-muted">
                  {t("fristStufe3")}
                </div>
              </div>
            </div>
            <div className="mt-20 border-t border-line-strong pt-4">
              <p className="text-body-sm text-ink-muted">
                <span className="font-bold text-ink">{t("naechsteFrist")}</span>{" "}
                {t("naechsteFristText")}
              </p>
            </div>
          </div>
          <LegalCardFooter>{t("fristenFooter")}</LegalCardFooter>
        </LegalCard>
      </div>

      {/* Meine nächsten Schritte */}
      <LegalCard className="mt-6">
        <div className="flex-1 p-6">
          <h2 className="mb-8 text-headline text-ink">{t("schritteTitel")}</h2>
          {analyse && analyse.zahlen.gesamt > 0 ? (
            offeneSchritte.length === 0 ? (
              <p className="text-body text-ink-muted">
                {t("schritteAlleErledigt")}
              </p>
            ) : (
              <ol className="space-y-6 border-l border-line-strong pl-6">
                {offeneSchritte.map((zeile, i) => (
                  <li key={zeile.anforderung.id} className="flex gap-4">
                    <span className="font-mono text-mono-sm text-ink-muted">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <h3 className="flex flex-wrap items-center gap-2 text-label uppercase text-ink">
                        <span>{zeile.anforderung.titel}</span>
                        <Badge
                          variant={
                            zeile.anforderung.gilt_status === "in_kraft"
                              ? "red"
                              : "gold"
                          }
                        >
                          {tLabels(
                            `giltStatus.${zeile.anforderung.gilt_status}`
                          )}
                          {zeile.anforderung.gilt_ab
                            ? ` · ${formatDate(zeile.anforderung.gilt_ab)}`
                            : ""}
                        </Badge>
                      </h3>
                      {zeile.anforderung.kurzerklaerung && (
                        <p className="mt-1 text-body-sm text-ink-muted">
                          {zeile.anforderung.kurzerklaerung}
                        </p>
                      )}
                      <Link
                        href={anforderungUrl(zeile.anforderung.id)}
                        className="mt-1 inline-block text-body-sm font-medium text-legal hover:underline"
                      >
                        {t("schrittZurAnforderung")}
                      </Link>
                    </div>
                  </li>
                ))}
              </ol>
            )
          ) : (
            <ol className="space-y-6 border-l border-line-strong pl-6">
              {schritte.map((schritt) => (
                <li key={schritt.nr} className="flex gap-4">
                  <span className="font-mono text-mono-sm text-ink-muted">
                    {schritt.nr}
                  </span>
                  <div>
                    <h3 className="flex flex-wrap items-center gap-2 text-label uppercase text-ink">
                      <span>{schritt.titel}</span>
                      {schritt.erledigt && (
                        <Badge variant="green">{t("erledigt")}</Badge>
                      )}
                    </h3>
                    <p className="mt-1 text-body-sm text-ink-muted">
                      {schritt.text}
                    </p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
        <LegalCardFooter>{t("schritteFooter")}</LegalCardFooter>
      </LegalCard>

      {/* Radar-Änderungslog + PJ-Inhalte */}
      <AenderungslogKarte memos={memos} gesperrt={false} />
      <AktuellesBereich news={news} videos={videos} />
    </>
  );
}
