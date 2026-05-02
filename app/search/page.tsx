import Link from "next/link";
import type { Metadata } from "next";
import { PropertyCard } from "@/components/property-card";
import { supabase } from "@/lib/supabase/public";
import type { Development } from "@/types/development";

export const metadata: Metadata = {
  title: "Search Developments",
  description: "Browse off-the-plan apartments, townhouses, and houses across Australia.",
};

interface SearchPageProps {
  searchParams: {
    suburb?: string;
    state?: string;
    price_max?: string;
    beds_min?: string;
    type?: string;
    status?: string;
    sort?: string;
    page?: string;
    tag?: string;
  };
}

const PAGE_SIZE = 24;

export default async function SearchPage({ searchParams }: SearchPageProps) {

  let query = supabase
    .from("developments")
    .select("*, developer:developers(*), images:development_images(*)")
    .eq("is_published", true);

  if (searchParams.suburb) {
    const s = searchParams.suburb;
    query = query.or(`suburb.ilike.%${s}%,state.ilike.%${s}%`);
  }
  if (searchParams.state) {
    query = query.eq("state", searchParams.state);
  }
  if (searchParams.type) {
    query = query.eq("type", searchParams.type);
  }
  if (searchParams.status) {
    query = query.eq("status", searchParams.status);
  }
  if (searchParams.price_max) {
    const max = parseInt(searchParams.price_max) * 100;
    query = query.or(`price_from.is.null,price_from.lte.${max}`);
  }
  if (searchParams.tag) {
    query = query.eq("tag", searchParams.tag);
  }

  if (searchParams.sort === "price_asc") {
    query = query.order("price_from", { ascending: true });
  } else if (searchParams.sort === "price_desc") {
    query = query.order("price_from", { ascending: false });
  } else {
    query = query.order("is_featured", { ascending: false });
  }

  const { data } = await query;
  const results = (data ?? []) as unknown as Development[];

  const page = parseInt(searchParams.page ?? "1");
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  // Active filters for pills
  const activeFilters = [
    searchParams.suburb && { key: "suburb", label: `Suburb: ${searchParams.suburb}` },
    searchParams.state && { key: "state", label: `State: ${searchParams.state}` },
    searchParams.type && { key: "type", label: searchParams.type },
    searchParams.status && { key: "status", label: searchParams.status },
    searchParams.price_max && { key: "price_max", label: `Up to $${parseInt(searchParams.price_max).toLocaleString()}` },
  ].filter(Boolean) as { key: string; label: string }[];

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParams as Record<string, string>);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v == null) p.delete(k); else p.set(k, v);
    });
    p.delete("page");
    return `/search?${p.toString()}`;
  };

  return (
    <div className="min-h-screen bg-cream pt-16">
      {/* Filter bar */}
      <div className="sticky top-16 z-30 bg-cream/95 backdrop-blur-sm border-b border-line">
        <div className="container-padded py-3 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <form method="GET" action="/search" className="flex flex-wrap gap-2 items-center flex-1">
            <input
              name="suburb"
              defaultValue={searchParams.suburb}
              placeholder="Suburb or postcode"
              className="font-sans text-body-md border border-line px-3 py-1.5 bg-white outline-none focus:border-orange/60 w-full sm:w-40"
              aria-label="Suburb"
            />
            <select
              name="state"
              defaultValue={searchParams.state}
              className="font-mono text-label-lg border border-line px-3 py-1.5 bg-white outline-none cursor-pointer"
              aria-label="State"
            >
              <option value="">All states</option>
              {["VIC", "NSW", "QLD", "WA", "SA"].map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <select
              name="type"
              defaultValue={searchParams.type}
              className="font-mono text-label-lg border border-line px-3 py-1.5 bg-white outline-none cursor-pointer"
              aria-label="Property type"
            >
              <option value="">All types</option>
              {["Apartments", "Townhouses", "Houses", "Penthouses"].map((t) => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
            <select
              name="sort"
              defaultValue={searchParams.sort}
              className="font-mono text-label-lg border border-line px-3 py-1.5 bg-white outline-none cursor-pointer"
              aria-label="Sort"
            >
              <option value="">Featured</option>
              <option value="price_asc">Price: low–high</option>
              <option value="price_desc">Price: high–low</option>
              <option value="newest">Newest</option>
            </select>
            <button type="submit" className="btn-primary py-1.5 px-4">Filter</button>
          </form>

          <Link
            href={`/map?${new URLSearchParams(searchParams as Record<string, string>).toString()}`}
            className="font-mono text-label-lg uppercase tracking-widest text-ink/50 hover:text-orange transition-colors self-start sm:self-auto"
          >
            Map view →
          </Link>
        </div>

        {/* Active filter pills */}
        {activeFilters.length > 0 && (
          <div className="container-padded pb-2 flex flex-wrap gap-2">
            {activeFilters.map((f) => (
              <Link
                key={f.key}
                href={buildUrl({ [f.key]: undefined })}
                className="inline-flex items-center gap-1.5 font-mono text-label-sm uppercase tracking-widest px-2.5 py-1 border border-ink/20 text-ink hover:border-orange hover:text-orange transition-colors"
              >
                {f.label}
                <span aria-hidden="true">×</span>
              </Link>
            ))}
            <Link
              href="/search"
              className="font-mono text-label-sm uppercase tracking-widest text-ink/40 hover:text-orange transition-colors"
            >
              Clear all
            </Link>
          </div>
        )}
      </div>

      <div className="container-padded py-10">
        {/* Result count */}
        <p className="font-mono text-label-lg text-ink/40 mb-8 uppercase tracking-widest">
          {results.length} development{results.length !== 1 ? "s" : ""}
        </p>

        {/* Results grid */}
        {pageResults.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pageResults.map((dev) => (
              <PropertyCard key={dev.id} development={dev} layout="tall" />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="font-display text-section-lg font-light text-navy/30 mb-4">No results</p>
            <p className="font-sans text-body-md text-ink/50 mb-6">
              Try broadening your filters to see more developments.
            </p>
            <Link href="/search" className="btn-ghost inline-block">
              Clear filters
            </Link>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-12">
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <Link
                key={p}
                href={buildUrl({ page: String(p) })}
                className={`font-mono text-label-lg px-3 py-1.5 border transition-colors ${
                  p === page
                    ? "bg-navy text-ink-light border-navy"
                    : "border-line text-ink hover:border-orange hover:text-orange"
                }`}
                aria-current={p === page ? "page" : undefined}
              >
                {p}
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
