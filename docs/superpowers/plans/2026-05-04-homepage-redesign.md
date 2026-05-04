# Homepage Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the current Featured / Trending Rail / Member Circle sections with five reference-matched sections (Tier 1 grid, Category tiles, Tier 2 grid, CTA banner, News) while keeping the existing hero.

**Architecture:** Three files change — the `Development` type gets a `tier` field, `PropertyCard` gets a new `featured` layout variant, and `app/page.tsx` is fully rewritten with tier-based DB queries and inline mock fallback data.

**Tech Stack:** Next.js App Router (Server Component), Supabase, Tailwind CSS, TypeScript

---

## File Map

| File | Change |
|---|---|
| `types/development.ts` | Add `tier: string \| null` to `Development` interface |
| `components/property-card.tsx` | Add `"featured"` as a third layout option |
| `app/page.tsx` | Full rewrite — new queries, mock data, 5 sections |

---

## Task 1: Add `tier` to Development type

**Files:**
- Modify: `types/development.ts`

- [ ] **Step 1: Add tier field to the Development interface**

In `types/development.ts`, add `tier` after `tag`:

```typescript
export interface Development {
  id: string;
  slug: string;
  name: string;
  suburb: string | null;
  state: AustralianState | null;
  price_from: number | null;
  price_display: string | null;
  beds_min: number | null;
  beds_max: number | null;
  completion_quarter: string | null;
  type: DevelopmentType | null;
  developer_id: string | null;
  tag: DevelopmentTag | null;
  tier: string | null;           // ← add this line
  status: DevelopmentStatus | null;
  // ... rest unchanged
```

- [ ] **Step 2: Commit**

```bash
git add types/development.ts
git commit -m "feat: add tier field to Development type"
```

---

## Task 2: Add `featured` layout to PropertyCard

**Files:**
- Modify: `components/property-card.tsx`

- [ ] **Step 1: Update the layout prop type to include "featured"**

Change the interface:

```typescript
interface PropertyCardProps {
  development: Development;
  layout?: "tall" | "wide" | "featured";
  className?: string;
  onSave?: (id: string) => void;
  isSaved?: boolean;
}
```

- [ ] **Step 2: Add the featured layout block**

Insert this block immediately before the `// Tall (default) layout` comment (after the closing brace of the `wide` block):

```typescript
  if (layout === "featured") {
    return (
      <Link
        href={`/listings/${development.slug}`}
        className={cn("group relative overflow-hidden block", className)}
      >
        <div className="relative h-72 bg-navy overflow-hidden">
          {heroImageUrl ? (
            <Image
              src={heroImageUrl}
              alt={development.name}
              fill
              className="object-cover transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-navy to-navy-mid" />
          )}

          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-navy/90 via-navy/20 to-transparent" />

          {/* Save button */}
          <button
            onClick={handleSave}
            aria-label={saved ? "Remove from saved" : "Save listing"}
            disabled={loading}
            className="absolute top-3 right-3 p-1.5 bg-white/20 hover:bg-white/40 transition-colors disabled:opacity-50"
          >
            <HeartIcon filled={saved} />
          </button>

          {/* Content overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-5">
            <p className="font-mono text-[10px] uppercase tracking-widest text-white/50 mb-1">
              {development.suburb}, {development.state}
            </p>
            <h3 className="font-display text-card-xl font-light text-white group-hover:text-orange/90 transition-colors leading-snug mb-3">
              {development.name}
            </h3>
            <div className="flex flex-wrap items-center gap-3">
              {development.status && (
                <Pill variant={development.status === "Selling now" ? "orange" : "ghost"}>
                  {development.status}
                </Pill>
              )}
              {development.beds_min && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                  {development.beds_min === development.beds_max
                    ? `${development.beds_min} Bed`
                    : `${development.beds_min}–${development.beds_max} Bed`}
                </span>
              )}
              {development.price_display && (
                <span className="font-mono text-[10px] uppercase tracking-widest text-white/60">
                  {development.price_display}
                </span>
              )}
            </div>
          </div>
        </div>
      </Link>
    );
  }
```

- [ ] **Step 3: Commit**

```bash
git add components/property-card.tsx
git commit -m "feat: add featured layout variant to PropertyCard"
```

---

## Task 3: Rewrite app/page.tsx

**Files:**
- Modify: `app/page.tsx`

Replace the entire file contents with the following:

- [ ] **Step 1: Write the new page.tsx**

```typescript
import Link from "next/link";
import { PropertyCard } from "@/components/property-card";
import { JournalCard } from "@/components/journal-card";
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
): Development {
  return {
    id, slug, name, suburb, state, price_display, beds_min, beds_max, status, type,
    tier: null,
    price_from: null, completion_quarter: null, developer_id: null, tag: null,
    summary: null, lifestyle: null, architect: null, interiors: null, landscape: null,
    builder: null, levels: null, residence_count: null, lat: null, lng: null,
    hero_image_url: null, brochure_url: null, is_published: true, is_featured: false,
    created_at: "2024-01-01", updated_at: "2024-01-01",
  };
}

const MOCK_TIER1: Development[] = [
  mockDev("m1", "ellie-residences",    "Ellie Residences",    "South Yarra",  "VIC", "From $750,000",   2, 3, "Selling now", "Apartments"),
  mockDev("m2", "wish-cove",           "Wish Cove",           "Broadbeach",   "QLD", "From $620,000",   1, 2, "Selling now", "Apartments"),
  mockDev("m3", "arc-spa",             "Arc Spa",             "Bondi",        "NSW", "From $1,100,000", 2, 3, "Selling now", "Apartments"),
  mockDev("m4", "saltaire-palm-beach", "Saltaire Palm Beach", "Palm Beach",   "QLD", "From $890,000",   2, 4, "Selling now", "Apartments"),
  mockDev("m5", "jaba",                "Jaba",                "Fitzroy",      "VIC", "From $680,000",   1, 3, "Selling now", "Apartments"),
  mockDev("m6", "lagoon-main-beach",   "Lagoon Main Beach",   "Main Beach",   "QLD", "From $820,000",   2, 3, "Selling now", "Apartments"),
];

const MOCK_TIER2: Development[] = [
  mockDev("m7",  "pines-blacktown",      "Pines Blacktown",      "Blacktown",   "NSW", "From $520,000", 2, 3, "Selling now", "Townhouses"),
  mockDev("m8",  "phoenix-trust",        "Phoenix & Trust",      "Parramatta",  "NSW", "From $599,000", 1, 2, "Selling now", "Apartments"),
  mockDev("m9",  "peligon",              "Peligon",              "West End",    "QLD", "From $489,000", 1, 2, "Selling now", "Apartments"),
  mockDev("m10", "north-village-auburn", "North Village Auburn", "Auburn",      "NSW", "From $650,000", 1, 3, "Selling now", "Apartments"),
  mockDev("m11", "rose-residences",      "Rose Residences",      "St Kilda",    "VIC", "From $710,000", 2, 3, "Selling now", "Apartments"),
  mockDev("m12", "haven-collingwood",    "Haven Collingwood",    "Collingwood", "VIC", "From $580,000", 1, 2, "Selling now", "Apartments"),
  mockDev("m13", "marina-one",           "Marina One",           "Docklands",   "VIC", "From $750,000", 1, 3, "Selling now", "Apartments"),
  mockDev("m14", "bayview-terraces",     "Bayview Terraces",     "Manly",       "NSW", "From $980,000", 2, 4, "Selling now", "Townhouses"),
];

const CATEGORIES = [
  { label: "Apartments",     href: "/search?type=Apartment",        gradient: "from-navy to-navy-mid"    },
  { label: "Townhouses",     href: "/search?type=Townhouse",        gradient: "from-ink to-navy"         },
  { label: "House & Land",   href: "/search?type=House+%26+Land",   gradient: "from-navy-mid to-ink"     },
  { label: "New Apartments", href: "/search?type=Apartment",        gradient: "from-orange to-navy"      },
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
            Australia's New Home Portal
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
          <p className="font-mono text-[11px] uppercase tracking-widest text-white/40 mb-8">
            Featured Developments
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {tier1.map((dev) => (
              <PropertyCard key={dev.id} development={dev} layout="featured" />
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
                className="group relative h-48 overflow-hidden"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${cat.gradient}`} />
                <div className="absolute inset-0 bg-navy/20 group-hover:bg-navy/0 transition-colors duration-300" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {tier2.map((dev) => (
              <PropertyCard key={dev.id} development={dev} layout="tall" />
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
```

- [ ] **Step 2: Commit**

```bash
git add app/page.tsx
git commit -m "feat: rebuild homepage with tier-based sections and mock fallbacks"
```

---

## Task 4: Merge and push to main

- [ ] **Step 1: Merge worktree branch to main and push**

```bash
# From the main worktree at E:\Apex AI Projects\Prac Session
cd "E:\Apex AI Projects\Prac Session"
git merge claude/busy-franklin-a4173b --no-edit
git push origin main
```

Expected output: fast-forward merge, push to GitHub, Vercel deploy triggers.
