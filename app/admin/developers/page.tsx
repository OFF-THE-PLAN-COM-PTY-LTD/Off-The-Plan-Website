import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import DevelopersTable from "./developers-table";

/**
 * Admin developers directory — list view.
 *
 * Lets Tim manage the rows that drive the public /developers page:
 * toggle is_published, edit company info, delete bad entries.
 */
export default async function AdminDevelopersPage() {
  const [
    { data: devs },
    { data: devCounts },
  ] = await Promise.all([
    supabaseAdmin
      .from("accounts")
      .select("id, slug, name, logo_url, state, is_published, user_id, created_at")
      .eq("type", "Developer")
      .order("name", { ascending: true }),
    supabaseAdmin
      .from("developments")
      .select("account_id")
      .not("account_id", "is", null),
  ]);

  // Count developments per account in JS (Supabase doesn't return group-by easily).
  const countsByAccountId = new Map<string, number>();
  for (const row of devCounts ?? []) {
    const id = (row as { account_id: string }).account_id;
    countsByAccountId.set(id, (countsByAccountId.get(id) ?? 0) + 1);
  }

  const developers = (devs ?? []).map((d) => ({
    id: d.id as string,
    slug: d.slug as string,
    name: d.name as string,
    logo_url: (d.logo_url as string) ?? null,
    state: (d.state as string) ?? null,
    is_published: Boolean(d.is_published),
    profile_id: (d.user_id as string) ?? null,
    listings_count: countsByAccountId.get(d.id as string) ?? 0,
  }));

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-light text-navy text-section-lg">Developers Directory</h1>
        <div className="flex items-center gap-3">
          <p className="font-sans text-sm text-ink/40 uppercase tracking-widest">{developers.length} total</p>
          <Link
            href="/admin/developers/new"
            className="font-mono text-[11px] uppercase tracking-widest px-4 py-2 bg-navy text-white hover:bg-navy/80 transition-colors"
          >
            + Add Developer
          </Link>
        </div>
      </div>
      <DevelopersTable developers={developers} />
    </div>
  );
}
