"use client";

/**
 * Server-Action-Button mit Bestätigungs-Dialog (z. B. Stilllegen, Löschen,
 * Verwerfen). Erst nach Bestätigung feuert die Action.
 */
export function BestaetigenButton({
  action,
  hiddenName,
  hiddenValue,
  bestaetigung,
  label,
  variant = "neutral",
}: {
  action: (formData: FormData) => Promise<void>;
  hiddenName: string;
  hiddenValue: string;
  bestaetigung: string;
  label: string;
  variant?: "neutral" | "danger";
}) {
  const klasse =
    variant === "danger"
      ? "rounded border border-danger px-3 py-1.5 text-label uppercase tracking-widest text-danger transition-colors hover:bg-danger/5"
      : "rounded border border-line-strong px-3 py-1.5 text-label uppercase tracking-widest text-ink-muted transition-colors hover:border-ink hover:text-ink";

  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(bestaetigung)) e.preventDefault();
      }}
    >
      <input type="hidden" name={hiddenName} value={hiddenValue} />
      <button type="submit" className={klasse}>
        {label}
      </button>
    </form>
  );
}
