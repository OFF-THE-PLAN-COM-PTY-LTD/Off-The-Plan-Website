/**
 * Tests for POST /api/auth/login (formData-based, redirect responses).
 *
 * The route builds its own @supabase/ssr server client and reads cookies()
 * from next/headers, so both modules are mocked. NextResponse.redirect
 * defaults to 307, and Location is an absolute URL resolved against the
 * request URL.
 */
jest.mock("next/headers", () => ({
  cookies: () => ({ getAll: () => [], set: jest.fn() }),
}));
jest.mock("@supabase/ssr", () => ({ createServerClient: jest.fn() }));

import { POST } from "@/app/api/auth/login/route";
import { createServerClient } from "@supabase/ssr";

const mockedCreateServerClient = createServerClient as unknown as jest.Mock;

type Profile = {
  is_admin: boolean | null;
  interest_type: string | null;
  member_status: string | null;
};

function setSupabase(opts: {
  signInError?: boolean;
  userId?: string | null;
  profile?: Profile | null;
}) {
  const signInWithPassword = jest.fn().mockResolvedValue(
    opts.signInError
      ? { data: { user: null }, error: { message: "Invalid login credentials" } }
      : { data: { user: opts.userId ? { id: opts.userId } : null }, error: null }
  );
  const signOut = jest.fn().mockResolvedValue({ error: null });
  const maybeSingle = jest.fn().mockResolvedValue({ data: opts.profile ?? null });
  mockedCreateServerClient.mockReturnValue({
    auth: { signInWithPassword, signOut },
    from: jest.fn().mockReturnValue({
      select: jest.fn().mockReturnValue({
        eq: jest.fn().mockReturnValue({ maybeSingle }),
      }),
    }),
  });
  return { signInWithPassword, signOut };
}

function makeRequest(fields: Record<string, string>): Request {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return new Request("http://localhost/api/auth/login", { method: "POST", body: fd });
}

beforeEach(() => {
  jest.clearAllMocks();
});

describe("POST /api/auth/login", () => {
  it("redirects to /login?error=invalid when email is missing", async () => {
    setSupabase({});
    const res = await POST(makeRequest({ password: "secret" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login?error=invalid");
  });

  it("redirects to /login?error=invalid when password is missing", async () => {
    const { signInWithPassword } = setSupabase({});
    const res = await POST(makeRequest({ email: "jane@example.com" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toContain("/login?error=invalid");
    expect(signInWithPassword).not.toHaveBeenCalled();
  });

  it("redirects to /login?error=invalid when sign-in fails", async () => {
    setSupabase({ signInError: true });
    const res = await POST(makeRequest({ email: "jane@example.com", password: "wrong" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login?error=invalid");
  });

  it("signs in with trimmed email and lands ordinary users on /account", async () => {
    const { signInWithPassword } = setSupabase({
      userId: "u-1",
      profile: { is_admin: false, interest_type: "Investor", member_status: "approved" },
    });

    const res = await POST(makeRequest({ email: "  jane@example.com  ", password: "secret" }));
    expect(signInWithPassword).toHaveBeenCalledWith({
      email: "jane@example.com",
      password: "secret",
    });
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/account");
  });

  it("lands admins on /admin", async () => {
    setSupabase({
      userId: "admin-1",
      profile: { is_admin: true, interest_type: null, member_status: null },
    });
    const res = await POST(makeRequest({ email: "admin@example.com", password: "secret" }));
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/admin");
  });

  it("lands Developer/Agent members on /portal", async () => {
    setSupabase({
      userId: "dev-1",
      profile: { is_admin: false, interest_type: "Developer", member_status: "approved" },
    });
    const res = await POST(makeRequest({ email: "dev@example.com", password: "secret" }));
    expect(res.headers.get("location")).toBe("http://localhost/portal");
  });

  it("honours a safe same-origin redirect field over the role default", async () => {
    setSupabase({
      userId: "u-1",
      profile: { is_admin: false, interest_type: "Investor", member_status: "approved" },
    });
    const res = await POST(
      makeRequest({ email: "jane@example.com", password: "secret", redirect: "/admin/foo" })
    );
    expect(res.headers.get("location")).toBe("http://localhost/admin/foo");
  });

  it("ignores a protocol-relative redirect and falls back to the role default", async () => {
    setSupabase({
      userId: "u-1",
      profile: { is_admin: false, interest_type: "Investor", member_status: "approved" },
    });
    const res = await POST(
      makeRequest({ email: "jane@example.com", password: "secret", redirect: "//evil.example" })
    );
    expect(res.headers.get("location")).toBe("http://localhost/account");
  });

  it("signs pending members back out and redirects to /login?error=pending", async () => {
    const { signOut } = setSupabase({
      userId: "u-1",
      profile: { is_admin: false, interest_type: "Developer", member_status: "pending" },
    });
    const res = await POST(makeRequest({ email: "dev@example.com", password: "secret" }));
    expect(signOut).toHaveBeenCalled();
    expect(res.status).toBe(307);
    expect(res.headers.get("location")).toBe("http://localhost/login?error=pending");
  });
});
