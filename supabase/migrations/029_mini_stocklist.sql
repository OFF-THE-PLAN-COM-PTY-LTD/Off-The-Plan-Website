-- Mini stocklist: the "Properties Available" table on each listing
-- detail page (Tim's term for what his admin calls "optional uploads").
-- Up to 20 entries per listing (Tim's spec, 25.05.26 reply), each with
-- bedrooms / bathrooms / parking / total size / price-from columns.
-- Stored as jsonb array since rows are flat strings and order matters.
alter table developments
  add column if not exists mini_stocklist jsonb default '[]'::jsonb;
