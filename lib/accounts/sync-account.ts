import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Keep the consolidated `accounts` row in sync with edits to the legacy
 * `agencies` / `profiles` tables (transitional dual-write).
 * ====================================================================
 * The public site reads `accounts`; admins still edit `agencies` and members
 * still edit `profiles`. These helpers recompute the linked account after each
 * such write so the directory reflects the change immediately. This replaces
 * the old agency→developers projection (lib/developers/sync-from-agency.ts)
 * once the read cutover is complete.
 *
 * Field mapping mirrors scripts/backfill-accounts.mjs. `is_published` is NOT
 * touched here — directory visibility is owned by the admin publish toggle /
 * the member directory opt-in, not by an ordinary profile/agency edit.
 */

const val = (...xs: unknown[]): string | null => {
  for (const x of xs) if (x != null && String(x).trim() !== "") return String(x);
  return null;
};

const slugify = (name: string): string =>
  (name.toLowerCase().trim().replace(/&/g, " and ").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60)) || "account";

async function uniqueSlug(base: string): Promise<string> {
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const { data } = await supabaseAdmin.from("accounts").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-x`;
}

/** Upsert the account linked to an agency (by accounts.legacy_agency_id). */
export async function syncAccountFromAgency(agencyId: string, opts?: { userId?: string | null }): Promise<void> {
  const { data: a } = await supabaseAdmin.from("agencies").select("*").eq("id", agencyId).maybeSingle();
  if (!a) return;

  const name = val(a.org_name, a.name, `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()) || "Unnamed";
  const row: Record<string, unknown> = {
    legacy_agency_id: agencyId,
    type: a.interest_type ?? null,
    name,
    first_name: a.first_name ?? null,
    last_name: a.last_name ?? null,
    description: a.about ?? null,
    email: a.email ?? null,
    company_email: val(a.org_email, a.email),
    phone: a.mobile ?? null,
    company_phone: a.org_phone ?? null,
    website: a.website_url ?? null,
    logo_url: val(a.dev_logo_url, a.org_logo_url, a.profile_pic),
    avatar_url: a.profile_pic ?? null,
    state: a.org_state ?? null,
    city: a.org_city ?? null,
    street_address: a.org_street_address ?? null,
    street_address_2: a.org_street_address_2 ?? null,
    country: a.org_country ?? null,
    postcode: a.org_postcode ?? null,
    facebook: a.facebook_url ?? null,
    instagram: a.instagram_url ?? null,
    linkedin: a.linkedin_url ?? null,
    pinterest: a.pinterest_url ?? null,
    youtube: a.youtube_url ?? null,
    twitter: a.twitter_url ?? null,
    portal_status: a.portal_status ?? "active",
    archived: a.archived === true,
    email_verified: a.email_verified === true,
    total_active_listings: a.total_active_listings ?? 0,
    legacy_id: a.legacy_id ?? null,
    // Directory visibility is derived from agency state — mirrors what the old
    // agency→developers sync did (archive/deactivate/declassify hides the card;
    // an active, non-archived Developer shows).
    is_published: a.interest_type === "Developer" && (a.portal_status ?? "active") === "active" && a.archived !== true,
  };
  if (opts?.userId) row.user_id = opts.userId;

  const { data: existing } = await supabaseAdmin
    .from("accounts").select("id").eq("legacy_agency_id", agencyId).maybeSingle();

  if (existing) {
    await supabaseAdmin.from("accounts").update(row).eq("id", existing.id);
  } else {
    await supabaseAdmin.from("accounts").insert({ ...row, slug: await uniqueSlug(slugify(name)) });
  }
}

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

/**
 * Flip an account's directory visibility (member opt-in). The only caller is
 * the developer-gated directory opt-in route, so publishing also ensures the
 * account is classified 'Developer' (otherwise the public read, which requires
 * type='Developer', would never surface it).
 */
export async function setAccountPublished(userId: string, published: boolean): Promise<void> {
  const patch = published ? { is_published: true, type: "Developer" } : { is_published: false };
  await supabaseAdmin.from("accounts").update(patch).eq("user_id", userId);
}
