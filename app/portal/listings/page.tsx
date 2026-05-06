import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { PortalListingActions } from "./listing-actions";

interface SearchParams { q?: string }

export default async function PortalListings({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const q = searchParams.q?.toLowerCase().trim() ?? "";

  const { data: allData } = await supabaseAdmin
    .from("developments")
    .select("id, name, slug, suburb, state, status, is_published, is_featured, price_display, type, hero_image_url, view_count, phone_click_count, share_count")
    .eq("owner_user_id", user.id)
    .order("name");

  const devIds = (allData ?? []).map((l) => l.id as string);
  const { count: enquiryCount } = devIds.length > 0
    ? await supabaseAdmin
        .from("enquiries")
        .select("*", { count: "exact", head: true })
        .in("development_id", devIds)
    : { count: 0 };

  const all = (allData ?? []) as any[];
  const filtered = q ? all.filter((l) => l.name?.toLowerCase().includes(q)) : all;

  const totalViews = all.reduce((s: number, d: any) => s + (d.view_count ?? 0), 0);
  const totalPhoneClicks = all.reduce((s: number, d: any) => s + (d.phone_click_count ?? 0), 0);
  const totalShares = all.reduce((s: number, d: any) => s + (d.share_count ?? 0), 0);

  const totalCount = all.length;
  const pendingCount = all.filter((l: any) => !l.is_published && l.status !== "Archived").length;
  const publishedCount = all.filter((l: any) => l.is_published).length;
  const archivedCount = all.filter((l: any) => l.status === "Archived").length;

  const featured = filtered.filter((l: any) => l.is_featured && l.is_published);
  const regular = filtered.filter((l: any) => !l.is_featured && l.is_published);
  const pending = filtered.filter((l: any) => !l.is_published && l.status !== "Archived");
  const archived = filtered.filter((l: any) => l.status === "Archived");

  const stats = [
    { label: "All Listing", count: totalCount },
    { label: "Pending", count: pendingCount },
    { label: "Published", count: publishedCount },
    { label: "Archived", count: archivedCount },
  ];

  return (
    <div>
      {/* Page header */}
      <div className="px-1 py-3 mb-4" style={{ background: "#1a2340" }}>
        <h1 className="text-white font-semibold text-base px-4">Listing List</h1>
      </div>

      {/* Add new listing */}
      <div className="mb-4">
        <Link
          href="/portal/new"
          className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 bg-orange text-white hover:bg-orange/90 transition-colors"
        >
          + Add New Listing
        </Link>
      </div>

      {/* Status count cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        {stats.map((s) => (
          <div key={s.label} className="bg-white border border-line p-5 text-center">
            <p className="font-sans text-sm text-ink/60 mb-2">{s.label}</p>
            <p className="font-bold text-[40px] leading-none" style={{ color: "#e85d26" }}>{s.count}</p>
          </div>
        ))}
      </div>

      {/* Performance metric cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div className="bg-white border border-line p-5 flex items-center justify-between">
          <div>
            <p className="font-sans text-sm text-ink/60 mb-1">Total Views</p>
            <p className="font-sans text-xl font-semibold" style={{ color: "#e85d26" }}>{totalViews}</p>
          </div>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-navy/20">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" />
          </svg>
        </div>
        <div className="bg-white border border-line p-5 flex items-center justify-between">
          <div>
            <p className="font-sans text-sm text-ink/60 mb-1">Total Enquiries</p>
            <p className="font-sans text-xl font-semibold" style={{ color: "#e85d26" }}>{enquiryCount ?? 0}</p>
          </div>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-navy/20">
            <path d="M22 16.92v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6l.56-.56a2 2 0 012.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0122 14.92z" />
          </svg>
        </div>
        <div className="bg-white border border-line p-5 flex items-center justify-between">
          <div>
            <p className="font-sans text-sm text-ink/60 mb-1">Phone Clicks</p>
            <p className="font-sans text-xl font-semibold" style={{ color: "#e85d26" }}>{totalPhoneClicks}</p>
          </div>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-navy/20">
            <path d="M15.05 5A5 5 0 0119 8.95M15.05 1A9 9 0 0123 8.94m-1 7.98v3a2 2 0 01-2.18 2 19.79 19.79 0 01-8.63-3.07A19.5 19.5 0 013.07 9.8 19.79 19.79 0 01.22 1.18 2 2 0 012.18 0h3a2 2 0 012 1.72c.127.96.361 1.903.7 2.81a2 2 0 01-.45 2.11L6.91 7.09a16 16 0 006 6z" />
          </svg>
        </div>
        <div className="bg-white border border-line p-5 flex items-center justify-between">
          <div>
            <p className="font-sans text-sm text-ink/60 mb-1">Total Share</p>
            <p className="font-sans text-xl font-semibold" style={{ color: "#e85d26" }}>{totalShares}</p>
          </div>
          <svg width="44" height="44" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2" className="text-navy/20">
            <circle cx="18" cy="5" r="3" /><circle cx="6" cy="12" r="3" /><circle cx="18" cy="19" r="3" />
            <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" /><line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
          </svg>
        </div>
      </div>

      {/* Filter */}
      <div className="bg-white border border-line p-4 mb-6">
        <p className="font-sans text-sm text-ink/50 mb-2">Filter:</p>
        <form method="GET" className="flex items-center gap-3">
          <input
            name="q"
            defaultValue={q}
            placeholder="Project Name Or Agency Org Name (Created By)..."
            className="border border-line px-3 py-2 bg-white font-sans text-sm outline-none focus:border-orange/60 w-full max-w-lg"
          />
          {q && (
            <Link href="/portal/listings" className="font-sans text-sm text-orange hover:underline whitespace-nowrap">
              Reset
            </Link>
          )}
        </form>
      </div>

      {/* Featured Listing */}
      {featured.length > 0 && <ListingSection title="Featured Listing" listings={featured} />}

      {/* Regular Listing */}
      {regular.length > 0 && <ListingSection title="Listing" listings={regular} />}

      {/* Pending / Draft */}
      {pending.length > 0 && <ListingSection title="Pending" listings={pending} />}

      {/* Archived */}
      {archived.length > 0 && <ListingSection title="Archived" listings={archived} />}

      {filtered.length === 0 && (
        <p className="font-sans text-sm text-ink/40 text-center py-16">
          {q ? `No listings found for "${q}"` : "No listings assigned yet. Contact the platform admin to get started."}
        </p>
      )}
    </div>
  );
}

function ListingSection({ title, listings }: { title: string; listings: any[] }) {
  return (
    <div className="mb-10">
      <h2 className="font-mono font-bold text-sm uppercase tracking-widest text-navy pb-2 border-b-2 border-orange inline-block mb-3">
        {title}
      </h2>
      <div className="bg-white border border-line overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-orange/30">
              {["Thumbnail", "Project", "Price", "Type", "Status", "Edit"].map((h) => (
                <th key={h} className="font-mono text-[11px] uppercase tracking-widest text-orange px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {listings.map((l) => (
              <tr key={l.id} className="border-b border-line last:border-0 hover:bg-cream/30 transition-colors">
                <td className="px-4 py-3 w-24">
                  {l.hero_image_url ? (
                    <div className="relative w-20 h-14 overflow-hidden">
                      <Image src={l.hero_image_url} alt={l.name} fill className="object-cover" sizes="80px" />
                    </div>
                  ) : (
                    <div className="w-20 h-14 bg-line flex items-center justify-center">
                      <span className="font-mono text-[9px] text-ink/30 uppercase">No img</span>
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 max-w-[200px]">
                  <p className="font-sans text-sm font-semibold text-orange leading-tight">{l.name}</p>
                  <p className="font-sans text-xs text-ink/40 mt-0.5">{l.suburb}, {l.state}</p>
                </td>
                <td className="px-4 py-3 font-sans text-sm text-ink/70 whitespace-nowrap">
                  {l.price_display ?? "—"}
                </td>
                <td className="px-4 py-3 font-sans text-sm text-ink/70 whitespace-nowrap">
                  {l.type ?? "—"}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {l.is_published ? (
                      <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-green-500 text-green-600 w-fit">Active</span>
                    ) : (
                      <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-ink/20 text-ink/40 w-fit">Draft</span>
                    )}
                    {l.is_featured && (
                      <span className="font-mono text-[9px] uppercase tracking-widest px-2 py-0.5 border border-orange text-orange w-fit">Featured</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <PortalListingActions
                    id={l.id}
                    slug={l.slug}
                    isPublished={l.is_published}
                    isFeatured={l.is_featured}
                    status={l.status ?? null}
                    name={l.name ?? "this listing"}
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
