import Link from "next/link";
import type { Metadata } from "next";

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

      {/* ── Calculator grid — full width ── */}
      <div className="bg-white py-16">
        <div className="container-padded">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-0 border-l border-t border-line">
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
      </div>

      {/* ── Featured Partner — portrait card + landscape banner ── */}
      <div className="bg-[#f5f4f1] py-14 border-t border-line">
        <div className="container-padded">

          {/* Portrait card */}
          <div className="mb-6 inline-block">
            <div className="w-[260px] bg-navy overflow-hidden border border-navy/20">
              <div className="bg-orange px-5 py-4">
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/80 mb-1">Featured Partner</p>
                <p className="font-display font-light text-white text-[1.1rem] leading-tight">
                  Off The Plan<br />
                  <em className="not-italic italic text-orange-200">Partner Network</em>
                </p>
              </div>
              <div className="px-5 py-6">
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/50 leading-[2.4]">
                  Deposit Bonds<br />
                  Finance Brokers<br />
                  Conveyancers<br />
                  Property Managers<br />
                  Buyers Agents
                </p>
              </div>
              <div className="border-t border-white/10 px-5 py-3">
                <Link
                  href="/contact"
                  className="font-mono text-[8px] uppercase tracking-widest text-orange hover:text-orange/70 transition-colors"
                >
                  Become a Partner →
                </Link>
              </div>
            </div>
          </div>

          {/* Landscape banner */}
          <div className="w-full bg-navy flex items-center overflow-hidden border border-navy/20">
            <div className="bg-orange w-2 self-stretch flex-shrink-0" aria-hidden="true" />
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 px-8 py-6 flex-1">
              <div className="flex-1">
                <p className="font-mono text-[9px] uppercase tracking-[0.25em] text-white/50 mb-1">Featured Partner</p>
                <p className="font-display font-light text-white text-[1.2rem] leading-tight">
                  Off The Plan <em className="not-italic italic text-orange">Partner Network</em>
                </p>
                <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-white/45 mt-2 leading-relaxed">
                  Deposit Bonds · Finance Brokers · Conveyancers · Property Managers · Buyers Agents
                </p>
              </div>
              <Link
                href="/contact"
                className="flex-shrink-0 font-mono text-[10px] uppercase tracking-widest border border-white/30 text-white px-6 py-2.5 hover:border-orange hover:text-orange transition-colors whitespace-nowrap"
              >
                Enquire Now
              </Link>
            </div>
          </div>

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
