import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireMemberOrAdmin } from "@/lib/supabase/auth-guards";
import { revalidatePublicTables } from "@/lib/cache-tags";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function validEmailOrNull(value: unknown): { ok: true; value: string | null } | { ok: false } {
  if (value == null || value === "") return { ok: true, value: null };
  if (typeof value !== "string" || !EMAIL_RE.test(value)) return { ok: false };
  return { ok: true, value };
}

async function ownsListing(userId: string, developmentId: string) {
  const { data } = await supabaseAdmin
    .from("developments")
    .select("owner_user_id")
    .eq("id", developmentId)
    .single();
  return data?.owner_user_id === userId;
}

async function listingForAgent(agentId: string) {
  const { data } = await supabaseAdmin
    .from("listing_agents")
    .select("development_id")
    .eq("id", agentId)
    .single();
  return (data?.development_id as string | undefined) ?? null;
}

export async function POST(req: Request) {
  try {
    const auth = await requireMemberOrAdmin();
    if ("error" in auth) return auth.error;

    const { development_id, name, email, mobile, photo_url, sort_order } = await req.json();
    if (!development_id) {
      return NextResponse.json({ error: "Missing development_id" }, { status: 400 });
    }
    if (!auth.isAdmin && !(await ownsListing(auth.user.id, development_id))) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    const emailCheck = validEmailOrNull(email);
    if (!emailCheck.ok) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    const { data, error } = await supabaseAdmin
      .from("listing_agents")
      .insert({ development_id, name: name || null, email: emailCheck.value, mobile: mobile || null, photo_url: photo_url || null, sort_order: sort_order ?? 0 })
      .select("id")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePublicTables(["listing_agents"]);
    return NextResponse.json({ ok: true, id: data.id });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireMemberOrAdmin();
    if ("error" in auth) return auth.error;

    const { id, ...fields } = await req.json();
    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

    if (!auth.isAdmin) {
      const developmentId = await listingForAgent(id);
      if (!developmentId || !(await ownsListing(auth.user.id, developmentId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const emailCheck = validEmailOrNull(fields.email);
    if (!emailCheck.ok) {
      return NextResponse.json({ error: "Invalid email format" }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("listing_agents")
      .update({
        name: fields.name || null,
        email: emailCheck.value,
        mobile: fields.mobile || null,
        photo_url: fields.photo_url || null,
      })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePublicTables(["listing_agents"]);
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
      const developmentId = await listingForAgent(id);
      if (!developmentId || !(await ownsListing(auth.user.id, developmentId))) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
    }

    const { error } = await supabaseAdmin.from("listing_agents").delete().eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    revalidatePublicTables(["listing_agents"]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
