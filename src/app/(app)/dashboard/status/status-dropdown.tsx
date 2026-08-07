"use client";

import { useState, useTransition } from "react";

/**
 * Status-Dropdown mit Sofort-Speichern: Auswahl ruft die Server Action auf,
 * die Ampel auf dem Dashboard aktualisiert sich über revalidatePath.
 */
export function StatusDropdown({
  anforderungNr,
  status,
  action,
  labels,
  ariaLabel,
}: {
  anforderungNr: number;
  status: string;
  action: (formData: FormData) => Promise<void>;
  labels: Record<string, string>;
  ariaLabel: string;
}) {
  const [wert, setWert] = useState(status);
  const [pending, startTransition] = useTransition();

  return (
    <select
      value={wert}
      disabled={pending}
      aria-label={ariaLabel}
      onChange={(e) => {
        const neu = e.target.value;
        setWert(neu);
        const formData = new FormData();
        formData.set("anforderung_nr", String(anforderungNr));
        formData.set("status", neu);
        startTransition(() => action(formData));
      }}
      className="rounded border border-line-strong bg-canvas px-3 py-2 text-body-sm font-semibold text-ink focus:border-ink focus:outline-none disabled:opacity-60"
    >
      {Object.entries(labels).map(([key, label]) => (
        <option key={key} value={key}>
          {label}
        </option>
      ))}
    </select>
  );
}
