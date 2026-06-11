/**
 * Import the per-listing config summaries (beds / baths / garage / size /
 * price) from Tim's live admin scrape into our `development_floor_plans`
 * table.
 *
 * Tim refers to these as "config summaries" — the small table at the
 * bottom of each listing card on /search. Our previous
 * `import-listing-details.mjs` pass explicitly skipped this relational
 * data (see its top-comment); this script fills the gap.
 *
 * Behaviour:
 *   - Matches each live listing to a Vercel development by slug, then
 *     by case-insensitive name.
 *   - SKIPS any development that already has floor_plans rows on our
 *     side (curation safe — never overwrites admin-edited rows).
 *   - Inserts one row per live config, in source order.
 *
 * Price handling:
 *   live `price_from` is free text: "$660,000", "Contact Agent",
 *   "$605k to $710k", etc. We:
 *     - always store the raw string in `price_display` (new column,
 *       migration 028) so the card matches the live site exactly,
 *     - additionally store the parsed integer in `price_from` when the
 *       string contains a clean numeric (so search/sort still works).
 *
 * Run dry:
 *   node scripts/import-listing-configurations.mjs
 * Apply:
 *   node scripts/import-listing-configurations.mjs --apply
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

/** Parse a free-text price into integer dollars when it cleanly resolves to one. */
function parsePrice(raw) {
  if (raw == null) return null;
  const s = String(raw).trim();
  if (!s) return null;
  // Reject any string that looks like a range or contains letters other
  // than a trailing "k" / "m" abbreviation
  if (/to|–|—|\bcontact\b|\bview\b|\bsold\b|\bregister\b/i.test(s)) return null;
  // Single value: $660,000 / $660k / $1.2m
  const m = s.match(/\$?\s*([\d,.]+)\s*([km])?/i);
  if (!m) return null;
  const n = parseFloat(m[1].replace(/,/g, ""));
  if (!Number.isFinite(n)) return null;
  const suffix = (m[2] || "").toLowerCase();
  const value = suffix === "k" ? n * 1_000 : suffix === "m" ? n * 1_000_000 : n;
  return Math.round(value);
}

function parseInt0(v) {
  if (v == null) return null;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : null;
}

const sourcePath = resolve(process.cwd(), "scripts/data-import/otp-listings-full.json");
const source = JSON.parse(readFileSync(sourcePath, "utf-8"));

async function main() {
  console.log(`\n${APPLY ? "🚀 APPLYING" : "🔍 DRY RUN"}  —  import listing configurations\n`);

  // Load Vercel devs + their existing floor_plans counts in one pass
  const { data: vercelDevs, error: devsErr } = await supabase
    .from("developments")
    .select("id, name, slug");
  if (devsErr) throw devsErr;

  const { data: existingPlans, error: planErr } = await supabase
    .from("development_floor_plans")
    .select("development_id");
  if (planErr) throw planErr;

  const haveExisting = new Set(existingPlans.map((p) => p.development_id));

  const stats = {
    matched: 0,
    skippedHasExisting: 0,
    notMatched: 0,
    rowsToInsert: 0,
    devsToInsert: 0,
  };
  const inserts = [];
  const unmatched = [];

  for (const tid of Object.keys(source)) {
    const live = source[tid].listing;
    if (!live) continue;
    const configs = live.listing_configurations || [];
    if (configs.length === 0) continue;

    const liveSlug = (live.slug || "").trim().toLowerCase();
    const liveName = (live.project_name || "").trim().toLowerCase();
    let vercel = vercelDevs.find((d) => d.slug?.toLowerCase() === liveSlug && liveSlug);
    if (!vercel) vercel = vercelDevs.find((d) => d.name?.trim().toLowerCase() === liveName && liveName);

    if (!vercel) {
      unmatched.push({ tid, name: live.project_name });
      stats.notMatched++;
      continue;
    }
    stats.matched++;

    if (haveExisting.has(vercel.id)) {
      stats.skippedHasExisting++;
      continue;
    }

    stats.devsToInsert++;
    for (let i = 0; i < configs.length; i++) {
      const c = configs[i];
      const rawPrice = c.price_from;
      inserts.push({
        development_id: vercel.id,
        plan_type: null,
        config: null,
        beds: parseInt0(c.bed),
        bath: parseInt0(c.bath),
        garage: parseInt0(c.garage),
        internal_sqm: parseInt0(c.total_size),
        price_from: parsePrice(rawPrice),
        price_display: rawPrice ? String(rawPrice) : null,
        image_url: null,
      });
      stats.rowsToInsert++;
    }
  }

  console.log(`Match summary:`);
  console.log(`  matched live listings:          ${stats.matched}`);
  console.log(`  skipped (already has plans):    ${stats.skippedHasExisting}`);
  console.log(`  unmatched (live → not on Vercel): ${stats.notMatched}`);
  console.log(`\n  developments to receive plans:  ${stats.devsToInsert}`);
  console.log(`  total rows to insert:           ${stats.rowsToInsert}`);

  if (unmatched.length) {
    console.log(`\nUnmatched:`);
    unmatched.forEach((u) => console.log(`  · ${u.name}  (live id ${u.tid})`));
  }

  if (!APPLY) {
    console.log(`\n(dry-run — re-run with --apply to commit)`);
    if (inserts.length) {
      console.log(`\nSample insert:`);
      console.log(JSON.stringify(inserts[0], null, 2));
    }
    return;
  }

  // Insert in batches of 100
  let succeeded = 0;
  for (let i = 0; i < inserts.length; i += 100) {
    const batch = inserts.slice(i, i + 100);
    const { error } = await supabase.from("development_floor_plans").insert(batch);
    if (error) {
      console.error(`  ❌ batch starting ${i}: ${error.message}`);
    } else {
      succeeded += batch.length;
    }
  }
  console.log(`\n✅ ${succeeded}/${inserts.length} floor_plans rows inserted`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
