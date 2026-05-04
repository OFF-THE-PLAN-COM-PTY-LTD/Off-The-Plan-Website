import Link from "next/link";
import Image from "next/image";
import { PropertyCard } from "@/components/property-card";
import { JournalCard } from "@/components/journal-card";
import { AnimateIn } from "@/components/animate-in";
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

const CATEGORIES = [
  { label: "Apartments",     href: "/search?type=Apartment",       image: U("1460317442991-0ec209397118") },
  { label: "Townhouses",     href: "/search?type=Townhouse",       image: U("1512917774080-9991f1c4c750") },
  { label: "House & Land",   href: "/search?type=House+%26+Land",  image: U("1600585154340-be6161a56a0c") },
  { label: "New Apartments", href: "/search?type=Apartment",       image: U("1545324418-cc1a3fa10c00")    },
];

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [{ data: tier1Data }, { data: tier2Data }, { data: articlesData }] = await Promise.all([
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
  ]);

  const tier1 = (tier1Data ?? []).length > 0
    ? (tier1Data as unknown as Development[])
    : MOCK_TIER1;

  const tier2 = (tier2Data ?? []).length > 0
    ? (tier2Data as unknown as Development[])
    : MOCK_TIER2;

  const articles = (articlesData ?? []) as unknown as JournalArticle[];

  return (
    <>
      {/* ─── Hero (unchanged) ──────────────────────────────────────────────── */}
      <section className="relative h-screen flex items-center justify-center bg-navy overflow-hidden">
        <video
          autoPlay muted loop playsInline
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        >
          <source src="/hero-video.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-navy/60" />
        <div className="relative z-10 text-center px-6 flex flex-col items-center gap-6">
          <div className="w-12 h-px bg-orange" aria-hidden="true" />
          <p className="font-mono text-label-lg uppercase tracking-[0.3em] text-ink-light/50">
            Australia&apos;s New Home Portal
          </p>
          <h1 className="font-display font-light text-ink-light leading-[0.9] tracking-tight text-[clamp(56px,9vw,148px)]">
            Off{" "}<em className="not-italic italic text-orange">The</em>{" "}Plan
          </h1>
          <p className="font-sans font-light text-ink-light/70 text-[clamp(16px,1.8vw,22px)] tracking-wide max-w-md">
            Where your future address begins
          </p>
          <div className="w-12 h-px bg-orange" aria-hidden="true" />
        </div>
      </section>

      {/* ─── Section 1: Featured Developments (Tier 1) ─────────────────────── */}
      <section className="bg-navy py-16 md:py-20">
        <div className="container-padded">
          <AnimateIn>
            <p className="font-mono text-[11px] uppercase tracking-widest text-white/40 mb-8">
              Featured Developments
            </p>
          </AnimateIn>

          {/* Row 1: hero card (2/3) + side card (1/3) */}
          <AnimateIn className="mb-3">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
              {tier1[0] && (
                <div className="lg:col-span-2">
                  <PropertyCard
                    development={tier1[0]}
                    layout="featured"
                    imageHeight="h-[540px]"
                  />
                </div>
              )}
              {tier1[1] && (
                <PropertyCard
                  development={tier1[1]}
                  layout="featured"
                  imageHeight="h-[540px]"
                />
              )}
            </div>
          </AnimateIn>

          {/* Row 2: 4 equal cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {tier1.slice(2).map((dev, i) => (
              <AnimateIn key={dev.id} delay={i * 90}>
                <PropertyCard
                  development={dev}
                  layout="featured"
                  imageHeight="h-[300px]"
                />
              </AnimateIn>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 2: Search by Category ─────────────────────────────────── */}
      <section className="bg-cream py-16">
        <div className="container-padded">
          <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40 text-center mb-8">
            Search by Category
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.label}
                href={cat.href}
                className="group relative h-60 overflow-hidden"
              >
                <Image
                  src={cat.image}
                  alt={cat.label}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 50vw, 25vw"
                />
                <div className="absolute inset-0 bg-navy/50 group-hover:bg-navy/30 transition-colors duration-500" />
                <div className="relative h-full flex items-center justify-center">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-white">
                    {cat.label}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Section 3: Latest Listings (Tier 2) ────────────────────────────── */}
      <section className="bg-white py-16 md:py-20">
        <div className="container-padded">
          <AnimateIn>
            <div className="flex items-center justify-between mb-8">
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink/40">
                Latest Listings
              </p>
              <Link
                href="/search"
                className="font-mono text-[11px] uppercase tracking-widest text-ink/40 hover:text-orange transition-colors flex items-center gap-1.5"
              >
                View more listings
                <ChevronRightIcon size={14} />
              </Link>
            </div>
          </AnimateIn>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tier2.map((dev, i) => (
              <AnimateIn key={dev.id} delay={i * 70}>
                <PropertyCard development={dev} layout="tall" />
              </AnimateIn>
            ))}
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
    </>
  );
}
