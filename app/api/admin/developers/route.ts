import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireMemberOrAdmin } from "@/lib/supabase/auth-guards";
import { z } from "zod";

/**
 * CRUD for the developers directory, backed by the consolidated `accounts`
 * table (type='Developer'). Portal members keeping access to this route is
 * intentional (product decision, 2026-07-14) — so we authenticate with
 * requireMemberOrAdmin rather than requireAdmin.
 *
 * BUT authentication is not authorization: a member may reach the route, yet
 * must only touch their OWN linked account (accounts.user_id === their user
 * id). Admins retain full CRUD over every developer record. Without this
 * per-object scoping any member could PATCH/DELETE any developer's directory
 * entry by supplying its id (BOLA). Non-admins are pinned to self via
 * requireOwnAccount below.
 */

/**
 * For a non-admin caller, ensure the target account row exists AND is linked
 * to their own user id. Returns null when the caller owns it (proceed) or a
 * 403/404 NextResponse to return otherwise. Admins always get null (bypass).
 */
async function requireOwnAccount(
  accountId: string,
  auth: { isAdmin: boolean; user: { id: string } },
): Promise<NextResponse | null> {
  if (auth.isAdmin) return null;
  const { data } = await supabaseAdmin
    .from("accounts")
    .select("user_id")
    .eq("id", accountId)
    .maybeSingle();
  if (!data) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  if ((data.user_id as string | null) !== auth.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  return null;
}

const upsertSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  description: z.string().nullable().optional(),
  logo_url: z.string().nullable().optional(),
  website: z.string().nullable().optional(),
  abn: z.string().nullable().optional(),
  state: z.string().nullable().optional(),
  suburb: z.string().nullable().optional(),
  company_email: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  facebook: z.string().nullable().optional(),
  instagram: z.string().nullable().optional(),
  linkedin: z.string().nullable().optional(),
  pinterest: z.string().nullable().optional(),
  youtube: z.string().nullable().optional(),
  is_published: z.boolean().optional(),
  profile_id: z.string().uuid().nullable().optional(),
});

/**
 * Map the developer-form payload onto `accounts` columns. The form still speaks
 * the legacy shape: `suburb` → accounts.city (no dedicated suburb column) and
 * `profile_id` (the linked login) → accounts.user_id. Only keys present in the
 * payload are mapped, so PATCH stays a partial update.
 */
function toAccountRow(data: Record<string, unknown>): Record<string, unknown> {
  const { suburb, profile_id, ...rest } = data;
  const row: Record<string, unknown> = { ...rest };
  if ("suburb" in data) row.city = suburb ?? null;
  if ("profile_id" in data) row.user_id = profile_id ?? null;
  return row;
}

const patchSchema = upsertSchema.partial().extend({
  id: z.string().uuid(),
});

const deleteSchema = z.object({
  id: z.string().uuid(),
});

export async function POST(req: Request) {
  try {
    const auth = await requireMemberOrAdmin();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const parsed = upsertSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.flatten() }, { status: 400 });
    }
    // Non-admins can only create their own directory record: pin user_id to
    // themselves and ignore any client-supplied profile_id/user_id.
    const row = toAccountRow(parsed.data);
    if (!auth.isAdmin) {
      row.user_id = auth.user.id;
    }
    const { error, data } = await supabaseAdmin
      .from("accounts")
      .insert({ ...row, type: "Developer" })
      .select()
      .single();
    if (error) {
      console.error("Developer insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ developer: data }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireMemberOrAdmin();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const parsed = patchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", issues: parsed.error.flatten() }, { status: 400 });
    }
    const { id, ...updates } = parsed.data;
    const denied = await requireOwnAccount(id, auth);
    if (denied) return denied;
    // Non-admins must not be able to re-link a record to another login.
    if (!auth.isAdmin) {
      delete (updates as Record<string, unknown>).profile_id;
    }
    const { error, data } = await supabaseAdmin
      .from("accounts")
      .update(toAccountRow(updates))
      .eq("id", id)
      .select()
      .single();
    if (error) {
      console.error("Developer update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ developer: data });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const auth = await requireMemberOrAdmin();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const parsed = deleteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }
    const denied = await requireOwnAccount(parsed.data.id, auth);
    if (denied) return denied;
    // Deletes the consolidated account row. Any developments.account_id pointing
    // here is cleared by the account_id FK's ON DELETE SET NULL behaviour.
    const { error } = await supabaseAdmin
      .from("accounts")
      .delete()
      .eq("id", parsed.data.id);
    if (error) {
      console.error("Developer delete error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
