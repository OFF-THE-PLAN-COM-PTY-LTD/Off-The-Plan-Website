import type { SupabaseClient } from "@supabase/supabase-js";

// Shared select strings for development ("listing") queries. These were
// previously duplicated verbatim across the home, search, developer-detail
// and listing-detail pages — keep them identical in one place so card data
// stays consistent everywhere.

// The developer relationship resolves through the consolidated `accounts`
// table (agencies + developers were merged into accounts); `developer:` keeps
// the returned field name stable for consumers.
export const DEVELOPMENT_CARD_SELECT =
  "*, developer:accounts!account_id(*), images:development_images(*), floor_plans:development_floor_plans(*)";

// Slim select for card GRIDS (search results, homepage tiers, developer
// listings). PropertyCard only ever reads a handful of columns, a hero image,
// and the per-category floor-plan rows — it never renders description_html,
// mini_stocklist, lifestyle, agent contact fields, etc. Fetching `*` + full
// nested embeds shipped ~550KB (mostly scraped description HTML) for a search
// page rendering up to 500 rows, which made navigating to /search feel like
// the click did nothing. This lists only the columns the card actually uses
// so the grid payload stays small. Detail pages keep DEVELOPMENT_CARD_SELECT.
// (Called out in docs/codebase-analysis.md.)
export const DEVELOPMENT_GRID_SELECT =
  "id, slug, name, suburb, state, price_from, price_display, beds_min, beds_max, completion_quarter, type, tag, tier, status, is_featured, summary, hero_image_url, developer:accounts!account_id(name, logo_url), images:development_images(url, is_hero), floor_plans:development_floor_plans(*)";

export const DEVELOPMENT_DETAIL_SELECT =
  `${DEVELOPMENT_CARD_SELECT}, listing_agents:listing_agents(name, email, mobile, photo_url, sort_order)`;

export const DEVELOPMENT_HERO_SELECT = "hero_image_url, images:development_images(url)";

export const DEVELOPMENT_META_SELECT =
  "name, suburb, state, summary, hero_image_url, images:development_images(*)";

/**
 * Base query for published development cards. Callers chain additional
 * filters/order/limit onto the returned builder (it is thenable, so it can
 * also be awaited directly or passed to Promise.all).
 */
export function publishedDevelopmentCards(client: SupabaseClient) {
  return client
    .from("developments")
    .select(DEVELOPMENT_GRID_SELECT)
    .eq("is_published", true);
}

/** Published cards for a homepage tier, most recently updated first. */
export function getDevelopmentCardsByTier(client: SupabaseClient, tier: string, limit: number) {
  return publishedDevelopmentCards(client)
    .eq("tier", tier)
    .order("updated_at", { ascending: false })
    .limit(limit);
}

/** Full listing detail (incl. selling agents) by slug, published only. */
export function getDevelopmentBySlug(client: SupabaseClient, slug: string) {
  return client
    .from("developments")
    .select(DEVELOPMENT_DETAIL_SELECT)
    .eq("slug", slug)
    .eq("is_published", true)
    .single();
}

/** Lightweight fields for <head> metadata on the listing detail page. */
export function getDevelopmentMetaBySlug(client: SupabaseClient, slug: string) {
  return client
    .from("developments")
    .select(DEVELOPMENT_META_SELECT)
    .eq("slug", slug)
    .single();
}

/** One published listing's hero image for a category tile on the homepage. */
export function getCategoryHeroImage(client: SupabaseClient, type: string) {
  return client
    .from("developments")
    .select(DEVELOPMENT_HERO_SELECT)
    .eq("type", type)
    .eq("is_published", true)
    .limit(1)
    .single();
}
