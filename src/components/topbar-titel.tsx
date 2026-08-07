"use client";

import { usePathname } from "next/navigation";
import type { NavItem } from "@/components/nav-links";

/**
 * Name des aktiven Bereichs für die Topbar – aus der Route abgeleitet,
 * mit derselben Logik wie die aktive Sidebar-Markierung in NavLinks.
 */
export function TopbarTitel({
  items,
  className,
}: {
  items: NavItem[];
  className?: string;
}) {
  const pathname = usePathname();
  const aktiv = items.find(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`)
  );
  if (!aktiv) return null;
  return <span className={className}>{aktiv.label}</span>;
}
