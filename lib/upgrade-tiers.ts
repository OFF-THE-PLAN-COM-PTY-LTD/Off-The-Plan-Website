/**
 * Featured Upgrade tier definitions — shared between the member portal
 * (/portal/pricing) and the public-facing pricing page
 * (/features-and-pricing) so the two stay in sync.
 *
 * Per Tim's May 29 reply: 4 tiers (Promo Flag, Tier 2, Tier 1, Banner)
 * sold as monthly add-ons billed alongside the standard subscription.
 */

export interface UpgradeTier {
  name: string;
  price: number;
  features: string[];
  /** Member-portal CTA label (action wording). */
  cta: string;
  /** Promo Flag is the only tier that doesn't open the upgrade-request modal. */
  isPromoFlag: boolean;
  /** Stripe checkout tier key — matches CheckoutTier in lib/stripe/server.ts. */
  tier: "promo_flag" | "featured_tier2" | "featured_tier1" | "home_banner";
  /**
   * Illustrative mockup shown on the pricing cards so buyers can see what the
   * upgrade looks like on the live site. Served from /public/plans_and_pricing/
   * (extracted from the legacy site). Tall image — rendered full card width.
   */
  image: string;
}

export const UPGRADE_TIERS: UpgradeTier[] = [
  {
    name: "Promo Flag",
    price: 50,
    features: [
      "Available for all properties",
      "Promotional flag on the listing",
      "Add a short snappy message",
      "$50 + GST per month",
    ],
    cta: "ADD A PROMO FLAG",
    isPromoFlag: true,
    tier: "promo_flag",
    image: "/plans_and_pricing/OTP-Pricing-Flag.jpg",
  },
  {
    name: "Featured Project Tier 2",
    price: 200,
    features: [
      "Available for all properties",
      "Property featured under the home page banner (2nd row)",
      "$200 + GST per month",
      "Up to 8 available each month",
    ],
    cta: "REQUEST AN UPGRADE",
    isPromoFlag: false,
    tier: "featured_tier2",
    image: "/plans_and_pricing/OTP-Pricing-Tier2.jpg",
  },
  {
    name: "Featured Project Tier 1",
    price: 400,
    features: [
      "Available to New Apartments and Townhouses",
      "Property featured under the home page banner",
      "$400 + GST per month",
      "Up to 6 available each month",
    ],
    cta: "REQUEST AN UPGRADE",
    isPromoFlag: false,
    tier: "featured_tier1",
    image: "/plans_and_pricing/OTP-Pricing-Tier1.jpg",
  },
  {
    name: "Home Page Main Banner",
    price: 1000,
    features: [
      "Available to: New Apartments and Townhouses",
      "Up to 3 available per month, 33% share of voice",
      "Feature HERO project on home page",
      "$1000 + GST",
    ],
    cta: "REQUEST AN UPGRADE",
    isPromoFlag: false,
    tier: "home_banner",
    image: "/plans_and_pricing/OTP-Pricing-mainbanner.jpg",
  },
];
