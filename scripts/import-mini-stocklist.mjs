/**
 * Import the "mini stocklist" (a.k.a. "Properties Available" table) from
 * Tim's live admin scrape into our developments.mini_stocklist jsonb
 * column.
 *
 * Source data lives at scrape['<id>'].property_type.optional_property
 * — an array of rows, each row a 5-cell array of column objects keyed
 * by pt_name (Number Of Bedrooms / Number Of Bathrooms / Parking
 * Spaces / Total Apartment Size / Price From). A cell with id === null
 * is the empty schema scaffold and is filtered out.
 *
 * Behaviour: only fills rows where our column is currently empty
 * (default '[]') — never overwrites admin curation.
 *
 * Run dry:
 *   node scripts/import-mini-stocklist.mjs
 * Apply:
 *   node scripts/import-mini-stocklist.mjs --apply
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

/** Decode one row of pt_name cells into a {bed,bath,parking,size,price} object. */
function decodeRow(rowCells) {
  const get = (name) => {
    const c = rowCells.find((x) => x.pt_name === name);
    const v = c?.value;
    return v == null || String(v).trim() === "" ? null : String(v).trim();
  };
  return {
    bed:     get("Number Of Bedrooms"),
    bath:    get("Number Of Bathrooms"),
    parking: get("Parking Spaces"),
    size:    get("Total Apartment Size"),
    price:   get("Price From"),
  };
}

function isRealRow(rowCells) {
  return Array.isArray(rowCells) && rowCells.some((c) => Number.isInteger(c?.id));
}

const sourcePath = resolve(process.cwd(), "scripts/data-import/otp-listings-full.json");
const source = JSON.parse(readFileSync(sourcePath, "utf-8"));

async function main() {
  console.log(`\n${APPLY ? "🚀 APPLYING" : "🔍 DRY RUN"}  —  import mini stocklists\n`);

  const { data: vercelDevs, error: devsErr } = await supabase
    .from("developments")
    .select("id, name, slug, mini_stocklist");
  if (devsErr) throw devsErr;

  const stats = { matched: 0, skippedHasExisting: 0, notMatched: 0, rowsToWrite: 0, devsToWrite: 0 };
  const updates = [];
  const unmatched = [];

  for (const tid of Object.keys(source)) {
    const live = source[tid].listing;
    if (!live) continue;
    const rawRows = source[tid].property_type?.optional_property || [];
    const real = rawRows.filter(isRealRow);
    if (real.length === 0) continue;

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

    const existing = vercel.mini_stocklist;
    const hasExisting = Array.isArray(existing) && existing.length > 0;
    if (hasExisting) {
      stats.skippedHasExisting++;
      continue;
    }

    const decoded = real.slice(0, 20).map(decodeRow);
    stats.devsToWrite++;
    stats.rowsToWrite += decoded.length;
    updates.push({ id: vercel.id, name: vercel.name, rows: decoded });
  }

  console.log("Summary:");
  console.log(`  matched live listings:          ${stats.matched}`);
  console.log(`  skipped (already has stocklist):${stats.skippedHasExisting}`);
  console.log(`  unmatched (live → not Vercel):  ${stats.notMatched}`);
  console.log(`\n  developments to update:         ${stats.devsToWrite}`);
  console.log(`  total stocklist rows to write:  ${stats.rowsToWrite}`);

  if (unmatched.length) {
    console.log("\nUnmatched:");
    unmatched.forEach((u) => console.log("  ·", u.name));
  }

  if (!APPLY) {
    console.log("\n(dry-run — re-run with --apply to commit)");
    if (updates.length) {
      console.log("\nSample update —", updates[0].name);
      console.log(JSON.stringify(updates[0].rows, null, 2));
    }
    return;
  }

  let succeeded = 0;
  for (const u of updates) {
    const { error } = await supabase
      .from("developments")
      .update({ mini_stocklist: u.rows })
      .eq("id", u.id);
    if (error) console.error(`  ❌ ${u.name}: ${error.message}`);
    else succeeded++;
  }
  console.log(`\n✅ ${succeeded}/${updates.length} developments updated`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
