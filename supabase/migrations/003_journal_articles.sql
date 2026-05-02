CREATE TABLE IF NOT EXISTS journal_articles (
  id                 uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug               text UNIQUE NOT NULL,
  title              text NOT NULL,
  category           text NOT NULL,
  hero_image_url     text,
  body_html          text,
  author             text,
  read_time_minutes  int,
  published_at       timestamptz,
  is_published       boolean NOT NULL DEFAULT false,
  created_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_journal_category ON journal_articles(category);
CREATE INDEX IF NOT EXISTS idx_journal_published ON journal_articles(is_published, published_at DESC);

ALTER TABLE journal_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published articles"
  ON journal_articles FOR SELECT USING (is_published = true);

CREATE POLICY "Service role has full access to journal"
  ON journal_articles FOR ALL USING (auth.role() = 'service_role');
