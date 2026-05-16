import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(req: Request) {
  try {
    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    // Validate portal_status if present
    if (fields.portal_status && !["active", "inactive"].includes(fields.portal_status)) {
      return NextResponse.json({ error: "Invalid portal_status" }, { status: 400 });
    }

    const allowed = [
      "portal_status",
      "first_name", "last_name", "email", "mobile",
      "personal_street_address", "personal_country", "personal_state", "personal_city", "personal_postcode",
      "org_name", "about", "org_email", "org_phone",
      "org_street_address", "org_street_address_2", "org_country", "org_state", "org_city", "org_postcode",
      "facebook_url", "twitter_url", "instagram_url", "linkedin_url", "pinterest_url", "youtube_url", "website_url",
      "profile_pic", "org_logo_url", "dev_logo_url",
    ];

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    for (const key of allowed) {
      if (key in fields) update[key] = fields[key] ?? null;
    }

    // Rebuild name from first/last if either changed
    if ("first_name" in fields || "last_name" in fields) {
      const { data: current } = await supabaseAdmin
        .from("agencies")
        .select("first_name, last_name")
        .eq("id", id)
        .single();
      const first = (fields.first_name ?? current?.first_name ?? "").trim();
      const last = (fields.last_name ?? current?.last_name ?? "").trim();
      update.name = `${first} ${last}`.trim() || null;
    }

    const { error } = await supabaseAdmin.from("agencies").update(update).eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
