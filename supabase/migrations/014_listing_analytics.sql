-- Add analytics counters to developments
ALTER TABLE developments
  ADD COLUMN IF NOT EXISTS view_count         int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS phone_click_count  int NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS share_count        int NOT NULL DEFAULT 0;

-- Atomic increment helpers (avoids race conditions)
CREATE OR REPLACE FUNCTION increment_view_count(dev_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE developments SET view_count = view_count + 1 WHERE id = dev_id;
$$;

CREATE OR REPLACE FUNCTION increment_phone_click_count(dev_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE developments SET phone_click_count = phone_click_count + 1 WHERE id = dev_id;
$$;

CREATE OR REPLACE FUNCTION increment_share_count(dev_id uuid)
RETURNS void LANGUAGE sql SECURITY DEFINER AS $$
  UPDATE developments SET share_count = share_count + 1 WHERE id = dev_id;
$$;
