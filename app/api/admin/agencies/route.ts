import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function PATCH(req: Request) {
  try {
    const { id, portal_status } = await req.json();
    if (!id || !portal_status) {
      return NextResponse.json({ error: "Missing id or portal_status" }, { status: 400 });
    }
    if (!["active", "inactive"].includes(portal_status)) {
      return NextResponse.json({ error: "Invalid portal_status" }, { status: 400 });
    }
    const { error } = await supabaseAdmin
      .from("agencies")
      .update({ portal_status, updated_at: new Date().toISOString() })
      .eq("id", id);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Unexpected error." }, { status: 500 });
  }
}
