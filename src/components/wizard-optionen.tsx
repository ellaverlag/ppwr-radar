import { OPTION_KEYS, parseOptionen, type Antwort } from "@/lib/onboarding";
import type { WizardFrage } from "@/lib/wissensbasis";

/**
 * Options-Zeilen eines Wizard-Frage-Schritts – gemeinsame Darstellung für
 * das Onboarding und den Mini-Wizard der Produktlinien-Verwaltung.
 */

export function OptionRow({
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

/** Alle Options-Zeilen einer Frage, vorbelegt aus der bisherigen Antwort. */
export function WizardOptionsListe({
  frage,
  bisherige,
  erklaerungen,
}: {
  frage: WizardFrage;
  bisherige: Antwort | undefined;
  erklaerungen: Record<string, string>;
}) {
  const optionen = parseOptionen(frage);
  const keys = OPTION_KEYS[frage.frage_id] ?? optionen;

  return (
    <>
      {optionen.map((label, i) => {
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
      })}
    </>
  );
}
