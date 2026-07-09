import { supabaseAdmin } from "@/lib/supabase/admin";
import { sendSetPasswordLink } from "./send-set-password";

/**
 * "Invite a legacy user to set their password."
 *
 * Same delivered email as {@link sendSetPasswordLink}, but first ensures the
 * Supabase Auth user exists for this email — creating one with
 * email_confirm=true and no password if it doesn't. This is the migration
 * path for legacy profiles that were imported before there was a login
 * layer (the "orphaned" rows in /admin/agencies Archived tab).
 *
 * After the user clicks the link and picks a password, they'll show up as a
 * normal active member — their agency row is no longer orphaned, and the
 * regular password-reset flow works for them going forward.
 *
 * Caller may pass a pre-built emailToUserId map to skip the per-call
 * listUsers scan when processing many emails in bulk.
 */
export async function sendInviteLink(opts: {
  email: string;
  origin: string;
  /** Optional: caller has already listed auth users and can skip the scan. */
  emailToUserId?: Map<string, string>;
}): Promise<{ sent: boolean; created: boolean; error?: string }> {
  const email = opts.email;
  const target = email.toLowerCase();

  // 1. Is there already an auth user for this email?
  let userExists = false;
  if (opts.emailToUserId) {
    userExists = opts.emailToUserId.has(target);
  } else {
    for (let page = 1; page <= 50; page++) {
      const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage: 200 });
      if (error) return { sent: false, created: false, error: error.message };
      if (data.users.some((u) => u.email?.toLowerCase() === target)) {
        userExists = true;
        break;
      }
      if (data.users.length < 200) break;
    }
  }

  // 2. Create the user if missing. email_confirm=true skips Supabase's own
  //    confirmation email (we send our own branded link via Resend below).
  let created = false;
  if (!userExists) {
    const { error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true,
    });
    if (error) {
      // Race: another concurrent call may have created the user first.
      // "already been registered" is fine — proceed as if we found it.
      const msg = error.message || "";
      if (!/already/i.test(msg)) {
        return { sent: false, created: false, error: msg };
      }
    } else {
      created = true;
    }
  }

  // 3. Delegate the branded set-password email to the existing helper.
  const result = await sendSetPasswordLink({ email, origin: opts.origin, mode: "set" });
  return { sent: result.sent, created, error: result.error };
}
