/**
 * Per-category Property Features taxonomy.
 *
 * Source: scraped directly from Tim's existing live admin
 * (offtheplan.com.au/listing_detail) on 2026-06-04 — see
 * docs/category-features-spec.md.
 *
 * The 'Property Features' checkbox list in the admin listing form should
 * render the entries here that match the currently-selected `type` value.
 * Categories without a confirmed list yet (TBD) fall back to the
 * residential set so we never render an empty checklist; once Tim's
 * spec doc arrives we'll replace those with the right ones.
 */

const RESIDENTIAL_FEATURES = [
  "Bar area",
  "BBQ Facilities",
  "Bike share",
  "Bin Chute",
  "Book Retreat and Library",
  "Building manager / Concierge",
  "Business center",
  "Cabanas",
  "Car share",
  "City views",
  "Co working options",
  "Consultation Room",
  "Delivery Room",
  "Dining room(s)",
  "EV charging capability",
  "Fireplaces",
  "Flowing, Light-Filled Layouts",
  "Fully Equipped Gym",
  "Guest apartment",
  "Jacuzzi/Spa(s)",
  "Kids Play Area",
  "Lounge and Casual dining",
  "Lush Residents' Pool",
  "Massage Room",
  "Music Room",
  "Outdoor fireplace",
  "Outdoor Gym",
  "Outdoor Theatre",
  "Premium Appliances Throughout",
  "Private Gardens & Terraces",
  "Putting Green",
  "Rooftop Garden",
  "Sauna and Steam Rooms",
  "Sculptural Architecture",
  "Sky Deck",
  "Swimming Pool(s)",
  "Tennis Courts",
  "Teppanyaki Grill",
  "Theatre",
  "Waterfront",
  "Wine Cellar",
  "Winter Garden",
  "Yoga Studio",
];

const COMMERCIAL_FEATURES = [
  "Air conditioned",
  "Car parking",
  "CCTV security camera",
  "Close to Transport",
  "Designated signage panels",
  "Efficient Lighting",
  "End of trip facilities",
  "Grease trap",
  "Green star energy ratings",
  "High ceilings",
  "High Profile location",
  "Internal fit out inclusions",
  "Kitchen facility",
  "Landscaping",
  "Low outgoings",
  "NBN connection",
  "Secure access",
  "Shop Front",
  "Staff Facilities",
];

/**
 * Category name (matches the `type` column on `developments`) → feature list.
 *
 * Categories that we haven't been able to scrape yet (most listings of
 * those types are archived on the live site) fall back to the
 * residential set as a sensible placeholder. Tim's spec doc will refine
 * these when it arrives.
 */
export const CATEGORY_FEATURES: Record<string, string[]> = {
  "New Apartments":         RESIDENTIAL_FEATURES,
  Townhouses:               RESIDENTIAL_FEATURES, // TBD — assumes residential
  "Land and Estates":       RESIDENTIAL_FEATURES, // TBD — likely a lighter, land-focused set
  Commercial:               COMMERCIAL_FEATURES,
  "House & Land":           RESIDENTIAL_FEATURES, // TBD — builder-package
  Houses:                   RESIDENTIAL_FEATURES, // legacy alias for House & Land
  "New Home Design":        RESIDENTIAL_FEATURES, // TBD — builder-package
  "Over 55's / Retirement": RESIDENTIAL_FEATURES, // TBD — likely accessibility-tilted
};

/** Returns the feature checklist for a given category, defaulting to residential. */
export function featuresForCategory(category: string | null | undefined): string[] {
  if (!category) return RESIDENTIAL_FEATURES;
  return CATEGORY_FEATURES[category] ?? RESIDENTIAL_FEATURES;
}
