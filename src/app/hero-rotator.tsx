"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Schreibmaschinen-Rotation der Hero-Schlussklausel (Referenz:
 * design-reference/landing.html). Bei prefers-reduced-motion bleibt statisch
 * die erste Phrase stehen, ohne Caret-Blinken. Alle Timer laufen über eine
 * einzige Ref und werden beim Unmount aufgeräumt (kein Timer-Leak).
 */
export function HeroRotator({ phrasen }: { phrasen: string[] }) {
  // Initial (und bei reduced motion dauerhaft): die erste Phrase statisch
  const [text, setText] = useState(phrasen[0] ?? "");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (phrasen.length === 0) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let i = 0;
    let ch = phrasen[0].length; // Start: erste Phrase steht (SSR-Markup) …
    let deleting = true; //        … und wird zuerst abgebaut

    const plane = (fn: () => void, ms: number) => {
      timerRef.current = setTimeout(fn, ms);
    };

    const tick = () => {
      const voll = phrasen[i];
      if (!deleting) {
        ch += 1;
        setText(voll.slice(0, ch));
        if (ch === voll.length) {
          deleting = true;
          return plane(tick, 1600);
        }
        return plane(tick, 55);
      }
      ch -= 1;
      setText(voll.slice(0, ch));
      if (ch === 0) {
        deleting = false;
        i = (i + 1) % phrasen.length;
        return plane(tick, 260);
      }
      return plane(tick, 28);
    };

    plane(tick, 1600);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [phrasen]);

  return (
    <span className="block min-h-[1.2em] text-primary">
      {/* Screenreader hören die vollständigen Phrasen, nicht jedes Zeichen */}
      <span className="sr-only">{phrasen.join(" ")}</span>
      <span aria-hidden="true">{text}</span>
      {/* Caret: bei reduced motion komplett ausgeblendet (statische Phrase) */}
      <span
        aria-hidden="true"
        className="ml-0.5 inline-block h-[1em] w-[3px] translate-y-[0.12em] animate-caret-blink bg-primary motion-reduce:hidden"
      />
    </span>
  );
}
