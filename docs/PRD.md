# Product Requirements Document
## Off The Plan — Website Rebuild
**Version:** 1.0 | **Date:** 2026-05-01 | **Owner:** Tim Whall / Apex AI

---

## 1. Overview

Off The Plan is Australia's curated marketplace for off-the-plan (pre-completion) residential real estate. Established 2014, it serves 24,000+ members with editorial-quality listings, market reports, and early access to launches before they reach the general market.

This PRD covers a full rebuild of the website from the ground up — new design, new stack, new CMS — while preserving the brand's editorial positioning and core audience flows.

**Tone:** Authoritative, understated luxury. Think *Wallpaper* meets property search. Not a portal; a platform.

---

## 2. Goals

| # | Goal | Metric |
|---|------|--------|
| 1 | Increase member circle signups | Signups per month |
| 2 | Increase developer enquiry leads | Enquiries per development |
| 3 | Improve mobile conversion | Mobile bounce rate, time on site |
| 4 | Enable self-serve listing management | Developer CMS usage |
| 5 | Reduce editorial turnaround | Time from draft to published |

---

## 3. Users & Personas

### Buyer — Owner-occupier
Researching off-the-plan apartments or townhouses to live in. Motivated by lifestyle, location, and early pricing. Wants editorial trust signals, floor plans, and easy enquiry.

### Buyer — Investor
Evaluating yield potential and capital growth. Wants suburb data, completion timelines, developer track record.

### Developer / Sales Agent
Listing developments, managing enquiries, tracking leads. Wants a clean self-serve portal.

### Journal Reader
Engaged with the editorial content — market reports, interviews, buyer guides. Often the top-of-funnel entry point.

### Admin / Editorial Team (internal)
Managing listings, publishing journal articles, responding to enquiries. Needs a CMS with low friction.

---

## 4. Site Architecture

```
/                          Homepage
/search                    Development search + filters
/map                       Map view of all live developments
/developments/[slug]       Property dossier (detail page)
/journal                   Journal index
/journal/[slug]            Article detail
/developers                Developer directory
/developers/[slug]         Developer profile
/resources                 Buyer resources (guides, calculators)
/contact                   Contact page
/list-a-development        Developer lead form
/saved                     Saved developments (auth required)
/account                   Member profile (auth required)
/admin                     Internal CMS (restricted)
/admin/developments        Manage listings
/admin/journal             Manage articles
/admin/enquiries           View/manage leads
```

---

## 5. Design System

### Colours

| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#0E2638` | Primary dark, hero sections, footer |
| `navy-deep` | `#081827` | Direction B backgrounds |
| `navy-mid` | `#0b1f30` | Section alternates |
| `orange` | `#E8722C` | Primary accent — CTAs, pills, highlights |
| `cream` | `#F7F4EE` | Light background |
| `cream-alt` | `#fbfaf6` | Section alternates |
| `ink` | `#14181d` | Body text on light |
| `ink-light` | `#f7f4ee` | Body text on dark |
| `line` | `rgba(20,24,29,0.1)` | Borders on light |
| `line-dark` | `rgba(255,255,255,0.08)` | Borders on dark |

### Typography

| Role | Font | Notes |
|------|------|-------|
| Display | Fraunces (serif, Google Fonts) | Headlines, property names, large editorial type |
| Mono | JetBrains Mono | Labels, metadata, pill text, tracking info |
| Body / UI | Inter | Navigation, body copy, form inputs |

**Scale:**
- Hero H1: 80–140px, weight 300, tracking -0.03em
- Section H2: 44–64px, weight 300
- Card titles: 20–28px
- Body: 15–17px, line-height 1.55–1.65
- Mono labels: 9–11px, uppercase, tracking 0.14–0.18em

### Spacing
Use an 8px base grid. Key tokens: 8, 16, 24, 32, 48, 64, 80, 120.

### Shared Components

| Component | Description |
|-----------|-------------|
| `<NavBar>` | Fixed/absolute top bar — logo, nav links, Search, "List a development" CTA |
| `<SideRail>` | Right-edge vertical rail — Quick Access icons (Search, Map, Saved, Compare, Enquire), scroll progress indicator |
| `<HeroSearch>` | Tabbed search panel — suburb input, price filter, category filter, Search button |
| `<PropertyCard>` | Listing card in two layouts: `tall` (grid) and `wide` (editorial feature) |
| `<JournalCard>` | Article card — category badge, thumbnail, date, read time, title |
| `<Footer>` | 5-column footer — logo, Discover, Residences, Industry, About |
| `<Pill>` | Tag badges — Featured, New launch, Trending, Editor's pick, etc. |
| `<EnquiryForm>` | Lead capture — name, email, mobile, buyer type, CTA |
| `<MemberSignupForm>` | Circle join form — name, email, interest type |

---

## 6. Page Requirements

### 6.1 Homepage

Two visual directions exist from the mockups. **Direction A (Editorial)** is the default — cream background, light magazine feel. Direction B (Cinematic/Dark) is available as a theme variant.

#### Hero
- Full-bleed architectural background image (or video)
- Overlay gradient (navy → transparent → navy)
- Headline: *"The next address, discovered early."* — display serif, weight 300, large
- Italic orange accent on key phrase
- Subheading paragraph
- `<HeroSearch>` panel overlaid at hero bottom
- Meta strip: current development name, video indicator, nav controls
- `<SideRail>` visible

#### Featured Developments
- Section label: "Volume 04 · Featured" (mono, uppercase)
- H2: "Eight residences, hand-picked by our editors this fortnight."
- "View all 142 →" link
- 1 wide `<PropertyCard>` (featured hero)
- 2 rows of 3 `<PropertyCard>` (tall), middle card offset +64px vertically
- Scroll-reveal animation on viewport entry

#### Trending Rail
- Section label: "Live · Trending now" with pulsing dot
- H2: "What buyers are watching this week"
- Horizontal scrollable rail of `<PropertyCard>` at 300px width
- Left/right navigation arrows
- White background, bordered top and bottom

#### Member Circle Signup
- Navy background section with decorative grid overlay
- Two-column: value proposition left, signup form right
- Left: headline + 4 bullet benefits + social proof "24,000+ buyers"
- Right: name, email, buyer type dropdown, "Join the circle" CTA

#### Journal
- Section label: "The Residences Journal"
- H2: "Reading for the considered buyer."
- Grid: 1 large feature article + 2 secondary compact articles
- `<JournalCard>` with category, date, read time, title

#### Footer
- Navy background, 5-column grid: logo + description, Discover, Residences, Industry, About
- Copyright bar with Privacy, Terms, Anti-Money Laundering links

---

### 6.2 Development Search (`/search`)

- Sticky top filter bar: suburb/postcode, state, price range, beds, type, status
- Sort options: Featured, Price low–high, Price high–low, Newest
- 3-column `<PropertyCard>` grid (desktop), 2-column (tablet), 1-column (mobile)
- Active filters shown as dismissible pills
- Result count display
- Pagination: 24 per page
- Empty state with broaden-filters suggestion
- "Map view" toggle links to `/map` with same filters

Filter state is synced to URL query params — fully shareable links.

---

### 6.3 Map View (`/map`)

- Full-screen Mapbox GL JS map
- Orange development pins, clustered at low zoom
- Click pin → sidebar `<PropertyCard>` (links to dossier)
- Collapsible filter panel (same filters as `/search`)
- "List view" toggle → back to `/search`
- Map styled to match the dark navy brand theme

---

### 6.4 Property Dossier (`/developments/[slug]`)

**Hero Gallery**
- Full-bleed hero (680px), gradient overlay, `<NavBar>` dark tone
- "Back to discover" button, dossier ID label, status + tag pills
- Development name at 104px display serif, suburb + developer meta
- 4 gallery thumbnails (click to cycle main image)

**Spec Strip**
- 4 KPIs in a horizontal row: From (price), Beds, Type, Completion

**Overview + Enquiry**
- Two-column: editorial content left, sticky enquiry card right
- Left: H2, 2–3 paragraphs, 6-item spec grid (Architect, Interiors, Landscape, Builder, Levels, Residences)
- Right (sticky): "Speak with a Specialist" — name, email, mobile, buyer type, "Request price guide" CTA + "Book a private inspection" ghost button, avg. response time badge

**Floor Plans**
- 4-column typology grid: plan image, type label, config, internal m², price from
- "Download price guide (PDF)" button

**Amenities**
- Two-column: amenities list with orange check circles + amenity render image

**Location**
- Two-column: Mapbox embed + walkability list with distances and category tags

**Similar Developments**
- 3-up `<PropertyCard>` grid — same state or type, excluding current

---

### 6.5 Journal Index (`/journal`)

- Hero with current issue number and date
- 4-column `<JournalCard>` grid for latest articles
- Category filter tabs: Editorial, Market, Interview, Guide
- Pagination

---

### 6.6 Journal Article (`/journal/[slug]`)

- Full-width hero image
- Category, date, read time metadata
- Title (display serif, large)
- Author byline
- Body content (rich text rendered from CMS)
- Related articles 3-up at bottom

---

### 6.7 Developer Hub (`/developers`)

- Grid of developer cards: logo, name, active development count
- Filter by state
- "List a development" CTA prominent

---

### 6.8 Developer Profile (`/developers/[slug]`)

- Header: logo, name, description, ABN, track record
- Grid of their developments using `<PropertyCard>`

---

### 6.9 List a Development (`/list-a-development`)

Lead capture form — not self-serve at v1 launch.

Fields: contact name, email, company, phone, development name, suburb, state, residence count, expected completion, notes.

Submit → Supabase `developer_leads` record + email notification to admin.

---

### 6.10 Saved (`/saved`)

Auth-gated. Shows all bookmarked developments (heart icon on `<PropertyCard>`). Empty state with CTA to browse.

---

### 6.11 Account (`/account`)

Auth-gated. Member profile: name, email, interest type, notification preferences, change password, unsubscribe from Circle.

---

### 6.12 Admin CMS (`/admin`)

Internal only, role-gated (`is_admin` on `profiles`).

**Developments** — table with status, enquiry count, edit/publish toggle; full edit form with image upload + floor plan upload.

**Journal** — article list with publish status; TipTap rich text editor, hero image upload, category + publish date.

**Enquiries** — table with development, buyer name, email, date; status updates (new → contacted → closed).

**Members** — Circle member list, CSV export.

**Leads** — developer lead form submissions.

---

## 7. Data Model (Supabase / PostgreSQL)

### `developments`
```sql
id                uuid         PK
slug              text         UNIQUE NOT NULL
name              text         NOT NULL
suburb            text
state             text         -- VIC | NSW | QLD | WA | SA
price_from        int          -- in cents
price_display     text         -- e.g. "$1.45M"
beds_min          int
beds_max          int
completion_quarter text        -- e.g. "Q4 2027"
type              text         -- Apartments | Townhouses | Houses | Penthouses
developer_id      uuid         FK developers
tag               text         -- Featured | New launch | Trending | etc.
status            text         -- Selling now | Final release | Register interest
summary           text
lifestyle         text[]
architect         text
interiors         text
landscape         text
builder           text
levels            int
residence_count   int
lat               decimal
lng               decimal
is_published      boolean      DEFAULT false
is_featured       boolean      DEFAULT false
created_at        timestamptz  DEFAULT now()
updated_at        timestamptz  DEFAULT now()
```

### `development_images`
```sql
id               uuid  PK
development_id   uuid  FK developments
url              text
caption          text
sort_order       int
is_hero          boolean DEFAULT false
```

### `development_floor_plans`
```sql
id               uuid  PK
development_id   uuid  FK developments
plan_type        text  -- "Type 01"
config           text  -- "1 bed, 1 bath"
internal_sqm     int
price_from       int
image_url        text
```

### `developers`
```sql
id           uuid  PK
slug         text  UNIQUE
name         text
description  text
logo_url     text
website      text
abn          text
state        text
is_published boolean DEFAULT false
created_at   timestamptz DEFAULT now()
```

### `journal_articles`
```sql
id               uuid  PK
slug             text  UNIQUE
title            text
category         text  -- Editorial | Market | Interview | Guide
hero_image_url   text
body_html        text
author           text
read_time_minutes int
published_at     timestamptz
is_published     boolean DEFAULT false
created_at       timestamptz DEFAULT now()
```

### `profiles` (extends `auth.users`)
```sql
id               uuid  PK  FK auth.users
full_name        text
interest_type    text  -- Owner-occupier | Investor | Developer | Agent
is_circle_member boolean DEFAULT false
is_admin         boolean DEFAULT false
joined_at        timestamptz DEFAULT now()
```

### `saved_developments`
```sql
id               uuid  PK
user_id          uuid  FK profiles
development_id   uuid  FK developments
saved_at         timestamptz DEFAULT now()
UNIQUE (user_id, development_id)
```

### `enquiries`
```sql
id               uuid  PK
development_id   uuid  FK developments
full_name        text
email            text
mobile           text
buyer_type       text
notes            text
status           text  DEFAULT 'new'  -- new | contacted | closed
created_at       timestamptz DEFAULT now()
```

### `circle_signups`
```sql
id               uuid  PK
full_name        text
email            text  UNIQUE
interest_type    text
source           text
created_at       timestamptz DEFAULT now()
```

### `developer_leads`
```sql
id                  uuid  PK
contact_name        text
email               text
company             text
phone               text
development_name    text
suburb              text
state               text
residence_count     int
expected_completion text
notes               text
status              text  DEFAULT 'new'
created_at          timestamptz DEFAULT now()
```

---

## 8. Auth & Access

| Area | Access |
|------|--------|
| Homepage, search, development pages, journal | Public |
| `/saved`, `/account` | Supabase Auth required |
| `/admin/*` | Supabase Auth + `is_admin = true` |
| API: enquiry submit, circle signup | Public with rate limiting |
| API: create/update developments | Admin JWT required |

Auth provider: Supabase Auth — email/password + magic link.

---

## 9. API Routes (Next.js Route Handlers)

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/enquiries` | POST | Submit property enquiry |
| `/api/circle` | POST | Join the Circle |
| `/api/leads` | POST | List a development lead form |
| `/api/saved` | GET / POST / DELETE | Save/unsave a development (auth) |
| `/api/search` | GET | Search developments |
| `/api/admin/developments` | GET / POST / PATCH | Admin CRUD (admin role) |
| `/api/admin/journal` | GET / POST / PATCH | Admin journal CRUD |
| `/api/admin/enquiries` | GET / PATCH | Admin enquiry management |

---

## 10. Integrations

| Integration | Purpose | When |
|-------------|---------|------|
| Supabase Storage | Development images, floor plan PDFs, logo uploads | Phase 1 |
| Mapbox GL JS | Map view, location embed on property page | Phase 3 |
| Resend | Transactional email — enquiry confirmations, circle welcome | Phase 2 |
| Vercel Analytics | Page views, user flows | Phase 1 |
| Google Fonts | Fraunces, JetBrains Mono, Inter | Phase 1 |

---

## 11. SEO Requirements

- Unique `<title>`, `<meta description>`, OG image for each development and article
- Dynamic sitemap at `/sitemap.xml`
- `RealEstateListing` structured data on development pages
- `Article` structured data on journal pages
- Clean slug-based URLs
- Server-side rendering for all public pages via Next.js App Router + Supabase server components
- All images via `next/image` with correct `sizes` and `priority`

---

## 12. Performance & Non-Functional Requirements

- Core Web Vitals: LCP < 2.5s, CLS < 0.1, INP < 200ms
- Images via Supabase Storage CDN or Vercel image optimisation
- Max 24 cards per page load
- Mobile-first — fully usable at 375px
- WCAG 2.1 AA: colour contrast, keyboard navigation, ARIA labels on icon buttons
- No client-side secrets — all Supabase admin ops via server route handlers
- Rate limiting on public form submission endpoints

---

## 13. Out of Scope — v1

- Native mobile app
- Payment processing (developer listing fees)
- Full self-serve developer portal (lead form only at launch)
- Automated property data feeds (REA / Domain API)
- Video hosting for hero
- Compare developments feature (UI shell exists, functionality deferred)
- Live chat / chatbot
