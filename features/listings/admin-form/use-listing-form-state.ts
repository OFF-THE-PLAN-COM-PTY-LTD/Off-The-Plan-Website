"use client";

// Grouped state for the admin/portal listing form. Every field that used to
// be its own useState in listing-form.tsx lives in exactly one section slice
// below; field names are identical to the old variable names (e.g.
// state.overview.developerId was `developerId`). Initializer expressions are
// copied verbatim from the original useState calls so defaults ("Australia",
// "Selling now", `?? true`, description/mini-stocklist init logic) behave
// exactly the same.
//
// Update mechanism (one consistent rule):
//   - Slice fields are updated with plain partial objects via `set.<slice>()`
//     which shallow-merges into the slice.
//   - Collections that rely on functional updates (lifestyle, gallery,
//     floorPlans, miniStocklist) stay as individual useStates inside this
//     hook, are exposed read-side under `state.rows.*`, and their raw React
//     setters (setLifestyle, setGallery, …) are returned as passthroughs.

import { useState } from "react";
import { plainTextToHtml } from "./text-html";
import type { GalleryImage, FloorPlan, MiniStocklistEntry, ListingData } from "./types";

// ─── Slice types ─────────────────────────────────────────────────────────────

export interface CategorySlice {
  type: string;
  tier: string;
}

export interface OverviewSlice {
  name: string;
  slug: string;
  developerId: string;
  portalDeveloperName: string;
  ownerUserId: string;
  developerWebsite: string;
  listingDuration: string;
  logoUrl: string;
  residenceCount: number | "";
}

export interface AddressSlice {
  streetAddress: string;
  streetAddress2: string;
  country: string;
  state: string;
  city: string;
  postcode: string;
  suburb: string;
  locationDescription: string;
}

export interface SaleOfficeSlice {
  saleOfficeStreet: string;
  saleOfficeStreet2: string;
  saleOfficeCountry: string;
  saleOfficeState: string;
  saleOfficeCity: string;
  saleOfficePostcode: string;
}

export interface DetailsSlice {
  displaySuiteTiming: string;
  description: string;
  status: string;
  isPublished: boolean;
  isFeatured: boolean;
  lat: number | "";
  lng: number | "";
}

export interface PricingSlice {
  priceFrom: number | "";
  searchPriceMax: number | "";
  priceDisplay: string;
  showPriceOnSearch: boolean;
  promotionalBanner: string;
  completionQuarter: string;
  configurationLabel: string;
}

export interface ConfigSlice {
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
}

export interface FeaturesSlice {
  features: string[];
  architect: string;
  interiors: string;
  landscape: string;
  builder: string;
}

export interface AmenitiesSlice {
  nearbyAmenities: string[];
}

export interface AgentSlice {
  agentName: string;
  agentPhone: string;
  agentEmail: string;
  agentAgency: string;
}

export interface UploadsSlice {
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
}

export interface SeoSlice {
  seoTitle: string;
  seoDescription: string;
}

// Functional-update collections — read-only view; write via the raw setters
// returned by the hook.
export interface RowsSlice {
  lifestyle: string[];
  gallery: GalleryImage[];
  floorPlans: FloorPlan[];
  miniStocklist: MiniStocklistEntry[];
}

export interface ListingFormState {
  category: CategorySlice;
  overview: OverviewSlice;
  address: AddressSlice;
  saleOffice: SaleOfficeSlice;
  details: DetailsSlice;
  pricing: PricingSlice;
  config: ConfigSlice;
  features: FeaturesSlice;
  amenities: AmenitiesSlice;
  agent: AgentSlice;
  uploads: UploadsSlice;
  seo: SeoSlice;
  rows: RowsSlice;
}

export interface ListingFormSet {
  category: (p: Partial<CategorySlice>) => void;
  overview: (p: Partial<OverviewSlice>) => void;
  address: (p: Partial<AddressSlice>) => void;
  saleOffice: (p: Partial<SaleOfficeSlice>) => void;
  details: (p: Partial<DetailsSlice>) => void;
  pricing: (p: Partial<PricingSlice>) => void;
  config: (p: Partial<ConfigSlice>) => void;
  features: (p: Partial<FeaturesSlice>) => void;
  amenities: (p: Partial<AmenitiesSlice>) => void;
  agent: (p: Partial<AgentSlice>) => void;
  uploads: (p: Partial<UploadsSlice>) => void;
  seo: (p: Partial<SeoSlice>) => void;
}

// ─── Hook ────────────────────────────────────────────────────────────────────

export function useListingFormState(
  existing: ListingData | undefined,
  initialGallery: GalleryImage[],
  initialFloorPlans: FloorPlan[],
) {
  // Category
  // Tag field removed from the edit form 2026-07-09. Existing values in the
  // DB stay untouched and still render on property cards; no new writes.
  const [category, setCategory] = useState<CategorySlice>({
    type: existing?.type ?? "",
    tier: existing?.tier ?? "",
  });

  // Project Overview – identity
  const [overview, setOverview] = useState<OverviewSlice>({
    name: existing?.name ?? "",
    slug: existing?.slug ?? "",
    developerId: existing?.developer_id ?? "",
    portalDeveloperName: existing?.portal_developer_name ?? "",
    ownerUserId: existing?.owner_user_id ?? "",
    developerWebsite: existing?.developer_website ?? "",
    listingDuration: existing?.listing_duration ?? "",
    logoUrl: existing?.logo_url ?? "",
    residenceCount: existing?.residence_count ?? "",
  });

  // Address
  const [address, setAddress] = useState<AddressSlice>({
    streetAddress: existing?.street_address ?? "",
    streetAddress2: existing?.street_address_2 ?? "",
    country: existing?.country ?? "Australia",
    state: existing?.state ?? "",
    city: existing?.city ?? "",
    postcode: existing?.postcode ?? "",
    suburb: existing?.suburb ?? "",
    locationDescription: existing?.location_description ?? "",
  });

  // Sale office address
  const [saleOffice, setSaleOffice] = useState<SaleOfficeSlice>({
    saleOfficeStreet: existing?.sale_office_street ?? "",
    saleOfficeStreet2: existing?.sale_office_street_2 ?? "",
    saleOfficeCountry: existing?.sale_office_country ?? "",
    saleOfficeState: existing?.sale_office_state ?? "",
    saleOfficeCity: existing?.sale_office_city ?? "",
    saleOfficePostcode: existing?.sale_office_postcode ?? "",
  });

  // Description & timing
  const [details, setDetails] = useState<DetailsSlice>({
    displaySuiteTiming: existing?.display_suite_timing ?? "",
    description:
      existing?.description_html ?? plainTextToHtml(existing?.description ?? existing?.summary ?? ""),
    status: existing?.status ?? "Selling now",
    isPublished: existing?.is_published ?? false,
    isFeatured: existing?.is_featured ?? false,
    lat: existing?.lat ?? "",
    lng: existing?.lng ?? "",
  });

  // Pricing & dates
  const [pricing, setPricing] = useState<PricingSlice>({
    priceFrom: existing?.price_from ?? "",
    searchPriceMax: existing?.search_price_max ?? "",
    priceDisplay: existing?.price_display ?? "",
    showPriceOnSearch: existing?.show_price_on_search ?? true,
    promotionalBanner: existing?.promotional_banner ?? "",
    completionQuarter: existing?.completion_quarter ?? "",
    configurationLabel: existing?.configuration_label ?? "",
  });

  // Configuration Summary
  const [config, setConfig] = useState<ConfigSlice>({
    bedsMin: existing?.beds_min ?? "",
    bedsMax: existing?.beds_max ?? "",
    bathsMin: existing?.baths_min ?? "",
    bathsMax: existing?.baths_max ?? "",
    carsMin: existing?.cars_min ?? "",
    carsMax: existing?.cars_max ?? "",
    levels: existing?.levels ?? "",
    internalSqmMin: existing?.internal_sqm_min ?? "",
    internalSqmMax: existing?.internal_sqm_max ?? "",
    landSizeMin: existing?.land_size_min ?? "",
    landSizeMax: existing?.land_size_max ?? "",
  });

  // Property Features (lifestyle lives in `rows` — functional updates)
  const [features, setFeatures] = useState<FeaturesSlice>({
    features: existing?.features ?? [],
    architect: existing?.architect ?? "",
    interiors: existing?.interiors ?? "",
    landscape: existing?.landscape ?? "",
    builder: existing?.builder ?? "",
  });

  // Nearby Amenities
  const [amenities, setAmenities] = useState<AmenitiesSlice>({
    nearbyAmenities: existing?.nearby_amenities ?? [],
  });

  // Selling Agent
  const [agent, setAgent] = useState<AgentSlice>({
    agentName: existing?.agent_name ?? "",
    agentPhone: existing?.agent_phone ?? "",
    agentEmail: existing?.agent_email ?? "",
    agentAgency: existing?.agent_agency ?? "",
  });

  // Uploads + Optional Uploads
  const [uploads, setUploads] = useState<UploadsSlice>({
    heroImageUrl: existing?.hero_image_url ?? "",
    heroAltText: existing?.hero_alt_text ?? "",
    featureImageUrl: existing?.feature_image_url ?? "",
    brochureUrl: existing?.brochure_url ?? "",
    videoUrl: existing?.video_url ?? "",
    agentLogo1: existing?.agent_logo_1 ?? "",
    agentLogo2: existing?.agent_logo_2 ?? "",
    virtualTourUrl: existing?.virtual_tour_url ?? "",
    floorPlanUploadUrl: existing?.floor_plan_upload_url ?? "",
    additionalVideoUrl: existing?.additional_video_url ?? "",
    priceListUrl: existing?.price_list_url ?? "",
    specificationsUrl: existing?.specifications_url ?? "",
  });

  // SEO
  const [seo, setSeo] = useState<SeoSlice>({
    seoTitle: existing?.seo_title ?? "",
    seoDescription: existing?.seo_description ?? "",
  });

  // ── Functional-update collections (kept as individual useStates) ──────────
  const [lifestyle, setLifestyle] = useState<string[]>(existing?.lifestyle ?? []);
  const [gallery, setGallery] = useState<GalleryImage[]>(initialGallery);
  const [floorPlans, setFloorPlans] = useState<FloorPlan[]>(initialFloorPlans);
  // "Properties Available" table — separate from floor_plans. Free-text
  // cells so an admin can enter "Contact Agent" or "Fr. $660,000" the
  // same way Tim's existing site allows. Capped at 20 rows.
  const [miniStocklist, setMiniStocklist] = useState<MiniStocklistEntry[]>(
    Array.isArray(existing?.mini_stocklist)
      ? (existing!.mini_stocklist as MiniStocklistEntry[])
      : [],
  );

  const state: ListingFormState = {
    category,
    overview,
    address,
    saleOffice,
    details,
    pricing,
    config,
    features,
    amenities,
    agent,
    uploads,
    seo,
    rows: { lifestyle, gallery, floorPlans, miniStocklist },
  };

  const set: ListingFormSet = {
    category: (p) => setCategory((prev) => ({ ...prev, ...p })),
    overview: (p) => setOverview((prev) => ({ ...prev, ...p })),
    address: (p) => setAddress((prev) => ({ ...prev, ...p })),
    saleOffice: (p) => setSaleOffice((prev) => ({ ...prev, ...p })),
    details: (p) => setDetails((prev) => ({ ...prev, ...p })),
    pricing: (p) => setPricing((prev) => ({ ...prev, ...p })),
    config: (p) => setConfig((prev) => ({ ...prev, ...p })),
    features: (p) => setFeatures((prev) => ({ ...prev, ...p })),
    amenities: (p) => setAmenities((prev) => ({ ...prev, ...p })),
    agent: (p) => setAgent((prev) => ({ ...prev, ...p })),
    uploads: (p) => setUploads((prev) => ({ ...prev, ...p })),
    seo: (p) => setSeo((prev) => ({ ...prev, ...p })),
  };

  return { state, set, setLifestyle, setGallery, setFloorPlans, setMiniStocklist };
}

export type UseListingFormStateReturn = ReturnType<typeof useListingFormState>;
