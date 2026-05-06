import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ListingForm } from "./listing-form";

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
      : supabaseAdmin.from("developments").select("*").eq("id", params.id).single(),
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
          .select("id, beds, bath, garage, internal_sqm, price_from, plan_type, config, image_url")
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
