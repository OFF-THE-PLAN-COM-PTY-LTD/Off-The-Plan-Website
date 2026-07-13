import { POST } from "@/app/api/enquiries/route";

// Mock Supabase to avoid real DB calls
jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({
      insert: async () => ({ error: null }),
      select: () => ({
        eq: () => ({ maybeSingle: async () => ({ data: null }) }),
      }),
    }),
    rpc: async () => ({ error: null }),
  }),
}));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/enquiries", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/enquiries", () => {
  it("returns 400 for missing required fields", async () => {
    const res = await POST(makeRequest({ email: "test@example.com" }));
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid data");
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({
      development_id: "00000000-0000-0000-0000-000000000000",
      full_name: "Test User",
      email: "not-an-email",
    }));
    expect(res.status).toBe(400);
  });

  it("returns 201 for a valid enquiry (mocked Supabase)", async () => {
    const res = await POST(makeRequest({
      development_id: "00000000-0000-0000-0000-000000000000",
      full_name: "Jane Smith",
      email: "jane@example.com",
      mobile: "0400 000 000",
      buyer_type: "Owner-occupier",
    }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
