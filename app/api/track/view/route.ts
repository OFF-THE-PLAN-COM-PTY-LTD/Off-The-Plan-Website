import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { validTrackingTarget } from "@/features/tracking/track-guard";

export async function POST(req: NextRequest) {
  const { developmentId } = await req.json().catch(() => ({}));
  const devId = await validTrackingTarget(developmentId);
  if (!devId) return NextResponse.json({ error: "Invalid listing" }, { status: 400 });

  // Best-effort analytics: a failing RPC/insert must not surface a 500 to the
  // public listing page (mirrors how /api/enquiries treats the same counter).
  const results = await Promise.allSettled([
    supabaseAdmin.rpc("increment_view_count", { dev_id: devId }),
    supabaseAdmin.from("listing_view_events").insert({ development_id: devId }),
  ]);
  for (const r of results) {
    if (r.status === "rejected") console.error("track/view write failed (non-fatal):", r.reason);
  }

  return NextResponse.json({ ok: true });
}
