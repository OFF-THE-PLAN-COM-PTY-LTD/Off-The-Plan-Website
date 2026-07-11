import { supabaseAdmin } from "@/lib/supabase/admin";

/**
 * Sync a Developer-classified agency into the public `developers` directory.
 * ====================================================================
 * The public /developers list + /developers/[slug] detail + listing counts
 * all read the `developers` table. When an admin marks an agency as
 * interest_type='Developer' on /admin/agencies we mirror it into a linked
 * `developers` row (developers.agency_id, migration 045) so it appears
 * publicly with the agency's logo / about / socials — without breaking the
 * slug-based detail page.
 *
 * Design choices:
 *  - Adopt, don't duplicate: if an unlinked directory row already exists
 *    with the same name (e.g. a migrated "Ceerose"), we link that row
 *    instead of creating a second public card.
 *  - Fill blanks, don't clobber: on an existing row we only populate empty
 *    columns, so admin edits in /admin/developers always win. Same
 *    philosophy as the profile-link precedence (migration 041).
 */

/** Slugify a company name for the /developers/[slug] URL. */
export function slugifyName(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60) || "developer";
}

/** The developer-card fields we can derive from an agency row. */
function mapAgencyToDeveloper(a: Record<string, any>) {
  // The public directory lists developer COMPANIES, so prefer org_name (the
  // company) over name (the contact person). Falling back to name only when
  // there's no company on file. Using the company name also lets us adopt an
  // existing same-name developer row (e.g. "Built Form Capital") instead of
  // creating a duplicate under the contact's personal name.
  const name = (a.org_name?.trim() || a.name?.trim() || "") as string;
  return {
    name,
    logo_url: a.dev_logo_url || a.org_logo_url || a.profile_pic || null,
    description: a.about || null,
    website: a.website_url || null,
    state: a.org_state || null,
    suburb: a.org_city || null,
    company_email: a.org_email || a.email || null,
    // NOTE: `developers` has no phone column — do not add one here or inserts
    // fail. Contact phone lives on the linked profile, not the directory row.
    facebook: a.facebook_url || null,
    instagram: a.instagram_url || null,
    linkedin: a.linkedin_url || null,
    pinterest: a.pinterest_url || null,
    youtube: a.youtube_url || null,
  };
}

/** Find a slug not already taken, appending -2, -3… as needed. */
async function uniqueSlug(base: string, ignoreId?: string): Promise<string> {
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const { data } = await supabaseAdmin
      .from("developers")
      .select("id")
      .eq("slug", candidate)
      .maybeSingle();
    if (!data || data.id === ignoreId) return candidate;
  }
  // Extremely unlikely; fall back to a base + timestamp-free counter cap.
  return `${base}-x`;
}

/** Only include keys whose current value on `existing` is null/empty. */
function fillBlanks(existing: Record<string, any>, mapped: Record<string, any>) {
  const patch: Record<string, any> = {};
  for (const [k, v] of Object.entries(mapped)) {
    if (v == null || v === "") continue;
    const cur = existing[k];
    if (cur == null || cur === "") patch[k] = v;
  }
  return patch;
}

export type SyncOutcome =
  | { action: "skipped"; reason: string }
  | { action: "updated" | "adopted" | "created"; developerId: string; slug: string };

/**
 * Ensure a published `developers` row exists for this agency. Idempotent.
 * Returns what it did (for logging / backfill dry-runs).
 */
export async function syncDeveloperFromAgency(agencyId: string): Promise<SyncOutcome> {
  const { data: agency, error } = await supabaseAdmin
    .from("agencies")
    .select(
      "id, name, org_name, email, mobile, about, profile_pic, org_logo_url, dev_logo_url, " +
        "org_email, org_phone, website_url, org_state, org_city, archived, " +
        "facebook_url, instagram_url, linkedin_url, pinterest_url, youtube_url",
    )
    .eq("id", agencyId)
    .single();
  if (error || !agency) return { action: "skipped", reason: "agency not found" };
  const a = agency as Record<string, any>;

  // Archived (soft-deleted) agencies must never surface publicly. If one is
  // somehow still marked Developer, hide any card it already produced.
  if (a.archived === true) {
    await unpublishDeveloperForAgency(agencyId);
    return { action: "skipped", reason: "agency is archived" };
  }

  const mapped = mapAgencyToDeveloper(a);
  if (!mapped.name) return { action: "skipped", reason: "agency has no name" };

  // 1) Already linked → refresh blanks + ensure published.
  const { data: linked } = await supabaseAdmin
    .from("developers")
    .select("*")
    .eq("agency_id", agencyId)
    .maybeSingle();
  if (linked) {
    const patch = { ...fillBlanks(linked, mapped), is_published: true };
    const { error: e } = await supabaseAdmin.from("developers").update(patch).eq("id", linked.id);
    if (e) return { action: "skipped", reason: e.message };
    return { action: "updated", developerId: linked.id as string, slug: linked.slug as string };
  }

  // 2) Unlinked row with the same name → adopt it rather than duplicate.
  const { data: nameMatch } = await supabaseAdmin
    .from("developers")
    .select("*")
    .is("agency_id", null)
    .ilike("name", mapped.name)
    .maybeSingle();
  if (nameMatch) {
    const patch = { ...fillBlanks(nameMatch, mapped), agency_id: agencyId, is_published: true };
    const { error: e } = await supabaseAdmin.from("developers").update(patch).eq("id", nameMatch.id);
    if (e) return { action: "skipped", reason: e.message };
    return { action: "adopted", developerId: nameMatch.id as string, slug: nameMatch.slug as string };
  }

  // 3) Create a fresh directory row.
  const slug = await uniqueSlug(slugifyName(mapped.name));
  const { data: created, error: insErr } = await supabaseAdmin
    .from("developers")
    .insert({ ...mapped, slug, agency_id: agencyId, is_published: true })
    .select("id, slug")
    .single();
  if (insErr || !created) return { action: "skipped", reason: insErr?.message ?? "insert failed" };
  return { action: "created", developerId: created.id as string, slug: created.slug as string };
}

/**
 * An agency is no longer a Developer → hide its synced directory row.
 * We unpublish rather than delete so admin edits and the slug survive if the
 * agency is reclassified back. No-op if there's no linked row.
 */
export async function unpublishDeveloperForAgency(agencyId: string): Promise<void> {
  await supabaseAdmin
    .from("developers")
    .update({ is_published: false })
    .eq("agency_id", agencyId);
}
