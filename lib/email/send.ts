import { resend, EMAIL_FROM } from "./client";

interface SendArgs {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  subject: string;
  html: string;
  /** Plain-text fallback. Resend recommends including one. */
  text?: string;
  /** Override the From header (rare — use only when sending on behalf of someone). */
  from?: string;
  /** Reply-To for enquiry emails so recipients can reply directly to the buyer. */
  replyTo?: string;
}

/**
 * Single send helper used by all routes. If RESEND_API_KEY isn't set, this
 * silently no-ops and logs — keeps the signup / enquiry flow working
 * unbroken on local dev and on Vercel before Tim provides the production
 * key. Errors are swallowed (the user shouldn't see a 500 just because an
 * email failed); failures are logged.
 *
 * Returns `{ sent: boolean, error?: string }` so callers can audit-log if
 * they care, but most callers ignore the return value.
 */
export async function sendEmail(args: SendArgs): Promise<{ sent: boolean; error?: string }> {
  if (!resend) {
    console.log(
      `[email] RESEND_API_KEY not set — skipping send to ${
        Array.isArray(args.to) ? args.to.join(",") : args.to
      } (subject: "${args.subject}")`,
    );
    return { sent: false };
  }
  try {
    const { error } = await resend.emails.send({
      from: args.from ?? EMAIL_FROM,
      to: args.to,
      cc: args.cc,
      bcc: args.bcc,
      replyTo: args.replyTo,
      subject: args.subject,
      html: args.html,
      ...(args.text ? { text: args.text } : {}),
    });
    if (error) {
      console.error("[email] resend.emails.send returned error:", error);
      return { sent: false, error: error.message ?? "unknown" };
    }
    return { sent: true };
  } catch (e) {
    console.error("[email] send threw:", e);
    return { sent: false, error: e instanceof Error ? e.message : String(e) };
  }
}
