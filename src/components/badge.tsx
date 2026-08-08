/**
 * Outlined Chips gemäß Dashboard-Entwurf (keine gefüllten Badges,
 * label-Typografie, Radius 4).
 */
const VARIANTS = {
  neutral: "border-line-strong text-ink-muted",
  green: "border-primary text-primary bg-primary/5",
  blue: "border-legal text-legal",
  gold: "border-gold text-gold-ink bg-gold/10",
  red: "border-danger text-danger",
} as const;

export function Badge({
  children,
  variant = "neutral",
  title,
}: {
  children: React.ReactNode;
  variant?: keyof typeof VARIANTS;
  title?: string;
}) {
  return (
    <span
      title={title}
      className={`inline-flex items-center gap-1 rounded border px-2 py-1 text-label ${VARIANTS[variant]}`}
    >
      {children}
    </span>
  );
}
