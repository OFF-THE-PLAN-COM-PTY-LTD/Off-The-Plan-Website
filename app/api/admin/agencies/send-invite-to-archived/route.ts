import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";
import { sendInviteLink } from "@/lib/auth/send-invite";

/**
 * POST /api/admin/agencies/send-invite-to-archived
 *
 * Bulk "invite to set password" for every archived agency profile — both
 * the admin-flagged ones (archived=true) and the orphaned ones (no auth
 * user linked). For orphans, an auth user is created on the fly with
 * email_confirm=true and no password; for already-linked rows we skip
 * creation and just send them the normal set-password link.
 *
 * This is the migration mechanism for legacy profiles imported before
 * there was a login layer — click one button, everyone in Archived gets a
 * branded email pointing at /auth/set-password. As they respond, they
 * naturally move out of Archived (they now have a login and their
 * archived flag stays false since we don't set it).
 *
 * Sequential to stay polite to Resend rate limits; maxDuration raised so
 * an 89-row list doesn't get truncated.
 */
export const maxDuration = 300;

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

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const origin = resolveOrigin(req);

  // Build the auth email → id map once so sendInviteLink can skip the
  // per-call listUsers scan for every one of the 89 rows.
  const emailToUserId = new Map<string, string>();
  const { data: authList } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 });
  for (const u of authList?.users ?? []) {
    if (u.email) emailToUserId.set(u.email.toLowerCase(), u.id);
  }

  // Archived = agencies.archived=true OR no linked auth user.
  const { data: agencies, error } = await supabaseAdmin
    .from("agencies")
    .select("email, archived")
    .not("email", "is", null);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const targetEmails = Array.from(
    new Set(
      (agencies ?? [])
        .filter((r) => {
          const email = typeof r.email === "string" ? r.email.trim().toLowerCase() : "";
          if (!email.includes("@")) return false;
          const isOrphan = !emailToUserId.has(email);
          return r.archived === true || isOrphan;
        })
        .map((r) => (r.email as string).trim().toLowerCase()),
    ),
  );

  let sent = 0;
  let created = 0;
  let failed = 0;
  for (const email of targetEmails) {
    const res = await sendInviteLink({ email, origin, emailToUserId });
    if (res.sent) sent++;
    else failed++;
    if (res.created) created++;
  }

  console.log(
    `[send-invite-to-archived] by admin=${auth.user.email ?? auth.user.id}: sent=${sent} failed=${failed} created=${created} total=${targetEmails.length}`,
  );

  return NextResponse.json({ sent, failed, created, total: targetEmails.length });
}
