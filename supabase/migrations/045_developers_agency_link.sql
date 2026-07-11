-- Link a public /developers directory row back to its source agency.
-- ====================================================================
-- Agencies classified as interest_type='Developer' on /admin/agencies
-- should surface on the public /developers page with their logo / about /
-- socials. The public list + /developers/[slug] detail + listing counts
-- are all keyed to the `developers` table, so rather than union agencies
-- into those pages (which would break every card's slug link), we sync a
-- `developers` row per Developer-agency.
--
-- This mirrors the existing `profile_id` link (migration 034): one agency
-- maps to at most one developer row; one developer row optionally points
-- back to an agency. `on delete set null` keeps directory entries alive if
-- an agency row is ever removed.

ALTER TABLE developers
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES agencies(id) ON DELETE SET NULL;

-- One developer row per agency, so re-syncing an agency never creates a
-- duplicate directory entry.
CREATE UNIQUE INDEX IF NOT EXISTS developers_agency_id_unique
  ON developers(agency_id)
  WHERE agency_id IS NOT NULL;
