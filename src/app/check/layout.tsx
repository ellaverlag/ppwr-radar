import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { landingFontClasses } from "@/app/landing-fonts";
import { BrandLink } from "@/components/brand";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations("Meta.check");
  return {
    title: t("title"),
    description: t("description"),
  };
}

export default async function CheckLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const t = await getTranslations("Check");

  return (
    <div className={`${landingFontClasses} flex min-h-screen flex-col bg-canvas`}>
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-[1200px] items-center justify-between px-4 md:px-16">
          <BrandLink href="/" priority />
          <Link
            href="/login"
            className="text-body-sm font-medium text-ink-muted hover:text-ink"
          >
            {t("anmelden")}
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
