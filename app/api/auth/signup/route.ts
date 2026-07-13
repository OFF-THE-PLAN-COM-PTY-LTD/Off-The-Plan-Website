import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";

// Permissive shape check, matching the route's historical tolerance:
// email/password must be present strings (missing ones previously just made
// supabase.auth.signUp fail into the same error redirect); full_name and
// interest_type stay optional.
const signupSchema = z.object({
  full_name: z.string().nullable().optional(),
  email: z.string(),
  password: z.string(),
  interest_type: z.string().nullable().optional(),
});

export async function POST(request: Request) {
  const formData = await request.formData();

  const parsed = signupSchema.safeParse({
    full_name: formData.get("full_name"),
    email: formData.get("email"),
    password: formData.get("password"),
    interest_type: formData.get("interest_type"),
  });
  if (!parsed.success) {
    // Same generic redirect the signUp-error path below uses.
    const url = new URL("/signup?error=1", request.url);
    url.searchParams.set(
      "message",
      "We could not create your account. Please check your details and try again.",
    );
    return NextResponse.redirect(url);
  }

  const fullName = parsed.data.full_name?.trim();
  const email = parsed.data.email.trim();
  const password = parsed.data.password;
  const rawInterest = parsed.data.interest_type || null;

  // SECURITY: never let a self-signup grant member privileges (Developer/Agent).
  // The portal layout uses interest_type to gate access; only admins can upgrade
  // a user to those roles via the admin panel. Anything outside the buyer-type
  // allowlist is coerced to null. Developer/Agent applicants are routed to
  // /list-a-listing from the signup page instead — that submits a lead Tim
  // reviews and then upgrades the account via admin.
  const SELF_ALLOWED_INTERESTS = new Set(["Buyer", "Owner-occupier", "Investor"]);
  const interestType = rawInterest && SELF_ALLOWED_INTERESTS.has(rawInterest)
    ? rawInterest
    : null;

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
    // Log the real error server-side for debugging, but never leak the raw
    // Supabase message to the client — it can enable email enumeration
    // ("User already registered" vs "Password should be at least 6 chars").
    console.error("Signup error:", error);
    const url = new URL("/signup?error=1", request.url);
    url.searchParams.set(
      "message",
      "We could not create your account. Please check your details and try again.",
    );
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
