import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import {
  BookOpen,
  CalendarClock,
  FileText,
  MessageCircleQuestion,
  Radar,
  Users,
  type LucideIcon,
} from "lucide-react";
import { landingFontClasses } from "@/app/landing-fonts";
import { HeroRotator } from "@/app/hero-rotator";
import { BrandLink } from "@/components/brand";
import { interesseEintragen } from "./coming-soon-actions";

/**
 * Coming-Soon-Fassung der Startseite (LAUNCH_MODE ≠ live, kein Login):
 * Logo, animierte Headline und die fünf Leistungssäulen bleiben sichtbar
 * (Vorfreude + SEO), alle Login-/Kauf-CTAs entfallen. Statt dessen ein
 * prominenter Start-Hinweis mit optionaler Benachrichtigungs-Vormerkung.
 * Der Betroffenheits-Check bleibt bewusst offen (kostenloser Teaser).
 */

const SAEULEN_ICONS: LucideIcon[] = [
  Users,
  Radar,
  FileText,
  BookOpen,
  MessageCircleQuestion,
];
const SAEULEN_SPANS = [
  "md:col-span-7",
  "md:col-span-5",
  "md:col-span-4",
  "md:col-span-4",
  "md:col-span-4",
];

export async function ComingSoonLanding({
  vormerken,
}: {
  vormerken?: string;
}) {
  const t = await getTranslations("Landing");
  const tc = await getTranslations("Landing.comingSoon");

  const rotationsPhrasen = t.raw("hero.rotationsPhrasen") as string[];
  const saeulen = t.raw("leistungen.saeulen") as {
    schritt: string;
    titel: string;
    text: string;
    tag: string;
  }[];

  return (
    <div className={`${landingFontClasses} bg-canvas text-ink`}>
      {/* Header – nur Marke, keine Login-/Kauf-CTAs */}
      <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6">
          <BrandLink href="/" priority />
          <span className="inline-flex items-center gap-2 rounded border border-[#f0dfa0] bg-gold-tint px-3 py-1.5 font-mono text-mono-sm font-medium text-gold-ink">
            <CalendarClock aria-hidden="true" className="h-4 w-4" />
            {tc("headerBadge")}
          </span>
        </div>
      </header>

      {/* Hero mit Start-Hinweis statt CTAs */}
      <section className="border-b border-line bg-[radial-gradient(120%_90%_at_88%_-10%,#e6f0ec_0%,rgba(230,240,236,0)_55%)]">
        <div className="mx-auto w-full max-w-[860px] px-6 py-16 text-center md:py-24">
          <h1 className="mb-4 font-plex text-[clamp(2rem,4.4vw,3.2rem)] font-bold leading-[1.15] tracking-[-0.04em]">
            <span className="block text-ink">{t("hero.titelFix1")}</span>
            <span className="text-ink">{t("hero.titelFix2")}</span>
            <HeroRotator phrasen={rotationsPhrasen} />
          </h1>
          <p className="mx-auto mb-10 max-w-[46ch] text-body-lg leading-[1.5] text-ink-soft">
            {t("hero.text")}
          </p>

          {/* Prominenter Start-Hinweis + Vormerkung */}
          <div
            id="vormerken"
            className="mx-auto max-w-[560px] scroll-mt-24 rounded border-2 border-primary bg-primary-tint p-8"
          >
            <p className="font-plex text-headline font-bold tracking-[-0.04em] text-ink">
              {tc("hinweisTitel")}
            </p>
            <p className="mt-2 text-body-lg text-ink-soft">
              {tc("hinweisText")}
            </p>

            {vormerken === "ok" ? (
              <p className="mt-6 rounded border border-primary bg-canvas px-4 py-3 text-body font-semibold text-primary">
                {tc("emailErfolg")}
              </p>
            ) : (
              <>
                <form
                  action={interesseEintragen}
                  className="mt-6 flex flex-col gap-3 sm:flex-row"
                >
                  <label htmlFor="vormerken-email" className="sr-only">
                    {tc("emailLabel")}
                  </label>
                  <input
                    id="vormerken-email"
                    name="email"
                    type="email"
                    required
                    autoComplete="email"
                    placeholder={tc("emailPlaceholder")}
                    className="w-full flex-1 rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center rounded border border-transparent bg-primary px-6 py-3 text-body font-semibold text-white transition-colors hover:bg-primary-dark"
                  >
                    {tc("emailCta")}
                  </button>
                </form>
                {vormerken === "fehler" && (
                  <p className="mt-3 text-body-sm text-danger">
                    {tc("emailFehler")}
                  </p>
                )}
                <p className="mt-3 text-body-sm text-ink-muted">
                  {tc("emailHinweis")}
                </p>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Trust-Leiste */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-center gap-x-10 gap-y-2 px-6 py-4 text-body-sm text-ink-muted">
          <span className="flex items-center gap-2">
            {t("trust.herausgeberVor")}
            <a
              href="https://packaging-journal.de"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center"
            >
              <Image
                src="/pj-logo.png"
                alt={t("trust.herausgeber")}
                width={83}
                height={34}
              />
            </a>
          </span>
          <span className="hidden h-4 w-px bg-line sm:block" />
          <span>
            {t("trust.partnerVor")}{" "}
            <b className="text-ink">{t("trust.partner")}</b>
          </span>
          <span className="hidden h-4 w-px bg-line sm:block" />
          <span>
            {t("trust.fundstelleVor")}{" "}
            <b className="text-ink">{t("trust.fundstelle")}</b>
            {t("trust.fundstelleNach")}
          </span>
        </div>
      </div>

      {/* Fünf Säulen – zeigt, was kommt */}
      <section id="leistungen" className="py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <div className="mb-12 max-w-[62ch]">
            <span className="inline-block text-mono-sm font-semibold uppercase tracking-[0.02em] text-primary">
              <span aria-hidden="true">▸ </span>
              {t("leistungen.eyebrow")}
            </span>
            <h2 className="mb-3 mt-2 font-plex text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.04em] text-ink">
              {t("leistungen.titel")}
            </h2>
            <p className="text-body-lg text-ink-muted">{t("leistungen.text")}</p>
          </div>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {saeulen.map((saeule, i) => {
              const Icon = SAEULEN_ICONS[i] ?? Users;
              return (
                <div
                  key={saeule.titel}
                  className={`rounded border border-line bg-canvas p-7 ${SAEULEN_SPANS[i] ?? "md:col-span-4"}`}
                >
                  <span className="mb-3.5 block font-mono text-label uppercase tracking-[0.06em] text-ink-muted">
                    {saeule.schritt}
                  </span>
                  <span className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-primary-tint">
                    <Icon
                      strokeWidth={2}
                      aria-hidden="true"
                      className="h-[22px] w-[22px] text-primary"
                    />
                  </span>
                  <h3 className="mb-2 font-plex text-body-lg font-bold tracking-[-0.04em]">
                    {saeule.titel}
                  </h3>
                  <p className="text-body-sm text-ink-muted">{saeule.text}</p>
                  <span className="mt-3 inline-block rounded bg-primary-tint px-2 py-0.5 font-mono text-[0.68rem] text-primary">
                    {saeule.tag}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Check-Band – bleibt als kostenloser Teaser offen */}
      <section id="check" className="border-t border-line bg-surface py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <div className="rounded bg-legal text-white">
            <div className="flex flex-wrap items-center justify-between gap-8 p-8 md:p-11">
              <div className="max-w-[52ch]">
                <span className="inline-block text-mono-sm font-semibold uppercase tracking-[0.02em] text-gold">
                  <span aria-hidden="true">▸ </span>
                  {t("checkBand.eyebrow")}
                </span>
                <h2 className="mt-2 font-plex text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.04em]">
                  {t("checkBand.titel")}
                </h2>
                <p className="mt-2.5 text-body-lg text-[#cdd9ec]">
                  {t("checkBand.text")}
                </p>
              </div>
              <Link
                href="/check"
                className="inline-flex items-center justify-center rounded border border-transparent bg-white px-10 py-5 text-[1.25rem] font-semibold leading-8 text-legal transition-colors hover:bg-[#eef2f8]"
              >
                {t("checkBand.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer – ohne Konto-/Login-Links */}
      <footer className="border-t border-line bg-surface py-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-start justify-between gap-6 px-6">
          <div className="max-w-[52ch]">
            <div className="mb-3.5">
              <BrandLink href="/" />
            </div>
            <p className="flex items-center gap-2 text-body-sm text-ink-muted">
              {t("footer.produktVon")}
              <a
                href="https://packaging-journal.de"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center"
              >
                <Image
                  src="/pj-logo.png"
                  alt="packaging journal"
                  width={68}
                  height={28}
                />
              </a>
            </p>
            <p className="mt-2 text-body-sm text-ink-muted">
              {t("footer.beschreibung")}
            </p>
          </div>
          <div>
            <h4 className="mb-3 font-mono text-label font-medium uppercase tracking-[0.06em] text-ink-muted">
              {t("footer.rechtliches")}
            </h4>
            <a
              href="https://packaging-journal.de/impressum/"
              target="_blank"
              rel="noopener noreferrer"
              className="mb-2 block text-body-sm text-ink-muted hover:text-primary"
            >
              {t("footer.impressum")}
            </a>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <p className="mt-7 border-t border-line pt-5 text-body-sm text-ink-muted">
            {t("footer.disclaimer")}
          </p>
        </div>
      </footer>
    </div>
  );
}
