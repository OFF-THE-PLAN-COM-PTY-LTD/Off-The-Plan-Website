/** Tests for the response envelope helpers in lib/api/response.ts. */
import { ok, fail } from "@/lib/api/response";

describe("ok()", () => {
  it("returns 200 with { ok: true, data } by default", async () => {
    const res = ok({ id: 7 });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true, data: { id: 7 } });
  });

  it("honours a custom ResponseInit status", async () => {
    const res = ok([1, 2, 3], { status: 201 });
    expect(res.status).toBe(201);
    expect(await res.json()).toEqual({ ok: true, data: [1, 2, 3] });
  });

  it("wraps null data as-is", async () => {
    const res = ok(null);
    expect(await res.json()).toEqual({ ok: true, data: null });
  });
});

describe("fail()", () => {
  it("returns the given status with { ok: false, error }", async () => {
    const res = fail("Not found", 404);
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ ok: false, error: "Not found" });
  });

  it("omits the details key when no details are given", async () => {
    const res = fail("Bad request", 400);
    const body = await res.json();
    expect("details" in body).toBe(false);
  });

  it("spreads details into the body when provided", async () => {
    const res = fail("Invalid data", 422, { field: "email" });
    expect(res.status).toBe(422);
    expect(await res.json()).toEqual({
      ok: false,
      error: "Invalid data",
      details: { field: "email" },
    });
  });
});
