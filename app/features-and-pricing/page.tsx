import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import { ImageAutoSlider } from "@/components/ui/image-auto-slider";
import type { SliderItem } from "@/components/ui/image-auto-slider";
import { MediaKitModal } from "@/components/media-kit-modal";
import { supabase } from "@/lib/supabase/public";
import { UPGRADE_TIERS } from "@/lib/upgrade-tiers";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Pricing | Off The Plan",
  description:
    "Start listing with Off The Plan. Affordable plans for developers, agencies and builders showcasing off-the-plan properties across Australia.",
};

// ── Unsplash helper ───────────────────────────────────────────────────────────
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&h=800&fit=crop&auto=format&q=80`;

// ── Fallback images per category — self-hosted in /public/categories ─────────
const FALLBACKS: Record<string, string> = {
  "New Apartments":          "/categories/category-apartments.jpg",
  Townhouses:                "/categories/category-townhouse.jpg",
  "Land and Estates":        "/categories/category-landestate.jpg",
  Commercial:                "/categories/category-commercial.jpg",
  Houses:                    "/categories/category-house-and-land.jpg",
  "Over 55's / Retirement":  "/categories/category-house-and-land.jpg",
};

function pickImage(
  dev: { hero_image_url?: string | null; images?: { url: string }[] } | null,
  fallback: string,
): string {
  if (!dev) return fallback;
  return dev.images?.find(Boolean)?.url ?? dev.hero_image_url ?? fallback;
}

// ── Feature bullets ────────────────────────────────────────────────────────────
const FEATURES = [
  "Ideal for Apartments, Townhouses, Land Estates",
  "As well as: House and Land, Over 55's / Retirement, and Commercial",
  "Easy to use members dashboard with Lead capture and Analytics",
  "Affordable listing upgrades, banner placements, social media and email marketing options available",
];

// ── Pricing plans ──────────────────────────────────────────────────────────────
// Builders Package was retired 2026-07-09 — see note in
// app/admin/pricing/page.tsx. Only Developer and Agency Listing is
// offered now, and it inherits the orange (highlighted) styling that
// previously distinguished the second card.
const PLANS = [
  {
    id: "developer",
    name: "Developer and Agency Listing",
    price: "$299",
    highlighted: true,
    cta: "List Now",
    features: [
      "1 low fixed rate per listing per month",
      "Ideal for New Apartments, Townhouses, Land and Estates, Commercial",
      "Easy to use dashboard – upload and sell your projects, includes basic analytics and lead capture",
      "6 or 12 month term, with 30-day cancellation policy",
      "List today, simply register, upload your project and begin your subscription with a credit card, (or) contact us for other payment options",
    ],
  },
];

// ── Check icon (inline SVG) ────────────────────────────────────────────────────
function CheckIcon({ orange = false }: { orange?: boolean }) {
  return (
    <svg
      width="16"
      height="16"
      viewBox="0 0 16 16"
      fill="none"
      className="flex-shrink-0 mt-0.5"
      aria-hidden="true"
    >
      <circle cx="8" cy="8" r="7.5" stroke={orange ? "#E07B39" : "#E07B39"} />
      <path
        d="M5 8l2 2 4-4"
        stroke={orange ? "#E07B39" : "#E07B39"}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default async function FeaturesAndPricingPage() {
  // Fetch one real listing image per category type — fall back to Unsplash
  const query = (type: string) =>
    supabase
      .from("developments")
      .select("hero_image_url, images:development_images(url)")
      .eq("type", type)
      .eq("is_published", true)
      .limit(1)
      .single();

  const [
    { data: newAptData },
    { data: thData },
    { data: landData },
    { data: commercialData },
    { data: housesData },
  ] = await Promise.all([
    query("New Apartments"),
    query("Townhouses"),
    query("Land and Estates"),
    query("Commercial"),
    query("Houses"),
  ]);

  // Always use the client-supplied category images (not listing images)
  const CATEGORIES: SliderItem[] = [
    { label: "New Apartments",          href: "/search?type=New+Apartments",                 image: FALLBACKS["New Apartments"]          },
    { label: "Townhouses",              href: "/search?type=Townhouses",                     image: FALLBACKS["Townhouses"]               },
    { label: "Land And Estates",        href: "/search?type=Land+and+Estates",               image: FALLBACKS["Land and Estates"]         },
    { label: "Commercial",              href: "/search?type=Commercial",                     image: FALLBACKS["Commercial"]               },
    { label: "House & Land",            href: "/search?type=Houses",                         image: FALLBACKS["Houses"]                   },
    { label: "Over 55's / Retirement",  href: "/search?type=Over+55%27s+%2F+Retirement",     image: FALLBACKS["Over 55's / Retirement"]   },
  ];

  return (
    <div className="min-h-screen bg-cream pt-16">

      {/* ── 1. Page header ── */}
      <div className="bg-[#eeecea] border-b border-line py-14">
        <div className="container-padded">
          <h1 className="font-mono text-[2.2rem] uppercase tracking-[0.18em] text-navy font-medium">
            Pricing
          </h1>
        </div>
      </div>

      {/* ── 2. Media kit / about section ── */}
      <div className="bg-navy overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2">

          {/* Left — copy, shifted right toward center */}
          <div className="px-6 md:px-10 xl:px-16 py-20 lg:pl-[25%] xl:pl-[28%]">
            <h2 className="font-mono text-[13px] uppercase tracking-[0.25em] text-white font-semibold mb-6">
              Australia&apos;s Home of New Property
            </h2>
            <ul className="space-y-2 mb-8">
              {[
                "Off the plan projects",
                "New Apartments",
                "Land Estates",
                "New Homes",
              ].map((item) => (
                <li key={item} className="flex items-center gap-2 font-sans text-[14px] text-white/75">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
            <div className="flex flex-wrap gap-3 mb-10">
              <MediaKitModal />
              {/* MediaKitModal swaps in for the old mailto: link — opens an
                  in-page form that POSTs to /api/media-kit-request. */}
              <Link
                href="/contact"
                className="font-mono text-[10px] uppercase tracking-widest border border-white/30 text-white px-6 py-2.5 hover:border-white transition-colors"
              >
                Contact Us
              </Link>
            </div>
            <p className="font-sans text-[13px] text-white/50 leading-relaxed max-w-sm">
              <strong className="text-white/70">offtheplan.com.au</strong> is an independently owned
              property portal solely dedicated to showcasing properties, products, services and
              opportunities available nationally off-the-plan
              <sup className="text-[10px]">®</sup>
            </p>
          </div>

          {/* Right — media kit photo, full bleed */}
          <div className="relative min-h-[420px] lg:min-h-0">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/media-kit-photo.jpg"
              alt="Off The Plan Media Kit"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            {/* Subtle left fade to blend with navy */}
            <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-navy to-transparent" />
          </div>

        </div>
      </div>

      {/* ── 3. Features section (white) ── */}
      <div className="bg-white py-16">
        <div className="container-padded">
          <div className="max-w-3xl">
            <h2 className="font-mono text-[13px] uppercase tracking-[0.25em] text-navy font-semibold mb-8">
              Start Listing with Off The Plan
            </h2>
            <ul className="space-y-4 mb-12">
              {FEATURES.map((feature) => (
                <li key={feature} className="flex items-start gap-3">
                  <CheckIcon />
                  <span className="font-sans text-[14px] text-ink/80 leading-relaxed">
                    {feature}
                  </span>
                </li>
              ))}
            </ul>

            {/* CTA banner */}
            <div className="bg-orange flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-7 py-5">
              <div>
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/70 mb-1">
                  Don&apos;t Miss Out
                </p>
                <p className="font-sans text-[15px] text-white leading-snug">
                  Your next buyer may be browsing right now
                  <br />
                  <span className="text-white/80 text-[13px]">
                    ... shame if they found someone else
                  </span>
                </p>
              </div>
              <Link
                href="/list-a-listing"
                className="flex-shrink-0 font-mono text-[10px] uppercase tracking-widest bg-navy text-white px-8 py-3 hover:bg-navy/80 transition-colors whitespace-nowrap"
              >
                List With Us
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* ── 4. Pricing section ── */}
      <div className="bg-navy py-16">
        <div className="container-padded">

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_2fr] gap-12 items-start">

            {/* Left — phone mockup image (desktop only) */}
            <div className="hidden lg:flex items-center justify-center self-stretch overflow-hidden">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/Phone-Mock-05.png"
                alt="Off The Plan on mobile"
                className="h-full w-auto object-contain scale-110"
              />
            </div>

            {/* Right — pricing cards */}
            <div>
              <h2 className="font-mono text-[13px] uppercase tracking-[0.25em] text-white font-semibold mb-8">
                Start Listing with Off The Plan
                <sup className="text-[10px]">®</sup>
              </h2>

              <div className="grid grid-cols-1 gap-0 border border-white/20 max-w-sm mx-auto w-full">
                {PLANS.map((plan) => (
                  // Layout mirrors /admin/pricing: orange header stripe with
                  // the plan name → white body with navy price + grey feature
                  // text → orange CTA button at the bottom. The old "fully
                  // orange" highlighted variant was hard to read (light copy
                  // on orange); this reads cleanly at any viewport.
                  <div key={plan.id} className="flex flex-col bg-white overflow-hidden">
                    {/* Header stripe */}
                    <div className="px-6 py-3 text-center font-mono text-[11px] font-bold uppercase tracking-[0.2em] bg-orange text-white">
                      {plan.name}
                    </div>

                    {/* Body */}
                    <div className="flex flex-col p-7 flex-1">
                      {/* Price */}
                      <div className="mb-5 text-center">
                        <span className="font-display font-light text-[2.8rem] leading-none text-navy">
                          {plan.price}
                        </span>
                        <span className="font-sans text-[13px] ml-1 text-ink/50">
                          /month
                        </span>
                      </div>

                      {/* Features */}
                      <ul className="space-y-3 mb-8 flex-1">
                        {plan.features.map((f) => (
                          <li key={f} className="flex items-start gap-2.5">
                            <svg
                              width="15"
                              height="15"
                              viewBox="0 0 16 16"
                              fill="none"
                              className="flex-shrink-0 mt-0.5"
                              aria-hidden="true"
                            >
                              <circle cx="8" cy="8" r="7.5" stroke="#E07B39" />
                              <path
                                d="M5 8l2 2 4-4"
                                stroke="#E07B39"
                                strokeWidth="1.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </svg>
                            <span className="font-sans text-[12px] leading-relaxed text-ink/70">
                              {f}
                            </span>
                          </li>
                        ))}
                      </ul>

                      {/* CTA button */}
                      <Link
                        href="/list-a-listing"
                        className="font-mono text-[10px] uppercase tracking-widest text-center py-3 border transition-colors bg-orange text-white border-orange hover:bg-orange/90"
                      >
                        {plan.cta}
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* ── 4b. Featured Upgrades — public preview of the 4 add-on tiers
              (Promo Flag, Tier 2, Tier 1, Home Banner). Card UI mirrors the
              member-portal cards but the CTA routes to /list-a-listing
              since prospective members can't request upgrades on a
              listing they don't own yet. ── */}
      <div className="bg-[#eeecea] py-16 border-t border-line">
        <div className="container-padded">
          <div className="text-center mb-10">
            <p className="font-mono text-[11px] uppercase tracking-[0.28em] text-orange/80 mb-2">
              Featured Upgrades
            </p>
            <h2 className="font-mono text-[1.6rem] md:text-[2rem] uppercase tracking-[0.18em] text-navy font-semibold mb-3">
              Stand out from the listings
            </h2>
            <p className="font-sans text-[14px] text-ink/60 max-w-2xl mx-auto leading-relaxed">
              Optional monthly add-ons available to all members. Billed
              alongside your standard subscription.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {UPGRADE_TIERS.map((u) => (
              <div key={u.name} className="bg-white border border-line flex flex-col">
                {/* Header strip */}
                <div className="bg-navy text-white text-center px-4 py-3 font-mono text-[10px] uppercase tracking-[0.18em]">
                  {u.name}
                </div>
                {/* Price */}
                <div className="px-5 pt-5 pb-3 text-center border-b border-line">
                  <span className="font-display font-light text-navy text-[2.6rem] leading-none">
                    ${u.price.toLocaleString()}
                  </span>
                  <span className="font-sans text-ink/40 text-sm ml-1">/month</span>
                </div>
                {/* Illustrative mockup of what the upgrade looks like on the site */}
                <div className="mx-5 mt-4 overflow-hidden border border-line">
                  <Image
                    src={u.image}
                    alt={`${u.name} example`}
                    width={3456}
                    height={9035}
                    className="w-full h-auto"
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                  />
                </div>
                {/* Features */}
                <ul className="px-5 py-5 flex flex-col gap-2.5 flex-1">
                  {u.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="flex-shrink-0 mt-0.5" aria-hidden="true">
                        <circle cx="8" cy="8" r="7.5" stroke="#E07B39" />
                        <path d="M5 8l2 2 4-4" stroke="#E07B39" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                      <span className="font-sans text-[12px] text-ink/70 leading-relaxed">{f}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Single CTA below the cards — prospective members can't request
              an upgrade until they have a listing, so we route them through
              the standard listing-signup flow. */}
          <div className="text-center mt-10">
            <Link
              href="/list-a-listing"
              className="inline-block font-mono text-[10px] uppercase tracking-widest bg-orange text-white px-10 py-4 hover:bg-orange/90 transition-colors"
            >
              List with us to access upgrades
            </Link>
            <p className="font-sans text-[12px] text-ink/40 mt-3">
              Already a member?{" "}
              <Link href="/portal/pricing" className="text-orange hover:underline">
                Request an upgrade in the portal →
              </Link>
            </p>
          </div>
        </div>
      </div>

      {/* ── 5. Our Categories ── */}
      <div className="bg-white py-14">
        <ImageAutoSlider items={CATEGORIES} tileHeight="h-72" />
      </div>

      {/* ── 6. Bottom CTA ── */}
      <div className="bg-navy py-16">
        <div className="container-padded text-center">
          <h2 className="font-mono text-[2rem] md:text-[2.6rem] uppercase tracking-[0.18em] text-white font-semibold mb-5">
            Ready to list your project?
          </h2>
          <p className="font-sans text-[17px] text-white/60 mb-10 max-w-xl mx-auto leading-relaxed">
            Join hundreds of developers and builders already showcasing their
            properties on Off The Plan.
          </p>
          <div className="flex flex-wrap gap-5 justify-center">
            <Link
              href="/list-a-listing"
              className="font-mono text-[11px] uppercase tracking-widest bg-orange text-white px-14 py-4 hover:bg-orange/90 transition-colors"
            >
              List With Us
            </Link>
            <Link
              href="/contact"
              className="font-mono text-[11px] uppercase tracking-widest border border-white/30 text-white px-14 py-4 hover:border-orange hover:text-orange transition-colors"
            >
              Contact Us
            </Link>
          </div>
        </div>
      </div>

    </div>
  );
}
