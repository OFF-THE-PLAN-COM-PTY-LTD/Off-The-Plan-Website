import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";
import { sendSetPasswordLink } from "@/lib/auth/send-set-password";

/**
 * Admin action: email a user a "set your own password" link instead of the
 * admin typing a password for them. Client's preferred launch flow (Tim,
 * 15 Jun): "let's just have them set their own the first time they login."
 *
 * Two modes:
 *   { email }              -> send to one member
 *   { scope: "all-members" } -> send to every agency email on file (launch blast)
 *
 * The bulk path sends sequentially to stay polite to Resend's rate limits.
 * maxDuration is raised so a larger list doesn't get cut off mid-run.
 */
export const maxDuration = 300;

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const origin = resolveOrigin(req);
  const scope = (body as { scope?: unknown })?.scope;

  // ── Bulk: every agency email on file ──────────────────────────────────
  if (scope === "all-members") {
    const { data, error } = await supabaseAdmin
      .from("agencies")
      .select("email")
      .not("email", "is", null);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const emails = Array.from(
      new Set(
        (data ?? [])
          .map((r) => (typeof r.email === "string" ? r.email.trim().toLowerCase() : ""))
          .filter((e) => e.includes("@")),
      ),
    );

    let sent = 0;
    let failed = 0;
    for (const email of emails) {
      const res = await sendSetPasswordLink({ email, origin, mode: "set" });
      if (res.sent) sent++;
      else failed++;
    }

    console.log(
      `[send-set-password] bulk by admin=${auth.user.email ?? auth.user.id}: sent=${sent} failed=${failed} total=${emails.length}`,
    );
    return NextResponse.json({ sent, failed, total: emails.length });
  }

  // ── Single ────────────────────────────────────────────────────────────
  const email = (body as { email?: unknown })?.email;
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const result = await sendSetPasswordLink({ email, origin, mode: "set" });
  if (!result.sent) {
    return NextResponse.json(
      { error: result.error ?? "Failed to send email (is RESEND_API_KEY set?)" },
      { status: 500 },
    );
  }

  console.log(`[send-set-password] admin=${auth.user.email ?? auth.user.id} -> ${email}`);
  return NextResponse.json({ success: true });
}

function resolveOrigin(req: NextRequest): string {
  const refererUrl = req.headers.get("referer");
  let refererOrigin: string | null = null;
  try {
    if (refererUrl) refererOrigin = new URL(refererUrl).origin;
  } catch {
    // ignore malformed Referer
  }
  return (
    req.headers.get("origin") ??
    refererOrigin ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://off-the-plan-website.vercel.app"
  );
}
