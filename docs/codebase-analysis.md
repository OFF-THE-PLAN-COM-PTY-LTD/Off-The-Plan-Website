# Codebase Analysis — Off The Plan

> Point-in-time review: **2026-07-14**
> Scope: architecture, performance/optimization, and SEO.
> Stack: Next.js 14.2 (App Router) · TypeScript · Tailwind · Supabase (Postgres + Auth) · Stripe · Mapbox GL · Resend · Vercel.
> Size at review: 57 pages · 47 API routes · 161 `.tsx` / 97 `.ts` · 49 SQL migrations · 13 test files.

---

## Overall health

| Dimension | Rating | Verdict |
|---|---|---|
| Architecture | Good, with sharp edges | Clean feature-based layering and well-documented auth; undermined by build config and an incomplete data-model migration. |
| Performance | Needs work | Every public page is `force-dynamic` with zero caching — the biggest issue in the codebase. |
| SEO | Solid foundation, incomplete | Metadata, sitemap, and canonical-URL routing are good; missing canonical tags, OG images, and rich structured data. |
| Type / build safety | At risk | The app ships even if it does not typecheck, lint, or have passing tests. |

This is a maturing, actively-refactored codebase. The engineering is thoughtful and the inline documentation is excellent, but a few blunt configuration choices cost it disproportionately.

---

## 1. Architecture

### Strengths
- **Consistent four-tier layering:** `app/` (routes + API), `features/` (domain modules), `components/` (shared UI), `lib/` (infra: supabase, api, email, stripe), `types/`.
- **`features/listings/admin-form/` is exemplary** — a 21-slice form state model split into `use-listing-form-state.ts` + `build-payload.ts` (snapshot-tested) + 16 section components + field primitives.
- **`features/listings/queries.ts`** centralizes the development read path with shared `SELECT` strings (tested).
- **`middleware.ts`** refuses to serve protected routes with a `503` if Supabase is unconfigured in production, and reads roles from the JWT `app_metadata` first to avoid a DB round-trip per request.
- Graceful degradation on optional integrations (Resend, analytics RPCs); the Stripe webhook correctly filters `metadata.platform` on a Stripe account shared with another product.
- Code is written type-honestly: `@ts-ignore` count is **0**, `as any` appears only **8** times.

### Risks (prioritized)

1. **Build safety is disabled.** `next.config.mjs` sets `typescript.ignoreBuildErrors: true` and `eslint.ignoreDuringBuilds: true`; `package.json` uses `test: "jest --passWithNoTests"`. The app can deploy while broken — CI stays green on failing types, lint, or an empty test run. **Highest-leverage fix in this report.**
2. **Hand-written types, no generated Supabase schema.** `types/` has 3 hand-authored files and no `database.types.ts`. Across 49 migrations, the interfaces can silently drift from the actual Postgres schema.
3. **Mock data in the production homepage.** `app/page.tsx` defines fake listings (`MOCK_TIER1`/`MOCK_TIER2`) and uses them as a fallback when the DB query returns empty. If the table is ever empty/misconfigured in prod, the homepage renders fabricated inventory as real. Replace with an empty-state.
4. **Service-role client in ~38/45 routes — RLS effectively bypassed.** Authorization rests entirely on hand-written route checks + input allow-lists, with no database defense-in-depth. Every public route (`/api/enquiries`, `/api/track/view`, `/api/leads`) is one missing check from a data leak.
5. **Unadopted API infrastructure.** The composable `withAdmin` / `withMemberOrAdmin` / `withValidation` wrappers (`lib/api/handler.ts`) are used in only **3 of 46** routes; the `ok`/`fail` envelope in **zero**. This adds a third pattern rather than unifying. Either finish the migration or delete the scaffolding.
6. **Fragmented validation.** Zod is used in 16 routes, manual `Set`-based allow-lists in others, nothing in the rest. Standardize on Zod for write routes; make the manual pattern the documented exception.
7. **Incomplete `accounts` consolidation.** Agencies + developers were merged into one `accounts` table in the DB, but routes (`/api/admin/agencies`, `/api/admin/developers`, `/api/admin/agents`), types (`types/developer.ts`), and UI trees still triplicate the old model.

---

## 2. Performance & optimization

**Central problem:** the app has effectively zero caching at any layer, while a full cache-invalidation system sits unused.

Every meaningful public page is `force-dynamic` — homepage, search, listing detail, developers, journal, news/guides all re-query Supabase and re-render on every request and every navigation. Meanwhile 20+ `revalidatePath()` calls across the admin API (e.g. `app/api/admin/listings/route.ts` revalidating `/`, `/search`, `/map`, `/listings`) are **no-ops**, because their target pages are never cached. `next.config.mjs` `staleTimes: {dynamic:0, static:0}` also disables the client-side router cache. Three free caching layers are discarded.

### Issues (ranked by impact)

1. **`force-dynamic` everywhere + `revalidatePath` unused + `staleTimes:0`.** Convert public content (home, listing detail, journal, developers) to ISR/cached rendering; the existing `revalidatePath` calls then start working. Biggest single lever.
2. **Homepage hero is an unoptimized raw `<img>`** (`app/page.tsx`) with no `priority`, `sizes`, or dimensions — the site's LCP element is the slowest possible image.
3. **`SELECT "*"` + full nested embeds for card lists.** `DEVELOPMENT_CARD_SELECT` (`features/listings/queries.ts`) pulls every column + full account row + all images + all floor plans, even for search fetching up to **500 rows**. Introduce a slim card select (~10 fields + one hero image).
4. **Root layout runs a `profiles` DB query on every authenticated page load** (`app/layout.tsx`) — the role is already in the JWT `app_metadata`, as the middleware demonstrates.
5. **Developers list fetches all developments and counts them in JS** (`app/developers/page.tsx`) instead of a Postgres aggregate — O(developers × developments).
6. **`xlsx` and `recharts` eagerly bundled** into admin dashboard/reports pages (`features/admin/components/dashboard-table.tsx`, `app/admin/reports/reports-dashboard.tsx`). The sibling `export-buttons.tsx` shows the lazy-import pattern to copy.
7. **Six Google font families** (Fraunces with 3 variable axes) loaded site-wide (`app/layout.tsx`). Consolidate the single-weight display faces.

### Done well
- `mapbox-gl` and `jspdf` are correctly `next/dynamic`-loaded and confined to their pages.
- No heavy library ships on public routes.
- Homepage's 9 queries run via `Promise.all`; no true N+1 loops (relations use PostgREST embeds).

---

## 3. SEO

Stronger than a first glance suggests — most static pages already export metadata, and the canonical-URL *routing* is well-designed. The gaps are in canonical tags, social images, and rich structured data.

| Area | Rating |
|---|---|
| Root metadata (title template, `metadataBase`, `en-AU` locale) | Good |
| Per-page static metadata (17 pages covered) | Good |
| Canonical URLs (`alternates.canonical`) | Missing everywhere |
| Duplicate-content control via 301 routing (`lib/listing-url.ts`) | Good |
| Structured data (JSON-LD) | Partial — 2 minimal schemas |
| Headings & alt text | Good — single h1, complete alt |
| Sitemap | Partial — missing routes |
| Robots | Partial — `/portal` crawlable |
| Social / OG images + Twitter cards | Missing |

### Gaps (prioritized)

1. **No `alternates.canonical` anywhere.** The routing-layer 301s (`/listings/{slug}` → `/{category}/{slug}`) are excellent, but there is no defense against query-string/host duplicates. Add self-referencing canonicals to the 4 dynamic pages + static pages.
2. **No default OG image, no Twitter cards.** `public/off-the-plan-banner-landscape.png` exists but is wired nowhere — every social share is imageless.
3. **No `Organization` / `WebSite` JSON-LD** in the root layout (would enable the sitelinks search box + knowledge-panel signals). No `BreadcrumbList` despite a well-suited URL structure.
4. **Thin `RealEstateListing` schema** (`app/[category]/[slug]/page.tsx`) — omits price, images, URL, beds, all present on the page.
5. **`/portal` members area is crawlable** — not disallowed in `app/robots.ts` and has no metadata.
6. **Sitemap gaps:** missing `/developers/[slug]`, the 6 calculators, `/guides`, `/news`, `/about`, `/privacy`, `/terms`; `lastModified` uses `now` on every crawl (dilutes the freshness signal).
7. **Env-var mismatch:** sitemap/robots use `NEXT_PUBLIC_SITE_URL` while `metadataBase` uses `NEXT_PUBLIC_APP_URL`. If they ever differ, canonical/OG and sitemap URLs disagree. Consolidate to one.

---

## Action plan

### Do first — high impact, mostly low effort
1. Turn off `ignoreBuildErrors` / `ignoreDuringBuilds` (or gate behind a CI typecheck + lint step) so broken builds cannot ship. *(Architecture #1)*
2. Adopt a caching strategy for public content — drop `force-dynamic`, add ISR/`revalidate`, remove `staleTimes:0`. This activates the already-written `revalidatePath` system. *(Performance #1)*
3. Replace the homepage mock-data fallback with a real empty-state. *(Architecture #3)*
4. Fix the homepage hero image → `next/image` with `priority`. *(Performance #2)*
5. Add canonicals + a default OG image + `Organization`/`WebSite` JSON-LD. *(SEO #1–3)*

### Do next — larger but valuable
6. Generate Supabase types (`supabase gen types`) and type the clients.
7. Introduce a slim card `SELECT` distinct from the detail select.
8. Commit to (or remove) the API wrapper infra; standardize validation on Zod.
9. Finish the `accounts` consolidation across routes/types/UI.
10. Move the root layout's role lookup to the JWT; convert the developers-list count to a Postgres aggregate.

### Quick wins — an afternoon each
- Disallow `/portal` in `robots.ts`.
- Reconcile the two URL env vars (`NEXT_PUBLIC_SITE_URL` vs `NEXT_PUBLIC_APP_URL`).
- Lazy-load `xlsx` / `recharts` on admin pages.
- Add sitemap blocks for developer profiles + calculators.
- Add metadata to `/resources` and `/list-a-listing`.

---

*Generated from a three-part deep-dive (architecture, performance, SEO). File references point to the state of the repo at the review date above.*
