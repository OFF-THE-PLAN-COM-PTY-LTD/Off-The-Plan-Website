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
    // Project Overview – identity
    developer_id: fields.developer_id ?? null,
    owner_user_id: fields.owner_user_id ?? null,
    developer_website: fields.developer_website ?? null,
    listing_duration: fields.listing_duration ?? null,
    logo_url: fields.logo_url ?? null,
    residence_count: fields.residence_count ?? null,
    // Address
    street_address: fields.street_address ?? null,
    street_address_2: fields.street_address_2 ?? null,
    country: fields.country ?? null,
    state: fields.state ?? null,
    city: fields.city ?? null,
    postcode: fields.postcode ?? null,
    suburb: fields.suburb ?? null,
    location_description: fields.location_description ?? null,
    // Sale office
    sale_office_street: fields.sale_office_street ?? null,
    sale_office_street_2: fields.sale_office_street_2 ?? null,
    sale_office_country: fields.sale_office_country ?? null,
    sale_office_state: fields.sale_office_state ?? null,
    sale_office_city: fields.sale_office_city ?? null,
    sale_office_postcode: fields.sale_office_postcode ?? null,
    // Details
    display_suite_timing: fields.display_suite_timing ?? null,
    description: fields.description ?? null,
    summary: fields.summary ?? null,
    status: fields.status ?? "Selling now",
    is_published: fields.is_published ?? false,
    is_featured: fields.is_featured ?? false,
    lat: fields.lat ?? null,
    lng: fields.lng ?? null,
    // Pricing / dates
    price_from: fields.price_from ?? null,
    search_price_max: fields.search_price_max ?? null,
    price_display: fields.price_display ?? null,
    show_price_on_search: fields.show_price_on_search ?? true,
    promotional_banner: fields.promotional_banner ?? null,
    completion_quarter: fields.completion_quarter ?? null,
    configuration_label: fields.configuration_label ?? null,
    // Configuration
    beds_min: fields.beds_min ?? null,
    beds_max: fields.beds_max ?? null,
    baths_min: fields.baths_min ?? null,
    baths_max: fields.baths_max ?? null,
    cars_min: fields.cars_min ?? null,
    cars_max: fields.cars_max ?? null,
    levels: fields.levels ?? null,
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
    hero_alt_text: fields.hero_alt_text ?? null,
    feature_image_url: fields.feature_image_url ?? null,
    brochure_url: fields.brochure_url ?? null,
    video_url: fields.video_url ?? null,
    agent_logo_1: fields.agent_logo_1 ?? null,
    agent_logo_2: fields.agent_logo_2 ?? null,
    virtual_tour_url: fields.virtual_tour_url ?? null,
    floor_plan_upload_url: fields.floor_plan_upload_url ?? null,
    additional_video_url: fields.additional_video_url ?? null,
    price_list_url: fields.price_list_url ?? null,
    specifications_url: fields.specifications_url ?? null,
    // SEO
    seo_title: fields.seo_title ?? null,
    seo_description: fields.seo_description ?? null,
  };
}

async function syncFloorPlans(developmentId: string, floorPlans: unknown[]) {
  if (!Array.isArray(floorPlans)) return;
  await supabaseAdmin.from("development_floor_plans").delete().eq("development_id", developmentId);
  if (floorPlans.length === 0) return;
  const rows = (floorPlans as Record<string, unknown>[]).map((fp) => ({
    development_id: developmentId,
    beds: fp.beds ? Number(fp.beds) : null,
    bath: fp.bath ? Number(fp.bath) : null,
    garage: fp.garage ? Number(fp.garage) : null,
    internal_sqm: fp.internal_sqm ? Number(fp.internal_sqm) : null,
    price_from: fp.price_from ? Number(fp.price_from) : null,
    plan_type: fp.plan_type || null,
    config: fp.config || null,
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
