import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

/**
 * Member-side opt-in for the public /developers directory.
 *
 * Tick the box on /portal/profile → POST here with { show: true } →
 * we either (a) create a `developers` row linked to this member's
 * profile + publish it, or (b) re-sync the existing linked row's
 * fields from the current profile + publish.
 *
 * Untick → POST { show: false } → set is_published=false on the
 * linked row (don't delete — keeps the slug stable if they re-opt-in).
 *
 * Only profiles with interest_type='Developer' can use this.
 */

const schema = z.object({ show: z.boolean() });

function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 60);
}

export async function POST(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const parsed = schema.safeParse(await req.json());
    if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });

    // Pull the profile so we can confirm role + sync its fields to the
    // directory entry. business_name etc. drive the public row.
    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("interest_type, business_name, abn, about, developer_logo_url, company_logo_url, company_state, state, website")
      .eq("id", user.id)
      .maybeSingle();

    if (!profile) return NextResponse.json({ error: "Profile not found" }, { status: 404 });
    if (profile.interest_type !== "Developer") {
      return NextResponse.json({ error: "Only developer-members can opt in to the directory." }, { status: 403 });
    }

    // Find existing linked row (if any).
    const { data: existing } = await supabaseAdmin
      .from("developers")
      .select("id, slug")
      .eq("profile_id", user.id)
      .maybeSingle();

    const synced = {
      name: (profile.business_name as string) || "Unnamed developer",
      description: (profile.about as string) || null,
      abn: (profile.abn as string) || null,
      logo_url: (profile.developer_logo_url as string) || (profile.company_logo_url as string) || null,
      website: (profile.website as string) || null,
      state: (profile.company_state as string) || (profile.state as string) || null,
    };

    if (!parsed.data.show) {
      // Opt-out path. If no row exists, nothing to do.
      if (existing) {
        const { error } = await supabaseAdmin
          .from("developers")
          .update({ is_published: false })
          .eq("id", existing.id);
        if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      }
      return NextResponse.json({ ok: true, optedIn: false });
    }

    // Opt-in path.
    if (existing) {
      const { error } = await supabaseAdmin
        .from("developers")
        .update({ ...synced, is_published: true })
        .eq("id", existing.id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
      return NextResponse.json({ ok: true, optedIn: true, id: existing.id });
    }

    // First-time create. Slugify business name; fall back + suffix on collision.
    const baseSlug = slugify(synced.name) || user.id.slice(0, 8);
    let slug = baseSlug;
    for (let attempt = 0; attempt < 6; attempt++) {
      const { error: insErr, data } = await supabaseAdmin
        .from("developers")
        .insert({ ...synced, slug, profile_id: user.id, is_published: true })
        .select("id")
        .single();
      if (!insErr) {
        return NextResponse.json({ ok: true, optedIn: true, id: data.id, slug });
      }
      // 23505 = unique_violation. Retry with a short suffix.
      if (insErr.code !== "23505") {
        return NextResponse.json({ error: insErr.message }, { status: 500 });
      }
      slug = `${baseSlug}-${user.id.slice(0, 4 + attempt)}`;
    }
    return NextResponse.json({ error: "Could not generate a unique slug after retries." }, { status: 500 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
