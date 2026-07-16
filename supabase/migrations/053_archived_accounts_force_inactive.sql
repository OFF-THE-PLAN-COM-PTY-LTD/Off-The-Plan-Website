-- Archiving an account must revoke its portal access.
-- ============================================================================
-- `accounts.archived` (admin soft-delete, 042/046) and `accounts.portal_status`
-- (the login gate, mirrored onto profiles.member_status) were deliberately
-- independent: archiving only hid a row from the Active/Inactive tabs in
-- /admin/agencies and left portal access untouched. That product decision has
-- changed — an archived account must not be able to sign in.
--
-- The existing archived-but-active rows were already reconciled out-of-band
-- (scripts/archived-to-inactive.mjs); this migration is the FORWARD-GOING rule
-- that stops the two columns drifting apart again.
--
-- Enforced in the DB rather than only in app/api/admin/agencies/route.ts so
-- that every writer obeys it — the admin API, one-off .mjs scripts run with the
-- service role, and hand edits in the Supabase dashboard table editor alike.
--
-- KNOWN LIMITATION (deliberate): this trigger can only fix `accounts`. The
-- login gate is *mirrored* onto `profiles.member_status` by the admin API
-- (syncAccountMemberStatus in app/api/admin/agencies/route.ts), and a BEFORE
-- trigger on `accounts` must not reach across and write `profiles` — that would
-- bury a cross-table side effect (and its email side effect) inside a row
-- trigger. So an archive performed by a script or by a dashboard edit will flip
-- accounts.portal_status to 'inactive' but leave profiles.member_status stale.
-- The admin API therefore still sets portal_status = 'inactive' explicitly when
-- it archives, so the profiles mirror stays in sync on that path; the trigger is
-- the backstop for everything else.

create or replace function public.force_inactive_portal_when_archived()
returns trigger as $$
begin
  -- One direction only. Archiving revokes access; UN-archiving must NOT
  -- auto-reactivate, because that would silently hand portal access back to
  -- someone who was deactivated on their own merits before they were ever
  -- archived. Un-archive leaves portal_status exactly as it was — an admin
  -- reactivates deliberately via the Activate action (which also mirrors
  -- member_status).
  if new.archived then
    new.portal_status := 'inactive';
  end if;
  return new;
end;
$$ language plpgsql security definer set search_path = public;

-- Trigger NAME matters here, not just its body.
--
-- `accounts` already carries a BEFORE UPDATE trigger from 046:
-- `protect_account_admin_columns_trg`, which — for non-service-role callers —
-- reverts new.archived / new.portal_status back to their OLD values so an owner
-- editing their own row cannot self-publish or un-archive. Postgres fires
-- multiple BEFORE triggers on the same table in ALPHABETICAL ORDER BY TRIGGER
-- NAME, so ordering is decided purely by what we call this one.
--
-- 'sync_...' sorts after 'protect_...', so this trigger runs LAST and sees the
-- post-protection row. That is the ordering we want: we assert the invariant
-- against the values that will actually be written. If this fired FIRST
-- instead, protect_account_admin_columns_trg would immediately revert the
-- portal_status we just forced, and the rule would silently apply to service-
-- role writes only. (`set_updated_at_accounts` also sorts between the two; it
-- touches neither column, so its position is irrelevant.)
drop trigger if exists sync_portal_status_on_archive_trg on accounts;
create trigger sync_portal_status_on_archive_trg
  before insert or update on accounts
  for each row execute function public.force_inactive_portal_when_archived();
