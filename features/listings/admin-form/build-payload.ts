import { htmlToPlainText } from "./text-html";
import type { FloorPlan, MiniStocklistEntry } from "./types";

function n(v: number | ""): number | null { return v === "" ? null : v; }

// Flat mirror of the listing form's field state — one entry per form field
// that ends up in the save payload. Field names match the form's state
// variable names so call sites can use shorthand object literals.
export interface ListingPayloadState {
  isNew: boolean;
  id: string;
  type: string;
  tier: string;
  name: string;
  slug: string;
  developerId: string;
  portalDeveloperName: string;
  ownerUserId: string;
  developerWebsite: string;
  listingDuration: string;
  logoUrl: string;
  residenceCount: number | "";
  streetAddress: string;
  streetAddress2: string;
  country: string;
  state: string;
  city: string;
  postcode: string;
  suburb: string;
  locationDescription: string;
  saleOfficeStreet: string;
  saleOfficeStreet2: string;
  saleOfficeCountry: string;
  saleOfficeState: string;
  saleOfficeCity: string;
  saleOfficePostcode: string;
  displaySuiteTiming: string;
  description: string;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  lat: number | "";
  lng: number | "";
  priceFrom: number | "";
  searchPriceMax: number | "";
  priceDisplay: string;
  showPriceOnSearch: boolean;
  promotionalBanner: string;
  completionQuarter: string;
  configurationLabel: string;
  bedsMin: number | "";
  bedsMax: number | "";
  bathsMin: number | "";
  bathsMax: number | "";
  carsMin: number | "";
  carsMax: number | "";
  levels: number | "";
  internalSqmMin: number | "";
  internalSqmMax: number | "";
  landSizeMin: number | "";
  landSizeMax: number | "";
  lifestyle: string[];
  features: string[];
  architect: string;
  interiors: string;
  landscape: string;
  builder: string;
  nearbyAmenities: string[];
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentAgency: string;
  heroImageUrl: string;
  heroAltText: string;
  featureImageUrl: string;
  brochureUrl: string;
  videoUrl: string;
  agentLogo1: string;
  agentLogo2: string;
  virtualTourUrl: string;
  floorPlanUploadUrl: string;
  additionalVideoUrl: string;
  priceListUrl: string;
  specificationsUrl: string;
  seoTitle: string;
  seoDescription: string;
  floorPlans: FloorPlan[];
  miniStocklist: MiniStocklistEntry[];
}

// IMPORTANT: the autosave fingerprint is JSON.stringify() of this object, so
// the property insertion order below must not change — reordering keys would
// make every open form look "dirty" and fire a spurious autosave. The literal
// is copied verbatim from the original in-component buildPayload().
export function buildPayload(s: ListingPayloadState) {
  return {
    _method: s.isNew ? "POST" : "PATCH",
    id: s.isNew ? undefined : s.id,
    // Category
    type: s.type || null,
    tier: s.tier || null,
    // Project Overview
    name: s.name,
    slug: s.slug,
    developer_id: s.developerId || null,
    portal_developer_name: s.portalDeveloperName || null,
    owner_user_id: s.ownerUserId || null,
    developer_website: s.developerWebsite || null,
    listing_duration: s.listingDuration || null,
    logo_url: s.logoUrl || null,
    residence_count: n(s.residenceCount),
    // Address
    street_address: s.streetAddress || null,
    street_address_2: s.streetAddress2 || null,
    country: s.country || null,
    state: s.state || null,
    city: s.city || null,
    postcode: s.postcode || null,
    suburb: s.suburb || null,
    location_description: s.locationDescription || null,
    // Sale office
    sale_office_street: s.saleOfficeStreet || null,
    sale_office_street_2: s.saleOfficeStreet2 || null,
    sale_office_country: s.saleOfficeCountry || null,
    sale_office_state: s.saleOfficeState || null,
    sale_office_city: s.saleOfficeCity || null,
    sale_office_postcode: s.saleOfficePostcode || null,
    // Details
    display_suite_timing: s.displaySuiteTiming || null,
    description_html: s.description || null,
    description: s.description ? htmlToPlainText(s.description) || null : null,
    summary: s.description ? htmlToPlainText(s.description) || null : null,
    status: s.status,
    is_published: s.isPublished,
    is_featured: s.isFeatured,
    lat: n(s.lat),
    lng: n(s.lng),
    // Pricing
    price_from: n(s.priceFrom),
    search_price_max: n(s.searchPriceMax),
    price_display: s.priceDisplay || null,
    show_price_on_search: s.showPriceOnSearch,
    promotional_banner: s.promotionalBanner || null,
    completion_quarter: s.completionQuarter || null,
    configuration_label: s.configurationLabel || null,
    // Configuration
    beds_min: n(s.bedsMin),
    beds_max: n(s.bedsMax),
    baths_min: n(s.bathsMin),
    baths_max: n(s.bathsMax),
    cars_min: n(s.carsMin),
    cars_max: n(s.carsMax),
    levels: n(s.levels),
    internal_sqm_min: n(s.internalSqmMin),
    internal_sqm_max: n(s.internalSqmMax),
    land_size_min: n(s.landSizeMin),
    land_size_max: n(s.landSizeMax),
    // Features
    lifestyle: s.lifestyle.length ? s.lifestyle : null,
    features: s.features.length ? s.features : null,
    architect: s.architect || null,
    interiors: s.interiors || null,
    landscape: s.landscape || null,
    builder: s.builder || null,
    nearby_amenities: s.nearbyAmenities.length ? s.nearbyAmenities : null,
    // Agent
    agent_name: s.agentName || null,
    agent_phone: s.agentPhone || null,
    agent_email: s.agentEmail || null,
    agent_agency: s.agentAgency || null,
    // Uploads
    hero_image_url: s.heroImageUrl || null,
    hero_alt_text: s.heroAltText || null,
    feature_image_url: s.featureImageUrl || null,
    brochure_url: s.brochureUrl || null,
    video_url: s.videoUrl || null,
    agent_logo_1: s.agentLogo1 || null,
    agent_logo_2: s.agentLogo2 || null,
    virtual_tour_url: s.virtualTourUrl || null,
    floor_plan_upload_url: s.floorPlanUploadUrl || null,
    additional_video_url: s.additionalVideoUrl || null,
    price_list_url: s.priceListUrl || null,
    specifications_url: s.specificationsUrl || null,
    // SEO
    seo_title: s.seoTitle || null,
    seo_description: s.seoDescription || null,
    // Floor plans
    floor_plans: s.floorPlans,
    // Mini stocklist — only send rows where the user typed something
    // so empty drafts don't leak through.
    mini_stocklist: s.miniStocklist.filter(
      (r) => r.bed || r.bath || r.parking || r.size || r.price || r.lot_number || r.land_area || r.frontage || r.depth || r.house_size || r.land_size || r.floor_area || r.level || r.unit_suite_no || r.property_sub_type,
    ),
  };
}

export type ListingPayload = ReturnType<typeof buildPayload>;
