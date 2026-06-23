import { readFileSync } from "node:fs";
const d = JSON.parse(readFileSync("scripts/data-import/otp-listings-full.json", "utf-8"));
const withConfigs = [];
const withoutConfigs = [];
for (const item of Object.values(d)) {
  const name = item.listing?.project_name || "(unnamed)";
  const n = (item.listing?.listing_configurations || []).length;
  if (n > 0) withConfigs.push({ name, n });
  else withoutConfigs.push(name);
}
console.log("Total live listings:", withConfigs.length + withoutConfigs.length);
console.log("WITH config summaries:", withConfigs.length);
console.log("WITHOUT config summaries:", withoutConfigs.length);
console.log("\nListings with NO config rows on Tim's live admin:");
withoutConfigs.sort().forEach((n) => console.log("  -", n));
