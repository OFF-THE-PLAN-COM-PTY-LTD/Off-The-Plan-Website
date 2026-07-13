/**
 * Phase 2 backfill: merge `agencies` + `developers` into the new `accounts`
 * table (created by supabase/migrations/046_accounts.sql).
 * ====================================================================
 * Idempotent. Writes ONLY to `accounts` — leaves agencies/developers/profiles
 * untouched, so it is fully reversible by `truncate accounts`.
 *
 * Strategy (see the plan, Phase 2):
 *   1. Seed one account per agency (the richer company record) keyed by
 *      legacy_agency_id. Derive is_published for Developer + active + !archived.
 *   2. Merge developers in, deduping against the agency-seeded rows:
 *        - developer.agency_id set   -> enrich the matching account, carry slug
 *        - developer.profile_id set  -> match by the profile's auth email
 *        - orphan (no links)         -> EXACT normalised-name match only;
 *                                       anything ambiguous goes to a worksheet
 *   3. Backfill accounts.user_id by lowercased email -> auth.users.
 *   4. Archive fix: only un-archive rows on an explicit allowlist (Tim's list).
 *
 * Run against LOCAL first (point .env.local at the local Supabase), dry-run:
 *   node scripts/backfill-accounts.mjs
 * Apply for real:
 *   node scripts/backfill-accounts.mjs --apply
 *
 * Requires env: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
 * Emits: scratchpad/accounts-dedup-worksheet.csv (ambiguous orphans for review)
 */

import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { writeFileSync } from "node:fs";

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

// Rows the client (Tim) confirms are genuinely live and should be un-archived
// as part of the merge. Anything NOT here keeps its current archived flag.
// Populate with legacy agency ids or exact org_names once Tim signs off.
const UNARCHIVE_ALLOWLIST_ORG_NAMES = new Set([
  // "Coronation Property", "Eton Property", "Platino Properties", ...
]);

// ---------- helpers ----------

const val = (...xs) => {
  for (const x of xs) {
    if (x !== null && x !== undefined && String(x).trim() !== "") return x;
  }
  return null;
};

// Slug generator — same shape as lib/developers/sync-from-agency.ts.
const slugifyName = (name) =>
  (String(name || "")
    .toLowerCase()
    .trim()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)) || "account";

// Aggressive normalisation for dedup ONLY (never stored). Strips the noise
// words that create the Fiducia/Inca/Masscon false-duplicates.
const normalizeForDedup = (name) =>
  String(name || "")
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/\b(pty|ltd|group|property|properties|developments?|the|collection|and)\b/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");

// Map an agencies row -> accounts row (company data). Coalesce order mirrors
// the field-mapping table in the plan and sync-from-agency.ts logo precedence.
const mapAgencyToAccount = (a, userId) => ({
  user_id: userId ?? null,
  type: a.interest_type ?? null,
  name: val(a.org_name, a.name, `${a.first_name ?? ""} ${a.last_name ?? ""}`.trim()) || "Unnamed",
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
  personal_street_address: a.personal_street_address ?? null,
  personal_country: a.personal_country ?? null,
  personal_state: a.personal_state ?? null,
  personal_city: a.personal_city ?? null,
  personal_postcode: a.personal_postcode ?? null,
  facebook: a.facebook_url ?? null,
  instagram: a.instagram_url ?? null,
  linkedin: a.linkedin_url ?? null,
  pinterest: a.pinterest_url ?? null,
  youtube: a.youtube_url ?? null,
  twitter: a.twitter_url ?? null,
  portal_status: a.portal_status ?? "active",
  archived: UNARCHIVE_ALLOWLIST_ORG_NAMES.has(a.org_name) ? false : a.archived === true,
  email_verified: a.email_verified === true,
  total_active_listings: a.total_active_listings ?? 0,
  legacy_id: a.legacy_id ?? null,
  legacy_agency_id: a.id,
});

// Map a directory-only developer (no agency) -> its own account. userId is the
// developer's profile_id (which IS the auth.users id, since profiles.id = auth id).
const mapDeveloperToAccount = (d, userId) => ({
  user_id: userId ?? null,
  type: "Developer",
  name: val(d.name) || "Unnamed",
  description: d.description ?? null,
  website: d.website ?? null,
  company_email: d.company_email ?? null,
  abn: d.abn ?? null,
  state: d.state ?? null,
  city: d.suburb ?? null,
  logo_url: d.logo_url ?? null,
  facebook: d.facebook ?? null,
  instagram: d.instagram ?? null,
  linkedin: d.linkedin ?? null,
  pinterest: d.pinterest ?? null,
  youtube: d.youtube ?? null,
  // Directory-only developers (no agency link) are HIDDEN on the current
  // /developers (the list filters agency_id NOT NULL). Preserve that: import
  // them unpublished so the new directory shows the same set. Tim can publish
  // the legitimate ones afterwards.
  is_published: false,
  portal_status: "active",
  archived: false,
  legacy_developer_id: d.id,
});

// Blank fields on an existing account we may fill from a developer row.
const fillBlanks = (existing, patch) => {
  const out = {};
  for (const [k, v] of Object.entries(patch)) {
    if (v === null || v === undefined || String(v).trim() === "") continue;
    const cur = existing[k];
    if (cur === null || cur === undefined || String(cur).trim() === "") out[k] = v;
  }
  return out;
};

// ---------- load ----------

async function loadAll(table, cols = "*") {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await supabase
      .from(table)
      .select(cols)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function buildEmailToUserId() {
  const map = new Map();
  const PER = 1000;
  for (let page = 1; ; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER });
    if (error) throw new Error(`listUsers: ${error.message}`);
    for (const u of data.users ?? []) if (u.email) map.set(u.email.toLowerCase(), u.id);
    if (!data.users || data.users.length < PER) break;
  }
  return map;
}

// ---------- main ----------

async function main() {
  console.log(`\nBackfill accounts — ${APPLY ? "APPLY" : "DRY RUN"} — ${SUPABASE_URL}\n`);

  const [agencies, developers, emailToUserId] = await Promise.all([
    loadAll("agencies"),
    loadAll("developers"),
    buildEmailToUserId(),
  ]);
  console.log(`Loaded: ${agencies.length} agencies, ${developers.length} developers, ${emailToUserId.size} auth users.`);

  // In-memory model of the accounts we will write, keyed by legacy_agency_id.
  const usedSlugs = new Set();
  const usedUserIds = new Set(); // one account per login (accounts_user_id_unique)
  const accountsByAgencyId = new Map();
  const worksheet = []; // genuinely-ambiguous orphans for Tim
  const extraAccounts = []; // directory-only developers -> their own account

  const ensureUniqueSlug = (base) => {
    let slug = base;
    for (let n = 2; usedSlugs.has(slug); n++) slug = `${base}-${n}`;
    usedSlugs.add(slug);
    return slug;
  };

  // 1) Seed from agencies.
  for (const a of agencies) {
    let userId = a.email ? emailToUserId.get(a.email.toLowerCase()) : undefined;
    // Duplicate agency emails would map two accounts to one login — only the
    // first account keeps the link; the rest go account-less (user_id null).
    if (userId && usedUserIds.has(userId)) userId = undefined;
    if (userId) usedUserIds.add(userId);
    const row = mapAgencyToAccount(a, userId);
    row.slug = ensureUniqueSlug(slugifyName(row.name));
    // Derive directory visibility for Developer agencies.
    row.is_published = row.type === "Developer" && row.portal_status === "active" && row.archived === false;
    accountsByAgencyId.set(a.id, row);
  }

  // 2) Merge developers.
  const byNormName = new Map();
  for (const row of accountsByAgencyId.values()) {
    const k = normalizeForDedup(row.name);
    if (k) (byNormName.get(k) ?? byNormName.set(k, []).get(k)).push(row);
  }

  let merged = 0, createdFromDev = 0, ambiguous = 0;
  for (const d of developers) {
    if (d.agency_id && accountsByAgencyId.has(d.agency_id)) {
      // 2a. Linked to an agency -> enrich that account, carry slug + published.
      const acc = accountsByAgencyId.get(d.agency_id);
      Object.assign(acc, fillBlanks(acc, {
        description: d.description, logo_url: d.logo_url, website: d.website,
        abn: d.abn, state: d.state, city: d.suburb, company_email: d.company_email,
        facebook: d.facebook, instagram: d.instagram, linkedin: d.linkedin,
        pinterest: d.pinterest, youtube: d.youtube,
      }));
      // Prefer the developer's existing public slug (SEO) over the generated one.
      if (d.slug && d.slug !== acc.slug) { usedSlugs.delete(acc.slug); acc.slug = ensureUniqueSlug(d.slug); }
      acc.is_published = acc.is_published || d.is_published === true;
      acc.legacy_developer_id = d.id;
      merged++;
      continue;
    }

    // 2c. Orphan (or profile-linked): try an EXACT normalised-name match.
    const key = normalizeForDedup(d.name);
    const candidates = byNormName.get(key) ?? [];
    if (candidates.length === 1) {
      const acc = candidates[0];
      Object.assign(acc, fillBlanks(acc, { description: d.description, logo_url: d.logo_url, abn: d.abn }));
      acc.legacy_developer_id = acc.legacy_developer_id ?? d.id;
      acc.is_published = acc.is_published || d.is_published === true;
      worksheet.push({ orphan_slug: d.slug, orphan_name: d.name, matched: acc.name, decision: "auto-merged (exact)" });
      merged++;
    } else if (candidates.length === 0) {
      // No agency match -> a directory-only developer. Preserve it as its own
      // account (do NOT drop — that would lose the row). is_published carries.
      let uid = d.profile_id ?? undefined;
      if (uid && usedUserIds.has(uid)) uid = undefined;
      if (uid) usedUserIds.add(uid);
      const row = mapDeveloperToAccount(d, uid);
      row.slug = ensureUniqueSlug(d.slug || slugifyName(row.name));
      extraAccounts.push(row);
      createdFromDev++;
    } else {
      // >1 match -> genuine ambiguity (e.g. duplicate agency rows). Tim decides.
      ambiguous++;
      worksheet.push({
        orphan_slug: d.slug, orphan_name: d.name,
        matched: candidates.map((c) => c.name).join(" | "),
        decision: "REVIEW: multiple matches",
      });
    }
  }

  const finalAccounts = [...accountsByAgencyId.values(), ...extraAccounts];
  console.log(`\nPlanned: ${finalAccounts.length} accounts (${accountsByAgencyId.size} from agencies + ${extraAccounts.length} from directory-only developers)`);
  console.log(`  developers merged into an agency: ${merged} | created as own account: ${createdFromDev} | ambiguous(needs review): ${ambiguous}`);
  console.log(`  Published Developer accounts: ${finalAccounts.filter((r) => r.type === "Developer" && r.is_published).length}`);

  // Emit dedup worksheet for Tim.
  const csv = ["orphan_slug,orphan_name,matched,decision",
    ...worksheet.map((w) => [w.orphan_slug, w.orphan_name, w.matched, w.decision]
      .map((s) => `"${String(s ?? "").replace(/"/g, '""')}"`).join(","))].join("\n");
  const wsPath = "scratchpad/accounts-dedup-worksheet.csv";
  try { writeFileSync(wsPath, csv); console.log(`Worksheet -> ${wsPath}`); } catch { console.log("(could not write worksheet file)"); }

  if (!APPLY) {
    console.log("\nDRY RUN — nothing written. Re-run with --apply once the worksheet is reviewed.\n");
    return;
  }

  // Two-pass upsert so re-runs are idempotent on each row's stable legacy key.
  console.log("\nApplying...");
  const CHUNK = 200;
  const upsertBatch = async (rows, onConflict) => {
    for (let i = 0; i < rows.length; i += CHUNK) {
      const { error } = await supabase.from("accounts").upsert(rows.slice(i, i + CHUNK), { onConflict });
      if (error) { console.error(`Upsert error (${onConflict}):`, error.message); process.exit(1); }
    }
  };
  await upsertBatch([...accountsByAgencyId.values()], "legacy_agency_id");
  await upsertBatch(extraAccounts, "legacy_developer_id");
  console.log(`Done. Upserted ${finalAccounts.length} accounts.\n`);
}

main().catch((e) => { console.error(e); process.exit(1); });
