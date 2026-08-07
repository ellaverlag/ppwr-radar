"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { LockIcon } from "@/components/icons";

/**
 * Mediathek-Karte mit Modal-Player.
 *
 * Datenschutz: Der StreamYard-Iframe existiert nur, solange das Modal offen
 * ist – kein Drittanbieter-Request beim Seitenaufruf, und das Schließen
 * entfernt den Iframe (stoppt die Wiedergabe). Fokus wandert ins Modal und
 * beim Schließen zurück auf die Karte.
 */
export function WebinarKarte({
  titel,
  badge,
  beschreibung,
  hinweis,
  embedUrl,
  thumbnail,
  gesperrt,
  labels,
}: {
  titel: string;
  badge: string;
  beschreibung?: string;
  hinweis?: string;
  embedUrl: string;
  thumbnail?: string;
  gesperrt: boolean;
  labels: {
    abspielen: string;
    schliessen: string;
    gesperrt: string;
    gesperrtCta: string;
  };
}) {
  const [offen, setOffen] = useState(false);
  const karteRef = useRef<HTMLButtonElement>(null);
  const schliessenRef = useRef<HTMLButtonElement>(null);

  const schliessen = useCallback(() => {
    setOffen(false);
    karteRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!offen) return;
    schliessenRef.current?.focus();
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") schliessen();
    };
    document.addEventListener("keydown", escape);
    return () => document.removeEventListener("keydown", escape);
  }, [offen, schliessen]);

  const vorschau = (
    <span className="relative block w-full overflow-hidden bg-primary-tint pt-[56.25%]">
      {thumbnail ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={thumbnail}
          alt=""
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <span
          aria-hidden="true"
          className="absolute left-4 top-2 select-none font-mono text-[5rem] font-bold leading-none text-primary/15"
        >
          {titel.charAt(0)}
        </span>
      )}
      <span className="absolute inset-0 flex items-center justify-center">
        {gesperrt ? (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas/90">
            <LockIcon className="h-6 w-6 text-ink-muted" />
          </span>
        ) : (
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-primary shadow-[0_0_0_6px_rgba(0,105,80,0.15)] transition-transform group-hover:scale-105">
            <svg
              viewBox="0 0 24 24"
              fill="#ffffff"
              className="ml-1 h-6 w-6"
              aria-hidden="true"
            >
              <path d="M8 5v14l11-7z" />
            </svg>
          </span>
        )}
      </span>
    </span>
  );

  return (
    <>
      <div className="flex flex-col overflow-hidden rounded border border-line bg-canvas">
        {gesperrt ? (
          <div>
            {vorschau}
            <div className="p-5">
              <h3 className="text-body-lg font-bold text-ink">{titel}</h3>
              <p className="mt-2 text-body-sm text-ink-muted">
                {labels.gesperrt}{" "}
                <Link
                  href="/dashboard#freischalten"
                  className="font-medium text-legal hover:underline"
                >
                  {labels.gesperrtCta}
                </Link>
              </p>
            </div>
          </div>
        ) : (
          <button
            ref={karteRef}
            type="button"
            onClick={() => setOffen(true)}
            aria-haspopup="dialog"
            aria-label={`${titel} – ${labels.abspielen}`}
            className="group text-left"
          >
            {vorschau}
            <span className="block p-5">
              <span className="block text-body-lg font-bold text-ink group-hover:text-primary">
                {titel}
              </span>
              <span className="mt-2 inline-block rounded border border-primary bg-primary/5 px-2 py-1 text-label text-primary">
                {badge}
              </span>
              {beschreibung && (
                <span className="mt-2 line-clamp-2 block text-body-sm text-ink-muted">
                  {beschreibung}
                </span>
              )}
            </span>
          </button>
        )}
      </div>

      {/* Modal – Iframe lebt nur hier */}
      {offen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4"
          onClick={schliessen}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label={titel}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[960px] rounded border border-line bg-canvas"
          >
            <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-3">
              <p className="text-body font-bold text-ink">{titel}</p>
              <button
                ref={schliessenRef}
                type="button"
                onClick={schliessen}
                aria-label={labels.schliessen}
                className="shrink-0 rounded px-2 py-0.5 text-body-lg text-ink-muted hover:bg-hover hover:text-ink"
              >
                ✕
              </button>
            </div>
            <div className="relative w-full bg-ink pt-[56.25%]">
              <iframe
                src={embedUrl}
                title={`${titel} (Aufzeichnung)`}
                allow="autoplay; fullscreen"
                allowFullScreen
                className="absolute inset-0 h-full w-full border-0"
              />
            </div>
            {hinweis && (
              <p className="border-t border-line px-5 py-3 text-body-sm text-ink-muted">
                {hinweis}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}
