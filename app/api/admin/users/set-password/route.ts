import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";

/**
 * Sets / resets a member's auth password from the admin UI. Tim's request
 * (D6 / Q1 in his May 29 reply): during the migration he wants to give
 * each member a standard initial password (MM_NameLetters_YY format),
 * share it with them, and have them change it on first login.
 *
 * Security note: we do NOT store the plaintext anywhere — admin types it
 * once, we set it via supabaseAdmin.auth.admin.updateUserById, and the
 * value lives only in Postgres' bcrypted auth.users.encrypted_password.
 * Admin who needs to reshare can recompute the formula manually or set
 * a new one here.
 *
 * Why we look up by email: the agencies table doesn't carry a FK to
 * auth.users — it only stores the email. We page through users until
 * we find a match (small site; ~hundreds of users at most).
 */
export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = (body as { email?: unknown })?.email;
  const password = (body as { password?: unknown })?.password;

  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }
  if (typeof password !== "string" || password.length < 8) {
    return NextResponse.json({ error: "Password must be at least 8 characters" }, { status: 400 });
  }

  // Find the user by email. listUsers is paged (50 default); we walk it
  // until we hit the match or exhaust the list. For a site with thousands
  // of users this would want a proper index; for now linear scan is fine.
  let userId: string | null = null;
  const PER_PAGE = 200;
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({
      page,
      perPage: PER_PAGE,
    });
    if (error) {
      console.error("[set-password] listUsers failed:", error.message);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }
    const hit = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (hit) {
      userId = hit.id;
      break;
    }
    if (data.users.length < PER_PAGE) break; // last page
  }

  if (!userId) {
    return NextResponse.json({ error: "No user found with that email." }, { status: 404 });
  }

  const { error: updateError } = await supabaseAdmin.auth.admin.updateUserById(userId, {
    password,
  });
  if (updateError) {
    console.error("[set-password] updateUserById failed:", updateError.message);
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Audit log
  console.log(
    `[set-password] admin=${auth.user.email ?? auth.user.id} -> target=${email}`,
  );

  return NextResponse.json({ success: true });
}
