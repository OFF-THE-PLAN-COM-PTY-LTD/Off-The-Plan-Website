CREATE TABLE IF NOT EXISTS enquiries (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id   uuid NOT NULL REFERENCES developments(id),
  full_name        text NOT NULL,
  email            text NOT NULL,
  mobile           text,
  buyer_type       text,
  notes            text,
  status           text NOT NULL DEFAULT 'new',
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS circle_signups (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name        text NOT NULL,
  email            text UNIQUE NOT NULL,
  interest_type    text,
  source           text,
  created_at       timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS developer_leads (
  id                  uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_name        text NOT NULL,
  email               text NOT NULL,
  company             text,
  phone               text,
  development_name    text NOT NULL,
  suburb              text,
  state               text,
  residence_count     int,
  expected_completion text,
  notes               text,
  status              text NOT NULL DEFAULT 'new',
  created_at          timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE enquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE circle_signups ENABLE ROW LEVEL SECURITY;
ALTER TABLE developer_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages enquiries"
  ON enquiries FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages circle_signups"
  ON circle_signups FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role manages developer_leads"
  ON developer_leads FOR ALL USING (auth.role() = 'service_role');
