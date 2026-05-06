import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const filter = searchParams.get("filter") ?? "all";
  const page = parseInt(searchParams.get("page") ?? "1", 10);
  const pageSize = 10;

  let query = supabaseAdmin
    .from("enquiries")
    .select(
      "full_name, email, mobile, buyer_type, status, created_at, developments(name)",
      { count: "exact" }
    )
    .order("created_at", { ascending: false });

  if (filter === "30") {
    query = query.gte("created_at", new Date(Date.now() - 30 * 864e5).toISOString());
  } else if (filter === "60") {
    query = query.gte("created_at", new Date(Date.now() - 60 * 864e5).toISOString());
  }

  const { data, count, error } = await query.range(
    (page - 1) * pageSize,
    page * pageSize - 1
  );

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Flatten the development name for easy rendering
  const rows = (data ?? []).map((row: Record<string, unknown>) => ({
    ...row,
    project_name: (row.developments as { name?: string } | null)?.name ?? "—",
    developments: undefined,
  }));

  return NextResponse.json({ data: rows, total: count ?? 0, page, pageSize });
}
