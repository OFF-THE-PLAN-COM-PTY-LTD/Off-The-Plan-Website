import Link from "next/link";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { ListingsTabs } from "./listings-tabs";

interface SearchParams { q?: string; agency?: string }

export default async function AdminListingsPage({ searchParams }: { searchParams: SearchParams }) {
  const q = searchParams.q?.toLowerCase().trim() ?? "";
  const agencyId = searchParams.agency ?? "";

  // If filtering by company, resolve the account by id — the "View Listings"
  // link passes accounts.id. We also grab its legacy ids so we can match
  // listings linked either as the developer (account_id / legacy developer_id)
  // or as the selling agent (legacy agency_id).
  let agencyLabel = "";
  let acctLegacyAgencyId: string | null = null;
  let acctLegacyDeveloperId: string | null = null;
  if (agencyId) {
    const { data: acct } = await supabaseAdmin
      .from("accounts")
      .select("name, legacy_agency_id, legacy_developer_id")
      .eq("id", agencyId)
      .maybeSingle();
    agencyLabel = acct?.name ?? "Agency";
    acctLegacyAgencyId = (acct?.legacy_agency_id as string | null) ?? null;
    acctLegacyDeveloperId = (acct?.legacy_developer_id as string | null) ?? null;
  }

  let listingsQuery = supabaseAdmin
    .from("developments")
    .select("id, name, slug, suburb, state, is_published, is_featured, status, price_display, type, hero_image_url, tier, agency_id, view_count, phone_click_count, share_count, developer:accounts!account_id(name)")
    .order("name");

  if (agencyId) {
    // Match the company across every link type: developer (account_id or the
    // legacy developer_id) and selling agent (legacy agency_id).
    const ors = [`account_id.eq.${agencyId}`];
    if (acctLegacyAgencyId) ors.push(`agency_id.eq.${acctLegacyAgencyId}`);
    if (acctLegacyDeveloperId) ors.push(`developer_id.eq.${acctLegacyDeveloperId}`);
    listingsQuery = listingsQuery.or(ors.join(","));
  }

  const [{ data: allData }, { count: enquiryCount }, { data: agenciesData }] = await Promise.all([
    listingsQuery,
    supabaseAdmin.from("enquiries").select("*", { count: "exact", head: true }),
    // Agency options come from accounts but return the legacy agencies.id
    // (accounts.legacy_agency_id) so they stay FK-valid for developments.agency_id.
    supabaseAdmin
      .from("accounts")
      .select("legacy_agency_id, name")
      .not("legacy_agency_id", "is", null)
      .order("name"),
  ]);

  const agencies = (agenciesData ?? []).map((a: any) => ({
    id: a.legacy_agency_id,
    label: a.name || "—",
  }));

  const all = (allData ?? []) as any[];
  const filtered = q ? all.filter((l) => l.name.toLowerCase().includes(q)) : all;

  const totalCount = all.length;
  const pendingCount = all.filter((l) => !l.is_published).length;
  const publishedCount = all.filter((l) => l.is_published).length;

  const cancelled = filtered.filter((l) => l.status === "Cancelled");
  const archived = filtered.filter((l) => l.status === "Archived");
  const active = filtered.filter((l) => l.status !== "Cancelled" && l.status !== "Archived");
  const featured = active.filter((l) => l.is_featured && l.is_published);
  const regular = active.filter((l) => !l.is_featured && l.is_published);
  const pending = active.filter((l) => !l.is_published);

  const cancelledCount = all.filter((l) => l.status === "Cancelled").length;
  const archivedCount = all.filter((l) => l.status === "Archived").length;

  const totalViews = all.reduce((sum, l) => sum + (l.view_count ?? 0), 0);
  const totalPhoneClicks = all.reduce((sum, l) => sum + (l.phone_click_count ?? 0), 0);
  const totalShares = all.reduce((sum, l) => sum + (l.share_count ?? 0), 0);

  const stats = [
    { label: "All Listing", count: totalCount },
    { label: "Pending", count: pendingCount },
    { label: "Published", count: publishedCount },
    { label: "Archived", count: archivedCount },
  ];

  return (
    <div>
      {agencyId && (
        <div className="flex items-center gap-3 mb-4">
          <Link href="/admin/agencies" className="font-sans text-sm text-ink/40 hover:text-ink transition-colors">
            ← All Agencies
          </Link>
          <span className="text-ink/20">/</span>
          <span className="font-sans text-sm text-ink">{agencyLabel}</span>
        </div>
      )}
      <h1 className="font-display font-light text-navy text-section-lg mb-6">
        {agencyId ? `Listings — ${agencyLabel}` : "Listing List"}
      </h1>

      {/* Stats row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-line p-5 text-center">
            <p className="font-sans text-sm text-ink/60 mb-2">{s.label}</p>
            <p className="font-display text-[40px] font-light text-orange leading-none">{s.count}</p>
          </div>
        ))}
      </div>

      {/* Metrics row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {/* Total Views */}
        <div className="bg-white border border-line p-5 flex items-center justify-between">
          <div>
            <p className="font-sans text-sm text-ink/60 mb-1">Total Views</p>
            <p className="font-sans text-xl font-semibold text-orange">{totalViews.toLocaleString()}</p>
          </div>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-navy/20">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        {/* Total Enquiries */}
        <div className="bg-white border border-line p-5 flex items-center justify-between">
          <div>
            <p className="font-sans text-sm text-ink/60 mb-1">Total Enquiries</p>
            <p className="font-sans text-xl font-semibold text-orange">{(enquiryCount ?? 0).toLocaleString()}</p>
          </div>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-navy/20">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
          </svg>
        </div>
        {/* Phone Clicks */}
        <div className="bg-white border border-line p-5 flex items-center justify-between">
          <div>
            <p className="font-sans text-sm text-ink/60 mb-1">Phone Clicks</p>
            <p className="font-sans text-xl font-semibold text-orange">{totalPhoneClicks.toLocaleString()}</p>
          </div>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-navy/20">
            <path d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94m-1 7.98v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6z" />
          </svg>
        </div>
        {/* Total Share */}
        <div className="bg-white border border-line p-5 flex items-center justify-between">
          <div>
            <p className="font-sans text-sm text-ink/60 mb-1">Total Share</p>
            <p className="font-sans text-xl font-semibold text-orange">{totalShares.toLocaleString()}</p>
          </div>
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="text-navy/20">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </div>
      </div>

      {/* Search filter */}
      <div className="bg-white border border-line p-4 mb-8">
        <p className="font-sans text-sm text-ink/50 mb-2">Filter:</p>
        <form method="GET" className="flex items-center gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Project Name..."
            className="border border-line px-3 py-2 bg-white font-sans text-sm outline-none focus:border-orange/60 w-80"
          />
          <button type="submit" className="btn-primary py-2 px-4 text-sm">Search</button>
          {q && (
            <Link href="/admin/listings" className="font-sans text-sm text-orange hover:underline">
              Reset
            </Link>
          )}
        </form>
      </div>

      {/* Add listing button */}
      <div className="flex justify-end mb-6">
        <Link href="/admin/listings/new" className="btn-primary">+ Add listing</Link>
      </div>

      {/* Listing sections as tabs */}
      <ListingsTabs
        groups={[
          { key: "featured", title: "FEATURED LISTING", listings: featured },
          { key: "listing", title: "LISTING", listings: regular },
          { key: "pending", title: "PENDING", listings: pending },
          { key: "cancelled", title: "CANCELLED", listings: cancelled },
          { key: "archived", title: "ARCHIVED", listings: archived },
        ]}
        agencies={agencies}
      />

      {filtered.length === 0 && (
        <p className="font-sans text-body-md text-ink/40 text-center py-12">
          {q ? `No listings found for "${q}"` : "No listings yet."}
        </p>
      )}
    </div>
  );
}

