/**
 * Rehearsal helper: copy the tables needed to test the accounts merge from
 * PROD into the LOCAL Supabase, using service-role REST on both ends (no
 * Postgres password required). Row data is never printed — only counts — so
 * no PII lands in logs.
 *
 * Source  = .env.local (currently prod): NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY
 * Target  = local: DST_URL (default http://127.0.0.1:54321) + DST_KEY (local service_role)
 *
 * Local FKs to auth.users (profiles.id, developments.owner_user_id) must be
 * dropped first — see scripts/local-prep.sql — because we don't recreate
 * auth.users for the rehearsal.
 *
 *   DST_KEY=<local-service-role-key> node scripts/copy-prod-to-local.mjs
 */

import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const SRC_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SRC_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const DST_URL = process.env.DST_URL || "http://127.0.0.1:54321";
const DST_KEY = process.env.DST_KEY;

if (!SRC_URL || !SRC_KEY) { console.error("Missing source (prod) env in .env.local"); process.exit(1); }
if (!DST_KEY) { console.error("Missing DST_KEY (local service_role key). Get it from `supabase status`."); process.exit(1); }
if (SRC_URL === DST_URL) { console.error("SRC and DST are the same URL — refusing to run."); process.exit(1); }

const src = createClient(SRC_URL, SRC_KEY, { auth: { persistSession: false } });
const dst = createClient(DST_URL, DST_KEY, { auth: { persistSession: false } });

// Parents before children (FK order). profiles BEFORE developers (developers.profile_id).
const TABLES = [
  "agencies",
  "profiles",
  "developers",
  "developments",
  "development_images",
  "development_floor_plans",
  "listing_agents",
];

// The local schema (built from migrations) is missing some prod dashboard-only
// columns. Fetch the columns each local table actually has, so we can strip
// unknown keys from prod rows before insert.
async function localColumns() {
  const res = await fetch(`${DST_URL}/rest/v1/`, {
    headers: { apikey: DST_KEY, Authorization: `Bearer ${DST_KEY}` },
  });
  const spec = await res.json();
  const defs = spec.definitions || {};
  const map = {};
  for (const [t, d] of Object.entries(defs)) map[t] = new Set(Object.keys(d.properties || {}));
  return map;
}

async function readAll(table) {
  const rows = [];
  const PAGE = 1000;
  for (let from = 0; ; from += PAGE) {
    const { data, error } = await src.from(table).select("*").range(from, from + PAGE - 1);
    if (error) throw new Error(`read ${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE) break;
  }
  return rows;
}

async function writeAll(table, rows) {
  const CHUNK = 500;
  for (let i = 0; i < rows.length; i += CHUNK) {
    const { error } = await dst.from(table).upsert(rows.slice(i, i + CHUNK), { onConflict: "id" });
    if (error) throw new Error(`write ${table}: ${error.message}`);
  }
}

async function main() {
  console.log(`\nCopy PROD -> LOCAL\n  src: ${SRC_URL}\n  dst: ${DST_URL}\n`);
  const cols = await localColumns();
  for (const t of TABLES) {
    try {
      const rows = await readAll(t);
      // Strip prod-only columns the local schema doesn't have.
      const allowed = cols[t];
      const cleaned = allowed
        ? rows.map((r) => Object.fromEntries(Object.entries(r).filter(([k]) => allowed.has(k))))
        : rows;
      const dropped = allowed && rows[0]
        ? Object.keys(rows[0]).filter((k) => !allowed.has(k))
        : [];
      await writeAll(t, cleaned);
      console.log(`  ${t.padEnd(26)} ${rows.length} rows${dropped.length ? `  (stripped: ${dropped.join(", ")})` : ""}`);
    } catch (e) {
      console.error(`  ${t.padEnd(26)} FAILED: ${e.message}`);
    }
  }
  console.log("\nDone.\n");
}

main().catch((e) => { console.error(e); process.exit(1); });
