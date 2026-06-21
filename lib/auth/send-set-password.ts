import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendEmail } from "@/lib/email/send";
import { setPasswordEmailTemplate } from "@/lib/email/templates";

/**
 * Generates a single-use Supabase recovery link for `email` and sends it via
 * Resend with our own branding, landing the user on /auth/set-password.
 *
 * Why generateLink (admin) + Resend rather than supabase.auth.resetPasswordForEmail:
 *  - keeps the email on our verified Resend sender/branding (the rest of the
 *    app's email already goes through Resend), instead of Supabase's default
 *    SMTP which isn't configured for this project;
 *  - gives us the same proven pattern the impersonation flow uses
 *    (app/api/admin/users/impersonate/route.ts).
 *
 * `origin` must be a URL that's in the Supabase Auth redirect allow-list
 * (the deployment origin). Callers derive it from the request headers.
 *
 * Returns { sent } so bulk callers can tally successes/failures. Never throws.
 */
export async function sendSetPasswordLink(opts: {
  email: string;
  origin: string;
  mode?: "set" | "reset";
}): Promise<{ sent: boolean; error?: string }> {
  const { email, origin, mode = "set" } = opts;

  let actionLink: string | undefined;
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: "recovery",
      email,
      options: { redirectTo: `${origin}/auth/set-password` },
    });
    if (error) {
      console.error(`[send-set-password] generateLink failed for ${email}:`, error.message);
      return { sent: false, error: error.message };
    }
    actionLink = data.properties?.action_link ?? undefined;
  } catch (e) {
    console.error(`[send-set-password] generateLink threw for ${email}:`, e);
    return { sent: false, error: e instanceof Error ? e.message : String(e) };
  }

  if (!actionLink) {
    return { sent: false, error: "No action link returned" };
  }

  const tpl = setPasswordEmailTemplate({ actionLink, mode });
  return sendEmail({ to: email, subject: tpl.subject, html: tpl.html, text: tpl.text });
}
