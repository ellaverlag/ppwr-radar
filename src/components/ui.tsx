import Link from "next/link";

/** Karte im Dashboard-Stil: weiß, 1px-Rahmen, Radius 4, keine Schatten. */
export function LegalCard({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`flex flex-col rounded border border-line bg-canvas ${className}`}>
      {children}
    </div>
  );
}

/** Rechtsquellen-Fußzeile einer Karte („ART. 15 PPWR · STAND …“). */
export function LegalCardFooter({ children }: { children: React.ReactNode }) {
  return (
    <div className="border-t border-line p-4 font-mono text-mono-sm uppercase text-legal">
      {children}
    </div>
  );
}

const BUTTON_BASE =
  "inline-flex items-center justify-center gap-2 rounded px-6 py-4 text-label uppercase tracking-widest transition-colors";

export function PrimaryButtonLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${BUTTON_BASE} bg-primary text-white hover:opacity-90`}
    >
      {children}
    </Link>
  );
}

export function SecondaryButtonLink({
  href,
  children,
}: {
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className={`${BUTTON_BASE} border border-ink bg-canvas text-ink hover:bg-surface`}
    >
      {children}
    </Link>
  );
}

/** 12-px-Status-Punkt (Ampel) aus dem Dashboard-Entwurf. */
export function TrafficDot({
  color,
}: {
  color: "green" | "gold" | "red" | "dim";
}) {
  const colors = {
    green: "bg-primary",
    gold: "bg-gold",
    red: "bg-danger",
    dim: "bg-dim",
  } as const;
  return (
    <span
      aria-hidden="true"
      className={`inline-block h-3 w-3 rounded-full ${colors[color]}`}
    />
  );
}
