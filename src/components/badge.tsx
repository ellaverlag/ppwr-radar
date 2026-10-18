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
  // Gefüllte Varianten für Zustände, die auf einen Blick erkennbar sein müssen (Pflichten-Matrix)
  blueFilled: "border-legal bg-legal text-white font-semibold",
  goldFilled: "border-gold bg-gold text-ink font-semibold",
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
