/**
 * One-off backfill: publish every hidden developer row.
 *
 * Migration created 37 developer rows but defaulted is_published=false.
 * Only 6 are currently public; 31 are hidden, holding 35 of the site's
 * 44 listings. The legacy site shows all of them. This brings the new
 * site in line. Tim can still Hide any individual row from
 * /admin/developers afterwards.
 *
 * Dry-run by default; pass --apply to write.
 */

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const apply = process.argv.includes("--apply");

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key, { auth: { persistSession: false } });

console.log(`mode: ${apply ? "APPLY" : "dry-run"}`);

const { data: hidden, error } = await supabase
  .from("developers")
  .select("id, name")
  .eq("is_published", false)
  // Skip the "Unknown Developer" placeholder — it's a migration catch-all
  // for listings without a real developer in the legacy data, and shouldn't
  // appear as a card on the public directory.
  .not("name", "ilike", "unknown%");

if (error) {
  console.error(error);
  process.exit(1);
}

console.log(`Hidden developers found: ${hidden.length}`);
hidden.forEach((d) => console.log(`  • ${d.name}`));

if (!apply) {
  console.log("\n(dry-run — pass --apply to commit)");
  process.exit(0);
}

const { error: updErr, count } = await supabase
  .from("developers")
  .update({ is_published: true }, { count: "exact" })
  .eq("is_published", false)
  .not("name", "ilike", "unknown%");

if (updErr) {
  console.error("update failed:", updErr);
  process.exit(1);
}
console.log(`\n✓ Published ${count} developer rows.`);
