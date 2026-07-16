-- Keep accounts.total_active_listings in sync with reality.
-- ============================================================================
-- Background
-- ----------
-- `accounts.total_active_listings` (046) was a *static* denormalised int, seeded
-- once at backfill from the legacy scrape (scripts/backfill-accounts.mjs). Nothing
-- ever recomputed it, so any operation that repoints a listing left it stale:
--   * Admin "Move Listing" (app/admin/listings/listing-row-actions.tsx) updates
--     developments.account_id but never touched the counter.
--   * Publishing / inactivating / deleting a listing likewise never touched it.
-- Result: the "Active Listings" column and "View Listings (N)" button on
-- /admin/agencies showed numbers that no longer matched the linked listings — the
-- reported bug (moved a listing, both profiles still showed the old count).
--
-- Fix
-- ---
-- Make the counter derived from live data via triggers on `developments`, and
-- backfill every account once so production is correct immediately.
--
-- Definition of "active": is_published = true. This matches the portal dashboard
-- "Active Listings" tile (app/portal/page.tsx) and the admin listing views. The
-- canonical link is developments.account_id (what Move Listing updates); counting
-- by account_id keeps a listing on exactly one profile, so a move cleanly
-- decrements the source and increments the destination.

-- Recompute a single account's counter from live developments.
create or replace function public.recompute_account_listing_count(p_account_id uuid)
returns void as $$
begin
  if p_account_id is null then
    return;
  end if;
  update accounts a
     set total_active_listings = (
       select count(*)
         from developments d
        where d.account_id = p_account_id
          and d.is_published = true
     )
   where a.id = p_account_id;
end;
$$ language plpgsql security definer set search_path = public;

-- Row trigger: recompute the affected account(s) whenever a listing's account
-- link or published flag changes (or it is inserted / deleted).
create or replace function public.developments_sync_account_count()
returns trigger as $$
begin
  if tg_op = 'INSERT' then
    perform public.recompute_account_listing_count(new.account_id);
  elsif tg_op = 'DELETE' then
    perform public.recompute_account_listing_count(old.account_id);
  else -- UPDATE
    if new.account_id is distinct from old.account_id
       or new.is_published is distinct from old.is_published then
      -- Recompute both sides. When the account is unchanged the second call is a
      -- harmless idempotent no-op.
      perform public.recompute_account_listing_count(old.account_id);
      perform public.recompute_account_listing_count(new.account_id);
    end if;
  end if;
  return null;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists developments_sync_account_count_trg on developments;
create trigger developments_sync_account_count_trg
  after insert or update or delete on developments
  for each row execute function public.developments_sync_account_count();

-- One-time backfill: correct every existing account from live data.
update accounts a
   set total_active_listings = coalesce((
     select count(*)
       from developments d
      where d.account_id = a.id
        and d.is_published = true
   ), 0)
 where a.total_active_listings is distinct from coalesce((
     select count(*)
       from developments d
      where d.account_id = a.id
        and d.is_published = true
   ), 0);
