/**
 * Tests for GET /api/stripe/checkout.
 *
 * lib/stripe/server is mocked so no real Stripe client is ever constructed
 * and no network call can happen: getStripe is a bare jest.fn() (any
 * unexpected call in the rejection paths would throw), while isCheckoutTier /
 * PLATFORM_TAG keep their real implementations and PRICE_BY_TIER gets one
 * deterministic price so the happy path is testable.
 *
 * Note: when STRIPE_SECRET_KEY is unset the route redirects to
 * /list-a-listing BEFORE tier validation, so the invalid-tier tests must set
 * a placeholder key.
 */
jest.mock("@/lib/stripe/server", () => {
  const actual = jest.requireActual("@/lib/stripe/server");
  return {
    ...actual,
    getStripe: jest.fn(),
    PRICE_BY_TIER: { ...actual.PRICE_BY_TIER, agency_listing: "price_test_agency" },
  };
});
jest.mock("@/lib/supabase/server", () => ({
  createClient: jest.fn(() => ({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user: null } }) },
  })),
}));

import { NextRequest } from "next/server";
import { GET } from "@/app/api/stripe/checkout/route";
import { getStripe } from "@/lib/stripe/server";

const mockedGetStripe = getStripe as unknown as jest.Mock;

function makeRequest(query: string): NextRequest {
  return new NextRequest(`http://localhost/api/stripe/checkout${query}`);
}

beforeEach(() => {
  jest.clearAllMocks();
  process.env.STRIPE_SECRET_KEY = "sk_test_placeholder";
});

afterAll(() => {
  delete process.env.STRIPE_SECRET_KEY;
});

describe("GET /api/stripe/checkout", () => {
  it("falls back to /list-a-listing (303) when STRIPE_SECRET_KEY is unset", async () => {
    delete process.env.STRIPE_SECRET_KEY;

    const res = await GET(makeRequest("?tier=agency_listing"));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("http://localhost/list-a-listing");
    expect(mockedGetStripe).not.toHaveBeenCalled();
  });

  it("returns 400 for a missing tier param without touching Stripe", async () => {
    const res = await GET(makeRequest(""));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Unknown tier: " });
    expect(mockedGetStripe).not.toHaveBeenCalled();
  });

  it("returns 400 for an unknown tier without touching Stripe", async () => {
    const res = await GET(makeRequest("?tier=gold_plated"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Unknown tier: gold_plated" });
    expect(mockedGetStripe).not.toHaveBeenCalled();
  });

  it("returns 500 for a valid tier with no configured price, before any Stripe call", async () => {
    const res = await GET(makeRequest("?tier=promo_flag"));
    expect(res.status).toBe(500);
    const body = await res.json();
    expect(body.error).toContain('No Stripe price configured for tier "promo_flag"');
    expect(mockedGetStripe).not.toHaveBeenCalled();
  });

  it("creates a checkout session and 303-redirects to its URL for a configured tier", async () => {
    const create = jest
      .fn()
      .mockResolvedValue({ url: "https://checkout.stripe.com/c/test-session" });
    mockedGetStripe.mockReturnValue({ checkout: { sessions: { create } } });

    const res = await GET(makeRequest("?tier=agency_listing"));
    expect(res.status).toBe(303);
    expect(res.headers.get("location")).toBe("https://checkout.stripe.com/c/test-session");

    expect(create).toHaveBeenCalledTimes(1);
    const args = create.mock.calls[0][0];
    expect(args.mode).toBe("subscription");
    expect(args.line_items).toEqual([{ price: "price_test_agency", quantity: 1 }]);
    expect(args.metadata).toEqual({ platform: "off-the-plan", tier: "agency_listing" });
    expect(args.success_url).toBe("http://localhost/portal/listings?checkout=success");
    expect(args.cancel_url).toBe("http://localhost/portal/listings?checkout=cancel");
  });

  it("returns 502 when Stripe does not return a checkout URL", async () => {
    const create = jest.fn().mockResolvedValue({ url: null });
    mockedGetStripe.mockReturnValue({ checkout: { sessions: { create } } });

    const res = await GET(makeRequest("?tier=agency_listing"));
    expect(res.status).toBe(502);
    expect(await res.json()).toEqual({ error: "Stripe did not return a checkout URL" });
  });
});
