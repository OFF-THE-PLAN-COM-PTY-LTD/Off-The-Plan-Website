import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin, requireMemberOrAdmin } from "@/lib/supabase/auth-guards";
import { sendEmail } from "@/lib/email/send";
import { EMAIL_ADMIN_TO, EMAIL_SALES_CC } from "@/lib/email/client";

const ALLOWED_STATUSES = new Set(["pending", "approved", "rejected", "completed"]);

export async function POST(req: NextRequest) {
  const auth = await requireMemberOrAdmin();
  if ("error" in auth) return auth.error;

  const { projectId, upgradeType, startDate, endDate } = await req.json();

  if (!projectId || !upgradeType) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Members can only request upgrades on their own listings.
  if (!auth.isAdmin) {
    const { data: dev } = await supabaseAdmin
      .from("developments")
      .select("owner_user_id")
      .eq("id", projectId)
      .maybeSingle();
    if (!dev || dev.owner_user_id !== auth.user.id) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  const { error } = await supabaseAdmin.from("upgrade_requests").insert({
    user_id: auth.user.id,
    development_id: projectId,
    upgrade_type: upgradeType,
    start_date: startDate || null,
    end_date: endDate || null,
  });

  if (error) {
    console.error("Upgrade request insert error:", error);
    return NextResponse.json({ error: "Could not record your request." }, { status: 500 });
  }

  // Notify admin + sales so a new upgrade request isn't missed (the admin
  // page isn't polled). Non-fatal — the request is already saved, so an
  // email failure must not 500 the member's submission. No-ops cleanly
  // when RESEND_API_KEY isn't set.
  try {
    const [{ data: dev }, { data: profile }] = await Promise.all([
      supabaseAdmin.from("developments").select("name").eq("id", projectId).maybeSingle(),
      supabaseAdmin.from("profiles").select("full_name, business_name").eq("id", auth.user.id).maybeSingle(),
    ]);
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://offtheplan.com.au";
    const requester = profile?.full_name || auth.user.email || "A member";
    const company = profile?.business_name ? ` (${profile.business_name})` : "";
    const devName = dev?.name ?? "a listing";
    const period = startDate || endDate ? `${startDate || "?"} → ${endDate || "ongoing"}` : "not specified";
    await sendEmail({
      to: EMAIL_ADMIN_TO,
      cc: [EMAIL_SALES_CC],
      replyTo: auth.user.email ?? undefined,
      subject: `New upgrade request — ${upgradeType} for ${devName}`,
      html: `<p><strong>${requester}</strong>${company} has requested a listing upgrade.</p>
        <p><strong>Upgrade:</strong> ${upgradeType}<br>
        <strong>Listing:</strong> ${devName}<br>
        <strong>Requested period:</strong> ${period}</p>
        <p>Review and action it in <a href="${baseUrl}/admin/upgrade-requests">/admin/upgrade-requests</a>.</p>`,
      text: `${requester}${company} requested an upgrade: ${upgradeType} for ${devName}. Period: ${period}. Review at ${baseUrl}/admin/upgrade-requests`,
    });
  } catch (err) {
    console.error("Upgrade request notification email failed (non-fatal):", err);
  }

  return NextResponse.json({ success: true });
}

// Admin-only: update status / add notes on an upgrade request.
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id, status, admin_notes } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });

  const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if (status !== undefined) {
    if (!ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ error: "Invalid status" }, { status: 400 });
    }
    update.status = status;
  }
  if (admin_notes !== undefined) {
    update.admin_notes = admin_notes || null;
  }

  const { error } = await supabaseAdmin
    .from("upgrade_requests")
    .update(update)
    .eq("id", id);

  if (error) {
    console.error("Upgrade request update error:", error);
    return NextResponse.json({ error: "Could not update request." }, { status: 500 });
  }

  revalidatePath("/admin/upgrade-requests");
  return NextResponse.json({ success: true });
}
