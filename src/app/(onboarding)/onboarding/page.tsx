import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import {
  computeSteps,
  firstOpenStep,
  isAnswered,
  OPTION_KEYS,
  parseOptionen,
  parseState,
  stepKey,
  type WizardState,
  type WizardStep,
} from "@/lib/onboarding";
import { createClient } from "@/lib/supabase/server";
import { ladeBegriffsLemmata } from "@/lib/glossar";
import {
  getRollenDefinitionen,
  getWizardFragen,
  type WizardFrage,
} from "@/lib/wissensbasis";
import { erforderePaket } from "@/lib/zugang";
import {
  antwortSpeichern,
  onboardingAbschliessen,
  stammdatenSpeichern,
} from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("onboarding") };
}

export const dynamic = "force-dynamic";

const FEHLER_KEYS = ["produktlinien", "antwort", "firmenname", "engine"] as const;

/**
 * Erklärhilfen je Antwort-Option: Die STRUKTUR (welche Option welchen
 * Begriff erklärt) liegt hier, die TEXTE kommen aus der Datenbank
 * (glossar_lemmata typ=begriff bzw. rollen_definitionen). Optionen ohne
 * Zuordnung bleiben ohne Zweitzeile – nachpflegbar über neue Lemmata.
 */
const ERKLAERUNGS_QUELLEN: Record<
  string,
  Record<string, { art: "lemma"; code: string } | { art: "rolle"; id: string }>
> = {
  F05: {
    verkauf: { art: "lemma", code: "L52" },
    um: { art: "lemma", code: "L53" },
    transport: { art: "lemma", code: "L54" },
    service: { art: "lemma", code: "L51" },
    // ecommerce, primaerproduktion: noch kein Begriffs-Lemma (Lücken-Liste)
  },
  F06: {
    herstellen_lassen: { art: "lemma", code: "L48" },
    kauft_verpackte_ware: { art: "rolle", id: "vertreiber" },
    importiert_drittland: { art: "rolle", id: "importeur" },
    liefert_an_endabnehmer: { art: "rolle", id: "hb_endabnehmer" },
    lagert_und_versendet_fuer_dritte: {
      art: "rolle",
      id: "fulfillment_dienstleister",
    },
    liefert_verpackungen_oder_material: { art: "rolle", id: "lieferant" },
    // stellt_verpackung_physisch_her, befuellt_versiegelt, packt_aus: Lücke
  },
  F07: {
    fremde: { art: "lemma", code: "L48" },
    // eigene, keine: Lücke
  },
};

function kuerzeErklaerung(text: string, max = 180): string {
  const t = text.trim().replace(/\s+/g, " ");
  if (t.length <= max) return t;
  const geschnitten = t.slice(0, max);
  return `${geschnitten.slice(0, geschnitten.lastIndexOf(" "))} …`;
}

async function ladeErklaerungen(
  frageId: string
): Promise<Record<string, string>> {
  const quellen = ERKLAERUNGS_QUELLEN[frageId];
  if (!quellen) return {};
  const [lemmata, rollen] = await Promise.all([
    ladeBegriffsLemmata(),
    getRollenDefinitionen().catch(() => []),
  ]);
  const ergebnis: Record<string, string> = {};
  for (const [option, quelle] of Object.entries(quellen)) {
    const text =
      quelle.art === "lemma"
        ? lemmata.find((l) => l.code === quelle.code)?.kurzerklaerung
        : rollen.find((r) => r.rolle_id === quelle.id)?.definition_kurz;
    if (text) ergebnis[option] = kuerzeErklaerung(text);
  }
  return ergebnis;
}

type Uebersetzer = Awaited<ReturnType<typeof getTranslations<"Onboarding">>>;

function Fortschritt({
  aktuell,
  gesamt,
  t,
}: {
  aktuell: number;
  gesamt: number;
  t: Uebersetzer;
}) {
  const prozent = Math.round((aktuell / gesamt) * 100);
  return (
    <div className="mb-8">
      <p className="mb-2 text-label uppercase text-ink-muted">
        {t("fortschritt", { aktuell, gesamt })}
      </p>
      <div className="h-1.5 w-full rounded-full bg-line">
        <div
          className="h-1.5 rounded-full bg-primary"
          style={{ width: `${prozent}%` }}
        />
      </div>
    </div>
  );
}

function OptionRow({
  typ,
  wert,
  label,
  checked,
  erklaerung,
}: {
  typ: "radio" | "checkbox";
  wert: string;
  label: string;
  checked: boolean;
  erklaerung?: string;
}) {
  // Fundstellen wie „(Art. 3 Abs. 1 Nr. 5)“ ans Zeilenende in Mono –
  // der Alltagsbegriff führt, die Fundstelle belegt
  const m = label.match(/^(.*?)\s*\(((?:Art\.|Nr\.)[^)]*)\)\s*$/);
  const text = m ? m[1] : label;
  const fundstelle = m?.[2];

  return (
    <label className="flex cursor-pointer items-start gap-4 rounded border border-line-strong bg-canvas px-5 py-4 transition-colors hover:border-ink-muted has-[:checked]:border-primary has-[:checked]:bg-primary/5">
      <input
        type={typ}
        name="antwort"
        value={wert}
        defaultChecked={checked}
        required={typ === "radio"}
        className="mt-1.5 h-4 w-4 accent-[#006950]"
      />
      <span className="min-w-0 flex-1">
        <span className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
          <span className="text-body font-semibold text-ink">{text}</span>
          {fundstelle && (
            <span className="shrink-0 font-mono text-mono-sm text-ink-muted">
              {fundstelle}
            </span>
          )}
        </span>
        {erklaerung && (
          <span className="mt-1 block text-body-sm leading-snug text-ink-muted">
            {erklaerung}
          </span>
        )}
      </span>
    </label>
  );
}

function FrageSchritt({
  frage,
  linie,
  linienName,
  state,
  t,
  zurueckText,
  weiterText,
  erklaerungen,
}: {
  frage: WizardFrage;
  linie: number | null;
  linienName: string | null;
  state: WizardState;
  t: Uebersetzer;
  zurueckText: string;
  weiterText: string;
  erklaerungen: Record<string, string>;
}) {
  const zielVariable = frage.ziel_variable.split(";")[0].trim();
  const bisherige =
    frage.frage_id === "F04"
      ? state.produktlinien
      : frage.ebene === "unternehmen"
        ? state.unternehmen[zielVariable]
        : state.linien[String(linie ?? 0)]?.[zielVariable];

  const optionen = parseOptionen(frage);
  const keys = OPTION_KEYS[frage.frage_id] ?? optionen;

  return (
    <form action={antwortSpeichern}>
      <input type="hidden" name="frage_id" value={frage.frage_id} />
      {linie != null && <input type="hidden" name="linie" value={linie} />}

      {linienName && (
        <p className="mb-3 text-label uppercase tracking-widest text-legal">
          {t("produktlinieLabel", { name: linienName })}
        </p>
      )}
      <h1 className="text-headline text-ink">{frage.frage_text}</h1>
      {frage.antwort_typ === "multi_select" && (
        <p className="mt-2 text-body-sm text-ink-muted">
          {t("mehrfachauswahl")}
        </p>
      )}

      {frage.hinweis_ui && (
        <p className="mt-4 flex gap-2 text-body-sm text-ink-muted">
          <span aria-hidden="true" className="shrink-0 text-legal">ⓘ</span>
          <span>{frage.hinweis_ui}</span>
        </p>
      )}

      <div className="mt-8 space-y-3">
        {frage.antwort_typ === "freitext_liste" ? (
          <>
            <label
              htmlFor="produktlinien"
              className="block text-label uppercase text-ink-muted"
            >
              {t("produktlinienLabel")}
            </label>
            <textarea
              id="produktlinien"
              name="produktlinien"
              rows={5}
              required
              defaultValue={state.produktlinien.join("\n")}
              placeholder={t("produktlinienPlaceholder")}
              className="w-full rounded border border-line-strong bg-canvas px-4 py-3 text-body text-ink placeholder:text-ink-muted/60 focus:border-ink focus:outline-none"
            />
          </>
        ) : (
          optionen.map((label, i) => {
            const wert = keys[i] ?? label;
            const checked = Array.isArray(bisherige)
              ? bisherige.includes(wert)
              : bisherige === wert;
            return (
              <OptionRow
                key={wert}
                typ={frage.antwort_typ === "multi_select" ? "checkbox" : "radio"}
                wert={wert}
                label={label}
                checked={checked}
                erklaerung={erklaerungen[wert]}
              />
            );
          })
        )}
      </div>

      <div className="mt-10 flex items-center justify-between">
        <ZurueckLink label={zurueckText} />
        <button
          type="submit"
          className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
        >
          {weiterText}
        </button>
      </div>
    </form>
  );
}

function ZurueckLink({ label }: { label: string }) {
  return (
    <Link
      href="/onboarding?zurueck=1"
      className="text-body-sm font-medium text-ink-muted hover:text-ink"
    >
      {label}
    </Link>
  );
}

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

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{
    step?: string;
    fehler?: string;
    zurueck?: string;
    willkommen?: string;
  }>;
}) {
  const params = await searchParams;

  // Gate: Onboarding gehört zum Paket. Ausnahme willkommen=1 – die Rückkehr
  // aus dem Stripe-Checkout, bei der der Webhook die Freischaltung ggf.
  // noch nicht verbucht hat.
  if (params.willkommen !== "1") {
    await erforderePaket();
  }
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const t = await getTranslations("Onboarding");
  const tCommon = await getTranslations("Common");

  const { data: profil } = await supabase
    .from("profile")
    .select("*")
    .eq("user_id", user.id)
    .maybeSingle();
  const state = parseState(profil?.taetigkeiten);

  const fragen = await getWizardFragen();
  if (fragen.length === 0) {
    return (
      <p className="text-body text-ink-muted">{t("fragenNichtVerfuegbar")}</p>
    );
  }

  const steps = computeSteps(fragen, state);
  const open = firstOpenStep(steps, state);
  const openIndex = steps.findIndex((s) => stepKey(s) === stepKey(open));

  let aktiv: WizardStep = open;
  if (params.step) {
    const idx = steps.findIndex((s) => stepKey(s) === params.step);
    if (idx >= 0 && idx <= openIndex) aktiv = steps[idx];
  } else if (params.zurueck) {
    // Ein Schritt zurück: letzter beantworteter Schritt vor dem offenen
    for (let i = openIndex - 1; i >= 0; i--) {
      if (isAnswered(steps[i], state)) {
        aktiv = steps[i];
        break;
      }
    }
  }
  const aktivIndex = steps.findIndex((s) => stepKey(s) === stepKey(aktiv));

  const fehlerKey = FEHLER_KEYS.find((key) => key === params.fehler);
  const fehlerText = fehlerKey ? t(`fehler.${fehlerKey}`) : null;

  const erklaerungen =
    aktiv.art === "frage" ? await ladeErklaerungen(aktiv.frage.frage_id) : {};

  return (
    <>
      {params.willkommen === "1" && (
        <p className="mb-6 rounded border border-primary bg-primary/5 px-4 py-3 text-body-sm text-ink">
          {t("willkommen")}
        </p>
      )}

      <Fortschritt aktuell={aktivIndex + 1} gesamt={steps.length} t={t} />

      {fehlerText && (
        <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
          {fehlerText}
        </p>
      )}

      <div className="rounded border border-line bg-canvas p-6 md:p-10">
        {aktiv.art === "frage" && (
          <FrageSchritt
            frage={aktiv.frage}
            linie={aktiv.linie ?? null}
            linienName={
              aktiv.linie != null ? state.produktlinien[aktiv.linie] ?? null : null
            }
            state={state}
            t={t}
            zurueckText={tCommon("zurueck")}
            weiterText={tCommon("weiter")}
            erklaerungen={erklaerungen}
          />
        )}

        {aktiv.art === "stammdaten" && (
          <form action={stammdatenSpeichern}>
            <h1 className="text-headline text-ink">{t("stammdatenTitel")}</h1>
            <p className="mt-2 text-body text-ink-muted">
              {t("stammdatenText")}
            </p>
            <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-6">
              <Eingabe
                name="firmenname"
                label={t("felder.firmenname")}
                wert={profil?.firmenname}
                required
                breite="sm:col-span-6"
              />
              <Eingabe
                name="strasse"
                label={t("felder.strasse")}
                wert={profil?.strasse}
                breite="sm:col-span-4"
              />
              <Eingabe
                name="hausnummer"
                label={t("felder.hausnummer")}
                wert={profil?.hausnummer}
                breite="sm:col-span-2"
              />
              <Eingabe
                name="plz"
                label={t("felder.plz")}
                wert={profil?.plz}
                breite="sm:col-span-2"
              />
              <Eingabe
                name="ort"
                label={t("felder.ort")}
                wert={profil?.ort}
                breite="sm:col-span-4"
              />
              <Eingabe
                name="land"
                label={t("felder.land")}
                wert={profil?.land ?? t("landDefault")}
                breite="sm:col-span-6"
              />
              <Eingabe
                name="zeichnungsberechtigter_name"
                label={t("felder.zeichnungsberechtigterName")}
                wert={profil?.zeichnungsberechtigter_name}
                breite="sm:col-span-4"
              />
              <Eingabe
                name="zeichnungsberechtigter_funktion"
                label={t("felder.zeichnungsberechtigterFunktion")}
                wert={profil?.zeichnungsberechtigter_funktion}
                breite="sm:col-span-2"
              />
            </div>

            <fieldset className="mt-8">
              <legend className="text-label uppercase text-ink-muted">
                {t("lucidFrage")}
              </legend>
              <div className="mt-3 flex gap-3">
                <label className="flex cursor-pointer items-center gap-3 rounded border border-line-strong px-5 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="war_verpackg_registriert"
                    value="ja"
                    defaultChecked={profil?.war_verpackg_registriert === true}
                    className="h-4 w-4 accent-[#006950]"
                  />
                  <span className="text-body font-semibold">{t("ja")}</span>
                </label>
                <label className="flex cursor-pointer items-center gap-3 rounded border border-line-strong px-5 py-3 has-[:checked]:border-primary has-[:checked]:bg-primary/5">
                  <input
                    type="radio"
                    name="war_verpackg_registriert"
                    value="nein"
                    defaultChecked={profil?.war_verpackg_registriert === false}
                    className="h-4 w-4 accent-[#006950]"
                  />
                  <span className="text-body font-semibold">{t("nein")}</span>
                </label>
              </div>
            </fieldset>

            <div className="mt-6">
              <Eingabe
                name="lucid_nummer"
                label={t("felder.lucidNummer")}
                wert={profil?.lucid_nummer}
              />
            </div>

            <div className="mt-10 flex items-center justify-between">
              <ZurueckLink label={tCommon("zurueck")} />
              <button
                type="submit"
                className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
              >
                {tCommon("weiter")}
              </button>
            </div>
          </form>
        )}

        {aktiv.art === "abschluss" && (
          <form action={onboardingAbschliessen}>
            <h1 className="text-headline text-ink">{t("abschlussTitel")}</h1>
            <p className="mt-2 text-body text-ink-muted">
              {t.rich("abschlussText", {
                anzahl: state.produktlinien.length,
                linien: () => (
                  <span className="font-semibold text-ink">
                    {state.produktlinien.join(", ")}
                  </span>
                ),
              })}
            </p>
            <div className="mt-10 flex items-center justify-between">
              <ZurueckLink label={tCommon("zurueck")} />
              <button
                type="submit"
                className="rounded bg-primary px-6 py-3 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
              >
                {t("abschlussCta")}
              </button>
            </div>
          </form>
        )}
      </div>
    </>
  );
}
