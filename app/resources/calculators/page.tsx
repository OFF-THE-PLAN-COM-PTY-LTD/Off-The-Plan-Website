import Link from "next/link";
import type { Metadata } from "next";
import { AdSlot } from "@/components/ad-slot";
import { supabase } from "@/lib/supabase/public";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Resources | Calculators",
  description: "A collection of calculators to help plan your next investment or home purchase.",
};

const CALCULATORS = [
  {
    label: "Stamp Duty",
    href: "/resources/calculators/stamp-duty",
    icon: (
      <svg width="48" height="48" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="8" y="6" width="18" height="24" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M12 13h10M12 17h10M12 21h6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <circle cx="28" cy="28" r="6" stroke="currentColor" strokeWidth="1.5" />
        <path d="M26 28h4M28 26v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Borrowing Power Calculator",
    href: "/resources/calculators/borrowing-power",
    icon: (
      <svg width="48" height="48" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="7" y="12" width="26" height="18" rx="2" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="20" cy="21" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M7 17h26" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="12" cy="26" r="1.5" fill="currentColor" />
        <circle cx="28" cy="26" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
  {
    label: "Loan Repayment",
    href: "/resources/calculators/loan-repayment",
    icon: (
      <svg width="48" height="48" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M10 30V16l10-8 10 8v14" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
        <rect x="16" y="22" width="8" height="8" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="28" cy="14" r="4" stroke="currentColor" strokeWidth="1.5" />
        <path d="M26.5 14h3M28 12.5v3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Budget Planner",
    href: "/resources/calculators/budget-planner",
    icon: (
      <svg width="48" height="48" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <rect x="8" y="8" width="24" height="26" rx="1.5" stroke="currentColor" strokeWidth="1.5" />
        <path d="M14 16h12M14 20h12M14 24h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        <path d="M12 8v-2M20 8v-2M28 8v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Loan Comparison",
    href: "/resources/calculators/loan-comparison",
    icon: (
      <svg width="48" height="48" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <circle cx="14" cy="20" r="7" stroke="currentColor" strokeWidth="1.5" />
        <circle cx="26" cy="20" r="7" stroke="currentColor" strokeWidth="1.5" />
        <path d="M20 15v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Mortgage Switching Calculator",
    href: "/resources/calculators/mortgage-switching",
    icon: (
      <svg width="48" height="48" viewBox="0 0 40 40" fill="none" aria-hidden="true">
        <path d="M10 20h20M24 14l6 6-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M16 26l-6-6 6-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="20" cy="20" r="1.5" fill="currentColor" />
      </svg>
    ),
  },
];

const HELPFUL_LINKS = [
  { label: "Guides", href: "/guides" },
  { label: "News", href: "/journal" },
  { label: "About", href: "/about" },
  { label: "Listings", href: "/search" },
];

/** Calculator tile grid — extracted so the parent page can decide whether
 *  to wrap it in a 2-col layout (when there's a right-rail ad) or render
 *  it full-width on its own (when there isn't). */
function CalculatorGrid() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-0 border-l border-t border-line">
      {CALCULATORS.map((calc) => (
        <Link
          key={calc.label}
          href={calc.href}
          className="group flex flex-col items-center justify-center text-center border-r border-b border-line px-8 py-12 min-h-[300px] hover:bg-orange/5 transition-all duration-200"
        >
          <span className="text-navy/70 group-hover:text-orange transition-colors duration-200 mb-8">
            {calc.icon}
          </span>
          <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-navy font-semibold mb-10 leading-relaxed">
            {calc.label}
          </p>
          <span className="font-mono text-[10px] uppercase tracking-widest border border-navy text-navy px-6 py-2 group-hover:border-orange group-hover:text-orange group-hover:bg-white transition-all duration-200">
            Learn More
          </span>
        </Link>
      ))}
    </div>
  );
}

export default async function CalculatorsPage() {
  // Check whether there's an active right-rail banner. If not, we skip the
  // sidebar column entirely so the calculator grid uses the full width
  // instead of leaving an empty 300px gap on the right.
  const { data: rightAd } = await supabase
    .from("ads")
    .select("id")
    .eq("page", "resources")
    .eq("position", "right")
    .eq("is_active", true)
    .limit(1);
  const hasRightAd = (rightAd?.length ?? 0) > 0;

  return (
    <div className="min-h-screen bg-cream pt-16">

      {/* ── Page header ── */}
      <div className="bg-[#eeecea] border-b border-line py-14">
        <div className="container-padded">
          <h1 className="font-mono text-[2.2rem] uppercase tracking-[0.18em] text-navy font-medium">
            Resources
          </h1>
        </div>
      </div>

      {/* ── Intro strip — dark navy ── */}
      <div className="bg-navy py-14">
        <div className="container-padded max-w-5xl mx-auto">
          <p className="font-sans text-[20px] leading-[1.7] text-white/85 mb-5">
            We&apos;ve put together a collection of calculators that will allow you to work through a
            number of scenarios and help plan your next investment or home purchases.
          </p>
          <p className="font-sans text-[20px] leading-[1.7] text-white/85">
            Select from the list of helpful calculators below.
          </p>
        </div>
      </div>

      {/* ── Calculator grid (+ right-rail banner if one is configured) ── */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-screen-xl xl:max-w-screen-2xl px-6 md:px-10">
          {hasRightAd ? (
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10 lg:gap-12 xl:gap-16">
              <div className="min-w-0">
                <CalculatorGrid />
              </div>
              <aside className="hidden lg:block">
                <div className="flex flex-col items-end">
                  <AdSlot page="resources" position="right" />
                </div>
              </aside>
            </div>
          ) : (
            <CalculatorGrid />
          )}
        </div>
      </div>

      {/* ── Helpful Links ── (now above the bottom banner per client) */}
      <div className="bg-white border-t border-line py-16">
        <div className="container-padded text-center">
          <p className="font-mono text-[17px] uppercase tracking-[0.28em] text-navy mb-10 font-semibold">
            Helpful Links
          </p>
          <div className="flex flex-wrap justify-center gap-6 md:gap-8">
            {HELPFUL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono text-[13px] uppercase tracking-widest border border-navy text-navy px-12 py-3.5 hover:border-orange hover:text-orange transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Bottom banner — now the last section before the footer per client.
          Admin-controlled, properly sized (970x250 centred) via AdSlot. ── */}
      <div className="bg-[#f5f4f1] py-14 border-t border-line">
        <div className="container-padded">
          <AdSlot page="resources" position="bottom" />
        </div>
      </div>

    </div>
  );
}
