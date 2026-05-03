import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

function revalidateAll() {
  revalidatePath("/");
  revalidatePath("/search");
  revalidatePath("/map");
  revalidatePath("/listings", "layout");
  revalidatePath("/admin/listings");
}

function buildListingData(fields: Record<string, unknown>) {
  return {
    name: fields.name,
    slug: fields.slug,
    // Category
    type: fields.type ?? null,
    tag: fields.tag ?? null,
    tier: fields.tier ?? null,
    // Project Overview
    developer_id: fields.developer_id ?? null,
    suburb: fields.suburb ?? null,
    state: fields.state ?? null,
    status: fields.status ?? "Selling now",
    summary: fields.summary ?? null,
    is_published: fields.is_published ?? false,
    is_featured: fields.is_featured ?? false,
    lat: fields.lat ?? null,
    lng: fields.lng ?? null,
    // Configuration
    beds_min: fields.beds_min ?? null,
    beds_max: fields.beds_max ?? null,
    baths_min: fields.baths_min ?? null,
    baths_max: fields.baths_max ?? null,
    cars_min: fields.cars_min ?? null,
    cars_max: fields.cars_max ?? null,
    price_display: fields.price_display ?? null,
    price_from: fields.price_from ?? null,
    completion_quarter: fields.completion_quarter ?? null,
    levels: fields.levels ?? null,
    residence_count: fields.residence_count ?? null,
    internal_sqm_min: fields.internal_sqm_min ?? null,
    internal_sqm_max: fields.internal_sqm_max ?? null,
    land_size_min: fields.land_size_min ?? null,
    land_size_max: fields.land_size_max ?? null,
    // Features
    lifestyle: fields.lifestyle ?? null,
    features: fields.features ?? null,
    architect: fields.architect ?? null,
    interiors: fields.interiors ?? null,
    landscape: fields.landscape ?? null,
    builder: fields.builder ?? null,
    // Amenities
    nearby_amenities: fields.nearby_amenities ?? null,
    // Agent
    agent_name: fields.agent_name ?? null,
    agent_phone: fields.agent_phone ?? null,
    agent_email: fields.agent_email ?? null,
    agent_agency: fields.agent_agency ?? null,
    // Uploads
    hero_image_url: fields.hero_image_url ?? null,
    brochure_url: fields.brochure_url ?? null,
    video_url: fields.video_url ?? null,
    virtual_tour_url: fields.virtual_tour_url ?? null,
    // SEO
    seo_title: fields.seo_title ?? null,
    seo_description: fields.seo_description ?? null,
  };
}

async function syncFloorPlans(developmentId: string, floorPlans: unknown[]) {
  if (!Array.isArray(floorPlans)) return;
  await supabaseAdmin.from("development_floor_plans").delete().eq("development_id", developmentId);
  if (floorPlans.length === 0) return;
  const rows = floorPlans.map((fp: Record<string, unknown>) => ({
    development_id: developmentId,
    plan_type: fp.plan_type || null,
    config: fp.config || null,
    internal_sqm: fp.internal_sqm ? Number(fp.internal_sqm) : null,
    price_from: fp.price_from ? Number(fp.price_from) : null,
    image_url: fp.image_url || null,
  }));
  await supabaseAdmin.from("development_floor_plans").insert(rows);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { _method, id, floor_plans, ...fields } = body;

    const data = buildListingData(fields);

    if (!data.name || !data.slug) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
    }

    if (_method === "PATCH" && id) {
      const { error } = await supabaseAdmin.from("developments").update(data).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      await syncFloorPlans(id, floor_plans ?? []);
    } else {
      const { data: inserted, error } = await supabaseAdmin
        .from("developments")
        .insert(data)
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (inserted && floor_plans?.length) {
        await syncFloorPlans(inserted.id, floor_plans);
      }
    }

    revalidateAll();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Listing save error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { error } = await supabaseAdmin.from("developments").update(fields).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateAll();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Listing patch error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { error } = await supabaseAdmin.from("developments").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateAll();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Listing delete error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
