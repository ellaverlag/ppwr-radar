import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { PruefstatusBadge } from "@/components/pruefstatus-badge";
import { DokumentErstellenLink } from "@/components/dokument-erstellen-link";
import { ArrowBackIcon } from "@/components/icons";
import { GiltStatusIcon, KategorieIcon } from "@/components/kategorie-icons";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import { createClient } from "@/lib/supabase/server";
import {
  tatbestandText,
  type Anforderung,
  type GiltStatus,
} from "@/lib/wissensbasis";
import { pruefeZugang } from "@/lib/zugang";
import { Erklaertiefen, type Tiefe } from "@/app/(app)/wissen/anforderungen/[id]/erklaertiefen";

/**
 * Vollständiger Anforderungs-Artikel – wird von der Detailseite im Wissen-
 * Bereich UND vom Einblick (Schiebefenster, ohne App-Rahmen) gerendert.
 * kompakt: ohne Zurück-Link, kleinere Überschrift.
 */
function giltStatusVariant(status: GiltStatus) {
  if (status === "in_kraft") return "green" as const;
  if (status === "entwurf_eu") return "neutral" as const;
  return "gold" as const;
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-10">
      <h2 className="text-label uppercase text-ink-muted">{title}</h2>
      <div className="mt-3 border-l border-line-strong pl-4 text-body text-ink">
        {children}
      </div>
    </section>
  );
}

export async function AnforderungArtikel({
  anforderung,
  kompakt = false,
}: {
  anforderung: Anforderung;
  kompakt?: boolean;
}) {
  const t = await getTranslations("Anforderung");
  const tWissen = await getTranslations("Wissen");
  const tLabels = await getTranslations("Labels");

  // „Dokument erstellen“ nur für freigeschaltete Nutzer (Generator gated).
  // Produktlinie nur vorwählen, wenn genau eine aktive Linie existiert.
  let zeigeGenerator = false;
  let eindeutigeVerpackungId: string | null = null;
  if (anforderung.generator_key) {
    const zugang = await pruefeZugang();
    if (zugang?.freigeschaltet) {
      zeigeGenerator = true;
      const supabase = await createClient();
      const { data: profil } = await supabase
        .from("profile")
        .select("id")
        .eq("user_id", zugang.user.id)
        .maybeSingle();
      if (profil) {
        const { data: verpackungen } = await supabase
          .from("profil_verpackungen")
          .select("id, status")
          .eq("profil_id", profil.id);
        const aktive = (verpackungen ?? []).filter(
          (zeile) => zeile.status !== "stillgelegt"
        );
        if (aktive.length === 1) {
          eindeutigeVerpackungId = aktive[0].id as string;
        }
      }
    }
  }

  const tiefen: Tiefe[] = [
    { key: "einfach", text: anforderung.kurzerklaerung },
    { key: "fachlich", text: anforderung.erklaerung_fachlich },
    { key: "rechtstext", text: anforderung.erklaerung_rechtstext },
  ]
    .filter((tiefe): tiefe is { key: string; text: string } =>
      Boolean(tiefe.text)
    )
    .map((tiefe) => ({ ...tiefe, label: tWissen(`tiefen.${tiefe.key}`) }));

  return (
    <article className="max-w-3xl">
      {!kompakt && (
        <Link
          href="/wissen"
          className="inline-flex items-center gap-2 text-body-sm font-medium text-legal hover:underline"
        >
          <ArrowBackIcon className="h-4 w-4" />
          <span>{t("zurueck")}</span>
        </Link>
      )}

      <header className={kompakt ? "" : "mt-8"}>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="green">
            <KategorieIcon kategorie={anforderung.kategorie} />
            {tLabels(`kategorien.${anforderung.kategorie}`)}
          </Badge>
          <Badge variant={giltStatusVariant(anforderung.gilt_status)}>
            <GiltStatusIcon status={anforderung.gilt_status} />
            {tLabels(`giltStatus.${anforderung.gilt_status}`)}
          </Badge>
          <Badge variant="neutral">
            {t("rechtsstandChip", { datum: formatDate(anforderung.rechtsstand) })}
          </Badge>
          <PruefstatusBadge
            status={anforderung.review_status}
            labels={tLabels.raw("pruefstatus")}
          />
        </div>
        <h1 className={`mt-6 text-ink ${kompakt ? "text-headline" : "text-display-sm"}`}>
          {anforderung.nr != null && (
            <span className="mr-3 font-mono text-headline font-normal text-ink-muted">
              #{String(anforderung.nr).padStart(2, "0")}
            </span>
          )}
          {anforderung.titel}
        </h1>
        <p className="mt-3 font-mono text-mono-sm uppercase text-ink-muted">
          {t("giltAb", { datum: formatDate(anforderung.gilt_ab) })}
        </p>
        {zeigeGenerator && (
          <div className="mt-5">
            <DokumentErstellenLink
              generatorKey={anforderung.generator_key}
              verpackungId={eindeutigeVerpackungId}
              className="inline-flex items-center rounded bg-primary px-5 py-2.5 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90 hover:no-underline"
            />
          </div>
        )}
      </header>

      {/* Erklärtiefen: Einfach (kurzerklaerung) | Fachlich | Rechtstext */}
      {tiefen.length > 0 ? (
        <div className="mt-8">
          <Erklaertiefen tiefen={tiefen} />
        </div>
      ) : (
        <p className="mt-8 rounded border border-line-strong bg-surface px-4 py-3 text-body-sm text-ink-muted">
          {tWissen("keineErklaerung")}
        </p>
      )}

      {anforderung.handlungsanweisung && (
        <Section title={tWissen("wasZuTun")}>
          <p className="whitespace-pre-line">{anforderung.handlungsanweisung}</p>
        </Section>
      )}

      {/* tatbestand ist jsonb (String ODER {text}) – nur normalisiert rendern */}
      {tatbestandText(anforderung.tatbestand) && (
        <Section title={tWissen("tatbestandTitel")}>
          <p className="whitespace-pre-line">
            {tatbestandText(anforderung.tatbestand)}
          </p>
        </Section>
      )}

      {anforderung.rechtsfolgen_je_rolle &&
        Object.keys(anforderung.rechtsfolgen_je_rolle).length > 0 && (
          <Section title={tWissen("rechtsfolgenTitel")}>
            <dl className="space-y-2">
              {Object.entries(anforderung.rechtsfolgen_je_rolle).map(
                ([rolle, folge]) => (
                  <div key={rolle}>
                    <dt className="inline font-semibold text-ink">
                      {tLabels.has(`rollen.${rolle}`)
                        ? tLabels(`rollen.${rolle}`)
                        : rolle}
                      :{" "}
                    </dt>
                    <dd className="inline text-ink-muted">{String(folge)}</dd>
                  </div>
                )
              )}
            </dl>
          </Section>
        )}

      {anforderung.risiko_bei_verstoss && (
        <Section title={t("risiko")}>
          <p className="whitespace-pre-line">
            {anforderung.risiko_bei_verstoss}
          </p>
        </Section>
      )}

      {anforderung.ausnahmen && (
        <Section title={t("ausnahmen")}>
          <p className="whitespace-pre-line">{anforderung.ausnahmen}</p>
        </Section>
      )}

      {anforderung.uebergangsregeln && (
        <Section title={t("uebergangsregeln")}>
          <p className="whitespace-pre-line">{anforderung.uebergangsregeln}</p>
        </Section>
      )}

      <Section title={t("betrifft")}>
        <dl className="space-y-2 text-body">
          <div>
            <dt className="inline font-semibold text-ink">{t("rollen")} </dt>
            <dd className="inline text-ink-muted">
              {anforderung.betrifft_rollen.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ink">
              {t("verpackungstypen")}{" "}
            </dt>
            <dd className="inline text-ink-muted">
              {anforderung.betrifft_verpackungstypen.join(", ")}
            </dd>
          </div>
          <div>
            <dt className="inline font-semibold text-ink">
              {t("materialien")}{" "}
            </dt>
            <dd className="inline text-ink-muted">
              {anforderung.betrifft_materialien.join(", ")}
            </dd>
          </div>
        </dl>
      </Section>

      <LegalCard className="mt-12">
        <div className="p-6">
          <h2 className="text-label uppercase text-ink-muted">
            {t("quellenangabe")}
          </h2>
          <dl className="mt-4 space-y-3 text-body">
            <div>
              <dt className="inline font-semibold text-ink">
                {t("rechtsquelle")}{" "}
              </dt>
              <dd className="inline text-ink-muted">
                {anforderung.rechtsquelle}
              </dd>
              {anforderung.rechtsquelle_link && (
                <a
                  href={anforderung.rechtsquelle_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="mt-1 block text-body-sm font-medium text-legal hover:underline"
                >
                  {t("amtsblattLink")} &rarr;
                </a>
              )}
            </div>
            {anforderung.verpackdg_quelle && (
              <div>
                <dt className="inline font-semibold text-ink">
                  {t("bezugVerpackg")}{" "}
                </dt>
                <dd className="inline text-ink-muted">
                  {anforderung.verpackdg_quelle}
                </dd>
              </div>
            )}
            {anforderung.verweise && anforderung.verweise.length > 0 && (
              <div>
                <dt className="inline font-semibold text-ink">
                  {t("verweise")}{" "}
                </dt>
                <dd className="inline text-ink-muted">
                  {anforderung.verweise.join(", ")}
                </dd>
              </div>
            )}
          </dl>
        </div>
        <LegalCardFooter>
          {t("footerZeile", {
            rechtsquelle: anforderung.rechtsquelle,
            datum: formatDate(anforderung.rechtsstand),
          })}
        </LegalCardFooter>
      </LegalCard>
    </article>
  );
}
