import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validTrackingTarget } from "@/features/tracking/track-guard";

export async function POST(req: NextRequest) {
  const { developmentId } = await req.json().catch(() => ({}));
  const devId = await validTrackingTarget(developmentId);
  if (!devId) return NextResponse.json({ error: "Invalid listing" }, { status: 400 });

  await supabaseAdmin.rpc("increment_share_count", { dev_id: devId });

  return NextResponse.json({ ok: true });
}
