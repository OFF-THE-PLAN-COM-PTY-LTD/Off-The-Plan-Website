-- Ads management: one row per ad slot on a public page
CREATE TABLE IF NOT EXISTS ads (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page               text NOT NULL CHECK (page IN ('home','listings','resources','news','guides')),
  position           text NOT NULL CHECK (position IN ('top','middle','bottom','right')),
  ad_type            text NOT NULL DEFAULT 'image' CHECK (ad_type IN ('image','adsense')),
  desktop_image_url  text,
  mobile_image_url   text,
  web_link           text,
  adsense_code       text,
  is_active          boolean NOT NULL DEFAULT true,
  sort_order         int NOT NULL DEFAULT 0,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ads_page_position ON ads (page, position, is_active);

ALTER TABLE ads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public reads active ads"
  ON ads FOR SELECT USING (is_active = true);

CREATE POLICY "Service role manages ads"
  ON ads FOR ALL USING (auth.role() = 'service_role');
