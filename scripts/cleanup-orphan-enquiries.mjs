/**
 * Cleanup pass over the 36 legacy_enquiry_orphan rows in developer_leads.
 *
 * After running import-dashboard-data.mjs, 36 enquiries from the live
 * site couldn't be matched to a development and were parked in
 * developer_leads with source='legacy_enquiry_orphan'. Looking at them:
 *
 *   ~11 are test data (Mayur Test, Support Test, "Test live", etc.)
 *   19 had no project name to match on (live site didn't capture it)
 *    7 reference "No. 1 Studley Park" — real-looking project, not in our DB
 *    3 reference "Arbour Park"        — real-looking project, not in our DB
 *    1 references "Auborn Lane"       — possibly a typo of "Auburn" something
 *
 * This script:
 *   - Deletes the clearly-test rows
 *   - Lists the remaining grouped by project name so you can ask Tim
 *     whether the missing projects should be added back
 *
 * Run dry-run:
 *   node scripts/cleanup-orphan-enquiries.mjs
 * Apply:
 *   node scripts/cleanup-orphan-enquiries.mjs --apply
 */

import { createClient } from "@supabase/supabase-js";
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

function isTestRow(row) {
  const haystack = [row.contact_name, row.development_name, row.subject]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  // Match obvious test markers — be conservative so we don't delete real rows
  return /\b(test live|test project|mayur test|support test)\b/.test(haystack);
}

async function main() {
  const { data: orphans, error } = await supabase
    .from("developer_leads")
    .select("id, contact_name, email, phone, development_name, subject")
    .eq("source", "legacy_enquiry_orphan");

  if (error) {
    console.error("Fetch failed:", error.message);
    process.exit(1);
  }

  console.log(`\n${APPLY ? "🚀 APPLYING" : "🔍 DRY RUN"}  —  ${orphans.length} orphan enquiries\n`);

  const testRows = orphans.filter(isTestRow);
  const remaining = orphans.filter((r) => !isTestRow(r));

  // Group remaining by project
  const grouped = {};
  for (const r of remaining) {
    const key = r.development_name || "(no project)";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(r);
  }

  console.log(`Test rows to delete: ${testRows.length}`);
  for (const r of testRows) {
    console.log(`  · ${r.contact_name?.padEnd(25)} | ${(r.development_name || "—").padEnd(25)}`);
  }

  console.log(`\nRemaining ${remaining.length} grouped by project:`);
  for (const [project, rows] of Object.entries(grouped).sort((a, b) => b[1].length - a[1].length)) {
    console.log(`  · ${project.padEnd(30)} ${rows.length} row${rows.length === 1 ? "" : "s"}`);
  }

  if (!APPLY) {
    console.log(`\n(dry-run — re-run with --apply to delete the ${testRows.length} test rows)`);
    return;
  }

  if (testRows.length > 0) {
    const ids = testRows.map((r) => r.id);
    const { error: delErr } = await supabase
      .from("developer_leads")
      .delete()
      .in("id", ids);
    if (delErr) {
      console.error("Delete failed:", delErr.message);
      process.exit(1);
    }
    console.log(`\n✅ Deleted ${testRows.length} test rows.`);
  }

  console.log(`\n${remaining.length} orphans remain. Most need either:`);
  console.log(`  – Tim to confirm the missing projects (No. 1 Studley Park, Arbour Park, Auborn Lane) should be added as developments`);
  console.log(`  – Or to dismiss them (the 19 with no project name can't be matched at all)`);
}

main().catch((e) => {
  console.error("Fatal:", e);
  process.exit(1);
});
