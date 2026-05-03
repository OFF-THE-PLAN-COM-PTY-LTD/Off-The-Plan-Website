import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { _method, id, ...fields } = body;

    const data = {
      name: fields.name,
      slug: fields.slug,
      suburb: fields.suburb ?? null,
      state: fields.state ?? null,
      price_display: fields.price_display ?? null,
      completion_quarter: fields.completion_quarter ?? null,
      beds_min: fields.beds_min ?? null,
      beds_max: fields.beds_max ?? null,
      summary: fields.summary ?? null,
      status: fields.status ?? "Selling now",
      is_published: fields.is_published ?? false,
      is_featured: fields.is_featured ?? false,
      hero_image_url: fields.hero_image_url ?? null,
      lat: fields.lat ?? null,
      lng: fields.lng ?? null,
    };

    if (!data.name || !data.slug) {
      return NextResponse.json({ error: "Name and slug are required." }, { status: 400 });
    }

    if (_method === "PATCH" && id) {
      const { error } = await supabaseAdmin.from("developments").update(data).eq("id", id);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    } else {
      const { error } = await supabaseAdmin.from("developments").insert(data);
      if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Invalidate cached pages so changes appear immediately
    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/map");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Development save error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    const { error } = await supabaseAdmin.from("developments").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    revalidatePath("/");
    revalidatePath("/search");
    revalidatePath("/map");

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Development delete error:", err);
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
