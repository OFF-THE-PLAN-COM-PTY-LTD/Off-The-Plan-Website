-- Audit trail: record WHO changed WHAT, WHEN on `accounts` and `developments`.
-- ============================================================================
-- Background
-- ----------
-- Production has no audit trail of any kind. When 119 of 148 `accounts` rows
-- turned up archived and the client asked who did it, there was nothing to
-- answer with:
--   * No audit/log table exists — all 18 public tables are business data.
--   * `accounts` carries only `archived` / `created_at` / `updated_at`. There is
--     no `archived_by`, `updated_by`, or even `archived_at`.
--   * `auth.audit_log_entries` (the GoTrue table) has 0 rows.
-- History could only be *inferred* from `updated_at` clustering: 91 accounts
-- were created already-archived by a bulk script (2026-07-13 12:23), and 24 were
-- bulk-archived inside a single minute (2026-07-16 00:19) — exactly the developer
-- accounts that listings had been re-attributed to. We still cannot say who.
-- This migration makes sure that question is answerable next time.
--
-- Design
-- ------
--  - ONE generic trigger function (`public.audit_row_change`) attached to the
--    two tables that matter. It is table-agnostic: it uses `to_jsonb(new/old)`
--    so the WHOLE row is preserved on both sides and nothing is lost, rather
--    than enumerating columns that then rot as the schema evolves.
--  - It is an AFTER trigger, deliberately. `accounts` already has a BEFORE
--    UPDATE trigger (`protect_account_admin_columns_trg`, 046) that reverts
--    protected columns for non-service-role callers. Running AFTER means we
--    record the FINAL, post-protection values — what actually landed on disk —
--    and never interfere with that trigger's rewrite of NEW.
--  - `changed_columns` is computed by diffing the two jsonb objects, so an
--    UPDATE row tells you at a glance which fields moved. Expect `updated_at` to
--    ride along on most UPDATEs — both tables have a `set_updated_at_*` BEFORE
--    trigger, and now() advances between transactions. Filter it out when
--    querying for meaningful changes.
--  - The columns we care most about are, for the record:
--      accounts:     archived, is_published, type, portal_status, slug, user_id
--      developments: account_id, is_published, status, tier, slug
--    They are NOT special-cased — capturing the whole row is strictly better —
--    but they are what `changed_columns` should be queried on.
--
-- ACTOR ATTRIBUTION — READ THIS
-- -----------------------------
-- Every admin/portal write in this app goes through the SERVICE-ROLE client
-- (lib/supabase/admin.ts), and the maintenance scripts in scripts/*.mjs use the
-- service-role key too. For all of those, `auth.uid()` is NULL — the JWT is the
-- service key, not a human. So out of the box this table can only say
-- "service_role did it", which is precisely the answer that was not good enough.
--
-- The fix is `actor_hint`: the application declares the acting admin for the
-- transaction before it writes, and the trigger reads it back out of the session
-- via `current_setting('app.actor', true)`. Until the app does that, admin writes
-- are attributed as `service_role` with `actor_hint` NULL. Wiring the app up is
-- deliberately NOT part of this migration — see docs/audit-log.md for the exact
-- snippet and the follow-up task.

create table if not exists audit_log (
  id              bigserial primary key,
  changed_at      timestamptz not null default now(),

  -- What was touched.
  table_name      text not null,
  row_id          uuid,                    -- both audited tables have a uuid PK
  op              text not null check (op in ('INSERT', 'UPDATE', 'DELETE')),

  -- Only the columns that actually moved (UPDATE only; null for INSERT/DELETE).
  changed_columns text[],

  -- Whole row, both sides. old_row is null on INSERT, new_row null on DELETE.
  old_row         jsonb,
  new_row         jsonb,

  -- Who. See the ACTOR ATTRIBUTION note above before trusting these.
  db_role         text,                    -- auth.role(), e.g. 'service_role' / 'authenticated'
  actor_uid       uuid,                    -- auth.uid() — NULL for every service-role write
  actor_hint      text                     -- app-declared actor via set_config('app.actor', ...)
);

-- Query paths: "what happened to this row" (the reconstruct-history query) and
-- "what happened in this window" (the bulk-change-cluster query).
create index if not exists idx_audit_log_table_row
  on audit_log(table_name, row_id, changed_at desc);
create index if not exists idx_audit_log_changed_at
  on audit_log(changed_at desc);

-- Generic audit trigger. security definer so it can always insert into
-- audit_log regardless of the caller's RLS/grants — an actor must not be able
-- to suppress their own audit row.
create or replace function public.audit_row_change()
returns trigger as $$
declare
  v_old     jsonb;
  v_new     jsonb;
  v_changed text[];
begin
  if tg_op = 'INSERT' then
    v_old := null;
    v_new := to_jsonb(new);
  elsif tg_op = 'DELETE' then
    v_old := to_jsonb(old);
    v_new := null;
  else -- UPDATE
    v_old := to_jsonb(old);
    v_new := to_jsonb(new);

    -- Diff the two sides. `is distinct from` so null <-> value counts as a change.
    select coalesce(array_agg(t.key order by t.key), '{}'::text[])
      into v_changed
      from jsonb_object_keys(v_new) as t(key)
     where v_new -> t.key is distinct from v_old -> t.key;

    -- A no-op UPDATE (e.g. writing identical values) is not worth a row.
    if cardinality(v_changed) = 0 then
      return null;
    end if;
  end if;

  insert into audit_log (
    table_name, row_id, op, changed_columns, old_row, new_row,
    db_role, actor_uid, actor_hint
  )
  values (
    tg_table_name,
    coalesce(v_new ->> 'id', v_old ->> 'id')::uuid,
    tg_op,
    v_changed,
    v_old,
    v_new,
    -- auth.role() is null outside a PostgREST request (psql, scripts run through
    -- a direct connection); fall back to the connecting DB user so the row is
    -- never blank. session_user, NOT current_user: this function is security
    -- definer, so current_user is always the function owner ('postgres') and
    -- would tell us nothing. session_user survives both security definer and
    -- SET ROLE, so it reports who actually opened the connection.
    coalesce(nullif(auth.role(), ''), session_user),
    auth.uid(),
    nullif(current_setting('app.actor', true), '')
  );

  return null; -- AFTER trigger — return value is ignored.
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists audit_accounts_trg on accounts;
create trigger audit_accounts_trg
  after insert or update or delete on accounts
  for each row execute function public.audit_row_change();

drop trigger if exists audit_developments_trg on developments;
create trigger audit_developments_trg
  after insert or update or delete on developments
  for each row execute function public.audit_row_change();

-- Row Level Security.
-- ------------------
-- The audit trail is append-only, and only the trigger appends. There is
-- deliberately NO insert/update/delete policy: nobody writing through PostgREST
-- can forge, amend, or erase an audit row. The trigger is security definer, so
-- it writes as the function owner and is unaffected by these policies.
alter table audit_log enable row level security;

-- Admins: full read. Mirrors the "Admins can read accounts" policy (046), keyed
-- off profiles.is_admin — the same admin gate used everywhere else.
drop policy if exists "Admins can read audit_log" on audit_log;
create policy "Admins can read audit_log"
  on audit_log for select
  using (exists (
    select 1 from profiles p where p.id = auth.uid() and p.is_admin = true
  ));

-- Service role: read only. Note this is a SELECT policy, not `for all` — unlike
-- accounts (046), the service role gets no write path here on purpose. (The
-- service role bypasses RLS entirely anyway; this documents intent and keeps the
-- grant surface honest if FORCE ROW LEVEL SECURITY is ever turned on.)
drop policy if exists "Service role can read audit_log" on audit_log;
create policy "Service role can read audit_log"
  on audit_log for select
  using (auth.role() = 'service_role');

comment on table audit_log is
  'Append-only audit trail for accounts + developments. Written only by the '
  'audit_row_change() trigger. actor_uid is NULL for service-role writes — the '
  'app must set_config(''app.actor'', ...) to attribute a human. See docs/audit-log.md.';
