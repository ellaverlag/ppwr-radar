import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  BookOpen,
  FileText,
  MessageCircleQuestion,
  Radar,
  Users,
  type LucideIcon,
} from "lucide-react";
import { landingFontClasses } from "@/app/landing-fonts";
import { HeroRotator } from "@/app/hero-rotator";
import { BrandLink } from "@/components/brand";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta.landing");
  return {
    title: t("title"),
    description: t("description"),
    alternates: { canonical: "/" },
    openGraph: {
      url: "/",
      title: t("ogTitle"),
      description: t("ogDescription"),
      type: "website",
      locale: "de_DE",
      siteName: t("siteName"),
    },
  };
}

export const dynamic = "force-dynamic";

// ---------------------------------------------------------------------------
// Bausteine
// ---------------------------------------------------------------------------

const BTN =
  "inline-flex items-center justify-center gap-2 rounded border font-semibold transition-colors";
const BTN_PRIMARY = `${BTN} border-transparent bg-primary text-white hover:bg-primary-dark`;
const BTN_GHOST = `${BTN} border-primary bg-canvas text-primary hover:bg-primary-tint`;
const BTN_MD = "px-6 py-3 text-body";
const BTN_LG = "px-8 py-4 text-body-lg";
/* Größter Button der Seite – reserviert für das Check-Band */
const BTN_XL = "px-10 py-5 text-[1.25rem] leading-8";

function Eyebrow({
  children,
  className = "text-primary",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={`inline-block text-mono-sm font-semibold uppercase tracking-[0.02em] ${className}`}
    >
      {/* Rubrik-Marker wie bei packaging-journal.de; erbt die Eyebrow-Farbe
          (standardmäßig Grün), damit er auf farbigen Bändern lesbar bleibt */}
      <span aria-hidden="true">▸ </span>
      {children}
    </span>
  );
}

function SectionHead({
  eyebrow,
  titel,
  text,
  zentriert = false,
}: {
  eyebrow: string;
  titel: string;
  text?: string;
  zentriert?: boolean;
}) {
  return (
    <div className={`mb-12 max-w-[62ch] ${zentriert ? "mx-auto text-center" : ""}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mb-3 mt-2 font-plex text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.04em] text-ink">
        {titel}
      </h2>
      {text && <p className="text-body-lg text-ink-muted">{text}</p>}
    </div>
  );
}

/**
 * Fünf Säulen (#leistungen) – Icons aus dem Lucide-Set der App, Reihenfolge
 * wie Landing.leistungen.saeulen; Spaltenbreiten wie in der Referenz
 * (Rollen-Klärung breit, Rest 5/4/4/4 von 12).
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

// ---------------------------------------------------------------------------
// Seite
// ---------------------------------------------------------------------------

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{
    code?: string;
    token_hash?: string;
    type?: string;
    abschied?: string;
  }>;
}) {
  // Callback-Fix: Leitet Supabase den Magic-Link auf die Site-URL statt auf
  // /auth/callback (z. B. Site-URL-Fallback bei nicht gelisteter
  // Redirect-URL), kommt der ?code= hier an – dann an den Callback
  // durchreichen, statt den Nutzer uneingeloggt auf der Landing zu lassen.
  const params = await searchParams;
  if (params.code || params.token_hash) {
    const weiter = new URLSearchParams();
    if (params.code) weiter.set("code", params.code);
    if (params.token_hash) weiter.set("token_hash", params.token_hash);
    if (params.type) weiter.set("type", params.type);
    weiter.set("next", "/dashboard");
    redirect(`/auth/callback?${weiter.toString()}`);
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  const t = await getTranslations("Landing");

  const rotationsPhrasen = t.raw("hero.rotationsPhrasen") as string[];
  const saeulen = t.raw("leistungen.saeulen") as {
    schritt: string;
    titel: string;
    text: string;
    tag: string;
  }[];
  const zielgruppen = t.raw("zielgruppe.karten") as {
    rolle: string;
    frage: string;
    text: string;
  }[];
  const faq = t.raw("faq.eintraege") as { frage: string; antwort: string }[];
  const problemPunkte = t.raw("problem.linksPunkte") as string[];
  const loesungPunkte = t.raw("problem.rechtsPunkte") as string[];
  const leistungen = t.raw("preise.leistungen") as string[];
  const heroRollen = t.raw("hero.karte.rollen") as string[];
  const heroFundstellen = t.raw("hero.karte.fundstellen") as string[];

  return (
    <div className={`${landingFontClasses} bg-canvas text-ink`}>
      {params.abschied === "1" && (
        <p className="border-b border-line bg-primary-tint px-6 py-3 text-center text-body-sm text-ink">
          {t("abschied")}
        </p>
      )}
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6">
          <BrandLink href="/" priority />
          <nav className="flex items-center gap-3 md:gap-8">
            <a href="#leistungen" className="hidden text-body-sm font-medium text-ink-muted hover:text-primary md:block">
              {t("nav.leistungen")}
            </a>
            <a href="#zielgruppe" className="hidden text-body-sm font-medium text-ink-muted hover:text-primary md:block">
              {t("nav.zielgruppe")}
            </a>
            <a href="#preise" className="hidden text-body-sm font-medium text-ink-muted hover:text-primary md:block">
              {t("nav.preise")}
            </a>
            <a href="#faq" className="hidden text-body-sm font-medium text-ink-muted hover:text-primary md:block">
              {t("nav.faq")}
            </a>
            <Link href="/login" className="hidden text-body-sm font-medium text-ink-muted hover:text-primary sm:block">
              {t("nav.anmelden")}
            </Link>
            <a href="#check" className={`${BTN_GHOST} px-4 py-2.5 text-body-sm sm:px-5`}>
              {t("nav.kostenlosPruefen")}
            </a>
            <Link
              href="/login?next=dashboard"
              className={`${BTN_PRIMARY} px-4 py-2.5 text-body-sm sm:px-5`}
            >
              {t("nav.jetztStarten")}
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-line bg-[radial-gradient(120%_90%_at_88%_-10%,#e6f0ec_0%,rgba(230,240,236,0)_55%)]">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-6 py-12 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:py-16">
          <div>
            <span className="inline-flex items-center gap-2 rounded border border-[#f0dfa0] bg-gold-tint px-3 py-1.5 font-mono text-mono-sm font-medium text-gold-ink">
              <span className="h-[7px] w-[7px] rounded-full bg-gold shadow-[0_0_0_3px_#f4e4a8]" />
              {t("hero.badge")}
            </span>
            <h1 className="mb-4 mt-4 font-plex text-[clamp(2rem,4.4vw,3.2rem)] font-bold leading-[1.15] tracking-[-0.04em]">
              <span className="block text-ink">{t("hero.titelFix1")}</span>
              <span className="text-ink">{t("hero.titelFix2")}</span>
              <HeroRotator phrasen={rotationsPhrasen} />
            </h1>
            <p className="mb-7 max-w-[40ch] text-body-lg leading-[1.5] text-ink-soft">
              {t("hero.text")}
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/login?next=dashboard" className={`${BTN_PRIMARY} ${BTN_LG}`}>
                {t("hero.ctaPrimaer")}
              </Link>
              <a href="#check" className={`${BTN_GHOST} ${BTN_LG}`}>
                {t("hero.ctaSekundaer")}
              </a>
            </div>
            <p className="mt-4 text-body-sm text-ink-muted">
              {t("hero.microcopy")}
            </p>
          </div>

          {/* Beispiel-Rollenkarte */}
          <div
            role="img"
            aria-label={t("hero.karte.ariaLabel")}
            className="overflow-hidden rounded border border-line bg-canvas"
          >
            <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3.5">
              <span className="font-mono text-label font-medium uppercase tracking-[0.06em] text-ink-muted">
                {t("hero.karte.kopf")}
              </span>
              <span className="font-mono text-label text-ink-muted">
                {t("hero.karte.stand")}
              </span>
            </div>
            <div className="p-5">
              <p className="mb-1 text-body-sm text-ink-muted">
                {t("hero.karte.produktlinieLabel")}
              </p>
              <p className="mb-3.5 font-plex text-body-lg font-bold tracking-[-0.02em]">
                {t("hero.karte.produktlinie")}
              </p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {heroRollen.map((rolle) => (
                  <span
                    key={rolle}
                    className="rounded border border-legal bg-legal-tint px-2.5 py-1 font-mono text-label font-medium text-legal"
                  >
                    {rolle}
                  </span>
                ))}
              </div>
              <div className="border-t border-dashed border-line pt-3.5 text-body-sm text-ink-muted">
                <b className="text-ink">{t("hero.karte.begruendungFett")}</b>{" "}
                {t("hero.karte.begruendung")}
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  {heroFundstellen.map((fundstelle) => (
                    <span
                      key={fundstelle}
                      className="rounded border border-legal-tint bg-legal-tint px-2 py-0.5 font-mono text-[0.68rem] text-legal"
                    >
                      {fundstelle}
                    </span>
                  ))}
                </div>
              </div>
            </div>
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

      {/* Fünf Säulen */}
      <section id="leistungen" className="py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <SectionHead
            eyebrow={t("leistungen.eyebrow")}
            titel={t("leistungen.titel")}
            text={t("leistungen.text")}
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-12">
            {saeulen.map((saeule, i) => {
              const Icon = SAEULEN_ICONS[i] ?? Users;
              return (
                <div
                  key={saeule.titel}
                  className={`rounded border border-line bg-canvas p-7 transition-colors hover:border-primary ${SAEULEN_SPANS[i] ?? "md:col-span-4"}`}
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
          <p className="mt-6 text-body-sm text-ink-muted">
            {t("leistungen.nachsatzVor")}{" "}
            <b className="text-ink-soft">{t("leistungen.nachsatzFett")}</b>{" "}
            {t("leistungen.nachsatz")}
          </p>
        </div>
      </section>

      {/* Problem / Lösung */}
      <section id="problem" className="border-y border-line bg-surface py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <SectionHead
            eyebrow={t("problem.eyebrow")}
            titel={t("problem.titel")}
            text={t("problem.text")}
          />
          <div className="grid grid-cols-1 overflow-hidden rounded border border-line md:grid-cols-2">
            <div className="border-b border-line bg-surface p-8 md:border-b-0 md:border-r">
              <h3 className="mb-4 font-plex text-body-lg font-bold tracking-[-0.04em]">
                {t("problem.linksTitel")}
              </h3>
              <ul className="space-y-3">
                {problemPunkte.map((punkt) => (
                  <li key={punkt} className="relative pl-6 text-body text-ink-muted">
                    <span className="absolute left-0 font-bold text-ink-muted">–</span>
                    {punkt}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-primary-tint p-8">
              <h3 className="mb-4 font-plex text-body-lg font-bold tracking-[-0.04em]">
                {t("problem.rechtsTitel")}
              </h3>
              <ul className="space-y-3">
                {loesungPunkte.map((punkt) => (
                  <li key={punkt} className="relative pl-6 text-body text-ink-muted">
                    <span className="absolute left-0 font-bold text-primary">→</span>
                    {punkt}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Zielgruppen */}
      <section id="zielgruppe" className="bg-footer py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <SectionHead
            eyebrow={t("zielgruppe.eyebrow")}
            titel={t("zielgruppe.titel")}
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {zielgruppen.map((karte) => (
              <div key={karte.rolle} className="rounded border border-line bg-canvas p-7">
                <p className="mb-2.5 font-mono text-label font-medium uppercase tracking-[0.06em] text-primary">
                  {karte.rolle}
                </p>
                <h3 className="mb-2 font-plex text-body-lg font-bold tracking-[-0.04em]">
                  {karte.frage}
                </h3>
                <p className="text-body-sm text-ink-muted">{karte.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <SectionHead
            eyebrow={t("preise.eyebrow")}
            titel={t("preise.titel")}
            text={t("preise.text")}
          />
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1.2fr_1fr]">
            <div className="relative rounded border-2 border-primary bg-canvas p-8">
              <span className="absolute -top-3 left-8 rounded bg-primary px-2.5 py-1 font-mono text-[0.68rem] font-medium uppercase tracking-[0.06em] text-white">
                {t("preise.launchBadge")}
              </span>
              <p className="mb-3 font-mono text-mono-sm font-medium uppercase tracking-[0.06em] text-ink-muted">
                {t("preise.paketName")}
              </p>
              <p className="font-plex text-[2.6rem] font-bold leading-none tracking-[-0.03em]">
                <span className="align-top text-[1.4rem] font-bold">
                  {t("preise.preisWaehrung")}
                </span>
                {t("preise.preisBetrag")}
              </p>
              <p className="mb-1 mt-1.5 text-body-sm text-ink-muted">
                {t("preise.preisZeile1")}
              </p>
              <p className="mb-5 text-body-sm text-ink-muted">
                {t("preise.preisZeile2")}
              </p>
              <ul className="mb-6 space-y-2.5">
                {leistungen.map((punkt) => (
                  <li key={punkt} className="relative pl-6 text-body-sm text-ink-muted">
                    <span className="absolute left-0 top-0.5 font-bold text-primary">✓</span>
                    {punkt}
                  </li>
                ))}
              </ul>
              {/* Erst Konto anlegen, dann Zahlung – Checkout sitzt im Dashboard-Vorzimmer */}
              <Link
                href="/login?next=dashboard"
                data-stripe="paket"
                className={`${BTN_PRIMARY} ${BTN_LG} w-full`}
              >
                {t("preise.ctaPaket")}
              </Link>
              <p className="mt-3 text-center text-body-sm text-ink-muted">
                {t("preise.festpreisZeile")}
              </p>
            </div>
            <div className="flex flex-col gap-5">
              <div className="rounded border border-line bg-canvas p-6">
                <p className="mb-2 font-mono text-label font-medium uppercase tracking-[0.06em] text-ink-muted">
                  {t("preise.teamName")}
                </p>
                <p className="font-plex text-headline font-bold">
                  {t("preise.teamPreisVor")}{" "}
                  <span className="text-body-lg font-bold">
                    {t("preise.preisWaehrung")}
                  </span>
                  {t("preise.teamPreis")}
                </p>
                <p className="mb-4 mt-2 text-body-sm text-ink-muted">
                  {t("preise.teamText")}
                </p>
                <Link
                  href="/login?next=dashboard"
                  data-stripe="team"
                  className={`${BTN_GHOST} ${BTN_MD} w-full`}
                >
                  {t("preise.ctaTeam")}
                </Link>
              </div>
              <div className="rounded border border-line bg-canvas p-6">
                <p className="mb-2 font-mono text-label font-medium uppercase tracking-[0.06em] text-ink-muted">
                  {t("preise.verlaengerungName")}
                </p>
                <p className="font-plex text-headline font-bold">
                  <span className="text-body-lg font-bold">
                    {t("preise.preisWaehrung")}
                  </span>
                  {t("preise.verlaengerungPreis")}
                  <span className="text-body-sm font-medium text-ink-muted">
                    {" "}
                    {t("preise.verlaengerungEinheit")}
                  </span>
                </p>
                <p className="mb-4 mt-2 text-body-sm text-ink-muted">
                  {t("preise.verlaengerungText")}
                </p>
                <span
                  data-stripe="verlaengerung"
                  className="inline-block rounded border border-line-strong bg-surface px-2.5 py-1 text-label font-medium text-ink-muted"
                >
                  {t("preise.verlaengerungChip")}
                </span>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center font-mono text-mono-sm text-ink-muted">
            {t("preise.stripeHinweis")}
          </p>
        </div>
      </section>

      {/* Betroffenheits-Check-Band */}
      <section id="check" className="border-t border-line bg-surface py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <div className="rounded bg-legal text-white">
            <div className="flex flex-wrap items-center justify-between gap-8 p-8 md:p-11">
              <div className="max-w-[52ch]">
                <Eyebrow className="text-gold">{t("checkBand.eyebrow")}</Eyebrow>
                <h2 className="mt-2 font-plex text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.04em]">
                  {t("checkBand.titel")}
                </h2>
                <p className="mt-2.5 text-body-lg text-[#cdd9ec]">
                  {t("checkBand.text")}
                </p>
              </div>
              <Link
                href="/check"
                className={`${BTN} ${BTN_XL} border-transparent bg-white text-legal hover:bg-[#eef2f8]`}
              >
                {t("checkBand.cta")}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <SectionHead
            eyebrow={t("faq.eyebrow")}
            titel={t("faq.titel")}
            zentriert
          />
          <div className="mx-auto max-w-[820px]">
            {faq.map((eintrag, i) => (
              <details
                key={eintrag.frage}
                open={i === 0}
                className="group mb-3 rounded border border-line bg-canvas open:border-primary"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 font-plex text-body font-semibold tracking-[-0.02em] [&::-webkit-details-marker]:hidden">
                  {eintrag.frage}
                  <span
                    aria-hidden="true"
                    className="font-mono text-body-lg text-primary group-open:hidden"
                  >
                    +
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden font-mono text-body-lg text-primary group-open:block"
                  >
                    –
                  </span>
                </summary>
                <p className="px-5 pb-5 text-body-sm text-ink-muted">
                  {eintrag.antwort}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final-CTA */}
      <section className="bg-primary py-20 text-center text-white">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <Eyebrow className="text-[#bfe0d6]">{t("finalCta.eyebrow")}</Eyebrow>
          <h2 className="mb-4 mt-2 font-plex text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.04em]">
            {t("finalCta.titel")}
          </h2>
          <p className="mx-auto mb-8 max-w-[52ch] text-body-lg text-[#bfe0d6]">
            {t("finalCta.text")}
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login?next=dashboard"
              className={`${BTN} ${BTN_LG} border-transparent bg-white text-primary hover:bg-[#eef6f3]`}
            >
              {t("finalCta.ctaPrimaer")}
            </Link>
            <a
              href="#check"
              className={`${BTN} ${BTN_LG} border-white/50 bg-transparent text-white hover:bg-white/10`}
            >
              {t("finalCta.ctaSekundaer")}
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
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
                <Image src="/pj-logo.png" alt="packaging journal" width={68} height={28} />
              </a>
            </p>
            <p className="mt-2 text-body-sm text-ink-muted">
              {t("footer.beschreibung")}
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <div>
              <h4 className="mb-3 font-mono text-label font-medium uppercase tracking-[0.06em] text-ink-muted">
                {t("footer.produkt")}
              </h4>
              <a href="#leistungen" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                {t("footer.leistungen")}
              </a>
              <a href="#preise" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                {t("footer.preise")}
              </a>
              <Link href="/check" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                {t("footer.check")}
              </Link>
              <a href="#faq" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                {t("footer.faq")}
              </a>
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
              <a href="#" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                {t("footer.datenschutz")}
              </a>
              <a href="#" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                {t("footer.agb")}
              </a>
            </div>
            <div>
              <h4 className="mb-3 font-mono text-label font-medium uppercase tracking-[0.06em] text-ink-muted">
                {t("footer.konto")}
              </h4>
              <Link href="/login" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                {t("footer.anmelden")}
              </Link>
              <Link href="/login?next=dashboard" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                {t("footer.registrieren")}
              </Link>
            </div>
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
