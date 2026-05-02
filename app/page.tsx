import Link from "next/link";
import Image from "next/image";
import { PropertyCard } from "@/components/property-card";
import { JournalCard } from "@/components/journal-card";
import { HeroSearch } from "@/components/hero-search";
import { MemberSignupForm } from "@/components/member-signup-form";
import { Pill } from "@/components/pill";
import { ChevronRightIcon } from "@/components/icons";
import { mockDevelopments, mockJournalArticles } from "@/lib/mock-data";

// When Supabase is connected, replace these with real queries:
// import { createClient } from "@/lib/supabase/server";
// const supabase = createClient();
// const { data: featured } = await supabase.from("developments").select("*,developer:developers(*),images:development_images(*)").eq("is_featured", true).eq("is_published", true).order("updated_at", { ascending: false }).limit(7);

const featured = mockDevelopments.filter((d) => d.is_featured).slice(0, 7);
const trending = mockDevelopments.slice(0, 6);
const articles = mockJournalArticles;

export default function HomePage() {
  const [heroFeatured, ...restFeatured] = featured;
  const gridFeatured = restFeatured.slice(0, 6);

  return (
    <>
      {/* ─── Hero ─────────────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex flex-col justify-end bg-navy overflow-hidden">
        {/* Hero background image */}
        <Image
          src="https://images.unsplash.com/photo-1486325212027-8081e485255e?w=2000&q=85"
          alt="Modern residential architecture"
          fill
          priority
          className="object-cover opacity-40"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_rgba(232,114,44,0.08),_transparent_60%)]" />

        {/* Gradient overlays */}
        <div className="absolute inset-x-0 bottom-0 h-2/3 bg-gradient-to-t from-navy-deep to-transparent" />

        <div className="relative z-10 container-padded pb-10 sm:pb-16 pt-24 sm:pt-32">
          {/* Headline */}
          <div className="max-w-4xl mb-8 sm:mb-10">
            <p className="section-label text-ink-light/40 mb-6">
              Volume 04 · Est. 2014 · 24,000+ Members
            </p>
            <h1 className="font-display font-light text-ink-light leading-none tracking-tight text-[clamp(52px,8vw,120px)]">
              The next address,{" "}
              <em className="not-italic text-orange">discovered early.</em>
            </h1>
            <p className="mt-6 font-sans text-body-lg text-ink-light/60 max-w-xl">
              Australia's curated marketplace for off-the-plan residential real estate.
              Hand-picked developments, editorial insight, and early access for members.
            </p>
          </div>

          {/* Hero Search */}
          <HeroSearch tone="dark" />
        </div>
      </section>

      {/* ─── Featured Developments ────────────────────────────── */}
      <section className="bg-cream py-20 md:py-30">
        <div className="container-padded">
          {/* Section header */}
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-3">Volume 04 · Featured</p>
              <h2 className="font-display font-light text-navy text-section-lg">
                Eight residences, hand-picked
                <br />
                by our editors this fortnight.
              </h2>
            </div>
            <Link
              href="/search"
              className="hidden md:flex items-center gap-2 font-mono text-label-lg uppercase tracking-widest text-ink/40 hover:text-orange transition-colors"
            >
              View all 142
              <ChevronRightIcon size={16} />
            </Link>
          </div>

          {/* Wide card — hero feature */}
          {heroFeatured && (
            <PropertyCard
              development={heroFeatured}
              layout="wide"
              className="mb-6"
            />
          )}

          {/* 2 rows of 3 tall cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {gridFeatured.map((dev, i) => (
              <PropertyCard
                key={dev.id}
                development={dev}
                layout="tall"
                className={i === 1 || i === 4 ? "lg:mt-16" : ""}
              />
            ))}
          </div>

          <div className="mt-8 md:hidden text-center">
            <Link href="/search" className="btn-ghost inline-flex items-center gap-2">
              View all developments
              <ChevronRightIcon size={16} />
            </Link>
          </div>
        </div>
      </section>

      {/* ─── Trending Rail ────────────────────────────────────── */}
      <section className="bg-white py-16 border-t border-b border-line">
        <div className="container-padded mb-8">
          <div className="flex items-center gap-3 mb-3">
            <span className="w-2 h-2 rounded-full bg-orange animate-pulse-dot" aria-hidden="true" />
            <p className="section-label">Live · Trending now</p>
          </div>
          <h2 className="font-display font-light text-navy text-section-lg">
            What buyers are watching this week
          </h2>
        </div>

        {/* Horizontal scroll rail */}
        <div className="flex gap-4 overflow-x-auto px-6 md:px-10 pb-4 scrollbar-none snap-x snap-mandatory">
          {trending.map((dev) => (
            <div key={dev.id} className="flex-shrink-0 w-72 snap-start">
              <PropertyCard development={dev} layout="tall" />
            </div>
          ))}
        </div>
      </section>

      {/* ─── Member Circle Signup ─────────────────────────────── */}
      <section id="circle" className="bg-navy py-20 md:py-30 relative overflow-hidden">
        {/* Decorative grid overlay */}
        <div
          className="absolute inset-0 opacity-5"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 container-padded">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-20">
            {/* Left: value proposition */}
            <div>
              <p className="section-label text-ink-light/30 mb-4">The Member Circle</p>
              <h2 className="font-display font-light text-ink-light text-section-lg mb-6">
                Get there before
                <br />
                everyone else.
              </h2>
              <ul className="flex flex-col gap-4 mb-8">
                {[
                  "Early access to new launches before they reach the market",
                  "Curated fortnightly digest of hand-picked developments",
                  "Market reports and suburb analysis from our editorial team",
                  "Invitations to private developer preview events",
                ].map((benefit) => (
                  <li key={benefit} className="flex items-start gap-3">
                    <span className="mt-1 w-5 h-5 flex-shrink-0 rounded-full border border-orange/50 flex items-center justify-center">
                      <span className="w-1.5 h-1.5 rounded-full bg-orange" />
                    </span>
                    <span className="font-sans text-body-md text-ink-light/70">{benefit}</span>
                  </li>
                ))}
              </ul>
              <p className="font-mono text-label-lg text-ink-light/30 uppercase tracking-widest">
                24,000+ buyers already inside
              </p>
            </div>

            {/* Right: signup form */}
            <div className="lg:pt-12">
              <MemberSignupForm tone="dark" />
            </div>
          </div>
        </div>
      </section>

      {/* ─── Journal ──────────────────────────────────────────── */}
      <section className="bg-cream-alt py-20 md:py-30">
        <div className="container-padded">
          <div className="flex items-end justify-between mb-10">
            <div>
              <p className="section-label mb-3">The Residences Journal</p>
              <h2 className="font-display font-light text-navy text-section-lg">
                Reading for the considered buyer.
              </h2>
            </div>
            <Link
              href="/journal"
              className="hidden md:flex items-center gap-2 font-mono text-label-lg uppercase tracking-widest text-ink/40 hover:text-orange transition-colors"
            >
              All articles
              <ChevronRightIcon size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Feature article */}
            {articles[0] && (
              <div className="md:col-span-1">
                <JournalCard article={articles[0]} variant="feature" />
              </div>
            )}
            {/* Compact articles */}
            <div className="md:col-span-2 flex flex-col">
              {articles.slice(1, 4).map((article) => (
                <JournalCard key={article.id} article={article} variant="compact" />
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
