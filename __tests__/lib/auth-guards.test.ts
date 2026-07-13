/**
 * Unit tests for requireAdmin() / requireMemberOrAdmin().
 *
 * Both Supabase entry points are mocked at the module level:
 *  - @/lib/supabase/server  → createClient() → auth.getUser()
 *  - @/lib/supabase/admin   → supabaseAdmin.from("profiles")...single()
 */
jest.mock("@/lib/supabase/server", () => ({ createClient: jest.fn() }));
jest.mock("@/lib/supabase/admin", () => ({ supabaseAdmin: { from: jest.fn() } }));

import { requireAdmin, requireMemberOrAdmin } from "@/lib/supabase/auth-guards";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";

const mockedCreateClient = createClient as unknown as jest.Mock;
const mockedFrom = supabaseAdmin.from as unknown as jest.Mock;

type GuardResult = Awaited<ReturnType<typeof requireAdmin>>;

function setUser(user: { id: string; email?: string } | null) {
  mockedCreateClient.mockReturnValue({
    auth: { getUser: jest.fn().mockResolvedValue({ data: { user } }) },
  });
}

function setProfile(profile: { is_admin?: boolean | null; interest_type?: string | null } | null) {
  mockedFrom.mockReturnValue({
    select: jest.fn().mockReturnValue({
      eq: jest.fn().mockReturnValue({
        single: jest.fn().mockResolvedValue({ data: profile }),
      }),
    }),
  });
}

async function expectErrorStatus(result: GuardResult, status: number, message: string) {
  if (!("error" in result)) throw new Error(`expected an error result, got success`);
  expect(result.error.status).toBe(status);
  const body = await result.error.json();
  expect(body.error).toBe(message);
}

function expectSuccess(result: GuardResult) {
  if ("error" in result) throw new Error("expected a success result, got error");
  return result;
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("auth guards", () => {
  describe("no session user", () => {
    beforeEach(() => setUser(null));

    it("requireAdmin returns 401 Unauthorized", async () => {
      await expectErrorStatus(await requireAdmin(), 401, "Unauthorized");
    });

    it("requireMemberOrAdmin returns 401 Unauthorized", async () => {
      await expectErrorStatus(await requireMemberOrAdmin(), 401, "Unauthorized");
    });
  });

  describe("logged-in user who is neither admin nor member", () => {
    beforeEach(() => {
      setUser({ id: "user-1", email: "user@example.com" });
      setProfile({ is_admin: false, interest_type: "Investor" });
    });

    it("requireAdmin returns 403 Forbidden", async () => {
      await expectErrorStatus(await requireAdmin(), 403, "Forbidden");
    });

    it("requireMemberOrAdmin returns 403 Forbidden", async () => {
      await expectErrorStatus(await requireMemberOrAdmin(), 403, "Forbidden");
    });
  });

  describe("member (interest_type = Developer, not admin)", () => {
    beforeEach(() => {
      setUser({ id: "member-1", email: "dev@example.com" });
      setProfile({ is_admin: false, interest_type: "Developer" });
    });

    it("requireMemberOrAdmin succeeds with isMember true", async () => {
      const result = expectSuccess(await requireMemberOrAdmin());
      expect(result.user).toEqual({ id: "member-1", email: "dev@example.com" });
      expect(result.isMember).toBe(true);
      expect(result.isAdmin).toBe(false);
      expect(result.interestType).toBe("Developer");
    });

    it("requireAdmin still returns 403 Forbidden", async () => {
      await expectErrorStatus(await requireAdmin(), 403, "Forbidden");
    });
  });

  describe("admin (is_admin = true)", () => {
    beforeEach(() => {
      setUser({ id: "admin-1", email: "admin@example.com" });
      setProfile({ is_admin: true, interest_type: null });
    });

    it("requireAdmin succeeds with isAdmin true", async () => {
      const result = expectSuccess(await requireAdmin());
      expect(result.isAdmin).toBe(true);
      expect(result.isMember).toBe(false);
      expect(result.user.id).toBe("admin-1");
    });

    it("requireMemberOrAdmin succeeds with isAdmin true", async () => {
      const result = expectSuccess(await requireMemberOrAdmin());
      expect(result.isAdmin).toBe(true);
      expect(result.isMember).toBe(false);
      expect(result.interestType).toBeNull();
    });
  });

  describe("missing profile row", () => {
    beforeEach(() => {
      setUser({ id: "ghost-1", email: "ghost@example.com" });
      setProfile(null);
    });

    it("both guards return 403 Forbidden", async () => {
      await expectErrorStatus(await requireAdmin(), 403, "Forbidden");
      await expectErrorStatus(await requireMemberOrAdmin(), 403, "Forbidden");
    });
  });
});
