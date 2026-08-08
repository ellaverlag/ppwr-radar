"use client";

import ReactMarkdown from "react-markdown";

/**
 * Markdown-Renderer für Assistant-Antworten mit schlanker Allowlist:
 * Überschriften (alle Ebenen → h3/h4-Optik), Bold/Kursiv, Listen, Absätze,
 * Trennlinie, Zitat. Kein rohes HTML (skipHtml), keine Links, keine
 * Tabellen – alles außerhalb der Allowlist wird auf seinen Text reduziert
 * (unwrapDisallowed). Styling im Token-Design der App.
 */

const ERLAUBTE_ELEMENTE = [
  "h1",
  "h2",
  "h3",
  "h4",
  "h5",
  "h6",
  "p",
  "strong",
  "em",
  "ul",
  "ol",
  "li",
  "hr",
  "blockquote",
  "br",
];

function H3({ children }: { children?: React.ReactNode }) {
  return (
    <h3 className="mt-5 text-body-lg font-bold text-ink first:mt-0">
      {children}
    </h3>
  );
}

function H4({ children }: { children?: React.ReactNode }) {
  return (
    <h4 className="mt-4 text-body font-bold text-ink first:mt-0">{children}</h4>
  );
}

export function AntwortMarkdown({ markdown }: { markdown: string }) {
  return (
    <div className="max-w-[80ch] text-body text-ink">
      <ReactMarkdown
        skipHtml
        allowedElements={ERLAUBTE_ELEMENTE}
        unwrapDisallowed
        components={{
          h1: H3,
          h2: H3,
          h3: H3,
          h4: H4,
          h5: H4,
          h6: H4,
          p: ({ children }) => <p className="mt-3 first:mt-0">{children}</p>,
          strong: ({ children }) => (
            <strong className="font-bold text-ink">{children}</strong>
          ),
          ul: ({ children }) => (
            <ul className="mt-3 list-disc space-y-1.5 pl-5 first:mt-0">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mt-3 list-decimal space-y-1.5 pl-5 first:mt-0">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="pl-1">{children}</li>,
          hr: () => <hr className="my-5 border-line" />,
          blockquote: ({ children }) => (
            <blockquote className="mt-3 border-l-2 border-line-strong pl-4 text-ink-muted">
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
