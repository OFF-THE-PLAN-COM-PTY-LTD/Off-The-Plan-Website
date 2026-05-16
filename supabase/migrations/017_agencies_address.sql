ALTER TABLE agencies
  ADD COLUMN IF NOT EXISTS personal_street_address  text,
  ADD COLUMN IF NOT EXISTS personal_country         text,
  ADD COLUMN IF NOT EXISTS personal_state           text,
  ADD COLUMN IF NOT EXISTS personal_city            text,
  ADD COLUMN IF NOT EXISTS personal_postcode        text,
  ADD COLUMN IF NOT EXISTS org_street_address       text,
  ADD COLUMN IF NOT EXISTS org_street_address_2     text,
  ADD COLUMN IF NOT EXISTS org_country              text,
  ADD COLUMN IF NOT EXISTS org_state                text,
  ADD COLUMN IF NOT EXISTS org_city                 text,
  ADD COLUMN IF NOT EXISTS org_postcode             text;
