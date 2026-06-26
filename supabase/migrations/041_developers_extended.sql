-- Extend developers table so /admin/developers can edit the full set of
-- fields rendered on /developers/[slug] — without requiring a linked
-- portal profile. Reason: most directory entries are migrated rows with
-- no profile_id, so admin had no way to fill in socials/suburb/email/etc.
-- Public page still prefers a linked profile's data when present.

ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS suburb        text,
  ADD COLUMN IF NOT EXISTS company_email text,
  ADD COLUMN IF NOT EXISTS facebook      text,
  ADD COLUMN IF NOT EXISTS instagram     text,
  ADD COLUMN IF NOT EXISTS linkedin      text,
  ADD COLUMN IF NOT EXISTS pinterest     text,
  ADD COLUMN IF NOT EXISTS youtube       text;
