import Link from "next/link";
import Image from "next/image";
import { PropertyCard } from "@/components/property-card";
import { JournalCard } from "@/components/journal-card";
import { AnimateIn } from "@/components/animate-in";
import { ImageAutoSlider } from "@/components/ui/image-auto-slider";
import type { SliderItem } from "@/components/ui/image-auto-slider";
import { ChevronRightIcon } from "@/components/icons";
import { AdSlot } from "@/components/ad-slot";
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

// Fallback images per category — self-hosted in /public/categories
const CATEGORY_FALLBACKS: Record<string, string> = {
  "New Apartments":          "/categories/category-apartments.jpg",
  Townhouses:                "/categories/category-townhouse.jpg",
  "Land and Estates":        "/categories/category-landestate.jpg",
  Commercial:                "/categories/category-commercial.jpg",
  Houses:                    "/categories/category-house-and-land.jpg",
  "New Home Design":         "/categories/category-house-and-land.jpg",
  // Reusing the apartments image for Over 55's / Retirement until a
  // dedicated category image is supplied — retirement villages are
  // typically apartment-style, so visually it reads OK.
  "Over 55's / Retirement":  "/categories/category-apartments.jpg",
};

function pickImage(dev: { hero_image_url?: string | null; images?: { url: string }[] } | null, fallback: string): string {
  if (!dev) return fallback;
  return dev.images?.find(Boolean)?.url ?? dev.hero_image_url ?? fallback;
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default async function HomePage() {
  const [
    { data: heroBannerData },
    { data: tier1Data },
    { data: tier2Data },
    { data: articlesData },
    { data: newAptData },
    { data: thData },
    { data: landData },
    { data: commercialData },
    { data: housesData },
    { data: newHomeData },
  ] = await Promise.all([
    supabase
      .from("homepage_banners")
      .select("title, link, video_url, desktop_image_url, mobile_image_url, linked_development:developments!linked_development_id(name, slug, suburb, state, developer:developers(name))")
      .order("sort_order", { ascending: true })
      .limit(1)
      .maybeSingle(),
    supabase
      .from("developments")
      .select("*, developer:developers(*), images:development_images(*), floor_plans:development_floor_plans(*)")
      .eq("tier", "1st Tier")
      .eq("is_published", true)
      .order("updated_at", { ascending: false })
      .limit(6),
    supabase
      .from("developments")
      .select("*, developer:developers(*), images:development_images(*), floor_plans:development_floor_plans(*)")
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
      .eq("type", "New Apartments")
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
      .eq("type", "Land and Estates")
      .eq("is_published", true)
      .limit(1)
      .single(),
    supabase
      .from("developments")
      .select("hero_image_url, images:development_images(url)")
      .eq("type", "Commercial")
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
    supabase
      .from("developments")
      .select("hero_image_url, images:development_images(url)")
      .eq("type", "New Home Design")
      .eq("is_published", true)
      .limit(1)
      .single(),
  ]);

  // Always use the client-supplied category images (not listing images)
  const CATEGORIES: SliderItem[] = [
    { label: "New Apartments",          href: "/search?type=New+Apartments",                  image: CATEGORY_FALLBACKS["New Apartments"]          },
    { label: "Townhouses",              href: "/search?type=Townhouses",                      image: CATEGORY_FALLBACKS["Townhouses"]               },
    { label: "Land And Estates",        href: "/search?type=Land+and+Estates",                image: CATEGORY_FALLBACKS["Land and Estates"]         },
    { label: "Commercial",              href: "/search?type=Commercial",                      image: CATEGORY_FALLBACKS["Commercial"]               },
    { label: "House & Land",            href: "/search?type=Houses",                          image: CATEGORY_FALLBACKS["Houses"]                   },
    { label: "New Home Design",         href: "/search?type=New+Home+Design",                 image: CATEGORY_FALLBACKS["New Home Design"]          },
    { label: "Over 55's / Retirement",  href: "/search?type=Over+55%27s+%2F+Retirement",      image: CATEGORY_FALLBACKS["Over 55's / Retirement"]   },
  ];

  // Use mock listings only outside production. In production, an empty tier
  // means no featured listings — the section just doesn't render, which is
  // safer than showing fake Unsplash listings with broken /listings/<slug> links.
  const isProd = process.env.NODE_ENV === "production";
  const tier1 = (tier1Data ?? []).length > 0
    ? (tier1Data as unknown as Development[])
    : isProd
      ? []
      : MOCK_TIER1;

  const tier2 = (tier2Data ?? []).length > 0
    ? (tier2Data as unknown as Development[])
    : isProd
      ? []
      : MOCK_TIER2;

  const articles = (articlesData ?? []) as unknown as JournalArticle[];

  // Derive hero media + overlay text from the first homepage banner (admin-controlled).
  // Falls back to the static /hero-video.mp4 with the default branded overlay
  // when no banner is configured, so the page still works on a fresh DB.
  const heroBanner = heroBannerData as unknown as {
    title: string | null;
    link: string | null;
    video_url: string | null;
    desktop_image_url: string | null;
    mobile_image_url: string | null;
    linked_development:
      | {
          name: string | null;
          slug: string | null;
          suburb: string | null;
          state: string | null;
          developer: { name: string | null } | null;
        }
      | null;
  } | null;

  const heroVideoSrc = heroBanner?.video_url || "/hero-video.mp4";
  const heroPoster = heroBanner?.desktop_image_url || null;
  const linkedDev = heroBanner?.linked_development ?? null;
  const heroHref = linkedDev?.slug ? `/listings/${linkedDev.slug}` : heroBanner?.link || null;
  const heroOverlay = linkedDev
    ? {
        project: linkedDev.name ?? heroBanner?.title ?? "",
        location: [linkedDev.suburb, linkedDev.state].filter(Boolean).join(", "),
        developer: linkedDev.developer?.name ?? "",
      }
    : heroBanner?.title
    ? { project: heroBanner.title, location: "", developer: "" }
    : null;

  return (
    <>
      {/* ─── Hero ──────────────────────────────────────────────────────────── */}
      <section className="relative h-screen flex flex-col bg-navy overflow-hidden">
        {/* Video background. Poster doubles as an image fallback when the
            video file can't load (slow network, codec mismatch, etc.) and
            also displays on the first paint before the video buffers. */}
        <video
          autoPlay muted loop playsInline
          {...(heroPoster ? { poster: heroPoster } : {})}
          className="absolute inset-0 w-full h-full object-cover"
          aria-hidden="true"
        >
          <source src={heroVideoSrc} type="video/mp4" />
          {/* If <video> isn't supported at all, render the poster image. */}
          {heroPoster && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={heroPoster} alt="" className="absolute inset-0 w-full h-full object-cover" />
          )}
        </video>
        <div className="absolute inset-0 bg-navy/60" />

        {/* Whole hero is clickable when a banner has a linked project / link. */}
        {heroHref && (
          <Link
            href={heroHref}
            aria-label={heroOverlay?.project ? `View ${heroOverlay.project}` : "View featured project"}
            className="absolute inset-0 z-10"
          />
        )}

        {/* Hero text — centred in remaining space */}
        <div className="relative z-10 flex-1 flex items-center justify-center text-center px-6 pointer-events-none">
          <div className="flex flex-col items-center gap-6">
            <div className="w-12 h-px bg-orange" aria-hidden="true" />
            <p className="font-brand text-label-lg uppercase tracking-[0.3em] text-ink-light/50">
              Australia&apos;s New Home Portal
            </p>
            <h1 className="font-brand font-normal text-ink-light leading-[0.9] tracking-tight text-[clamp(56px,9vw,148px)]">
              Off{" "}<em className="not-italic italic text-orange">The</em>{" "}Plan<sup className="text-[0.3em] align-super ml-1 font-normal text-ink-light/70">®</sup>
            </h1>
            <p className="font-brand font-normal text-ink-light/70 text-[clamp(16px,1.8vw,22px)] tracking-wide max-w-md">
              Where your future address begins
            </p>
            <div className="w-12 h-px bg-orange" aria-hidden="true" />
          </div>
        </div>

        {/* Featured-project overlay tag — anchored above the search bar.
            Auto-populated from the linked development (Tim's spec:
            'PROJECT NAME – Suburb, State | By Developer'). */}
        {heroOverlay?.project && (
          <div className="relative z-20 px-6 md:px-10 pb-3 pointer-events-none">
            <div className="container-padded">
              <p className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.18em] text-white/70">
                <span className="text-white font-semibold">{heroOverlay.project}</span>
                {heroOverlay.location && <span className="text-white/50"> &nbsp;–&nbsp; {heroOverlay.location}</span>}
                {heroOverlay.developer && <span className="text-white/50"> &nbsp;|&nbsp; By {heroOverlay.developer}</span>}
              </p>
            </div>
          </div>
        )}

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
                  placeholder="Suburb, postcode, or project name"
                  className="font-sans text-sm text-[#1a2340] placeholder:text-[#1a2340]/40 px-4 py-2 bg-white outline-none w-48 border-r border-[#dde1e9] flex-shrink-0"
                  aria-label="Suburb, postcode, or project name"
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
                    {[
                      ["New Apartments", "New Apartments"],
                      ["Townhouses", "Townhouses"],
                      ["Land and Estates", "Land and Estates"],
                      ["Commercial", "Commercial"],
                      ["Houses", "House & Land"],
                      ["New Home Design", "New Home Design"],
                      ["Over 55's / Retirement", "Over 55's / Retirement"],
                    ].map(([value, label]) => (
                      <option key={value} value={value}>{label}</option>
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
              <h2 className="text-white leading-[0.95] tracking-[0.01em] text-[clamp(3rem,6.5vw,6rem)] uppercase font-normal" style={{ fontFamily: "var(--font-bebas-neue), sans-serif" }}>
                Australia&apos;s finest<br />
                <span className="text-orange">off&#8209;the&#8209;plan properties</span>
              </h2>
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

      {/* ─── Bottom ad slot ─────────────────────────────────────────────────── */}
      <section className="bg-cream py-6">
        <div className="container-padded">
          <AdSlot page="home" position="bottom" />
        </div>
      </section>

    </>
  );
}
