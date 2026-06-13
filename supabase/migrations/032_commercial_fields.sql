-- Commercial per-category fields. The public listing card shows
-- Floor Area (m²) / Level / Car Spaces (3 fields, smaller than the
-- usual 4) + Price From. The Mini Stocklist additionally captures
-- Unit / Suite No. and a Property Sub-Type dropdown (Office, Retail,
-- Industrial, Warehouse, Medical, Childcare, Development Site). Per
-- dev spec v4 (Jun 2026), PDF page 3-4.
--
-- Reuses the existing parking column (renders as "Car Spaces" on the
-- public card for Commercial — same data, different label).
alter table development_floor_plans
  add column if not exists floor_area_sqm    numeric,
  add column if not exists level             text,
  add column if not exists unit_suite_no     text,
  add column if not exists property_sub_type text;
