-- 043_listing_subscription.sql
-- Per-listing Stripe subscription. Each development is kept live by an active
-- monthly subscription. The Stripe webhook writes these columns and, on the
-- payment/cancel transitions, drives is_published (admins can still override
-- is_published manually via the existing admin controls).

alter table developments add column if not exists subscription_status text;
alter table developments add column if not exists stripe_subscription_id text;
alter table developments add column if not exists stripe_customer_id text;
alter table developments add column if not exists subscription_current_period_end timestamptz;

comment on column developments.subscription_status is
  'Stripe subscription status for this listing: active | past_due | canceled | null (never subscribed). active = paid and live-eligible.';

create index if not exists idx_developments_subscription_status
  on developments(subscription_status);
