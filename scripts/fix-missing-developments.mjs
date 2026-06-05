/**
 * Close out the "missing developments" tail from the legacy enquiry import.
 *
 * Background:
 *   The earlier import-dashboard-data.mjs left 26 enquiries in
 *   developer_leads with source='legacy_enquiry_orphan' because their
 *   project names didn't match any development in our Supabase.
 *   Reassessment (today, against Tim's live admin) found 4 of them are
 *   real projects that exist on his site but never made it to our build:
 *
 *     - Veue, Norwest         (Tim id 175, type New Apartments)
 *       → Ban Laraghy is the listed owner per the May 29 spreadsheet
 *     - Arbour Park           (Tim id 43,  type Townhouses)         — owner unknown
 *     - No. 1 Studley Park    (Tim id 44,  type Townhouses)         — owner unknown
 *     - Auborn Lane           (Tim id 12,  type New Apartments)     — owner unknown
 *
 * This script:
 *   1. Inserts a skeleton development row for each missing project
 *      (name + type + slug, is_published=false so it doesn't show on
 *      the public site until Tim's full data export is imported)
 *   2. Links Ban Laraghy to Veue Norwest as owner_user_id (matches the
 *      spreadsheet's VEUE NORWEST listing)
 *   3. Reassigns any developer_leads orphan rows whose
 *      development_name matches one of these new projects to the
 *      corresponding `enquiries` table row, with the new development_id
 *
 * Run dry:
 *   node scripts/fix-missing-developments.mjs
 * Apply:
 *   node scripts/fix-missing-developments.mjs --apply
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

// Ban Laraghy's auth user id (matches np@c9d.sydney pattern — but Ban is
// ban@enigma.net.au per the May 29 spreadsheet). We'll look it up by email
// at runtime so the script doesn't carry a stale id.
const OWNER_LOOKUPS = {
  "ban@enigma.net.au": "Ban Laraghy",
};

const MISSING = [
  {
    name: "Veue, Norwest",
    slug: "veue-norwest",
    type: "New Apartments",
    ownerEmail: "ban@enigma.net.au",
    legacyNames: ["VEUE NORWEST", "Veue Norwest", "veue", "veue,norwest", "veue norwest"],
  },
  {
    name: "Arbour Park",
    slug: "arbour-park",
    type: "Townhouses",
    ownerEmail: null,
    legacyNames: ["Arbour Park", "arbour park"],
  },
  {
    name: "No. 1 Studley Park",
    slug: "no-1-studley-park",
    type: "Townhouses",
    ownerEmail: null,
    legacyNames: ["No. 1 Studley Park", "no. 1 studley park", "studley park"],
  },
  {
    name: "Auborn Lane",
    slug: "auborn-lane",
    type: "New Apartments",
    ownerEmail: null,
    legacyNames: ["Auborn Lane", "auborn lane"],
  },
];

async function lookupUserIdByEmail(email) {
  const PER_PAGE = 200;
  const needle = email.toLowerCase();
  for (let page = 1; page <= 25; page++) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: PER_PAGE });
    if (error) throw error;
    const hit = data.users.find((u) => u.email?.toLowerCase() === needle);
    if (hit) return hit.id;
    if (data.users.length < PER_PAGE) return null;
  }
  return null;
}

async function getExistingDevelopment(slug) {
  const { data } = await supabase
    .from("developments")
    .select("id, name, slug")
    .eq("slug", slug)
    .maybeSingle();
  return data;
}

async function findOrphanEnquiries(project) {
  // Orphan enquiries are stored in `developer_leads` with
  // source='legacy_enquiry_orphan' and development_name set to the
  // original (unmatched) project string. Match on any of the variants.
  const { data, error } = await supabase
    .from("developer_leads")
    .select("id, contact_name, email, phone, development_name, subject, created_at")
    .eq("source", "legacy_enquiry_orphan");
  if (error) throw error;
  return (data ?? []).filter((row) => {
    const hay = `${row.development_name ?? ""} ${row.subject ?? ""}`.toLowerCase();
    return project.legacyNames.some((variant) => hay.includes(variant.toLowerCase()));
  });
}

async function main() {
  console.log(`\n${APPLY ? "🚀 APPLYING" : "🔍 DRY RUN"}  —  fix missing developments\n`);

  // Resolve owner emails to user ids
  const ownerIds = {};
  for (const email of Object.keys(OWNER_LOOKUPS)) {
    const id = await lookupUserIdByEmail(email);
    ownerIds[email] = id;
    console.log(`  owner lookup: ${email.padEnd(30)} → ${id ?? "NOT FOUND"}`);
  }
  console.log();

  let totalCreated = 0;
  let totalReassigned = 0;
  let totalSkipped = 0;

  for (const project of MISSING) {
    console.log(`Project: ${project.name}  (${project.type})`);
    // 1. Existing?
    const existing = await getExistingDevelopment(project.slug);
    let devId;
    if (existing) {
      devId = existing.id;
      console.log(`  · already exists in Supabase (id=${existing.id.slice(0, 8)}…) — skipping insert`);
      totalSkipped++;
      // If we have an owner mapping, set owner_user_id on the existing row.
      // This handles cases like Veue Norwest where the fuzzy matcher in
      // link-members-to-listings.mjs missed the comma/case-difference match.
      if (project.ownerEmail) {
        const ownerId = ownerIds[project.ownerEmail];
        if (ownerId) {
          if (APPLY) {
            const { error } = await supabase
              .from("developments")
              .update({ owner_user_id: ownerId })
              .eq("id", existing.id);
            if (error) console.log(`     ↳ owner link failed: ${error.message}`);
            else console.log(`     ↳ linked owner ${project.ownerEmail}`);
          } else {
            console.log(`     ↳ would link owner ${project.ownerEmail}`);
          }
        }
      }
    } else if (APPLY) {
      const ownerId = project.ownerEmail ? ownerIds[project.ownerEmail] : null;
      const { data, error } = await supabase
        .from("developments")
        .insert({
          name: project.name,
          slug: project.slug,
          type: project.type,
          is_published: false,
          is_featured: false,
          owner_user_id: ownerId,
        })
        .select("id")
        .single();
      if (error) {
        console.log(`  · INSERT failed: ${error.message}`);
        continue;
      }
      devId = data.id;
      totalCreated++;
      console.log(`  · created (id=${devId.slice(0, 8)}…)${ownerId ? `, owner ${project.ownerEmail}` : ""}, is_published=false`);
    } else {
      const ownerId = project.ownerEmail ? ownerIds[project.ownerEmail] : null;
      console.log(`  · would create with type=${project.type}, owner=${ownerId ?? "(none)"}, is_published=false`);
      devId = "(would-be-id)";
    }

    // 2. Orphan enquiries
    const orphans = await findOrphanEnquiries(project);
    console.log(`  · ${orphans.length} orphan enquir${orphans.length === 1 ? "y" : "ies"} match this project`);

    if (!APPLY || !existing && devId === "(would-be-id)") {
      orphans.forEach((o) =>
        console.log(`     - ${(o.contact_name || "?").padEnd(20)} ${o.email}`),
      );
      if (!APPLY) continue;
    }

    if (APPLY && orphans.length > 0) {
      // Move each orphan from developer_leads to enquiries
      for (const o of orphans) {
        const { error: insertErr } = await supabase
          .from("enquiries")
          .insert({
            development_id: devId,
            full_name: o.contact_name || (o.email?.split("@")[0] ?? "Unknown"),
            email: o.email,
            mobile: o.phone,
            notes: o.subject ? `Migrated from orphan — ${o.subject}` : "Migrated from legacy orphan",
            status: "new",
            created_at: o.created_at,
          });
        if (insertErr) {
          console.log(`     - ${o.email}: insert failed: ${insertErr.message}`);
          continue;
        }
        const { error: delErr } = await supabase
          .from("developer_leads")
          .delete()
          .eq("id", o.id);
        if (delErr) {
          console.log(`     - ${o.email}: orphan delete failed: ${delErr.message}`);
          continue;
        }
        totalReassigned++;
      }
      console.log(`  · reassigned ${orphans.length} enquir${orphans.length === 1 ? "y" : "ies"} to this development`);
    }
    console.log();
  }

  console.log(`\nSummary:`);
  console.log(`  developments created      : ${APPLY ? totalCreated : "(dry-run)"}`);
  console.log(`  enquiries reassigned      : ${APPLY ? totalReassigned : "(dry-run)"}`);
  console.log(`  developments already there: ${totalSkipped}`);
  if (!APPLY) console.log(`\n(dry-run — re-run with --apply to commit)`);
}

main().catch((e) => { console.error("Fatal:", e); process.exit(1); });
