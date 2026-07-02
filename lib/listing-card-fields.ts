/**
 * Per-category field configuration for the Configuration Summary
 * (listing results card) and Mini Stocklist (admin form + listing
 * detail page).
 *
 * Two field lists per category:
 *   - card: ≤ 4 fields shown on the search-results card and the
 *     admin Configuration Summary table.
 *   - stocklist: shown in the admin Mini Stocklist table and the
 *     "Properties Available" table on the listing detail page.
 *     Can be longer than the card list (e.g. House and Land's
 *     stocklist captures House Size + Frontage on top of the card
 *     fields). Defaults to the card list when not specified.
 *
 * Per dev spec v4 — PDF pages 2–7.
 */

import type { ComponentType } from "react";
import {
  BedIcon,
  BathIcon,
  CarIcon,
  ExpandIcon,
  LotNumberIcon,
  FrontageIcon,
  DepthIcon,
  LandAreaIcon,
  FloorAreaIcon,
  LevelIcon,
} from "@/components/icons";

export interface CardFieldDef {
  /**
   * Key used on the DevelopmentFloorPlan record (Configuration Summary).
   * Also used on MiniStocklistRow unless `stocklistKey` overrides it.
   */
  key: string;
  /** Mini Stocklist jsonb key, if different from `key`. */
  stocklistKey?: string;
  /** Admin form column header */
  label: string;
  /** Icon shown next to the value on the public card */
  icon: ComponentType<{ size?: number; className?: string }>;
  /** HTML input type for the admin form (select renders a dropdown) */
  type: "number" | "text" | "select";
  /** Options for a select-type field */
  options?: string[];
  /** Placeholder shown in the admin input */
  placeholder?: string;
  /** Unit suffix rendered on the card after the value (e.g. "m²", "m") */
  cardUnit?: string;
  /** Width hint for the admin input element */
  inputWidth?: string;
}

const BEDS: CardFieldDef = {
  key: "beds",
  stocklistKey: "bed",
  label: "Beds",
  icon: BedIcon,
  // Text (not number) so admins can write "1+S", "3+S" etc. for
  // "Bedroom + Study" configurations that the legacy site uses.
  type: "text",
  placeholder: "3 (or 3+S)",
  inputWidth: "w-20",
};
const BATH: CardFieldDef = {
  key: "bath",
  label: "Bath",
  icon: BathIcon,
  type: "number",
  placeholder: "2",
  inputWidth: "w-20",
};
const GARAGE: CardFieldDef = {
  key: "garage",
  stocklistKey: "parking",
  label: "Garage",
  icon: CarIcon,
  type: "number",
  placeholder: "2",
  inputWidth: "w-20",
};
const TOTAL_SIZE: CardFieldDef = {
  key: "internal_sqm",
  stocklistKey: "size",
  label: "Total Size (sqm)",
  icon: ExpandIcon,
  type: "number",
  placeholder: "185",
  cardUnit: "m²",
  inputWidth: "w-28",
};
const LOT_NUMBER: CardFieldDef = {
  key: "lot_number",
  label: "Lot No.",
  icon: LotNumberIcon,
  type: "text",
  placeholder: "Lot 142",
  inputWidth: "w-28",
};
const LAND_AREA: CardFieldDef = {
  key: "land_area_sqm",
  stocklistKey: "land_area",
  label: "Land Area (m²)",
  icon: LandAreaIcon,
  type: "number",
  placeholder: "375",
  cardUnit: "m²",
  inputWidth: "w-28",
};
const FRONTAGE: CardFieldDef = {
  key: "frontage_m",
  stocklistKey: "frontage",
  label: "Frontage (m)",
  icon: FrontageIcon,
  type: "number",
  placeholder: "12.5",
  cardUnit: "m",
  inputWidth: "w-24",
};
const DEPTH: CardFieldDef = {
  key: "depth_m",
  stocklistKey: "depth",
  label: "Depth (m)",
  icon: DepthIcon,
  type: "number",
  placeholder: "30",
  cardUnit: "m",
  inputWidth: "w-24",
};
const LAND_SIZE: CardFieldDef = {
  key: "land_size_sqm",
  stocklistKey: "land_size",
  label: "Land Size (m²)",
  icon: LandAreaIcon,
  type: "number",
  placeholder: "400",
  cardUnit: "m²",
  inputWidth: "w-28",
};
const HOUSE_SIZE: CardFieldDef = {
  key: "house_size_sqm",
  stocklistKey: "house_size",
  label: "House Size (m²)",
  icon: ExpandIcon,
  type: "number",
  placeholder: "210",
  cardUnit: "m²",
  inputWidth: "w-28",
};
const FLOOR_AREA: CardFieldDef = {
  key: "floor_area_sqm",
  stocklistKey: "floor_area",
  label: "Floor Area (m²)",
  icon: FloorAreaIcon,
  type: "number",
  placeholder: "143",
  cardUnit: "m²",
  inputWidth: "w-28",
};
const LEVEL: CardFieldDef = {
  key: "level",
  label: "Level",
  icon: LevelIcon,
  type: "text",
  placeholder: "Level 2",
  inputWidth: "w-24",
};
// Commercial reuses the existing parking column under a different label.
const CAR_SPACES: CardFieldDef = {
  key: "garage",
  stocklistKey: "parking",
  label: "Car Spaces",
  icon: CarIcon,
  type: "number",
  placeholder: "1",
  inputWidth: "w-20",
};
const UNIT_SUITE: CardFieldDef = {
  key: "unit_suite_no",
  label: "Unit / Suite No.",
  icon: LotNumberIcon,
  type: "text",
  placeholder: "Suite 12",
  inputWidth: "w-28",
};
const PROPERTY_SUB_TYPE: CardFieldDef = {
  key: "property_sub_type",
  label: "Property Sub-Type",
  icon: FloorAreaIcon,
  type: "select",
  options: ["Office", "Retail", "Industrial", "Warehouse", "Medical", "Childcare", "Development Site"],
  placeholder: "— Select —",
  inputWidth: "w-40",
};

interface CategoryConfig {
  card: CardFieldDef[];
  /** Defaults to the card list when omitted. */
  stocklist?: CardFieldDef[];
}

/**
 * The default residential field set, used when a category isn't
 * registered explicitly.
 */
export const DEFAULT_CARD_FIELDS: CardFieldDef[] = [BEDS, BATH, GARAGE, TOTAL_SIZE];

// Ched confirmed 2026-07-02 against the legacy admin: every listing category
// (New Apartments, Townhouses, Land and Estates, House & Land, Over 55s /
// Retirement, Commercial) uses the SAME Configuration Summary field set —
// Beds / Bath / Garage / Total Size / Price From. Legacy does not swap in
// Lot No. / Frontage / Depth / Floor Area / etc. per category.
//
// We revert to that behavior here by leaving CATEGORY_CONFIG empty — every
// category falls back to DEFAULT_CARD_FIELDS via the helpers below.
//
// The per-category CardFieldDef defs above (LOT_NUMBER, LAND_AREA, FRONTAGE,
// DEPTH, HOUSE_SIZE, LAND_SIZE, FLOOR_AREA, LEVEL, CAR_SPACES, UNIT_SUITE,
// PROPERTY_SUB_TYPE) are intentionally retained even though nothing in
// CATEGORY_CONFIG references them today. If Tim ever asks for per-category
// fields ("dev spec v4" originally proposed this), the field defs are
// ready to wire back into a category entry — no rewrite needed.
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const _UNUSED_FIELD_DEFS_KEPT_FOR_FUTURE_SCOPE = [
  LOT_NUMBER, LAND_AREA, FRONTAGE, DEPTH,
  HOUSE_SIZE, LAND_SIZE, FLOOR_AREA, LEVEL,
  CAR_SPACES, UNIT_SUITE, PROPERTY_SUB_TYPE,
];

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {};

export function getCardFields(category: string | null | undefined): CardFieldDef[] {
  if (!category) return DEFAULT_CARD_FIELDS;
  return CATEGORY_CONFIG[category]?.card ?? DEFAULT_CARD_FIELDS;
}

/**
 * Used by the admin Mini Stocklist table + listing detail page
 * Properties Available table. Defaults to the card field list when
 * a category doesn't define a separate stocklist.
 */
export function getStocklistFields(category: string | null | undefined): CardFieldDef[] {
  if (!category) return DEFAULT_CARD_FIELDS;
  const conf = CATEGORY_CONFIG[category];
  return conf?.stocklist ?? conf?.card ?? DEFAULT_CARD_FIELDS;
}
