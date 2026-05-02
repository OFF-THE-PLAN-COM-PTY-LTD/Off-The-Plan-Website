"use client";

import { mockDevelopments, mockJournalArticles } from "@/lib/mock-data";
import { NavBar } from "@/components/nav-bar";
import { SideRail } from "@/components/side-rail";
import { Footer } from "@/components/footer";
import { PropertyCard } from "@/components/property-card";
import { JournalCard } from "@/components/journal-card";
import { Pill } from "@/components/pill";
import { HeroSearch } from "@/components/hero-search";
import { EnquiryForm } from "@/components/enquiry-form";
import { MemberSignupForm } from "@/components/member-signup-form";

// ─── helpers ──────────────────────────────────────────────────────────────────

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="font-mono text-[9px] uppercase tracking-[0.18em] text-ink/40 mb-4">
      {children}
    </p>
  );
}

function Divider() {
  return <hr className="border-t border-ink/10 my-12" />;
}

// ─── page ─────────────────────────────────────────────────────────────────────

export default function DevPage() {
  const [first, second, third, fourth] = mockDevelopments;
  const [article1, article2, article3] = mockJournalArticles;

  return (
    <div className="bg-[#F7F4EE] min-h-screen">
      {/* Dev banner */}
      <div className="w-full bg-[#E8722C] px-6 py-2.5 text-center">
        <p className="font-mono text-[11px] uppercase tracking-[0.18em] text-[#0E2638]">
          Development Preview — not accessible in production
        </p>
      </div>

      {/* ── NavBar ─────────────────────────────────────────────────────────── */}
      <section className="relative px-6 md:px-10 pt-6 pb-12">
        <SectionLabel>NavBar — tone: light (default), position: sticky</SectionLabel>
        <div className="border border-ink/10 overflow-hidden">
          <NavBar tone="light" position="sticky" />
        </div>

        <div className="mt-10">
          <SectionLabel>NavBar — tone: dark (shown on navy background)</SectionLabel>
          <div className="relative bg-[#0E2638] h-16 overflow-hidden">
            <NavBar tone="dark" position="sticky" />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── SideRail ───────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-12">
        <SectionLabel>SideRail — rendered inline (normally fixed right edge)</SectionLabel>
        <div className="flex gap-10 items-start">
          {/* Light tone */}
          <div className="bg-[#F7F4EE] border border-ink/10 p-6 flex flex-col items-center gap-5 w-20">
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 text-center">
              Light
            </p>
            <SideRailInline tone="light" />
          </div>
          {/* Dark tone */}
          <div className="bg-[#0E2638] border border-ink/10 p-6 flex flex-col items-center gap-5 w-20">
            <p className="font-mono text-[9px] uppercase tracking-widest text-ink-light/30 text-center">
              Dark
            </p>
            <SideRailInline tone="dark" />
          </div>
        </div>
        <p className="font-mono text-[9px] uppercase tracking-widest text-ink/30 mt-4">
          Note: SideRail is fixed-position in real usage — shown here without the scroll-progress tracker.
        </p>
      </section>

      <Divider />

      {/* ── PropertyCard — tall ────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-12">
        <SectionLabel>PropertyCard — layout: tall (default)</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {mockDevelopments.slice(0, 4).map((dev) => (
            <PropertyCard key={dev.id} development={dev} layout="tall" />
          ))}
        </div>
      </section>

      <Divider />

      {/* ── PropertyCard — wide ────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-12">
        <SectionLabel>PropertyCard — layout: wide</SectionLabel>
        <div className="flex flex-col gap-4 max-w-3xl">
          <PropertyCard development={first} layout="wide" />
          <PropertyCard development={second} layout="wide" />
        </div>
      </section>

      <Divider />

      {/* ── PropertyCard — with save ───────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-12">
        <SectionLabel>PropertyCard — with onSave handler (tall)</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl">
          <PropertyCard
            development={third}
            layout="tall"
            isSaved={false}
            onSave={(id) => console.log("save", id)}
          />
          <PropertyCard
            development={fourth}
            layout="tall"
            isSaved={true}
            onSave={(id) => console.log("unsave", id)}
          />
        </div>
      </section>

      <Divider />

      {/* ── JournalCard — feature ──────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-12">
        <SectionLabel>JournalCard — variant: feature</SectionLabel>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl">
          {mockJournalArticles.map((article) => (
            <JournalCard key={article.id} article={article} variant="feature" />
          ))}
        </div>
      </section>

      <Divider />

      {/* ── JournalCard — compact ──────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-12">
        <SectionLabel>JournalCard — variant: compact</SectionLabel>
        <div className="max-w-xl flex flex-col">
          {mockJournalArticles.map((article) => (
            <JournalCard key={article.id} article={article} variant="compact" />
          ))}
        </div>
      </section>

      <Divider />

      {/* ── Pill ───────────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-12">
        <SectionLabel>Pill — all variants</SectionLabel>
        <div className="flex flex-wrap gap-3 items-center">
          <Pill variant="orange">Featured</Pill>
          <Pill variant="orange">Editor's pick</Pill>
          <Pill variant="navy">New launch</Pill>
          <Pill variant="ghost">Trending</Pill>
          <Pill variant="ghost">Register interest</Pill>
          <Pill variant="ghost">Final release</Pill>
          <div className="bg-[#0E2638] px-3 py-1.5">
            <Pill variant="white">Members only</Pill>
          </div>
        </div>
        <div className="mt-4 flex gap-2 flex-wrap font-mono text-[9px] uppercase tracking-widest text-ink/40">
          <span>orange ·</span>
          <span>navy ·</span>
          <span>ghost ·</span>
          <span>white (shown on navy bg)</span>
        </div>
      </section>

      <Divider />

      {/* ── HeroSearch ─────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-12">
        <SectionLabel>HeroSearch — tone: dark (shown on navy)</SectionLabel>
        <div className="bg-[#0E2638] p-12 flex items-center justify-center">
          <HeroSearch tone="dark" />
        </div>

        <div className="mt-10">
          <SectionLabel>HeroSearch — tone: light</SectionLabel>
          <div className="bg-[#F7F4EE] p-12 border border-ink/10 flex items-center justify-center">
            <HeroSearch tone="light" />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── EnquiryForm ────────────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-12">
        <SectionLabel>EnquiryForm</SectionLabel>
        <div className="max-w-sm">
          <EnquiryForm
            developmentId={first.id}
            developmentName={first.name}
          />
        </div>
      </section>

      <Divider />

      {/* ── MemberSignupForm ───────────────────────────────────────────────── */}
      <section className="px-6 md:px-10 pb-12">
        <SectionLabel>MemberSignupForm — tone: dark</SectionLabel>
        <div className="bg-[#0E2638] p-10 max-w-sm">
          <MemberSignupForm tone="dark" />
        </div>

        <div className="mt-10">
          <SectionLabel>MemberSignupForm — tone: light</SectionLabel>
          <div className="bg-white border border-ink/10 p-10 max-w-sm">
            <MemberSignupForm tone="light" />
          </div>
        </div>
      </section>

      <Divider />

      {/* ── Footer ─────────────────────────────────────────────────────────── */}
      <section className="pb-0">
        <div className="px-6 md:px-10 mb-6">
          <SectionLabel>Footer</SectionLabel>
        </div>
        <Footer />
      </section>
    </div>
  );
}

// ─── inline SideRail (static — no scroll tracker) ─────────────────────────────

function SideRailInline({ tone }: { tone: "light" | "dark" }) {
  const isDark = tone === "dark";

  const links = [
    {
      label: "Search",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <circle cx="8" cy="8" r="5.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M12.5 12.5L16 16" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
        </svg>
      ),
    },
    {
      label: "Map",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path
            d="M9 2C6.239 2 4 4.239 4 7c0 4 5 9 5 9s5-5 5-9c0-2.761-2.239-5-5-5z"
            stroke="currentColor"
            strokeWidth="1.3"
          />
          <circle cx="9" cy="7" r="1.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      ),
    },
    {
      label: "Saved",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <path
            d="M9 14.5L3 8.5C3 6 4.8 4 7 4c1.1 0 2.1.5 2.8 1.3L9 6l-.2-.7C9.5 4.5 10.5 4 11.5 4c2.2 0 4 2 4 4.5L9 14.5z"
            stroke="currentColor"
            strokeWidth="1.3"
            strokeLinejoin="round"
          />
        </svg>
      ),
    },
    {
      label: "Enquire",
      icon: (
        <svg width="18" height="18" viewBox="0 0 18 18" fill="none" aria-hidden="true">
          <rect x="2" y="3" width="14" height="10" rx="1.5" stroke="currentColor" strokeWidth="1.3" />
          <path d="M2 5.5L9 10L16 5.5" stroke="currentColor" strokeWidth="1.3" />
        </svg>
      ),
    },
  ];

  return (
    <div
      className={
        isDark
          ? "flex flex-col items-center gap-5 text-[#f7f4ee]/60"
          : "flex flex-col items-center gap-5 text-[#14181d]/40"
      }
    >
      {links.map((link) => (
        <span key={link.label} aria-label={link.label} className="hover:text-[#E8722C] transition-colors cursor-default">
          {link.icon}
        </span>
      ))}
      <div className={isDark ? "w-px h-10 bg-[#f7f4ee]/20" : "w-px h-10 bg-[#14181d]/15"} />
      <div className={isDark ? "w-px h-14 bg-[#f7f4ee]/15" : "w-px h-14 bg-[#14181d]/10"} />
    </div>
  );
}
