CREATE TABLE IF NOT EXISTS developers (
  id           uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug         text UNIQUE NOT NULL,
  name         text NOT NULL,
  description  text,
  logo_url     text,
  website      text,
  abn          text,
  state        text,
  is_published boolean NOT NULL DEFAULT false,
  created_at   timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE developers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published developers"
  ON developers FOR SELECT
  USING (is_published = true);

CREATE POLICY "Service role has full access to developers"
  ON developers FOR ALL
  USING (auth.role() = 'service_role');
