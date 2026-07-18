import Link from "next/link";
import { redirect } from "next/navigation";
import { NavLinks } from "@/components/nav-links";
import { isPreviewMode } from "@/lib/preview";
import { createClient } from "@/lib/supabase/server";

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
        <div className="bg-amber-400 px-4 py-2 text-center text-sm font-medium text-amber-950">
          Vorschau-Modus – ungeprüfte Inhalte
        </div>
      )}

      <div className="flex flex-1">
        {/* Sidebar */}
        <aside className="hidden w-60 shrink-0 border-r border-neutral-200 md:flex md:flex-col">
          <div className="px-6 py-6">
            <Link href="/dashboard" className="text-lg font-semibold tracking-tight text-neutral-900">
              PPWR <span className="text-accent">Radar</span>
            </Link>
          </div>
          <div className="flex-1 px-3">
            <NavLinks />
          </div>
          <div className="border-t border-neutral-200 px-6 py-4">
            <p className="truncate text-xs text-neutral-500" title={user.email ?? undefined}>
              {user.email}
            </p>
            <form action="/auth/signout" method="post" className="mt-2">
              <button
                type="submit"
                className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
              >
                Abmelden
              </button>
            </form>
          </div>
        </aside>

        {/* Mobile: Topbar mit horizontaler Navigation */}
        <div className="flex min-w-0 flex-1 flex-col">
          <header className="border-b border-neutral-200 md:hidden">
            <div className="flex items-center justify-between px-4 py-3">
              <Link href="/dashboard" className="text-base font-semibold tracking-tight text-neutral-900">
                PPWR <span className="text-accent">Radar</span>
              </Link>
              <form action="/auth/signout" method="post">
                <button
                  type="submit"
                  className="text-xs font-medium text-neutral-500 hover:text-neutral-900"
                >
                  Abmelden
                </button>
              </form>
            </div>
            <div className="overflow-x-auto px-2 pb-2">
              <NavLinks orientation="horizontal" />
            </div>
          </header>

          <main className="flex-1 px-6 py-10 md:px-12">
            <div className="mx-auto w-full max-w-5xl">{children}</div>
          </main>
        </div>
      </div>
    </div>
  );
}
