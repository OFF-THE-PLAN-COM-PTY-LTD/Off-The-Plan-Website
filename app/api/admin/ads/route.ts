import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid().optional(),
  page: z.enum(["home", "listings", "resources", "news", "guides"]),
  position: z.enum(["top", "middle", "bottom", "right"]),
  ad_type: z.enum(["image", "adsense"]).optional(),
  desktop_image_url: z.string().nullable().optional(),
  mobile_image_url: z.string().nullable().optional(),
  web_link: z.string().nullable().optional(),
  adsense_code: z.string().nullable().optional(),
  is_active: z.boolean().optional(),
  sort_order: z.number().int().optional(),
});

function revalidateAll() {
  revalidatePath("/", "layout");
}

export async function GET() {
  const { data, error } = await supabaseAdmin
    .from("ads")
    .select("*")
    .order("page", { ascending: true })
    .order("position", { ascending: true })
    .order("created_at", { ascending: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json(data ?? []);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { id: _id, ...data } = parsed.data;
    const { data: row, error } = await supabaseAdmin
      .from("ads")
      .insert(data)
      .select()
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateAll();
    return NextResponse.json(row, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { id, ...fields } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { error } = await supabaseAdmin
      .from("ads")
      .update({ ...fields, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateAll();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { error } = await supabaseAdmin.from("ads").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidateAll();
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
