import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ListingForm } from "./listing-form";

// Bypass Next.js's App Router cache for this admin edit page. Without this,
// navigating away and back within the router-cache TTL (~30s) serves the
// stale snapshot — mini-stocklist / floor-plan edits appear to "not
// reflect" until a hard refresh, even though the DB is already updated
// and the public listing page shows the new values.
export const dynamic = "force-dynamic";

interface Props { params: { id: string } }

export default async function AdminListingEditPage({ params }: Props) {
  const isNew = params.id === "new";

  const [developersResult, membersResult, devResult, galleryResult, floorPlanResult, agentsResult] = await Promise.all([
    supabaseAdmin.from("developers").select("id, name").order("name"),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, interest_type")
      .in("interest_type", ["Developer", "Agent"])
      .order("full_name"),
    isNew
      ? Promise.resolve({ data: null, error: null })
      : supabaseAdmin.from("developments").select("*").eq("id", params.id).maybeSingle(),
    isNew
      ? Promise.resolve({ data: [], error: null })
      : supabaseAdmin
          .from("development_images")
          .select("id, url, sort_order")
          .eq("development_id", params.id)
          .order("sort_order"),
    isNew
      ? Promise.resolve({ data: [], error: null })
      : supabaseAdmin
          .from("development_floor_plans")
          .select("id, beds, bath, garage, internal_sqm, price_from, plan_type, config, image_url, lot_number, land_area_sqm, frontage_m, depth_m, house_size_sqm, land_size_sqm, floor_area_sqm, level, unit_suite_no, property_sub_type")
          .eq("development_id", params.id)
          .order("id"),
    isNew
      ? Promise.resolve({ data: [], error: null })
      : supabaseAdmin
          .from("listing_agents")
          .select("id, name, email, mobile, photo_url, sort_order")
          .eq("development_id", params.id)
          .order("sort_order"),
  ]);

  if (!isNew && !devResult.data) notFound();

  if (membersResult.error) {
    console.error("Failed to load members:", membersResult.error.message);
  }

  const members = (membersResult.data ?? []).map((m) => ({
    id: m.id as string,
    full_name: m.full_name as string | null,
    interest_type: m.interest_type as string | null,
  }));

  const gallery = (galleryResult.data ?? []).map((img) => ({
    id: img.id as string,
    url: img.url as string,
    sort_order: (img.sort_order as number) ?? 0,
  }));

  const floorPlans = (floorPlanResult.data ?? []).map((fp) => ({
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

  const agents = (agentsResult.data ?? []).map((a) => ({
    id: a.id as string,
    name: (a.name as string) ?? "",
    email: (a.email as string) ?? "",
    mobile: (a.mobile as string) ?? "",
    photo_url: (a.photo_url as string) ?? "",
  }));

  return (
    <ListingForm
      id={params.id}
      existing={devResult.data ?? undefined}
      developers={developersResult.data ?? []}
      members={members}
      gallery={gallery}
      floorPlans={floorPlans}
      agents={agents}
    />
  );
}
