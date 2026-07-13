-- ============================================================================
-- STAGED — DO NOT RUN until the accounts cutover has been deployed & verified.
-- ============================================================================
-- Drops the legacy `agencies` and `developers` tables now that the entire app
-- reads and writes the consolidated `accounts` table. Every runtime reference
-- to these two tables was removed in the "legacy table cutover to accounts"
-- change:
--   * reads (admin developers/agencies pages, developer-contact, portal
--     directory + profile, homepage-banner join, listing dropdowns) → accounts
--   * writes (registration, admin developer CRUD, agency edit PATCH) → accounts
--   * the agency→accounts dual-write (syncAccountFromAgency / setAccountPublished)
--     was retired; syncAccountFromProfile (profiles → accounts) stays.
--
-- Note on developments.developer_id / developments.agency_id:
--   These columns are INTENTIONALLY KEPT. They still hold their legacy id values
--   and the listing dropdowns still write FK-valid legacy ids into them, but
--   `developments.account_id` (ON DELETE SET NULL → accounts) is the authoritative
--   link that drives every feature. We only drop the FK CONSTRAINTS here so the
--   parent tables can go; the columns become plain uuid columns.
--
-- Pre-flight (run manually and confirm zero rows/hits before applying):
--   -- 1. No code references remain (run in the repo, not the DB):
--   --      grep -rEn "\.from\(\s*['\"](agencies|developers)['\"]" app lib features
--   -- 2. accounts fully covers the legacy data:
--   --      select
--   --        (select count(*) from public.agencies)  as agencies,
--   --        (select count(*) from public.developers) as developers,
--   --        (select count(*) from public.accounts)   as accounts;
--
-- The scripts under supabase/ (seed.ts, migrate-listings.ts) still reference the
-- old tables but are one-time historical tooling, not part of the deployed app.
-- ============================================================================

begin;

-- Remove the FK constraints on developments that point at the legacy tables.
-- (developers_agency_id_fkey is internal to `developers` and is removed with the
-- table itself.)
alter table public.developments drop constraint if exists developments_developer_id_fkey;
alter table public.developments drop constraint if exists developments_agency_id_fkey;

-- Drop the tables. `developers` first (it carries developers_agency_id_fkey →
-- agencies), then `agencies`.
drop table if exists public.developers;
drop table if exists public.agencies;

commit;
