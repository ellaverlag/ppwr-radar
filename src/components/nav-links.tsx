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

const NAV_ITEMS = [
  { href: "/dashboard", label: "Dashboard", Icon: DashboardIcon },
  { href: "/dokumente", label: "Meine Dokumente", Icon: DocumentIcon },
  { href: "/assistant", label: "Assistant", Icon: ChatIcon },
  { href: "/wissen", label: "Wissen", Icon: SchoolIcon },
  { href: "/webinare", label: "Webinare", Icon: VideoIcon },
];

export function NavLinks({
  orientation = "vertical",
}: {
  orientation?: "vertical" | "horizontal";
}) {
  const pathname = usePathname();

  if (orientation === "horizontal") {
    return (
      <nav className="flex flex-row gap-1 whitespace-nowrap">
        {NAV_ITEMS.map((item) => {
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
      {NAV_ITEMS.map((item) => {
        const active =
          pathname === item.href || pathname.startsWith(`${item.href}/`);
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
            <item.Icon filled={active} className="h-5 w-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
