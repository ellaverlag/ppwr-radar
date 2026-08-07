import "server-only";

import { createClient } from "@/lib/supabase/server";

/**
 * Datenschicht für die Radar-Module des Dashboards:
 * - Änderungslog aus update_memos (Supabase, RLS: veröffentlichte Memos)
 * - PPWR-News und -Videos von packaging-journal.de (WordPress REST API)
 *
 * Externe Quellen sind gecacht (revalidate) und fallen bei Fehlern leise
 * auf leere Listen zurück – das Dashboard darf nie an PJ-Ausfällen scheitern.
 */

const PJ_API = "https://packaging-journal.de/wp-json/wp/v2";
const NEWS_TAG_SLUG = "eu-verpackungsverordnung";
const VIDEO_TAX_SLUG = "packaging-regulation";

// ---------------------------------------------------------------------------
// Änderungslog (update_memos)
// ---------------------------------------------------------------------------

export interface UpdateMemo {
  id: string;
  titel: string;
  memo_text: string | null;
  veroeffentlicht_am: string;
  quelle: string | null;
}

/**
 * update_memos hat (noch) keine Quelle-Spalte – der Chip wird heuristisch
 * aus Titel/Text abgeleitet. Reihenfolge = Priorität.
 */
const QUELLEN: [string, string[]][] = [
  ["BGBl", ["bgbl", "bundesgesetzblatt", "verpackdg"]],
  ["EU-Kommission", ["kommission", "c(202", "faq", "leitfaden"]],
  ["ZSVR", ["zsvr", "lucid"]],
  ["CEN", ["cen", "normungsmandat", "harmonisierte norm"]],
  ["EUR-Lex", ["eur-lex", "delegiert", "durchführungsrechtsakt"]],
];

function quelleFuer(titel: string, text: string | null): string | null {
  const heuhaufen = `${titel} ${text ?? ""}`.toLowerCase();
  for (const [label, muster] of QUELLEN) {
    if (muster.some((m) => heuhaufen.includes(m))) return label;
  }
  return null;
}

export async function ladeUpdateMemos(limit = 5): Promise<UpdateMemo[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("update_memos")
    .select("id, titel, memo_text, veroeffentlicht_am")
    .not("veroeffentlicht_am", "is", null)
    .order("veroeffentlicht_am", { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data.map((memo) => ({
    ...memo,
    quelle: quelleFuer(memo.titel, memo.memo_text),
  }));
}

// ---------------------------------------------------------------------------
// packaging-journal.de – News & Videos
// ---------------------------------------------------------------------------

export interface PjNews {
  titel: string;
  link: string;
  datum: string;
  auszug: string;
  thumbnail: string | null;
}

export interface PjVideo {
  titel: string;
  link: string;
  datum: string;
  thumbnail: string | null;
}

function entHtml(roh: string): string {
  return roh
    .replace(/<[^>]+>/g, "")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#8230;|&hellip;/g, "…")
    .replace(/&nbsp;/g, " ")
    .trim();
}

interface WpEmbedded {
  "wp:featuredmedia"?: {
    source_url?: string;
    media_details?: {
      sizes?: Record<string, { source_url?: string }>;
    };
  }[];
}

/** Beitragsbild aus _embedded, bevorzugt in Größe medium. */
function thumbnailAus(embedded: WpEmbedded | undefined): string | null {
  const medium = embedded?.["wp:featuredmedia"]?.[0];
  const sizes = medium?.media_details?.sizes ?? {};
  return (
    sizes.medium?.source_url ??
    sizes.full?.source_url ??
    medium?.source_url ??
    null
  );
}

async function pjFetch(pfad: string, revalidate: number): Promise<unknown> {
  const res = await fetch(`${PJ_API}${pfad}`, {
    next: { revalidate },
    signal: AbortSignal.timeout(8000),
  });
  if (!res.ok) throw new Error(`PJ-API ${pfad}: HTTP ${res.status}`);
  return res.json();
}

/** Term-ID einer Taxonomie per Slug auflösen (täglich gecacht). */
async function termId(taxRestBase: string, slug: string): Promise<number | null> {
  const rows = (await pjFetch(
    `/${taxRestBase}?slug=${encodeURIComponent(slug)}&_fields=id,slug`,
    86400
  )) as { id: number; slug: string }[];
  return rows[0]?.id ?? null;
}

export async function ladePpwrNews(limit = 4): Promise<PjNews[]> {
  try {
    const tagId = await termId("tags", NEWS_TAG_SLUG);
    if (!tagId) return [];
    const posts = (await pjFetch(
      `/posts?tags=${tagId}&per_page=${limit}&_fields=title,link,date,excerpt,_links&_embed=wp:featuredmedia`,
      1800
    )) as {
      title: { rendered: string };
      link: string;
      date: string;
      excerpt: { rendered: string };
      _embedded?: WpEmbedded;
    }[];
    return posts.map((p) => ({
      titel: entHtml(p.title.rendered),
      link: p.link,
      datum: p.date,
      auszug: entHtml(p.excerpt.rendered),
      thumbnail: thumbnailAus(p._embedded),
    }));
  } catch (e) {
    console.error("PPWR-News nicht ladbar:", e instanceof Error ? e.message : e);
    return [];
  }
}

/**
 * Die PJ-Videos sind der eigene Beitragstyp `vimeo-video` (REST-Base
 * `vimeo-video`). Er unterstützt KEINE Standard-Kategorien – „Packaging
 * Regulation“ ist ein Term der eigenen Taxonomie `vimeo-videos`
 * (Filter-Parameter `?vimeo-videos={id}`). Der im Konzept skizzierte
 * RSS-Fallback war daher nicht nötig.
 */
export async function ladePpwrVideos(limit = 6): Promise<PjVideo[]> {
  try {
    const catId = await termId("vimeo-videos", VIDEO_TAX_SLUG);
    if (!catId) return [];
    const videos = (await pjFetch(
      `/vimeo-video?vimeo-videos=${catId}&per_page=${limit}&_embed`,
      1800
    )) as {
      title: { rendered: string };
      link: string;
      date: string;
      _embedded?: WpEmbedded;
    }[];
    return videos.map((v) => ({
      titel: entHtml(v.title.rendered),
      link: v.link,
      datum: v.date,
      thumbnail: thumbnailAus(v._embedded),
    }));
  } catch (e) {
    console.error("PPWR-Videos nicht ladbar:", e instanceof Error ? e.message : e);
    return [];
  }
}
