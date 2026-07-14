import Link from "next/link";
import type { Metadata } from "next";
import { PropertyCard } from "@/components/property-card";
import { AdSlot } from "@/components/ad-slot";
import { LazyGrid } from "./lazy-grid";
import { supabase } from "@/lib/supabase/public";
import { publishedDevelopmentCards } from "@/features/listings/queries";
import { CATEGORY_TO_SLUG, categorySlug } from "@/lib/listing-url";
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
  "Over 55's / Retirement",
];

const PRICE_RANGES = [
  { label: "$0 - $600,000",       value: "0-600000",         min: 0,       max: 600000   },
  { label: "$600,000 - $1 Mil",   value: "600000-1000000",   min: 600000,  max: 1000000  },
  { label: "$1 Mil - $1.5 Mil",   value: "1000000-1500000",  min: 1000000, max: 1500000  },
  { label: "$1.5 Mil - $2.5 Mil", value: "1500000-2500000",  min: 1500000, max: 2500000  },
  { label: "More than $2.5 Mil",  value: "2500000+",         min: 2500000, max: null     },
];

export default async function SearchPage({ searchParams }: SearchPageProps) {
  let query = publishedDevelopmentCards(supabase);

  if (searchParams.suburb) {
    // Strip PostgREST-meaningful characters so user input can't break out of the filter.
    const s = searchParams.suburb.replace(/[(),*"\\]/g, "").slice(0, 80);
    if (s) query = query.or(`suburb.ilike.%${s}%,state.ilike.%${s}%,name.ilike.%${s}%`);
  }
  if (searchParams.state) query = query.eq("state", searchParams.state);
  if (searchParams.type) {
    // Match the category the way the URL scheme does: a category (e.g. "New
    // Apartments") covers every `type` that maps to the same slug (e.g. the
    // legacy "Apartments"), not just an exact string match. Keeps the filter
    // consistent with lib/listing-url.ts so selecting a category returns all
    // of its listings.
    const slug = categorySlug(searchParams.type);
    const types = Object.entries(CATEGORY_TO_SLUG)
      .filter(([, s]) => s === slug)
      .map(([t]) => t);
    query = types.length > 1 ? query.in("type", types) : query.eq("type", searchParams.type);
  }
  if (searchParams.status) query = query.eq("status", searchParams.status);

  // Defensive cap so a giant DB doesn't ship every row to the client.
  query = query.limit(500);

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

  const { data, error } = await query;
  if (error) {
    console.error("[search] Supabase error:", error.message, error.code);
    throw new Error(`Supabase query failed: ${error.message}`);
  }
  const results = (data ?? []) as unknown as Development[];

  const buildFilterUrl = (overrides: Record<string, string | undefined>) => {
    const p = new URLSearchParams();
    const base: Record<string, string> = {};
    if (searchParams.suburb) base.suburb = searchParams.suburb;
    if (searchParams.state) base.state = searchParams.state;
    if (searchParams.type) base.type = searchParams.type;
    if (searchParams.price_range) base.price_range = searchParams.price_range;
    Object.assign(base, overrides);
    Object.entries(base).forEach(([k, v]) => { if (v != null) p.set(k, v); });
    return `/search?${p.toString()}`;
  };

  const selSt  = searchParams.state       ?? "";
  const selCat = searchParams.type        ?? "";
  const selPr  = searchParams.price_range ?? "";

  const Chevron = () => (
    <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 flex-shrink-0" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a2340" strokeWidth="2.5">
      <polyline points="6 9 12 15 18 9"/>
    </svg>
  );

  const sel = "appearance-none bg-white border-0 font-sans text-sm text-[#1a2340] px-4 py-0 pr-8 outline-none cursor-pointer w-full h-full bg-transparent";

  return (
    <div className="min-h-screen bg-cream pt-16">

      {/* ── Search header ── */}
      <div className="shadow-md" style={{ background: "#1a2340" }}>

        {/* Top strip: subtitle + title */}
        <div className="container-search pt-3 pb-1.5">
          <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-white/40 mb-0.5">
            The New Home for Off-The-Plan Property
          </p>
          <h2 className="font-sans font-bold text-base tracking-widest uppercase text-white">
            New Property Search
          </h2>
        </div>

        {/* State quick-tabs */}
        <div className="container-search flex items-center gap-5 py-1.5 border-b border-white/10">
          {AU_STATES.map((st) => (
            <Link
              key={st.abbr}
              href={buildFilterUrl({ state: selSt === st.abbr ? undefined : st.abbr })}
              className={`font-mono text-[10px] uppercase tracking-[0.15em] transition-all pb-0.5 border-b-2 ${
                selSt === st.abbr
                  ? "text-orange border-orange"
                  : "text-white/50 border-transparent hover:text-white hover:border-white/30"
              }`}
            >
              {st.abbr}
            </Link>
          ))}
        </div>

        {/* Filter form */}
        <div className="container-search py-2.5">
          <form method="GET" action="/search" className="flex flex-col md:flex-row md:items-stretch gap-0">

            {/* Suburb */}
            <input
              name="suburb"
              defaultValue={searchParams.suburb}
              placeholder="Suburb, postcode, or project name"
              className="font-sans text-sm text-[#1a2340] placeholder:text-[#1a2340]/40 px-4 py-2 bg-white outline-none w-full md:flex-[2] md:min-w-[220px] border-b md:border-b-0 md:border-r border-[#dde1e9]"
              aria-label="Suburb, postcode, or project name"
            />

            {/* State */}
            <div className="relative w-full md:flex-1 bg-white border-b md:border-b-0 md:border-r border-[#dde1e9] flex items-center">
              <select name="state" defaultValue={selSt} className={sel} aria-label="State">
                <option value="">State</option>
                {AU_STATES.map((st) => (
                  <option key={st.abbr} value={st.abbr}>{st.full}</option>
                ))}
              </select>
              <Chevron />
            </div>

            {/* Category */}
            <div className="relative w-full md:flex-1 bg-white border-b md:border-b-0 md:border-r border-[#dde1e9] flex items-center">
              <select name="type" defaultValue={selCat} className={sel} aria-label="Category">
                <option value="">Category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
              <Chevron />
            </div>

            {/* Price Range */}
            <div className="relative w-full md:flex-1 bg-white border-b md:border-b-0 md:border-r border-[#dde1e9] flex items-center">
              <select name="price_range" defaultValue={selPr} className={sel} aria-label="Price Range">
                <option value="">Price Range</option>
                {PRICE_RANGES.map((r) => (
                  <option key={r.value} value={r.value}>{r.label}</option>
                ))}
              </select>
              <Chevron />
            </div>

            {/* Search */}
            <button
              type="submit"
              style={{ background: "#e85d26" }}
              className="font-mono text-[11px] uppercase tracking-widest px-6 py-3 md:py-2 text-white hover:opacity-90 transition-opacity flex items-center justify-center gap-2 flex-shrink-0 w-full md:w-auto"
            >
              Search
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
              </svg>
            </button>
          </form>

          {/* Active filter pills */}
          {[selSt, selCat, selPr, searchParams.suburb].some(Boolean) && (
            <div className="flex flex-wrap gap-2 mt-2">
              {searchParams.suburb && (
                <Link href={buildFilterUrl({ suburb: undefined })} className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 border border-white/20 text-white/60 hover:border-orange hover:text-orange transition-colors">
                  {searchParams.suburb} <span>×</span>
                </Link>
              )}
              {selSt && (
                <Link href={buildFilterUrl({ state: undefined })} className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 border border-white/20 text-white/60 hover:border-orange hover:text-orange transition-colors">
                  {selSt} <span>×</span>
                </Link>
              )}
              {selCat && (
                <Link href={buildFilterUrl({ type: undefined })} className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 border border-white/20 text-white/60 hover:border-orange hover:text-orange transition-colors">
                  {selCat} <span>×</span>
                </Link>
              )}
              {selPr && (
                <Link href={buildFilterUrl({ price_range: undefined })} className="inline-flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest px-2.5 py-1 border border-white/20 text-white/60 hover:border-orange hover:text-orange transition-colors">
                  {PRICE_RANGES.find((r) => r.value === selPr)?.label} <span>×</span>
                </Link>
              )}
              <Link href="/search" className="font-mono text-[9px] uppercase tracking-widest text-white/30 hover:text-orange transition-colors">
                Clear all
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="container-search py-10">
        <p className="font-mono text-[11px] text-ink/40 mb-8 uppercase tracking-widest">
          {results.length} listing{results.length !== 1 ? "s" : ""}
        </p>

        {results.length > 0 ? (
          (() => {
            // Banner is admin-driven via Admin > Ads Management (page:
            // "listings", position: "middle"). AdSlot returns null when no
            // active ad is configured, so the grid simply gains/loses one
            // tile depending on whether an ad is set — no broken layout.
            const banner = (
              <div key="otp-banner-slot" className="flex items-center justify-center">
                <AdSlot page="listings" position="middle" />
              </div>
            );
            const cards: React.ReactNode[] = results.map((dev) => (
              <PropertyCard key={dev.id} development={dev} layout="tall" imageHeight="aspect-[2/1]" />
            ));
            // Tim (PDF p.4): "This banner needs to be pos. 4 / Currently pos.9".
            // Insert at index 3 so the banner is the 4th tile in the grid.
            // If there are fewer than 4 results, append at the end so it
            // still shows.
            const insertAt = Math.min(3, cards.length);
            cards.splice(insertAt, 0, banner);
            // Reveal cards in batches as the user scrolls — mounting all ~88 at
            // once made opening a preview feel slow (see LazyGrid). Key by the
            // active filters so each new result set starts fresh at the first
            // batch instead of inheriting the previous view's scroll depth.
            return (
              <LazyGrid
                key={JSON.stringify(searchParams)}
                items={cards}
                className="grid grid-cols-1 md:grid-cols-2 gap-10"
              />
            );
          })()
        ) : (
          <div className="text-center py-20">
            <p className="font-display text-section-lg font-light text-navy/30 mb-4">No results</p>
            <p className="font-sans text-body-md text-ink/50 mb-6">
              Try broadening your filters to see more listings.
            </p>
            <Link href="/search" className="btn-ghost inline-block">Clear filters</Link>
          </div>
        )}
      </div>
    </div>
  );
}
