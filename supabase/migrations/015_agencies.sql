CREATE TABLE IF NOT EXISTS agencies (
  id                    uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name                  text,
  email                 text,
  org_name              text,
  mobile                text,
  total_active_listings int NOT NULL DEFAULT 0,
  email_verified        boolean NOT NULL DEFAULT false,
  portal_status         text NOT NULL DEFAULT 'active' CHECK (portal_status IN ('active', 'inactive')),
  legacy_id             text UNIQUE,
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE agencies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role has full access to agencies"
  ON agencies FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Admins can read agencies"
  ON agencies FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.is_admin = true
  ));
