import { supabaseAdmin } from "@/lib/supabase/admin";
import AgenciesTable from "./agencies-table";

export const dynamic = "force-dynamic";

interface Props {
  searchParams: { status?: string };
}

export default async function AdminAgenciesPage({ searchParams }: Props) {
  // "archived" isn't a portal_status value — it's a derived state: the
  // agencies row exists but no matching Supabase Auth user does (the
  // login was deleted or was never linked). Handled in JS below.
  const VALID_STATUSES = ["pending", "active", "inactive", "archived", "all"] as const;
  type StatusKey = typeof VALID_STATUSES[number];

  const rawStatus = searchParams.status ?? "all";
  const status: StatusKey = (VALID_STATUSES as readonly string[]).includes(rawStatus)
    ? (rawStatus as StatusKey)
    : "all";

  // Always fetch the full agencies list — we need it to compute the archived
  // count (agencies with no linked auth user), which the tab strip shows
  // regardless of which tab is active. At current scale (~124 rows) the
  // extra bandwidth vs a status-filtered fetch is negligible.
  const [{ data: allAgencies }, { data: authList }] = await Promise.all([
    supabaseAdmin
      .from("agencies")
      .select("id, name, email, org_name, mobile, total_active_listings, email_verified, portal_status, archived")
      .order("name", { ascending: true }),
    supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 500 }),
  ]);

  const emailToUserId = new Map<string, string>();
  for (const u of authList?.users ?? []) {
    if (u.email) emailToUserId.set(u.email.toLowerCase(), u.id);
  }

  // Attach interest_type via profiles for rows that DO have an auth user.
  const userIds = (allAgencies ?? [])
    .map((a) => (a.email ? emailToUserId.get(a.email.toLowerCase()) : undefined))
    .filter((id): id is string => Boolean(id));
  const userIdToInterest = new Map<string, string | null>();
  if (userIds.length > 0) {
    const { data: profileRows } = await supabaseAdmin
      .from("profiles")
      .select("id, interest_type")
      .in("id", userIds);
    for (const p of profileRows ?? []) userIdToInterest.set(p.id, p.interest_type ?? null);
  }

  const enrichedAll = (allAgencies ?? []).map((a) => {
    const userId = a.email ? emailToUserId.get(a.email.toLowerCase()) : undefined;
    // Archived = admin manually flagged it OR there's no linked auth user
    // (legacy orphan). Both bucket into the same tab so Tim only has one
    // place to look for profiles that aren't in active rotation.
    // is_orphan is exposed separately so the client can gate the Unarchive
    // button — un-archiving an orphan just flips the flag but the row
    // stays in Archived (still orphaned), so we don't offer that action.
    return {
      ...a,
      interest_type: userId ? (userIdToInterest.get(userId) ?? null) : null,
      is_archived: a.archived === true || !userId,
      is_orphan: !userId,
    };
  });

  // Archived is exclusive: a row that's archived does NOT show up under
  // Active/Inactive/All. That keeps the counts consistent (Active + Inactive
  // = All) and matches the user expectation that "moving" a row to Archived
  // removes it from the other tabs.
  const counts = {
    pending: enrichedAll.filter((r) => !r.is_archived && r.portal_status === "pending").length,
    active: enrichedAll.filter((r) => !r.is_archived && r.portal_status === "active").length,
    inactive: enrichedAll.filter((r) => !r.is_archived && r.portal_status === "inactive").length,
    archived: enrichedAll.filter((r) => r.is_archived).length,
    all: enrichedAll.filter((r) => !r.is_archived).length,
  };

  // Filter the visible rows for the current tab. Non-archived tabs exclude
  // archived rows entirely; the Archived tab is the only place they appear.
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
