# Public-page caching & revalidation

## Why this exists

Public pages used to read Supabase on **every** request (they're dynamic because
the root layout reads auth cookies). That's slow and hammers the database. This
system caches the *data reads* and invalidates them precisely when data changes —
including changes made outside the app (import scripts, direct dashboard edits).

Three moving parts:

1. **Tagged cached reads** — `lib/cached-reads.ts` wraps the anon-client reads in
   `unstable_cache`, tagged by the tables they touch (`lib/cache-tags.ts`). Pages
   call these instead of hitting Supabase directly. A short TTL
   (`PUBLIC_CACHE_TTL`, 60s) is a backstop only.
2. **Write-side invalidation** — every mutation route calls
   `revalidatePublicTables([...])`, which busts the tag for each table it wrote,
   so app edits refresh public pages immediately.
3. **The Supabase webhook** — `POST /api/revalidate` busts a table's tag from a
   Supabase Database Webhook. This catches the writes the app can't see: the
   `scripts/` importers, Python loaders, and admins editing rows directly in the
   Supabase table editor.

Tags are the raw table names, so the webhook maps a changed table straight to a
tag with no lookup: `developments`, `development_images`,
`development_floor_plans`, `listing_agents`, `accounts`, `journal_articles`,
`homepage_banners`, `ads`.

## Setup

### 1. Secret

Set `REVALIDATE_SECRET` (a long random string, e.g. `openssl rand -hex 32`) in:
- Vercel project env (Production + Preview), and
- `.env.local` for local work.

### 2. Supabase Database Webhooks

In the Supabase dashboard → **Database → Webhooks → Create a new hook**, create
**one hook per table** in the tag list above:

- **Table:** the table (e.g. `developments`)
- **Events:** Insert, Update, Delete
- **Type:** HTTP Request
- **Method:** POST
- **URL:** `https://<your-domain>/api/revalidate`
- **HTTP Headers:** add `Authorization` = `Bearer <REVALIDATE_SECRET>`

The default Supabase payload (`{ type, table, schema, record, old_record }`) is
exactly what the route expects — it reads `table` and busts that tag.

> Prefer the dashboard over a SQL migration so the secret is never committed to
> git. If you must script it, store the secret in Supabase Vault and reference it
> from a `supabase_functions.http_request` trigger — never inline the secret.

### 3. Verify

```bash
# Should return { ok: true, revalidated: ["developments"], ignored: [] }
curl -s -X POST https://<your-domain>/api/revalidate \
  -H "Authorization: Bearer $REVALIDATE_SECRET" \
  -H "Content-Type: application/json" \
  -d '{"table":"developments"}'

# Wrong/missing secret → 401
curl -s -X POST https://<your-domain>/api/revalidate -d '{"table":"developments"}'
```

Then edit a developer in the Supabase table editor and confirm `/developers`
reflects it within a second or two (webhook) rather than up to 60s (TTL backstop).

## Extending

To cache another public read:
1. Add a wrapper in `lib/cached-reads.ts` using `unstable_cache`, tagged with
   every table the query reads (including embedded joins).
2. Point the page at the wrapper.
3. Ensure the tables are in `CACHE_TABLES` and have a Supabase webhook.

Currently cached: the developer directory & profile, developer-profile listings,
homepage listing tiers, and the listing detail page. **Not yet cached** (still
read live each request — safe, just not optimized): the `/search` results,
`/news`, `/guides`, `/journal`, homepage banners/articles, and `<AdSlot>`. Their
tables already have tags and webhooks, so converting them is just step 1–2 above.

## Guardrails

- Only ever cache the **anon** client (`@/lib/supabase/public`). Never wrap the
  cookie-bound server client or the service-role admin client — caching
  user-scoped or privileged reads would leak data across requests.
- `/account` and `/saved` are per-user and must stay uncached.
- Full static (CDN) caching of these pages additionally requires moving the
  auth/nav read out of the root `app/layout.tsx` (it currently forces every route
  dynamic). That's a separate, higher-risk change — deferred.
