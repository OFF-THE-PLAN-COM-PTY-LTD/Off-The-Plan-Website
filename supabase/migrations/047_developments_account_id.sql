-- Phase 3: repoint listings at `accounts` (additive, non-breaking).
-- ============================================================================
-- Adds developments.account_id alongside the existing developer_id / agency_id.
-- Both legacy FKs stay populated during the transition so every current read
-- (the developer:developers(*) embeds on the homepage/search/saved/listing
-- pages) keeps working. The data backfill runs AFTER accounts is populated —
-- see the UPDATE statements in the Phase 3 backfill (scripts/backfill-account-id.sql
-- or run inline), which map developer_id/agency_id -> the account via the
-- accounts.legacy_developer_id / legacy_agency_id crosswalk.

alter table developments
  add column if not exists account_id uuid references accounts(id) on delete set null;

create index if not exists idx_developments_account_id on developments(account_id);
