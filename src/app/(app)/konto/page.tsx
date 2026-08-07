import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import { zahlungVerwalten } from "../dashboard/actions";
import { kontoLoeschen, stammdatenSpeichern } from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Konto");
  return { title: `${t("titel")} – PPWR Radar` };
}

export const dynamic = "force-dynamic";

const FEHLER_KEYS = ["firmenname", "bestaetigung", "loeschung", "stripe"] as const;

function Eingabe({
  name,
  label,
  wert,
  required = false,
  breite = "",
}: {
  name: string;
  label: string;
  wert: string | null | undefined;
  required?: boolean;
  breite?: string;
}) {
  return (
    <div className={breite}>
      <label htmlFor={name} className="block text-label uppercase text-ink-muted">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        id={name}
        name={name}
        type="text"
        required={required}
        defaultValue={wert ?? ""}
        className="mt-2 w-full rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink focus:border-ink focus:outline-none"
      />
    </div>
  );
}

export default async function KontoPage({
  searchParams,
}: {
  searchParams: Promise<{ gespeichert?: string; fehler?: string }>;
}) {
  const params = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [{ data: profil }, { data: abo }] = await Promise.all([
    supabase.from("profile").select("*").eq("user_id", user.id).maybeSingle(),
    supabase
      .from("subscriptions")
      .select("status, paket, laufzeit_ende, stripe_customer_id")
      .eq("user_id", user.id)
      .maybeSingle(),
  ]);

  const t = await getTranslations("Konto");
  const tFelder = await getTranslations("Onboarding.felder");
  const tOnboarding = await getTranslations("Onboarding");

  const fehlerKey = FEHLER_KEYS.find((key) => key === params.fehler);
  const aboAktiv = abo?.status === "active";

  return (
    <div className="max-w-3xl">
      <PageHeader title={t("titel")} description={t("beschreibung")} />

      {params.gespeichert === "1" && (
        <p className="mb-6 rounded border border-primary bg-primary/5 px-4 py-3 text-body-sm text-ink">
          {t("gespeichert")}
        </p>
      )}
      {fehlerKey && (
        <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
          {t(`fehler${fehlerKey.charAt(0).toUpperCase()}${fehlerKey.slice(1)}`)}
        </p>
      )}

      {/* Stammdaten */}
      <LegalCard>
        <form action={stammdatenSpeichern} className="p-6 md:p-8">
          <h2 className="text-headline text-ink">
            {tOnboarding("stammdatenTitel")}
          </h2>
          <p className="mt-2 text-body text-ink-muted">
            {tOnboarding("stammdatenText")}
          </p>
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-6">
            <Eingabe
              name="firmenname"
              label={tFelder("firmenname")}
              wert={profil?.firmenname}
              required
              breite="sm:col-span-6"
            />
            <Eingabe
              name="strasse"
              label={tFelder("strasse")}
              wert={profil?.strasse}
              breite="sm:col-span-4"
            />
            <Eingabe
              name="hausnummer"
              label={tFelder("hausnummer")}
              wert={profil?.hausnummer}
              breite="sm:col-span-2"
            />
            <Eingabe
              name="plz"
              label={tFelder("plz")}
              wert={profil?.plz}
              breite="sm:col-span-2"
            />
            <Eingabe
              name="ort"
              label={tFelder("ort")}
              wert={profil?.ort}
              breite="sm:col-span-4"
            />
            <Eingabe
              name="land"
              label={tFelder("land")}
              wert={profil?.land ?? "Deutschland"}
              breite="sm:col-span-6"
            />
            <Eingabe
              name="zeichnungsberechtigter_name"
              label={tFelder("zeichnungsberechtigterName")}
              wert={profil?.zeichnungsberechtigter_name}
              breite="sm:col-span-4"
            />
            <Eingabe
              name="zeichnungsberechtigter_funktion"
              label={tFelder("zeichnungsberechtigterFunktion")}
              wert={profil?.zeichnungsberechtigter_funktion}
              breite="sm:col-span-2"
            />
          </div>

          <fieldset className="mt-8">
            <legend className="text-label uppercase text-ink-muted">
              {tOnboarding("lucidFrage")}
            </legend>
            <div className="mt-3 flex gap-3">
              {(["ja", "nein"] as const).map((wert) => (
                <label
                  key={wert}
                  className="flex cursor-pointer items-center gap-3 rounded border border-line-strong px-5 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5"
                >
                  <input
                    type="radio"
                    name="war_verpackg_registriert"
                    value={wert}
                    defaultChecked={
                      profil?.war_verpackg_registriert === (wert === "ja")
                    }
                    className="h-4 w-4 accent-[#006950]"
                  />
                  <span className="text-body font-semibold">
                    {tOnboarding(wert === "ja" ? "ja" : "nein")}
                  </span>
                </label>
              ))}
            </div>
          </fieldset>

          <div className="mt-6">
            <Eingabe
              name="lucid_nummer"
              label={tFelder("lucidNummer")}
              wert={profil?.lucid_nummer}
            />
          </div>

          <button
            type="submit"
            className="mt-8 rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-colors hover:bg-primary-dark"
          >
            {t("speichern")}
          </button>
        </form>
        <LegalCardFooter>
          {t("hinweisVerpackungenVor")}{" "}
          <Link href="/verpackungen" className="underline hover:no-underline">
            {t("hinweisVerpackungenLink")}
          </Link>
          . {t("hinweisOnboardingVor")}{" "}
          <Link href="/onboarding" className="underline hover:no-underline">
            {t("hinweisOnboardingLink")}
          </Link>
          .
        </LegalCardFooter>
      </LegalCard>

      {/* Abo-Block */}
      {abo && (
        <LegalCard className="mt-8">
          <div className="p-6 md:p-8">
            <h2 className="text-headline text-ink">{t("aboTitel")}</h2>
            <dl className="mt-6 space-y-3 text-body">
              <div className="flex flex-wrap items-center gap-3">
                <dt className="font-semibold text-ink">
                  {abo.paket === "ppwr_ready" ? t("aboPaketPpwrReady") : abo.paket}
                </dt>
                <dd>
                  <Badge variant={aboAktiv ? "green" : "neutral"}>
                    {aboAktiv ? t("aboStatusAktiv") : t("aboStatusInaktiv")}
                  </Badge>
                </dd>
              </div>
              {abo.laufzeit_ende && (
                <div>
                  <dt className="inline text-ink-muted">{t("aboLaufzeit")}: </dt>
                  <dd className="inline font-semibold text-ink">
                    {formatDate(abo.laufzeit_ende)}
                  </dd>
                </div>
              )}
            </dl>
            {abo.stripe_customer_id && (
              <form action={zahlungVerwalten} className="mt-6">
                <button
                  type="submit"
                  className="rounded border border-ink bg-canvas px-6 py-3 text-label uppercase tracking-widest text-ink transition-colors hover:bg-surface"
                >
                  {t("aboPortalCta")}
                </button>
              </form>
            )}
          </div>
          <LegalCardFooter>{t("aboHinweis")}</LegalCardFooter>
        </LegalCard>
      )}

      {/* Konto löschen */}
      <section className="mt-12 rounded border border-line bg-canvas">
        <form action={kontoLoeschen} className="p-6 md:p-8">
          <h2 className="text-headline text-ink">{t("loeschenTitel")}</h2>
          <p className="mt-2 max-w-xl text-body-sm text-ink-muted">
            {t("loeschenText")}
          </p>
          {aboAktiv && (
            <p className="mt-4 max-w-xl border-l-4 border-gold bg-surface p-4 text-body-sm text-ink">
              {t("loeschenAboWarnung")}
            </p>
          )}
          <div className="mt-6 max-w-xs">
            <label
              htmlFor="bestaetigung"
              className="block text-label uppercase text-ink-muted"
            >
              {t("loeschenBestaetigungLabel")}
            </label>
            <input
              id="bestaetigung"
              name="bestaetigung"
              type="text"
              required
              autoComplete="off"
              placeholder="LÖSCHEN"
              className="mt-2 w-full rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink placeholder:text-ink-muted/40 focus:border-danger focus:outline-none"
            />
          </div>
          <button
            type="submit"
            className="mt-6 rounded border border-danger bg-canvas px-6 py-3 text-label uppercase tracking-widest text-danger transition-colors hover:bg-danger/5"
          >
            {t("loeschenCta")}
          </button>
        </form>
      </section>
    </div>
  );
}
