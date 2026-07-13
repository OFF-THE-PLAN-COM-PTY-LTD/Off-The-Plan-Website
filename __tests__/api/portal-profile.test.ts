/**
 * Tests for PATCH /api/portal/profile.
 *
 * The route uses createClient() from lib/supabase/server (@supabase/ssr +
 * next/headers cookies) for auth, and supabaseAdmin from lib/supabase/admin
 * (@supabase/supabase-js) for the write. Both wrapper modules are mocked
 * directly so neither underlying Supabase package (nor cookies()) ever runs.
 */
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: jest.fn() } }));

import { PATCH } from "@/app/api/portal/profile/route";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const mockedCreateClient = createClient as unknown as jest.Mock;
const mockedFrom = supabaseAdmin.from as unknown as jest.Mock;

function setUser(user: { id: string } | null) {
  mockedCreateClient.mockReturnValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  });
}

function setUpdateResult(error: { message: string } | null = null) {
  const eq = jest.fn().mockResolvedValue({ error });
  const update = jest.fn().mockReturnValue({ eq });
  mockedFrom.mockReturnValue({ update });
  return { update, eq };
}

function makeRequest(body: unknown): Request {
  return new Request("http://localhost/api/portal/profile", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("PATCH /api/portal/profile", () => {
  it("returns 401 when there is no authenticated user", async () => {
    setUser(null);
    const { update } = setUpdateResult();

    const res = await PATCH(makeRequest({ first_name: "Jane" }));
    expect(res.status).toBe(401);
    expect(await res.json()).toEqual({ error: "Unauthorized" });
    expect(update).not.toHaveBeenCalled();
  });

  it("persists allowed fields and responds { ok: true }", async () => {
    setUser({ id: "user-1" });
    const { update, eq } = setUpdateResult();

    const res = await PATCH(makeRequest({ first_name: "Jane", phone: "0400 000 000" }));
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });

    expect(mockedFrom).toHaveBeenCalledWith("profiles");
    expect(update).toHaveBeenCalledWith({ first_name: "Jane", phone: "0400 000 000" });
    expect(eq).toHaveBeenCalledWith("id", "user-1");
  });

  it("silently drops disallowed fields from the update payload", async () => {
    setUser({ id: "user-1" });
    const { update } = setUpdateResult();

    const res = await PATCH(
      makeRequest({ first_name: "Jane", is_admin: true, member_status: "approved" })
    );
    expect(res.status).toBe(200);

    const payload = update.mock.calls[0][0];
    expect(payload).toEqual({ first_name: "Jane" });
    expect(payload).not.toHaveProperty("is_admin");
    expect(payload).not.toHaveProperty("member_status");
  });

  it("coerces falsy values on allowed fields to null", async () => {
    setUser({ id: "user-1" });
    const { update } = setUpdateResult();

    const res = await PATCH(makeRequest({ phone: "" }));
    expect(res.status).toBe(200);
    expect(update).toHaveBeenCalledWith({ phone: null });
  });

  it("returns 400 'No valid fields' when only disallowed fields are sent", async () => {
    setUser({ id: "user-1" });
    const { update } = setUpdateResult();

    const res = await PATCH(makeRequest({ is_admin: true, nonsense: "x" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "No valid fields" });
    expect(update).not.toHaveBeenCalled();
  });

  it("returns 500 with the database error message when the update fails", async () => {
    setUser({ id: "user-1" });
    setUpdateResult({ message: "boom" });

    const res = await PATCH(makeRequest({ first_name: "Jane" }));
    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "boom" });
  });
});
