import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// Permissive shape check only: presence + string type for the credentials.
// Anything that fails here would have failed signInWithPassword anyway, so
// the user-visible outcome (redirect to /login?error=invalid) is unchanged.
const loginSchema = z.object({
  email: z.string(),
  password: z.string(),
});

/**
 * Picks a landing page based on the user's role so admins and member-
 * developers don't always land on the generic /account page (Tim
 * asked about this in Jun 2026 — he was getting routed to /account
 * after every sign-in and had to manually navigate to /admin).
 */
function defaultLandingFor(profile: { is_admin?: boolean | null; interest_type?: string | null } | null): string {
  if (profile?.is_admin) return "/admin";
  const t = profile?.interest_type ?? "";
  if (t === "Developer" || t === "Agent") return "/portal";
  return "/account";
}

/** Profile member_status values that should block sign-in. Admins bypass
 *  this gate since `is_admin = true` is granted explicitly. */
const SIGN_IN_BLOCKED_STATUSES = new Set(["pending", "rejected"]);

export async function POST(request: Request) {
  const formData = await request.formData();

  const parsed = loginSchema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return NextResponse.redirect(new URL("/login?error=invalid", request.url));
  }
  const email = parsed.data.email.trim();
  const password = parsed.data.password;
  const rawRedirect = formData.get("redirect");
  const explicitRedirect = (typeof rawRedirect === "string" ? rawRedirect : "") || "";

  const cookieStore = cookies();
  // Only allow same-origin relative paths. Reject protocol-relative URLs ("//...")
  // and anything that doesn't look like a normal path.
  const isSafeRedirect =
    typeof explicitRedirect === "string" &&
    explicitRedirect.startsWith("/") &&
    !explicitRedirect.startsWith("//") &&
    !explicitRedirect.startsWith("/\\");

  const errorUrl = new URL("/login?error=invalid", request.url);

  // Build a placeholder response — we'll set its location AFTER we know
  // who the user is (so we can route admins to /admin, members to
  // /portal, and everyone else to /account by default).
  const response = NextResponse.redirect(new URL("/account", request.url));

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  const { data: signInData, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.redirect(errorUrl);

  // Look up the profile up-front: we need is_admin + interest_type for
  // smart-routing AND member_status to gate pending/rejected accounts.
  const userId = signInData.user?.id;
  let profile: { is_admin: boolean | null; interest_type: string | null; member_status: string | null } | null = null;
  if (userId) {
    const { data } = await supabase
      .from("profiles")
      .select("is_admin, interest_type, member_status")
      .eq("id", userId)
      .maybeSingle();
    profile = data as typeof profile;
  }

  // Gate: pending or rejected accounts cannot sign in. Admins bypass this
  // since they're granted access explicitly. We sign the user back out
  // before redirecting so the cookies don't carry a half-authenticated state.
  const status = (profile?.member_status ?? "").toLowerCase();
  if (!profile?.is_admin && SIGN_IN_BLOCKED_STATUSES.has(status)) {
    await supabase.auth.signOut();
    const blockedUrl = new URL("/login", request.url);
    blockedUrl.searchParams.set("error", status); // "pending" or "rejected"
    return NextResponse.redirect(blockedUrl);
  }

  // If the user was bounced to /login from a protected page (e.g. middleware
  // saw "/admin/foo" with no auth and added ?redirect=/admin/foo), honour
  // that destination over the role-based default — it's a more specific
  // intent than "just sign me in".
  let finalPath: string;
  if (isSafeRedirect) {
    finalPath = explicitRedirect;
  } else {
    finalPath = defaultLandingFor(profile);
  }

  return NextResponse.redirect(new URL(finalPath, request.url), {
    headers: response.headers,
  });
}
