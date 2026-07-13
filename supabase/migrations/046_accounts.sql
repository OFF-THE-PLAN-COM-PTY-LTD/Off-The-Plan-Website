-- Consolidate `agencies` + `developers` into one canonical `accounts` table.
-- ============================================================================
-- This is the EXPAND step of an expand→migrate→contract refactor. It only
-- CREATES the new table alongside the existing `agencies`/`developers` — it
-- does NOT read, write, or drop anything else. Nothing in the app references
-- `accounts` yet; the backfill (supabase/backfill-accounts.ts) and the
-- read/write cutover land in later migrations/PRs.
--
-- Design:
--  - `accounts` is the single source of truth for Developer/Agent COMPANY data
--    (what today lives triplicated across profiles/agencies/developers).
--  - `profiles` stays the auth/login layer; an account links to a login via
--    the nullable `user_id` FK (replaces the fragile agencies↔profiles email
--    match). Account-less migrated agencies keep `user_id` NULL.
--  - Socials are stored BARE (facebook, not facebook_url) so the existing
--    public `normaliseUrl()` in app/developers/[slug]/page.tsx needs no change.
--  - `legacy_agency_id` / `legacy_developer_id` are the crosswalk the backfill
--    and the developments repoint (migration 047) use to map old rows → account.

create table if not exists accounts (
  id                       uuid primary key default gen_random_uuid(),

  -- Login link (nullable — most migrated agencies have no auth user).
  user_id                  uuid references auth.users(id) on delete set null,

  -- Classification. Mirrors agencies.interest_type / profiles.interest_type.
  type                     text check (type in ('Developer', 'Agent')),

  -- Identity.
  name                     text not null,            -- company name (org_name/name/business_name)
  first_name               text,
  last_name                text,
  slug                     text unique not null,     -- public /developers/[slug]

  -- Company profile.
  description              text,
  email                    text,                     -- login/contact email (old join key)
  company_email            text,
  phone                    text,
  company_phone            text,
  abn                      text,
  website                  text,
  logo_url                 text,
  avatar_url               text,                     -- personal headshot (agencies.profile_pic)

  -- Company address.
  state                    text,
  city                     text,                     -- agencies.org_city / developers.suburb
  street_address           text,
  street_address_2         text,
  country                  text,
  postcode                 text,

  -- Personal address (carried from agencies.personal_*; optional).
  personal_street_address  text,
  personal_country         text,
  personal_state           text,
  personal_city            text,
  personal_postcode        text,

  -- Socials (BARE handles/urls — not the agencies *_url shape).
  facebook                 text,
  instagram                text,
  linkedin                 text,
  pinterest                text,
  youtube                  text,
  twitter                  text,

  -- Directory + account state.
  is_published             boolean not null default false,
  portal_status            text not null default 'active' check (portal_status in ('active', 'inactive')),
  archived                 boolean not null default false,
  email_verified           boolean not null default false,
  total_active_listings    int not null default 0,

  -- Legacy crosswalk (preserved for backfill + developments repoint + rollback).
  legacy_id                text,                     -- agencies.legacy_id (external key)
  legacy_agency_id         uuid,                     -- old agencies.id
  legacy_developer_id      uuid,                     -- old developers.id

  created_at               timestamptz not null default now(),
  updated_at               timestamptz not null default now()
);

-- One account per login / per legacy row. These are FULL unique indexes (not
-- partial) so PostgREST can use them as upsert ON CONFLICT targets; Postgres
-- treats NULLs as distinct, so the many null-legacy rows don't collide.
create unique index if not exists accounts_user_id_unique
  on accounts(user_id) where user_id is not null;
create unique index if not exists accounts_legacy_agency_id_unique
  on accounts(legacy_agency_id);
create unique index if not exists accounts_legacy_developer_id_unique
  on accounts(legacy_developer_id);
create unique index if not exists accounts_legacy_id_unique
  on accounts(legacy_id) where legacy_id is not null;

-- Query paths: public directory filter + admin tabs.
create index if not exists idx_accounts_type on accounts(type);
create index if not exists idx_accounts_is_published on accounts(is_published);
create index if not exists idx_accounts_archived on accounts(archived);

-- updated_at maintenance (reuses update_updated_at_column() defined in 002).
create trigger set_updated_at_accounts
  before update on accounts
  for each row execute function update_updated_at_column();

-- Privilege-protection trigger — clone of protect_profile_admin_columns() (025).
-- For non-service-role callers (i.e. a logged-in owner editing their own row via
-- the "owner update" policy below), revert the state/identity columns to their
-- prior values so a member can edit company details but cannot self-publish,
-- self-classify, un-archive, or steal a row. Admin writes go through the service
-- role (supabaseAdmin) and bypass this, as they do for profiles today.
create or replace function public.protect_account_admin_columns()
returns trigger as $$
begin
  if auth.role() <> 'service_role' then
    new.is_published        := old.is_published;
    new.type                := old.type;
    new.archived            := old.archived;
    new.portal_status       := old.portal_status;
    new.id                  := old.id;
    new.user_id             := old.user_id;
    new.legacy_id           := old.legacy_id;
    new.legacy_agency_id    := old.legacy_agency_id;
    new.legacy_developer_id := old.legacy_developer_id;
    new.created_at          := old.created_at;
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

create trigger protect_account_admin_columns_trg
  before update on accounts
  for each row execute function public.protect_account_admin_columns();

-- Row Level Security.
alter table accounts enable row level security;

-- Public: only live Developer directory rows are world-readable. Mirrors the
-- developers "public read where is_published" policy (001), tightened to the
-- exact conditions the /developers page will filter on.
create policy "Public can read active developer accounts"
  on accounts for select
  using (
    type = 'Developer'
    and is_published = true
    and portal_status = 'active'
    and archived = false
  );

-- Admins: full read. Mirrors the agencies admin-read policy (015), keyed off
-- profiles.is_admin = the same admin gate used everywhere else.
create policy "Admins can read accounts"
  on accounts for select
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.is_admin = true
  ));

-- Owners: a logged-in member can read and update THEIR OWN account row. The
-- protect trigger above stops them touching state/identity columns.
create policy "Owners can read own account"
  on accounts for select
  using (user_id = auth.uid());

create policy "Owners can update own account"
  on accounts for update
  using (user_id = auth.uid());

-- Service role: full access — every supabaseAdmin writer (backfill, signup,
-- admin edits, sync during dual-write) depends on this.
create policy "Service role has full access to accounts"
  on accounts for all
  using (auth.role() = 'service_role');
