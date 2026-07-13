/**
 * Tests for the composable route-handler wrappers in lib/api/handler.ts:
 * withValidation, withAdmin, withMemberOrAdmin, and their composition.
 *
 * The auth-guards module is mocked so no Supabase code runs.
 */
jest.mock("@/lib/supabase/auth-guards", () => ({
  requireAdmin: jest.fn(),
  requireMemberOrAdmin: jest.fn(),
}));

import { NextResponse } from "next/server";
import { z } from "zod";
import { withAdmin, withMemberOrAdmin, withValidation, type AuthInfo } from "@/lib/api/handler";
import { requireAdmin, requireMemberOrAdmin } from "@/lib/supabase/auth-guards";

const mockedRequireAdmin = requireAdmin as unknown as jest.Mock;
const mockedRequireMemberOrAdmin = requireMemberOrAdmin as unknown as jest.Mock;

const AUTH: AuthInfo = {
  user: { id: "u-1", email: "u1@example.com" },
  isAdmin: true,
  isMember: false,
  interestType: null,
};

function jsonRequest(body: unknown): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function rawRequest(body: string): Request {
  return new Request("http://localhost/api/test", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body,
  });
}

const schema = z.object({ name: z.string() });

beforeEach(() => {
  jest.clearAllMocks();
});

describe("withValidation", () => {
  it("returns 400 { error: 'Invalid data' } when the body fails the schema", async () => {
    const handler = jest.fn();
    const wrapped = withValidation(schema, handler);

    const res = await wrapped(jsonRequest({ name: 42 }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid data" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 400 { error: 'Invalid data' } for malformed JSON", async () => {
    const handler = jest.fn();
    const wrapped = withValidation(schema, handler);

    const res = await wrapped(rawRequest("{not valid json"));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid data" });
    expect(handler).not.toHaveBeenCalled();
  });

  it("passes the parsed data through to the handler on success", async () => {
    const handler = jest
      .fn()
      .mockImplementation(async () => NextResponse.json({ ok: true }, { status: 200 }));
    const wrapped = withValidation(schema, handler);

    const res = await wrapped(jsonRequest({ name: "Jane" }));
    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    const ctx = handler.mock.calls[0][1];
    expect(ctx.data).toEqual({ name: "Jane" });
  });
});

describe.each([
  ["withAdmin", withAdmin, () => mockedRequireAdmin],
  ["withMemberOrAdmin", withMemberOrAdmin, () => mockedRequireMemberOrAdmin],
] as const)("%s", (_name, wrapper, getGuardMock) => {
  it("returns the guard's error response as-is without calling the handler", async () => {
    const errorResponse = NextResponse.json({ error: "Forbidden" }, { status: 403 });
    getGuardMock().mockResolvedValue({ error: errorResponse });

    const handler = jest.fn();
    const res = await wrapper(handler)(jsonRequest({}));

    expect(res).toBe(errorResponse);
    expect(handler).not.toHaveBeenCalled();
  });

  it("calls the handler with the guard's auth result on success", async () => {
    getGuardMock().mockResolvedValue(AUTH);

    const handler = jest
      .fn()
      .mockImplementation(async () => NextResponse.json({ ok: true }));
    const res = await wrapper(handler)(jsonRequest({}));

    expect(res.status).toBe(200);
    expect(handler).toHaveBeenCalledTimes(1);
    expect(handler.mock.calls[0][1].auth).toEqual(AUTH);
  });
});

describe("composition: withMemberOrAdmin(withValidation(...))", () => {
  it("runs the handler with both auth and data when guard and schema pass", async () => {
    mockedRequireMemberOrAdmin.mockResolvedValue(AUTH);

    const handler = jest
      .fn()
      .mockImplementation(async () => NextResponse.json({ ok: true }, { status: 201 }));
    const wrapped = withMemberOrAdmin(withValidation(schema, handler));

    const res = await wrapped(jsonRequest({ name: "Jane" }));
    expect(res.status).toBe(201);
    const ctx = handler.mock.calls[0][1];
    expect(ctx.auth).toEqual(AUTH);
    expect(ctx.data).toEqual({ name: "Jane" });
  });

  it("short-circuits on guard failure before parsing the body", async () => {
    const errorResponse = NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    mockedRequireMemberOrAdmin.mockResolvedValue({ error: errorResponse });

    const handler = jest.fn();
    const wrapped = withMemberOrAdmin(withValidation(schema, handler));

    const res = await wrapped(rawRequest("{not even json"));
    expect(res).toBe(errorResponse);
    expect(handler).not.toHaveBeenCalled();
  });

  it("returns 400 when the guard passes but the body fails the schema", async () => {
    mockedRequireMemberOrAdmin.mockResolvedValue(AUTH);

    const handler = jest.fn();
    const wrapped = withMemberOrAdmin(withValidation(schema, handler));

    const res = await wrapped(jsonRequest({ wrong: "shape" }));
    expect(res.status).toBe(400);
    expect(await res.json()).toEqual({ error: "Invalid data" });
    expect(handler).not.toHaveBeenCalled();
  });
});
