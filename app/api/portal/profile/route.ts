import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { syncAccountFromProfile } from "@/lib/accounts/sync-account";
import { revalidatePublicTables } from "@/lib/cache-tags";

const ALLOWED_FIELDS = new Set([
  "first_name", "last_name", "phone",
  "street_address", "street_address_2", "country", "state", "city", "postcode",
  "business_name", "abn", "about",
  "company_email", "company_phone",
  "company_street", "company_street_2", "company_country", "company_state", "company_city", "company_postcode",
  "facebook", "instagram", "linkedin", "pinterest", "youtube", "website",
]);

// NOTE(api-standardization): intentionally NOT converted to withMemberOrAdmin.
// This route accepts ANY logged-in user (it only checks auth.getUser()), while
// the guard would 403 logged-in users without a Developer/Agent interest_type
// or admin flag. ALLOWED_FIELDS also stays manual: it accepts values of any
// type and coerces falsy ones to null ((v as string) || null), which a
// z.string() schema would reject. Revisit only with an explicit access-rule
// decision.
export async function PATCH(req: Request) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const update: Record<string, string | null> = {};
    for (const [k, v] of Object.entries(body)) {
      if (ALLOWED_FIELDS.has(k)) update[k] = (v as string) || null;
    }

    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "No valid fields" }, { status: 400 });
    }

    const { error } = await supabaseAdmin.from("profiles").update(update).eq("id", user.id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Dual-write: mirror the member's company details onto their linked account
    // so their public /developers entry updates from a single profile edit.
    try { await syncAccountFromProfile(user.id); } catch (e) { console.error("account sync (non-fatal):", e); }

    revalidatePublicTables(["accounts"]);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
