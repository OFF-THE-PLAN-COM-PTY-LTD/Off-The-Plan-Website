import { POST } from "@/app/api/circle/route";

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

  it("returns 201 in dev mode", async () => {
    const res = await POST(makeRequest({ full_name: "Jane Smith", email: "jane@example.com", interest_type: "Investor" }));
    expect(res.status).toBe(201);
    const body = await res.json();
    expect(body.success).toBe(true);
  });
});
