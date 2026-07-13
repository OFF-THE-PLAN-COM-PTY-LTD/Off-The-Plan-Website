-- Perf: mirror profiles.is_admin / interest_type into auth.users app_metadata
-- so the middleware can read the role from getUser()'s returned app_metadata
-- (which is live, straight from auth.users) instead of a separate `profiles`
-- query on EVERY /admin and /api/admin request (incl. every sidebar prefetch).
--
-- A DB trigger keeps it in sync automatically — no scattered app-code sync
-- points, and no staleness (getUser reads the current auth.users record).
-- The backfill at the bottom populates existing users; the middleware falls
-- back to a profiles query for any token/user that predates this, so it's safe
-- to ship before the backfill has touched everyone.

create or replace function public.sync_role_to_app_metadata()
returns trigger as $$
begin
  update auth.users
    set raw_app_meta_data =
      coalesce(raw_app_meta_data, '{}'::jsonb)
      || jsonb_build_object(
           'is_admin', coalesce(new.is_admin, false),
           'interest_type', new.interest_type
         )
    where id = new.id;
  return new;
end;
$$ language plpgsql security definer set search_path = public, auth;

drop trigger if exists sync_role_to_app_metadata_trg on profiles;
create trigger sync_role_to_app_metadata_trg
  after insert or update of is_admin, interest_type on profiles
  for each row execute function public.sync_role_to_app_metadata();

-- One-time backfill for existing users.
update auth.users u
  set raw_app_meta_data =
    coalesce(u.raw_app_meta_data, '{}'::jsonb)
    || jsonb_build_object(
         'is_admin', coalesce(p.is_admin, false),
         'interest_type', p.interest_type
       )
  from public.profiles p
  where p.id = u.id;
