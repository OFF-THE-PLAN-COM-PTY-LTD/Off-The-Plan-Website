/**
 * Link the 24 imported members to their listings via developments.owner_user_id.
 *
 * Inputs (hardcoded from Tim's May 29 spreadsheet):
 *   - Each member's login email (matches an auth.users row created by
 *     import-members.mjs)
 *   - Their list of project names (comma-separated in the spreadsheet)
 *
 * For each member:
 *   1. Resolve their email to an auth.users.id (paged listUsers, cached)
 *   2. For each project name they own, fuzzy-match against
 *      developments.name using the same pickBestMatch() ladder as
 *      import-dashboard-data.mjs (exact → starts-with → contains)
 *   3. UPDATE developments SET owner_user_id = <member.id> WHERE id = <dev.id>
 *
 * Outputs a structured report:
 *   linked        — successful (member, project, development.id)
 *   already_owned — development already had a different owner_user_id (logged but overwritten)
 *   ambiguous     — project name matched 2+ developments — skipped, needs manual review
 *   unmatched     — project name didn't match any development
 *
 * Run:
 *   node scripts/link-members-to-listings.mjs            # dry run
 *   node scripts/link-members-to-listings.mjs --apply    # commit
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

// Same MEMBERS list as import-members.mjs but with projects parsed.
// loginEmail (or email) is what we look up in auth.users.
const MEMBERS = [
  { name: "PRD Real Estate Perth",   email: "kristie@perth.prd.com.au",             projects: ["RIVA COMO", "PERTH HUB"] },
  { name: "Amanda Panetta",          email: "apanetta@creatadbyclutch.com.au",      projects: ["MARGAUX", "AVRA"] },
  { name: "Amy Crellin",             email: "admin@boutiquepropertyandadvisory.com",projects: ["SERAI", "HARBOUR"] },
  { name: "Ban Laraghy",             email: "ban@enigma.net.au",                    projects: ["VEUE NORWEST"] },
  { name: "Casey Woods",             email: "cwoods@pezetmatheson.com",             projects: ["AYRE", "GREENWICH", "RADIA", "BELLA VIE", "LAGOON"] },
  { name: "Cedar Woods",             email: "rebecca@tomorrowagency.com.au",        projects: ["ST ALBANS"] },
  { name: "Century21 Classic",       email: "jack.pillari@century21.com.au",        projects: ["ROYALE RANDWICK TERRACES"] },
  { name: "Coronation Property",     email: "sales@coronation.com.au",              projects: ["MASON & MAIN", "ASHBURY TERRACES"] },
  { name: "Emily Zhu",               email: "emily@laver.com.au",                   projects: ["NAUTIQUE", "CANOPY", "HALSTON"] },
  { name: "Eton Property",           email: "kate@etonproperty.com.au",             projects: ["OVATION"] },
  { name: "Fiducia Property",        email: "jaymie@highlandproperty.com.au",       projects: ["CALLISTA"] },
  { name: "Henry Chau",              email: "henry@builtformcapital.com.au",        projects: ["8 ROBINSON AVE - STORAGE", "8 ROBINSON AVE - SHOWROOM"] },
  { name: "Joanne Cox",              email: "joanne@flagshipgroup.com.au",          projects: ["PENNY PLACE"] },
  { name: "Lou Chisolm",             email: "LouChisolm@mcgrath.com.au",            projects: ["DARA BLACKTOWN", "YARRABEE KATOOMBA"] },
  { name: "Marie Stokes",            email: "Marie@edgevl.com.au",                  projects: ["LUMIERE"] },
  { name: "Michael Downs",           email: "michael@incagroup.com.au",             projects: ["ELLIS RESIDENCES", "QUARRY BUSINESS PARK"] },
  { name: "Nathan Pirrottina",       email: "np@c9d.sydney",                        projects: ["FLORIAN", "SOLMARE"] },
  { name: "Puja Khanna",             email: "puja.k@ellipseproperty.com.au",        projects: ["CARRINGTON PLACE"] },
  { name: "Sam Elbanna",             email: "salbanna@cpmrealty.com.au",            projects: ["AVENUE"] },
  { name: "Sandra Zhong",            email: "sandra.zhong@ceerose.com.au",          projects: ["ALEX COLLECTIVE"] },
  { name: "Sarah Luedecke",          email: "projects.nsw@raywhite.com",            projects: ["ADORN"] },
  { name: "Sienna Russo",            email: "sienna@studiocavar.com.au",            projects: ["COATE AVENUE", "NAPIER 235"] },
  { name: "Steven Stamateris",       email: "steven@masscon.com.au",                projects: ["FLORENCE & CAPRI", "HORIZON"] },
  { name: "Yue Sun",                 email: "yue.sun@positiveinvest.com",           projects: ["KEW TALLAWONG"] },
];

/**
 * Try to find a single best matching development for a project name.
 * Returns {match} for unique match, {ambiguous: [...]} when multiple
 * candidates are equally good, or null when nothing matches.
 */
function findDevelopment(devs, projectName) {
  const q = projectName.trim().toLowerCase();
  if (!q) return null;

  // 1. Exact case-insensitive match
  let hits = devs.filter((d) => d.name?.toLowerCase() === q);
  if (hits.length === 1) return { match: hits[0], how: "exact" };
  if (hits.length > 1)  return { ambiguous: hits, how: "exact-multiple" };

  // 2. Dev name starts with query (spreadsheet often has the prefix only,
  //    e.g. "AYRE" → "Ayre Palm Beach")
  hits = devs.filter((d) => d.name?.toLowerCase().startsWith(q + " ") || d.name?.toLowerCase().startsWith(q + ","));
  if (hits.length === 1) return { match: hits[0], how: "starts-with" };
  if (hits.length > 1)  return { ambiguous: hits, how: "starts-with-multiple" };

  // 3. Dev name contains query as a whole word
  hits = devs.filter((d) => {
    const dn = d.name?.toLowerCase() ?? "";
    return new RegExp(`\\b${q.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(dn);
  });
  if (hits.length === 1) return { match: hits[0], how: "contains" };
  if (hits.length > 1)  return { ambiguous: hits, how: "contains-multiple" };

  // 4. Query contains the dev name (rare reverse case)
  hits = devs.filter((d) => d.name && q.includes(d.name.toLowerCase()));
  if (hits.length === 1) return { match: hits[0], how: "reverse-contains" };
  if (hits.length > 1)  return { ambiguous: hits, how: "reverse-contains-multiple" };

  return null;
}

async function loadUserIdMap() {
  const map = new Map();
  const PER_PAGE = 200;
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw error;
    for (const u of data.users) {
      if (u.email) map.set(u.email.toLowerCase(), u.id);
    }
    if (data.users.length < PER_PAGE) break;
  }
  return map;
}

async function main() {
  console.log(`\n${APPLY ? "🚀 APPLYING" : "🔍 DRY RUN"}  —  link members to listings\n`);

  const { data: devs, error: devErr } = await supabase
    .from("developments")
    .select("id, name, owner_user_id");
  if (devErr) throw devErr;
  console.log(`  loaded ${devs.length} developments`);

  const userMap = await loadUserIdMap();
  console.log(`  loaded ${userMap.size} auth users\n`);

  const linked = [];
  const reassigned = []; // dev already had a different owner — we override
  const ambiguous = [];
  const unmatched = [];
  const memberMissing = [];

  for (const m of MEMBERS) {
    const userId = userMap.get(m.email.toLowerCase());
    if (!userId) {
      memberMissing.push({ name: m.name, email: m.email });
      console.log(`  ⚠️  ${m.name.padEnd(28)} — no auth user found for ${m.email}`);
      continue;
    }
    for (const proj of m.projects) {
      const result = findDevelopment(devs, proj);
      if (!result) {
        unmatched.push({ member: m.name, project: proj });
        continue;
      }
      if (result.ambiguous) {
        ambiguous.push({
          member: m.name,
          project: proj,
          candidates: result.ambiguous.map((d) => d.name),
        });
        continue;
      }
      const dev = result.match;
      if (dev.owner_user_id && dev.owner_user_id !== userId) {
        reassigned.push({ member: m.name, project: proj, devName: dev.name, devId: dev.id, prevOwner: dev.owner_user_id, newOwner: userId, how: result.how });
      } else {
        linked.push({ member: m.name, project: proj, devName: dev.name, devId: dev.id, ownerId: userId, how: result.how });
      }
    }
  }

  const allUpdates = [...linked, ...reassigned];

  console.log(`\nplanned updates:`);
  console.log(`  linked (new ownership)      : ${linked.length}`);
  console.log(`  reassigned (owner changed)  : ${reassigned.length}`);
  console.log(`  ambiguous (skip, manual)    : ${ambiguous.length}`);
  console.log(`  unmatched (no DB match)     : ${unmatched.length}`);
  console.log(`  members missing auth user   : ${memberMissing.length}`);

  if (ambiguous.length > 0) {
    console.log(`\n⚠️  Ambiguous matches — these need manual decisions:`);
    ambiguous.forEach((a) =>
      console.log(`     ${a.member.padEnd(25)} → "${a.project}" matches: ${a.candidates.join(", ")}`),
    );
  }

  if (unmatched.length > 0) {
    console.log(`\n❓ Unmatched projects — these have no equivalent in the DB:`);
    unmatched.forEach((u) =>
      console.log(`     ${u.member.padEnd(25)} → "${u.project}"`),
    );
  }

  if (!APPLY) {
    console.log(`\n(dry-run — ${allUpdates.length} updates would be applied; re-run with --apply to commit)`);
    return;
  }

  let succeeded = 0;
  let failed = 0;
  for (const u of allUpdates) {
    const { error } = await supabase
      .from("developments")
      .update({ owner_user_id: u.ownerId ?? u.newOwner })
      .eq("id", u.devId);
    if (error) {
      console.error(`  ❌ ${u.devName}: ${error.message}`);
      failed++;
    } else {
      succeeded++;
    }
  }
  console.log(`\n✅ ${succeeded}/${allUpdates.length} updated${failed ? `, ❌ ${failed} failed` : ""}`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
