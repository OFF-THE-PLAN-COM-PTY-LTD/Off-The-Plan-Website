import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireMemberOrAdmin } from "@/lib/supabase/auth-guards";
import { revalidatePublicTables } from "@/lib/cache-tags";

async function ownsListing(userId: string, developmentId: string) {
  const { data } = await supabaseAdmin
    .from("developments")
    .select("owner_user_id")
    .eq("id", developmentId)
    .single();
  return data?.owner_user_id === userId;
}

async function listingForImage(imageId: string) {
  const { data } = await supabaseAdmin
    .from("development_images")
    .select("development_id")
    .eq("id", imageId)
    .single();
  return (data?.development_id as string | undefined) ?? null;
}

export async function POST(req: Request) {
  try {
    const auth = await requireMemberOrAdmin();
    if ("error" in auth) return auth.error;

    const { development_id, url, sort_order } = await req.json();
    if (!development_id || !url) {
      return NextResponse.json({ error: "Missing development_id or url" }, { status: 400 });
    }
    if (!auth.isAdmin && !(await ownsListing(auth.user.id, development_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const { data, error } = await supabaseAdmin
      .from("development_images")
      .insert({ development_id, url, sort_order: sort_order ?? 0, is_hero: false })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/listings", "layout");
    revalidatePublicTables(["development_images"]);
    return NextResponse.json({ ok: true, id: data.id });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireMemberOrAdmin();
    if ("error" in auth) return auth.error;

    const { updates } = await req.json() as { updates: { id: string; sort_order: number }[] };
    if (!Array.isArray(updates)) return NextResponse.json({ error: "Invalid payload" }, { status: 400 });

    if (!auth.isAdmin) {
      const developmentIds = await Promise.all(updates.map((u) => listingForImage(u.id)));
      const unique = Array.from(new Set(developmentIds.filter((d): d is string => !!d)));
      for (const devId of unique) {
        if (!(await ownsListing(auth.user.id, devId))) {
          return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
      }
    }

    await Promise.all(
      updates.map(({ id, sort_order }) =>
        supabaseAdmin.from("development_images").update({ sort_order }).eq("id", id)
      )
    );
    revalidatePath("/listings", "layout");
    revalidatePublicTables(["development_images"]);
    return NextResponse.json({ ok: true });
  } catch {
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
      const developmentId = await listingForImage(id);
      if (!developmentId || !(await ownsListing(auth.user.id, developmentId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin.from("development_images").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePath("/listings", "layout");
    revalidatePublicTables(["development_images"]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
