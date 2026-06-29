import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";
import { sendEmail } from "@/lib/email/send";
import { accountApprovedTemplate, accountRejectedTemplate } from "@/lib/email/templates";

const ALLOWED_STATUSES = new Set(["approved", "rejected"]);

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id, status } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!status || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Look up the profile + auth email BEFORE the update so we have what we
  // need to email the user after. We also want to skip emailing if the
  // status didn't actually change (idempotency).
  const { data: existing } = await supabaseAdmin
    .from("profiles")
    .select("full_name, member_status")
    .eq("id", id)
    .maybeSingle();
  const previousStatus = existing?.member_status ?? null;
  const fullName = (existing?.full_name as string) || "there";

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ member_status: status })
    .eq("id", id);

  if (error) {
    console.error("Member status update error:", error);
    return NextResponse.json({ error: "Could not update member." }, { status: 500 });
  }

  // Notify the applicant if their status actually changed. Looking up the
  // auth user lets us reach their email even though it's not on the profile
  // row. Failures here are non-fatal — admin saw a successful status change
  // in the UI and that's the source of truth; logging means we can re-send
  // manually if needed.
  if (status !== previousStatus) {
    try {
      const { data: userRow } = await supabaseAdmin.auth.admin.getUserById(id);
      const userEmail = userRow.user?.email;
      if (userEmail && userEmail.includes("@")) {
        const tmpl = status === "approved"
          ? accountApprovedTemplate({ full_name: fullName })
          : accountRejectedTemplate({ full_name: fullName });
        await sendEmail({ to: userEmail, ...tmpl });
      }
    } catch (e) {
      console.error("Approval email send failed (non-fatal):", e);
    }
  }

  revalidatePath("/admin/members");
  return NextResponse.json({ success: true });
}
