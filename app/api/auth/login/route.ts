import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const redirect = (formData.get("redirect") as string) || "/account";

  const cookieStore = cookies();
  const successUrl = new URL(redirect.startsWith("/") ? redirect : "/account", request.url);
  const errorUrl = new URL("/login?error=invalid", request.url);

  const response = NextResponse.redirect(successUrl);

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

  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) return NextResponse.redirect(errorUrl);
  return response;
}
