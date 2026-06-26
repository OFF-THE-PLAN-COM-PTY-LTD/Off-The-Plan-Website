/**
 * One-off diagnostic: figure out why /developers shows only 6 cards
 * when admin shows ~14+ rows and the site has 40+ listings.
 *
 * Checks:
 *   1. How many developers are published vs hidden vs total
 *   2. How the public anon key sees the table (RLS) vs the service role
 *   3. How many developments have a developer_id vs NULL
 *   4. Distribution of developments per developer (top 10)
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
const url = env.NEXT_PUBLIC_SUPABASE_URL;
const anon = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const service = env.SUPABASE_SERVICE_ROLE_KEY;

const pub = createClient(url, anon, { auth: { persistSession: false } });
const adm = createClient(url, service, { auth: { persistSession: false } });

console.log("=== 1. Developers table — service role view ===");
const { data: allAdm, count: allCount } = await adm
  .from("developers")
  .select("id, name, is_published, profile_id", { count: "exact" });
console.log(`Total rows: ${allCount}`);
const pubAdm = allAdm.filter((d) => d.is_published);
const hidAdm = allAdm.filter((d) => !d.is_published);
console.log(`Published: ${pubAdm.length}, Hidden: ${hidAdm.length}`);
console.log(`Published list:`);
pubAdm.forEach((d) => console.log(`  • ${d.name}  ${d.profile_id ? "(linked)" : ""}`));

console.log("\n=== 2. Developers table — anon (public) view ===");
const { data: anonRows, count: anonCount, error: anonErr } = await pub
  .from("developers")
  .select("id, name, is_published", { count: "exact" })
  .eq("is_published", true);
if (anonErr) console.error("anon error:", anonErr);
console.log(`Anon sees ${anonCount} published rows.`);
if (anonRows) anonRows.forEach((d) => console.log(`  • ${d.name}`));

console.log("\n=== 3. Developments table — developer_id coverage ===");
const { count: totalDevs } = await adm.from("developments").select("id", { count: "exact", head: true });
const { count: pubDevs } = await adm.from("developments").select("id", { count: "exact", head: true }).eq("is_published", true);
const { count: withDevId } = await adm.from("developments").select("id", { count: "exact", head: true }).eq("is_published", true).not("developer_id", "is", null);
const { count: noDevId } = await adm.from("developments").select("id", { count: "exact", head: true }).eq("is_published", true).is("developer_id", null);
console.log(`Total developments: ${totalDevs}`);
console.log(`Published: ${pubDevs}`);
console.log(`Published WITH developer_id: ${withDevId}`);
console.log(`Published WITHOUT developer_id: ${noDevId}`);

console.log("\n=== 4. Distribution of published listings per developer (top 15) ===");
const { data: links } = await adm
  .from("developments")
  .select("developer_id, name, slug, is_published")
  .eq("is_published", true)
  .limit(500);
const byDev = new Map();
for (const r of links) {
  const k = r.developer_id ?? "(none)";
  if (!byDev.has(k)) byDev.set(k, []);
  byDev.get(k).push(r.name);
}
const sorted = [...byDev.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [id, names] of sorted.slice(0, 15)) {
  const devName = allAdm.find((d) => d.id === id)?.name ?? "(no developer linked)";
  console.log(`  ${names.length.toString().padStart(2)} × ${devName}`);
}

console.log("\n=== 5. Sample listings missing a developer_id ===");
const { data: orphans } = await adm
  .from("developments")
  .select("name, slug")
  .eq("is_published", true)
  .is("developer_id", null)
  .limit(10);
if (orphans?.length) orphans.forEach((d) => console.log(`  • ${d.name} (${d.slug})`));
else console.log("  (none)");
