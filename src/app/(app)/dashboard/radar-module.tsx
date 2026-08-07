/* eslint-disable @next/next/no-img-element */
import Image from "next/image";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import { Badge } from "@/components/badge";
import { LockIcon, OpenInNewIcon, VideoIcon } from "@/components/icons";
import { LegalCard, LegalCardFooter } from "@/components/ui";
import { formatDate } from "@/lib/labels";
import type { PjNews, PjVideo, UpdateMemo } from "@/lib/radar";

/**
 * Radar-Module des Dashboards: Änderungslog (update_memos) sowie News und
 * Videos von packaging-journal.de. Werden vom vollen Dashboard und vom
 * Vorzimmer gemeinsam genutzt – im gesperrten Zustand zeigt das Änderungslog
 * nur Titel, der Detail-Link führt zur Freischalten-Karte (#freischalten).
 */

export async function AenderungslogKarte({
  memos,
  gesperrt,
}: {
  memos: UpdateMemo[];
  gesperrt: boolean;
}) {
  const t = await getTranslations("Dashboard");
  const tr = await getTranslations("Radar");

  return (
    <LegalCard className="mt-6">
      <div className="flex-1 p-6">
        <h2 className="mb-8 flex items-center gap-2 text-headline text-ink">
          {gesperrt && <LockIcon className="h-5 w-5 text-ink-muted" />}
          <span>{t("radarTitel")}</span>
        </h2>

        {memos.length === 0 ? (
          <p className="text-body text-ink-muted">{tr("leer")}</p>
        ) : (
          <ol className="space-y-6 border-l border-line-strong pl-6">
            {memos.map((memo) => (
              <li key={memo.id}>
                <div className="flex flex-wrap items-center gap-3">
                  <span className="font-mono text-mono-sm text-ink-muted">
                    {formatDate(memo.veroeffentlicht_am)}
                  </span>
                  {memo.quelle && <Badge variant="blue">{memo.quelle}</Badge>}
                </div>
                <h3 className="mt-1 text-body-lg font-bold text-ink">
                  {memo.titel}
                </h3>
                {gesperrt ? (
                  <Link
                    href="#freischalten"
                    className="mt-1 inline-block text-body-sm font-medium text-legal hover:underline"
                  >
                    {tr("detailsGesperrt")}
                  </Link>
                ) : (
                  memo.memo_text && (
                    <p className="mt-1 whitespace-pre-line text-body-sm text-ink-muted">
                      {memo.memo_text}
                    </p>
                  )
                )}
              </li>
            ))}
          </ol>
        )}
      </div>
      <LegalCardFooter>{t("radarFooter")}</LegalCardFooter>
    </LegalCard>
  );
}

/** Kopfzeile „Aus der Redaktion von [PJ-Logo]“ + News- und Video-Karten. */
export async function AktuellesBereich({
  news,
  videos,
}: {
  news: PjNews[];
  videos: PjVideo[];
}) {
  const tr = await getTranslations("Radar");

  return (
    <section className="mt-10">
      <h2 className="mb-6 flex flex-wrap items-center gap-3 text-headline text-ink">
        <span>{tr("redaktionKopf")}</span>
        <a
          href="https://packaging-journal.de"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center"
        >
          <Image
            src="/pj-logo.png"
            alt="packaging journal"
            width={78}
            height={32}
          />
        </a>
      </h2>

      <PjNewsKarte news={news} />
      <div className="mt-6">
        <PjVideosKarte videos={videos} />
      </div>
    </section>
  );
}

async function PjNewsKarte({ news }: { news: PjNews[] }) {
  const tr = await getTranslations("Radar");

  return (
    <LegalCard>
      <div className="flex-1 p-6">
        <h3 className="mb-6 text-headline text-ink">{tr("newsTitel")}</h3>
        {news.length === 0 ? (
          <p className="text-body text-ink-muted">{tr("keineNews")}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-2">
            {news.map((beitrag) => (
              <li key={beitrag.link}>
                <a
                  href={beitrag.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group flex items-start gap-4"
                >
                  {beitrag.thumbnail && (
                    <img
                      src={beitrag.thumbnail}
                      alt=""
                      loading="lazy"
                      className="h-16 w-28 shrink-0 rounded border border-line object-cover"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="font-mono text-mono-sm text-ink-muted">
                      {formatDate(beitrag.datum)}
                    </span>
                    <span className="mt-0.5 flex items-start gap-2 text-body font-bold text-ink group-hover:text-primary">
                      <span>{beitrag.titel}</span>
                      <OpenInNewIcon className="mt-1 h-3.5 w-3.5 shrink-0 text-ink-muted" />
                    </span>
                    <span className="mt-0.5 line-clamp-2 block text-body-sm text-ink-muted">
                      {beitrag.auszug}
                    </span>
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <a
          href="https://packaging-journal.de/tag/eu-verpackungsverordnung/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-body-sm font-medium text-legal hover:underline"
        >
          {tr("alleNews")}
        </a>
      </div>
      <LegalCardFooter>{tr("quelleFooter")}</LegalCardFooter>
    </LegalCard>
  );
}

async function PjVideosKarte({ videos }: { videos: PjVideo[] }) {
  const tr = await getTranslations("Radar");

  return (
    <LegalCard>
      <div className="flex-1 p-6">
        <h3 className="mb-6 text-headline text-ink">{tr("videosTitel")}</h3>
        {videos.length === 0 ? (
          <p className="text-body text-ink-muted">{tr("keineVideos")}</p>
        ) : (
          <ul className="grid grid-cols-1 gap-x-8 gap-y-6 md:grid-cols-3">
            {videos.map((video) => (
              <li key={video.link}>
                <a
                  href={video.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group block"
                >
                  {video.thumbnail ? (
                    <img
                      src={video.thumbnail}
                      alt=""
                      loading="lazy"
                      className="aspect-video w-full rounded border border-line object-cover"
                    />
                  ) : (
                    <span className="flex aspect-video w-full items-center justify-center rounded border border-line bg-surface">
                      <VideoIcon className="h-8 w-8 text-ink-muted" />
                    </span>
                  )}
                  <span className="mt-2 block font-mono text-mono-sm text-ink-muted">
                    {formatDate(video.datum)}
                  </span>
                  <span className="mt-0.5 block text-body font-bold text-ink group-hover:text-primary">
                    {video.titel}
                  </span>
                </a>
              </li>
            ))}
          </ul>
        )}
        <a
          href="https://packaging-journal.de/vimeo-videos/packaging-regulation/"
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block text-body-sm font-medium text-legal hover:underline"
        >
          {tr("alleVideos")}
        </a>
      </div>
      <LegalCardFooter>{tr("quelleFooter")}</LegalCardFooter>
    </LegalCard>
  );
}
