import { supabaseAdmin } from "@/lib/supabase/admin";
import AgenciesTable from "./agencies-table";

export default async function AdminAgenciesPage() {
  const { data } = await supabaseAdmin
    .from("agencies")
    .select("id, name, email, org_name, mobile, total_active_listings, email_verified, portal_status")
    .order("name", { ascending: true });

  const agencies = data ?? [];

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-light text-navy text-section-lg">All Agencies</h1>
        <p className="font-sans text-sm text-ink/40 uppercase tracking-widest">{agencies.length} total</p>
      </div>
      <AgenciesTable agencies={agencies as any} />
    </div>
  );
}
