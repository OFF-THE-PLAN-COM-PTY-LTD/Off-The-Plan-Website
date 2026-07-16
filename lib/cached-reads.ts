import { unstable_cache } from "next/cache";
import { supabase } from "@/lib/supabase/public";
import {
  getCategoryHeroImage,
  getDevelopmentBySlug,
  getDevelopmentCardsByTier,
  getDevelopmentMetaBySlug,
  publishedDevelopmentCards,
} from "@/features/listings/queries";
import { LISTING_CARD_TAGS, LISTING_DETAIL_TAGS, PUBLIC_CACHE_TTL } from "@/lib/cache-tags";

// ── Cached public reads ──────────────────────────────────────────────────────
// Every public page currently hits Supabase on each request (pages are dynamic
// because the root layout reads auth cookies). These wrappers keep the pages
// dynamic but cache the DB *results* in the Next Data Cache, tagged by the
// tables they read, so repeated requests skip the round-trip. Freshness comes
// from revalidateTag on writes (app mutations + the Supabase webhook); the
// PUBLIC_CACHE_TTL is only a backstop bounding worst-case staleness.
//
// All reads here use the anon client (no cookies), so they are safe to cache.
// Never wrap the cookie-bound server client or the service-role admin client.

// ── Developers directory + profile (accounts) ───────────────────────────────

export const getCachedPublishedDevelopers = unstable_cache(
  async () => {
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("type", "Developer")
      .eq("is_published", true)
      .eq("archived", false)
      .eq("portal_status", "active")
      .order("name");
    return data ?? [];
  },
  ["developers:published-list"],
  { tags: ["accounts"], revalidate: PUBLIC_CACHE_TTL },
);

// The `/developers` directory shows a live listing count per developer, derived
// from developments.account_id — tagged on `developments` so publishing/hiding
// a listing updates the count.
export const getCachedPublishedDevelopmentAccountIds = unstable_cache(
  async () => {
    const { data } = await supabase
      .from("developments")
      .select("id, account_id")
      .eq("is_published", true);
    return data ?? [];
  },
  ["developers:published-development-account-ids"],
  { tags: ["developments"], revalidate: PUBLIC_CACHE_TTL },
);

export const getCachedDeveloperBySlug = unstable_cache(
  async (slug: string) => {
    const { data } = await supabase
      .from("accounts")
      .select("*")
      .eq("slug", slug)
      .eq("type", "Developer")
      .eq("is_published", true)
      .eq("archived", false)
      .eq("portal_status", "active")
      .maybeSingle();
    return data ?? null;
  },
  ["developers:by-slug"],
  { tags: ["accounts"], revalidate: PUBLIC_CACHE_TTL },
);

export const getCachedDeveloperMetaBySlug = unstable_cache(
  async (slug: string) => {
    const { data } = await supabase
      .from("accounts")
      .select("name, description")
      .eq("slug", slug)
      .eq("type", "Developer")
      .maybeSingle();
    return data ?? null;
  },
  ["developers:meta-by-slug"],
  { tags: ["accounts"], revalidate: PUBLIC_CACHE_TTL },
);

// ── Listings (developments) ─────────────────────────────────────────────────

// A developer profile's "Current listings" grid.
export const getCachedDevelopmentsByAccount = unstable_cache(
  async (accountId: string) => {
    const { data } = await publishedDevelopmentCards(supabase).eq("account_id", accountId);
    return data ?? [];
  },
  ["listings:by-account"],
  { tags: LISTING_CARD_TAGS, revalidate: PUBLIC_CACHE_TTL },
);

// Homepage tier grids.
export const getCachedDevelopmentCardsByTier = unstable_cache(
  async (tier: string, limit: number) => {
    const { data } = await getDevelopmentCardsByTier(supabase, tier, limit);
    return data ?? [];
  },
  ["listings:cards-by-tier"],
  { tags: LISTING_CARD_TAGS, revalidate: PUBLIC_CACHE_TTL },
);

// Homepage category tile hero image.
export const getCachedCategoryHeroImage = unstable_cache(
  async (type: string) => {
    const { data } = await getCategoryHeroImage(supabase, type);
    return data ?? null;
  },
  ["listings:category-hero"],
  { tags: ["developments", "development_images"], revalidate: PUBLIC_CACHE_TTL },
);

// Listing detail page + its <head> metadata.
export const getCachedDevelopmentBySlug = unstable_cache(
  async (slug: string) => {
    const { data } = await getDevelopmentBySlug(supabase, slug);
    return data ?? null;
  },
  ["listings:by-slug"],
  { tags: LISTING_DETAIL_TAGS, revalidate: PUBLIC_CACHE_TTL },
);

export const getCachedDevelopmentMetaBySlug = unstable_cache(
  async (slug: string) => {
    const { data } = await getDevelopmentMetaBySlug(supabase, slug);
    return data ?? null;
  },
  ["listings:meta-by-slug"],
  { tags: LISTING_DETAIL_TAGS, revalidate: PUBLIC_CACHE_TTL },
);
