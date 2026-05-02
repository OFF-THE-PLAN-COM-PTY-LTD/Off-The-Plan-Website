import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/public";

export async function GET() {
  const { data, error } = await supabase
    .from("developments")
    .select("id, name, is_published")
    .eq("is_published", true);

  return NextResponse.json({
    count: data?.length ?? 0,
    data: data ?? [],
    error: error ?? null,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "MISSING",
  });
}
