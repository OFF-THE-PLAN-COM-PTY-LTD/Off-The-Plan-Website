import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe, PLATFORM_TAG } from "@/lib/stripe/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

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

  // The listing (development) this subscription belongs to — set as
  // metadata.project_id by the per-listing "Subscribe & publish" button.
  const projectId = object.metadata?.project_id;

  if (projectId) {
    let update: Record<string, unknown> | null = null;

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      // Payment succeeded → record the subscription and take the listing live.
      update = {
        subscription_status: "active",
        stripe_subscription_id:
          typeof session.subscription === "string" ? session.subscription : null,
        stripe_customer_id: typeof session.customer === "string" ? session.customer : null,
        is_published: true,
      };
    } else if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const sub = event.data.object as Stripe.Subscription;
      const periodEnd = (sub as unknown as { current_period_end?: number }).current_period_end;
      update = {
        subscription_status: sub.status,
        stripe_subscription_id: sub.id,
        stripe_customer_id: typeof sub.customer === "string" ? sub.customer : null,
        subscription_current_period_end: periodEnd
          ? new Date(periodEnd * 1000).toISOString()
          : null,
      };
      // Only force visibility on the terminal transitions, so a still-active
      // subscription's routine update events never override an admin who has
      // manually toggled the listing.
      if (
        event.type === "customer.subscription.deleted" ||
        sub.status === "canceled" ||
        sub.status === "unpaid"
      ) {
        update.is_published = false; // subscription ended → listing goes inactive
      } else if (event.type === "customer.subscription.created" && sub.status === "active") {
        update.is_published = true;
      }
    }

    if (update) {
      const { error } = await supabaseAdmin
        .from("developments")
        .update(update)
        .eq("id", projectId);
      // Return 5xx so Stripe retries — otherwise a paid checkout could
      // silently fail to publish the listing with no second delivery.
      if (error) {
        console.error("Stripe webhook DB update failed:", error, { projectId, type: event.type });
        return NextResponse.json({ error: "Failed to persist subscription state" }, { status: 500 });
      }
    }
  }

  return NextResponse.json({ received: true });
}
