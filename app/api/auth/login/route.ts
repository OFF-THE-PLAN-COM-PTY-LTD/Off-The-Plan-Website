import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

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

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const explicitRedirect = (formData.get("redirect") as string) || "";

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

  // If the user was bounced to /login from a protected page (e.g. middleware
  // saw "/admin/foo" with no auth and added ?redirect=/admin/foo), honour
  // that destination over the role-based default — it's a more specific
  // intent than "just sign me in".
  let finalPath: string;
  if (isSafeRedirect) {
    finalPath = explicitRedirect;
  } else {
    const userId = signInData.user?.id;
    let profile: { is_admin: boolean | null; interest_type: string | null } | null = null;
    if (userId) {
      const { data } = await supabase
        .from("profiles")
        .select("is_admin, interest_type")
        .eq("id", userId)
        .maybeSingle();
      profile = data as typeof profile;
    }
    finalPath = defaultLandingFor(profile);
  }

  return NextResponse.redirect(new URL(finalPath, request.url), {
    headers: response.headers,
  });
}
