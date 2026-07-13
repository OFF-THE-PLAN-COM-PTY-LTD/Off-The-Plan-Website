import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireMemberOrAdmin } from "@/lib/supabase/auth-guards";

function slugify(input: string) {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string, excludeId?: string) {
  if (!base) base = "listing";
  let candidate = base;
  let n = 2;
  while (true) {
    const q = supabaseAdmin.from("developments").select("id").eq("slug", candidate).limit(1);
    const { data } = await q;
    const taken = (data ?? []).some((row) => row.id !== excludeId);
    if (!taken) return candidate;
    candidate = `${base}-${n++}`;
    if (n > 200) return `${base}-${Date.now()}`;
  }
}

async function getListingOwner(id: string) {
  const { data } = await supabaseAdmin
    .from("developments")
    .select("owner_user_id")
    .eq("id", id)
    .single();
  return (data?.owner_user_id as string | null | undefined) ?? null;
}

/**
 * Derive developments.account_id from whichever assignment field is set, so a
 * new/edited listing links to the consolidated account that drives /developers.
 * Priority: explicit developer → owning member → agency.
 */
async function resolveAccountId(fields: Record<string, unknown>): Promise<string | null> {
  const tryLookup = async (col: string, val: unknown) => {
    if (!val) return null;
    const { data } = await supabaseAdmin.from("accounts").select("id").eq(col, val as string).maybeSingle();
    return (data?.id as string | undefined) ?? null;
  };
  return (
    (await tryLookup("legacy_developer_id", fields.developer_id)) ??
    (await tryLookup("user_id", fields.owner_user_id)) ??
    (await tryLookup("legacy_agency_id", (fields as { agency_id?: unknown }).agency_id)) ??
    null
  );
}

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
    portal_developer_name: fields.portal_developer_name ?? null,
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
    description_html: fields.description_html ?? null,
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
    // Mini stocklist — capped at 20 rows per Tim's spec (25.05.26).
    // Stored as jsonb so each cell can carry the original free-text
    // (e.g. "Contact Agent", "Fr. $660,000").
    mini_stocklist: Array.isArray(fields.mini_stocklist)
      ? (fields.mini_stocklist as unknown[]).slice(0, 20)
      : [],
  };
}

async function syncFloorPlans(developmentId: string, floorPlans: unknown[]): Promise<string | null> {
  if (!Array.isArray(floorPlans)) return null;
  console.log(`[syncFloorPlans] development_id=${developmentId}, incoming rows=${floorPlans.length}`);
  const { error: delErr } = await supabaseAdmin
    .from("development_floor_plans")
    .delete()
    .eq("development_id", developmentId);
  if (delErr) {
    console.error(`[syncFloorPlans] DELETE failed:`, delErr);
    return `Failed to clear existing configurations: ${delErr.message}`;
  }
  if (floorPlans.length === 0) return null;
  const rows = (floorPlans as Record<string, unknown>[]).map((fp) => ({
    development_id: developmentId,
    // beds is stored as text so it can hold "1+S" / "3+S" etc. Preserve
    // whatever the admin typed rather than coercing to a number and losing
    // the "+S" suffix.
    beds: fp.beds ? String(fp.beds).trim() : null,
    bath: fp.bath ? Number(fp.bath) : null,
    garage: fp.garage ? Number(fp.garage) : null,
    internal_sqm: fp.internal_sqm ? Number(fp.internal_sqm) : null,
    price_from: fp.price_from ? Number(fp.price_from) : null,
    plan_type: fp.plan_type || null,
    config: fp.config || null,
    image_url: fp.image_url || null,
    lot_number: fp.lot_number || null,
    land_area_sqm: fp.land_area_sqm ? Number(fp.land_area_sqm) : null,
    frontage_m: fp.frontage_m ? Number(fp.frontage_m) : null,
    depth_m: fp.depth_m ? Number(fp.depth_m) : null,
    house_size_sqm: fp.house_size_sqm ? Number(fp.house_size_sqm) : null,
    land_size_sqm: fp.land_size_sqm ? Number(fp.land_size_sqm) : null,
    floor_area_sqm: fp.floor_area_sqm ? Number(fp.floor_area_sqm) : null,
    level: fp.level || null,
    unit_suite_no: fp.unit_suite_no || null,
    property_sub_type: fp.property_sub_type || null,
  }));
  console.log(`[syncFloorPlans] first row:`, JSON.stringify(rows[0]));
  const { error: insErr } = await supabaseAdmin
    .from("development_floor_plans")
    .insert(rows);
  if (insErr) {
    console.error(`[syncFloorPlans] INSERT failed:`, insErr);
    return `Failed to save configurations: ${insErr.message}`;
  }
  console.log(`[syncFloorPlans] inserted ${rows.length} rows successfully`);
  return null;
}

export async function POST(req: Request) {
  try {
    const auth = await requireMemberOrAdmin();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const { _method, id, floor_plans, ...fields } = body;

    let data = buildListingData(fields) as Record<string, unknown>;

    if (!data.name) {
      return NextResponse.json({ error: "Project name is required." }, { status: 400 });
    }

    const isInsert = !(_method === "PATCH" && id);

    // Member INSERTs require minimum viable data so broken listings don't reach
    // the public pages. Admin INSERTs can save partial drafts.
    if (!auth.isAdmin && isInsert) {
      if (!data.suburb || !data.state) {
        return NextResponse.json(
          { error: "Suburb and state are required." },
          { status: 400 },
        );
      }
    }

    // SECURITY: strip admin-only fields from member submissions. The portal UI
    // hides these, but the API must also enforce — otherwise a member could
    // POST is_published / is_featured / owner_user_id via curl/devtools and
    // escalate their own listing.
    if (!auth.isAdmin) {
      data = filterFields(data, MEMBER_ALLOWED_FIELDS);
      // Always pin ownership to the requesting member.
      data.owner_user_id = auth.user.id;
      // New member listings always start as unpublished drafts awaiting admin
      // approval. Defence-in-depth: even if a column default changes, members
      // can never go live on insert.
      if (isInsert) {
        data.is_published = false;
        data.is_featured = false;
      }
    }

    // Link to the consolidated account (drives /developers). Only set when we
    // can resolve one, so unrelated edits never null an existing link.
    const resolvedAccountId = await resolveAccountId(data);
    if (resolvedAccountId) data.account_id = resolvedAccountId;

    if (_method === "PATCH" && id) {
      if (!auth.isAdmin) {
        const owner = await getListingOwner(id);
        if (owner !== auth.user.id) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
      // Slug: keep existing if not provided, else dedupe.
      if (!data.slug) {
        delete data.slug;
      } else {
        data.slug = await uniqueSlug(slugify(String(data.slug)), id);
      }
      const { error } = await supabaseAdmin.from("developments").update(data).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      const fpErr = await syncFloorPlans(id, floor_plans ?? []);
      if (fpErr) return NextResponse.json({ error: fpErr }, { status: 500 });
    } else {
      // INSERT — generate slug if not supplied (portal members never set one).
      const baseSlug = data.slug ? slugify(String(data.slug)) : slugify(String(data.name));
      data.slug = await uniqueSlug(baseSlug);

      const { data: inserted, error } = await supabaseAdmin
        .from("developments")
        .insert(data)
        .select("id")
        .single();
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      if (inserted && floor_plans?.length) {
        const fpErr = await syncFloorPlans(inserted.id, floor_plans);
        if (fpErr) return NextResponse.json({ error: fpErr }, { status: 500 });
      }
    }

    revalidateAll();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Listing save error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

// Columns a member is allowed to edit on their own listing via PATCH.
// - "slug" is intentionally excluded: slugs are generated server-side on
//   INSERT and locked thereafter to prevent SEO squatting / link breakage.
// - "status" IS allowed so members can self-archive their own draft listings.
// - "is_published" / "is_featured" are admin-only — members can never put
//   listings live without admin approval (handover decision 2026-05-24).
const MEMBER_ALLOWED_FIELDS = new Set<string>([
  "type", "tag", "tier",
  "developer_id", "portal_developer_name", "developer_website",
  "listing_duration", "logo_url", "residence_count",
  "street_address", "street_address_2", "country", "state", "city",
  "postcode", "suburb", "location_description",
  "sale_office_street", "sale_office_street_2",
  "sale_office_country", "sale_office_state", "sale_office_city", "sale_office_postcode",
  "display_suite_timing", "description", "description_html", "summary", "lat", "lng",
  "price_from", "search_price_max", "price_display", "show_price_on_search",
  "promotional_banner", "completion_quarter", "configuration_label",
  "beds_min", "beds_max", "baths_min", "baths_max", "cars_min", "cars_max",
  "levels", "internal_sqm_min", "internal_sqm_max", "land_size_min", "land_size_max",
  "lifestyle", "features", "architect", "interiors", "landscape", "builder",
  "nearby_amenities",
  "agent_name", "agent_phone", "agent_email", "agent_agency",
  "hero_image_url", "hero_alt_text", "feature_image_url",
  "brochure_url", "video_url", "agent_logo_1", "agent_logo_2",
  "virtual_tour_url", "floor_plan_upload_url", "additional_video_url",
  "price_list_url", "specifications_url",
  "seo_title", "seo_description",
  "name", "status",
  "mini_stocklist",
]);

const ADMIN_EXTRA_FIELDS = ["slug", "is_published", "is_featured", "owner_user_id", "agency_id"];
const ADMIN_ALLOWED_FIELDS = new Set<string>(
  Array.from(MEMBER_ALLOWED_FIELDS).concat(ADMIN_EXTRA_FIELDS),
);

function filterFields(fields: Record<string, unknown>, allow: Set<string>) {
  const out: Record<string, unknown> = {};
  for (const k of Object.keys(fields)) {
    if (allow.has(k)) out[k] = fields[k];
  }
  return out;
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireMemberOrAdmin();
    if ("error" in auth) return auth.error;

    const { id, ...raw } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (!auth.isAdmin) {
      const owner = await getListingOwner(id);
      if (owner !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const fields = filterFields(
      raw as Record<string, unknown>,
      auth.isAdmin ? ADMIN_ALLOWED_FIELDS : MEMBER_ALLOWED_FIELDS,
    );

    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }

    // Re-link to the consolidated account if the assignment changed.
    if ("developer_id" in fields || "owner_user_id" in fields || "agency_id" in fields) {
      const acctId = await resolveAccountId(fields);
      if (acctId) fields.account_id = acctId;
    }

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
    const auth = await requireMemberOrAdmin();
    if ("error" in auth) return auth.error;

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    if (!auth.isAdmin) {
      const owner = await getListingOwner(id);
      if (owner !== auth.user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }
    const { error } = await supabaseAdmin.from("developments").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateAll();
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Listing delete error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
