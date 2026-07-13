import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";
import { sendInviteLink } from "@/lib/auth/send-invite";

/**
 * Admin action: email a user a "set your own password" link. Uses the
 * invite-flavoured helper so it works for BOTH:
 *   - existing auth users (normal recovery link, no user creation)
 *   - legacy profiles that don't have a Supabase login yet (create the
 *     auth user with email_confirm=true and no password, THEN send the
 *     same branded link — the migration path Tim uses to onboard the
 *     ~89 agencies that were imported from the old site).
 *
 * Bulk mode ({ scope: "all-members" }) skips archived rows since Tim
 * explicitly flagged those as retired.
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

  // ── Bulk: every non-archived account email on file ────────────────────
  if (scope === "all-members") {
    const { data, error } = await supabaseAdmin
      .from("accounts")
      .select("email, archived")
      .not("email", "is", null);
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Pre-build the email → auth-user map so sendInviteLink can skip its
    // per-call listUsers scan for every row.
    const emailToUserId = new Map<string, string>();
    const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 });
    for (const u of authList?.users ?? []) {
      if (u.email) emailToUserId.set(u.email.toLowerCase(), u.id);
    }

    const emails = Array.from(
      new Set(
        (data ?? [])
          .filter((r) => r.archived !== true)
          .map((r) => (typeof r.email === "string" ? r.email.trim().toLowerCase() : ""))
          .filter((e) => e.includes("@")),
      ),
    );

    let sent = 0;
    let failed = 0;
    let created = 0;
    for (const email of emails) {
      const res = await sendInviteLink({ email, origin, emailToUserId });
      if (res.sent) sent++;
      else failed++;
      if (res.created) created++;
    }

    console.log(
      `[send-set-password] bulk by admin=${auth.user.email ?? auth.user.id}: sent=${sent} failed=${failed} created=${created} total=${emails.length}`,
    );
    return NextResponse.json({ sent, failed, created, total: emails.length });
  }

  // ── Single ────────────────────────────────────────────────────────────
  const email = (body as { email?: unknown })?.email;
  if (typeof email !== "string" || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 });
  }

  const result = await sendInviteLink({ email, origin });
  if (!result.sent) {
    return NextResponse.json(
      { error: result.error ?? "Failed to send email (is RESEND_API_KEY set?)" },
      { status: 500 },
    );
  }

  console.log(`[send-set-password] admin=${auth.user.email ?? auth.user.id} -> ${email}${result.created ? " (login created)" : ""}`);
  return NextResponse.json({ success: true, created: result.created });
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
