import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function POST(req: NextRequest) {
  const { developmentId } = await req.json();
  if (!developmentId) {
    return NextResponse.json({ error: "Missing developmentId" }, { status: 400 });
  }

  await supabaseAdmin.rpc("increment_view_count", { dev_id: developmentId });

  return NextResponse.json({ ok: true });
}
