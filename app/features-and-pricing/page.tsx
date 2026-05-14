import Link from "next/link";
import type { Metadata } from "next";
import { ImageAutoSlider } from "@/components/ui/image-auto-slider";
import type { SliderItem } from "@/components/ui/image-auto-slider";
import { supabase } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Features and Pricing | Off The Plan",
  description:
    "Start listing with Off The Plan. Affordable plans for developers, agencies and builders showcasing off-the-plan properties across Australia.",
};

// ── Unsplash helper ───────────────────────────────────────────────────────────
const U = (id: string) =>
  `https://images.unsplash.com/photo-${id}?w=1200&h=800&fit=crop&auto=format&q=80`;

// ── Fallback images per category ──────────────────────────────────────────────
const FALLBACKS: Record<string, string> = {
  Apartments:       U("1460317442991-0ec209397118"),
  "New Apartments": U("1600596542815-ffad4c1539a9"),
  Townhouses:       U("1512917774080-9991f1c4c750"),
  Houses:           U("1600585154340-be6161a56a0c"),
  Penthouses:       U("1545324418-cc1a3fa10c00"),
  "Land and Estates": U("1500382017468-9049fed747ef"),
  Commercial:       U("1486325212027-8081e485255e"),
  "New Home Design":  U("1580587771525-78b9dba3b914"),
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
  "As well as: New Home Designs, House and Land, and Commercial",
  "Easy to use members dashboard with Lead capture and Analytics",
  "Affordable listing upgrades, banner placements, social media and email marketing options available",
];

// ── Pricing plans ──────────────────────────────────────────────────────────────
const PLANS = [
  {
    id: "developer",
    name: "Developer and Agency Listing",
    price: "$299",
    highlighted: false,
    cta: "List Now",
    features: [
      "1 low fixed rate per listing per month",
      "Ideal for New Apartments, Townhouses, Land and Estates, Commercial",
      "Easy to use dashboard – upload and sell your projects, includes basic analytics and lead capture",
      "6 or 12 month term, with 30-day cancellation policy",
      "List today, simply register, upload your project and begin your subscription with a credit card, (or) contact us for other payment options",
    ],
  },
  {
    id: "builders",
    name: "Builders Package",
    price: "$399",
    highlighted: true,
    cta: "List Today",
    features: [
      "1 low fixed rate per listing per month",
      "Ideal for: House and Land, New Home Designs",
      "Easy to use dashboard – upload and sell your projects, includes basic analytics and lead capture",
      "Over 12-month terms, with 30-day cancellation policy",
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
    { data: aptData },
    { data: newAptData },
    { data: thData },
    { data: housesData },
    { data: penthouseData },
    { data: landData },
    { data: commercialData },
    { data: newHomeData },
  ] = await Promise.all([
    query("Apartments"),
    query("New Apartments"),
    query("Townhouses"),
    query("Houses"),
    query("Penthouses"),
    query("Land and Estates"),
    query("Commercial"),
    query("New Home Design"),
  ]);

  const CATEGORIES: SliderItem[] = [
    { label: "Apartments",       href: "/search?type=Apartments",         image: pickImage(aptData        as never, FALLBACKS["Apartments"])        },
    { label: "New Apartments",   href: "/search?type=New+Apartments",     image: pickImage(newAptData     as never, FALLBACKS["New Apartments"])    },
    { label: "Townhouses",       href: "/search?type=Townhouses",         image: pickImage(thData         as never, FALLBACKS["Townhouses"])        },
    { label: "House & Land",     href: "/search?type=Houses",             image: pickImage(housesData     as never, FALLBACKS["Houses"])            },
    { label: "Penthouses",       href: "/search?type=Penthouses",         image: pickImage(penthouseData  as never, FALLBACKS["Penthouses"])        },
    { label: "Land And Estates", href: "/search?type=Land+and+Estates",   image: pickImage(landData       as never, FALLBACKS["Land and Estates"])  },
    { label: "Commercial",       href: "/search?type=Commercial",         image: pickImage(commercialData as never, FALLBACKS["Commercial"])        },
    { label: "New Home Design",  href: "/search?type=New+Home+Design",    image: pickImage(newHomeData    as never, FALLBACKS["New Home Design"])   },
  ];

  return (
    <div className="min-h-screen bg-cream pt-16">

      {/* ── 1. Page header ── */}
      <div className="bg-[#eeecea] border-b border-line py-14">
        <div className="container-padded">
          <h1 className="font-mono text-[2.2rem] uppercase tracking-[0.18em] text-navy font-medium">
            Pricing and Plans
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
              <a
                href="/media-kit.pdf"
                className="font-mono text-[10px] uppercase tracking-widest bg-orange text-white px-6 py-2.5 hover:bg-orange/90 transition-colors"
              >
                Download Media Kit
              </a>
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

            {/* Left — phone mockup image */}
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

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-0 border border-white/20">
                {PLANS.map((plan) => (
                  <div
                    key={plan.id}
                    className={`flex flex-col p-7 ${
                      plan.highlighted
                        ? "bg-orange text-white"
                        : "bg-white text-ink border-r border-line"
                    }`}
                  >
                    {/* Plan name */}
                    <p
                      className={`font-mono text-[10px] uppercase tracking-[0.2em] mb-4 leading-relaxed ${
                        plan.highlighted ? "text-white/80" : "text-ink/60"
                      }`}
                    >
                      {plan.name}
                    </p>

                    {/* Price */}
                    <div className="mb-5">
                      <span
                        className={`font-display font-light text-[2.8rem] leading-none ${
                          plan.highlighted ? "text-white" : "text-navy"
                        }`}
                      >
                        {plan.price}
                      </span>
                      <span
                        className={`font-sans text-[13px] ml-1 ${
                          plan.highlighted ? "text-white/70" : "text-ink/50"
                        }`}
                      >
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
                            <circle
                              cx="8"
                              cy="8"
                              r="7.5"
                              stroke={plan.highlighted ? "rgba(255,255,255,0.7)" : "#E07B39"}
                            />
                            <path
                              d="M5 8l2 2 4-4"
                              stroke={plan.highlighted ? "rgba(255,255,255,0.9)" : "#E07B39"}
                              strokeWidth="1.5"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <span
                            className={`font-sans text-[12px] leading-relaxed ${
                              plan.highlighted ? "text-white/85" : "text-ink/70"
                            }`}
                          >
                            {f}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* CTA button */}
                    <Link
                      href="/list-a-listing"
                      className={`font-mono text-[10px] uppercase tracking-widest text-center py-3 border transition-colors ${
                        plan.highlighted
                          ? "border-white text-white hover:bg-white hover:text-orange"
                          : "border-navy/30 text-navy hover:border-orange hover:text-orange"
                      }`}
                    >
                      {plan.cta}
                    </Link>
                  </div>
                ))}
              </div>
            </div>

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
