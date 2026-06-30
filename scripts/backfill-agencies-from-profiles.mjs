/**
 * One-time backfill: for every profile with interest_type Developer/Agent
 * that does NOT have a matching agencies row (by email), create one.
 *
 * Dry-run: node scripts/backfill-agencies-from-profiles.mjs
 * Apply:   node scripts/backfill-agencies-from-profiles.mjs --apply
 */
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.local" });
loadEnv();

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!SUPABASE_URL || !SERVICE_KEY) {
  console.error("Missing env. Need NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY in .env.local.");
  process.exit(1);
}
const APPLY = process.argv.includes("--apply");
const supabase = createClient(SUPABASE_URL, SERVICE_KEY, { auth: { persistSession: false } });

async function main() {
  // Pull all Developer/Agent profiles with their auth email + status.
  const { data: profiles, error: pErr } = await supabase
    .from("profiles")
    .select("id, full_name, first_name, last_name, business_name, phone, interest_type, member_status")
    .in("interest_type", ["Developer", "Agent"]);
  if (pErr) throw pErr;

  // List all auth users in batches to map id -> email.
  const emailById = new Map();
  for (let page = 1; page <= 50; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    data.users.forEach((u) => emailById.set(u.id, (u.email || "").toLowerCase()));
    if (data.users.length < 200) break;
  }

  // For each profile, check if agencies row already exists by email.
  let created = 0, skipped = 0;
  for (const p of profiles ?? []) {
    const email = emailById.get(p.id);
    if (!email) { skipped++; continue; }

    const { data: existing } = await supabase
      .from("agencies").select("id").eq("email", email).maybeSingle();
    if (existing) { skipped++; continue; }

    const portalStatus =
      p.member_status === "approved" ? "active"
      : p.member_status === "rejected" ? "inactive"
      : "pending";

    console.log(`${APPLY ? "CREATE" : "WOULD CREATE"}  ${email.padEnd(45)} ${portalStatus}`);

    if (APPLY) {
      const { error } = await supabase.from("agencies").insert({
        name: p.full_name,
        first_name: p.first_name,
        last_name: p.last_name,
        email,
        org_name: p.business_name,
        mobile: p.phone,
        email_verified: p.member_status === "approved",
        portal_status: portalStatus,
      });
      if (error) console.error(`  FAILED: ${error.message}`);
      else created++;
    }
  }
  console.log(`\n${APPLY ? "Created" : "Would create"}: ${created}.  Skipped: ${skipped}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
