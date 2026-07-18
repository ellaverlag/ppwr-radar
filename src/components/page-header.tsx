export function PageHeader({
  title,
  description,
}: {
  title: string;
  description?: string;
}) {
  return (
    <header className="mb-10">
      <h1 className="text-2xl font-semibold tracking-tight text-neutral-900">
        {title}
      </h1>
      {description && (
        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-neutral-500">
          {description}
        </p>
      )}
    </header>
  );
}

export function Placeholder({ text }: { text: string }) {
  return (
    <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-neutral-200 bg-neutral-50">
      <p className="text-sm text-neutral-400">{text}</p>
    </div>
  );
}
