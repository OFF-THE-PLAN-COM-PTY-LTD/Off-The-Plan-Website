-- Phase 5 / Developers Directory linkage.
--
-- Today the `developers` table (driving the public /developers
-- directory) and the `profiles` table (where developer-members manage
-- their company info via /portal/profile) are completely disconnected.
-- This migration adds an optional 1:1 link so a developer-member's
-- profile can be the source of truth for their directory entry.
--
-- One profile maps to at most one developer row (UNIQUE), and one
-- developer row optionally links to one profile (nullable — admins
-- can still create directory entries for non-member developers).
--
-- Per dev plan Phase 5 (Jun 2026 client feedback session).
alter table developers
  add column if not exists profile_id uuid references profiles(id) on delete set null;

-- Enforce one-developer-row-per-profile so we don't end up with
-- duplicate directory entries when a member ticks the opt-in box twice.
create unique index if not exists developers_profile_id_unique
  on developers(profile_id)
  where profile_id is not null;
