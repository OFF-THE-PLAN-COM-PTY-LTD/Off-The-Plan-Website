CREATE TABLE IF NOT EXISTS developments (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug              text UNIQUE NOT NULL,
  name              text NOT NULL,
  suburb            text,
  state             text,
  price_from        bigint,
  price_display     text,
  beds_min          int,
  beds_max          int,
  completion_quarter text,
  type              text,
  developer_id      uuid REFERENCES developers(id),
  tag               text,
  status            text,
  summary           text,
  lifestyle         text[],
  architect         text,
  interiors         text,
  landscape         text,
  builder           text,
  levels            int,
  residence_count   int,
  lat               decimal(9, 6),
  lng               decimal(9, 6),
  is_published      boolean NOT NULL DEFAULT false,
  is_featured       boolean NOT NULL DEFAULT false,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS development_images (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id   uuid NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  url              text NOT NULL,
  caption          text,
  sort_order       int NOT NULL DEFAULT 0,
  is_hero          boolean NOT NULL DEFAULT false
);

CREATE TABLE IF NOT EXISTS development_floor_plans (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  development_id   uuid NOT NULL REFERENCES developments(id) ON DELETE CASCADE,
  plan_type        text,
  config           text,
  internal_sqm     int,
  price_from       bigint,
  image_url        text
);

CREATE INDEX IF NOT EXISTS idx_developments_state ON developments(state);
CREATE INDEX IF NOT EXISTS idx_developments_type ON developments(type);
CREATE INDEX IF NOT EXISTS idx_developments_published ON developments(is_published);
CREATE INDEX IF NOT EXISTS idx_developments_featured ON developments(is_featured);
CREATE INDEX IF NOT EXISTS idx_developments_developer ON developments(developer_id);

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_developments_updated_at
  BEFORE UPDATE ON developments
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

ALTER TABLE developments ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE development_floor_plans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published developments"
  ON developments FOR SELECT USING (is_published = true);

CREATE POLICY "Public can read images of published developments"
  ON development_images FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM developments d
    WHERE d.id = development_id AND d.is_published = true
  ));

CREATE POLICY "Public can read floor plans of published developments"
  ON development_floor_plans FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM developments d
    WHERE d.id = development_id AND d.is_published = true
  ));

CREATE POLICY "Service role has full access to developments"
  ON developments FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to development images"
  ON development_images FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role has full access to floor plans"
  ON development_floor_plans FOR ALL USING (auth.role() = 'service_role');
