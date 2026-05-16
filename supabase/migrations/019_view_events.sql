-- Time-series view tracking (one row per listing page visit)
CREATE TABLE IF NOT EXISTS listing_view_events (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id uuid NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  viewed_at      timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_view_events_dev_time
  ON listing_view_events (development_id, viewed_at);

ALTER TABLE listing_view_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages view events"
  ON listing_view_events FOR ALL USING (auth.role() = 'service_role');
