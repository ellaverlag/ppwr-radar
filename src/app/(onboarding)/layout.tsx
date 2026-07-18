import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { isPreviewMode } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";

export default async function OnboardingLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex min-h-screen flex-col">
      {isPreviewMode() && (
        <div className="bg-gold px-4 py-2 text-center text-label uppercase text-ink">
          Vorschau-Modus – ungeprüfte Inhalte
        </div>
      )}

      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 md:px-16">
          <Link href="/dashboard" className="inline-flex items-center">
            <Image
              src="/ppwr-radar-logo.svg"
              alt="PPWR Radar"
              width={161}
              height={25}
              priority
            />
          </Link>
          <Link
            href="/dashboard"
            className="text-body-sm font-medium text-ink-muted hover:text-ink"
          >
            Zum Dashboard
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 md:px-16">
        <div className="mx-auto w-full max-w-[680px]">{children}</div>
      </main>

      <footer className="border-t border-line bg-footer px-6 py-4">
        <p className="text-center text-label uppercase text-ink-muted">
          Einordnung auf Basis Ihrer Angaben · keine Rechtsberatung
        </p>
      </footer>
    </div>
  );
}
