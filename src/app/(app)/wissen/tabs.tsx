"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { href: "/wissen", label: "Anforderungen" },
  { href: "/wissen/auslegungen", label: "Auslegungen" },
];

export function WissenTabs() {
  const pathname = usePathname();

  return (
    <div className="mb-8 flex gap-6 border-b border-neutral-200">
      {TABS.map((tab) => {
        const active =
          tab.href === "/wissen"
            ? pathname === "/wissen" || pathname.startsWith("/wissen/anforderungen")
            : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`-mb-px border-b-2 pb-3 text-sm font-medium transition-colors ${
              active
                ? "border-accent text-accent"
                : "border-transparent text-neutral-500 hover:text-neutral-900"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
