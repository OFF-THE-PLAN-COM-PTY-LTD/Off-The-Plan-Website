import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { sendSetPasswordLink } from "@/lib/auth/send-set-password";

// Identical accept/reject behavior to the old manual check:
// email must be a string containing "@"; anything else (including a
// non-object body) falls through to the same generic { ok: true }.
const forgotPasswordSchema = z.object({
  email: z.string().refine((e) => e.includes("@")),
});

/**
 * Public "Forgot password?" endpoint. Emails the requester a branded
 * recovery link (lands on /auth/set-password).
 *
 * Always returns a generic success — we never reveal whether an account
 * exists for the given email (prevents account enumeration). Any failure
 * is logged server-side only.
 */
export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: true }); // don't leak parse details
  }

  const parsed = forgotPasswordSchema.safeParse(body);
  if (!parsed.success) {
    // Generic success regardless — no enumeration signal.
    return NextResponse.json({ ok: true });
  }
  const email = parsed.data.email;

  const origin = resolveOrigin(req);

  // Fire and report only to logs; response is always generic.
  const result = await sendSetPasswordLink({ email, origin, mode: "reset" });
  if (!result.sent) {
    console.log(`[forgot-password] no email sent for ${email}: ${result.error ?? "unknown"}`);
  }

  return NextResponse.json({ ok: true });
}

function resolveOrigin(req: NextRequest): string {
  const refererUrl = req.headers.get("referer");
  let refererOrigin: string | null = null;
  try {
    if (refererUrl) refererOrigin = new URL(refererUrl).origin;
  } catch {
    // ignore malformed Referer
  }
  return (
    req.headers.get("origin") ??
    refererOrigin ??
    process.env.NEXT_PUBLIC_APP_URL ??
    "https://off-the-plan-website.vercel.app"
  );
}
