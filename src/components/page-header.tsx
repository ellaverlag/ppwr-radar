export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-12">
      <h1 className="text-display-sm text-ink lg:text-display">{title}</h1>
      {description && (
        <p className="mt-4 max-w-2xl text-body-lg text-ink-muted">
          {description}
        </p>
      )}
    </header>
  );
}
