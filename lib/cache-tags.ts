import { revalidateTag } from "next/cache";

// ── Cache tags ───────────────────────────────────────────────────────────────
// Tags are 1:1 with the Postgres tables that back PUBLIC page content. A cached
// read (see features/listings/cached-queries.ts, lib/cached-reads.ts) tags
// itself with EVERY table it reads — including embedded joins — and any writer
// of a table calls revalidateTag(<table>). So a change to, say,
// `development_images` busts every cached read that embedded images, and a
// change to `accounts` busts both the developer directory and every listing card
// that shows the developer's name/logo.
//
// Keeping tags = raw table names lets the Supabase DB webhook
// (app/api/revalidate) map a changed table straight to a tag with zero guesswork
// — which is what lets it also catch out-of-app writes (scripts, direct
// dashboard edits) that never call revalidateTag themselves.
export const CACHE_TABLES = [
  "developments",
  "development_images",
  "development_floor_plans",
  "listing_agents",
  "accounts",
  "journal_articles",
  "homepage_banners",
  "ads",
] as const;

export type CacheTable = (typeof CACHE_TABLES)[number];

// Reads that embed several tables in a single query tag themselves with all of
// them. A listing card query returns development rows with `accounts`,
// `development_images` and `development_floor_plans` embedded, so mutating any of
// those must invalidate the card.
export const LISTING_CARD_TAGS: CacheTable[] = [
  "developments",
  "development_images",
  "development_floor_plans",
  "accounts",
];

export const LISTING_DETAIL_TAGS: CacheTable[] = [...LISTING_CARD_TAGS, "listing_agents"];

// Default revalidate (seconds) for cached public reads. Tag-based invalidation
// (app mutations + the Supabase webhook) makes updates near-instant; this TTL is
// only the backstop that bounds worst-case staleness if a revalidation is ever
// missed or the webhook is down. 60s is imperceptible for a listings site.
export const PUBLIC_CACHE_TTL = 60;

/**
 * Bust every cached public read tagged with any of the given tables.
 * Call from route handlers after a successful write, and from the revalidation
 * webhook. Passing a table not in CACHE_TABLES is harmless (revalidateTag on an
 * unused tag is a no-op), but we filter to keep intent explicit.
 */
export function revalidatePublicTables(tables: readonly string[]) {
  for (const t of tables) {
    if ((CACHE_TABLES as readonly string[]).includes(t)) revalidateTag(t);
  }
}
