/**
 * Canonical listing URL scheme.
 *
 * Listings live at the ROOT under their category, e.g.
 *   /townhouses/the-listing-slug
 *   /apartments/the-listing-slug
 *
 * The category segment is derived from the listing's `type` column
 * (see CATEGORY_TO_SLUG below). Because the category sits at the root, it
 * shares a namespace with every other top-level page (/about, /journal,
 * /developers …). To keep a category from silently shadowing — or being
 * shadowed by — one of those static routes, every category slug is checked
 * against RESERVED_TOP_LEVEL_SEGMENTS by __tests__/listing-url.test.ts. If
 * you add a new category whose natural slug collides, that test FAILS at
 * build/CI time — the signal to pick a different slug (e.g. add a
 * qualifying word) before shipping.
 *
 * Adding a new category:
 *   1. Add it to PORTAL_TYPES in features/listings/admin-form/sections/category-section.tsx.
 *   2. Add a `type → slug` entry here (plural, lower-case, hyphenated).
 *   3. Run the tests — the guard confirms the slug is collision-free.
 */

/**
 * Maps a `developments.type` value to its URL slug.
 *
 * Slugs are plural to match the data (per product decision 2026-07-13).
 * Legacy `type` values (Apartments, Houses, Penthouses) are included so
 * older rows resolve to a sensible category rather than the fallback.
 */
export const CATEGORY_TO_SLUG: Record<string, string> = {
  "New Apartments": "new-apartments",
  Apartments: "new-apartments", // legacy alias → same canonical URL
  Townhouses: "townhouses",
  Houses: "houses", // legacy
  Penthouses: "penthouses", // legacy
  "Land and Estates": "land-and-estates",
  Commercial: "commercial",
  "House & Land": "house-and-land",
  "Over 55's / Retirement": "retirement",
};

/**
 * Slugs that used to be canonical and may still be linked / indexed
 * (e.g. "apartments" before it became "new-apartments"). They stay VALID so
 * the [category]/[slug] route accepts them and permanent-redirects to the
 * current canonical slug — instead of 404ing an old inbound link.
 */
export const LEGACY_ACCEPTED_SLUGS = new Set<string>(["apartments"]);

/**
 * Slug used when a listing has no `type` (or an unrecognised one). These
 * listings keep the historical /listings/<slug> path, which is also why
 * old links keep working after the switch.
 */
export const FALLBACK_CATEGORY_SLUG = "listings";

/**
 * Top-level route segments a category slug must never equal, because a
 * static route at the same path would shadow the listing (Next.js resolves
 * a concrete folder like /journal before the dynamic [category] segment,
 * so a category named "journal" would be unreachable).
 *
 * Keep this in sync with the top-level folders in /app. `listings` is the
 * fallback slug itself, reserved so no real category can claim it.
 */
export const RESERVED_TOP_LEVEL_SEGMENTS = new Set<string>([
  "about",
  "account",
  "admin",
  "api",
  "auth",
  "contact",
  "dev",
  "developers",
  "features-and-pricing",
  "guides",
  "journal",
  "list-a-listing",
  "listings",
  "login",
  "map",
  "news",
  "portal",
  "privacy",
  "resources",
  "robots.txt",
  "saved",
  "search",
  "signup",
  "sitemap.xml",
  "terms",
]);

/** Every slug the /[category]/[slug] route should accept. */
export const VALID_CATEGORY_SLUGS = new Set<string>([
  ...Object.values(CATEGORY_TO_SLUG),
  ...LEGACY_ACCEPTED_SLUGS,
  FALLBACK_CATEGORY_SLUG,
]);

/** Returns the canonical category slug for a listing's `type`. */
export function categorySlug(type: string | null | undefined): string {
  if (!type) return FALLBACK_CATEGORY_SLUG;
  return CATEGORY_TO_SLUG[type] ?? FALLBACK_CATEGORY_SLUG;
}

/** True when `slug` is a category the listing route knows how to serve. */
export function isValidCategorySlug(slug: string): boolean {
  return VALID_CATEGORY_SLUGS.has(slug);
}

/** Canonical path to a listing detail page, e.g. `/townhouses/my-slug`. */
export function listingPath(dev: { type?: string | null; slug: string }): string {
  return `/${categorySlug(dev.type)}/${dev.slug}`;
}
