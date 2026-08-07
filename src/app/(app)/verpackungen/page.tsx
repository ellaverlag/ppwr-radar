import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { BestaetigenButton } from "@/components/bestaetigen-button";
import { PlusIcon } from "@/components/icons";
import { PageHeader } from "@/components/page-header";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { OPTION_KEYS, parseOptionen, parseState } from "@/lib/onboarding";
import type { RollenSet } from "@/lib/rollen-engine";
import { createClient } from "@/lib/supabase/server";
import { getWizardFragen } from "@/lib/wissensbasis";
import { erforderePaket } from "@/lib/zugang";
import {
  linieLoeschen,
  linieReaktivieren,
  linieStilllegen,
  linieVerwerfen,
} from "./actions";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta");
  return { title: t("verpackungen") };
}

export const dynamic = "force-dynamic";

const FEHLER_KEYS = ["dokumente", "loeschen", "status", "limit"] as const;

interface VerpackungZeile {
  id: string;
  bezeichnung: string;
  produktlinie: string | null;
  verpackungstyp: string;
  materialien: string[];
  lebensmittelkontakt: boolean;
  zusatzangaben: string | null;
  status: "aktiv" | "stillgelegt";
}

export default async function VerpackungenPage({
  searchParams,
}: {
  searchParams: Promise<{ geloescht?: string; fehler?: string }>;
}) {
  const zugang = await erforderePaket();
  const params = await searchParams;
  const t = await getTranslations("Verpackungen");
  const tLabels = await getTranslations("Labels");

  const supabase = await createClient();
  const { data: profil } = await supabase
    .from("profile")
    .select("id, onboarding_abgeschlossen, taetigkeiten")
    .eq("user_id", zugang.user.id)
    .maybeSingle();

  if (!profil?.onboarding_abgeschlossen) {
    return (
      <>
        <PageHeader title={t("titel")} description={t("beschreibung")} />
        <LegalCard>
          <div className="p-6">
            <p className="text-body text-ink-muted">{t("keinOnboarding")}</p>
            <Link
              href="/onboarding"
              className="mt-3 inline-block text-body-sm font-medium text-legal hover:underline"
            >
              {t("zumOnboarding")}
            </Link>
          </div>
        </LegalCard>
      </>
    );
  }

  const state = parseState(profil.taetigkeiten);
  const [{ data: zeilen }, { data: ergebnisse }, { data: dokumente }, fragen] =
    await Promise.all([
      supabase
        .from("profil_verpackungen")
        .select(
          "id, bezeichnung, produktlinie, verpackungstyp, materialien, lebensmittelkontakt, zusatzangaben, status"
        )
        .eq("profil_id", profil.id)
        .order("created_at", { ascending: true }),
      supabase
        .from("rollen_ergebnisse")
        .select("produktlinie, rollen_set")
        .eq("profil_id", profil.id)
        .eq("aktuell", true),
      supabase
        .from("dokumente")
        .select("verpackung_id")
        .eq("user_id", zugang.user.id),
      getWizardFragen(),
    ]);

  const verpackungen = (zeilen ?? []) as VerpackungZeile[];

  // Anzeige-Labels der Verpackungsarten aus der F05-Frage (kein zweites Vokabular)
  const f05 = fragen.find((f) => f.frage_id === "F05");
  const artLabels = new Map<string, string>();
  if (f05) {
    const optionen = parseOptionen(f05);
    (OPTION_KEYS.F05 ?? []).forEach((key, i) => {
      const label = optionen[i];
      if (label) artLabels.set(key, label.replace(/\s*\([^)]*\)\s*$/, ""));
    });
  }

  const rollenNachLinie = new Map<string, RollenSet>(
    (ergebnisse ?? []).map((zeile) => [
      zeile.produktlinie as string,
      zeile.rollen_set as RollenSet,
    ])
  );
  const dokumenteJeVerpackung = new Map<string, number>();
  for (const dok of dokumente ?? []) {
    const id = dok.verpackung_id as string | null;
    if (id) {
      dokumenteJeVerpackung.set(id, (dokumenteJeVerpackung.get(id) ?? 0) + 1);
    }
  }

  const rollenLabel = (rolle: string) =>
    tLabels.has(`rollen.${rolle}`) ? tLabels(`rollen.${rolle}`) : rolle;

  const merkmale = (zeile: VerpackungZeile): string[] => {
    const index = state.produktlinien.indexOf(zeile.bezeichnung);
    const antworten = index >= 0 ? state.linien[String(index)] ?? {} : {};
    const arten = Array.isArray(antworten.verpackungsart)
      ? antworten.verpackungsart
      : [];
    return arten.length > 0
      ? arten.map((art) => artLabels.get(art) ?? art)
      : zeile.verpackungstyp === "unbestimmt"
        ? []
        : zeile.verpackungstyp.split(", ");
  };

  // Angefangene Linien: im Wizard-Zustand, aber ohne Verpackungsprofil
  const vorhandeneNamen = new Set(verpackungen.map((zeile) => zeile.bezeichnung));
  const angefangene = state.produktlinien
    .map((name, index) => ({ name, index }))
    .filter(({ name }) => !vorhandeneNamen.has(name));

  const fehlerKey = FEHLER_KEYS.find((key) => key === params.fehler);

  return (
    <>
      <PageHeader title={t("titel")} description={t("beschreibung")} />

      {params.geloescht && (
        <p className="mb-6 rounded border border-line-strong bg-surface px-4 py-3 text-body-sm text-ink">
          {t("geloeschtErfolg", { name: params.geloescht })}
        </p>
      )}
      {fehlerKey && (
        <p className="mb-6 rounded border border-danger bg-danger/5 px-4 py-3 text-body-sm text-danger">
          {t(`fehler.${fehlerKey}`)}
        </p>
      )}

      <div className="mb-8 flex justify-end">
        <Link
          href="/verpackungen/wizard"
          className="inline-flex items-center gap-2 rounded bg-primary px-5 py-2.5 text-label uppercase tracking-widest text-white transition-opacity hover:opacity-90"
        >
          <PlusIcon className="h-4 w-4" />
          <span>{t("neueLinie")}</span>
        </Link>
      </div>

      {angefangene.length > 0 && (
        <div className="mb-6 space-y-3">
          {angefangene.map(({ name, index }) => (
            <div
              key={name}
              className="flex flex-wrap items-center justify-between gap-3 rounded border border-gold bg-gold-tint px-4 py-3"
            >
              <p className="text-body-sm text-gold-ink">
                {t("angefangenText", { name })}
              </p>
              <span className="flex items-center gap-3">
                <Link
                  href={`/verpackungen/wizard?linie=${index}`}
                  className="text-body-sm font-semibold text-ink hover:underline"
                >
                  {t("fortsetzen")}
                </Link>
                <BestaetigenButton
                  action={linieVerwerfen}
                  hiddenName="linie"
                  hiddenValue={String(index)}
                  bestaetigung={t("verwerfenBestaetigung", { name })}
                  label={t("verwerfen")}
                />
              </span>
            </div>
          ))}
        </div>
      )}

      {verpackungen.length === 0 && angefangene.length === 0 ? (
        <LegalCard>
          <p className="p-6 text-body text-ink-muted">{t("leer")}</p>
        </LegalCard>
      ) : verpackungen.length > 0 ? (
        <LegalCard>
          <div className="hidden grid-cols-12 gap-4 rounded-t bg-surface px-6 py-3 text-label uppercase text-ink-muted md:grid">
            <span className="col-span-3">{t("spalteLinie")}</span>
            <span className="col-span-3">{t("spalteMerkmale")}</span>
            <span className="col-span-3">{t("spalteRollen")}</span>
            <span className="col-span-3">{t("spalteStatus")}</span>
          </div>
          <ul className="divide-y divide-line">
            {verpackungen.map((zeile) => {
              const rollenSet = rollenNachLinie.get(zeile.bezeichnung);
              const anzahlDokumente = dokumenteJeVerpackung.get(zeile.id) ?? 0;
              const index = state.produktlinien.indexOf(zeile.bezeichnung);
              const stillgelegt = zeile.status === "stillgelegt";
              return (
                <li
                  key={zeile.id}
                  className={`grid grid-cols-1 gap-3 px-6 py-5 md:grid-cols-12 md:items-center md:gap-4 ${
                    stillgelegt ? "bg-surface/60" : ""
                  }`}
                >
                  <div className="md:col-span-3">
                    <p
                      className={`text-body-lg font-bold ${
                        stillgelegt ? "text-ink-muted" : "text-ink"
                      }`}
                    >
                      {zeile.bezeichnung}
                    </p>
                    {zeile.zusatzangaben && (
                      <details className="group mt-1">
                        <summary className="cursor-pointer list-none text-body-sm font-medium text-legal hover:underline [&::-webkit-details-marker]:hidden">
                          {t("beschreibungAnzeigen")}{" "}
                          <span
                            aria-hidden="true"
                            className="inline-block transition-transform group-open:rotate-180"
                          >
                            ▾
                          </span>
                        </summary>
                        <p className="mt-2 whitespace-pre-line border-l-2 border-line-strong pl-3 text-body-sm text-ink-muted">
                          {zeile.zusatzangaben}
                        </p>
                      </details>
                    )}
                  </div>
                  <div className="md:col-span-3">
                    <p className="text-body-sm text-ink-muted">
                      {merkmale(zeile).join(" · ") || "—"}
                    </p>
                    <p className="mt-1 flex flex-wrap gap-1.5">
                      {zeile.lebensmittelkontakt && (
                        <Badge variant="neutral">{t("lmk")}</Badge>
                      )}
                    </p>
                    {zeile.materialien.length > 0 && (
                      <p className="mt-1 text-body-sm text-ink-muted">
                        {t("materialien", {
                          liste: zeile.materialien.join(", "),
                        })}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-1.5 md:col-span-3">
                    {rollenSet ? (
                      rollenSet.unklar ? (
                        <Badge variant="gold">{t("einordnungOffen")}</Badge>
                      ) : (
                        rollenSet.rollen.map((rolle) => (
                          <Badge key={rolle} variant="blue">
                            {rollenLabel(rolle)}
                          </Badge>
                        ))
                      )
                    ) : (
                      <Badge variant="neutral">{t("keineHerleitung")}</Badge>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2 md:col-span-3">
                    <Badge variant={stillgelegt ? "neutral" : "green"}>
                      {stillgelegt ? t("statusStillgelegt") : t("statusAktiv")}
                    </Badge>
                    {index >= 0 && (
                      <Link
                        href={`/verpackungen/wizard?linie=${index}`}
                        className="rounded border border-line-strong px-3 py-1.5 text-label uppercase tracking-widest text-ink-muted transition-colors hover:border-ink hover:text-ink"
                      >
                        {t("bearbeiten")}
                      </Link>
                    )}
                    {stillgelegt ? (
                      <form action={linieReaktivieren}>
                        <input type="hidden" name="id" value={zeile.id} />
                        <button
                          type="submit"
                          className="rounded border border-line-strong px-3 py-1.5 text-label uppercase tracking-widest text-ink-muted transition-colors hover:border-ink hover:text-ink"
                        >
                          {t("reaktivieren")}
                        </button>
                      </form>
                    ) : (
                      <BestaetigenButton
                        action={linieStilllegen}
                        hiddenName="id"
                        hiddenValue={zeile.id}
                        bestaetigung={t("stilllegenBestaetigung", {
                          name: zeile.bezeichnung,
                        })}
                        label={t("stilllegen")}
                      />
                    )}
                    {anzahlDokumente === 0 && (
                      <BestaetigenButton
                        action={linieLoeschen}
                        hiddenName="id"
                        hiddenValue={zeile.id}
                        bestaetigung={t("loeschenBestaetigung", {
                          name: zeile.bezeichnung,
                        })}
                        label={t("loeschen")}
                        variant="danger"
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
          <LegalCardFooter>{t("hinweisStillgelegt")}</LegalCardFooter>
        </LegalCard>
      ) : null}

      {verpackungen.some(
        (zeile) => (dokumenteJeVerpackung.get(zeile.id) ?? 0) > 0
      ) && (
        <p className="mt-4 text-body-sm text-ink-muted">
          {t("nichtLoeschbarHinweis")}
        </p>
      )}
    </>
  );
}
