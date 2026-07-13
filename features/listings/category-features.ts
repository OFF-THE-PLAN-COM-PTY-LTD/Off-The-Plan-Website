/**
 * Per-category Property Features taxonomy.
 *
 * Source: scraped directly from Tim's existing live admin
 * (offtheplan.com.au/listing_detail) on 2026-06-04 — see
 * docs/category-features-spec.md.
 *
 * The 'Property Features' checkbox list in the admin listing form should
 * render the entries here that match the currently-selected `type` value.
 */

const NEW_APARTMENTS_FEATURES = [
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

const TOWNHOUSES_FEATURES = [
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
  "Fully Equipped Gym",
  "Guest apartment",
  "Jacuzzi/Spa(s)",
  "Kids Play Area",
  "Lounge and Casual dining",
  "Massage Room",
  "Music Room",
  "Outdoor fireplace",
  "Outdoor Gym",
  "Outdoor Theatre",
  "Putting Green",
  "Rooftop Garden",
  "Sauna and Steam Rooms",
  "Sky Deck",
  "Swimming Pool(s)",
  "Tennis Courts",
  "Teppanyaki Grill",
  "Theatre",
  "Waterfront",
  "Wine Cellar",
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

const LAND_AND_ESTATES_FEATURES = [
  "Bar area",
  "BBQ Facilities",
  "Bike share",
  "Bin Chute",
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
  "Fully Equipped Gym",
  "Guest apartment",
  "Jacuzzi/Spa(s)",
  "Lounge and Casual dining",
  "Outdoor fireplace",
  "Outdoor Theatre",
  "Putting Green",
  "Rooftop Garden",
  "Sauna and Steam Rooms",
  "Swimming Pool(s)",
  "Theatre",
  "Waterfront",
  "Wine Cellar",
];

// House & Land doesn't really use the Property Features section on the
// live admin — the only checkbox the form shows is the "is there a
// display home for this design?" toggle, which is functionally a
// separate field, not a feature. We treat House & Land as having no
// property features and rely on the rest of the form (floor plans,
// brochures, etc.) for its content.
const HOUSE_AND_LAND_FEATURES: string[] = [];

// Retirement listings on the live admin show a community/lifestyle-oriented
// set that has no overlap with the apartment list — emphasises proximity to
// services, gated community amenities, public facilities, etc.
const OVER_55S_FEATURES = [
  "Bin Chute",
  "Close to Primary schools",
  "Community center planned",
  "Fencing packages",
  "Gated Community",
  "Landscaping packages",
  "Natural parklands",
  "New primary school planned",
  "New secondary school planned",
  "New Shopping Centre",
  "Public activity area",
  "Public BBQ facilities",
  "Security",
  "Boating nearby",
  "Bowling green nearby",
  "Church nearby",
  "Close to beach",
  "Close to golf",
  "Close to nature",
  "Close to parklands",
  "Close to shops",
  "Close to transport",
  "Close to water",
  "Clubs nearby",
  "Medical services nearby",
  "Quiet location",
];

/**
 * Category name (matches the `type` column on `developments`) → feature list.
 *
 * Confirmed by direct scrape from the live admin on 2026-06-04:
 *   New Apartments, Townhouses, Commercial, Land and Estates,
 *   House & Land, Over 55's / Retirement.
 */
export const CATEGORY_FEATURES: Record<string, string[]> = {
  "New Apartments":         NEW_APARTMENTS_FEATURES,
  Townhouses:               TOWNHOUSES_FEATURES,
  "Land and Estates":       LAND_AND_ESTATES_FEATURES,
  Commercial:               COMMERCIAL_FEATURES,
  "House & Land":           HOUSE_AND_LAND_FEATURES,
  Houses:                   HOUSE_AND_LAND_FEATURES, // legacy alias for House & Land
  "Over 55's / Retirement": OVER_55S_FEATURES,
};

/** Returns the feature checklist for a given category, defaulting to residential. */
export function featuresForCategory(category: string | null | undefined): string[] {
  if (!category) return NEW_APARTMENTS_FEATURES;
  return CATEGORY_FEATURES[category] ?? NEW_APARTMENTS_FEATURES;
}
