import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ersteinschaetzung } from "@/lib/check-einschaetzung";
import { evaluiereLinie, type LinienKontext, type RegelRow, type UnternehmenKontext } from "@/lib/rollen-engine";
import { ladeAppConfig, ladeRegeln } from "@/lib/rollen-service";
import { formatDate } from "@/lib/labels";
import { checkNeuStarten } from "../actions";
import { leseCheckAntworten } from "../check-config";

export const metadata: Metadata = {
  title: "Ihre Ersteinschätzung – PPWR Radar",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

const ROLLEN_LABELS: Record<string, string> = {
  erzeuger: "Erzeuger",
  hersteller: "Hersteller",
  importeur: "Importeur",
  vertreiber: "Vertreiber",
  endvertreiber: "Endvertreiber",
  fulfillment_dienstleister: "Fulfillment-Dienstleister",
  lieferant: "Lieferant",
};

const ESKALATION_FALLBACK =
  "Ihre Angaben lassen keine eindeutige Einordnung zu. Genau für solche Fälle bieten wir ein Erstgespräch mit unseren Compliance-Experten der Cattwyk Rechtsanwaltsgesellschaft an.";

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

  let regeln: RegelRow[] = [];
  try {
    regeln = await ladeRegeln();
  } catch {
    regeln = [];
  }
  if (regeln.length === 0) {
    return (
      <div className="rounded border border-line bg-canvas p-8 text-center">
        <p className="text-body text-ink-muted">
          Die Auswertung ist gerade nicht verfügbar. Bitte versuchen Sie es
          später erneut.
        </p>
        <Link href="/check" className="mt-6 inline-block text-body-sm font-medium text-legal hover:underline">
          Zurück zum Check
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
  const { stufe, unklar, aussage } = ersteinschaetzung(ergebnis, taetigkeit);

  const pflichtenTeaser: string[] = [];
  if (rollen.includes("erzeuger")) {
    pflichtenTeaser.push("Konformität & Kennzeichnung");
  }
  if (
    pflichten.some((p) =>
      ["registrierung_zsvr", "systembeteiligung", "datenmeldung"].includes(p)
    )
  ) {
    pflichtenTeaser.push("Registrierung & Systembeteiligung (ZSVR)");
  }
  if (pflichten.includes("bevollmaechtigter_ehv")) {
    pflichtenTeaser.push("Bevollmächtigter für die erweiterte Herstellerverantwortung");
  }

  const eskalationsText =
    (await ladeAppConfig("cattwyk_erstgespraech_hinweis")) ?? ESKALATION_FALLBACK;
  const heute = new Date().toISOString().slice(0, 10);

  return (
    <>
      <header className="mb-10 text-center">
        <h1 className="text-display-sm text-ink">Ihre Ersteinschätzung</h1>
        <p className="mt-3 text-body-lg text-ink-muted">
          Basierend auf Ihren Angaben im Betroffenheits-Check.
        </p>
      </header>

      <div className="rounded border border-line bg-canvas">
        <div className="p-6 md:p-8">
          {unklar ? (
            <div className="border-l-4 border-line-strong bg-surface p-5">
              <h2 className="text-label uppercase text-ink-muted">
                Einordnung offen
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
                        Ihre Rolle: voraussichtlich{" "}
                        <b>
                          {rollen.map((r) => ROLLEN_LABELS[r] ?? r).join(", ")}
                        </b>
                      </>
                    }
                  />
                )}
                {pflichtenTeaser.length > 0 && (
                  <CheckZeile
                    text={
                      <>
                        Relevante Pflichtenbereiche seit 12.08.2026:{" "}
                        <b>{pflichtenTeaser.join(", ")}</b>
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
                    Vollständige Pflichtenliste, Fristen 2028/2030 und Ihre
                    Dokumente – Konformitätserklärung, technische Dokumentation.
                  </span>
                  <span className="sr-only">
                    Die vollständige Pflichtenliste ist Teil des PPWR|ready-Pakets.
                  </span>
                </li>
              </ul>
            </>
          )}
        </div>
        <div className="border-t border-line p-4 font-mono text-mono-sm uppercase text-legal">
          Basierend auf Verordnung (EU) 2025/40 · Stand {formatDate(heute)}
        </div>
      </div>

      {/* Paywall-CTA */}
      <div className="mt-12 text-center">
        <h2 className="text-headline text-ink">
          Was heißt das konkret für Ihre Verpackungen?
        </h2>
        <p className="mx-auto mt-3 max-w-lg text-body text-ink-muted">
          PPWR Radar erstellt Ihr vollständiges Compliance-Profil – mit Rollen
          je Produktlinie, Status-Analyse, persönlichem Fristen-Dashboard und
          Ihren Dokumenten.
        </p>
        {/* TODO: Stripe-Link – Checkout kommt als eigenes Paket */}
        <Link
          href="/login"
          data-stripe="paket"
          className="mt-8 inline-flex items-center gap-2 rounded bg-primary px-8 py-4 text-body-lg font-semibold text-white transition-colors hover:bg-primary-dark"
        >
          Jetzt PPWR|ready werden – 490 € →
        </Link>
        <div className="mt-4">
          <Link
            href="/#preise"
            className="text-body-sm font-medium text-legal hover:underline"
          >
            Mehr über PPWR Radar erfahren
          </Link>
        </div>
        <form action={checkNeuStarten} className="mt-8">
          <button
            type="submit"
            className="text-body-sm font-medium text-ink-muted hover:text-ink"
          >
            Check neu starten
          </button>
        </form>
      </div>
    </>
  );
}
