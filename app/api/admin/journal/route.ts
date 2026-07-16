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
  category: z.enum(["Editorial", "Market", "Interview", "Guide"]),
  hero_image_url: z.string().nullable().optional(),
  author: z.string().nullable().optional(),
  read_time_minutes: z.number().int().positive().nullable().optional(),
  published_at: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
  body_html: z.string().nullable().optional(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const { id: _id, ...data } = parsed.data;
    const { error } = await supabaseAdmin.from("journal_articles").insert(data);
    if (error) {
      console.error("Journal insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath("/");
    revalidatePath("/journal");
    revalidatePublicTables(["journal_articles"]);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const parsed = schema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const { id, ...data } = parsed.data;
    if (!id) {
      return NextResponse.json({ error: "Missing id" }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("journal_articles")
      .update(data)
      .eq("id", id);
    if (error) {
      console.error("Journal update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    revalidatePath("/");
    revalidatePath("/journal");
    revalidatePublicTables(["journal_articles"]);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
