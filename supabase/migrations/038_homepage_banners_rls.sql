-- Enable RLS on homepage_banners (created manually in Studio without RLS)
-- All reads/writes go through supabaseAdmin (service role) which bypasses RLS,
-- so enabling RLS here simply closes off any anon/user-key access to this table.

ALTER TABLE IF EXISTS homepage_banners ENABLE ROW LEVEL SECURITY;

-- No public policies — only the service role can access this table.
-- Admins interact via /api/admin/homepage-banners which uses supabaseAdmin.
