import { NextRequest, NextResponse } from "next/server";
import { sendSetPasswordLink } from "@/lib/auth/send-set-password";

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

  const email = (body as { email?: unknown })?.email;
  if (typeof email !== "string" || !email.includes("@")) {
    // Generic success regardless — no enumeration signal.
    return NextResponse.json({ ok: true });
  }

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
