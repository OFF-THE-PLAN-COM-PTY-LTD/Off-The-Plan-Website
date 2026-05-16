-- Extra fields for news articles (matching old admin News and Events Detail form)
ALTER TABLE journal_articles
  ADD COLUMN IF NOT EXISTS subtitle            text,
  ADD COLUMN IF NOT EXISTS meta_title          text,
  ADD COLUMN IF NOT EXISTS meta_content        text,
  ADD COLUMN IF NOT EXISTS list_page_image_url text,
  ADD COLUMN IF NOT EXISTS article_image_one   text,
  ADD COLUMN IF NOT EXISTS article_image_two   text;
