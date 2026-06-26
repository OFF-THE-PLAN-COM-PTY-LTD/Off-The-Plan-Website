/**
 * HTML email templates. Templates return `{ subject, html, text }` so
 * the send helper can pass the whole object through to Resend.
 */

import { socialRowHtml } from "@/lib/social-links";

const BRAND = "Off The Plan";
const PRIMARY = "#1a2340";
const ACCENT = "#e85d26";
const SITE_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://offtheplan.com.au";
const PHONE_DISPLAY = "0410 313 030";
const PHONE_HREF = "tel:0410313030";

function escapeHtml(value: string | null | undefined): string {
  if (!value) return "";
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function shell(body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"></head>
<body style="margin:0;padding:0;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;background:#f5f4f1;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f5f4f1;">
    <tr><td align="center" style="padding:32px 16px;">
      <table role="presentation" width="560" cellpadding="0" cellspacing="0" border="0" style="background:#ffffff;border:1px solid #e5e3df;">
        <tr><td style="background:${PRIMARY};padding:18px 24px;color:#fff;font-weight:600;font-size:13px;letter-spacing:0.18em;text-transform:uppercase;">
          ${BRAND}
        </td></tr>
        <tr><td style="padding:28px 24px;color:#1a2340;font-size:14px;line-height:1.55;">
          ${body}
        </td></tr>
        <tr><td style="padding:14px 24px;background:#f5f4f1;color:#7a7a7a;font-size:11px;border-top:1px solid #e5e3df;">
          Off The Plan — Australia's home of off-the-plan property.
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

// ──────────────────────────────────────────────────────────────────────
// 1. Admin notification — new signup-popup ("Property Alert") submission
// ──────────────────────────────────────────────────────────────────────

export interface SignupNotificationArgs {
  full_name: string;
  email: string;
  interest_type?: string | null;
}

export function signupNotificationTemplate(args: SignupNotificationArgs) {
  const subject = `New Property Alert signup — ${args.full_name}`;
  const html = shell(`
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:${PRIMARY};">
      New Property Alert signup
    </h2>
    <p style="margin:0 0 8px;">Someone just signed up via the homepage popup.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Name</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(args.full_name)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(args.email)}" style="color:${ACCENT};">${escapeHtml(args.email)}</a></td></tr>
      ${args.interest_type ? `<tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Interested in</td><td style="padding:6px 0;">${escapeHtml(args.interest_type)}</td></tr>` : ""}
    </table>
    <p style="margin:24px 0 0;font-size:12px;color:#7a7a7a;">View all signups in the admin dashboard.</p>
  `);
  const text = [
    `New Property Alert signup`,
    ``,
    `Name: ${args.full_name}`,
    `Email: ${args.email}`,
    args.interest_type ? `Interested in: ${args.interest_type}` : null,
  ].filter(Boolean).join("\n");
  return { subject, html, text };
}

// ──────────────────────────────────────────────────────────────────────
// 2. Enquiry email — sent to developer + cc Tim + cc sales@
// ──────────────────────────────────────────────────────────────────────

export interface EnquiryNotificationArgs {
  development_name: string;
  development_url?: string | null;
  /** Buyer's name */
  full_name: string;
  /** Buyer's email — also used as reply-to */
  email: string;
  mobile?: string | null;
  buyer_type?: string | null;
  notes?: string | null;
}

export function enquiryNotificationTemplate(args: EnquiryNotificationArgs) {
  const subject = `New enquiry — ${args.development_name}`;
  const html = shell(`
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:${PRIMARY};">
      New enquiry for ${escapeHtml(args.development_name)}
    </h2>
    <p style="margin:0 0 8px;">A buyer just submitted an enquiry through Off The Plan.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Project</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(args.development_name)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Buyer name</td><td style="padding:6px 0;">${escapeHtml(args.full_name)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(args.email)}" style="color:${ACCENT};">${escapeHtml(args.email)}</a></td></tr>
      ${args.mobile ? `<tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Mobile</td><td style="padding:6px 0;">${escapeHtml(args.mobile)}</td></tr>` : ""}
      ${args.buyer_type ? `<tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Buyer type</td><td style="padding:6px 0;">${escapeHtml(args.buyer_type)}</td></tr>` : ""}
    </table>
    ${args.notes ? `<div style="margin-top:20px;padding:14px 16px;background:#f5f4f1;border-left:3px solid ${ACCENT};font-size:13px;line-height:1.55;">${escapeHtml(args.notes).replace(/\n/g, "<br>")}</div>` : ""}
    ${args.development_url ? `<p style="margin:24px 0 0;font-size:12px;"><a href="${args.development_url}" style="color:${ACCENT};">View the listing →</a></p>` : ""}
    <p style="margin:16px 0 0;font-size:12px;color:#7a7a7a;">You can reply directly to this email — it will reach the buyer.</p>
  `);
  const text = [
    `New enquiry — ${args.development_name}`,
    ``,
    `Buyer name: ${args.full_name}`,
    `Email: ${args.email}`,
    args.mobile ? `Mobile: ${args.mobile}` : null,
    args.buyer_type ? `Buyer type: ${args.buyer_type}` : null,
    args.notes ? `\nNotes:\n${args.notes}` : null,
    args.development_url ? `\nListing: ${args.development_url}` : null,
  ].filter(Boolean).join("\n");
  return { subject, html, text };
}

// ──────────────────────────────────────────────────────────────────────
// 3. Buyer enquiry confirmation — sent to the person who submitted the
//    enquiry on a listing page. Wording matches Tim's Template 1 (14 Jun
//    email) verbatim.
// ──────────────────────────────────────────────────────────────────────

export function enquiryConfirmationTemplate() {
  const subject = `Thanks for your enquiry — Off The Plan`;
  const html = shell(`
    <p style="margin:0 0 14px;">
      Hi, and thank you for using <a href="${SITE_URL}" style="color:${ACCENT};text-decoration:none;">Australia's Home Of New Property | Off The Plan</a>
    </p>
    <p style="margin:0 0 14px;">We've received your enquiry and passed it directly to the relevant team.</p>
    <p style="margin:0 0 14px;">Someone will be in touch with you shortly to assist further.</p>
    <p style="margin:0 0 14px;">If your enquiry is time-sensitive, feel free to contact us directly on <a href="${PHONE_HREF}" style="color:${ACCENT};text-decoration:none;">${PHONE_DISPLAY}</a></p>
    <p style="margin:0 0 4px;">Kind regards,</p>
    <p style="margin:0 0 18px;font-weight:600;">The team @OFFTHEPLAN</p>
    <hr style="border:none;border-top:1px solid #e5e3df;margin:18px 0 14px;">
    <p style="margin:0 0 6px;font-weight:600;font-size:13px;">Why not follow us socially...</p>
    ${socialRowHtml(["Instagram", "YouTube", "LinkedIn"])}
  `);
  const text = [
    `Hi, and thank you for using Australia's Home Of New Property | Off The Plan`,
    ``,
    `We've received your enquiry and passed it directly to the relevant team.`,
    `Someone will be in touch with you shortly to assist further.`,
    ``,
    `If your enquiry is time-sensitive, feel free to contact us directly on ${PHONE_DISPLAY}`,
    ``,
    `Kind regards,`,
    `The team @OFFTHEPLAN`,
    ``,
    `${SITE_URL}`,
  ].join("\n");
  return { subject, html, text };
}

// ──────────────────────────────────────────────────────────────────────
// 4. Newsletter / Property Alert welcome — sent to anyone who signs up
//    via the Circle popup. Wording matches Tim's Template 2 (14 Jun
//    email) verbatim.
// ──────────────────────────────────────────────────────────────────────

export function signupWelcomeTemplate() {
  const subject = `Welcome to Off The Plan`;
  const latestProjectsUrl = `${SITE_URL}/search`;
  const html = shell(`
    <p style="margin:0 0 14px;">Hi, and thank you for signing up with OFF-THE-PLAN.</p>
    <p style="margin:0 0 14px;">You're now on the list to receive updates on new property releases, market insights, and opportunities tailored to your interests.</p>
    <p style="margin:0 0 14px;">While you're here, you can start exploring available projects and opportunities:</p>
    <p style="margin:0 0 18px;font-size:15px;">
      👉 <a href="${latestProjectsUrl}" style="color:${ACCENT};text-decoration:none;font-weight:600;">Latest Projects</a>
    </p>
    <hr style="border:none;border-top:1px solid #e5e3df;margin:18px 0 14px;">
    <p style="margin:0 0 6px;font-weight:600;font-size:13px;">Why not follow us socially...</p>
    ${socialRowHtml(["Instagram", "YouTube", "Pinterest", "LinkedIn"])}
    <p style="margin:24px 0 0;">Welcome aboard,</p>
    <p style="margin:0;font-weight:600;">The team @OFFTHEPLAN</p>
  `);
  const text = [
    `Hi, and thank you for signing up with OFF-THE-PLAN.`,
    ``,
    `You're now on the list to receive updates on new property releases, market insights, and opportunities tailored to your interests.`,
    ``,
    `While you're here, you can start exploring available projects and opportunities:`,
    `→ Latest Projects: ${latestProjectsUrl}`,
    ``,
    `Welcome aboard,`,
    `The team @OFFTHEPLAN`,
    ``,
    `${SITE_URL}`,
  ].join("\n");
  return { subject, html, text };
}

// ──────────────────────────────────────────────────────────────────────
// 5. Set / reset password — emailed to a user with a one-time Supabase
//    recovery link that lands on /auth/set-password. Used both for the
//    new-site launch ("set your own password first login", mode: "set")
//    and for the self-service "Forgot password?" flow (mode: "reset").
// ──────────────────────────────────────────────────────────────────────

export interface SetPasswordEmailArgs {
  /** The Supabase recovery action_link the user clicks. */
  actionLink: string;
  /** "set" for first-login launch invites, "reset" for forgot-password. */
  mode?: "set" | "reset";
}

export function setPasswordEmailTemplate(args: SetPasswordEmailArgs) {
  const reset = args.mode === "reset";
  const href = escapeHtml(args.actionLink); // escapes & in query string for the href attr
  const subject = reset ? `Reset your Off The Plan password` : `Set your Off The Plan password`;
  const heading = reset ? "Reset your password" : "Set your password";
  const intro = reset
    ? "We received a request to reset the password for your Off The Plan account."
    : "Your Off The Plan account is ready. For your security, please set your own password to finish signing in.";
  const cta = reset ? "Reset password" : "Set my password";

  const html = shell(`
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:${PRIMARY};">${heading}</h2>
    <p style="margin:0 0 14px;">${intro}</p>
    <p style="margin:0 0 22px;">Click the button below to choose a new password. This link can only be used once and expires after a short time.</p>
    <p style="margin:0 0 22px;">
      <a href="${href}" style="display:inline-block;background:${ACCENT};color:#ffffff;text-decoration:none;font-weight:600;font-size:14px;padding:12px 24px;border-radius:2px;">${cta}</a>
    </p>
    <p style="margin:0 0 6px;font-size:12px;color:#7a7a7a;">If the button doesn't work, copy and paste this link into your browser:</p>
    <p style="margin:0 0 18px;font-size:12px;word-break:break-all;"><a href="${href}" style="color:${ACCENT};">${href}</a></p>
    <p style="margin:0;font-size:12px;color:#7a7a7a;">If you didn't request this, you can safely ignore this email — your password won't change.</p>
  `);
  const text = [
    heading,
    ``,
    intro,
    ``,
    `Set a new password here (single use, expires soon):`,
    args.actionLink,
    ``,
    `If you didn't request this, you can safely ignore this email.`,
    ``,
    `The team @OFFTHEPLAN`,
  ].join("\n");
  return { subject, html, text };
}

// ──────────────────────────────────────────────────────────────────────
// Developer contact form — sent from /developers/[slug] to the developer
// (or fallback admin), CC'ing the sender + sales@.
// ──────────────────────────────────────────────────────────────────────

export interface DeveloperContactArgs {
  developer_name: string;
  developer_url?: string | null;
  full_name: string;
  email: string;
  mobile?: string | null;
  message: string;
}

export function developerContactTemplate(args: DeveloperContactArgs) {
  const subject = `New contact via Off The Plan — ${args.developer_name}`;
  const html = shell(`
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:${PRIMARY};">
      Someone wants to get in touch
    </h2>
    <p style="margin:0 0 8px;">A visitor sent a message via your developer page on Off The Plan.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Developer</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(args.developer_name)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">From</td><td style="padding:6px 0;">${escapeHtml(args.full_name)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(args.email)}" style="color:${ACCENT};">${escapeHtml(args.email)}</a></td></tr>
      ${args.mobile ? `<tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Mobile</td><td style="padding:6px 0;">${escapeHtml(args.mobile)}</td></tr>` : ""}
    </table>
    <div style="margin-top:20px;padding:14px 16px;background:#f5f4f1;border-left:3px solid ${ACCENT};font-size:13px;line-height:1.55;">${escapeHtml(args.message).replace(/\n/g, "<br>")}</div>
    ${args.developer_url ? `<p style="margin:24px 0 0;font-size:12px;"><a href="${args.developer_url}" style="color:${ACCENT};">View your developer page →</a></p>` : ""}
    <p style="margin:16px 0 0;font-size:12px;color:#7a7a7a;">You can reply directly to this email — it will reach the sender.</p>
  `);
  const text = [
    `New contact via Off The Plan — ${args.developer_name}`,
    ``,
    `From: ${args.full_name}`,
    `Email: ${args.email}`,
    args.mobile ? `Mobile: ${args.mobile}` : null,
    ``,
    `Message:`,
    args.message,
    args.developer_url ? `\nDeveloper page: ${args.developer_url}` : null,
  ].filter(Boolean).join("\n");
  return { subject, html, text };
}

// ──────────────────────────────────────────────────────────────────────
// Media Kit request — sent from the pricing page modal to admin + sales@.
// Replaces the legacy mailto: link so requests arrive in a structured,
// branded format instead of from whatever client the user happens to use.
// ──────────────────────────────────────────────────────────────────────

export interface MediaKitRequestArgs {
  full_name: string;
  email: string;
  phone: string;
  company?: string | null;
  category: string;
  state: string;
}

export function mediaKitRequestTemplate(args: MediaKitRequestArgs) {
  const subject = `Media Kit request — ${args.full_name}${args.company ? ` (${args.company})` : ""}`;
  const html = shell(`
    <h2 style="margin:0 0 16px;font-size:18px;font-weight:600;color:${PRIMARY};">
      New Media Kit request
    </h2>
    <p style="margin:0 0 8px;">Someone just requested a media kit via the pricing page.</p>
    <table cellpadding="0" cellspacing="0" border="0" style="margin-top:16px;font-size:13px;border-collapse:collapse;">
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Name</td><td style="padding:6px 0;font-weight:600;">${escapeHtml(args.full_name)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Email</td><td style="padding:6px 0;"><a href="mailto:${escapeHtml(args.email)}" style="color:${ACCENT};">${escapeHtml(args.email)}</a></td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Phone</td><td style="padding:6px 0;">${escapeHtml(args.phone)}</td></tr>
      ${args.company ? `<tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Company</td><td style="padding:6px 0;">${escapeHtml(args.company)}</td></tr>` : ""}
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Marketing</td><td style="padding:6px 0;">${escapeHtml(args.category)}</td></tr>
      <tr><td style="padding:6px 12px 6px 0;color:#7a7a7a;">Located in</td><td style="padding:6px 0;">${escapeHtml(args.state)}</td></tr>
    </table>
    <p style="margin:16px 0 0;font-size:12px;color:#7a7a7a;">You can reply directly to this email — it will reach the requester.</p>
  `);
  const text = [
    `New Media Kit request`,
    ``,
    `Name: ${args.full_name}`,
    `Email: ${args.email}`,
    `Phone: ${args.phone}`,
    args.company ? `Company: ${args.company}` : null,
    `Marketing: ${args.category}`,
    `Located in: ${args.state}`,
  ].filter(Boolean).join("\n");
  return { subject, html, text };
}
