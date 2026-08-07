"use client";

import { useState } from "react";

/**
 * Erklärtiefen-Umschalter (Einfach | Fachlich | Rechtstext) – zeigt nur
 * Tiefen mit Inhalt, Standard „Fachlich“ (Fallback: erste befüllte Tiefe).
 */
export interface Tiefe {
  key: string;
  label: string;
  text: string;
}

export function Erklaertiefen({ tiefen }: { tiefen: Tiefe[] }) {
  const standard =
    tiefen.find((t) => t.key === "fachlich")?.key ?? tiefen[0]?.key;
  const [aktiv, setAktiv] = useState(standard);
  const aktuelle = tiefen.find((t) => t.key === aktiv) ?? tiefen[0];
  if (!aktuelle) return null;

  return (
    <div>
      <div className="inline-flex rounded border border-line-strong">
        {tiefen.map((tiefe, i) => (
          <button
            key={tiefe.key}
            type="button"
            onClick={() => setAktiv(tiefe.key)}
            aria-pressed={aktiv === tiefe.key}
            className={`px-4 py-2 text-body-sm font-semibold transition-colors ${
              i > 0 ? "border-l border-line-strong" : ""
            } ${
              aktiv === tiefe.key
                ? "bg-primary text-white"
                : "bg-surface text-ink-muted hover:text-ink"
            }`}
          >
            {tiefe.label}
          </button>
        ))}
      </div>
      <p className="mt-4 max-w-[80ch] whitespace-pre-line text-body text-ink">
        {aktuelle.text}
      </p>
    </div>
  );
}
