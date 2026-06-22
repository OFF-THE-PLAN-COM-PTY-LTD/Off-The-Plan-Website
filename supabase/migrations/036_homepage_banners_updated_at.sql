-- Fix: editing a homepage banner failed with
--   record "new" has no field "updated_at"
--
-- Root cause: homepage_banners was created manually in Studio WITHOUT an
-- updated_at column. Migration 026 attached a BEFORE UPDATE trigger
-- (set_updated_at_homepage_banners -> update_updated_at_column) which sets
-- NEW.updated_at, but 026 used CREATE TABLE IF NOT EXISTS, so on the existing
-- table the column was never actually added. Every UPDATE then errors; INSERTs
-- are unaffected (the trigger only fires BEFORE UPDATE), which is why creating
-- a banner worked but editing one did not.
--
-- Add the missing column (idempotent) and re-assert the trigger.

ALTER TABLE homepage_banners
  ADD COLUMN IF NOT EXISTS updated_at timestamptz NOT NULL DEFAULT now();

-- update_updated_at_column() is defined in 002_developments.sql.
DROP TRIGGER IF EXISTS set_updated_at_homepage_banners ON homepage_banners;
CREATE TRIGGER set_updated_at_homepage_banners
  BEFORE UPDATE ON homepage_banners
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
