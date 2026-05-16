import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const developmentId = searchParams.get("development_id") ?? "";
  const months = parseInt(searchParams.get("months") ?? "12", 10);

  const since = new Date();
  since.setMonth(since.getMonth() - months);
  const sinceISO = since.toISOString();

  // Aggregate stats from developments
  let devQuery = supabaseAdmin
    .from("developments")
    .select("view_count, share_count, phone_click_count");

  if (developmentId) {
    devQuery = devQuery.eq("id", developmentId);
  }

  const { data: devData } = await devQuery;

  const views = (devData ?? []).reduce((s, d) => s + (d.view_count ?? 0), 0);
  const shares = (devData ?? []).reduce((s, d) => s + (d.share_count ?? 0), 0);

  // Enquiries
  let enqQuery = supabaseAdmin
    .from("enquiries")
    .select("created_at, development_id")
    .gte("created_at", sinceISO)
    .order("created_at");

  if (developmentId) {
    enqQuery = enqQuery.eq("development_id", developmentId);
  }

  const { data: enquiries } = await enqQuery;
  const totalEnquiries = (enquiries ?? []).length;

  // Group enquiries by month for chart
  const byMonth: Record<string, number> = {};
  for (const e of enquiries ?? []) {
    const key = e.created_at.slice(0, 7); // "YYYY-MM"
    byMonth[key] = (byMonth[key] ?? 0) + 1;
  }

  // Build ordered month labels for the range
  const chartData: { month: string; enquiries: number }[] = [];
  const cursor = new Date(since);
  cursor.setDate(1);
  const now = new Date();
  while (cursor <= now) {
    const key = cursor.toISOString().slice(0, 7);
    const label = cursor.toLocaleString("default", { month: "short", year: "numeric" });
    chartData.push({ month: label, enquiries: byMonth[key] ?? 0 });
    cursor.setMonth(cursor.getMonth() + 1);
  }

  return NextResponse.json({ views, shares, totalEnquiries, chartData });
}
