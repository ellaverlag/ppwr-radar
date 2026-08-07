"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { initialen } from "@/lib/initialen";

/**
 * Topbar-Identität: Initialen-Avatar + Anzeigename, öffnet ein kleines
 * Menü (Konto | Zahlung verwalten | Abmelden). „Konto“ steht bewusst nur
 * hier, nicht in der Haupt-Sidebar.
 */
export function KontoMenue({
  anzeigename,
  zahlungAction,
  labels,
  kompakt = false,
  herausgeber,
}: {
  anzeigename: string;
  /** Server-Action für die Billing-Portal-Session; nur mit Stripe-Kunde gesetzt */
  zahlungAction?: () => Promise<void>;
  labels: { konto: string; zahlung: string; abmelden: string };
  kompakt?: boolean;
  /** Optionaler Block am Menü-Ende (Herausgeber im Mobile-Menü). */
  herausgeber?: React.ReactNode;
}) {
  const [offen, setOffen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!offen) return;
    const schliessen = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOffen(false);
      }
    };
    const escape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOffen(false);
    };
    document.addEventListener("mousedown", schliessen);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("mousedown", schliessen);
      document.removeEventListener("keydown", escape);
    };
  }, [offen]);

  const eintragKlasse =
    "block w-full rounded px-3 py-2 text-left text-body-sm font-medium text-ink hover:bg-hover";

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOffen((o) => !o)}
        aria-expanded={offen}
        aria-haspopup="menu"
        className="flex items-center gap-2.5 rounded px-1.5 py-1 transition-colors hover:bg-hover"
      >
        <span
          aria-hidden="true"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary-tint font-mono text-body-sm font-semibold text-primary"
        >
          {initialen(anzeigename)}
        </span>
        {!kompakt && (
          <span className="hidden max-w-48 truncate text-body-sm font-semibold text-ink lg:block">
            {anzeigename}
          </span>
        )}
        <span
          aria-hidden="true"
          className={`text-ink-muted transition-transform ${offen ? "rotate-180" : ""}`}
        >
          ▾
        </span>
      </button>

      {offen && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-2 w-56 rounded border border-line bg-canvas p-1.5"
        >
          <p
            className="truncate border-b border-line px-3 pb-2 pt-1 text-body-sm text-ink-muted"
            title={anzeigename}
          >
            {anzeigename}
          </p>
          <div className="pt-1.5">
            <Link
              href="/konto"
              role="menuitem"
              className={eintragKlasse}
              onClick={() => setOffen(false)}
            >
              {labels.konto}
            </Link>
            {zahlungAction && (
              <form action={zahlungAction} role="none">
                <button type="submit" role="menuitem" className={eintragKlasse}>
                  {labels.zahlung}
                </button>
              </form>
            )}
            <form action="/auth/signout" method="post" role="none">
              <button type="submit" role="menuitem" className={eintragKlasse}>
                {labels.abmelden}
              </button>
            </form>
          </div>
          {herausgeber}
        </div>
      )}
    </div>
  );
}
