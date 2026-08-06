import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { BrandLink } from "@/components/brand";
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

  const t = await getTranslations("Onboarding");
  const tCommon = await getTranslations("Common");

  return (
    <div className="flex min-h-screen flex-col">
      {isPreviewMode() && (
        <div className="bg-gold px-4 py-2 text-center text-label uppercase text-ink">
          {tCommon("previewBanner")}
        </div>
      )}

      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 md:px-16">
          <BrandLink href="/dashboard" byline={false} priority />
          <Link
            href="/dashboard"
            className="text-body-sm font-medium text-ink-muted hover:text-ink"
          >
            {t("zumDashboard")}
          </Link>
        </div>
      </header>

      <main className="flex-1 px-4 py-12 md:px-16">
        <div className="mx-auto w-full max-w-[680px]">{children}</div>
      </main>

      <footer className="border-t border-line bg-footer px-6 py-4">
        <p className="text-center text-label uppercase text-ink-muted">
          {t("footer")}
        </p>
      </footer>
    </div>
  );
}
