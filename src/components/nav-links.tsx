"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  ChatIcon,
  DashboardIcon,
  DocumentIcon,
  SchoolIcon,
  VideoIcon,
} from "@/components/icons";

const NAV_ICONS = {
  "/dashboard": DashboardIcon,
  "/dokumente": DocumentIcon,
  "/assistant": ChatIcon,
  "/wissen": SchoolIcon,
  "/webinare": VideoIcon,
} as const;

export type NavHref = keyof typeof NAV_ICONS;

export interface NavItem {
  href: NavHref;
  label: string;
}

/** Labels kommen als Props aus dem Server-Layout (Sprachdateien, "Nav"). */
export function NavLinks({
  items,
  orientation = "vertical",
}: {
  items: NavItem[];
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();

  if (orientation === "horizontal") {
    return (
      <nav className="flex flex-row gap-1 whitespace-nowrap">
        {items.map((item) => {
          const active =
            pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`border-b-2 px-3 py-2 text-body-sm transition-colors ${
                active
                  ? "border-primary font-bold text-primary"
                  : "border-transparent font-medium text-ink-muted hover:bg-hover hover:text-ink"
              }`}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    );
  }

  return (
    <nav className="flex flex-col gap-4">
      {items.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
        const Icon = NAV_ICONS[item.href];
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-4 border-r-2 px-2 py-2 text-body transition-colors ${
              active
                ? "border-primary font-bold text-primary"
                : "border-transparent font-medium text-ink-muted hover:bg-hover hover:text-ink"
            }`}
          >
            <Icon filled={active} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
