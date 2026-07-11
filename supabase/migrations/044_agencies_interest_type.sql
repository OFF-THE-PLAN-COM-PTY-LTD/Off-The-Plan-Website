-- Store the Developer/Agent classification directly on the agency row.
-- ====================================================================
-- Previously `interest_type` lived ONLY on `profiles`, which requires a
-- Supabase Auth account. Migrated / directory-only agencies have no login,
-- so the per-row Role dropdown on /admin/agencies 409'd with
--   "No auth user linked to this profile — cannot set role until they sign up."
--
-- Adding the column here lets an admin classify ANY agency, account or not.
--
-- profiles.interest_type stays the source of truth for PORTAL gating
-- (auth-guards / middleware / portal layout read it). The interest-type
-- endpoint mirrors this agency value onto the linked profile whenever an
-- auth user exists, so the two stay in sync for accounts that can log in.

ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS interest_type text
  CHECK (interest_type IN ('Developer', 'Agent'));

-- Backfill from existing profiles so members already classified the old way
-- keep their role once the admin table starts reading from agencies. Matches
-- by email (the same link the app already uses — there's no FK between the
-- two tables).
UPDATE agencies a
SET interest_type = p.interest_type
FROM auth.users u
JOIN profiles p ON p.id = u.id
WHERE lower(a.email) = lower(u.email)
  AND p.interest_type IN ('Developer', 'Agent')
  AND a.interest_type IS NULL;
