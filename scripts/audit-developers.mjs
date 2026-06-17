/**
 * Read-only diagnostic — dumps the current `developers` table and
 * cross-references each row's `name` against the canonical list of
 * project / development names from:
 *   - the Excel "Listing Analytics" sheet (42 known projects)
 *   - Off plan 2/<slug>/<slug>.json files (legacy scrape data)
 *
 * Output: scripts/audit-output/developers-audit.json with three buckets:
 *   - "definite_bad"   — name normalizes to an exact known-project name
 *   - "suspect"        — partial / substring match against a known project
 *   - "looks_legit"    — no match → likely a real developer company
 *
 * Run:
 *   node scripts/audit-developers.mjs
 *
 * No writes anywhere — share the output with Tim, get sign-off, then
 * delete the confirmed bad rows via SQL editor in a separate step.
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync, statSync, mkdirSync, writeFileSync, existsSync } from "node:fs";
import { resolve, join } from "node:path";
import { config as loadEnv } from "dotenv";
import * as XLSX from "xlsx";

loadEnv({ path: ".env.local" });
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// ── Load known project names ──────────────────────────────────────────
function loadProjectNames() {
  const names = new Set();

  // From the June 2026 Excel export.
  const xlsxPath = resolve(process.cwd(), "June 1 - 7 Client Feedback/OTP_Data_Export_2026-06-12.xlsx");
  if (existsSync(xlsxPath)) {
    const wb = XLSX.read(readFileSync(xlsxPath), { type: "buffer" });
    const rows = XLSX.utils.sheet_to_json(wb.Sheets["Listing Analytics"], { defval: null });
    for (const r of rows) if (r.Project) names.add(String(r.Project));
    console.log(`[audit] loaded ${rows.length} project names from Excel`);
  } else {
    console.log("[audit] Excel not found, skipping");
  }

  // From Off plan 2/<slug>/<slug>.json — legacy scrape data.
  const legacyRoot = resolve(process.cwd(), "Off plan 2/Off plan 2");
  if (existsSync(legacyRoot) && statSync(legacyRoot).isDirectory()) {
    let count = 0;
    for (const entry of readdirSync(legacyRoot)) {
      const sub = join(legacyRoot, entry);
      if (!statSync(sub).isDirectory()) continue;
      const jsonPath = join(sub, `${entry}.json`);
      if (!existsSync(jsonPath)) continue;
      try {
        const data = JSON.parse(readFileSync(jsonPath, "utf-8"));
        if (data?.name) {
          names.add(String(data.name));
          count++;
        }
      } catch {
        // Skip malformed
      }
    }
    console.log(`[audit] loaded ${count} project names from Off plan 2/`);
  } else {
    console.log("[audit] Off plan 2/ folder not found, skipping");
  }

  return [...names];
}

const norm = (s) => (s ?? "").toString().trim().toLowerCase().replace(/\s+/g, " ");

function classify(developerName, projectNames) {
  const dn = norm(developerName);
  if (!dn) return { bucket: "suspect", reason: "empty name" };

  // Exact (normalized) match → definite-bad.
  const exact = projectNames.find((p) => norm(p) === dn);
  if (exact) return { bucket: "definite_bad", reason: `exact match: "${exact}"` };

  // Substring matches — either direction. e.g. developer="Avra" vs project="AVRA Residences".
  const substringMatch = projectNames.find((p) => {
    const pn = norm(p);
    return pn.length >= 4 && (pn.includes(dn) || dn.includes(pn));
  });
  if (substringMatch) return { bucket: "suspect", reason: `partial match: "${substringMatch}"` };

  return { bucket: "looks_legit", reason: null };
}

// ── Run ───────────────────────────────────────────────────────────────
try {
  console.log("──────────────────────────────────────────────────────");
  console.log("Auditing developers table for project-name pollution");
  console.log("──────────────────────────────────────────────────────\n");

  const projectNames = loadProjectNames();
  if (projectNames.length === 0) {
    console.error("No project names loaded — cannot audit. Aborting.");
    process.exit(1);
  }
  console.log(`[audit] ${projectNames.length} unique project names loaded\n`);

  const { data: developers, error } = await supabase
    .from("developers")
    .select("id, slug, name, logo_url, is_published, created_at")
    .order("name");
  if (error) throw error;
  console.log(`[audit] ${developers.length} rows in developers table\n`);

  const buckets = { definite_bad: [], suspect: [], looks_legit: [] };
  for (const dev of developers) {
    const { bucket, reason } = classify(dev.name, projectNames);
    buckets[bucket].push({
      id: dev.id,
      slug: dev.slug,
      name: dev.name,
      logo_url: dev.logo_url,
      is_published: dev.is_published,
      created_at: dev.created_at,
      reason,
    });
  }

  // Print summary.
  console.log("──────────────────────────────────────────────────────");
  console.log(`Definite-bad (project names entered as developers): ${buckets.definite_bad.length}`);
  for (const d of buckets.definite_bad) {
    console.log(`  ✗ ${d.name.padEnd(38)} — ${d.reason}${d.is_published ? "  [PUBLISHED]" : ""}`);
  }
  console.log("");
  console.log(`Suspect (partial overlap — needs review):           ${buckets.suspect.length}`);
  for (const d of buckets.suspect) {
    console.log(`  ? ${d.name.padEnd(38)} — ${d.reason}${d.is_published ? "  [PUBLISHED]" : ""}`);
  }
  console.log("");
  console.log(`Looks legit (no match):                             ${buckets.looks_legit.length}`);
  for (const d of buckets.looks_legit) {
    console.log(`  ✓ ${d.name.padEnd(38)}${d.is_published ? "  [PUBLISHED]" : ""}`);
  }
  console.log("──────────────────────────────────────────────────────\n");

  // Write JSON report.
  const outDir = resolve(process.cwd(), "scripts/audit-output");
  mkdirSync(outDir, { recursive: true });
  const outPath = join(outDir, "developers-audit.json");
  writeFileSync(outPath, JSON.stringify({
    audited_at: new Date().toISOString(),
    project_names_checked_against: projectNames.length,
    developers_total: developers.length,
    buckets,
  }, null, 2));
  console.log(`Full report: ${outPath}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Share the 'definite_bad' list with Tim for sign-off.");
  console.log("  2. After confirmation, delete those rows via Supabase SQL editor:");
  console.log("       delete from developers where id in (<list>);");
  console.log("  3. developments.developer_id will auto-NULL via the existing FK behaviour.");
} catch (err) {
  console.error("Fatal:", err);
  process.exit(1);
}
