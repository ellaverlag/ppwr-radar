import Image from "next/image";
import Link from "next/link";

/**
 * Einzige Quelle für die Wortmarke: das offizielle Logo-Asset
 * /public/ppwr-radar-logo.svg (Seitenverhältnis 645:100). Öffentliche
 * Seiten verlinken auf die Landingpage, das App-Innere auf das Dashboard.
 * Klickfläche mindestens 44 px hoch; der Fokus-Ring kommt aus dem globalen
 * :focus-visible-Stil.
 */
export function BrandLink({
  href,
  width = 161,
  byline = true,
  priority = false,
  center = false,
}: {
  /** "/" auf öffentlichen Seiten, "/dashboard" im eingeloggten Bereich. */
  href: "/" | "/dashboard";
  width?: number;
  byline?: boolean;
  priority?: boolean;
  center?: boolean;
}) {
  const height = Math.round((width * 100) / 645);
  return (
    <Link
      href={href}
      className={`inline-flex min-h-11 flex-col justify-center gap-1 rounded ${
        center ? "items-center" : "items-start"
      }`}
    >
      <Image
        src="/ppwr-radar-logo.svg"
        alt="PPWR Radar"
        width={width}
        height={height}
        priority={priority}
      />
      {byline && (
        <span className="block text-label uppercase text-ink-muted">
          by packaging journal
        </span>
      )}
    </Link>
  );
}
