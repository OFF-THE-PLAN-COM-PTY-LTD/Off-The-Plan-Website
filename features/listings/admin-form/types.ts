// Shared types used by the admin listing form and its extracted
// sub-components (features/listings/admin-form/fields + managers).

export interface GalleryImage { id: string; url: string; sort_order: number }

export interface FloorPlan {
  id?: string;
  beds: string;
  bath: string;
  garage: string;
  internal_sqm: string;
  price_from: string;
  plan_type: string;
  config: string;
  image_url: string;
  // Land Estates fields — empty string for categories that don't use them.
  lot_number: string;
  land_area_sqm: string;
  frontage_m: string;
  depth_m: string;
  // House and Land fields — empty string for categories that don't use them.
  house_size_sqm: string;
  land_size_sqm: string;
  // Commercial fields — empty string for non-Commercial categories.
  floor_area_sqm: string;
  level: string;
  unit_suite_no: string;
  property_sub_type: string;
}

// Mini stocklist row — every cell stays a free-text string so admins
// can enter things like "Contact Agent" or "Fr. $660,000" verbatim,
// matching what Tim's existing site allows.
export interface MiniStocklistEntry {
  bed: string;
  bath: string;
  parking: string;
  size: string;
  price: string;
  // Land Estates fields — empty string for non-LE categories.
  lot_number?: string;
  land_area?: string;
  frontage?: string;
  depth?: string;
  // House and Land fields — empty string for non-H&L categories.
  house_size?: string;
  land_size?: string;
  // Commercial fields — empty string for non-Commercial categories.
  floor_area?: string;
  level?: string;
  unit_suite_no?: string;
  property_sub_type?: string;
}

// Row shapes for the listing form's server-loaded dropdown data.
export interface Developer { id: string; name: string }
export interface Member { id: string; full_name: string | null; interest_type: string | null }

// Server-loaded listing row (developments table) as consumed by the form.
export interface ListingData {
  id?: string;
  // Category
  type?: string;
  tag?: string;
  tier?: string | null;
  // Project Overview
  name?: string;
  slug?: string;
  developer_id?: string | null;
  portal_developer_name?: string | null;
  owner_user_id?: string | null;
  developer_website?: string;
  listing_duration?: string;
  logo_url?: string;
  residence_count?: number | null;
  // Address
  street_address?: string;
  street_address_2?: string;
  country?: string;
  state?: string;
  city?: string;
  postcode?: string;
  suburb?: string;
  location_description?: string;
  // Sale office
  sale_office_street?: string;
  sale_office_street_2?: string;
  sale_office_country?: string;
  sale_office_state?: string;
  sale_office_city?: string;
  sale_office_postcode?: string;
  // Details
  display_suite_timing?: string;
  description?: string;
  description_html?: string;
  summary?: string;
  status?: string;
  is_published?: boolean;
  is_featured?: boolean;
  subscription_status?: string | null;
  lat?: number | null;
  lng?: number | null;
  // Pricing / dates
  price_from?: number | null;
  search_price_max?: number | null;
  price_display?: string;
  show_price_on_search?: boolean;
  promotional_banner?: string;
  completion_quarter?: string;
  configuration_label?: string;
  // Configuration Summary
  beds_min?: number | null;
  beds_max?: number | null;
  baths_min?: number | null;
  baths_max?: number | null;
  cars_min?: number | null;
  cars_max?: number | null;
  levels?: number | null;
  internal_sqm_min?: number | null;
  internal_sqm_max?: number | null;
  land_size_min?: number | null;
  land_size_max?: number | null;
  // Features
  lifestyle?: string[];
  features?: string[] | null;
  architect?: string;
  interiors?: string;
  landscape?: string;
  builder?: string;
  // Amenities
  nearby_amenities?: string[] | null;
  // Agent
  agent_name?: string;
  agent_phone?: string;
  agent_email?: string;
  agent_agency?: string;
  // Uploads
  hero_image_url?: string;
  hero_alt_text?: string;
  feature_image_url?: string;
  brochure_url?: string;
  video_url?: string;
  agent_logo_1?: string;
  agent_logo_2?: string;
  virtual_tour_url?: string;
  floor_plan_upload_url?: string;
  additional_video_url?: string;
  price_list_url?: string;
  specifications_url?: string;
  // SEO
  seo_title?: string;
  seo_description?: string;
  // Mini stocklist — see MiniStocklistEntry above. Up to 20 rows.
  mini_stocklist?: MiniStocklistEntry[] | null;
}

export interface Agent {
  id?: string;
  name: string;
  email: string;
  mobile: string;
  photo_url: string;
  isNew?: boolean;
  saving?: boolean;
  deleting?: boolean;
  // Transient UI flag flipped on for ~2.5s after a successful save so the
  // Save button can show "✓ Saved" and the admin actually knows their click
  // did something. Fades back to false via setTimeout.
  justSaved?: boolean;
}
