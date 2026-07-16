import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";
import { revalidatePublicTables } from "@/lib/cache-tags";
import { z } from "zod";

const schema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().min(1),
  slug: z.string().min(1),
  category: z.enum(["News", "Guides"]).optional(),
  subtitle: z.string().nullable().optional(),
  hero_image_url: z.string().nullable().optional(),
  list_page_image_url: z.string().nullable().optional(),
  article_image_one: z.string().nullable().optional(),
  article_image_two: z.string().nullable().optional(),
  body_html: z.string().nullable().optional(),
  published_at: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
  read_time_minutes: z.number().int().positive().nullable().optional(),
  meta_title: z.string().nullable().optional(),
  meta_content: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    const { id: _id, category, ...data } = parsed.data;
    const { error } = await supabaseAdmin
      .from("journal_articles")
      .insert({ ...data, category: category ?? "News", author: null });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/news");
    revalidatePath("/guides");
    revalidatePublicTables(["journal_articles"]);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

const ALLOWED_PATCH_FIELDS = new Set([
  "title", "slug", "subtitle", "category",
  "hero_image_url", "list_page_image_url", "article_image_one", "article_image_two",
  "body_html", "published_at", "is_published",
  "read_time_minutes", "meta_title", "meta_content",
]);

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const { id, ...raw } = body;
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const fields: Record<string, unknown> = {};
    for (const k of Object.keys(raw)) {
      if (ALLOWED_PATCH_FIELDS.has(k)) fields[k] = raw[k];
    }
    if (Object.keys(fields).length === 0) {
      return NextResponse.json({ error: "No editable fields provided" }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("journal_articles")
      .update(fields)
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/news");
    revalidatePath("/guides");
    revalidatePublicTables(["journal_articles"]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const { id } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
    const { error } = await supabaseAdmin
      .from("journal_articles")
      .delete()
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/news");
    revalidatePath("/guides");
    revalidatePublicTables(["journal_articles"]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
