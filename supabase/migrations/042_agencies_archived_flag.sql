-- Adds a soft-archive flag to agencies. The /admin/agencies "Archived" tab
-- previously showed only rows with no matching Supabase Auth user (legacy
-- orphans); this column lets admins manually retire a profile without
-- deleting anything. Archived tab now shows: agencies.archived = true OR
-- no linked auth user.
--
-- Non-destructive: nothing is deleted on archive; the row is simply hidden
-- from Active/Inactive/All views. Un-archive by setting the flag back to
-- false via the same PATCH /api/admin/agencies endpoint.

ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;
