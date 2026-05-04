import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Calculators | Resources",
  description: "A collection of calculators to help plan your next investment or home purchase.",
};

const CALCULATORS = [
  {
    label: "Stamp Duty",
    href: "/resources/calculators/stamp-duty",
    icon: (
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
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
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
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
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
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
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
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
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
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
      <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
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
      <div className="bg-[#f0eeeb] border-b border-line py-10">
        <div className="container-padded">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/40">Resources</p>
          <h1 className="font-mono text-[1.6rem] uppercase tracking-[0.15em] text-navy mt-1">
            Calculators
          </h1>
        </div>
      </div>

      {/* ── Intro strip — dark navy ── */}
      <div className="bg-navy py-10">
        <div className="container-padded max-w-3xl">
          <p className="font-sans text-[15px] text-white/80 leading-relaxed mb-3">
            We&apos;ve put together a collection of calculators that will allow you to work through a
            number of scenarios and help plan your next investment or home purchases.
          </p>
          <p className="font-sans text-[15px] text-white/80 leading-relaxed">
            Select from the list of helpful calculators below.
          </p>
        </div>
      </div>

      {/* ── Calculator grid ── */}
      <div className="bg-white py-14">
        <div className="container-padded">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-3xl">
            {CALCULATORS.map((calc) => (
              <Link
                key={calc.label}
                href={calc.href}
                className="group flex flex-col items-center text-center border border-line px-6 py-8 hover:border-orange hover:shadow-md transition-all duration-200"
              >
                <span className="text-ink/40 group-hover:text-orange transition-colors mb-5">
                  {calc.icon}
                </span>
                <p className="font-mono text-[11px] uppercase tracking-widest text-navy font-medium mb-5 leading-snug">
                  {calc.label}
                </p>
                <span className="font-mono text-[9px] uppercase tracking-widest border border-ink/20 text-ink/50 px-4 py-1.5 group-hover:border-orange group-hover:text-orange transition-colors">
                  Learn More
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Helpful Links ── */}
      <div className="bg-cream border-t border-line py-12">
        <div className="container-padded text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-ink/40 mb-6">
            Helpful Links
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            {HELPFUL_LINKS.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                className="font-mono text-[11px] uppercase tracking-widest border border-ink/25 text-ink/60 px-6 py-2 hover:border-orange hover:text-orange transition-colors"
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
