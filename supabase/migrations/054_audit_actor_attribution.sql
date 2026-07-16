-- Audit trail, part 2: record WHO, not just what and when.
-- ============================================================================
-- 052_audit_log.sql captured what changed and when, but left the "who" column
-- empty in practice: every admin/portal write goes through the service-role
-- client (lib/supabase/admin.ts) and every scripts/*.mjs uses the service-role
-- key, so `auth.uid()` is NULL and every row logged as `service_role`. That is
-- exactly the answer that was not good enough when the client asked who
-- archived 119 accounts. This migration closes that gap.
--
-- THE TRANSACTION TRAP (this is why the RPCs below exist at all)
-- -------------------------------------------------------------
-- The obvious wiring — the one docs/audit-log.md sketched — does NOT work:
--
--     await supabaseAdmin.rpc("set_audit_actor", { actor: email });   -- txn 1
--     await supabaseAdmin.from("accounts").update({ archived: true }); -- txn 2
--
-- `set_config(..., true)` is TRANSACTION-local, and PostgREST runs every
-- request in its own transaction. Those are two transactions, so the setting is
-- discarded at the end of the first one and the trigger in the second sees
-- nothing. It fails SILENTLY — the write succeeds, `actor_hint` is just NULL.
-- Verified against the local DB: two-transaction => actor_hint NULL;
-- same-transaction => actor_hint captured.
--
-- The other tempting fix, `set_config(..., false)` (session-local), DOES
-- survive across those two calls — and is worse. Supabase pools connections, so
-- the value stays on the connection and leaks into whatever unrelated request
-- picks that connection up next, mis-attributing someone else's write. Never
-- ship that.
--
-- So the actor must be declared AND the write performed inside ONE function
-- body — one transaction, one PostgREST request. That is the whole design:
-- `audit_declare_actor()` + an `update` in the same `security definer` function.
--
-- SPOOFING
-- --------
-- Two independent locks, either of which would be sufficient:
--   1. Reachability — these RPCs are executable by `service_role` ONLY (execute
--      is revoked from public/anon/authenticated at the bottom). A browser
--      client, logged in or not, cannot call them through PostgREST at all. The
--      only caller is our own server, which derives the actor from the verified
--      session via requireAdmin()/requireMemberOrAdmin(), never from the body.
--   2. Underivability — a human actor is identified by UUID, and the label
--      written to the log is looked up FROM auth.users inside the DB. Callers
--      cannot pass a human-readable actor string at all: free-text labels are
--      regex-restricted to `script:<name>`. So even a compromised or buggy route
--      cannot invent "tim@offtheplan.com" — it can only name a uid that really
--      exists, and the log records that uid's real email.
--
-- Corollary worth stating: do NOT later expose a bare `set_config`/`set_actor`
-- RPC to `authenticated`. That would hand any logged-in user the ability to
-- stamp `app.actor` with whatever they like and undo lock #2.

-- ----------------------------------------------------------------------------
-- 1. Teach the 052 trigger to read a declared actor uid.
-- ----------------------------------------------------------------------------
-- Unchanged from 052 except for `actor_uid`, which now falls back to the
-- `app.actor_uid` GUC when auth.uid() is NULL (i.e. every service-role write).
-- That GUC is only ever set by audit_declare_actor() below, which validates the
-- uid against auth.users first — so a value here is a real user, not a claim.
-- `create or replace` keeps this idempotent and re-runnable; the triggers
-- created in 052 pick up the new body automatically without being recreated.
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

    select coalesce(array_agg(t.key order by t.key), '{}'::text[])
      into v_changed
      from jsonb_object_keys(v_new) as t(key)
     where v_new -> t.key is distinct from v_old -> t.key;

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
    coalesce(nullif(auth.role(), ''), session_user),
    -- auth.uid() first: a direct end-user write (a member editing their own
    -- account through PostgREST) is self-evidently attributable and needs no
    -- help. app.actor_uid is the service-role path, where auth.uid() is always
    -- NULL and the app has told us who it is acting for.
    coalesce(auth.uid(), nullif(current_setting('app.actor_uid', true), '')::uuid),
    nullif(current_setting('app.actor', true), '')
  );

  return null; -- AFTER trigger — return value is ignored.
end;
$$ language plpgsql security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- 2. audit_declare_actor — the single place an actor is established.
-- ----------------------------------------------------------------------------
-- Sets `app.actor` (text label) and `app.actor_uid` (uuid) for the CURRENT
-- transaction only. Never call this on its own from the app — that is precisely
-- the two-transaction trap. It exists to be called from inside the RPCs below,
-- in the same function body as the write.
--
-- Exactly one of two identities is accepted:
--   * p_actor_uid  — a human. Must exist in auth.users. The label is derived
--                    here, from the DB, so it cannot be forged by the caller.
--   * p_actor_label — a script, and ONLY a script: the regex forbids anything
--                    that is not `script:<name>`. There is deliberately no way
--                    to assert a human identity via free text.
create or replace function public.audit_declare_actor(
  p_actor_uid   uuid default null,
  p_actor_label text default null
)
returns text as $$
declare
  v_email text;
  v_label text;
begin
  if p_actor_uid is not null then
    select u.email into v_email from auth.users u where u.id = p_actor_uid;
    if not found then
      raise exception 'audit_declare_actor: unknown actor uid %', p_actor_uid
        using errcode = 'check_violation';
    end if;

    -- Both the uid and the email. The uid is the durable key (emails get
    -- reassigned); the email is what makes the log readable without a join to
    -- auth.users, which admins querying the trail may not be able to see.
    v_label := 'user:' || coalesce(v_email, '<no-email>');
    perform set_config('app.actor', v_label, true);
    perform set_config('app.actor_uid', p_actor_uid::text, true);
    return v_label;
  end if;

  if p_actor_label is null then
    raise exception 'audit_declare_actor: an actor is required — pass p_actor_uid (human) or p_actor_label (script)'
      using errcode = 'check_violation';
  end if;

  -- Free text is restricted to `script:<name>` so it can never be mistaken for,
  -- or forged into, a human actor. Human actors always carry a uid.
  if p_actor_label !~ '^script:[a-z0-9][a-z0-9._-]{0,60}$' then
    raise exception 'audit_declare_actor: p_actor_label must match script:<name> (got %). Humans must be identified by p_actor_uid.', p_actor_label
      using errcode = 'check_violation';
  end if;

  perform set_config('app.actor', p_actor_label, true);
  -- Blank, not left alone: a previous declare in this same transaction must not
  -- leave a human uid attached to a script's writes.
  perform set_config('app.actor_uid', '', true);
  return p_actor_label;
end;
$$ language plpgsql security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- 3. Attributed writes.
-- ----------------------------------------------------------------------------
-- Shape note: these take a jsonb patch rather than one RPC per mutation
-- (admin_archive_account, admin_publish_account, admin_move_listing, ...).
-- Deliberate. The admin routes today issue ONE update carrying whatever the
-- admin changed — archived plus portal_status plus a phone number, in a single
-- statement. Splitting that into three narrow RPCs would mean three
-- transactions and three audit rows for one human action, and would rewrite
-- working code (is_published derivation, the profiles.member_status mirror) that
-- this migration has no business touching. A patch RPC is a drop-in for the
-- existing `.update()` call: same statement, same columns, same single audit
-- row — only now with an actor attached.
--
-- This grants the caller no power it did not already have: the service role
-- could already update any column via PostgREST. The keys are validated against
-- the real column list (so a typo fails loudly instead of silently not writing)
-- and identity columns are refused outright.

-- Internal: validate a patch and return the comma-separated column list.
create or replace function public.audit_patch_columns(p_table text, p_patch jsonb)
returns text as $$
declare
  v_bad  text;
  v_cols text;
begin
  if p_patch is null or jsonb_typeof(p_patch) <> 'object' or p_patch = '{}'::jsonb then
    raise exception 'patch must be a non-empty json object' using errcode = 'check_violation';
  end if;

  -- Never patchable: the row's identity and its creation time. Rewriting `id`
  -- would also detach the audit row from its subject.
  select string_agg(k.key, ', ') into v_bad
    from jsonb_object_keys(p_patch) as k(key)
   where k.key in ('id', 'created_at');
  if v_bad is not null then
    raise exception 'column(s) % are not patchable', v_bad using errcode = 'check_violation';
  end if;

  select string_agg(k.key, ', ') into v_bad
    from jsonb_object_keys(p_patch) as k(key)
   where not exists (
     select 1 from information_schema.columns c
      where c.table_schema = 'public' and c.table_name = p_table and c.column_name = k.key
   );
  if v_bad is not null then
    raise exception 'unknown column(s) % on %', v_bad, p_table using errcode = 'undefined_column';
  end if;

  select string_agg(format('%I', k.key), ', ' order by k.key)
    into v_cols
    from jsonb_object_keys(p_patch) as k(key);
  return v_cols;
end;
$$ language plpgsql security definer set search_path = public;

-- Attributed UPDATE on accounts.
-- Covers the mutations that caused this mess: archived (archive/unarchive),
-- is_published (publish/unpublish), type, portal_status — plus every other
-- column the admin form writes in the same statement.
create or replace function public.admin_update_account(
  p_account_id  uuid,
  p_patch       jsonb,
  p_actor_uid   uuid default null,
  p_actor_label text default null
)
returns jsonb as $$
declare
  v_cols text;
  v_row  jsonb;
begin
  -- Actor first, write second, SAME function body => same transaction. This
  -- ordering is the entire point of the RPC; do not split it.
  perform public.audit_declare_actor(p_actor_uid, p_actor_label);

  v_cols := public.audit_patch_columns('accounts', p_patch);

  -- jsonb_populate_record casts each value to its real column type using the
  -- table's own rowtype, so booleans/timestamps/arrays land correctly instead of
  -- as text. Only the keys present in the patch appear in the SET list, so
  -- absent columns are untouched — same semantics as supabase-js .update().
  execute format(
    'update accounts set (%1$s) = (select %1$s from jsonb_populate_record(null::accounts, $1))
      where id = $2 returning to_jsonb(accounts)',
    v_cols
  ) into v_row using p_patch, p_account_id;

  if v_row is null then
    raise exception 'account % not found', p_account_id using errcode = 'no_data_found';
  end if;
  return v_row;
end;
$$ language plpgsql security definer set search_path = public;

-- Attributed UPDATE on developments.
-- Covers the client's core complaint — a listing moving between profiles
-- (`account_id`) — plus is_published/status/tier and the rest of the form.
create or replace function public.admin_update_development(
  p_development_id uuid,
  p_patch          jsonb,
  p_actor_uid      uuid default null,
  p_actor_label    text default null
)
returns jsonb as $$
declare
  v_cols text;
  v_row  jsonb;
begin
  perform public.audit_declare_actor(p_actor_uid, p_actor_label);

  v_cols := public.audit_patch_columns('developments', p_patch);

  execute format(
    'update developments set (%1$s) = (select %1$s from jsonb_populate_record(null::developments, $1))
      where id = $2 returning to_jsonb(developments)',
    v_cols
  ) into v_row using p_patch, p_development_id;

  if v_row is null then
    raise exception 'development % not found', p_development_id using errcode = 'no_data_found';
  end if;
  return v_row;
end;
$$ language plpgsql security definer set search_path = public;

-- ----------------------------------------------------------------------------
-- 4. Reachability — lock #1 from the header.
-- ----------------------------------------------------------------------------
-- Postgres grants EXECUTE to PUBLIC on new functions by default, and Supabase
-- additionally hands anon/authenticated broad function access, so an explicit
-- revoke is required — without it any logged-in user could call these through
-- PostgREST and write as `service_role`, which would be a privilege escalation
-- far worse than a bad audit trail.
--
-- audit_declare_actor / audit_patch_columns are granted to NOBODY. They are
-- `security definer` and owned by the same role that owns the callers, so the
-- RPCs above can still call them internally; nothing can call them directly.
revoke all on function public.audit_declare_actor(uuid, text)         from public, anon, authenticated, service_role;
revoke all on function public.audit_patch_columns(text, jsonb)        from public, anon, authenticated, service_role;
revoke all on function public.admin_update_account(uuid, jsonb, uuid, text)     from public, anon, authenticated;
revoke all on function public.admin_update_development(uuid, jsonb, uuid, text) from public, anon, authenticated;

grant execute on function public.admin_update_account(uuid, jsonb, uuid, text)     to service_role;
grant execute on function public.admin_update_development(uuid, jsonb, uuid, text) to service_role;

comment on function public.admin_update_account(uuid, jsonb, uuid, text) is
  'Attributed UPDATE on accounts: declares the actor and writes in ONE transaction so '
  'the 052 audit trigger records who. service_role only. Humans via p_actor_uid '
  '(validated against auth.users); scripts via p_actor_label (''script:<name>'' only). '
  'See docs/audit-log.md.';

comment on function public.admin_update_development(uuid, jsonb, uuid, text) is
  'Attributed UPDATE on developments (incl. account_id listing transfers): declares the '
  'actor and writes in ONE transaction so the 052 audit trigger records who. '
  'service_role only. See docs/audit-log.md.';

comment on function public.audit_declare_actor(uuid, text) is
  'Sets app.actor / app.actor_uid for the CURRENT transaction. Internal — must be called '
  'from inside the same function body as the write it attributes, never as a standalone '
  'RPC (set_config(..., true) is transaction-local and would be discarded).';
