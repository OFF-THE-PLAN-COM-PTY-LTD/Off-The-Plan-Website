import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PUT(req: NextRequest, { params }: { params: { id: string } }) {
  const body = await req.json();
  const { title, link, description, desktop_image_url, mobile_image_url } = body;

  const { data, error } = await supabaseAdmin
    .from("homepage_banners")
    .update({ title, link, description, desktop_image_url, mobile_image_url })
    .eq("id", params.id)
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data);
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const { error } = await supabaseAdmin
    .from("homepage_banners")
    .delete()
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
