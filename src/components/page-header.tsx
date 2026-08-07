export function PageHeader({
  title,
  description,
  titelVersteckt = false,
}: {
  title: string;
  description?: string;
  /**
   * Blendet die H1 visuell aus (bleibt für Screenreader), wenn der
   * Bereichsname bereits in der Topbar steht und die große Überschrift
   * ihn nur wiederholen würde.
   */
  titelVersteckt?: boolean;
}) {
  return (
    <header className={titelVersteckt ? "mb-8" : "mb-12"}>
      <h1
        className={
          titelVersteckt
            ? "sr-only"
            : "text-display-sm text-ink lg:text-display"
        }
      >
        {title}
      </h1>
      {description && (
        <p
          className={`max-w-2xl text-body-lg text-ink-muted ${
            titelVersteckt ? "" : "mt-4"
          }`}
        >
          {description}
        </p>
      )}
    </header>
  );
}
