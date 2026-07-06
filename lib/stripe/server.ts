import Stripe from "stripe";

/**
 * Server-side Stripe client + tier → price-ID mapping.
 *
 * TEST MODE for now: STRIPE_SECRET_KEY holds an sk_test_ key for the
 * offtheplan.com.au account (acct_1JQR7q…). That account is shared with
 * SubtleMove, so every Off The Plan product/price is tagged
 * metadata.platform = "off-the-plan" and the webhook filters on it.
 *
 * Going live is purely an env swap (no code changes): in Vercel, replace
 * STRIPE_SECRET_KEY with the sk_live_ key and each STRIPE_PRICE_* value with
 * its live-mode price ID (created by re-running the same product script
 * against live mode). See lib/stripe/test-prices.json for the current
 * test-mode IDs.
 */
let _stripe: Stripe | null = null;

/**
 * Lazily construct the Stripe client. Initialising at module load would throw
 * ("Neither apiKey nor…") whenever STRIPE_SECRET_KEY is unset — crashing the
 * route with an opaque 500. Calling this inside a handler lets us return a
 * clean error until the key is configured.
 */
export function getStripe(): Stripe {
  if (_stripe) return _stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  _stripe = new Stripe(key);
  return _stripe;
}

export type CheckoutTier =
  | "agency_listing"
  | "builders_package"
  | "promo_flag"
  | "featured_tier2"
  | "featured_tier1"
  | "home_banner";

/** Price ID per tier, read from env so test↔live is a config-only swap. */
export const PRICE_BY_TIER: Record<CheckoutTier, string | undefined> = {
  agency_listing: process.env.STRIPE_PRICE_AGENCY_LISTING,
  builders_package: process.env.STRIPE_PRICE_BUILDERS_PACKAGE,
  promo_flag: process.env.STRIPE_PRICE_PROMO_FLAG,
  featured_tier2: process.env.STRIPE_PRICE_FEATURED_TIER2,
  featured_tier1: process.env.STRIPE_PRICE_FEATURED_TIER1,
  home_banner: process.env.STRIPE_PRICE_HOME_BANNER,
};

export function isCheckoutTier(value: string): value is CheckoutTier {
  return Object.prototype.hasOwnProperty.call(PRICE_BY_TIER, value);
}

/** Tag put on every session/subscription so the shared-account webhook can filter. */
export const PLATFORM_TAG = "off-the-plan";
