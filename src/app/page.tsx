import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { landingFontClasses } from "@/app/landing-fonts";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "PPWR Radar – Ihre persönliche PPWR-KI | packaging journal",
  description:
    "Die PPWR gilt. PPWR Radar zeigt Ihnen, was das für Ihre Verpackungen bedeutet – Ihre Rolle, Ihre Pflichten, Ihre Dokumente. Verifiziert von Cattwyk Rechtsanwaltsgesellschaft.",
  openGraph: {
    title: "PPWR Radar – Ihre persönliche PPWR-KI",
    description:
      "Rolle klären, Pflichten verstehen, Dokumente erstellen – die EU-Verpackungsverordnung, übersetzt für Ihr Unternehmen.",
    type: "website",
    locale: "de_DE",
    siteName: "PPWR Radar",
  },
};

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

function Brand() {
  return (
    <span className="flex items-center gap-2.5">
      <Image
        src="/ppwr-radar-icon.svg"
        alt=""
        width={30}
        height={30}
        aria-hidden="true"
      />
      <span className="leading-tight">
        <span className="block font-plex text-body-lg font-bold tracking-tight text-ink">
          PPWR Radar
        </span>
        <span className="-mt-0.5 block text-label font-medium normal-case tracking-normal text-ink-muted">
          by packaging journal
        </span>
      </span>
    </span>
  );
}

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
    <div className={`mb-12 max-w-[60ch] ${zentriert ? "mx-auto text-center" : ""}`}>
      <Eyebrow>{eyebrow}</Eyebrow>
      <h2 className="mb-3 mt-2 font-plex text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.04em] text-ink">
        {titel}
      </h2>
      {text && <p className="text-body-lg text-ink-muted">{text}</p>}
    </div>
  );
}

function FeatureIcon({ d }: { d: string }) {
  return (
    <span className="mb-4 flex h-10 w-10 items-center justify-center rounded bg-primary-tint">
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="#006950"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="h-[22px] w-[22px]"
        aria-hidden="true"
      >
        <path d={d} />
      </svg>
    </span>
  );
}

const FEATURES = [
  {
    titel: "Rollen-Klärung",
    text: "Der Onboarding-Assistent fragt Ihre Tätigkeiten ab – und leitet daraus Ihre PPWR-Rolle je Produktlinie ab. Endlich Klarheit bei Erzeuger vs. Hersteller, dem größten Verwirrungspunkt der Branche.",
    icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm-8 9c0-4 4-6 8-6s8 2 8 6",
  },
  {
    titel: "Dokumenten-Generator",
    text: "Konformitätserklärung nach Anhang VIII, Gerüst der technischen Dokumentation nach Anhang VII, Pflichtenübersicht – vorbefüllt aus Ihrem Profil, als prüffähige Arbeitsgrundlage.",
    icon: "M14 3v5h5M18 21H6a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h8l6 6v10a2 2 0 0 1-2 2z",
  },
  {
    titel: "Persönlicher Assistent",
    text: "Stellen Sie Ihre Frage in eigenen Worten. Die Antwort kennt Ihr Profil, nennt Artikel und Rechtsstand – und sagt ehrlich, wenn ein Fall in die Rechtsberatung gehört.",
    icon: "M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z",
  },
  {
    titel: "Radar-Updates",
    text: "Neue Durchführungsrechtsakte, Leitlinien, VerpackDG-Details – geprüft aufbereitet und gegen Ihr Profil abgeglichen: „Diese Änderung betrifft 2 Ihrer Verpackungen.“",
    icon: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zm0-9 5-3",
  },
  {
    titel: "Einfach erklärt",
    text: "Jeder Inhalt in drei Tiefen: „Einfach erklärt“ für den schnellen Überblick, „Fachlich“ für die Details, „Rechtstext“ für den Nachweis. Sie entscheiden, wie tief.",
    icon: "M3 12h4l3-8 4 16 3-8h4",
  },
  {
    titel: "Zum Anhören",
    text: "Lassen Sie sich Erklärungen vorlesen – und ab Herbst Ihr persönliches Audio-Briefing: die Änderungen der Woche, zugeschnitten auf Ihr Portfolio.",
    icon: "M9 18V5l12-2v13M9 18a3 3 0 1 1-6 0 3 3 0 0 1 6 0zm12-2a3 3 0 1 1-6 0 3 3 0 0 1 6 0z",
  },
  {
    titel: "Nachschlagewerk",
    text: "Glossar von A wie Abfüller bis Z wie Zweigniederlassung – alle Begriffe, Verpackungsarten und Praxisfragen durchsuchbar, mit Quelle. Für alle, die lieber blättern als chatten.",
    icon: "M12 6.5A5.5 5.5 0 0 0 6.5 3H2v15h5a5 5 0 0 1 5 3 5 5 0 0 1 5-3h5V3h-4.5A5.5 5.5 0 0 0 12 6.5V21",
  },
];

// ---------------------------------------------------------------------------
// Seite
// ---------------------------------------------------------------------------

export default async function LandingPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (user) redirect("/dashboard");

  return (
    <div className={`${landingFontClasses} bg-canvas text-ink`}>
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-6">
          <Link href="/">
            <Brand />
          </Link>
          <nav className="flex items-center gap-8">
            <a href="#funktionen" className="hidden text-body-sm font-medium text-ink-muted hover:text-primary md:block">
              Funktionen
            </a>
            <a href="#zielgruppe" className="hidden text-body-sm font-medium text-ink-muted hover:text-primary md:block">
              Für wen
            </a>
            <a href="#preise" className="hidden text-body-sm font-medium text-ink-muted hover:text-primary md:block">
              Preise
            </a>
            <a href="#faq" className="hidden text-body-sm font-medium text-ink-muted hover:text-primary md:block">
              FAQ
            </a>
            <Link href="/login" className="hidden text-body-sm font-medium text-ink-muted hover:text-primary sm:block">
              Anmelden
            </Link>
            <a href="#preise" className={`${BTN_PRIMARY} px-5 py-2.5 text-body-sm`}>
              Jetzt starten
            </a>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="border-b border-line bg-[radial-gradient(120%_90%_at_88%_-10%,#e6f0ec_0%,rgba(230,240,236,0)_55%)]">
        <div className="mx-auto grid w-full max-w-[1200px] grid-cols-1 items-center gap-10 px-6 py-12 md:grid-cols-[1.05fr_0.95fr] md:gap-14 md:py-18">
          <div>
            <span className="inline-flex items-center gap-2 rounded border border-[#f0dfa0] bg-gold-tint px-3 py-1.5 text-mono-sm font-medium text-gold-ink">
              <span className="h-[7px] w-[7px] rounded-full bg-gold shadow-[0_0_0_3px_#f4e4a8]" />
              Die PPWR gilt seit dem 12. August 2026
            </span>
            <h1 className="mb-4 mt-4 font-plex text-[clamp(2.1rem,4.6vw,3.4rem)] font-bold leading-[1.15] tracking-[-0.04em]">
              Die PPWR gilt. Wissen Sie, was das für{" "}
              <span className="text-primary">Ihre Verpackungen</span> heißt?
            </h1>
            <p className="mb-8 max-w-[34ch] text-body-lg text-ink-muted">
              PPWR Radar ist Ihre persönliche PPWR-KI: Sie klärt Ihre Rolle,
              zeigt Ihre Pflichten und erstellt die Dokumente, die Sie jetzt
              brauchen. Verständlich, mit Fundstelle, immer auf Stand.
            </p>
            <div className="flex flex-wrap items-center gap-3">
              <Link href="/login" className={`${BTN_PRIMARY} ${BTN_LG}`}>
                PPWR|ready werden
              </Link>
              <a href="#check" className={`${BTN_GHOST} ${BTN_LG}`}>
                Kostenlos: Bin ich betroffen?
              </a>
            </div>
            <p className="mt-4 text-body-sm text-ink-muted">
              In 15 Minuten von der Unsicherheit zur Klarheit · Juristisch
              verifiziert von Cattwyk Rechtsanwaltsgesellschaft
            </p>
            <p className="mt-1.5 text-body-sm text-ink-muted">
              Kein Datenprojekt, keine Angebotsanfrage – heute registrieren, in
              15 Minuten Ergebnisse.
            </p>
          </div>

          {/* Beispiel-Rollenkarte */}
          <div
            role="img"
            aria-label="Beispiel einer Rollen-Analyse in PPWR Radar"
            className="overflow-hidden rounded border border-line bg-canvas"
          >
            <div className="flex items-center justify-between border-b border-line bg-surface px-4 py-3.5">
              <span className="text-label font-semibold uppercase tracking-[0.02em] text-ink-muted">
                Ihre PPWR-Rolle
              </span>
              <span className="font-mono text-label text-ink-muted">
                Stand 12.08.2026
              </span>
            </div>
            <div className="p-5">
              <p className="mb-1 text-body-sm text-ink-muted">Produktlinie</p>
              <p className="mb-3.5 text-body-lg font-bold">Feinkost im Glas</p>
              <div className="mb-4 flex flex-wrap gap-1.5">
                {["Erzeuger", "Hersteller", "Endvertreiber"].map((rolle) => (
                  <span
                    key={rolle}
                    className="rounded border border-legal bg-legal-tint px-2.5 py-1 text-label font-medium text-legal"
                  >
                    {rolle}
                  </span>
                ))}
              </div>
              <div className="border-t border-dashed border-line pt-3.5 text-body-sm text-ink-muted">
                <b className="text-ink">Sie gelten als Erzeuger,</b> weil Sie
                das Produkt unter eigener Marke abfüllen lassen – trägt die
                Konformitätsverantwortung.
                <div className="mt-2.5 flex flex-wrap gap-1.5">
                  <span className="rounded border border-legal-tint bg-legal-tint px-2 py-0.5 font-mono text-[0.68rem] text-legal">
                    Art. 3 Abs. 1 Nr. 13 PPWR
                  </span>
                  <span className="rounded border border-legal-tint bg-legal-tint px-2 py-0.5 font-mono text-[0.68rem] text-legal">
                    § 7 VerpackDG
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust-Leiste */}
      <div className="border-b border-line bg-surface">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-center justify-center gap-x-10 gap-y-2 px-6 py-4 text-body-sm text-ink-muted">
          <span>
            Herausgegeben vom <b className="text-ink">packaging journal</b>
          </span>
          <span className="hidden h-4 w-px bg-line sm:block" />
          <span>
            Juristischer Partner:{" "}
            <b className="text-ink">Cattwyk Rechtsanwaltsgesellschaft</b>
          </span>
          <span className="hidden h-4 w-px bg-line sm:block" />
          <span>
            Jede Antwort mit <b className="text-ink">Rechtsstand &amp; Fundstelle</b>
          </span>
        </div>
      </div>

      {/* Problem / Lösung */}
      <section id="problem" className="py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <SectionHead
            eyebrow="Das Problem"
            titel="Andere erklären die PPWR. Wir sagen Ihnen, was sie für Sie bedeutet."
            text="Merkblätter, Webinare, PDF-Leitfäden – alle erklären die Verordnung allgemein. Ihre Situation ist aber nicht allgemein."
          />
          <div className="grid grid-cols-1 overflow-hidden rounded border border-line md:grid-cols-2">
            <div className="border-b border-line bg-surface p-8 md:border-b-0 md:border-r">
              <h3 className="mb-4 font-plex text-body-lg font-bold tracking-[-0.04em]">
                Womit Sie gerade allein sind
              </h3>
              <ul className="space-y-3">
                {[
                  "Bin ich „Erzeuger“ oder „Hersteller“ – und was ist der Unterschied überhaupt?",
                  "Was von alledem gilt schon jetzt, was erst 2028 oder 2030?",
                  "Welche Dokumente brauche ich – und wie sehen die aus?",
                  "Gilt das auch für meine spezielle Verpackung mit Lebensmittelkontakt?",
                  "Und was ändert sich morgen wieder?",
                ].map((punkt) => (
                  <li key={punkt} className="relative pl-6 text-body text-ink-muted">
                    <span className="absolute left-0 font-bold text-ink-muted">–</span>
                    {punkt}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-primary-tint p-8">
              <h3 className="mb-4 font-plex text-body-lg font-bold tracking-[-0.04em]">
                Was PPWR Radar für Sie tut
              </h3>
              <ul className="space-y-3">
                {[
                  "Leitet Ihre Rolle je Produktlinie her – mit Begründung und Fundstelle",
                  "Trennt klar: „gilt seit dem 12.8.“ von „kommt erst 2028/2030“",
                  "Erstellt Konformitätserklärung & Dokumentationsgerüst als Entwurf",
                  "Antwortet auf Ihre konkrete Frage – im Kontext Ihres Portfolios",
                  "Meldet sich, wenn sich die Rechtslage ändert",
                ].map((punkt) => (
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

      {/* Funktionen */}
      <section id="funktionen" className="border-y border-line bg-surface py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <SectionHead
            eyebrow="Was drin ist"
            titel="Vier Werkzeuge, ein System"
            text="Alles arbeitet mit Ihrem Profil zusammen – einmal angelegt, überall genutzt."
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {FEATURES.map((feature) => (
              <div
                key={feature.titel}
                className="rounded border border-line bg-canvas p-7 transition-colors hover:border-primary"
              >
                <FeatureIcon d={feature.icon} />
                <h3 className="mb-2 font-plex text-body-lg font-bold tracking-[-0.04em]">{feature.titel}</h3>
                <p className="text-body-sm text-ink-muted">{feature.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Zielgruppen */}
      <section id="zielgruppe" className="bg-footer py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <SectionHead
            eyebrow="Für wen"
            titel="Gemacht für die Menschen, die es umsetzen müssen"
          />
          <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
            {[
              {
                rolle: "Verpackungshersteller",
                frage: "„Bin ich für die Konformität verantwortlich?“",
                text: "Klären Sie je Produktlinie, ob Sie Erzeuger sind, welche Stoff- und Mehrweg-Anforderungen gelten und welche Nachweise Ihre Dokumentation braucht.",
              },
              {
                rolle: "Verpackende Unternehmen",
                frage: "„Was muss ich als Abfüller oder Markeninhaber tun?“",
                text: "Verstehen Sie Ihre Doppelrolle, erzeugen Sie Ihre Konformitätserklärung und behalten Sie Registrierungs- und Systembeteiligungspflichten im Blick.",
              },
              {
                rolle: "Handel & E-Commerce",
                frage: "„Werde ich zum Hersteller, ohne es zu wissen?“",
                text: "Eigenmarken, Import, grenzüberschreitender Direktvertrieb – Radar zeigt, wann Sie EPR-Pflichten treffen und wann Sie einen Bevollmächtigten brauchen.",
              },
            ].map((karte) => (
              <div key={karte.rolle} className="rounded border border-line bg-canvas p-7">
                <p className="mb-2.5 text-label font-semibold uppercase tracking-[0.02em] text-primary">
                  {karte.rolle}
                </p>
                <h3 className="mb-2 font-plex text-body-lg font-bold tracking-[-0.04em]">{karte.frage}</h3>
                <p className="text-body-sm text-ink-muted">{karte.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* So funktioniert's */}
      <section className="py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <SectionHead eyebrow="So funktioniert’s" titel="In 15 Minuten zur Klarheit" />
          <div className="grid grid-cols-1 md:grid-cols-4">
            {[
              {
                titel: "Profil anlegen",
                text: "Beantworten Sie ein paar Fragen zu Tätigkeiten, Verpackungen und Märkten – keine Fachbegriffe nötig.",
              },
              {
                titel: "Rolle erfahren",
                text: "Radar leitet Ihre Rolle je Produktlinie her und erklärt, warum – mit Fundstelle zum Nachlesen.",
              },
              {
                titel: "Dokumente erhalten",
                text: "Status-Analyse, Pflichtenliste und vorbefüllte Dokumente stehen sofort zum Download bereit.",
              },
              {
                titel: "Aktuell bleiben",
                text: "Zwölf Monate Radar inklusive: Bei jeder Änderung wissen Sie, was für Sie zu tun ist.",
              },
            ].map((schritt, i) => (
              <div
                key={schritt.titel}
                className="border border-line p-7 max-md:border-b-0 max-md:last:border-b md:border-r-0 md:last:border-r"
              >
                <span className="mb-3.5 flex h-[26px] w-[26px] items-center justify-center rounded-full bg-primary text-body-sm font-medium text-white">
                  {i + 1}
                </span>
                <h3 className="mb-1.5 font-plex text-body font-bold tracking-[-0.04em]">{schritt.titel}</h3>
                <p className="text-body-sm text-ink-muted">{schritt.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="preise" className="border-y border-line bg-footer py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <SectionHead
            eyebrow="Preise"
            titel="Ein Paket. Alles drin. Zwölf Monate aktuell."
            text="Zum Launch zum Einführungspreis – inklusive der Radar-Updates für ein ganzes Jahr."
          />
          <div className="grid grid-cols-1 items-start gap-5 md:grid-cols-[1.2fr_1fr]">
            <div className="relative rounded border-2 border-primary bg-canvas p-8">
              <span className="absolute -top-3 left-8 rounded bg-primary px-2.5 py-1 text-[0.68rem] font-semibold uppercase tracking-[0.02em] text-white">
                Launch-Angebot
              </span>
              <p className="mb-3 text-mono-sm font-semibold uppercase tracking-[0.02em] text-ink-muted">
                PPWR|ready Paket
              </p>
              <p className="font-plex text-[2.6rem] font-bold leading-none tracking-[-0.03em]">
                <span className="align-top text-[1.4rem] font-bold">€</span>490
              </p>
              <p className="mb-1 mt-1.5 text-body-sm text-ink-muted">
                einmalig · inkl. 12 Monate PPWR Radar
              </p>
              <p className="mb-5 text-body-sm text-ink-muted">
                danach 290 €/Jahr Verlängerung · später regulär 690 €
              </p>
              <ul className="mb-6 space-y-2.5">
                {[
                  "Compliance-Profil & individuelle Status-Analyse",
                  "Rollen-Klärung je Produktlinie mit Fundstelle",
                  "Dokumenten-Generator (Konformitätserklärung, technische Doku, Pflichtenübersicht)",
                  "Persönlicher Assistent mit Quellenangabe",
                  "Wissens-Bibliothek in drei Erklärtiefen",
                  "12 Monate Radar-Updates & Quartals-Webinare",
                ].map((punkt) => (
                  <li key={punkt} className="relative pl-6 text-body-sm text-ink-muted">
                    <span className="absolute left-0 top-0.5 font-bold text-primary">✓</span>
                    {punkt}
                  </li>
                ))}
              </ul>
              {/* TODO: Stripe-Link – Checkout kommt als eigenes Paket */}
              <Link
                href="/login"
                data-stripe="paket"
                className={`${BTN_PRIMARY} ${BTN_LG} w-full`}
              >
                Jetzt PPWR|ready werden
              </Link>
              <p className="mt-3 text-center text-body-sm text-ink-muted">
                Transparenter Festpreis. Kein Angebotsprozess, keine
                Setup-Gebühr.
              </p>
            </div>
            <div className="flex flex-col gap-5">
              <div className="rounded border border-line bg-canvas p-6">
                <p className="mb-2 text-label font-semibold uppercase tracking-[0.02em] text-ink-muted">
                  Team-Lizenz
                </p>
                <p className="font-plex text-headline font-bold">
                  ab <span className="text-body-lg font-bold">€</span>1.499
                </p>
                <p className="mb-4 mt-2 text-body-sm text-ink-muted">
                  Für 5 Nutzer mit gemeinsamem Firmenprofil – ideal für
                  Qualitäts- und Compliance-Teams.
                </p>
                {/* TODO: Stripe-Link – Checkout kommt als eigenes Paket */}
                <Link
                  href="/login"
                  data-stripe="team"
                  className={`${BTN_GHOST} ${BTN_MD} w-full`}
                >
                  Team-Zugang anfragen
                </Link>
              </div>
              <div className="rounded border border-line bg-canvas p-6">
                <p className="mb-2 text-label font-semibold uppercase tracking-[0.02em] text-ink-muted">
                  Radar-Verlängerung
                </p>
                <p className="font-plex text-headline font-bold">
                  <span className="text-body-lg font-bold">€</span>290
                  <span className="text-body-sm font-medium text-ink-muted"> /Jahr</span>
                </p>
                <p className="mb-4 mt-2 text-body-sm text-ink-muted">
                  Nach dem ersten Jahr: Updates, Assistent und Webinare bleiben
                  aktuell.
                </p>
                {/* TODO: Stripe-Link – Checkout kommt als eigenes Paket */}
                <span
                  data-stripe="verlaengerung"
                  className="inline-block rounded border border-line-strong bg-surface px-2.5 py-1 text-label font-medium text-ink-muted"
                >
                  im Paket enthalten
                </span>
              </div>
            </div>
          </div>
          <p className="mt-5 text-center font-mono text-mono-sm text-ink-muted">
            {"// Zahlungsabwicklung über Stripe – Buttons werden zum Launch aktiviert"}
          </p>
        </div>
      </section>

      {/* Betroffenheits-Check-Band */}
      <section id="check" className="py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <div className="rounded bg-legal text-white">
            <div className="flex flex-wrap items-center justify-between gap-8 p-8 md:p-11">
              <div className="max-w-[52ch]">
                <Eyebrow className="text-gold">Kostenlos &amp; ohne Anmeldung</Eyebrow>
                <h2 className="mt-2 font-plex text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.04em]">
                  Erst prüfen: Betrifft mich die PPWR überhaupt?
                </h2>
                <p className="mt-2.5 text-body-lg text-[#cdd9ec]">
                  Fünf kurze Fragen, eine erste Einschätzung Ihrer Betroffenheit
                  – unverbindlich und ohne Login. Der ehrlichste Einstieg, den
                  wir anbieten können.
                </p>
              </div>
              <Link
                href="/check"
                className={`${BTN} ${BTN_LG} border-transparent bg-white text-legal hover:bg-[#eef2f8]`}
              >
                Betroffenheits-Check starten
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="border-t border-line bg-surface py-20">
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <SectionHead
            eyebrow="Häufige Fragen"
            titel="Was Sie vielleicht noch wissen wollen"
            zentriert
          />
          <div className="mx-auto max-w-[820px]">
            {[
              {
                frage: "Ist PPWR Radar eine Rechtsberatung?",
                antwort:
                  "Nein – und das ist bewusst so. PPWR Radar erklärt, ordnet ein, priorisiert und erstellt Entwürfe als Arbeitsgrundlage. Es ersetzt keine Rechtsberatung und begründet kein Mandatsverhältnis. Genau dort, wo Ihre Situation eine individuelle rechtliche Prüfung braucht, sagt das System das offen und verweist an unseren juristischen Partner, die Cattwyk Rechtsanwaltsgesellschaft.",
                offen: true,
              },
              {
                frage:
                  "Wie unterscheidet sich PPWR Radar von Muster-Vorlagen und Compliance-Software?",
                antwort:
                  "Muster-Vorlagen sind generisch – sie wissen nicht, wer Sie sind. Enterprise-Compliance-Software ist stark für Konzerne mit großen Datenbeständen, beginnt aber mit einem Angebots- und Integrationsprozess. PPWR Radar startet davor: Es klärt zuerst Ihre Rolle je Produktlinie, füllt Ihre Dokumente daraus vor und hält sie bei Rechtsänderungen aktuell – im Selbstbedienungszugang zum Festpreis. Und wo Ihre Situation Speziallösungen braucht (Labor-Bewertung der Recyclingfähigkeit, ERP-Integration, Rechtsberatung), sagen wir das ehrlich und nennen den richtigen Weg.",
              },
              {
                frage: "Woher weiß ich, dass die Inhalte stimmen?",
                antwort:
                  "Jede Aussage ist mit einer exakten Fundstelle in PPWR, VerpackDG oder dem Kommissions-Leitfaden belegt und trägt ein Rechtsstand-Datum. Die Wissensbasis wird von der Cattwyk Rechtsanwaltsgesellschaft juristisch verifiziert. Der Assistent antwortet ausschließlich aus dieser geprüften Basis – und sagt ehrlich, wenn zu einer Frage keine gesicherte Regelung vorliegt.",
              },
              {
                frage: "Was passiert, wenn sich die Rechtslage ändert?",
                antwort:
                  "Genau dafür ist der Radar da. Neue Durchführungsrechtsakte, Leitlinien und nationale Konkretisierungen fließen geprüft ein. Betroffene Nutzer werden aktiv benachrichtigt – und wenn ein bereits erstelltes Dokument auf einem veralteten Stand basiert, zeigt Ihr Dashboard „Update verfügbar“.",
              },
              {
                frage: "Für welche Unternehmen lohnt sich das?",
                antwort:
                  "Für alle, die Verpackungen herstellen, befüllen, unter eigener Marke in Verkehr bringen, importieren oder im E-Commerce direkt an Endkunden liefern. Wenn Sie nicht sicher sind, starten Sie mit dem kostenlosen Betroffenheits-Check – er sagt Ihnen in fünf Fragen, ob und wie stark Sie betroffen sind.",
              },
              {
                frage: "Was kostet es nach dem ersten Jahr?",
                antwort:
                  "Das Launch-Paket kostet einmalig 490 € und enthält zwölf Monate Radar. Danach halten Sie Ihren Zugang mit 290 €/Jahr aktuell – oder Sie nutzen die erstellten Dokumente einfach weiter, ohne Verlängerung. Es gibt kein automatisches Abo, das Sie übersehen könnten.",
              },
            ].map((eintrag) => (
              <details
                key={eintrag.frage}
                open={eintrag.offen}
                className="group mb-3 rounded border border-line bg-canvas open:border-primary"
              >
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 px-5 py-4 text-body font-semibold [&::-webkit-details-marker]:hidden">
                  {eintrag.frage}
                  <span
                    aria-hidden="true"
                    className="text-body-lg text-primary group-open:hidden"
                  >
                    +
                  </span>
                  <span
                    aria-hidden="true"
                    className="hidden text-body-lg text-primary group-open:block"
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
          <Eyebrow className="text-[#bfe0d6]">Der 12. August ist da</Eyebrow>
          <h2 className="mb-4 mt-2 font-plex text-[clamp(1.7rem,3.2vw,2.5rem)] font-bold leading-[1.15] tracking-[-0.04em]">
            Verschaffen Sie sich Klarheit – heute.
          </h2>
          <p className="mx-auto mb-8 max-w-[52ch] text-body-lg text-[#bfe0d6]">
            In 15 Minuten wissen Sie, welche Rolle Sie haben, was für Ihre
            Verpackungen gilt und welche Dokumente Sie brauchen.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/login"
              className={`${BTN} ${BTN_LG} border-transparent bg-white text-primary hover:bg-[#eef6f3]`}
            >
              PPWR|ready werden
            </Link>
            <a
              href="#check"
              className={`${BTN} ${BTN_LG} border-white/50 bg-transparent text-white hover:bg-white/10`}
            >
              Erst kostenlos prüfen
            </a>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-line bg-surface py-10">
        <div className="mx-auto flex w-full max-w-[1200px] flex-wrap items-start justify-between gap-6 px-6">
          <div className="max-w-[52ch]">
            <div className="mb-3.5">
              <Brand />
            </div>
            <p className="text-body-sm text-ink-muted">
              PPWR Radar ist ein Produkt des packaging journal. Juristischer
              Partner: Cattwyk Rechtsanwaltsgesellschaft.
            </p>
          </div>
          <div className="flex flex-wrap gap-12">
            <div>
              <h4 className="mb-3 text-label font-semibold uppercase tracking-[0.02em] text-ink-muted">
                Produkt
              </h4>
              <a href="#funktionen" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                Funktionen
              </a>
              <a href="#preise" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                Preise
              </a>
              <Link href="/check" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                Betroffenheits-Check
              </Link>
              <a href="#faq" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                FAQ
              </a>
            </div>
            <div>
              <h4 className="mb-3 text-label font-semibold uppercase tracking-[0.02em] text-ink-muted">
                Rechtliches
              </h4>
              <a href="#" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                Impressum
              </a>
              <a href="#" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                Datenschutz
              </a>
              <a href="#" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                AGB
              </a>
            </div>
            <div>
              <h4 className="mb-3 text-label font-semibold uppercase tracking-[0.02em] text-ink-muted">
                Konto
              </h4>
              <Link href="/login" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                Anmelden
              </Link>
              <Link href="/login" className="mb-2 block text-body-sm text-ink-muted hover:text-primary">
                Registrieren
              </Link>
            </div>
          </div>
        </div>
        <div className="mx-auto w-full max-w-[1200px] px-6">
          <p className="mt-7 border-t border-line pt-5 text-body-sm text-ink-muted">
            PPWR Radar erklärt, ordnet ein, priorisiert und erstellt Entwürfe.
            Es stellt keine Rechtsberatung dar und begründet kein
            Mandatsverhältnis. Die inhaltliche Verantwortung für die aus
            generierten Entwürfen übernommenen Angaben liegt beim Verwender. ©
            2026 packaging journal
          </p>
        </div>
      </footer>
    </div>
  );
}
