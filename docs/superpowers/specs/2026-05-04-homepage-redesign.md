# Homepage Redesign — Spec
**Date:** 2026-05-04  
**Status:** Approved

## Goal
Restructure the homepage to match the reference site (offtheplan.com.au) while keeping the existing branded hero section. Replace the current Featured / Trending Rail / Member Circle sections with five new sections driven by the `tier` column on the `developments` table.

---

## Page Structure

```
<Hero (existing — keep as-is)>
<Section 1: Featured Developments — Tier 1>
<Section 2: Search by Category>
<Section 3: Latest Listings — Tier 2>
<Section 4: Start Listing CTA Banner>
<Section 5: News & Events>
<Footer (existing — keep as-is)>
```

---

## Section 1 — Featured Developments (Tier 1)

- **Background:** navy (`bg-navy`)
- **Header:** mono uppercase label "FEATURED DEVELOPMENTS", no sub-heading
- **Layout:** 3-column × 2-row grid of equal-sized cards (6 total)
- **Card style:** new `featured` layout variant added to `PropertyCard`
  - Full-bleed image with dark gradient overlay at bottom
  - Listing name + suburb/state in white over the image
  - Beds range + price display at bottom of image
  - Status pill overlaid bottom-left
- **Data:** `supabase.from("developments").select(...).eq("tier", "1st Tier").eq("is_published", true).limit(6)`
- **Mock fallback:** if DB returns 0 rows, render 6 inline mock listings (defined in `app/page.tsx`)

---

## Section 2 — Search by Category

- **Background:** cream (`bg-cream`)
- **Header:** mono uppercase label "SEARCH BY CATEGORY", centered
- **Layout:** 4 equal tiles in a row, responsive (2×2 on mobile)
- **Tile design:** fixed-height tile, CSS gradient placeholder background (navy tones per category), dark overlay, category name in white mono uppercase centered
- **Categories and links:**
  | Label | Link |
  |---|---|
  | Apartments | `/search?type=Apartment` |
  | Townhouses | `/search?type=Townhouse` |
  | House & Land | `/search?type=House+%26+Land` |
  | New Apartments | `/search?type=Apartment&tag=New+launch` |
- **Data:** static — no DB query

---

## Section 3 — Latest Listings (Tier 2)

- **Background:** white (`bg-white`)
- **Header:** mono uppercase label "LATEST LISTINGS" left-aligned, "View more listings →" link right-aligned (links to `/search`)
- **Layout:** 4-column grid of 8 cards (2 rows × 4), responsive (1 col mobile, 2 col tablet, 4 col desktop)
- **Card style:** existing `tall` layout of `PropertyCard` — no changes needed
- **Data:** `supabase.from("developments").select(...).eq("tier", "2nd Tier").eq("is_published", true).limit(8)`
- **Mock fallback:** if DB returns 0 rows, render 8 inline mock listings

---

## Section 4 — Start Listing CTA Banner

- **Background:** orange (`bg-orange`)
- **Layout:** full-width, single row — logo/text on left, button on right
- **Left content:** small white Off The Plan logo + heading "Start Listing With Off The Plan" + one-line subtext "Reach thousands of qualified buyers across Australia."
- **Right content:** "Learn More" button with white border, links to `/list-a-listing`
- **Data:** static — no DB query

---

## Section 5 — News & Events

- **Background:** cream-alt (`bg-cream-alt`)
- **Header:** mono uppercase label "NEWS & EVENTS" left-aligned, "View all →" link right-aligned (links to `/journal`)
- **Layout:** 3-column grid of article cards
- **Card style:** existing `JournalCard` component, `compact` variant
- **Data:** existing journal query — `journal_articles`, `is_published = true`, limit 3 (reduced from 4 since we only need 3 for the grid)

---

## Component Changes

### `PropertyCard` — new `featured` layout
Add a third layout option `"featured"` to the existing component:
- Full-bleed image (aspect ratio ~4:3, `h-64`)
- `bg-gradient-to-t from-navy/90 via-navy/30 to-transparent` overlay
- Name + location in white at bottom of image
- Beds + price in white mono text
- Status pill bottom-left
- Heart/save button top-right (same as `tall`)

### `app/page.tsx`
- Remove: `heroFeatured`, `gridFeatured`, trending query, Member Circle section, Trending Rail section
- Add: tier-based queries, mock fallback arrays, five new sections
- Keep: hero section, journal query (repurposed for Section 5)

---

## Mock Data

Two inline arrays in `app/page.tsx` used as fallback when DB is empty:

**`MOCK_TIER1`** (6 items) — realistic Australian off-the-plan projects:
Ellie Residences (VIC), Wish Cove (QLD), Arc Spa (NSW), Saltaire Palm Beach (QLD), Jaba (VIC), Lagoon Main Beach (QLD)

**`MOCK_TIER2`** (8 items) — mix of types and states:
A mix of apartment and townhouse projects across VIC, NSW, QLD, WA

Each mock item includes: id, slug, name, suburb, state, price_display, beds_min, beds_max, status, type, tag, tier, and hero_image_url (null — card shows gradient placeholder).

---

## Files to Change

| File | Change |
|---|---|
| `components/property-card.tsx` | Add `featured` layout variant |
| `app/page.tsx` | Replace post-hero sections with 5 new sections + mock data |
| `types/development.ts` | Add `tier` field to `Development` interface |

No DB migrations needed — `tier` column already exists (migration 006).
