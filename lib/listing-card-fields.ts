/**
 * Per-category field configuration for the Configuration Summary
 * (listing results card) and Mini Stocklist (admin form + listing
 * detail page).
 *
 * Source of truth for which columns to render on the public card,
 * which inputs to show in the admin form's Configuration Summary
 * and Mini Stocklist tables, and which icons go with each field.
 *
 * Per dev spec v4 — PDF page 7 visibility matrix.
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
} from "@/components/icons";

export interface CardFieldDef {
  /**
   * Key used on the DevelopmentFloorPlan record (Configuration Summary)
   * AND on the MiniStocklistRow record (Mini Stocklist). When the two
   * differ (e.g. floor_plan uses `land_area_sqm` numeric while stocklist
   * uses `land_area` text), pass both via stocklistKey.
   */
  key: string;
  /** Mini Stocklist jsonb key, if different from `key`. */
  stocklistKey?: string;
  /** Admin form column header */
  label: string;
  /** Icon shown next to the value on the public card */
  icon: ComponentType<{ size?: number; className?: string }>;
  /** HTML input type for the admin form (number = numeric only) */
  type: "number" | "text";
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
  type: "number",
  placeholder: "3",
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

/**
 * The default residential field set, used by all categories until each
 * is migrated to its category-specific set per the dev spec.
 */
export const DEFAULT_CARD_FIELDS: CardFieldDef[] = [BEDS, BATH, GARAGE, TOTAL_SIZE];

const CARD_FIELDS_BY_CATEGORY: Record<string, CardFieldDef[]> = {
  "New Apartments":         [BEDS, BATH, GARAGE, TOTAL_SIZE],
  Townhouses:               [BEDS, BATH, GARAGE, TOTAL_SIZE],
  "Land and Estates":       [LOT_NUMBER, LAND_AREA, FRONTAGE, DEPTH],
  "House & Land":           [BEDS, BATH, GARAGE, TOTAL_SIZE], // updated in House+Land step
  Houses:                   [BEDS, BATH, GARAGE, TOTAL_SIZE], // legacy alias
  "Over 55's / Retirement": [BEDS, BATH, GARAGE, TOTAL_SIZE],
  Commercial:               [BEDS, BATH, GARAGE, TOTAL_SIZE], // updated in Commercial step
};

export function getCardFields(category: string | null | undefined): CardFieldDef[] {
  if (!category) return DEFAULT_CARD_FIELDS;
  return CARD_FIELDS_BY_CATEGORY[category] ?? DEFAULT_CARD_FIELDS;
}
