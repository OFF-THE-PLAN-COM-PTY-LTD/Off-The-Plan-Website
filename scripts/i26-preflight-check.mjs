/**
 * I26 pre-flight: read-only check that production is in a clean state
 * before we create the test Meridian Living developer + Azure Beachfront
 * Residences listing.
 *
 * Looks for:
 *   1. Any developer rows where slug or name suggests prior test attempts
 *   2. Any development rows where slug or name suggests prior test attempts
 *   3. Any Supabase auth user with the test email
 *   4. Any profile linked to that auth user
 *
 * THIS SCRIPT WRITES NOTHING. Pure SELECT only. Safe to run any time.
 */

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8")
    .split("\n")
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")];
    }),
);
const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false },
});

const TEST_EMAIL = "ched+meridian@meetapex.ai";

console.log("─── I26 pre-flight (read-only) ───\n");

// 1. Developer rows
console.log("1. Developers table — anything matching 'meridian' or test-y slugs:");
const { data: devs } = await supabase
  .from("developers")
  .select("id, slug, name, is_published, profile_id, created_at")
  .or("slug.ilike.%meridian%,name.ilike.%meridian%,slug.ilike.%azure%");
if (!devs?.length) {
  console.log("   ✓ none — clean.");
} else {
  for (const d of devs) {
    console.log(`   ⚠ ${d.name} (slug: ${d.slug}, published: ${d.is_published}, profile_id: ${d.profile_id ?? "—"})`);
  }
}

// 2. Development rows
console.log("\n2. Developments table — anything matching 'azure' or 'meridian':");
const { data: developments } = await supabase
  .from("developments")
  .select("id, slug, name, is_published, owner_user_id, created_at")
  .or("slug.ilike.%azure%,slug.ilike.%meridian%,name.ilike.%azure%,name.ilike.%meridian%");
if (!developments?.length) {
  console.log("   ✓ none — clean.");
} else {
  for (const d of developments) {
    console.log(`   ⚠ ${d.name} (slug: ${d.slug}, published: ${d.is_published}, owner: ${d.owner_user_id ?? "—"})`);
  }
}

// 3. Auth user with the test email
console.log(`\n3. Auth users — anything matching ${TEST_EMAIL}:`);
const { data: usersResp } = await supabase.auth.admin.listUsers({ page: 1, perPage: 200 });
const authMatches = (usersResp?.users ?? []).filter((u) =>
  (u.email ?? "").toLowerCase() === TEST_EMAIL.toLowerCase(),
);
if (!authMatches.length) {
  console.log("   ✓ none — clean.");
} else {
  for (const u of authMatches) {
    console.log(`   ⚠ ${u.email} (id: ${u.id}, created: ${u.created_at})`);
  }
}

// 4. Profile row linked to that auth user
console.log(`\n4. Profiles table — any row linked to the test auth user:`);
if (!authMatches.length) {
  console.log("   (skipped — no auth user)");
} else {
  const { data: profs } = await supabase
    .from("profiles")
    .select("id, full_name, business_name, interest_type")
    .in("id", authMatches.map((u) => u.id));
  if (!profs?.length) {
    console.log("   ✓ none — clean.");
  } else {
    for (const p of profs) {
      console.log(`   ⚠ ${p.full_name ?? "(no name)"} — ${p.business_name ?? "—"} (interest: ${p.interest_type ?? "—"})`);
    }
  }
}

console.log("\n─── Done. Nothing was modified. ───");
