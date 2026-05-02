import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const formData = await request.formData();
  const fullName = (formData.get("full_name") as string)?.trim();
  const email = (formData.get("email") as string)?.trim();
  const password = formData.get("password") as string;
  const interestType = (formData.get("interest_type") as string) || null;

  const cookieStore = cookies();
  const successUrl = new URL("/account", request.url);
  const errorUrl = new URL("/signup?error=1", request.url);

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

  const { error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: { full_name: fullName, interest_type: interestType },
    },
  });

  if (error) {
    const url = new URL("/signup?error=1", request.url);
    url.searchParams.set("message", error.message);
    return NextResponse.redirect(url);
  }

  // Update profile with interest_type if provided (trigger only sets full_name)
  if (interestType) {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from("profiles").update({ interest_type: interestType }).eq("id", user.id);
    }
  }

  return response;
}
