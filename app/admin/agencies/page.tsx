import { supabaseAdmin } from "@/lib/supabase/admin";
import AgenciesTable from "./agencies-table";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { status?: string };
}

export default async function AdminAgenciesPage({ searchParams }: Props) {
  const VALID_STATUSES = ["pending", "active", "inactive", "all"] as const;
  type StatusKey = typeof VALID_STATUSES[number];

  const rawStatus = searchParams.status ?? "all";
  const status: StatusKey = (VALID_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as StatusKey)
    : "all";

  let q = supabaseAdmin
    .from("agencies")
    .select("id, name, email, org_name, mobile, total_active_listings, email_verified, portal_status")
    .order("name", { ascending: true });
  if (status !== "all") {
    q = q.eq("portal_status", status);
  }

  const [
    { data: rows },
    { count: pendingCount },
    { count: activeCount },
    { count: inactiveCount },
    { count: allCount },
  ] = await Promise.all([
    q,
    supabaseAdmin.from("agencies").select("id", { count: "exact", head: true }).eq("portal_status", "pending"),
    supabaseAdmin.from("agencies").select("id", { count: "exact", head: true }).eq("portal_status", "active"),
    supabaseAdmin.from("agencies").select("id", { count: "exact", head: true }).eq("portal_status", "inactive"),
    supabaseAdmin.from("agencies").select("id", { count: "exact", head: true }),
  ]);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-light text-navy text-section-lg">All Profiles</h1>
        <p className="font-sans text-sm text-ink/40 uppercase tracking-widest">{allCount ?? 0} total</p>
      </div>
      <AgenciesTable
        agencies={(rows ?? []) as any}
        activeStatus={status}
        counts={{
          pending: pendingCount ?? 0,
          active: activeCount ?? 0,
          inactive: inactiveCount ?? 0,
          all: allCount ?? 0,
        }}
      />
    </div>
  );
}
