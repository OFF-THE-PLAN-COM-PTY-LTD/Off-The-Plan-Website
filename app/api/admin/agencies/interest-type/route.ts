import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";

/**
 * PATCH /api/admin/agencies/interest-type
 * Body: { agencyId: string, interestType: "Developer" | "Agent" | null }
 *
 * Sets profiles.interest_type on the auth user linked to this agency
 * (by email). Used by the per-row Role dropdown on /admin/agencies.
 *
 * interest_type lives on `profiles`, not `agencies` — the link is by
 * email since there's no FK between the two tables. We reuse the same
 * findAuthUserIdByEmail pattern the main agencies PATCH endpoint uses.
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

    const { data: agency, error: agencyErr } = await supabaseAdmin
      .from("agencies")
      .select("email")
      .eq("id", agencyId)
      .single();
    if (agencyErr || !agency?.email) {
      return NextResponse.json({ error: "Agency not found or has no email on file" }, { status: 404 });
    }

    const authUserId = await findAuthUserIdByEmail(agency.email);
    if (!authUserId) {
      return NextResponse.json(
        { error: "No auth user linked to this profile — cannot set role until they sign up." },
        { status: 409 },
      );
    }

    const { error: profErr } = await supabaseAdmin
      .from("profiles")
      .update({ interest_type: interestType })
      .eq("id", authUserId);
    if (profErr) {
      return NextResponse.json({ error: profErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, interestType });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
