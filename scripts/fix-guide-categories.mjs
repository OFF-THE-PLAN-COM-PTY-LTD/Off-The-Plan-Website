/**
 * One-off backfill: reclassify articles that should appear under /guides.
 *
 * Discovery: the legacy site (offtheplan.com.au) exposes 48 published guides
 * via its public API; our DB has all 48 articles by slug, but 32 of them
 * were imported with category = "News" only — so /guides only showed 16.
 * Tim's PDF feedback noted "Layout is different, no banner as well… ensure
 * actual individual guides pages are the same or similar to current site"
 * and Ched asked why /guides was sparse compared to legacy. This script
 * closes that gap.
 *
 * What it does:
 *   1. Pulls the full legacy guide slug list from the live legacy API.
 *   2. Looks up matching articles in our `journal_articles` table.
 *   3. For any article whose category is exactly "News", flips it to
 *      "Guide,News" — matching the existing migrated convention for
 *      cross-tagged articles. Articles already containing "Guide" are left
 *      alone.
 *   4. Dry-run by default. Pass --apply to write.
 *
 * Re-runnable: idempotent — re-running after a successful apply changes
 * nothing (it only matches articles still on plain "News").
 *
 * Run:
 *   node scripts/fix-guide-categories.mjs            # dry-run
 *   node scripts/fix-guide-categories.mjs --apply    # write
 *
 * Requires .env.local with NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY.
 */

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");

// ── env ──
const env = Object.fromEntries(
  fs
    .readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local");
  process.exit(1);
}
const supabase = createClient(url, key, { auth: { persistSession: false } });

// ── 1. Pull all legacy guide slugs from the live API ──
async function fetchLegacyGuideSlugs() {
  const slugs = new Set();
  const titles = new Map();
  // First page tells us the last page.
  const first = await fetch("https://offtheplan.com.au/api/news_and_events/get_all_data?page=1&page_type=guides", {
    headers: { Accept: "application/json" },
  }).then((r) => r.json());
  const lastPage = first.news_and_events?.last_page ?? 1;
  for (const a of first.news_and_events?.data ?? []) {
    slugs.add(a.slug);
    titles.set(a.slug, a.title);
  }
  for (let p = 2; p <= lastPage; p++) {
    const j = await fetch(`https://offtheplan.com.au/api/news_and_events/get_all_data?page=${p}&page_type=guides`, {
      headers: { Accept: "application/json" },
    }).then((r) => r.json());
    for (const a of j.news_and_events?.data ?? []) {
      slugs.add(a.slug);
      titles.set(a.slug, a.title);
    }
  }
  return { slugs, titles, lastPage };
}

// ── 2. Match against our DB ──
async function loadOurArticles() {
  const { data, error } = await supabase
    .from("journal_articles")
    .select("id, slug, category, title, is_published")
    .range(0, 999);
  if (error) throw error;
  return new Map((data ?? []).map((a) => [a.slug, a]));
}

// ── main ──
(async () => {
  console.log(`mode: ${apply ? "APPLY" : "dry-run"}`);
  const { slugs: legacy, lastPage } = await fetchLegacyGuideSlugs();
  console.log(`legacy guides discovered: ${legacy.size} across ${lastPage} pages`);

  const ours = await loadOurArticles();

  const toUpdate = [];
  const alreadyGuide = [];
  const missing = [];
  for (const slug of legacy) {
    const a = ours.get(slug);
    if (!a) {
      missing.push(slug);
      continue;
    }
    const cat = (a.category ?? "").trim();
    if (/guide/i.test(cat)) {
      alreadyGuide.push(a);
      continue;
    }
    if (cat === "News") {
      toUpdate.push(a);
    } else {
      // Unexpected category shape — log but don't touch.
      console.log(`  skip (unexpected category "${cat}"):`, slug);
    }
  }

  console.log(`already tagged with Guide: ${alreadyGuide.length}`);
  console.log(`missing from our DB:       ${missing.length}`);
  console.log(`will update News -> Guide,News: ${toUpdate.length}`);
  toUpdate.forEach((a) => console.log(`  • ${a.slug}`));

  if (!apply) {
    console.log("\n(dry-run — pass --apply to commit)");
    return;
  }

  let done = 0;
  for (const a of toUpdate) {
    const { error } = await supabase
      .from("journal_articles")
      .update({ category: "Guide,News" })
      .eq("id", a.id);
    if (error) {
      console.error(`  ✗ ${a.slug}: ${error.message}`);
    } else {
      done++;
    }
  }
  console.log(`\napplied: ${done}/${toUpdate.length}`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
