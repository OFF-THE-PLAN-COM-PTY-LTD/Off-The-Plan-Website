import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const developmentId = searchParams.get("development_id") ?? "";
  const months = parseInt(searchParams.get("months") ?? "0", 10);

  // months=0 means "all time"
  const allTime = months === 0;
  const since = new Date();
  if (!allTime) since.setMonth(since.getMonth() - months);
  const sinceISO = since.toISOString();

  // Aggregate stats from developments
  let devQuery = supabaseAdmin
    .from("developments")
    .select("view_count, share_count, phone_click_count");

  if (developmentId) devQuery = devQuery.eq("id", developmentId);

  const { data: devData } = await devQuery;
  const views = (devData ?? []).reduce((s, d) => s + (d.view_count ?? 0), 0);
  const shares = (devData ?? []).reduce((s, d) => s + (d.share_count ?? 0), 0);

  // Enquiries count (respects period filter)
  let enqQuery = supabaseAdmin
    .from("enquiries")
    .select("id", { count: "exact", head: true });
  if (developmentId) enqQuery = enqQuery.eq("development_id", developmentId);
  if (!allTime) enqQuery = enqQuery.gte("created_at", sinceISO);
  const { count: totalEnquiries } = await enqQuery;

  // View events — all time, for the chart (no date filter so historical data shows)
  let viewEventsQuery = supabaseAdmin
    .from("listing_view_events")
    .select("viewed_at")
    .order("viewed_at");
  if (developmentId) viewEventsQuery = viewEventsQuery.eq("development_id", developmentId);

  const { data: viewEvents } = await viewEventsQuery;

  // Group by month
  const byMonth: Record<string, number> = {};
  for (const e of viewEvents ?? []) {
    const key = (e.viewed_at as string).slice(0, 7); // "YYYY-MM"
    byMonth[key] = (byMonth[key] ?? 0) + 1;
  }

  // Build ordered month range from earliest event to now
  const keys = Object.keys(byMonth).sort();
  const chartData: { month: string; views: number }[] = [];

  if (keys.length > 0) {
    const [startYear, startMon] = keys[0].split("-").map(Number);
    const cursor = new Date(startYear, startMon - 1, 1);
    const now = new Date();
    now.setDate(1);
    while (cursor <= now) {
      const key = `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, "0")}`;
      const label = cursor.toLocaleString("default", { month: "short", year: "numeric" });
      chartData.push({ month: label, views: byMonth[key] ?? 0 });
      cursor.setMonth(cursor.getMonth() + 1);
    }
  }

  return NextResponse.json({ views, shares, totalEnquiries: totalEnquiries ?? 0, chartData });
}
