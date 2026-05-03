import { notFound } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ListingForm } from "./listing-form";

interface Props { params: { id: string } }

export default async function AdminListingEditPage({ params }: Props) {
  const isNew = params.id === "new";

  const [developersResult, devResult, galleryResult, floorPlanResult] = await Promise.all([
    supabaseAdmin.from("developers").select("id, name").order("name"),
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
          .select("id, plan_type, config, internal_sqm, price_from, image_url")
          .eq("development_id", params.id)
          .order("id"),
  ]);

  if (!isNew && !devResult.data) notFound();

  const gallery = (galleryResult.data ?? []).map((img) => ({
    id: img.id as string,
    url: img.url as string,
    sort_order: (img.sort_order as number) ?? 0,
  }));

  const floorPlans = (floorPlanResult.data ?? []).map((fp) => ({
    id: fp.id as string,
    plan_type: (fp.plan_type as string) ?? "",
    config: (fp.config as string) ?? "",
    internal_sqm: fp.internal_sqm != null ? String(fp.internal_sqm) : "",
    price_from: fp.price_from != null ? String(fp.price_from) : "",
    image_url: (fp.image_url as string) ?? "",
  }));

  return (
    <ListingForm
      id={params.id}
      existing={devResult.data ?? undefined}
      developers={developersResult.data ?? []}
      gallery={gallery}
      floorPlans={floorPlans}
    />
  );
}
