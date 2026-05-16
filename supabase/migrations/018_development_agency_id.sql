ALTER TABLE developments
  ADD COLUMN IF NOT EXISTS agency_id uuid REFERENCES agencies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_developments_agency_id ON developments(agency_id);
