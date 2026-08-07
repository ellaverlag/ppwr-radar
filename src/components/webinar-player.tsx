"use client";

import { useState } from "react";

/**
 * Datenschutz-Detail: Der Drittanbieter-Iframe (StreamYard) wird erst nach
 * Klick gerendert – beim bloßen Seitenaufruf geht kein Request an den
 * Anbieter. Vorher steht eine neutrale Vorschaukarte mit Play-Button im
 * Token-Design (16:9 bleibt in beiden Zuständen stabil).
 */
export function WebinarPlayer({
  embedUrl,
  titel,
  playHinweis,
}: {
  embedUrl: string;
  titel: string;
  playHinweis: string;
}) {
  const [geladen, setGeladen] = useState(false);

  return (
    <div className="relative w-full overflow-hidden rounded border border-line bg-ink pt-[56.25%]">
      {geladen ? (
        <iframe
          src={embedUrl}
          title={`${titel} (Aufzeichnung)`}
          allowFullScreen
          className="absolute inset-0 h-full w-full border-0"
        />
      ) : (
        <button
          type="button"
          onClick={() => setGeladen(true)}
          className="group absolute inset-0 flex h-full w-full flex-col items-center justify-center gap-4 bg-surface px-6 text-center"
        >
          <span
            aria-hidden="true"
            className="flex h-16 w-16 items-center justify-center rounded-full bg-primary transition-transform group-hover:scale-105"
          >
            <svg
              viewBox="0 0 24 24"
              fill="#ffffff"
              className="ml-1 h-7 w-7"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
          <span className="max-w-md text-body font-semibold text-ink">
            {titel}
          </span>
          <span className="text-body-sm text-ink-muted">{playHinweis}</span>
        </button>
      )}
    </div>
  );
}
