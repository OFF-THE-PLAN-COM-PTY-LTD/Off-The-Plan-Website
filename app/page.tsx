import Link from "next/link";
import Image from "next/image";
import { PropertyCard } from "@/components/property-card";
import { JournalCard } from "@/components/journal-card";
import { AnimateIn } from "@/components/animate-in";
import { ImageAutoSlider } from "@/components/ui/image-auto-slider";
import type { SliderItem } from "@/components/ui/image-auto-slider";
import { ChevronRightIcon } from "@/components/icons";
import { supabase } from "@/lib/supabase/public";
import type { Development } from "@/types/development";
import type { JournalArticle } from "@/types/journal";

export const dynamic = "force-dynamic";

// ─── Mock fallback data ───────────────────────────────────────────────────────
// Shown when the DB has no tier-tagged listings yet.

function mockDev(
  id: string,
  slug: string,
  name: string,
  suburb: string,
  state: "VIC" | "NSW" | "QLD" | "WA" | "SA",
  price_display: string,
  beds_min: number,
  beds_max: number,
  status: "Selling now" | "Final release" | "Register interest",
  type: "Apartments" | "Townhouses" | "Houses" | "Penthouses",
  imageUrl?: string,
): Development {
  return {
    id, slug, name, suburb, state, price_display, beds_min, beds_max, status, type,
    tier: null,
    price_from: null, completion_quarter: null, developer_id: null, tag: null,
    summary: null, lifestyle: null, architect: null, interiors: null, landscape: null,
    builder: null, levels: null, residence_count: null, lat: null, lng: null,
    hero_image_url: imageUrl ?? null, brochure_url: null, is_published: true, is_featured: false,
    created_at: "2024-01-01", updated_at: "2024-01-01",
  };
}

// Unsplash photo IDs — luxury Australian-style property imagery
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&h=800&fit=crop&auto=format&q=80`;

const MOCK_TIER1: Development[] = [
  mockDev("m1", "ellie-residences",    "Ellie Residences",    "South Yarra",  "VIC", "From $750,000",   2, 3, "Selling now", "Apartments", U("1600596542815-ffad4c1539a9")),
  mockDev("m2", "wish-cove",           "Wish Cove",           "Broadbeach",   "QLD", "From $620,000",   1, 2, "Selling now", "Apartments", U("1613490493576-4c54b1ac4a3f")),
  mockDev("m3", "arc-spa",             "Arc Spa",             "Bondi",        "NSW", "From $1,100,000", 2, 3, "Selling now", "Apartments", U("1560518883-ce09059eeffa")),
  mockDev("m4", "saltaire-palm-beach", "Saltaire Palm Beach", "Palm Beach",   "QLD", "From $890,000",   2, 4, "Selling now", "Apartments", U("1600585154340-be6161a56a0c")),
  mockDev("m5", "jaba",                "Jaba",                "Fitzroy",      "VIC", "From $680,000",   1, 3, "Selling now", "Apartments", U("1545324418-cc1a3fa10c00")),
  mockDev("m6", "lagoon-main-beach",   "Lagoon Main Beach",   "Main Beach",   "QLD", "From $820,000",   2, 3, "Selling now", "Apartments", U("1524230572899-a752b3835840")),
];

const MOCK_TIER2: Development[] = [
  mockDev("m7",  "pines-blacktown",      "Pines Blacktown",      "Blacktown",   "NSW", "From $520,000", 2, 3, "Selling now", "Townhouses", U("1512917774080-9991f1c4c750")),
  mockDev("m8",  "phoenix-trust",        "Phoenix & Trust",      "Parramatta",  "NSW", "From $599,000", 1, 2, "Selling now", "Apartments", U("1493809842364-49f25c093d1c")),
  mockDev("m9",  "peligon",              "Peligon",              "West End",    "QLD", "From $489,000", 1, 2, "Selling now", "Apartments", U("1558618666-fcd25c85cd64")),
  mockDev("m10", "north-village-auburn", "North Village Auburn", "Auburn",      "NSW", "From $650,000", 1, 3, "Selling now", "Apartments", U("1460317442991-0ec209397118")),
  mockDev("m11", "rose-residences",      "Rose Residences",      "St Kilda",    "VIC", "From $710,000", 2, 3, "Selling now", "Apartments", U("1600047509807-ba8f99d2cdde")),
  mockDev("m12", "haven-collingwood",    "Haven Collingwood",    "Collingwood", "VIC", "From $580,000", 1, 2, "Selling now", "Apartments", U("1502672260266-1c1ef2d93688")),
  mockDev("m13", "marina-one",           "Marina One",           "Docklands",   "VIC", "From $750,000", 1, 3, "Selling now", "Apartments", U("1580587771525-78b9dba3b914")),
  mockDev("m14", "bayview-terraces",     "Bayview Terraces",     "Manly",       "NSW", "From $980,000", 2, 4, "Selling now", "Townhouses", U("1538688525198-9b3b1c98d25d")),
];

// Fallback images per category (Unsplash) — used only if no real listing exists for that type
const CATEGORY_FALLBACKS: Record<string, string> = {
  Apartments:   U("1460317442991-0ec209397118"),
  Townhouses:   U("1512917774080-9991f1c4c750"),
  Houses:       U("1600585154340-be6161a56a0c"),
};

function pickImage(dev: { hero_image_url?: string | null; images?: { url: string }[] } | null, fallback: string): string {
  if (!dev) return fallback;
  return dev.images?.find(Boolean)?.url ?? dev.hero_image_url ?? fallback;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [
    { data: tier1Data },
    { data: tier2Data },
    { data: articlesData },
    { data: aptData },
    { data: thData },
    { data: housesData },
  ] = await Promise.all([
    supabase
      .from("developments")
      .select("*, developer:developers(*), images:development_images(*)")
      .eq("tier", "1st Tier")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("developments")
      .select("*, developer:developers(*), images:development_images(*)")
      .eq("tier", "2nd Tier")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(8),
    supabase
      .from("journal_articles")
      .select("*")
      .eq("is_published", true)
      .order("published_at", { ascending: false })
      .limit(3),
    supabase
      .from("developments")
      .select("hero_image_url, images:development_images(url)")
      .eq("type", "Apartments")
      .eq("is_published", true)
      .limit(1)
      .single(),
    supabase
      .from("developments")
      .select("hero_image_url, images:development_images(url)")
      .eq("type", "Townhouses")
      .eq("is_published", true)
      .limit(1)
      .single(),
    supabase
      .from("developments")
      .select("hero_image_url, images:development_images(url)")
      .eq("type", "Houses")
      .eq("is_published", true)
      .limit(1)
      .single(),
  ]);

  const aptImg  = pickImage(aptData    as never, CATEGORY_FALLBACKS.Apartments);
  const thImg   = pickImage(thData     as never, CATEGORY_FALLBACKS.Townhouses);
  const housImg = pickImage(housesData as never, CATEGORY_FALLBACKS.Houses);

  const CATEGORIES: SliderItem[] = [
    { label: "Apartments",     href: "/search?type=Apartments",       image: aptImg  },
    { label: "Townhouses",     href: "/search?type=Townhouses",       image: thImg   },
    { label: "House & Land",   href: "/search?type=Houses",           image: housImg },
    { label: "New Apartments", href: "/search?type=New+Apartments",   image: U("1600596542815-ffad4c1539a9") },
  ];

  const tier1 = (tier1Data ?? []).length > 0
    ? (tier1Data as unknown as Development[])
    : MOCK_TIER1;

  const tier2 = (tier2Data ?? []).length > 0
    ? (tier2Data as unknown as Development[])
    : MOCK_TIER2;

  const articles = (articlesData ?? []) as unknown as JournalArticle[];

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex flex-col bg-navy overflow-hidden">
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-navy/60" />

        {/* Hero text — centred in remaining space */}
        <div className="relative z-10 flex-1 flex items-center justify-center text-center px-6">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-px bg-orange" aria-hidden="true" />
            <p className="font-brand text-label-lg uppercase tracking-[0.3em] text-ink-light/50">
              Australia&apos;s New Home Portal
            </p>
            <h1 className="font-brand font-normal text-ink-light leading-[0.9] tracking-tight text-[clamp(56px,9vw,148px)]">
              Off{" "}<em className="not-italic italic text-orange">The</em>{" "}Plan
            </h1>
            <p className="font-brand font-normal text-ink-light/70 text-[clamp(16px,1.8vw,22px)] tracking-wide max-w-md">
              Where your future address begins
            </p>
            <div className="w-12 h-px bg-orange" aria-hidden="true" />
          </div>
        </div>

        {/* Search bar — overlaid at bottom of hero */}
        <div className="relative z-10">
          {/* gradient fade */}
          <div className="h-16 bg-gradient-to-t from-[#0d1529]/90 to-transparent" />
          <div style={{ background: "rgba(13,21,41,0.92)" }}>
            <div className="container-padded py-3">
              {/* Heading + state tabs row */}
              <div className="flex items-center justify-between mb-2">
                <div>
                  <p className="font-sans text-[9px] uppercase tracking-[0.2em] text-white/40 mb-0.5">
                    The New Home for Off-The-Plan Property
                  </p>
                  <h2 className="font-sans font-bold text-sm tracking-widest uppercase text-white">
                    New Property Search
                  </h2>
                </div>
                <div className="flex items-center gap-4">
                  {["ACT","NSW","NT","QLD","SA","TAS","VIC","WA"].map((abbr) => (
                    <a
                      key={abbr}
                      href={`/search?state=${abbr}`}
                      className="font-mono text-[10px] uppercase tracking-[0.15em] text-white/50 hover:text-orange transition-colors"
                    >
                      {abbr}
                    </a>
                  ))}
                </div>
              </div>
              {/* Input row */}
              <form action="/search" method="GET" className="flex items-stretch gap-0">
                <input
                  name="suburb"
                  placeholder="Suburb or postcode"
                  className="font-sans text-sm text-[#1a2340] placeholder:text-[#1a2340]/40 px-4 py-2 bg-white outline-none w-48 border-r border-[#dde1e9] flex-shrink-0"
                />
                <div className="relative flex-1 bg-white border-r border-[#dde1e9] flex items-center">
                  <select name="state" className="appearance-none bg-transparent font-sans text-sm text-[#1a2340] px-4 py-2 pr-8 outline-none cursor-pointer w-full">
                    <option value="">State</option>
                    {[["ACT","Australian Capital Territory"],["NSW","New South Wales"],["NT","Northern Territory"],["QLD","Queensland"],["SA","South Australia"],["TAS","Tasmania"],["VIC","Victoria"],["WA","Western Australia"]].map(([a,f])=>(
                      <option key={a} value={a}>{f}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a2340" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div className="relative flex-1 bg-white border-r border-[#dde1e9] flex items-center">
                  <select name="type" className="appearance-none bg-transparent font-sans text-sm text-[#1a2340] px-4 py-2 pr-8 outline-none cursor-pointer w-full">
                    <option value="">Category</option>
                    {["New Apartments","Townhouses","Land and Estates","Commercial","House & Land","New Home Design"].map(c=>(
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a2340" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <div className="relative flex-1 bg-white border-r border-[#dde1e9] flex items-center">
                  <select name="price_range" className="appearance-none bg-transparent font-sans text-sm text-[#1a2340] px-4 py-2 pr-8 outline-none cursor-pointer w-full">
                    <option value="">Price Range</option>
                    {[["0-600000","$0 – $600,000"],["600000-1000000","$600,000 – $1 Mil"],["1000000-1500000","$1 Mil – $1.5 Mil"],["1500000-2500000","$1.5 Mil – $2.5 Mil"],["2500000+","More than $2.5 Mil"]].map(([v,l])=>(
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#1a2340" strokeWidth="2.5"><polyline points="6 9 12 15 18 9"/></svg>
                </div>
                <button
                  type="submit"
                  style={{ background: "#e85d26" }}
                  className="font-mono text-[11px] uppercase tracking-widest px-6 py-2 text-white hover:opacity-90 transition-opacity flex items-center gap-2 flex-shrink-0"
                >
                  Search
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Section 1: Featured Developments (Tier 1) ─────────────────────── */}
      <section className="bg-navy pt-16 md:pt-24 pb-10 md:pb-12">
        <div className="container-padded">
          <AnimateIn>
            <div className="mb-12">
              <div className="flex items-center gap-3 mb-5">
                <span className="w-8 h-px bg-orange flex-shrink-0" aria-hidden="true" />
                <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-orange/80">
                  Featured Developments
                </p>
              </div>
              <h2 className="font-display font-light text-white leading-[0.95] tracking-tight text-[clamp(2.2rem,4.5vw,4rem)] mb-6">
                Australia&apos;s finest<br />
                <em className="not-italic italic text-orange">off&#8209;the&#8209;plan properties</em>
              </h2>
              <p className="font-display font-light text-white/50 text-[clamp(1rem,1.4vw,1.2rem)] leading-relaxed max-w-2xl">
                Your future address, carefully chosen{" "}
                <em className="not-italic italic text-white/70">for buyers who won&apos;t settle for ordinary.</em>
              </p>
            </div>
          </AnimateIn>

          {/* 3-col × 2-row equal grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {tier1.map((dev, i) => (
              <AnimateIn key={dev.id} delay={i * 80}>
                <PropertyCard
                  development={dev}
                  layout="featured"
                  imageHeight="h-[500px]"
                />
              </AnimateIn>
            ))}
          </div>

          {/* View All button */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 font-mono text-[13px] font-medium uppercase tracking-widest px-10 py-4 border-2 border-white/30 text-white/70 hover:border-orange hover:text-orange transition-all duration-300"
            >
              View More Properties
              <ChevronRightIcon size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Section 2: Search by Category ─────────────────────────────────── */}
      <section className="bg-cream pt-10 pb-16">
        <ImageAutoSlider items={CATEGORIES} tileHeight="h-72" />
      </section>

      {/* ─── Section 3: Latest Listings (Tier 2) ────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="container-padded">
          <AnimateIn>
            <div className="flex items-center justify-between mb-8">
              <p className="font-mono text-[13px] uppercase tracking-widest text-ink">
                Latest Listings
              </p>
              <Link
                href="/search"
                className="font-mono text-[13px] uppercase tracking-widest text-ink/60 hover:text-orange transition-colors flex items-center gap-2"
              >
                View more listings
                <ChevronRightIcon size={16} />
              </Link>
            </div>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tier2.slice(0, 8).map((dev, i) => (
              <AnimateIn key={dev.id} delay={i * 70}>
                <PropertyCard development={dev} layout="featured" imageHeight="h-[280px]" />
              </AnimateIn>
            ))}
          </div>

          {/* View More Listings button */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 font-mono text-[13px] font-medium uppercase tracking-widest px-10 py-4 border-2 border-ink/20 text-ink/60 hover:border-orange hover:text-orange transition-all duration-300"
            >
              View More Listings
              <ChevronRightIcon size={15} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Section 4: Start Listing CTA ───────────────────────────────────── */}
      <section className="bg-orange py-12">
        <div className="container-padded flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/60 mb-2">
              Off The Plan
            </p>
            <h2 className="font-display font-light text-white text-section-lg mb-1">
              Start Listing With Off The Plan
            </h2>
            <p className="font-sans text-white/80 text-body-md">
              Reach thousands of qualified buyers across Australia.
            </p>
          </div>
          <Link
            href="/list-a-listing"
            className="flex-shrink-0 font-mono text-[11px] uppercase tracking-widest px-6 py-3 border border-white text-white hover:bg-white hover:text-orange transition-colors whitespace-nowrap"
          >
            Learn More
          </Link>
        </div>
      </section>

      {/* ─── Section 5: News & Events ───────────────────────────────────────── */}
      {articles.length > 0 && (
        <section className="bg-cream-alt py-16 md:py-20">
          <div className="container-padded">
            <div className="flex items-center justify-between mb-8">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">
                News &amp; Events
              </p>
              <Link
                href="/journal"
                className="font-mono text-[11px] uppercase tracking-widest text-ink/40 hover:text-orange transition-colors flex items-center gap-1.5"
              >
                View all
                <ChevronRightIcon size={14} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {articles.map((article) => (
                <JournalCard key={article.id} article={article} variant="feature" />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ─── Partner Banner ─────────────────────────────────────────────────── */}
      <section className="bg-cream py-4">
        <div className="container-padded">
          <div className="max-w-3xl mx-auto">
            <Image
              src="/off-the-plan-banner-landscape.png"
              alt="Off The Plan Partner Network"
              width={1200}
              height={200}
              className="w-full h-auto object-contain"
            />
          </div>
        </div>
      </section>
    </>
  );
}
