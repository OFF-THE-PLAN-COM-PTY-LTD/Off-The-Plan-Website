/**
 * HTML email templates. Templates return `{ subject, html, text }` so
 * the send helper can pass the whole object through to Resend.
 */

import { socialRowHtml } from "@/lib/social-links";

const BRAND = "Off The Plan";
const PRIMARY = "#1a2340";
const ACCENT = "#e85d26";
const SITE_URL = "https://offtheplan.com.au";
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
