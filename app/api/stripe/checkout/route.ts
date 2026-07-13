import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getStripe, PRICE_BY_TIER, isCheckoutTier, PLATFORM_TAG } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";

// Shape check over the query params this route reads. searchParams.get()
// only ever yields string | null, so this cannot reject a request — it just
// normalizes exactly like the old inline expressions (`?? ""` / `|| undefined`).
// Tier semantics remain with isCheckoutTier below.
const checkoutQuerySchema = z.object({
  tier: z
    .string()
    .nullable()
    .transform((v) => v ?? ""),
  project: z
    .string()
    .nullable()
    .transform((v) => v || undefined),
});

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/stripe/checkout?tier=<tier>[&project=<id>]
 *
 * Creates a Stripe-hosted Checkout session for the given tier and redirects
 * the browser straight to Stripe. Used as a plain <a href> from the existing
 * pricing/upgrade buttons, so no client-side JS is needed.
 *
 * Phase 1 (test): this only starts the payment flow. It does NOT gate access
 * or change what the account can do — existing members keep all features.
 */
export async function GET(req: NextRequest) {
  const { tier, project: projectId } = checkoutQuerySchema.parse({
    tier: req.nextUrl.searchParams.get("tier"),
    project: req.nextUrl.searchParams.get("project"),
  });
  const origin = req.nextUrl.origin;

  // Not configured yet (e.g. deployed to main before the keys are set): fall
  // back to the normal signup flow instead of showing an error, so the wired
  // buttons stay harmless until Stripe is switched on.
  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.redirect(`${origin}/list-a-listing`, { status: 303 });
  }

  if (!isCheckoutTier(tier)) {
    return NextResponse.json({ error: `Unknown tier: ${tier}` }, { status: 400 });
  }

  const price = PRICE_BY_TIER[tier];
  if (!price) {
    return NextResponse.json(
      { error: `No Stripe price configured for tier "${tier}". Set STRIPE_PRICE_* env vars.` },
      { status: 500 },
    );
  }

  // Tie the subscription back to the signed-in member when there is one.
  // Not required for a successful checkout — the public pricing page is
  // unauthenticated and Stripe will collect the email itself.
  let email: string | undefined;
  let userId: string | undefined;
  try {
    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    email = user?.email ?? undefined;
    userId = user?.id;
  } catch {
    // no session — continue as an anonymous checkout
  }

  const metadata: Record<string, string> = { platform: PLATFORM_TAG, tier };
  if (userId) metadata.user_id = userId;
  if (projectId) metadata.project_id = projectId;

  try {
    const session = await getStripe().checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price, quantity: 1 }],
      customer_email: email,
      allow_promotion_codes: true,
      success_url: projectId
        ? `${origin}/portal/listings/${projectId}/edit?checkout=success`
        : `${origin}/portal/listings?checkout=success`,
      cancel_url: projectId
        ? `${origin}/portal/listings/${projectId}/edit?checkout=cancel`
        : `${origin}/portal/listings?checkout=cancel`,
      metadata,
      // Copy the tag onto the subscription too, so subscription.* webhook
      // events (which carry the subscription, not the session) can be filtered.
      subscription_data: { metadata },
    });

    if (!session.url) {
      return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 502 });
    }
    return NextResponse.redirect(session.url, { status: 303 });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown Stripe error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
