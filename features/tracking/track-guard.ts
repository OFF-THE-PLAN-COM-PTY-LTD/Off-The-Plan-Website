import { supabaseAdmin } from "@/lib/supabase/admin";

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function validTrackingTarget(devId: unknown): Promise<string | null> {
  if (typeof devId !== "string" || !UUID_RE.test(devId)) return null;
  const { data } = await supabaseAdmin
    .from("developments")
    .select("id")
    .eq("id", devId)
    .eq("is_published", true)
    .maybeSingle();
  return data?.id ?? null;
}
