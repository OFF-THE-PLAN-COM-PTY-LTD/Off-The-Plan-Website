"use client";

import type { ListingData } from "../types";
import type { OverviewSlice, AddressSlice } from "../use-listing-form-state";

// Subscribe & publish (portal only) — the only payment entry point. Enabled
// once the mandatory fields (name + suburb + state — what the API requires)
// are filled. Paying publishes the listing via the Stripe webhook.

interface Props {
  id: string;
  existing?: ListingData;
  overview: OverviewSlice;
  address: AddressSlice;
}

export function SubscribeSection({ id, existing, overview, address }: Props) {
  return (
    existing?.subscription_status === "active" ? (
      <div className="mb-1 rounded-md border border-green-200 bg-green-50 px-4 py-3">
        <p className="text-sm font-semibold text-green-800">✓ Subscription active — your listing is live</p>
        <p className="text-xs text-green-700 mt-0.5">Billed $299/month + GST. To cancel, please contact us.</p>
      </div>
    ) : (
      <div className="mb-1 rounded-md border border-orange-200 bg-orange-50 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <p className="text-sm font-semibold" style={{ color: "#1a2340" }}>Publish this listing</p>
          <p className="text-xs text-gray-600 mt-0.5">
            {overview.name.trim() && address.suburb.trim() && address.state.trim()
              ? "Subscribe to publish your listing — $299/month + GST. You can keep editing anytime."
              : "Fill in Project Name, Suburb and State to enable publishing."}
          </p>
        </div>
        {overview.name.trim() && address.suburb.trim() && address.state.trim() ? (
          <a
            href={`/api/stripe/checkout?tier=agency_listing&project=${id}`}
            className="shrink-0 text-center py-2.5 px-6 text-xs font-bold uppercase tracking-widest text-white rounded transition-opacity hover:opacity-80"
            style={{ background: "#e85d26" }}
          >
            Subscribe &amp; Publish
          </a>
        ) : (
          <span
            aria-disabled="true"
            title="Fill in Project Name, Suburb and State first"
            className="shrink-0 text-center py-2.5 px-6 text-xs font-bold uppercase tracking-widest text-white rounded opacity-40 cursor-not-allowed"
            style={{ background: "#e85d26" }}
          >
            Subscribe &amp; Publish
          </span>
        )}
      </div>
    )
  );
}
