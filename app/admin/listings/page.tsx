import Link from "next/link";
import Image from "next/image";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { categorySlug } from "@/lib/listing-url";
import { ListingRowActions } from "./listing-row-actions";

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

      {/* Featured Listing */}
      {featured.length > 0 && (
        <ListingSection title="FEATURED LISTING" listings={featured} agencies={agencies} />
      )}

      {/* Regular Listing */}
      {regular.length > 0 && (
        <ListingSection title="LISTING" listings={regular} agencies={agencies} />
      )}

      {/* Pending */}
      {pending.length > 0 && (
        <ListingSection title="PENDING" listings={pending} agencies={agencies} />
      )}

      {/* Cancelled */}
      {cancelled.length > 0 && (
        <ListingSection title="CANCELLED" listings={cancelled} agencies={agencies} />
      )}

      {/* Archived */}
      {archived.length > 0 && (
        <ListingSection title="ARCHIVED" listings={archived} agencies={agencies} />
      )}

      {filtered.length === 0 && (
        <p className="font-sans text-body-md text-ink/40 text-center py-12">
          {q ? `No listings found for "${q}"` : "No listings yet."}
        </p>
      )}
    </div>
  );
}

type AgencyOption = { id: string; label: string };

function ListingSection({ title, listings, agencies }: { title: string; listings: any[]; agencies: AgencyOption[] }) {
  return (
    <div className="mb-10">
      <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-navy mb-0 pb-2 border-b-2 border-orange inline-block">
        {title}
      </h2>
      <div className="bg-white border border-line overflow-x-auto mt-3">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-orange/30">
              {["Thumbnail", "Project", "Price", "Type", "Status", "Actions"].map((h) => (
                <th key={h} className="font-mono text-[11px] uppercase tracking-widest text-orange px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listings.map((listing) => (
              <tr key={listing.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                {/* Thumbnail */}
                <td className="px-4 py-3 w-24">
                  {listing.hero_image_url ? (
                    <div className="relative w-20 h-14 overflow-hidden flex-shrink-0">
                      <Image
                        src={listing.hero_image_url}
                        alt={listing.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-14 bg-navy/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-[9px] text-ink/30 uppercase">No img</span>
                    </div>
                  )}
                </td>

                {/* Project */}
                <td className="px-4 py-3 max-w-[220px]">
                  <p className="font-sans text-sm font-semibold text-orange leading-tight mb-0.5">{listing.name}</p>
                  {listing.developer?.name && (
                    <p className="font-sans text-xs text-ink/50">By: {listing.developer.name}</p>
                  )}
                  <p className="font-sans text-xs text-ink/40">{listing.suburb}, {listing.state}</p>
                </td>

                {/* Price */}
                <td className="px-4 py-3 font-sans text-sm text-ink/70 whitespace-nowrap">
                  {listing.price_display ?? "—"}
                </td>

                {/* Type */}
                <td className="px-4 py-3 font-sans text-sm text-ink/70 whitespace-nowrap">
                  {listing.type ?? "—"}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {listing.is_published ? (
                      <span className="inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-green-500 text-green-600 whitespace-nowrap">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-ink/20 text-ink/40 whitespace-nowrap">
                        Inactive
                      </span>
                    )}
                    {listing.is_featured && (
                      <span className="inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-orange text-orange whitespace-nowrap">
                        Featured
                      </span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <ListingRowActions
                    id={listing.id}
                    slug={listing.slug}
                    category={categorySlug(listing.type)}
                    isPublished={listing.is_published}
                    isFeatured={listing.is_featured}
                    tier={listing.tier ?? null}
                    agencyId={listing.agency_id ?? null}
                    orgName={listing.developer?.name ?? null}
                    listingName={listing.name}
                    agencies={agencies}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
