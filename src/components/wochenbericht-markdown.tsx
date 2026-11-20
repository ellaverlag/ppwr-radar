"use client";

import ReactMarkdown from "react-markdown";

/**
 * Markdown-Renderer für die Wochenberichte des Rechtsmonitorings
 * (radar_wochenberichte.body_markdown). Im Unterschied zum Assistant-
 * Renderer sind Links erlaubt (Quellen: EUR-Lex, OEIL, Kommission, ZSVR),
 * sie öffnen extern. Kein rohes HTML, keine Tabellen, keine Bilder.
 *
 * Konventionen des Monitoring-Textes:
 * - `## ` je Fund, letzter Abschnitt „Was sich nicht bewegt hat“
 * - `> Auf einen Blick: …` als Kasten direkt nach dem Einstieg
 * - `**Was gilt weiterhin:**` genau einmal je Fund-Abschnitt
 */

const ERLAUBTE_ELEMENTE = [
  "h1",
  "h2",
  "h3",
  "p",
  "a",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "hr",
  "blockquote",
  "br",
];

function H2({ children }: { children?: React.ReactNode }) {
  return (
    <h2 className="mt-10 text-headline text-ink first:mt-0">{children}</h2>
  );
}

export function WochenberichtMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="max-w-[72ch] text-body text-ink">
      <ReactMarkdown
        skipHtml
        allowedElements={ERLAUBTE_ELEMENTE}
        unwrapDisallowed
        components={{
          h1: H2,
          h2: H2,
          h3: ({ children }) => (
            <h3 className="mt-6 text-body-lg font-bold text-ink">{children}</h3>
          ),
          p: ({ children }) => <p className="mt-4 first:mt-0">{children}</p>,
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-legal underline decoration-legal/40 underline-offset-2 hover:decoration-legal"
            >
              {children}
            </a>
          ),
          strong: ({ children }) => (
            <strong className="font-bold text-ink">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="mt-4 list-disc space-y-1.5 pl-5">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-4 list-decimal space-y-1.5 pl-5">{children}</ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          hr: () => <hr className="my-8 border-line" />,
          blockquote: ({ children }) => (
            <blockquote className="mt-6 rounded border border-line bg-surface p-5 text-body text-ink [&>p]:mt-0">
              {children}
            </blockquote>
          ),
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
