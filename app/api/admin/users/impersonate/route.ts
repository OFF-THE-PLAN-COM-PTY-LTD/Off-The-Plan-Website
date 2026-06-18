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

  // Send the admin straight into the member's portal instead of the public
  // homepage. Supabase falls back to the project's Site URL when no
  // redirectTo is supplied — fine for password resets, wrong for "Sign
  // In As" since the admin wants to see the member's dashboard immediately.
  //
  // Origin sniff order:
  //   1. The Origin header (set by browsers on POST requests)
  //   2. The Referer header host (some browsers strip Origin)
  //   3. NEXT_PUBLIC_APP_URL env var (set on Vercel)
  //   4. Hardcoded prod fallback
  // Whichever wins, it always matches a URL the admin is actually signed
  // in on — so it'll be in the Supabase redirect-URL allow list.
  const refererUrl = req.headers.get("referer");
  let refererOrigin: string | null = null;
  try {
    if (refererUrl) refererOrigin = new URL(refererUrl).origin;
  } catch {
    // ignore malformed Referer
  }
  const origin =
    req.headers.get("origin") ??
    refererOrigin ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://offtheplan.com.au";

  // Route the magic link through our own /auth/callback page rather than
  // straight to /portal. The callback explicitly calls setSession() with
  // the access + refresh tokens from the URL hash, which is what cleanly
  // overwrites the admin's existing session with the impersonated user's.
  // Without this step, the default Supabase flow leaves the admin still
  // signed in as themselves (cookies sticky) and the impersonation does
  // nothing visible.
  const { data, error } = await supabaseAdmin.auth.admin.generateLink({
    type: "magiclink",
    email,
    options: {
      redirectTo: `${origin}/auth/callback?next=/portal`,
    },
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
