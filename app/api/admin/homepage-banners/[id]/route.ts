import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";
import { revalidatePublicTables } from "@/lib/cache-tags";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
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
  } = body;

  const { data, error } = await supabaseAdmin
    .from("homepage_banners")
    .update({
      title,
      link,
      description,
      desktop_image_url,
      mobile_image_url,
      video_url: video_url || null,
      linked_development_id: linked_development_id || null,
    })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePublicTables(["homepage_banners"]);
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { error } = await supabaseAdmin
    .from("homepage_banners")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  revalidatePublicTables(["homepage_banners"]);
  return NextResponse.json({ ok: true });
}
