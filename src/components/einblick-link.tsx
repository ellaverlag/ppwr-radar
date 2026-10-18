"use client";

import { useCallback, useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { OpenInNewIcon } from "@/components/icons";

/**
 * Link, der sein Ziel in einem Schiebefenster von rechts öffnet statt die
 * Seite zu verlassen – die Übersicht bleibt stehen. Das Fenster lädt die
 * App-rahmenlose Einblick-Variante (einblickHref) in einem iframe.
 * Cmd/Ctrl-Klick, mittlere Maustaste und Nutzer ohne JS bekommen den
 * normalen Link (href).
 */
export function EinblickLink({
  href,
  einblickHref,
  titel,
  labels,
  className,
  children,
}: {
  href: string;
  einblickHref: string;
  titel: string;
  labels: { schliessen: string; imWissenOeffnen: string };
  className?: string;
  children: React.ReactNode;
}) {
  const [offen, setOffen] = useState(false);
  const schliessen = useCallback(() => setOffen(false), []);

  useEffect(() => {
    if (!offen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") schliessen();
    };
    document.addEventListener("keydown", onKey);
    const vorher = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = vorher;
    };
  }, [offen, schliessen]);

  return (
    <>
      <a
        href={href}
        className={className}
        onClick={(e) => {
          if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0) return;
          e.preventDefault();
          setOffen(true);
        }}
      >
        {children}
      </a>
      {offen &&
        typeof document !== "undefined" &&
        createPortal(
          <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={titel}>
            <button
              type="button"
              aria-label={labels.schliessen}
              onClick={schliessen}
              className="absolute inset-0 bg-ink/40 backdrop-blur-[1px] transition-opacity"
            />
            <aside className="einblick-panel absolute inset-y-0 right-0 flex w-full max-w-[720px] flex-col border-l border-line bg-canvas shadow-2xl">
              <header className="flex items-center justify-between gap-4 border-b border-line-strong px-5 py-3">
                <p className="truncate text-label uppercase tracking-widest text-ink-muted">{titel}</p>
                <div className="flex shrink-0 items-center gap-2">
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded px-2 py-1 text-body-sm font-medium text-legal hover:bg-hover"
                  >
                    <OpenInNewIcon className="h-4 w-4" />
                    <span className="hidden sm:inline">{labels.imWissenOeffnen}</span>
                  </a>
                  <button
                    type="button"
                    onClick={schliessen}
                    aria-label={labels.schliessen}
                    className="rounded px-2 py-1 text-headline leading-none text-ink-muted hover:bg-hover hover:text-ink"
                  >
                    ×
                  </button>
                </div>
              </header>
              <iframe
                src={einblickHref}
                title={titel}
                className="h-full w-full flex-1 bg-canvas"
              />
            </aside>
          </div>,
          document.body
        )}
    </>
  );
}
