import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";

/**
 * PATCH /api/admin/agencies/interest-type
 * Body: { agencyId: string, interestType: "Developer" | "Agent" | null }
 *
 * Sets the Developer/Agent classification for an agency. Used by the per-row
 * Role dropdown on /admin/agencies.
 *
 * The value is written to `agencies.interest_type` — the agency row's own
 * classification — so an admin can label ANY agency, including migrated /
 * directory-only rows that have no login yet. When an auth user IS linked
 * (by email — there's no FK between the tables), we also mirror the value
 * onto `profiles.interest_type`, which is what gates the member portal
 * (auth-guards / middleware / portal layout). No account yet just means the
 * agency row holds the classification until they sign up.
 */

const VALID_INTEREST_TYPES = new Set(["Developer", "Agent"]);

async function findAuthUserIdByEmail(email: string): Promise<string | null> {
  const target = email.toLowerCase();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) return null;
    const found = data.users.find((u) => u.email?.toLowerCase() === target);
    if (found) return found.id;
    if (data.users.length < 200) break;
  }
  return null;
}

export async function PATCH(req: Request) {
  try {
    const auth = await requireAdmin();
    if ("error" in auth) return auth.error;

    const body = await req.json();
    const agencyId = body?.agencyId as string | undefined;
    const rawInterestType = body?.interestType as string | null | undefined;
    if (!agencyId) return NextResponse.json({ error: "Missing agencyId" }, { status: 400 });

    // null / empty string clears the field; any other value must be in the allowlist.
    const interestType =
      rawInterestType == null || rawInterestType === ""
        ? null
        : VALID_INTEREST_TYPES.has(rawInterestType)
        ? rawInterestType
        : undefined;
    if (interestType === undefined) {
      return NextResponse.json({ error: "Invalid interestType" }, { status: 400 });
    }

    // `agencyId` is now the accounts.id (the admin table reads accounts).
    const { data: account, error: accErr } = await supabaseAdmin
      .from("accounts")
      .select("id, email, user_id, portal_status, archived")
      .eq("id", agencyId)
      .single();
    if (accErr || !account) {
      return NextResponse.json({ error: "Account not found" }, { status: 404 });
    }

    // Classify the account, and re-derive directory visibility: an active,
    // non-archived Developer shows on /developers; anything else is hidden.
    const isPublished =
      interestType === "Developer" && account.portal_status === "active" && account.archived !== true;
    const { error: updErr } = await supabaseAdmin
      .from("accounts")
      .update({ type: interestType, is_published: isPublished })
      .eq("id", account.id);
    if (updErr) {
      return NextResponse.json({ error: updErr.message }, { status: 500 });
    }

    // Mirror onto the linked profile so the member portal gate reflects the
    // role (profiles.interest_type gates auth-guards / middleware / portal).
    let linkedProfile = false;
    const authUserId =
      (account.user_id as string | null) ??
      (account.email ? await findAuthUserIdByEmail(account.email as string) : null);
    if (authUserId) {
      const { error: profErr } = await supabaseAdmin
        .from("profiles")
        .update({ interest_type: interestType })
        .eq("id", authUserId);
      if (profErr) {
        return NextResponse.json({ error: profErr.message }, { status: 500 });
      }
      linkedProfile = true;
    }

    return NextResponse.json({ ok: true, interestType, linkedProfile });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
