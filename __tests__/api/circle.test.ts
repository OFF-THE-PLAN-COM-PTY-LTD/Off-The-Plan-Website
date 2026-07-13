import { POST } from "@/app/api/circle/route";

// Mock Supabase to avoid real DB calls
jest.mock("@supabase/supabase-js", () => ({
  createClient: () => ({
    from: () => ({ insert: async () => ({ error: null }) }),
  }),
}));

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/circle", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/circle", () => {
  it("returns 400 for missing email", async () => {
    const res = await POST(makeRequest({ full_name: "Jane" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const res = await POST(makeRequest({ full_name: "Jane", email: "bad" }));
    expect(res.status).toBe(400);
  });

  it("returns 201 for a valid signup (mocked Supabase)", async () => {
    const res = await POST(makeRequest({ full_name: "Jane Smith", email: "jane@example.com", interest_type: "Investor" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
