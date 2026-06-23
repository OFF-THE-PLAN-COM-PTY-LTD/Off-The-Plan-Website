// A "real" stocklist row has at least one cell with an integer id
// (id = null means the API returned the schema scaffold, not data).
import { readFileSync } from "node:fs";
const d = JSON.parse(readFileSync("scripts/data-import/otp-listings-full.json", "utf-8"));

function isRealRow(rowCells) {
  return Array.isArray(rowCells) && rowCells.some((c) => Number.isInteger(c.id));
}

const withReal = [];
const withoutReal = [];
let totalReal = 0;
for (const item of Object.values(d)) {
  const name = item.listing?.project_name || "(unnamed)";
  const rows = item.property_type?.optional_property || [];
  const real = rows.filter(isRealRow);
  if (real.length > 0) {
    withReal.push({ name, count: real.length });
    totalReal += real.length;
  } else {
    withoutReal.push(name);
  }
}

withReal.sort((a, b) => b.count - a.count);
console.log("Mini stocklist (REAL rows only):\n");
withReal.forEach((r) => console.log(`  ${String(r.count).padStart(3)} rows  — ${r.name}`));
console.log(`\n  TOTAL: ${withReal.length} listings with real stocklist data, ${totalReal} rows`);
console.log(`         ${withoutReal.length} listings have NO mini stocklist`);
console.log("\nListings WITHOUT mini stocklists:");
withoutReal.sort().forEach((n) => console.log("  -", n));

// Veue Norwest detail — verify it matches Tim's 18-row screenshot
const veue = Object.values(d).find((x) => /veue/i.test(x.listing?.project_name || ""));
const veueRows = (veue.property_type.optional_property || []).filter(isRealRow);
console.log(`\n— Veue Norwest sanity check —`);
console.log(`Real rows: ${veueRows.length}`);
console.log(`First 3 rows decoded (bed / bath / parking / size / price):`);
veueRows.slice(0, 3).forEach((row, i) => {
  const vals = {};
  for (const c of row) vals[c.pt_name] = c.value ?? "—";
  console.log(`  ${i + 1}.`, [
    vals["Number Of Bedrooms"],
    vals["Number Of Bathrooms"],
    vals["Parking Spaces"],
    vals["Total Apartment Size"],
    vals["Price From"],
  ].join(" | "));
});
