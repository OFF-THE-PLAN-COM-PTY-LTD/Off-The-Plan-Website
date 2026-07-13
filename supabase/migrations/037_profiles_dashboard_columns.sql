-- Reconcile the `profiles` migration source with the LIVE schema.
-- ============================================================================
-- These columns exist in production but were added directly in the Supabase
-- dashboard, so they never had a migration. Without them, a fresh DB (local
-- rehearsal, or any rebuild-from-migrations) has a `profiles` table that the
-- app reads/writes columns off — and that don't exist. This migration adds
-- them so migrations == live.
--
-- Every column is text and additive; `IF NOT EXISTS` makes this a no-op on
-- production (where they already exist). Discovered via the PostgREST OpenAPI
-- schema; the app read/write sites are in app/portal/profile/*,
-- app/api/portal/profile/route.ts, and app/developers/[slug]/page.tsx.

alter table profiles
  add column if not exists first_name          text,
  add column if not exists last_name           text,
  add column if not exists phone               text,
  add column if not exists avatar_url          text,
  add column if not exists business_name       text,
  add column if not exists abn                 text,
  add column if not exists about               text,
  add column if not exists website             text,
  -- personal address
  add column if not exists street_address      text,
  add column if not exists street_address_2    text,
  add column if not exists country             text,
  add column if not exists state               text,
  add column if not exists city                text,
  add column if not exists postcode            text,
  -- company contact + address
  add column if not exists company_email       text,
  add column if not exists company_phone       text,
  add column if not exists company_street      text,
  add column if not exists company_street_2    text,
  add column if not exists company_country     text,
  add column if not exists company_state       text,
  add column if not exists company_city        text,
  add column if not exists company_postcode    text,
  -- logos
  add column if not exists company_logo_url    text,
  add column if not exists developer_logo_url  text,
  -- socials (bare)
  add column if not exists facebook            text,
  add column if not exists instagram           text,
  add column if not exists linkedin            text,
  add column if not exists pinterest           text,
  add column if not exists youtube             text;
