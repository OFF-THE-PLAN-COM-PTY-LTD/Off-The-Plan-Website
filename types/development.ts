export type DevelopmentStatus = "Selling now" | "Final release" | "Register interest";
export type DevelopmentType = "Apartments" | "Townhouses" | "Houses" | "Penthouses";
export type DevelopmentTag =
  | "Featured"
  | "New launch"
  | "Trending"
  | "Editor's pick"
  | "Final release";
export type AustralianState = "VIC" | "NSW" | "QLD" | "WA" | "SA";

export interface Development {
  id: string;
  slug: string;
  name: string;
  suburb: string | null;
  state: AustralianState | null;
  price_from: number | null;
  price_display: string | null;
  beds_min: number | null;
  beds_max: number | null;
  completion_quarter: string | null;
  type: DevelopmentType | null;
  developer_id: string | null;
  tag: DevelopmentTag | null;
  status: DevelopmentStatus | null;
  summary: string | null;
  lifestyle: string[] | null;
  architect: string | null;
  interiors: string | null;
  landscape: string | null;
  builder: string | null;
  levels: number | null;
  residence_count: number | null;
  lat: number | null;
  lng: number | null;
  hero_image_url?: string | null;
  brochure_url?: string | null;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  developer?: Developer;
  images?: DevelopmentImage[];
  floor_plans?: DevelopmentFloorPlan[];
}

export interface DevelopmentImage {
  id: string;
  development_id: string;
  url: string;
  caption: string | null;
  sort_order: number;
  is_hero: boolean;
}

export interface DevelopmentFloorPlan {
  id: string;
  development_id: string;
  plan_type: string | null;
  config: string | null;
  internal_sqm: number | null;
  price_from: number | null;
  image_url: string | null;
}

export interface DevelopmentFilters {
  suburb?: string;
  state?: AustralianState;
  price_min?: number;
  price_max?: number;
  beds_min?: number;
  type?: DevelopmentType;
  status?: DevelopmentStatus;
  sort?: "featured" | "price_asc" | "price_desc" | "newest";
  page?: number;
}

// Import Developer for the joined relation type (avoid circular — keep as interface extension)
import type { Developer } from "./developer";
