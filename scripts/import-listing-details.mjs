/**
 * Enrich our Supabase developments table with rich listing data scraped
 * from Tim's live admin.
 *
 * Source: scripts/data-import/otp-listings-full.json — produced by
 * POSTing to https://offtheplan.com.au/api/listing_details/get_listing_details
 * for each of the 48 real (non-archived, non-test) listings on Tim's
 * live site, using his authenticated session.
 *
 * What this script imports onto our developments table (only filling
 * EMPTY fields — never overwrites existing values to avoid undoing
 * curation already done on Vercel):
 *
 *   live field            → developments column
 *   ────────────────────────────────────────────────────────
 *   description           → description (plain) + description_html (wrapped)
 *   meta_description      → seo_description
 *   page_title            → seo_title
 *   list_price_from       → price_from  (integer cents/dollars)
 *   list_price_maximum    → search_price_max
 *   completion_date       → completion_quarter
 *   sale_suite_open_time  → display_suite_timing
 *   suburb                → suburb
 *   state                 → state
 *   video_url             → video_url
 *   promotional_flag      → tag
 *   bedroom_range         → (parsed → beds_min / beds_max if recognisable)
 *   listing_facility[]    → features (array of facility_name strings)
 *
 * NOT imported by this pass (separate work, more relational complexity):
 *   - listing_configurations → development_floor_plans
 *   - listing_agents         → listing_agents
 *   - listing_asset          → development_images (URLs would need
 *                                  re-uploading to our own storage)
 *
 * Run dry:
 *   node scripts/import-listing-details.mjs
 * Apply:
 *   node scripts/import-listing-details.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env vars");
  process.exit(1);
}
const APPLY = process.argv.includes("--apply");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ──────────────────────────────────────────────────────────────────────
// Helpers
// ──────────────────────────────────────────────────────────────────────

/** Plain text → minimal HTML so it renders in the listing detail page. */
function wrapAsHtml(raw) {
  if (!raw) return null;
  if (/<(p|div|br|ul|ol|h[1-6])\b/i.test(raw)) return raw;
  return raw
    .split(/\n{2,}/)
    .map((block) => `<p>${block.replace(/\n/g, "<br>")}</p>`)
    .filter((p) => p !== "<p></p>")
    .join("");
}

/** Parse a "2, 3 & 4 Bedrooms" string into beds_min / beds_max. */
function parseBedroomRange(range) {
  if (!range) return { min: null, max: null };
  const nums = (range.match(/\d+/g) || []).map(Number).filter((n) => n > 0 && n < 20);
  if (nums.length === 0) return { min: null, max: null };
  return { min: Math.min(...nums), max: Math.max(...nums) };
}

/** Strip HTML for plain-text mirror. */
function htmlToPlain(html) {
  if (!html) return null;
  return html
    .replace(/<br\s*\/?>(\r\n|\n)?/gi, "\n")
    .replace(/<\/p>\s*<p[^>]*>/gi, "\n\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .trim();
}

/** Returns true when our Vercel column is effectively empty. */
function isEmpty(v) {
  if (v === null || v === undefined) return true;
  if (typeof v === "string" && v.trim().length === 0) return true;
  if (Array.isArray(v) && v.length === 0) return true;
  return false;
}

// ──────────────────────────────────────────────────────────────────────
// Driver
// ──────────────────────────────────────────────────────────────────────

const sourcePath = resolve(process.cwd(), "scripts/data-import/otp-listings-full.json");
const source = JSON.parse(readFileSync(sourcePath, "utf-8"));

async function main() {
  console.log(`\n${APPLY ? "🚀 APPLYING" : "🔍 DRY RUN"}  —  enrich developments from live admin\n`);

  // Load all Vercel developments once
  const { data: vercelDevs, error: devsErr } = await supabase
    .from("developments")
    .select("id, name, slug, description, description_html, summary, seo_title, seo_description, price_from, search_price_max, completion_quarter, display_suite_timing, suburb, state, video_url, tag, beds_min, beds_max, features");
  if (devsErr) throw devsErr;
  console.log(`  loaded ${vercelDevs.length} developments from Vercel\n`);

  const stats = {
    matchedBySlug: 0,
    matchedByName: 0,
    notMatched: 0,
    rowsUpdated: 0,
    totalFieldsFilled: 0,
    fieldFills: {},
  };

  const updates = [];
  const unmatched = [];

  for (const tid of Object.keys(source)) {
    const live = source[tid].listing;
    if (!live) continue;

    // Match by slug first, then by name (case-insensitive)
    const liveSlug = (live.slug || "").trim().toLowerCase();
    const liveName = (live.project_name || "").trim().toLowerCase();
    let vercel = vercelDevs.find((d) => d.slug?.toLowerCase() === liveSlug && liveSlug);
    if (vercel) stats.matchedBySlug++;
    else {
      vercel = vercelDevs.find((d) => d.name?.trim().toLowerCase() === liveName && liveName);
      if (vercel) stats.matchedByName++;
    }

    if (!vercel) {
      unmatched.push({ tid, name: live.project_name });
      stats.notMatched++;
      continue;
    }

    // Build a patch with only the empty-field fills
    const patch = {};

    if (isEmpty(vercel.description_html) && live.description) {
      patch.description_html = wrapAsHtml(live.description);
    }
    if (isEmpty(vercel.description) && live.description) {
      patch.description = htmlToPlain(wrapAsHtml(live.description)) || live.description;
    }
    if (isEmpty(vercel.summary) && live.description) {
      // Use first ~280 chars of description as summary if Vercel has nothing
      patch.summary = (htmlToPlain(wrapAsHtml(live.description)) || live.description).slice(0, 280);
    }
    if (isEmpty(vercel.seo_description) && live.meta_description) {
      patch.seo_description = live.meta_description;
    }
    if (isEmpty(vercel.seo_title) && live.page_title) {
      patch.seo_title = live.page_title.slice(0, 160);
    }
    if (isEmpty(vercel.price_from) && live.list_price_from) {
      patch.price_from = Number(live.list_price_from) || null;
    }
    if (isEmpty(vercel.search_price_max) && live.list_price_maximum) {
      patch.search_price_max = Number(live.list_price_maximum) || null;
    }
    if (isEmpty(vercel.completion_quarter) && live.completion_date) {
      patch.completion_quarter = String(live.completion_date).slice(0, 80);
    }
    if (isEmpty(vercel.display_suite_timing) && live.sale_suite_open_time) {
      patch.display_suite_timing = live.sale_suite_open_time;
    }
    if (isEmpty(vercel.suburb) && live.suburb) {
      patch.suburb = live.suburb;
    }
    if (isEmpty(vercel.state) && live.state) {
      patch.state = live.state;
    }
    if (isEmpty(vercel.video_url) && live.video_url) {
      patch.video_url = live.video_url;
    }
    if (isEmpty(vercel.tag) && live.promotional_flag) {
      patch.tag = String(live.promotional_flag).slice(0, 80);
    }

    // Beds: only fill if Vercel has nothing
    if (isEmpty(vercel.beds_min) && isEmpty(vercel.beds_max)) {
      const beds = parseBedroomRange(live.bedroom_range);
      if (beds.min !== null) patch.beds_min = beds.min;
      if (beds.max !== null) patch.beds_max = beds.max;
    }

    // Features: only fill if Vercel has nothing
    if (isEmpty(vercel.features)) {
      const facilities = (live.listing_facility || []).map((f) => f.facility_name).filter(Boolean);
      if (facilities.length > 0) patch.features = facilities;
    }

    if (Object.keys(patch).length === 0) continue;

    // Track stats
    for (const k of Object.keys(patch)) stats.fieldFills[k] = (stats.fieldFills[k] || 0) + 1;
    stats.totalFieldsFilled += Object.keys(patch).length;

    updates.push({ id: vercel.id, name: vercel.name, patch });
  }

  console.log(`Match summary:`);
  console.log(`  matched by slug:  ${stats.matchedBySlug}`);
  console.log(`  matched by name:  ${stats.matchedByName}`);
  console.log(`  unmatched:        ${stats.notMatched}`);

  if (unmatched.length > 0) {
    console.log(`\nUnmatched (live → not in our DB):`);
    unmatched.forEach((u) => console.log(`  · ${u.name}  (live id ${u.tid})`));
  }

  console.log(`\n${updates.length} development${updates.length === 1 ? "" : "s"} will receive updates`);
  console.log(`${stats.totalFieldsFilled} field-fills total. Breakdown by field:`);
  for (const [field, count] of Object.entries(stats.fieldFills).sort((a, b) => b[1] - a[1])) {
    console.log(`  ${field.padEnd(22)} ${count}`);
  }

  if (!APPLY) {
    console.log(`\n(dry-run — re-run with --apply to commit)`);
    if (updates.length) {
      console.log(`\nSample update (${updates[0].name}):`);
      const sample = { ...updates[0].patch };
      // Truncate long strings so the dry-run output stays readable
      for (const k of Object.keys(sample)) {
        if (typeof sample[k] === "string" && sample[k].length > 120) {
          sample[k] = sample[k].slice(0, 120) + "…[truncated]";
        }
      }
      console.log(JSON.stringify(sample, null, 2));
    }
    return;
  }

  let succeeded = 0;
  let failed = 0;
  for (const u of updates) {
    const { error } = await supabase
      .from("developments")
      .update(u.patch)
      .eq("id", u.id);
    if (error) {
      console.error(`  ❌ ${u.name}: ${error.message}`);
      failed++;
    } else {
      succeeded++;
    }
  }
  console.log(`\n✅ ${succeeded}/${updates.length} developments updated${failed ? `, ❌ ${failed} failed` : ""}`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
