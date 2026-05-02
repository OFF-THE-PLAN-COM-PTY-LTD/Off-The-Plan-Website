# Development Roadmap
## Off The Plan — Website Rebuild
**Version:** 1.0 | **Date:** 2026-05-01

**Stack:** Next.js 14 (App Router) · TypeScript · Tailwind CSS · shadcn/ui · Supabase (DB + Auth + Storage) · Vercel · GitHub

---

## Summary Timeline

| Phase | Focus | Duration | End of Week |
|-------|-------|----------|-------------|
| 1 | Foundation & Design System | 2 weeks | Week 2 |
| 2 | Core Pages — Homepage + Property Dossier | 3 weeks | Week 5 |
| 3 | Search, Map & Journal | 2 weeks | Week 7 |
| 4 | Auth, Member Features & Admin CMS | 2 weeks | Week 9 |
| 5 | Polish, SEO & Pre-launch | 2 weeks | Week 11 |
| 6 | Launch & Stabilisation | 1 week | Week 12 |

**Total: ~12 weeks**

---

## Phase 1 — Foundation & Design System
### Weeks 1–2

Everything downstream depends on this being solid. No page work starts until the schema and component library exist.

---

### Week 1 — Project Setup

**Goal:** Running Next.js app deployed to Vercel, connected to Supabase, seeded with sample data.

**Tasks:**
- [ ] Create GitHub repo under `Roar-AI-Labs` org — `main` + `develop` branches, branch protection on `main`
- [ ] Initialise Next.js 14 with TypeScript, Tailwind CSS, App Router (`create-next-app`)
- [ ] Install and init shadcn/ui
- [ ] Connect Vercel to GitHub — preview deploys enabled on all PRs
- [ ] Create Supabase project (production + staging environments)
- [ ] Add all env vars to Vercel dashboard
- [ ] Commit `.env.example` with all required keys documented
- [ ] Commit `README.md` with local setup steps
- [ ] Configure Google Fonts in `app/layout.tsx` — Fraunces, JetBrains Mono, Inter
- [ ] Set up `/lib/supabase/client.ts` (browser) and `/lib/supabase/server.ts` (server component)
- [ ] ESLint + Prettier config committed and passing

**Required env vars:**
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
NEXT_PUBLIC_MAPBOX_TOKEN
RESEND_API_KEY
```

---

### Week 2 — Database Schema + Design System

**Goal:** All tables live in Supabase with RLS, seed data loaded, and every shared component built and visible on a `/dev` preview page.

**Database tasks:**
- [ ] Migration: `developers`
- [ ] Migration: `developments`, `development_images`, `development_floor_plans`
- [ ] Migration: `journal_articles`
- [ ] Migration: `profiles` (extends `auth.users` via trigger), `saved_developments`
- [ ] Migration: `enquiries`, `circle_signups`, `developer_leads`
- [ ] RLS policies: public read on published rows; auth-gated for saved/profile; service-role for admin writes
- [ ] Supabase Auth: enable email/password + magic link
- [ ] Supabase Storage: create `development-images` and `journal-images` buckets (public read)
- [ ] Seed script: 8 sample developments + 4 journal articles + 2 developers

**TypeScript types:**
- [ ] `types/development.ts` — `Development`, `DevelopmentImage`, `DevelopmentFloorPlan`
- [ ] `types/journal.ts` — `JournalArticle`
- [ ] `types/developer.ts` — `Developer`
- [ ] `types/user.ts` — `Profile`

**Design system — `tailwind.config.ts`:**
- [ ] Custom colours: navy `#0E2638`, navy-deep `#081827`, navy-mid `#0b1f30`, orange `#E8722C`, cream `#F7F4EE`, ink `#14181d`
- [ ] Custom font families: `display` (Fraunces), `mono` (JetBrains Mono), `sans` (Inter)
- [ ] Custom spacing tokens on 8px grid
- [ ] Keyframes: `reveal` (scroll-in opacity+translate), `pulse` (dot), `marquee` (horizontal scroll)

**Shared components (all with dark/light tone prop):**
- [ ] `<NavBar>` — logo, nav links (Developments, Map, Journal, Developers, Resources, Contact), Search button, "List a development" CTA
- [ ] `<SideRail>` — Quick Access icons (search, map, bookmark, compare, mail), scroll progress bar + percentage
- [ ] `<Footer>` — 5-column grid, copyright bar
- [ ] `<PropertyCard>` — `tall` and `wide` layout variants, heart/save button
- [ ] `<JournalCard>` — feature (large) and compact (list) variants
- [ ] `<HeroSearch>` — tabbed (Buy / Lifestyle / Invest / New launches), suburb input, price select, category select, Search CTA
- [ ] `<Pill>` — coloured tag badges
- [ ] `<EnquiryForm>` — name, email, mobile, buyer type, primary + ghost CTA, confirmation state
- [ ] `<MemberSignupForm>` — name, email, interest type, CTA
- [ ] `<Icon>` — inline SVG set: search, map, bookmark, compare, mail, arrow, arrowdr, heart, check, pin, bed, bath, car, play, film, menu, close, plus, star
- [ ] `/app/dev/page.tsx` — preview page showing all components in isolation

---

## Phase 2 — Core Pages
### Weeks 3–5

The homepage and property dossier cover ~80% of the design complexity and establish all patterns used elsewhere.

---

### Week 3 — Homepage: Hero + Featured + Trending

**Goal:** Top half of homepage live on Vercel preview.

**Tasks:**
- [ ] `app/page.tsx` — server component, fetch featured + trending developments from Supabase
- [ ] Hero section: full-bleed background image, gradient overlays, headline, subheading
- [ ] `<HeroSearch>` wired up — on submit pushes to `/search?suburb=...&price=...&type=...`
- [ ] Hero meta strip: development name, video placeholder indicator, prev/next buttons
- [ ] Featured section: section label, H2, "View all" link
- [ ] 1× wide `<PropertyCard>` (hero feature)
- [ ] 2× rows of 3× `<PropertyCard>` (tall) — middle card offset 64px vertically
- [ ] `useReveal` hook using `IntersectionObserver` — adds `is-in` class on viewport entry
- [ ] Scroll-reveal applied to card containers with staggered `transition-delay`
- [ ] Trending rail: horizontal scroll container, `<PropertyCard>` at 300px, prev/next arrow buttons
- [ ] Responsive: all sections correct at 375px, 768px, 1280px, 1440px

---

### Week 4 — Homepage: Circle Signup + Journal + Footer + Layout Shell

**Goal:** Homepage complete. Shared layout wrapping all pages.

**Tasks:**
- [ ] Member Circle signup section: navy bg, grid overlay, two-column layout
- [ ] `<MemberSignupForm>` submits to `/api/circle`
- [ ] `/api/circle` route handler: validate input → insert `circle_signups` → send welcome email via Resend
- [ ] Journal section: fetch 4 latest published articles, feature article + 2 compact
- [ ] `<Footer>` implemented
- [ ] `app/layout.tsx`: `<NavBar>` + `<SideRail>` + `<Footer>` wrapping all routes
- [ ] `<SideRail>` scroll progress: client wrapper tracking `window.scrollY`
- [ ] Mobile `<NavBar>`: hamburger button → slide-in drawer with all nav links + search
- [ ] Drawer animation: transform + opacity, trapped focus when open

---

### Week 5 — Property Dossier (`/developments/[slug]`)

**Goal:** Full dossier page from hero to similar developments. Enquiry form submitting leads.

**Tasks:**
- [ ] `app/developments/[slug]/page.tsx` — fetch by slug, `notFound()` if unpublished or missing
- [ ] Dynamic `<head>` metadata — title, description, OG image per development
- [ ] Hero: full-bleed image, gradient, `<NavBar>` dark, back button, dossier ID, status + tag pills, H1 at 104px, suburb + developer meta
- [ ] Gallery thumbnails (4): client component tracking active index, click to swap hero image
- [ ] Spec strip: From, Beds, Type, Completion in 4-column row
- [ ] Two-column overview: editorial content left, sticky `<EnquiryForm>` right
- [ ] `<EnquiryForm>` submits to `/api/enquiries` → inserts `enquiries` record → shows confirmation
- [ ] `/api/enquiries` route handler: validate → insert → send notification email via Resend
- [ ] Development spec grid: Architect, Interiors, Landscape, Builder, Levels, Residences
- [ ] Floor plans: 4-column typology cards (image placeholder, config, area, price)
- [ ] Amenities: two-column list + image
- [ ] Location: Mapbox embed placeholder + walkability list
- [ ] Similar developments: 3-up `<PropertyCard>` from same state (excluding current)
- [ ] Sticky enquiry card: `position: sticky, top: 24px, align-self: start`

---

## Phase 3 — Search, Map & Journal
### Weeks 6–7

---

### Week 6 — Search (`/search`) + Map (`/map`)

**Goal:** Fully functional search with all filters and shareable URLs. Mapbox map view.

**Search tasks:**
- [ ] `app/search/page.tsx` — server component, reads URL search params, queries Supabase with all filters
- [ ] Supabase query: filter state, price range, beds, type, status; order by `is_featured DESC, updated_at DESC`
- [ ] Sticky filter bar: suburb text input, state multi-select, price range, beds, type, status, sort order
- [ ] Filter state synced to URL params — no client state for filters
- [ ] Results 3-column grid → 2-column tablet → 1-column mobile
- [ ] Active filter pills with dismiss (×) — removes param from URL
- [ ] Result count: "142 developments"
- [ ] Pagination component: 24 per page, numbered pages
- [ ] Empty state: friendly message + "Clear filters" CTA
- [ ] "Map view" toggle: links to `/map` with same query params

**Map tasks:**
- [ ] Install `mapbox-gl` and `react-map-gl`
- [ ] `app/map/page.tsx` — fetch all published developments with lat/lng
- [ ] Full-screen Mapbox map, orange pin markers
- [ ] Pin clustering at low zoom levels
- [ ] Click pin → sidebar `<PropertyCard>` for selected development (links to dossier)
- [ ] Collapsible filter panel (same filters as `/search`)
- [ ] "List view" toggle → back to `/search`
- [ ] Custom Mapbox style matching dark navy brand palette

---

### Week 7 — Journal Index + Article Detail

**Goal:** Journal fully functional with rich text article bodies.

**Tasks:**
- [ ] `app/journal/page.tsx` — fetch articles ordered by `published_at DESC`, paginated at 12
- [ ] Journal index: current issue hero (issue number + date), 4-column `<JournalCard>` grid
- [ ] Category filter tabs: All, Editorial, Market, Interview, Guide — filters client-side
- [ ] `app/journal/[slug]/page.tsx` — fetch by slug, `notFound()` if missing/unpublished
- [ ] Dynamic `<head>` metadata — title, description, OG image per article
- [ ] Article hero image, category + date + read time metadata
- [ ] Title (display serif, large), author byline
- [ ] Body HTML rendered safely (`dangerouslySetInnerHTML` on sanitised server-rendered HTML)
- [ ] Related articles 3-up at bottom — same category, excluding current

---

## Phase 4 — Auth, Member Features & Admin CMS
### Weeks 8–9

---

### Week 8 — Auth + Saved + Account

**Goal:** Supabase Auth integrated end-to-end. Saved developments and account page working.

**Tasks:**
- [ ] `app/login/page.tsx` — email + password form + magic link option (shadcn/ui Form)
- [ ] `app/signup/page.tsx` — name, email, password, interest type
- [ ] Supabase Auth trigger: auto-create `profiles` row on `auth.users` insert
- [ ] Next.js middleware (`middleware.ts`): redirect `/saved` and `/account` to `/login` if unauthenticated
- [ ] `<PropertyCard>` heart button: calls `/api/saved` (POST to save, DELETE to unsave), optimistic UI toggle
- [ ] `/api/saved` route: GET (list user's), POST (insert), DELETE (remove) — all auth-checked
- [ ] `app/saved/page.tsx` — fetch user's saved developments, `<PropertyCard>` grid, empty state
- [ ] `app/account/page.tsx` — display profile, interest type selector, notification prefs, "Unsubscribe from Circle" button, change password link

---

### Week 9 — Admin CMS

**Goal:** Internal `/admin` area — manage developments, journal articles, enquiries, and members.

**Tasks:**
- [ ] `middleware.ts`: redirect `/admin/*` if not authenticated or `is_admin = false`
- [ ] `app/admin/layout.tsx` — sidebar nav: Developments, Journal, Enquiries, Members, Leads
- [ ] **Developments list** (`/admin/developments`): table with name, status, enquiry count, published toggle, edit link
- [ ] **Development edit** (`/admin/developments/[id]`): full form with all fields
  - [ ] Image upload: drag/drop → upload to Supabase Storage `development-images` bucket → store public URL
  - [ ] Floor plan upload (same pattern)
  - [ ] Lat/lng fields
  - [ ] Publish toggle
- [ ] **Journal list** (`/admin/journal`): article table with title, category, published status, edit link
- [ ] **Article edit** (`/admin/journal/[id]`): TipTap rich text editor, hero image upload, category + published date, read time
- [ ] **Enquiries** (`/admin/enquiries`): table with development name, buyer name, email, date, status dropdown (new → contacted → closed)
- [ ] **Members** (`/admin/members`): Circle member table, "Export CSV" button
- [ ] **Leads** (`/admin/leads`): developer lead submissions table
- [ ] Image upload component (reusable): file input + drag/drop → Supabase Storage → return URL → store in form state
- [ ] All admin mutations use the service role key via server route handlers — never exposed client-side

---

## Phase 5 — Polish, SEO & Pre-launch
### Weeks 10–11

---

### Week 10 — SEO, Performance & Accessibility

**Tasks:**
- [ ] `app/sitemap.ts` — dynamic sitemap from all published developments + articles
- [ ] `app/robots.ts` — allow all, disallow `/admin`
- [ ] `next/image` on all images — correct `sizes` prop, `priority` on above-fold images
- [ ] `RealEstateListing` JSON-LD structured data on all development pages
- [ ] `Article` JSON-LD on all journal article pages
- [ ] `<meta>` title templates and descriptions for: homepage, search, map, development, journal index, article
- [ ] OG image strategy — static branded fallback + dynamic per development/article via Vercel OG or `opengraph-image.tsx`
- [ ] Lighthouse audit on: homepage, search, dossier, journal article, map — fix anything blocking Core Web Vitals
- [ ] Colour contrast audit — navy on cream, orange on navy, all text on backgrounds
- [ ] ARIA labels on all icon-only buttons (`<SideRail>`, gallery thumbs, heart button, search)
- [ ] Keyboard focus styles — visible on all interactive elements (no `outline: none` without replacement)
- [ ] Skip-to-main link at top of `<body>`
- [ ] `loading.tsx` skeleton screens for development grid and article list
- [ ] `error.tsx` error boundaries on key routes
- [ ] Rate limiting on `/api/enquiries` and `/api/circle` — simple token bucket or Upstash Redis

---

### Week 11 — Responsive Polish + Content Entry + Staging Review

**Tasks:**
- [ ] Full responsive audit at 375px, 390px, 768px, 1024px, 1280px, 1440px across all pages
- [ ] Fix any layout overflow, text clipping, or spacing issues on mobile
- [ ] Mobile `<HeroSearch>`: collapses to stacked single-column layout
- [ ] Mobile `<SideRail>`: hidden on mobile; Quick Access moved to floating bottom bar or omitted
- [ ] Mobile dossier: enquiry card moves below overview content (no sticky)
- [ ] Real content entry: import all actual developments, developers, journal articles into Supabase
- [ ] Upload all real photography to Supabase Storage, update image URLs
- [ ] Full staging walkthrough with Tim — all pages and user flows reviewed
- [ ] Fix all QA issues raised in review
- [ ] Staging domain configured on Vercel preview

---

## Phase 6 — Launch
### Week 12

**Tasks:**
- [ ] Security check: confirm no service role key exposed client-side; verify all RLS policies
- [ ] Set production Supabase env vars in Vercel production environment
- [ ] Configure custom domain on Vercel (`offtheplan.com.au`)
- [ ] SSL verified
- [ ] 301 redirects: map any existing old-site URLs to new structure
- [ ] Enable Vercel Analytics
- [ ] Smoke test all critical paths:
  - [ ] Homepage → search → filter → view dossier → submit enquiry
  - [ ] Homepage → join the circle
  - [ ] Homepage → read journal article
  - [ ] Admin → create/publish development → visible on homepage
  - [ ] Login → heart a development → view in `/saved`
  - [ ] Admin → update enquiry status
- [ ] Brief Tim on admin CMS usage — short walkthrough session
- [ ] Monitor Vercel logs + Supabase logs for 48 hours post-launch

---

## Risk Register

| Risk | Likelihood | Mitigation |
|------|------------|------------|
| Real photography not ready at launch | Medium | Site designed with SVG/placeholder images; swap in real photos progressively post-launch |
| Mapbox billing at scale | Low | Cap monthly active users in Mapbox dashboard; fallback option is Google Maps |
| Rich text editor complexity in admin | Low | TipTap (MIT licence) is well-supported in Next.js; if needed, fall back to simple Markdown input |
| SEO migration breaking existing rankings | Medium | Document all existing URLs in Week 1; configure 301s before DNS cutover |
| Content entry taking longer than estimated | Medium | Build seed/import script in Week 2 to speed up bulk data entry |
| Admin CMS scope creep | Medium | v1 admin is intentionally minimal; self-serve developer portal is explicitly deferred |

---

## Definition of Done

**A feature is complete when:**
1. Implemented and passing `npm run build` (TypeScript + Next.js build, zero errors)
2. Tested on Chrome desktop + Safari iOS at 375px
3. Deployed to Vercel preview and approved
4. No console errors or unhandled promise rejections

**A phase is complete when:**
All tasks are ticked and the Vercel preview has passed a stakeholder review with Tim.

---

## Tech Decisions

| Decision | Choice | Reason |
|----------|--------|--------|
| Framework | Next.js 14 App Router | Server components, streaming, first-class Vercel integration |
| Styling | Tailwind CSS + shadcn/ui | Rapid iteration; shadcn gives accessible, unstyled primitives |
| Database + Auth | Supabase | Postgres + RLS + Auth in one service; no separate auth provider needed |
| Map | Mapbox GL JS | Superior styling control; can match the dark brand palette precisely |
| Rich text editor | TipTap | Headless, extensible, good Next.js app router compatibility |
| Email | Resend | Clean API, reliable deliverability, generous free tier |
| Image hosting | Supabase Storage | Co-located with DB; CDN-served; no additional service |
| ORM | None — raw Supabase JS client | Supabase's typed query builder is sufficient; avoids Prisma complexity |
| Testing | Jest for API route handlers only | Per org standards; UI verified manually and via Vercel previews |
