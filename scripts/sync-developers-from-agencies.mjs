/**
 * Backfill: sync every Developer-classified agency into the public
 * /developers directory (the `developers` table).
 * ====================================================================
 * For each agency with interest_type='Developer', ensure a published
 * `developers` row exists carrying its logo / about / socials, linked via
 * developers.agency_id (migration 045). Mirrors the runtime sync in
 * app/api/admin/agencies/interest-type/route.ts.
 *
 * Behaviour:
 *   - already linked (agency_id)  -> refresh blank fields, ensure published
 *   - unlinked row, same name     -> ADOPT it (no duplicate public card)
 *   - no match                    -> CREATE a new published row
 *
 * Run the migration first:  supabase/migrations/045_developers_agency_link.sql
 *
 * Dry run (default — shows what WOULD happen, writes nothing):
 *   node scripts/sync-developers-from-agencies.mjs
 * Apply for real:
 *   node scripts/sync-developers-from-agencies.mjs --apply
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}

const APPLY = process.argv.includes("--apply");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

function slugifyName(name) {
  return (
    name
      .toLowerCase()
      .trim()
      .replace(/&/g, " and ")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "developer"
  );
}

function mapAgencyToDeveloper(a) {
  // Prefer org_name (company) over name (contact person) — the public
  // directory lists developer companies, and it lets us adopt an existing
  // same-name developer row instead of duplicating under a person's name.
  const name = (a.org_name?.trim() || a.name?.trim() || "");
  return {
    name,
    logo_url: a.dev_logo_url || a.org_logo_url || a.profile_pic || null,
    description: a.about || null,
    website: a.website_url || null,
    state: a.org_state || null,
    suburb: a.org_city || null,
    company_email: a.org_email || a.email || null,
    // NOTE: `developers` has no phone column — adding one here makes inserts
    // fail. Contact phone lives on the linked profile, not the directory row.
    facebook: a.facebook_url || null,
    instagram: a.instagram_url || null,
    linkedin: a.linkedin_url || null,
    pinterest: a.pinterest_url || null,
    youtube: a.youtube_url || null,
  };
}

function fillBlanks(existing, mapped) {
  const patch = {};
  for (const [k, v] of Object.entries(mapped)) {
    if (v == null || v === "") continue;
    const cur = existing[k];
    if (cur == null || cur === "") patch[k] = v;
  }
  return patch;
}

async function uniqueSlug(base) {
  for (let n = 1; n < 100; n++) {
    const candidate = n === 1 ? base : `${base}-${n}`;
    const { data } = await supabase.from("developers").select("id").eq("slug", candidate).maybeSingle();
    if (!data) return candidate;
  }
  return `${base}-x`;
}

async function syncOne(agency) {
  const mapped = mapAgencyToDeveloper(agency);
  if (!mapped.name) return { action: "skipped", reason: "no name" };

  const { data: linked } = await supabase
    .from("developers")
    .select("*")
    .eq("agency_id", agency.id)
    .maybeSingle();
  if (linked) {
    const patch = { ...fillBlanks(linked, mapped), is_published: true };
    if (APPLY) {
      const { error } = await supabase.from("developers").update(patch).eq("id", linked.id);
      if (error) return { action: "skipped", reason: error.message };
    }
    return { action: "updated", slug: linked.slug };
  }

  const { data: nameMatch } = await supabase
    .from("developers")
    .select("*")
    .is("agency_id", null)
    .ilike("name", mapped.name)
    .maybeSingle();
  if (nameMatch) {
    const patch = { ...fillBlanks(nameMatch, mapped), agency_id: agency.id, is_published: true };
    if (APPLY) {
      const { error } = await supabase.from("developers").update(patch).eq("id", nameMatch.id);
      if (error) return { action: "skipped", reason: error.message };
    }
    return { action: "adopted", slug: nameMatch.slug };
  }

  const slug = await uniqueSlug(slugifyName(mapped.name));
  if (APPLY) {
    const { error } = await supabase
      .from("developers")
      .insert({ ...mapped, slug, agency_id: agency.id, is_published: true });
    if (error) return { action: "skipped", reason: error.message };
  }
  return { action: "created", slug, logo: Boolean(mapped.logo_url) };
}

async function main() {
  console.log(`\n${APPLY ? "🚀 APPLYING" : "🔍 DRY RUN"} — syncing Developer-agencies → /developers\n`);

  const { data: agencies, error } = await supabase
    .from("agencies")
    .select(
      "id, name, org_name, email, mobile, about, profile_pic, org_logo_url, dev_logo_url, " +
        "org_email, org_phone, website_url, org_state, org_city, " +
        "facebook_url, instagram_url, linkedin_url, pinterest_url, youtube_url, interest_type",
    )
    .eq("interest_type", "Developer")
    // Never publish archived (soft-deleted) agencies to the public directory.
    .or("archived.is.null,archived.eq.false")
    .order("name");
  if (error) {
    console.error("Failed to load agencies:", error.message);
    process.exit(1);
  }

  const tally = { created: 0, adopted: 0, updated: 0, skipped: 0 };
  for (const a of agencies ?? []) {
    const r = await syncOne(a);
    tally[r.action] = (tally[r.action] ?? 0) + 1;
    const label = (a.name || a.org_name || "—").padEnd(32);
    const extra =
      r.action === "created" ? `/developers/${r.slug}${r.logo ? "" : "  (no logo)"}`
        : r.action === "adopted" ? `→ existing /developers/${r.slug}`
        : r.action === "updated" ? `/developers/${r.slug}`
        : r.reason ?? "";
    console.log(`  ${r.action.toUpperCase().padEnd(8)} ${label} ${extra}`);
  }

  console.log(
    `\n✅ ${(agencies ?? []).length} Developer-agencies — ` +
      `created ${tally.created}, adopted ${tally.adopted}, updated ${tally.updated}, skipped ${tally.skipped}`,
  );
  if (!APPLY) console.log("\n(dry-run — nothing written. Re-run with --apply to commit.)");
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
