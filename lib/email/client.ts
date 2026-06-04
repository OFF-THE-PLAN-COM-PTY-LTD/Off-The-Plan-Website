import { Resend } from "resend";

/**
 * Lazy Resend client. Returns null when RESEND_API_KEY is missing so the
 * rest of the app can call sendEmail() unconditionally without crashing
 * on local dev or before Tim provides the production key.
 *
 * Env vars (all optional — the helpers no-op without RESEND_API_KEY):
 *   RESEND_API_KEY        — issued from resend.com/api-keys
 *   RESEND_FROM_EMAIL     — e.g. "Off The Plan <notifications@offtheplan.com.au>"
 *                           Defaults to a friendly fallback. The 'from' must
 *                           use a domain you've verified in Resend.
 *   EMAIL_ADMIN_TO        — admin notification inbox (default: tim@offtheplan.com.au)
 *   EMAIL_SALES_CC        — cc on enquiries (default: sales@offtheplan.com.au)
 */

const apiKey = process.env.RESEND_API_KEY ?? "";
export const resend: Resend | null = apiKey ? new Resend(apiKey) : null;

export const EMAIL_FROM =
  process.env.RESEND_FROM_EMAIL ??
  "Off The Plan <notifications@offtheplan.com.au>";

export const EMAIL_ADMIN_TO =
  process.env.EMAIL_ADMIN_TO ?? "tim@offtheplan.com.au";

export const EMAIL_SALES_CC =
  process.env.EMAIL_SALES_CC ?? "sales@offtheplan.com.au";

export const isEmailEnabled = (): boolean => resend !== null;
