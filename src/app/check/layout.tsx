import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Betroffenheits-Check – PPWR Radar",
  description:
    "Fünf kurze Fragen, eine erste Einschätzung: Betrifft die EU-Verpackungsverordnung (PPWR) Ihr Unternehmen? Kostenlos und ohne Anmeldung.",
};

export default function CheckLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="flex min-h-screen flex-col bg-canvas">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 md:px-16">
          <Link href="/" className="flex items-center gap-2.5">
            <Image src="/ppwr-radar-icon.svg" alt="" width={30} height={30} aria-hidden="true" />
            <span className="leading-tight">
              <span className="block text-body-lg font-extrabold tracking-tight text-ink">
                PPWR Radar
              </span>
              <span className="-mt-0.5 block text-label font-medium text-ink-muted">
                by packaging journal
              </span>
            </span>
          </Link>
          <Link
            href="/login"
            className="text-body-sm font-medium text-ink-muted hover:text-ink"
          >
            Anmelden
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 md:px-16">
        <div className="mx-auto w-full max-w-[680px]">{children}</div>
      </main>

      <footer className="border-t border-line bg-footer px-6 py-4">
        <p className="text-center text-label uppercase text-ink-muted">
          Kostenlos · Keine Registrierung · Ersteinschätzung, keine Rechtsberatung
        </p>
      </footer>
    </div>
  );
}
