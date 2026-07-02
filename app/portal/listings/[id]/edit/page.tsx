import { notFound, redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ListingForm } from "@/app/admin/listings/[id]/listing-form";

interface Props { params: { id: string } }

export default async function PortalListingEditPage({ params }: Props) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [devResult, galleryResult, floorPlanResult, agentsResult, developersResult, membersResult] = await Promise.all([
    supabaseAdmin
      .from("developments")
      .select("*")
      .eq("id", params.id)
      .eq("owner_user_id", user.id)
      .maybeSingle(),
    supabaseAdmin
      .from("development_images")
      .select("id, url, sort_order")
      .eq("development_id", params.id)
      .order("sort_order"),
    supabaseAdmin
      .from("development_floor_plans")
      .select("id, beds, bath, garage, internal_sqm, price_from, plan_type, config, image_url, lot_number, land_area_sqm, frontage_m, depth_m, house_size_sqm, land_size_sqm, floor_area_sqm, level, unit_suite_no, property_sub_type")
      .eq("development_id", params.id)
      .order("id"),
    supabaseAdmin
      .from("listing_agents")
      .select("id, name, email, mobile, photo_url, sort_order")
      .eq("development_id", params.id)
      .order("sort_order"),
    supabaseAdmin.from("developers").select("id, name").order("name"),
    supabaseAdmin
      .from("profiles")
      .select("id, full_name, interest_type")
      .in("interest_type", ["Developer", "Agent"])
      .order("full_name"),
  ]);

  // If listing not found or doesn't belong to this user, 404
  if (!devResult.data) notFound();

  // Empty drafts (created by the /portal/listings/new draft-first flow) carry
  // a placeholder name so the DB insert satisfies any NOT NULL constraint.
  // Show it as blank in the form so the user isn't editing over "Untitled listing".
  if ((devResult.data.name as string) === "Untitled listing") {
    devResult.data.name = "";
  }

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

  const members = (membersResult.data ?? []).map((m) => ({
    id: m.id as string,
    full_name: m.full_name as string | null,
    interest_type: m.interest_type as string | null,
  }));

  return (
    <ListingForm
      id={params.id}
      existing={devResult.data}
      developers={developersResult.data ?? []}
      members={members}
      gallery={gallery}
      floorPlans={floorPlans}
      agents={agents}
      isPortal
    />
  );
}
