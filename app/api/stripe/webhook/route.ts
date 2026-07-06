import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, PLATFORM_TAG } from "@/lib/stripe/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * POST /api/stripe/webhook
 *
 * Receives Stripe events. The Stripe account is shared with SubtleMove, so we
 * ONLY act on events tagged metadata.platform = "off-the-plan". Everything
 * else (SubtleMove, or events without our tag) is acknowledged and ignored.
 *
 * Phase 1 (test): observe/log only. No database writes and no access gating —
 * existing members keep all features. Persistence + entitlement logic goes
 * here later, guarded by the same platform check.
 *
 * Local testing:
 *   stripe listen --forward-to localhost:3000/api/stripe/webhook \
 *     --project-name off-the-plan
 * (the printed whsec_… goes in STRIPE_WEBHOOK_SECRET)
 */
export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "STRIPE_WEBHOOK_SECRET not configured" }, { status: 500 });
  }

  const signature = req.headers.get("stripe-signature") ?? "";
  const body = await req.text();

  let event: Stripe.Event;
  try {
    event = getStripe().webhooks.constructEvent(body, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "invalid signature";
    return NextResponse.json({ error: `Webhook signature verification failed: ${message}` }, { status: 400 });
  }

  // Shared-account guard: only Off The Plan events proceed.
  const object = event.data.object as { id?: string; metadata?: Record<string, string> };
  const isOurs = object?.metadata?.platform === PLATFORM_TAG;
  if (!isOurs) {
    return NextResponse.json({ received: true, ignored: "not off-the-plan" });
  }

  switch (event.type) {
    case "checkout.session.completed":
    case "customer.subscription.created":
    case "customer.subscription.updated":
    case "customer.subscription.deleted":
      // eslint-disable-next-line no-console
      console.log(`[stripe] ${event.type}`, {
        id: object.id,
        tier: object.metadata?.tier,
        user_id: object.metadata?.user_id,
      });
      break;
    default:
      break;
  }

  return NextResponse.json({ received: true });
}
