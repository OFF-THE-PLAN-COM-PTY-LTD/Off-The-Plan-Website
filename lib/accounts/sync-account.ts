import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Keep the consolidated `accounts` row in sync with member profile edits.
 * ====================================================================
 * The public site and admin read `accounts`. Members still edit their
 * `profiles` row; this helper mirrors those edits onto the linked account
 * (matched by accounts.user_id) so the directory reflects the change
 * immediately.
 *
 * The former agency→accounts dual-write (syncAccountFromAgency) and the
 * directory opt-in helper (setAccountPublished) were retired once the admin
 * agency edit + registration + directory opt-in flows began writing `accounts`
 * directly. `profiles` is not being consolidated, so this profile→account
 * mirror stays.
 */

const val = (...xs: unknown[]): string | null => {
  for (const x of xs) if (x != null && String(x).trim() !== "") return String(x);
  return null;
};

/** Patch the account linked to a login (by accounts.user_id) from profile edits. */
export async function syncAccountFromProfile(userId: string): Promise<void> {
  const { data: p } = await supabaseAdmin.from("profiles").select("*").eq("id", userId).maybeSingle();
  if (!p) return;
  const { data: existing } = await supabaseAdmin.from("accounts").select("id").eq("user_id", userId).maybeSingle();
  if (!existing) return; // no linked account yet — nothing to mirror

  // Only patch fields the profile actually has a value for (never clobber with null).
  const candidate: Record<string, string | null> = {
    name: val(p.business_name),
    description: val(p.about),
    company_email: val(p.company_email),
    company_phone: val(p.company_phone),
    website: val(p.website),
    abn: val(p.abn),
    state: val(p.company_state, p.state),
    city: val(p.company_city),
    logo_url: val(p.developer_logo_url, p.company_logo_url),
    facebook: val(p.facebook),
    instagram: val(p.instagram),
    linkedin: val(p.linkedin),
    pinterest: val(p.pinterest),
    youtube: val(p.youtube),
  };
  const patch = Object.fromEntries(Object.entries(candidate).filter(([, v]) => v !== null));
  if (Object.keys(patch).length === 0) return;
  await supabaseAdmin.from("accounts").update(patch).eq("id", existing.id);
}
