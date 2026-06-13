-- Land Estates per-category fields. The Configuration Summary card
-- and Mini Stocklist must show lot-specific data (lot number, land
-- area, frontage, depth) instead of beds/bath/garage when the listing
-- type is "Land and Estates". Per dev spec v4 (Jun 2026).
--
-- Adding the new columns to development_floor_plans rather than
-- widening the mini_stocklist jsonb shape — flat columns keep query
-- and rendering simple. Other category types leave these null.
alter table development_floor_plans
  add column if not exists lot_number     text,
  add column if not exists land_area_sqm  numeric,
  add column if not exists frontage_m     numeric,
  add column if not exists depth_m        numeric;
