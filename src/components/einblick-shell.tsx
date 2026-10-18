"use client";

import { useEffect, useRef } from "react";

/**
 * Hülle der Einblick-Seiten: Da sie in einem iframe laufen, würden interne
 * Links sonst innerhalb des Schiebefensters navigieren. Interne Links, die
 * nicht selbst Einblick-Seiten sind, öffnen deshalb im Hauptfenster.
 */
export function EinblickShell({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onClick = (e: MouseEvent) => {
      const a = (e.target as HTMLElement | null)?.closest("a");
      if (!a) return;
      const href = a.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      if (a.target === "_blank") return;
      if (href.startsWith("/einblick/")) return;
      if (window.top && window.top !== window) {
        e.preventDefault();
        window.top.location.href = a.href;
      }
    };
    el.addEventListener("click", onClick);
    return () => el.removeEventListener("click", onClick);
  }, []);
  return <div ref={ref}>{children}</div>;
}
