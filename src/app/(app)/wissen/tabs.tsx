"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export interface WissenTab {
  href: "/wissen" | "/wissen/auslegungen" | "/wissen/glossar";
  label: string;
}

/** Labels kommen als Props aus den Server-Seiten (Sprachdateien, "Wissen.tabs"). */
export function WissenTabs({ tabs }: { tabs: WissenTab[] }) {
  const pathname = usePathname();

  return (
    <div className="mb-10 flex gap-8 border-b border-line">
      {tabs.map((tab) => {
        const active =
          tab.href === "/wissen"
            ? pathname === "/wissen" ||
              pathname.startsWith("/wissen/anforderungen")
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 pb-3 text-body-sm transition-colors ${
              active
                ? "border-primary font-bold text-primary"
                : "border-transparent font-semibold text-ink-muted hover:text-ink"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
