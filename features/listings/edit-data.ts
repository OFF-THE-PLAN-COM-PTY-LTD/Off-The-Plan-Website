// Server-only: uses the service-role client. Never import from a
// "use client" file.
import { supabaseAdmin } from "@/lib/supabase/admin";

// Shapes match the props expected by the listing form.
export interface EditDeveloperOption {
  id: string;
  name: string;
}

export interface EditMemberOption {
  id: string;
  full_name: string | null;
  interest_type: string | null;
}

export interface EditGalleryImage {
  id: string;
  url: string;
  sort_order: number;
}

export interface EditFloorPlan {
  id: string;
  beds: string;
  bath: string;
  garage: string;
  internal_sqm: string;
  price_from: string;
  plan_type: string;
  config: string;
  image_url: string;
  lot_number: string;
  land_area_sqm: string;
  frontage_m: string;
  depth_m: string;
  house_size_sqm: string;
  land_size_sqm: string;
  floor_area_sqm: string;
  level: string;
  unit_suite_no: string;
  property_sub_type: string;
}

export interface EditAgent {
  id: string;
  name: string;
  email: string;
  mobile: string;
  photo_url: string;
}

export interface ListingEditData {
  // Raw developments row (untyped, as returned by supabase-js) — the form's
  // ListingData props are a subset of it.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  existing: Record<string, any> | null;
  developers: EditDeveloperOption[];
  members: EditMemberOption[];
  gallery: EditGalleryImage[];
  floorPlans: EditFloorPlan[];
  agents: EditAgent[];
}

const FLOOR_PLAN_SELECT =
  "id, beds, bath, garage, internal_sqm, price_from, plan_type, config, image_url, lot_number, land_area_sqm, frontage_m, depth_m, house_size_sqm, land_size_sqm, floor_area_sqm, level, unit_suite_no, property_sub_type";

/**
 * Loads everything the listing form needs for one listing. Shared by the
 * admin edit page (no owner filter, supports `isNew`) and the portal edit
 * page (pass `ownerUserId` so users can only load their own listings).
 */
export async function getListingEditData(
  id: string,
  opts: { isNew?: boolean; ownerUserId?: string } = {},
): Promise<ListingEditData> {
  const { isNew = false, ownerUserId } = opts;

  let devQuery = supabaseAdmin.from("developments").select("*").eq("id", id);
  if (ownerUserId) devQuery = devQuery.eq("owner_user_id", ownerUserId);

  const [developersResult, membersResult, devResult, galleryResult, floorPlanResult, agentsResult] =
    await Promise.all([
      supabaseAdmin.from("developers").select("id, name").order("name"),
      supabaseAdmin
        .from("profiles")
        .select("id, full_name, interest_type")
        .in("interest_type", ["Developer", "Agent"])
        .order("full_name"),
      isNew ? Promise.resolve({ data: null, error: null }) : devQuery.maybeSingle(),
      isNew
        ? Promise.resolve({ data: [], error: null })
        : supabaseAdmin
            .from("development_images")
            .select("id, url, sort_order")
            .eq("development_id", id)
            .order("sort_order"),
      isNew
        ? Promise.resolve({ data: [], error: null })
        : supabaseAdmin
            .from("development_floor_plans")
            .select(FLOOR_PLAN_SELECT)
            .eq("development_id", id)
            .order("id"),
      isNew
        ? Promise.resolve({ data: [], error: null })
        : supabaseAdmin
            .from("listing_agents")
            .select("id, name, email, mobile, photo_url, sort_order")
            .eq("development_id", id)
            .order("sort_order"),
    ]);

  if (membersResult.error) {
    console.error("Failed to load members:", membersResult.error.message);
  }

  const members: EditMemberOption[] = (membersResult.data ?? []).map((m) => ({
    id: m.id as string,
    full_name: m.full_name as string | null,
    interest_type: m.interest_type as string | null,
  }));

  const gallery: EditGalleryImage[] = (galleryResult.data ?? []).map((img) => ({
    id: img.id as string,
    url: img.url as string,
    sort_order: (img.sort_order as number) ?? 0,
  }));

  const floorPlans: EditFloorPlan[] = (floorPlanResult.data ?? []).map((fp) => ({
    id: fp.id as string,
    beds: fp.beds != null ? String(fp.beds) : "",
    bath: fp.bath != null ? String(fp.bath) : "",
    garage: fp.garage != null ? String(fp.garage) : "",
    internal_sqm: fp.internal_sqm != null ? String(fp.internal_sqm) : "",
    price_from: fp.price_from != null ? String(fp.price_from) : "",
    plan_type: (fp.plan_type as string) ?? "",
    config: (fp.config as string) ?? "",
    image_url: (fp.image_url as string) ?? "",
    lot_number: (fp.lot_number as string) ?? "",
    land_area_sqm: fp.land_area_sqm != null ? String(fp.land_area_sqm) : "",
    frontage_m: fp.frontage_m != null ? String(fp.frontage_m) : "",
    depth_m: fp.depth_m != null ? String(fp.depth_m) : "",
    house_size_sqm: fp.house_size_sqm != null ? String(fp.house_size_sqm) : "",
    land_size_sqm: fp.land_size_sqm != null ? String(fp.land_size_sqm) : "",
    floor_area_sqm: fp.floor_area_sqm != null ? String(fp.floor_area_sqm) : "",
    level: (fp.level as string) ?? "",
    unit_suite_no: (fp.unit_suite_no as string) ?? "",
    property_sub_type: (fp.property_sub_type as string) ?? "",
  }));

  const agents: EditAgent[] = (agentsResult.data ?? []).map((a) => ({
    id: a.id as string,
    name: (a.name as string) ?? "",
    email: (a.email as string) ?? "",
    mobile: (a.mobile as string) ?? "",
    photo_url: (a.photo_url as string) ?? "",
  }));

  return {
    existing: devResult.data ?? null,
    developers: (developersResult.data ?? []) as EditDeveloperOption[],
    members,
    gallery,
    floorPlans,
    agents,
  };
}
