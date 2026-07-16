import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";
import { revalidatePublicTables } from "@/lib/cache-tags";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { data, error } = await supabaseAdmin
    .from("homepage_banners")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const body = await req.json();
  const {
    title,
    link,
    description,
    desktop_image_url,
    mobile_image_url,
    video_url,
    linked_development_id,
    sort_order,
  } = body;

  const { data, error } = await supabaseAdmin
    .from("homepage_banners")
    .insert({
      title,
      link,
      description,
      desktop_image_url,
      mobile_image_url,
      video_url: video_url || null,
      linked_development_id: linked_development_id || null,
      sort_order: sort_order ?? 0,
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePublicTables(["homepage_banners"]);
  return NextResponse.json(data);
}
