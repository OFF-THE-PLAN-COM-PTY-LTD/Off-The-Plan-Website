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
