import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";

const ALLOWED_STATUSES = new Set(["approved", "rejected"]);

export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { id, status } = await req.json();
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  if (!status || !ALLOWED_STATUSES.has(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ member_status: status })
    .eq("id", id);

  if (error) {
    console.error("Member status update error:", error);
    return NextResponse.json({ error: "Could not update member." }, { status: 500 });
  }

  revalidatePath("/admin/members");
  return NextResponse.json({ success: true });
}
