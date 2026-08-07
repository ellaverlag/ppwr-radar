"use client";

/**
 * Löschen mit Bestätigungs-Dialog – erst nach Bestätigung feuert die
 * Server Action (entfernt Storage-Dateien und die Dokument-Zeile).
 */
export function LoeschenButton({
  dokumentId,
  bestaetigung,
  label,
  action,
}: {
  dokumentId: string;
  bestaetigung: string;
  label: string;
  action: (formData: FormData) => Promise<void>;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(bestaetigung)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={dokumentId} />
      <button
        type="submit"
        className="rounded border border-danger px-3 py-1.5 text-label uppercase tracking-widest text-danger transition-colors hover:bg-danger/5"
      >
        {label}
      </button>
    </form>
  );
}
