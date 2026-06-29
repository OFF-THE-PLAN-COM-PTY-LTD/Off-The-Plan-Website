/**
 * Audit the current ads table against the legacy site's expected setup.
 * Legacy /ads_management_setup has 8 rows; we want to confirm we have
 * the same coverage and sizes.
 */

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const { data, count } = await supabase
  .from("ads")
  .select("page, position, ad_type, is_active, desktop_image_url, web_link", { count: "exact" })
  .order("page", { ascending: true })
  .order("position", { ascending: true });

console.log(`Total ad rows in database: ${count}`);
console.log("");
console.log("Page         Position    Active  Has image  Link");
console.log("-----------  ----------  ------  ---------  ----");
for (const ad of data ?? []) {
  console.log(
    `${(ad.page ?? "").padEnd(11)}  ${(ad.position ?? "").padEnd(10)}  ${(ad.is_active ? "✓" : "✗").padEnd(6)}  ${(ad.desktop_image_url ? "✓" : "✗").padEnd(9)}  ${ad.web_link ?? "(none)"}`,
  );
}

// Compare to legacy expected rows
const LEGACY = [
  { page: "home",      position: "bottom" },
  { page: "listings",  position: "middle" },
  { page: "resources", position: "right" },
  { page: "resources", position: "bottom" },
  { page: "news",      position: "right" },
  { page: "news",      position: "bottom" },
  { page: "guides",    position: "right" },
  { page: "guides",    position: "bottom" },
];

console.log("");
console.log("Coverage vs legacy (8 expected rows):");
const present = new Set((data ?? []).map((a) => `${a.page}|${a.position}`));
let missing = 0;
for (const exp of LEGACY) {
  const key = `${exp.page}|${exp.position}`;
  if (!present.has(key)) {
    console.log(`  MISSING: ${exp.page} / ${exp.position}`);
    missing++;
  }
}
if (!missing) console.log("  ✓ all 8 legacy positions are covered");
