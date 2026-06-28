import Link from "next/link";
import type { Metadata } from "next";
import { AdSlot } from "@/components/ad-slot";

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

export default function CalculatorsPage() {
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
      <div className="bg-navy py-12">
        <div className="container-padded max-w-3xl">
          <p className="font-sans text-[16px] text-white/85 leading-relaxed mb-4">
            We&apos;ve put together a collection of calculators that will allow you to work through a
            number of scenarios and help plan your next investment or home purchases.
          </p>
          <p className="font-sans text-[16px] text-white/85 leading-relaxed">
            Select from the list of helpful calculators below.
          </p>
        </div>
      </div>

      {/* ── Calculator grid + right-rail banner ── */}
      <div className="bg-white py-16">
        <div className="mx-auto max-w-screen-xl xl:max-w-screen-2xl px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px] gap-10 lg:gap-12 xl:gap-16">
            <div className="min-w-0">
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-0 border-l border-t border-line">
                {CALCULATORS.map((calc) => (
                  <Link
                    key={calc.label}
                    href={calc.href}
                    className="group flex flex-col items-center text-center border-r border-b border-line px-8 py-12 hover:bg-orange/3 transition-all duration-200"
                  >
                    {/* Icon */}
                    <span className="text-ink/30 group-hover:text-orange transition-colors duration-200 mb-7">
                      {calc.icon}
                    </span>
                    {/* Label */}
                    <p className="font-mono text-[12px] uppercase tracking-[0.2em] text-navy font-semibold mb-8 leading-relaxed">
                      {calc.label}
                    </p>
                    {/* Learn More button */}
                    <span className="font-mono text-[10px] uppercase tracking-widest border border-navy/40 text-navy/70 px-6 py-2 group-hover:border-orange group-hover:text-orange group-hover:bg-white transition-all duration-200">
                      Learn More
                    </span>
                  </Link>
                ))}
              </div>
            </div>

            {/* Right-rail skyscraper — admin-controlled via Ads Management
                (page: resources, position: right). Renders nothing when no
                active ad is configured. */}
            <aside className="hidden lg:block">
              <div className="flex flex-col items-end">
                <AdSlot page="resources" position="right" />
              </div>
            </aside>
          </div>
        </div>
      </div>

      {/* ── Bottom banner — admin-controlled, properly sized (970x250 centred)
          via AdSlot rather than a stretched full-width hero. ── */}
      <div className="bg-[#f5f4f1] py-14 border-t border-line">
        <div className="container-padded">
          <AdSlot page="resources" position="bottom" />
        </div>
      </div>

      {/* ── Helpful Links ── */}
      <div className="bg-white border-t border-line py-16">
        <div className="container-padded text-center">
          <p className="font-mono text-[13px] uppercase tracking-[0.28em] text-ink/70 mb-8 font-medium">
            Helpful Links
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            {HELPFUL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono text-[12px] uppercase tracking-widest border border-navy/30 text-navy/70 px-10 py-3 hover:border-orange hover:text-orange transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
