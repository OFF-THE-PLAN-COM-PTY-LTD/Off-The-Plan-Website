/**
 * One-off import of Tim's Blackbox dump (OTP_Data_Export_*.xlsx) into
 * the new Supabase schema. Brought over:
 *
 *   - Listing Analytics  → updates view_count / phone_click_count /
 *                          enquiry_count on developments (match by name)
 *   - Property Alerts    → circle_signups (source='legacy_import_2026_06_12')
 *   - Media Kit Enquiries → media_kit_enquiries (same source tag)
 *   - Leads              → developer_leads (same source tag)
 *
 * Disregarded per Tim's 14 Jun 2026 email:
 *   - Config Summaries  (legacy data, superseded by Phase 3 work)
 *   - Stocklist         (legacy data, only one row anyway)
 *
 * Usage:
 *   node scripts/import-legacy-data.mjs                # dry-run
 *   node scripts/import-legacy-data.mjs --apply        # write to Supabase
 *   node scripts/import-legacy-data.mjs --file=<path>  # override default xlsx
 *
 * Default file path resolves to:
 *   ../June 1 - 7 Client Feedback/OTP_Data_Export_2026-06-12.xlsx
 */

import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
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

const APPLY = process.argv.includes("--apply");
const fileArg = process.argv.find((a) => a.startsWith("--file="));
const DEFAULT_FILE = "../June 1 - 7 Client Feedback/OTP_Data_Export_2026-06-12.xlsx";
const filePath = resolve(process.cwd(), fileArg ? fileArg.slice("--file=".length) : DEFAULT_FILE);

const SOURCE_TAG = "legacy_import_2026_06_12";

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

console.log("──────────────────────────────────────────────────────");
console.log(`Mode:       ${APPLY ? "APPLY (writing to Supabase)" : "DRY-RUN (no writes)"}`);
console.log(`Source:     ${filePath}`);
console.log(`Source tag: ${SOURCE_TAG}`);
console.log("──────────────────────────────────────────────────────\n");

// ── Load workbook ─────────────────────────────────────────────────────
const wb = XLSX.read(readFileSync(filePath), { type: "buffer", cellDates: true });
const sheet = (name) => XLSX.utils.sheet_to_json(wb.Sheets[name], { defval: null });

const analyticsRows = sheet("Listing Analytics");
const alertRows    = sheet("Property Alerts");
const mediaRows    = sheet("Media Kit Enquiries");
const leadRows     = sheet("Leads");

console.log(`Rows loaded — analytics:${analyticsRows.length} alerts:${alertRows.length} media:${mediaRows.length} leads:${leadRows.length}\n`);

// ── Helpers ───────────────────────────────────────────────────────────
const toIso = (v) => {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? null : d.toISOString();
};
const norm = (s) => (s ?? "").toString().trim().toLowerCase();

// ── 1. Listing Analytics → developments ───────────────────────────────
async function importAnalytics() {
  const { data: devs, error } = await supabase.from("developments").select("id, name");
  if (error) throw error;
  const byName = new Map(devs.map((d) => [norm(d.name), d.id]));

  const matched = [];
  const unmatched = [];
  for (const row of analyticsRows) {
    const id = byName.get(norm(row.Project));
    if (!id) { unmatched.push(row.Project); continue; }
    matched.push({
      id,
      name: row.Project,
      view_count: Number(row["Total Views"] ?? 0) || 0,
      phone_click_count: Number(row["Agent/Phone Clicks"] ?? 0) || 0,
      enquiry_count: Number(row.Enquiries ?? 0) || 0,
    });
  }

  console.log(`[Analytics] matched ${matched.length} / ${analyticsRows.length}`);
  if (unmatched.length) console.log(`[Analytics] UNMATCHED (no listing with this name on the new site):\n  - ${unmatched.join("\n  - ")}`);

  if (!APPLY) return;

  for (const m of matched) {
    const { error: updErr } = await supabase
      .from("developments")
      .update({
        view_count: m.view_count,
        phone_click_count: m.phone_click_count,
        enquiry_count: m.enquiry_count,
      })
      .eq("id", m.id);
    if (updErr) console.error(`[Analytics] update failed for ${m.name}:`, updErr.message);
  }
  console.log(`[Analytics] ✅ wrote ${matched.length} updates`);
}

// ── 2. Property Alerts → circle_signups ──────────────────────────────
async function importPropertyAlerts() {
  const inserts = alertRows.map((r) => ({
    full_name: r.Name ?? null,
    email: r.Email ?? null,
    phone: r.Phone ?? null,
    state: r.State ?? null,
    postcode: r.Postcode != null ? String(r.Postcode) : null,
    project_name: r.Project ?? null,
    interest_type: r["Interested In"] ?? null,
    occupation: r.Occupation ?? null,
    hear_about_us: r["Hear About Us"] ?? null,
    message: r.Message ?? null,
    created_at: toIso(r["Created At"]) ?? toIso(r.Date),
    source: SOURCE_TAG,
  })).filter((r) => r.email);

  console.log(`[PropertyAlerts] prepared ${inserts.length} rows`);
  if (!APPLY) return;

  // UNIQUE(email) on circle_signups — onConflict skips duplicates.
  const { error: insErr, count } = await supabase
    .from("circle_signups")
    .upsert(inserts, { onConflict: "email", ignoreDuplicates: true, count: "exact" });
  if (insErr) console.error("[PropertyAlerts] upsert error:", insErr.message);
  else console.log(`[PropertyAlerts] ✅ wrote ${count ?? inserts.length} rows`);
}

// ── 3. Media Kit Enquiries → media_kit_enquiries ──────────────────────
async function importMediaKit() {
  const inserts = mediaRows.map((r) => ({
    full_name: r.Name ?? null,
    email: r.Email ?? null,
    phone: r.Phone ?? null,
    state: r.State ?? null,
    category: r["Interested In"] ?? null,
    created_at: toIso(r["Created At"]) ?? toIso(r.Date),
    source: SOURCE_TAG,
  })).filter((r) => r.email);

  console.log(`[MediaKit] prepared ${inserts.length} rows`);
  if (!APPLY) return;

  const { error: insErr, count } = await supabase
    .from("media_kit_enquiries")
    .insert(inserts, { count: "exact" });
  if (insErr) console.error("[MediaKit] insert error:", insErr.message);
  else console.log(`[MediaKit] ✅ wrote ${count ?? inserts.length} rows`);
}

// ── 4. Leads → developer_leads ────────────────────────────────────────
async function importLeads() {
  const inserts = leadRows.map((r) => ({
    contact_name: r.Name ?? "Unknown",
    email: r.Email ?? null,
    phone: r.Phone ?? null,
    suburb: null,
    state: r.State ?? null,
    development_name: r.Project ?? null,
    notes: r.Message ?? null,
    message: r.Message ?? null,
    source: SOURCE_TAG,
    created_at: toIso(r["Created At"]) ?? toIso(r.Date),
  })).filter((r) => r.email);

  console.log(`[Leads] prepared ${inserts.length} rows`);
  if (!APPLY) return;

  // Insert in chunks of 100 to be gentle on the API.
  const CHUNK = 100;
  let total = 0;
  for (let i = 0; i < inserts.length; i += CHUNK) {
    const slice = inserts.slice(i, i + CHUNK);
    const { error: insErr, count } = await supabase
      .from("developer_leads")
      .insert(slice, { count: "exact" });
    if (insErr) {
      console.error(`[Leads] chunk ${i / CHUNK} insert error:`, insErr.message);
      continue;
    }
    total += count ?? slice.length;
  }
  console.log(`[Leads] ✅ wrote ${total} rows`);
}

// ── Run ───────────────────────────────────────────────────────────────
try {
  await importAnalytics();
  console.log();
  await importPropertyAlerts();
  console.log();
  await importMediaKit();
  console.log();
  await importLeads();
  console.log();
  console.log("──────────────────────────────────────────────────────");
  console.log(APPLY ? "✅ Import complete." : "ℹ️  Dry-run complete. Re-run with --apply to write.");
  console.log("──────────────────────────────────────────────────────");
} catch (err) {
  console.error("Fatal:", err);
  process.exit(1);
}
