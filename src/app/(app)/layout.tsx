import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutIcon, PersonIcon } from "@/components/icons";
import { NavLinks } from "@/components/nav-links";
import { isPreviewMode } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";

function SignoutButton() {
  return (
    <form action="/auth/signout" method="post">
      <button
        type="submit"
        className="flex items-center gap-2 rounded px-2 py-1 text-body-sm font-medium text-ink-muted transition-colors hover:bg-hover hover:text-ink"
      >
        <LogoutIcon className="h-4 w-4" />
        <span>Abmelden</span>
      </button>
    </form>
  );
}

export default async function AppLayout({
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

      <div className="flex flex-1">
        {/* Sidebar (Desktop) */}
        <aside className="hidden w-64 shrink-0 border-r border-line bg-surface md:flex md:flex-col">
          <div className="px-6 py-6">
            <Link href="/dashboard" className="inline-block">
              <Image
                src="/ppwr-radar-logo.svg"
                alt="PPWR Radar"
                width={161}
                height={25}
                priority
              />
            </Link>
            <p className="mt-2 text-label uppercase text-ink-muted">
              by packaging journal
            </p>
          </div>
          <div className="flex-1 px-4 pt-6">
            <NavLinks />
          </div>
          <div className="space-y-2 border-t border-line px-6 py-4">
            <p
              className="truncate text-body-sm text-ink-muted"
              title={user.email ?? undefined}
            >
              {user.email}
            </p>
            <SignoutButton />
          </div>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {/* Topbar (Desktop) */}
          <header className="hidden h-16 items-center justify-between border-b border-line bg-surface px-6 md:flex">
            <span className="text-headline text-ink">PPWR Radar</span>
            <div className="flex items-center gap-4">
              <span
                className="hidden max-w-64 truncate rounded border border-line-strong px-3 py-1 text-body-sm text-ink-muted lg:inline-block"
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full border border-line-strong bg-line-strong text-ink">
                <PersonIcon className="h-5 w-5" />
              </span>
            </div>
          </header>

          {/* Topbar + Navigation (Mobil) */}
          <header className="border-b border-line bg-surface md:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/dashboard" className="inline-flex items-center">
                <Image
                  src="/ppwr-radar-logo.svg"
                  alt="PPWR Radar"
                  width={129}
                  height={20}
                  priority
                />
              </Link>
              <SignoutButton />
            </div>
            <div className="overflow-x-auto px-2 pb-1">
              <NavLinks orientation="horizontal" />
            </div>
          </header>

          <main className="flex-1 px-4 py-10 md:px-16">
            <div className="mx-auto w-full max-w-[1200px]">{children}</div>
          </main>

          <footer className="flex flex-col items-start justify-between gap-2 border-t border-line bg-footer px-6 py-4 sm:flex-row sm:items-center">
            <p className="text-label font-bold uppercase text-ink-muted">
              © 2026 PPWR Radar · by packaging journal
            </p>
            <ul className="flex gap-6 text-label uppercase">
              <li>
                <a className="text-ink-muted hover:underline" href="#">
                  Impressum
                </a>
              </li>
              <li>
                <a className="text-ink-muted hover:underline" href="#">
                  Datenschutz
                </a>
              </li>
              <li>
                <a className="text-ink-muted hover:underline" href="#">
                  Kontakt
                </a>
              </li>
            </ul>
          </footer>
        </div>
      </div>
    </div>
  );
}
