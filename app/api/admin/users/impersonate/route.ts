import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";

/**
 * Generates a one-time magic-link sign-in URL for any user, so a master
 * admin can "sign in as" a member to view their dashboard. Tim's
 * approved Q8 / E1 ask from the May 29 reply.
 *
 * Why magic link rather than session-injection:
 *  - We don't have to store or read user passwords (keeps E1 secure)
 *  - The link expires after one use
 *  - No special cookie surgery on the server
 *
 * Caller (admin UI) is expected to open the returned link in a new tab.
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
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
  });

  if (error) {
    console.error("[impersonate] generateLink failed:", error.message);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Audit log: leaves a trail of who impersonated whom, which is the
  // minimum diligence for a feature like this even though the user opted
  // to keep it lightweight.
  console.log(
    `[impersonate] admin=${auth.user.email ?? auth.user.id} -> target=${email}`,
  );

  return NextResponse.json({ url: data.properties?.action_link ?? null });
}
