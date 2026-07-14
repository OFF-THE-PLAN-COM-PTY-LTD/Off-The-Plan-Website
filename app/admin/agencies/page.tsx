import { supabaseAdmin } from "@/lib/supabase/admin";
import AgenciesTable from "./agencies-table";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { status?: string };
}

// "All Profiles" now reads the consolidated `accounts` table directly (one
// row per company, Developer or Agent). The legacy `agencies` table is no
// longer read here. Each account is mapped to the shape AgenciesTable expects
// (org_name = company name, name = contact person, mobile = phone, etc.).
export default async function AdminAgenciesPage({ searchParams }: Props) {
  const VALID_STATUSES = ["pending", "active", "inactive", "archived", "all"] as const;
  type StatusKey = typeof VALID_STATUSES[number];

  const rawStatus = searchParams.status ?? "all";
  const status: StatusKey = (VALID_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as StatusKey)
    : "all";

  const { data: accounts } = await supabaseAdmin
    .from("accounts")
    .select("id, name, first_name, last_name, email, phone, total_active_listings, email_verified, portal_status, archived, type, is_published")
    .order("name", { ascending: true });

  const enrichedAll = (accounts ?? []).map((a) => ({
    id: a.id as string,
    // Contact person (Name) vs company (Org. Name).
    name: [a.first_name, a.last_name].filter(Boolean).join(" ") || (a.name as string) || null,
    email: (a.email as string) ?? null,
    org_name: (a.name as string) ?? null,
    mobile: (a.phone as string) ?? null,
    total_active_listings: (a.total_active_listings as number) ?? 0,
    email_verified: a.email_verified === true,
    portal_status: (a.portal_status as string) ?? "active",
    interest_type: (a.type as string) ?? null,
    archived: a.archived === true,
    is_archived: a.archived === true,
    is_published: a.is_published === true,
  }));

  // Archived is exclusive: an archived row does NOT show under Active/Inactive/All.
  const counts = {
    pending: enrichedAll.filter((r) => !r.is_archived && r.portal_status === "pending").length,
    active: enrichedAll.filter((r) => !r.is_archived && r.portal_status === "active").length,
    inactive: enrichedAll.filter((r) => !r.is_archived && r.portal_status === "inactive").length,
    archived: enrichedAll.filter((r) => r.is_archived).length,
    all: enrichedAll.filter((r) => !r.is_archived).length,
  };

  const rowsForTab =
    status === "archived"
      ? enrichedAll.filter((r) => r.is_archived)
      : status === "all"
        ? enrichedAll.filter((r) => !r.is_archived)
        : enrichedAll.filter((r) => !r.is_archived && r.portal_status === status);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="font-display font-light text-navy text-section-lg">All Profiles</h1>
        <p className="font-sans text-sm font-semibold text-ink uppercase tracking-widest">{counts.all} total</p>
      </div>
      <AgenciesTable
        agencies={rowsForTab as any}
        activeStatus={status}
        counts={counts}
      />
    </div>
  );
}
