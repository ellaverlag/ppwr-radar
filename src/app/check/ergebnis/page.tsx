import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { ersteinschaetzung } from "@/lib/check-einschaetzung";
import { evaluiereLinie, type LinienKontext, type RegelRow, type UnternehmenKontext } from "@/lib/rollen-engine";
import { ladeAppConfig, ladeRegeln } from "@/lib/rollen-service";
import { formatDate } from "@/lib/labels";
import { checkNeuStarten } from "../actions";
import { leseCheckAntworten } from "../check-config";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return {
    title: t("checkErgebnis"),
    robots: { index: false },
  };
}

export const dynamic = "force-dynamic";

function CheckZeile({ text }: { text: React.ReactNode }) {
  return (
    <li className="flex items-start gap-3">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#006950"
        strokeWidth="2"
        className="mt-1 h-5 w-5 shrink-0"
        aria-hidden="true"
      >
        <circle cx="12" cy="12" r="10" />
        <path d="m8 12 3 3 5-6" />
      </svg>
      <span className="text-body text-ink">{text}</span>
    </li>
  );
}

export default async function CheckErgebnisPage() {
  const antworten = await leseCheckAntworten();
  if (antworten.sitz == null || antworten.taetigkeit == null) {
    redirect("/check");
  }

  const t = await getTranslations("CheckErgebnis");
  const tLabels = await getTranslations("Labels");

  let regeln: RegelRow[] = [];
  try {
    regeln = await ladeRegeln();
  } catch {
    regeln = [];
  }
  if (regeln.length === 0) {
    return (
      <div className="rounded border border-line bg-canvas p-8 text-center">
        <p className="text-body text-ink-muted">{t("nichtVerfuegbar")}</p>
        <Link href="/check" className="mt-6 inline-block text-body-sm font-medium text-legal hover:underline">
          {t("zurueckZumCheck")}
        </Link>
      </div>
    );
  }

  const sitz = (antworten.sitz as string) ?? "DE";
  const unternehmen: UnternehmenKontext = {
    sitz: sitz as UnternehmenKontext["sitz"],
    niederlassungDE: sitz === "DE",
    kleinstunternehmen: false,
  };
  const taetigkeit = Array.isArray(antworten.taetigkeit) ? antworten.taetigkeit : [];
  const linie: LinienKontext = {
    name: "Ihre Angaben",
    verpackungsart: Array.isArray(antworten.verpackungsart) ? antworten.verpackungsart : [],
    taetigkeit,
    marke: null,
    lieferantSitz: null,
    ersteBereitstellung: null,
    vertriebsweg: Array.isArray(antworten.vertriebsweg) ? antworten.vertriebsweg : [],
    istEndabnehmer: null,
    dienstleistungen: [],
    lebensmittelkontakt: antworten.lebensmittelkontakt === "ja",
  };

  const ergebnis = evaluiereLinie(regeln, unternehmen, linie);
  const rollen = ergebnis.rollen_set.rollen;
  const pflichten = ergebnis.rollen_set.pflichten;
  const { stufe, unklar } = ersteinschaetzung(ergebnis, taetigkeit);
  const aussage = t(`aussage.${stufe}`);

  const rollenLabel = (rolle: string) =>
    tLabels.has(`rollen.${rolle}`) ? tLabels(`rollen.${rolle}`) : rolle;

  const pflichtenTeaser: string[] = [];
  if (rollen.includes("erzeuger")) {
    pflichtenTeaser.push(t("pflichtenTeaser.konformitaet"));
  }
  if (
    pflichten.some((p) =>
      ["registrierung_zsvr", "systembeteiligung", "datenmeldung"].includes(p)
    )
  ) {
    pflichtenTeaser.push(t("pflichtenTeaser.registrierung"));
  }
  if (pflichten.includes("bevollmaechtigter_ehv")) {
    pflichtenTeaser.push(t("pflichtenTeaser.bevollmaechtigter"));
  }

  const eskalationsText =
    (await ladeAppConfig("cattwyk_erstgespraech_hinweis")) ??
    t("eskalationFallback");
  const heute = new Date().toISOString().slice(0, 10);

  return (
    <>
      <header className="mb-10 text-center">
        <h1 className="font-plex text-display-sm tracking-[-0.04em] text-ink">
          {t("titel")}
        </h1>
        <p className="mt-3 text-body-lg text-ink-muted">{t("untertitel")}</p>
      </header>

      <div className="rounded border border-line bg-canvas">
        <div className="p-6 md:p-8">
          {unklar ? (
            <div className="border-l-4 border-line-strong bg-surface p-5">
              <h2 className="text-label uppercase text-ink-muted">
                {t("einordnungOffen")}
              </h2>
              <p className="mt-2 text-body text-ink">{eskalationsText}</p>
            </div>
          ) : (
            <>
              <div className="flex items-start gap-4 border border-line bg-surface p-5">
                <span
                  aria-hidden="true"
                  className={`mt-1.5 h-3.5 w-3.5 shrink-0 rounded-full ${
                    stufe === "hoch"
                      ? "bg-gold"
                      : stufe === "mittel"
                        ? "bg-gold"
                        : "bg-primary"
                  }`}
                />
                <p className="text-body-lg font-bold text-ink">{aussage}</p>
              </div>

              <ul className="mt-8 space-y-4">
                {rollen.length > 0 && (
                  <CheckZeile
                    text={
                      <>
                        {t("rolleVor")}{" "}
                        <b>{rollen.map(rollenLabel).join(", ")}</b>
                      </>
                    }
                  />
                )}
                {pflichtenTeaser.length > 0 && (
                  <CheckZeile
                    text={
                      <>
                        {t("pflichtenVor")} <b>{pflichtenTeaser.join(", ")}</b>
                      </>
                    }
                  />
                )}
                <li className="flex items-start gap-3">
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="#767676"
                    strokeWidth="2"
                    className="mt-1 h-5 w-5 shrink-0"
                    aria-hidden="true"
                  >
                    <rect x="5" y="11" width="14" height="9" rx="1" />
                    <path d="M8 11V8a4 4 0 0 1 8 0v3" />
                  </svg>
                  <span
                    aria-hidden="true"
                    className="select-none text-body text-ink-muted blur-[3px]"
                  >
                    {t("gesperrtBlur")}
                  </span>
                  <span className="sr-only">{t("gesperrtSr")}</span>
                </li>
              </ul>
            </>
          )}
        </div>
        <div className="border-t border-line p-4 font-mono text-mono-sm uppercase text-legal">
          {t("rechtsstandZeile", { datum: formatDate(heute) })}
        </div>
      </div>

      {/* Paywall-CTA */}
      <div className="mt-12 text-center">
        <h2 className="font-plex text-headline tracking-[-0.04em] text-ink">
          {t("paywallTitel")}
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-body text-ink-muted">
          {t("paywallText")}
        </p>
        {/* TODO: Stripe-Link – Checkout kommt als eigenes Paket */}
        <Link
          href="/login"
          data-stripe="paket"
          className="mt-8 inline-flex items-center gap-2 rounded bg-primary px-8 py-4 text-body-lg font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          {t("paywallCta")}
        </Link>
        <div className="mt-4">
          <Link
            href="/#preise"
            className="text-body-sm font-medium text-legal hover:underline"
          >
            {t("mehrErfahren")}
          </Link>
        </div>
        <form action={checkNeuStarten} className="mt-8">
          <button
            type="submit"
            className="text-body-sm font-medium text-ink-muted hover:text-ink"
          >
            {t("neuStarten")}
          </button>
        </form>
      </div>
    </>
  );
}
