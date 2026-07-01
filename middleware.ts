import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: { headers: request.headers },
  });

  // Dev mode: skip auth when using placeholder Supabase credentials.
  // In production this must never trigger — a missing/placeholder URL would silently
  // make /admin and other protected routes public.
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
  const looksUnconfigured =
    !supabaseUrl || supabaseUrl.includes("placeholder") || supabaseUrl === "your-supabase-url";
  if (looksUnconfigured) {
    if (process.env.NODE_ENV === "production") {
      // Refuse to serve protected routes in a misconfigured prod env.
      return new NextResponse(
        "Server misconfiguration: NEXT_PUBLIC_SUPABASE_URL is not set.",
        { status: 503 },
      );
    }
    return response;
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request: { headers: request.headers } });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isApiRoute = pathname.startsWith("/api/");

  // Protected routes — must be logged in
  const protectedPaths = ["/saved", "/account", "/admin", "/api/admin"];
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));

  if (isProtected && !user) {
    if (isApiRoute) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Admin routes:
  //   /admin/*      (UI)  — admin only. Non-admins redirect to home.
  //   /api/admin/*  (API) — admin OR Developer/Agent portal member. Several
  //                         admin API routes are intentionally shared with
  //                         the portal listing form (upload, gallery, agents,
  //                         listings) and gate finer permissions themselves
  //                         via requireMemberOrAdmin. Middleware just enforces
  //                         "one of these two roles" and lets the route decide.
  const isAdminUiPath = pathname.startsWith("/admin");
  const isAdminApiPath = pathname.startsWith("/api/admin");
  if ((isAdminUiPath || isAdminApiPath) && user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("is_admin, interest_type")
      .eq("id", user.id)
      .maybeSingle();

    const isAdmin = !!profile?.is_admin;
    const interestType = (profile?.interest_type as string | null | undefined) ?? null;
    const isMember = !!interestType && ["Developer", "Agent"].includes(interestType);

    if (isAdminUiPath && !isAdmin) {
      return NextResponse.redirect(new URL("/", request.url));
    }
    if (isAdminApiPath && !isAdmin && !isMember) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
  }

  return response;
}

export const config = {
  matcher: ["/saved/:path*", "/account/:path*", "/admin/:path*", "/api/admin/:path*"],
};
