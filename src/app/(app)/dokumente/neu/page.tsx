import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { marked } from "marked";
import { Badge } from "@/components/badge";
import { PageHeader } from "@/components/page-header";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import {
  ladeVerfuegbareTemplates,
  rendereVorschau,
  TEMPLATE_TYPEN,
  type TemplateKey,
} from "@/lib/dokumente/service";
import { RendererFehler } from "@/lib/dokumente/renderer";
import { createClient } from "@/lib/supabase/server";
import { erforderePaket, istAdmin } from "@/lib/zugang";
import { dokumentErstellen, templatesImportieren } from "../actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Dokumente");
  return { title: `${t("neuTitel")} – PPWR Radar` };
}

export const dynamic = "force-dynamic";

/** Marker in der Vorschau sichtbar hervorheben. */
function markiere(html: string): string {
  return html
    .replaceAll(
      "[VORBEFÜLLT]",
      '<mark style="background:#e6f0ec;color:#006950;font-weight:600;padding:0 4px;border-radius:2px">VORBEFÜLLT</mark>'
    )
    .replaceAll(
      "[NUTZER-PFLICHT]",
      '<mark style="background:#fff8e0;color:#745b00;font-weight:600;padding:0 4px;border-radius:2px">NUTZER-PFLICHT</mark>'
    )
    .replaceAll(
      "[SYSTEM]",
      '<mark style="background:#eeeeee;color:#3d4944;font-weight:600;padding:0 4px;border-radius:2px">SYSTEM</mark>'
    );
}

export default async function NeuesDokumentPage({
  searchParams,
}: {
  searchParams: Promise<{
    typ?: string;
    verpackung?: string;
    fehler?: string;
    detail?: string;
    importiert?: string;
  }>;
}) {
  const zugang = await erforderePaket();
  const params = await searchParams;
  const t = await getTranslations("Dokumente");

  const templates = await ladeVerfuegbareTemplates();
  const admin = istAdmin(zugang.user.email);

  const typ =
    params.typ && params.typ in TEMPLATE_TYPEN && templates[params.typ as TemplateKey]
      ? (params.typ as TemplateKey)
      : null;

  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profile")
    .select("id")
    .eq("user_id", zugang.user.id)
    .maybeSingle();
  const { data: verpackungen } = profil
    ? await supabase
        .from("profil_verpackungen")
        .select("id, bezeichnung, produktlinie, verpackungstyp")
        .eq("profil_id", profil.id)
        .order("created_at", { ascending: true })
    : { data: [] };

  const verpackung =
    typ && params.verpackung
      ? (verpackungen ?? []).find((v) => v.id === params.verpackung) ?? null
      : null;

  // Vorschau rendern (Fehler aus der Erzeugung landen als Query-Param)
  let vorschauHtml: string | null = null;
  let vorschauHinweis: string | null = null;
  let vorschauStatus: { version: string; rechtsstand: string; entwurf: boolean } | null =
    null;
  let renderFehler: string | null = null;
  if (typ && verpackung) {
    try {
      const vorschau = await rendereVorschau(zugang.user.id, typ, verpackung.id);
      if (vorschau) {
        vorschauHtml = markiere(await marked.parse(vorschau.markdown));
        vorschauHinweis = vorschau.hinweis;
        vorschauStatus = {
          version: vorschau.templateVersion,
          rechtsstand: vorschau.templateRechtsstand,
          entwurf: vorschau.reviewStatus !== "cattwyk_freigegeben",
        };
      }
    } catch (e) {
      renderFehler =
        e instanceof RendererFehler ? e.fehlend.join(", ") : "unbekannt";
    }
  }

  const kartenKlasse = (aktivKarte: boolean) =>
    `block rounded border p-5 text-left transition-colors ${
      aktivKarte
        ? "border-primary bg-primary/5"
        : "border-line bg-canvas hover:border-primary"
    }`;

  return (
    <>
      <PageHeader title={t("neuTitel")} description={t("beschreibung")} />

      {params.importiert === "1" && (
        <p className="mb-6 rounded border border-primary bg-primary/5 px-4 py-3 text-body-sm text-ink">
          {t("importErfolg")}
        </p>
      )}
      {params.fehler === "render" && (
        <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
          {t("fehlerRender", { detail: params.detail ?? "—" })}
        </p>
      )}
      {params.fehler === "erzeugung" && (
        <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
          {t("fehlerErzeugung")}
        </p>
      )}

      {/* Schritt 1: Dokumenttyp */}
      <section className="mb-10">
        <h2 className="mb-4 text-label uppercase text-ink-muted">
          {t("schrittTyp")}
        </h2>
        {Object.keys(templates).length === 0 ? (
          <LegalCard>
            <div className="p-6">
              <p className="text-body text-ink-muted">{t("keineVorlagen")}</p>
              {admin && (
                <div className="mt-4">
                  <p className="text-body-sm text-ink-muted">
                    {t("keineVorlagenAdmin")}
                  </p>
                  <form action={templatesImportieren} className="mt-3">
                    <button
                      type="submit"
                      className="rounded bg-primary px-5 py-2.5 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                    >
                      {t("importCta")}
                    </button>
                  </form>
                </div>
              )}
            </div>
          </LegalCard>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            {(Object.keys(TEMPLATE_TYPEN) as TemplateKey[])
              .filter((key) => templates[key])
              .map((key) => (
                <Link
                  key={key}
                  href={`/dokumente/neu?typ=${key}`}
                  className={kartenKlasse(typ === key)}
                >
                  <span className="block text-body-lg font-bold text-ink">
                    {t(`typen.${key}`)}
                  </span>
                  <span className="mt-1 block text-body-sm text-ink-muted">
                    {t(`typenKurz.${key}`)}
                  </span>
                </Link>
              ))}
          </div>
        )}
      </section>

      {/* Schritt 2: Verpackung */}
      {typ && (
        <section className="mb-10">
          <h2 className="mb-4 text-label uppercase text-ink-muted">
            {t("schrittVerpackung")}
          </h2>
          {(verpackungen ?? []).length === 0 ? (
            <LegalCard>
              <div className="p-6">
                <p className="text-body text-ink-muted">
                  {t("keineVerpackungen")}
                </p>
                <Link
                  href="/onboarding"
                  className="mt-3 inline-block text-body-sm font-medium text-legal hover:underline"
                >
                  {t("zumOnboarding")} →
                </Link>
              </div>
            </LegalCard>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
              {(verpackungen ?? []).map((v) => (
                <Link
                  key={v.id}
                  href={`/dokumente/neu?typ=${typ}&verpackung=${v.id}`}
                  className={kartenKlasse(verpackung?.id === v.id)}
                >
                  <span className="block text-body font-bold text-ink">
                    {v.bezeichnung}
                  </span>
                  <span className="mt-0.5 block text-body-sm text-ink-muted">
                    {v.produktlinie ?? v.verpackungstyp}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Schritt 3: Vorschau + Erstellen */}
      {typ && verpackung && (
        <section>
          <h2 className="mb-4 text-label uppercase text-ink-muted">
            {t("schrittVorschau")}
          </h2>

          {renderFehler ? (
            <p className="rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
              {t("fehlerRender", { detail: renderFehler })}
            </p>
          ) : vorschauHtml ? (
            <>
              <div className="mb-4 flex flex-wrap items-center gap-2 text-body-sm text-ink-muted">
                <span>{t("markerLegende")}</span>
                <Badge variant="green">{t("markerVorbefuellt")}</Badge>
                <Badge variant="gold">{t("markerPflicht")}</Badge>
                <Badge variant="neutral">{t("markerSystem")}</Badge>
              </div>
              {vorschauStatus?.entwurf && (
                <p className="mb-4 rounded border border-gold bg-gold-tint px-4 py-3 text-body-sm text-gold-ink">
                  {t("entwurfHinweis")}
                </p>
              )}
              {vorschauHinweis && (
                <div className="mb-4 rounded border border-legal-tint bg-legal-tint/50 p-5">
                  <p className="text-label uppercase text-legal">
                    {t("hinweisVorAusfuellen")}
                  </p>
                  <div
                    className="prose-dokument mt-2 text-body-sm text-ink"
                    // Redaktionelle Vorlage aus generator_templates (Single Source of Law)
                    dangerouslySetInnerHTML={{
                      __html: markiere(String(marked.parse(vorschauHinweis))),
                    }}
                  />
                </div>
              )}
              <LegalCard>
                <div
                  className="prose-dokument max-h-[32rem] overflow-y-auto p-6 md:p-8"
                  dangerouslySetInnerHTML={{ __html: vorschauHtml }}
                />
                <LegalCardFooter>
                  {t(`typen.${typ}`)} · {vorschauStatus?.version} · Rechtsstand{" "}
                  {formatDate(vorschauStatus?.rechtsstand)}
                </LegalCardFooter>
              </LegalCard>

              <form action={dokumentErstellen} className="mt-6 flex items-center gap-4">
                <input type="hidden" name="typ" value={typ} />
                <input type="hidden" name="verpackung" value={verpackung.id} />
                <button
                  type="submit"
                  className="rounded bg-primary px-8 py-4 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
                >
                  {t("erstellen")}
                </button>
                <Link
                  href="/dokumente"
                  className="text-body-sm font-medium text-ink-muted hover:text-ink"
                >
                  {t("zurueck")}
                </Link>
              </form>
            </>
          ) : null}
        </section>
      )}
    </>
  );
}
