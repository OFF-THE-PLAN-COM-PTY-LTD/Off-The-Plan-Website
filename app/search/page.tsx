import Link from "next/link";
import type { Metadata } from "next";
import { PropertyCard } from "@/components/property-card";
import { supabase } from "@/lib/supabase/public";
import type { Development } from "@/types/development";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Search Listings",
  description: "Browse off-the-plan apartments, townhouses, and houses across Australia.",
};

interface SearchPageProps {
  searchParams: {
    suburb?: string;
    state?: string;
    price_range?: string;
    type?: string;
    status?: string;
    page?: string;
    view?: string;
  };
}

const PAGE_SIZE = 24;

const AU_STATES = [
  { abbr: "ACT", full: "Australian Capital Territory" },
  { abbr: "NSW", full: "New South Wales" },
  { abbr: "NT",  full: "Northern Territory" },
  { abbr: "QLD", full: "Queensland" },
  { abbr: "SA",  full: "South Australia" },
  { abbr: "TAS", full: "Tasmania" },
  { abbr: "VIC", full: "Victoria" },
  { abbr: "WA",  full: "Western Australia" },
];

const CATEGORIES = [
  "New Apartments",
  "Townhouses",
  "Land and Estates",
  "Commercial",
  "House & Land",
  "New Home Design",
];

const PRICE_RANGES = [
  { label: "$0 - $600,000",       value: "0-600000",         min: 0,       max: 600000   },
  { label: "$600,000 - $1 Mil",   value: "600000-1000000",   min: 600000,  max: 1000000  },
  { label: "$1 Mil - $1.5 Mil",   value: "1000000-1500000",  min: 1000000, max: 1500000  },
  { label: "$1.5 Mil - $2.5 Mil", value: "1500000-2500000",  min: 1500000, max: 2500000  },
  { label: "More than $2.5 Mil",  value: "2500000+",         min: 2500000, max: null     },
];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const view = searchParams.view === "map" ? "map" : "list";

  let query = supabase
    .from("developments")
    .select("*, developer:developers(*), images:development_images(*)")
    .eq("is_published", true);

  if (searchParams.suburb) {
    const s = searchParams.suburb;
    query = query.or(`suburb.ilike.%${s}%,state.ilike.%${s}%`);
  }
  if (searchParams.state) query = query.eq("state", searchParams.state);
  if (searchParams.type)  query = query.eq("type", searchParams.type);
  if (searchParams.status) query = query.eq("status", searchParams.status);

  if (searchParams.price_range) {
    const range = PRICE_RANGES.find((r) => r.value === searchParams.price_range);
    if (range) {
      if (range.max !== null) {
        query = query.lte("price_from", range.max);
      }
      if (range.min > 0) {
        query = query.gte("price_from", range.min);
      }
    }
  }

  query = query.order("is_featured", { ascending: false });

  const { data } = await query;
  const results = (data ?? []) as unknown as Development[];

  const page    = parseInt(searchParams.page ?? "1");
  const totalPages = Math.ceil(results.length / PAGE_SIZE);
  const pageResults = results.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const buildUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams(searchParams as Record<string, string>);
    Object.entries(overrides).forEach(([k, v]) => {
      if (v == null) p.delete(k); else p.set(k, v);
    });
    p.delete("page");
    return `/search?${p.toString()}`;
  };

  const listUrl = buildUrl({ view: undefined });
  const mapUrl  = buildUrl({ view: "map" });

  const selSt  = searchParams.state       ?? "";
  const selCat = searchParams.type        ?? "";
  const selPr  = searchParams.price_range ?? "";

  // shared dropdown class
  const sel = [
    "appearance-none bg-white border border-[#c8cdd8]",
    "font-mono text-[11px] uppercase tracking-widest text-[#1a2340]",
    "px-4 py-2.5 pr-8 outline-none cursor-pointer",
    "hover:border-orange/60 focus:border-orange transition-colors",
    "bg-[url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%231a2340' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E\")] bg-no-repeat bg-[right_12px_center]",
  ].join(" ");

  return (
    <div className="min-h-screen bg-cream pt-16">

      {/* ── Search header bar ── */}
      <div className="sticky top-16 z-30 bg-white border-b border-[#dde1e9] shadow-sm">
        <div className="container-padded pt-5 pb-4">

          {/* List / Map toggle + heading row */}
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="font-sans text-xs text-ink/40 uppercase tracking-widest mb-0.5">
                The New Home for Off-The-Plan Property
              </p>
              <h2 className="font-mono font-bold text-lg uppercase tracking-widest text-[#1a2340]">
                New Property Search
              </h2>
            </div>
            {/* List / Map toggle */}
            <div className="flex border border-[#c8cdd8] overflow-hidden flex-shrink-0">
              <Link
                href={listUrl}
                className={`px-5 py-2 font-mono text-[11px] uppercase tracking-widest transition-colors ${
                  view === "list" ? "bg-[#1a2340] text-white" : "bg-white text-ink/60 hover:text-orange"
                }`}
              >
                List
              </Link>
              <Link
                href={mapUrl}
                className={`px-5 py-2 font-mono text-[11px] uppercase tracking-widest border-l border-[#c8cdd8] transition-colors ${
                  view === "map" ? "bg-[#1a2340] text-white" : "bg-white text-ink/60 hover:text-orange"
                }`}
              >
                Map
              </Link>
            </div>
          </div>

          {/* State abbreviation quick-tabs */}
          <div className="flex items-center gap-4 mb-3">
            {AU_STATES.map((st) => (
              <Link
                key={st.abbr}
                href={buildUrl({ state: selSt === st.abbr ? undefined : st.abbr })}
                className={`font-mono text-[11px] uppercase tracking-widest pb-0.5 border-b-2 transition-colors ${
                  selSt === st.abbr
                    ? "border-orange text-orange"
                    : "border-transparent text-ink/50 hover:text-orange hover:border-orange/40"
                }`}
              >
                {st.abbr}
              </Link>
            ))}
          </div>

          {/* Filter form */}
          <form method="GET" action="/search" className="flex flex-wrap gap-2 items-center">
            {view === "map" && <input type="hidden" name="view" value="map" />}

            {/* Suburb input */}
            <input
              name="suburb"
              defaultValue={searchParams.suburb}
              placeholder="Suburb or postcode"
              className="font-mono text-[11px] uppercase tracking-widest placeholder:normal-case placeholder:tracking-normal border border-[#c8cdd8] px-4 py-2.5 bg-white outline-none focus:border-orange/60 transition-colors w-44"
              aria-label="Suburb"
            />

            {/* State */}
            <select name="state" defaultValue={selSt} className={sel} aria-label="State">
              <option value="">State</option>
              {AU_STATES.map((st) => (
                <option key={st.abbr} value={st.abbr}>{st.full}</option>
              ))}
            </select>

            {/* Category */}
            <select name="type" defaultValue={selCat} className={sel} aria-label="Category">
              <option value="">Category</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>

            {/* Price Range */}
            <select name="price_range" defaultValue={selPr} className={sel} aria-label="Price Range">
              <option value="">Price Range</option>
              {PRICE_RANGES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>

            {/* Search button */}
            <button
              type="submit"
              className="font-mono text-[11px] uppercase tracking-widest px-6 py-2.5 bg-orange text-white hover:bg-orange/90 transition-colors flex items-center gap-2"
            >
              Search
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>
        </div>

        {/* Active filter pills */}
        {[selSt, selCat, selPr, searchParams.suburb].some(Boolean) && (
          <div className="container-padded pb-3 flex flex-wrap gap-2">
            {searchParams.suburb && (
              <Link href={buildUrl({ suburb: undefined })} className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 border border-ink/20 text-ink hover:border-orange hover:text-orange transition-colors">
                {searchParams.suburb} <span>×</span>
              </Link>
            )}
            {selSt && (
              <Link href={buildUrl({ state: undefined })} className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 border border-ink/20 text-ink hover:border-orange hover:text-orange transition-colors">
                {selSt} <span>×</span>
              </Link>
            )}
            {selCat && (
              <Link href={buildUrl({ type: undefined })} className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 border border-ink/20 text-ink hover:border-orange hover:text-orange transition-colors">
                {selCat} <span>×</span>
              </Link>
            )}
            {selPr && (
              <Link href={buildUrl({ price_range: undefined })} className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 border border-ink/20 text-ink hover:border-orange hover:text-orange transition-colors">
                {PRICE_RANGES.find((r) => r.value === selPr)?.label} <span>×</span>
              </Link>
            )}
            <Link href={view === "map" ? "/search?view=map" : "/search"} className="font-mono text-[9px] uppercase tracking-widest text-ink/40 hover:text-orange transition-colors">
              Clear all
            </Link>
          </div>
        )}
      </div>

      {/* ── Map view ── */}
      {view === "map" ? (
        <div className="h-[calc(100vh-8rem)]" />
      ) : (
        /* ── List view ── */
        <div className="container-padded py-10">
          <p className="font-mono text-[11px] text-ink/40 mb-8 uppercase tracking-widest">
            {results.length} listing{results.length !== 1 ? "s" : ""}
          </p>

          {pageResults.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {pageResults.map((dev) => (
                <PropertyCard key={dev.id} development={dev} layout="tall" />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <p className="font-display text-section-lg font-light text-navy/30 mb-4">No results</p>
              <p className="font-sans text-body-md text-ink/50 mb-6">
                Try broadening your filters to see more listings.
              </p>
              <Link href="/search" className="btn-ghost inline-block">Clear filters</Link>
            </div>
          )}

          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-12">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                <Link
                  key={p}
                  href={buildUrl({ page: String(p) })}
                  className={`font-mono text-[11px] px-3 py-1.5 border transition-colors ${
                    p === page
                      ? "bg-[#1a2340] text-white border-[#1a2340]"
                      : "border-[#c8cdd8] text-ink hover:border-orange hover:text-orange"
                  }`}
                  aria-current={p === page ? "page" : undefined}
                >
                  {p}
                </Link>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
