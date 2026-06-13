-- House and Land per-category fields. The public listing card shows
-- Beds / Bath / Garage / Land Size (m²); the Mini Stocklist
-- additionally captures House Size (m²) and Frontage (m). Per dev
-- spec v4 (Jun 2026), PDF page 2-3.
--
-- frontage_m already exists from migration 030 (Land Estates), so we
-- only add house_size_sqm and land_size_sqm here. Other categories
-- leave these null.
alter table development_floor_plans
  add column if not exists house_size_sqm  numeric,
  add column if not exists land_size_sqm   numeric;
