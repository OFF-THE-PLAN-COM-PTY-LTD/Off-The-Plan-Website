import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { requireAdmin } from "@/lib/supabase/auth-guards";

/**
 * Returns a minimal list of published developments so the Homepage Setup
 * admin page can offer a 'Linked Project' picker. Selecting one drives the
 * public hero overlay text (project, suburb, state, developer) and link.
 */
export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { data, error } = await supabaseAdmin
    .from("developments")
    .select("id, name, slug, suburb, state, developer:developers(name)")
    .eq("is_published", true)
    .order("name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const flattened = (data ?? []).map((d) => ({
    id: d.id as string,
    name: d.name as string,
    slug: d.slug as string,
    suburb: (d.suburb as string | null) ?? null,
    state: (d.state as string | null) ?? null,
    developer_name: (d.developer as unknown as { name: string | null } | null)?.name ?? null,
  }));

  return NextResponse.json(flattened);
}
