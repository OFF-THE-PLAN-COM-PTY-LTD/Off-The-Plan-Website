-- Reconcile `developments` migration source with the LIVE schema.
-- These columns exist in production but were added directly in the Supabase
-- dashboard, so a rebuild-from-migrations (local, staging) was missing them
-- and listing writes failed ("could not find the 'description_html' column").
-- All additive; `IF NOT EXISTS` makes this a no-op on prod.
alter table developments
  add column if not exists owner_user_id          uuid,
  add column if not exists portal_developer_name  text,
  add column if not exists description_html        text;
