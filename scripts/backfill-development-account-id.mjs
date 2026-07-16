/**
 * Phase 3 data backfill: set developments.account_id from the accounts
 * crosswalk (legacy_developer_id / legacy_agency_id). Idempotent — only fills
 * rows where account_id is null. Never touches legacy developer_id/agency_id.
 *
 *   node scripts/backfill-development-account-id.mjs          # dry run
 *   node scripts/backfill-development-account-id.mjs --apply  # write
 *
 * Writes are ATTRIBUTED: each one lands in audit_log with
 * actor_hint = 'script:backfill-development-account-id', so a listing that
 * changed hands can be traced back to this run rather than to an anonymous
 * `service_role`. See docs/audit-log.md.
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { attributedWriter } from "./lib/attributed-write.mjs";
loadEnv({ path: ".env.local" });
loadEnv();

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});
const APPLY = process.argv.includes("--apply");

// Declare who is acting, once. Every write below goes through this.
const as = attributedWriter(supabase, "script:backfill-development-account-id");

async function loadAll(table, cols) {
  const rows = [];
  for (let from = 0; ; from += 1000) {
    const { data, error } = await supabase.from(table).select(cols).range(from, from + 999);
    if (error) throw new Error(`${table}: ${error.message}`);
    rows.push(...(data ?? []));
    if (!data || data.length < 1000) break;
  }
  return rows;
}

async function main() {
  console.log(`\nBackfill developments.account_id — ${APPLY ? "APPLY" : "DRY RUN"} — ${process.env.NEXT_PUBLIC_SUPABASE_URL}\n`);
  const accounts = await loadAll("accounts", "id, legacy_developer_id, legacy_agency_id");
  const byDev = new Map(), byAgency = new Map();
  for (const a of accounts) {
    if (a.legacy_developer_id) byDev.set(a.legacy_developer_id, a.id);
    if (a.legacy_agency_id) byAgency.set(a.legacy_agency_id, a.id);
  }
  const devs = await loadAll("developments", "id, developer_id, agency_id, account_id");

  let toUpdate = 0, unresolved = 0;
  for (const d of devs) {
    if (d.account_id) continue;
    const acct = (d.developer_id && byDev.get(d.developer_id)) || (d.agency_id && byAgency.get(d.agency_id)) || null;
    if (!acct) {
      if (d.developer_id || d.agency_id) unresolved++;
      continue;
    }
    toUpdate++;
    if (APPLY) {
      const { error } = await as.updateDevelopment(d.id, { account_id: acct });
      if (error) { console.error(`update ${d.id}: ${error.message}`); process.exit(1); }
    }
  }
  console.log(`developments: ${devs.length} | ${APPLY ? "updated" : "would update"}: ${toUpdate} | linked-but-unresolved: ${unresolved}`);
  console.log(APPLY ? "\nDone.\n" : "\nDRY RUN — nothing written.\n");
}
main().catch((e) => { console.error(e); process.exit(1); });
