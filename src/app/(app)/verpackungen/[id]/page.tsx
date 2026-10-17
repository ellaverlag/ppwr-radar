import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { BestaetigenButton } from "@/components/bestaetigen-button";
import { PageHeader } from "@/components/page-header";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { VerpackungErgebnisKarte } from "@/components/verpackung-ergebnis-karte";
import { ladeRollenBegriffe } from "@/lib/rollen-service";
import { createClient } from "@/lib/supabase/server";
import {
  brauchtLieferantSitz,
  ladeHinweise,
  ladeVerpackungen,
  ladeVerpackungsErgebnisse,
  LIEFERANT_SITZE,
  MARKEN,
  VERPACKUNG_ARTEN,
  VERPACKUNG_BEZUEGE,
  VERPACKUNG_FORMEN,
  type VerpackungZeile,
} from "@/lib/verpackungen-service";
import { getAnforderungen } from "@/lib/wissensbasis";
import { erforderePaket } from "@/lib/zugang";
import {
  verpackungReaktivieren,
  verpackungSpeichern,
  verpackungStilllegen,
} from "../verpackung-actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("verpackungDetail") };
}

export const dynamic = "force-dynamic";

const FEHLER_KEYS = ["bezeichnung", "auswahl", "lieferant", "speichern", "limit"] as const;

const EINGABE =
  "mt-2 w-full rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none";
const LABEL = "block text-label uppercase text-ink-muted";
const HILFE = "mt-2 text-body-sm text-ink-muted";

/**
 * Produktlinien-Detail: Verpackungen dieser Linie (Liste + Formular) und je
 * Verpackung die Ergebnis-Karte (Rollen, Pflichten-Matrix, Vereinfachungs-
 * Hinweise). Die Linie selbst wird weiterhin über den Mini-Wizard gepflegt.
 */
export default async function ProduktlinieDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ bearbeiten?: string; fehler?: string; gespeichert?: string }>;
}) {
  const zugang = await erforderePaket();
  const { id: produktlinieId } = await params;
  const query = await searchParams;
  const t = await getTranslations("Verpackungen");
  const tLabels = await getTranslations("Labels");

  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profile")
    .select("id, onboarding_abgeschlossen")
    .eq("user_id", zugang.user.id)
    .maybeSingle();
  if (!profil?.onboarding_abgeschlossen) redirect("/verpackungen");

  const { data: linie } = await supabase
    .from("profil_verpackungen")
    .select("id, bezeichnung, status")
    .eq("id", produktlinieId)
    .eq("profil_id", profil.id)
    .maybeSingle();
  if (!linie) notFound();

  const [verpackungen, begriffe, anforderungen] = await Promise.all([
    ladeVerpackungen(produktlinieId),
    ladeRollenBegriffe(),
    getAnforderungen().catch(() => []),
  ]);
  const ergebnisse = await ladeVerpackungsErgebnisse(verpackungen.map((v) => v.id));
  const alleHinweisKeys = [
    ...new Set([...ergebnisse.values()].flatMap((e) => e.hinweise)),
  ];
  const hinweise = await ladeHinweise(alleHinweisKeys).catch(() => []);
  const anforderungIdNachNr = new Map<number, string>(
    anforderungen.filter((a) => a.nr != null).map((a) => [a.nr as number, a.id])
  );

  const bearbeitete: VerpackungZeile | null = query.bearbeiten
    ? verpackungen.find((v) => v.id === query.bearbeiten) ?? null
    : null;
  const fehlerKey = FEHLER_KEYS.find((key) => key === query.fehler);
  const rollenLabel = (rolle: string) =>
    begriffe[rolle]?.begriff_de ??
    (tLabels.has(`rollen.${rolle}`) ? tLabels(`rollen.${rolle}`) : rolle);

  return (
    <>
      <PageHeader
        title={t("detailTitel", { name: linie.bezeichnung as string })}
        description={t("detailBeschreibung")}
      />

      <p className="mb-6">
        <Link href="/verpackungen" className="text-body-sm font-medium text-ink-muted hover:text-ink">
          {t("detailZurueck")}
        </Link>
      </p>

      {query.gespeichert && (
        <p className="mb-6 rounded border border-primary bg-primary/5 px-4 py-3 text-body-sm text-ink">
          {t("einheitGespeichert", { name: query.gespeichert })}
        </p>
      )}
      {fehlerKey && (
        <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
          {t(`einheitFehler.${fehlerKey}`)}
        </p>
      )}

      {/* Liste */}
      <section className="mb-10">
        <h2 className="mb-4 text-label uppercase text-ink-muted">{t("einheitenTitel")}</h2>
        {verpackungen.length === 0 ? (
          <LegalCard>
            <p className="p-6 text-body text-ink-muted">{t("einheitenLeer")}</p>
          </LegalCard>
        ) : (
          <LegalCard>
            <div className="hidden grid-cols-12 gap-4 rounded-t bg-surface px-6 py-3 text-label uppercase text-ink-muted md:grid">
              <span className="col-span-3">{t("einheitenSpalteBezeichnung")}</span>
              <span className="col-span-3">{t("einheitenSpalteMerkmale")}</span>
              <span className="col-span-3">{t("einheitenSpalteRollen")}</span>
              <span className="col-span-3">{t("einheitenSpalteAktionen")}</span>
            </div>
            <ul className="divide-y divide-line">
              {verpackungen.map((v) => {
                const e = ergebnisse.get(v.id);
                const stillgelegt = v.status === "stillgelegt";
                const unklar = e != null && e.rollen.length === 0 && e.herleitung.some((h) => h.regel_id === "D5");
                return (
                  <li
                    key={v.id}
                    className={`grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-12 md:items-center md:gap-4 ${
                      stillgelegt ? "bg-surface/60" : ""
                    }`}
                  >
                    <div className="md:col-span-3">
                      <p className={`text-body-lg font-bold ${stillgelegt ? "text-ink-muted" : "text-ink"}`}>
                        {v.bezeichnung}
                      </p>
                      {v.material && (
                        <p className="mt-1 text-body-sm text-ink-muted">{v.material}</p>
                      )}
                    </div>
                    <div className="md:col-span-3">
                      <p className="text-body-sm text-ink-muted">
                        {tLabels(`verpackung.art.${v.art}`)} · {tLabels(`verpackung.form.${v.form}`)}
                      </p>
                      <p className="mt-1 text-body-sm text-ink-muted">
                        {tLabels(`verpackung.bezug.${v.bezug}`)}
                        {brauchtLieferantSitz(v.bezug) && v.lieferant_sitz
                          ? ` (${tLabels(`verpackung.lieferantSitz.${v.lieferant_sitz}`)})`
                          : ""}
                      </p>
                      <p className="mt-1 flex flex-wrap gap-1.5">
                        {v.lebensmittelkontakt && (
                          <Badge variant="neutral">{tLabels("verpackung.lebensmittelkontakt")}</Badge>
                        )}
                        {v.mehrweg && <Badge variant="neutral">{tLabels("verpackung.mehrweg")}</Badge>}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 md:col-span-3">
                      {stillgelegt ? (
                        <Badge variant="neutral">{t("einheitStillgelegt")}</Badge>
                      ) : !e ? (
                        <Badge variant="neutral">{t("einheitKeinErgebnis")}</Badge>
                      ) : unklar ? (
                        <Badge variant="gold">{t("einordnungOffen")}</Badge>
                      ) : (
                        <>
                          {e.rollen.map((rolle) => (
                            <Badge key={rolle} variant="blue">
                              {rollenLabel(rolle)}
                            </Badge>
                          ))}
                          {e.vorbehalt && (
                            <Badge variant="neutral">{t("einheitVorbehalt")}</Badge>
                          )}
                        </>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-2 md:col-span-3">
                      {e && !stillgelegt && (
                        <a
                          href={`#v-${v.id}`}
                          className="rounded border border-line-strong px-3 py-1.5 text-label uppercase tracking-widest text-ink-muted transition-colors hover:border-ink hover:text-ink"
                        >
                          {t("einheitErgebnisAnzeigen")}
                        </a>
                      )}
                      <Link
                        href={`/verpackungen/${produktlinieId}?bearbeiten=${v.id}#formular`}
                        className="rounded border border-line-strong px-3 py-1.5 text-label uppercase tracking-widest text-ink-muted transition-colors hover:border-ink hover:text-ink"
                      >
                        {t("einheitBearbeiten")}
                      </Link>
                      {stillgelegt ? (
                        <form action={verpackungReaktivieren}>
                          <input type="hidden" name="ref" value={`${produktlinieId}|${v.id}`} />
                          <button
                            type="submit"
                            className="rounded border border-line-strong px-3 py-1.5 text-label uppercase tracking-widest text-ink-muted transition-colors hover:border-ink hover:text-ink"
                          >
                            {t("einheitReaktivieren")}
                          </button>
                        </form>
                      ) : (
                        <BestaetigenButton
                          action={verpackungStilllegen}
                          hiddenName="ref"
                          hiddenValue={`${produktlinieId}|${v.id}`}
                          bestaetigung={t("einheitStilllegenBestaetigung", { name: v.bezeichnung })}
                          label={t("einheitStilllegen")}
                        />
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
            <LegalCardFooter>{t("formularHinweis")}</LegalCardFooter>
          </LegalCard>
        )}
      </section>

      {/* Formular */}
      <section id="formular" className="mb-10">
        <h2 className="mb-4 text-label uppercase text-ink-muted">
          {bearbeitete
            ? t("formularTitelBearbeiten", { name: bearbeitete.bezeichnung })
            : t("formularTitelNeu")}
        </h2>
        <div className="rounded border border-line bg-canvas p-6 md:p-10">
          <form action={verpackungSpeichern} className="space-y-8">
            <input type="hidden" name="produktlinie" value={produktlinieId} />
            {bearbeitete && <input type="hidden" name="id" value={bearbeitete.id} />}

            <div>
              <label htmlFor="bezeichnung" className={LABEL}>
                {t("formularBezeichnung")} *
              </label>
              <input
                id="bezeichnung"
                name="bezeichnung"
                type="text"
                required
                maxLength={80}
                defaultValue={bearbeitete?.bezeichnung ?? ""}
                placeholder={t("formularBezeichnungPlaceholder")}
                className={EINGABE}
              />
            </div>

            <fieldset>
              <legend className={LABEL}>{t("formularArt")} *</legend>
              <div className="mt-3 space-y-3">
                {VERPACKUNG_ARTEN.map((art) => (
                  <OptionZeile
                    key={art}
                    name="art"
                    wert={art}
                    label={tLabels(`verpackung.art.${art}`)}
                    erklaerung={tLabels(`verpackung.artErklaerung.${art}`)}
                    checked={(bearbeitete?.art ?? "verkauf") === art}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={LABEL}>{t("formularForm")} *</legend>
              <div className="mt-3 space-y-3">
                {VERPACKUNG_FORMEN.map((form) => (
                  <OptionZeile
                    key={form}
                    name="form"
                    wert={form}
                    label={tLabels(`verpackung.form.${form}`)}
                    erklaerung={tLabels(`verpackung.formErklaerung.${form}`)}
                    checked={(bearbeitete?.form ?? "formstabil") === form}
                  />
                ))}
              </div>
            </fieldset>

            <fieldset>
              <legend className={LABEL}>{t("formularBezug")} *</legend>
              <div className="mt-3 space-y-3">
                {VERPACKUNG_BEZUEGE.map((bezug) => (
                  <OptionZeile
                    key={bezug}
                    name="bezug"
                    wert={bezug}
                    label={tLabels(`verpackung.bezug.${bezug}`)}
                    erklaerung={tLabels(`verpackung.bezugErklaerung.${bezug}`)}
                    checked={(bearbeitete?.bezug ?? "fertig_gekauft") === bezug}
                  />
                ))}
              </div>
            </fieldset>

            <div>
              <label htmlFor="lieferant_sitz" className={LABEL}>
                {t("formularLieferantSitz")}
              </label>
              <select
                id="lieferant_sitz"
                name="lieferant_sitz"
                defaultValue={bearbeitete?.lieferant_sitz ?? "DE"}
                className={EINGABE}
              >
                {LIEFERANT_SITZE.map((sitz) => (
                  <option key={sitz} value={sitz}>
                    {tLabels(`verpackung.lieferantSitz.${sitz}`)}
                  </option>
                ))}
              </select>
              <p className={HILFE}>{tLabels("verpackung.lieferantSitzHilfe")}</p>
            </div>

            <div>
              <label htmlFor="marke" className={LABEL}>
                {t("formularMarke")} *
              </label>
              <select
                id="marke"
                name="marke"
                defaultValue={bearbeitete?.marke ?? "keine"}
                className={EINGABE}
              >
                {MARKEN.map((marke) => (
                  <option key={marke} value={marke}>
                    {tLabels(`verpackung.marke.${marke}`)}
                  </option>
                ))}
              </select>
              <p className={HILFE}>{tLabels("verpackung.markeHilfe")}</p>
            </div>

            <div>
              <label htmlFor="material" className={LABEL}>
                {t("formularMaterial")}
              </label>
              <input
                id="material"
                name="material"
                type="text"
                maxLength={120}
                defaultValue={bearbeitete?.material ?? ""}
                className={EINGABE}
              />
              <p className={HILFE}>{tLabels("verpackung.materialHilfe")}</p>
            </div>

            <div className="flex flex-wrap gap-6">
              <label className="flex items-center gap-3 text-body text-ink">
                <input
                  type="checkbox"
                  name="lebensmittelkontakt"
                  value="ja"
                  defaultChecked={bearbeitete?.lebensmittelkontakt ?? false}
                  className="h-4 w-4 accent-[#006950]"
                />
                {tLabels("verpackung.lebensmittelkontakt")}
              </label>
              <label className="flex items-center gap-3 text-body text-ink">
                <input
                  type="checkbox"
                  name="mehrweg"
                  value="ja"
                  defaultChecked={bearbeitete?.mehrweg ?? false}
                  className="h-4 w-4 accent-[#006950]"
                />
                {tLabels("verpackung.mehrweg")}
              </label>
            </div>

            <div className="flex items-center justify-between border-t border-line pt-6">
              {bearbeitete ? (
                <Link
                  href={`/verpackungen/${produktlinieId}`}
                  className="text-body-sm font-medium text-ink-muted hover:text-ink"
                >
                  {t("formularAbbrechen")}
                </Link>
              ) : (
                <span className="text-body-sm text-ink-muted">{t("formularHinweis")}</span>
              )}
              <button
                type="submit"
                className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
              >
                {t("formularSpeichern")}
              </button>
            </div>
          </form>
        </div>
      </section>

      {/* Ergebnis-Karten */}
      {verpackungen.some((v) => v.status === "aktiv" && ergebnisse.has(v.id)) && (
        <section>
          <h2 className="mb-4 text-label uppercase text-ink-muted">{t("ergebnisseTitel")}</h2>
          <div className="space-y-6">
            {verpackungen
              .filter((v) => v.status === "aktiv" && ergebnisse.has(v.id))
              .map((v) => {
                const e = ergebnisse.get(v.id)!;
                const unklar =
                  e.rollen.length === 0 && e.herleitung.some((h) => h.regel_id === "D5");
                return (
                  <VerpackungErgebnisKarte
                    key={v.id}
                    verpackung={v}
                    rollen={e.rollen}
                    pflichten={e.pflichten}
                    herleitung={e.herleitung}
                    vorbehalt={e.vorbehalt}
                    unklar={unklar}
                    hinweise={hinweise.filter((h) => e.hinweise.includes(h.bedingung_key))}
                    anforderungIdNachNr={anforderungIdNachNr}
                    begriffe={begriffe}
                    engineVersion={e.engine_version}
                    rechtsstand={e.rechtsstand}
                    offen={verpackungen.length === 1 || query.gespeichert === v.bezeichnung}
                  />
                );
              })}
          </div>
        </section>
      )}
    </>
  );
}

/** Radio-Zeile mit Erklärtext (Stil der Wizard-Optionen). */
function OptionZeile({
  name,
  wert,
  label,
  erklaerung,
  checked,
}: {
  name: string;
  wert: string;
  label: string;
  erklaerung: string;
  checked: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-4 rounded border border-line-strong bg-canvas px-5 py-4 transition-colors hover:border-ink-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
      <input
        type="radio"
        name={name}
        value={wert}
        defaultChecked={checked}
        required
        className="mt-1.5 h-4 w-4 accent-[#006950]"
      />
      <span className="min-w-0 flex-1">
        <span className="block text-body font-semibold text-ink">{label}</span>
        <span className="mt-1 block text-body-sm leading-snug text-ink-muted">{erklaerung}</span>
      </span>
    </label>
  );
}
