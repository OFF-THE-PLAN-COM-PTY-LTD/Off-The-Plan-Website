-- Tim's live config summaries carry text prices like "Contact Agent",
-- "View for More Details", or "$605k to $710k" — not just integers.
-- Add a free-text column so we can preserve display fidelity instead
-- of forcing every row into the bigint price_from column.
alter table development_floor_plans
  add column if not exists price_display text;
