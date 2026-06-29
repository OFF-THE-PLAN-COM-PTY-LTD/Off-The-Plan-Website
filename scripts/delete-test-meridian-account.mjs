/**
 * One-off cleanup: delete the ched+meridian@meetapex.ai test account that
 * was created via the old buyer signup flow. After the new
 * Developer/Agent application flow ships, Ched will re-register via
 * /list-a-listing for a proper test.
 */

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });

const EMAIL = "ched+meridian@meetapex.ai";

const { data } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
const user = data.users.find((u) => (u.email ?? "").toLowerCase() === EMAIL);
if (!user) {
  console.log(`No auth user with email ${EMAIL}. Nothing to delete.`);
  process.exit(0);
}
console.log(`Found auth user ${user.id} (${user.email}). Deleting…`);
const { error } = await sb.auth.admin.deleteUser(user.id);
if (error) {
  console.error("Delete failed:", error);
  process.exit(1);
}
console.log("✓ Deleted. The profiles row should cascade via the FK to auth.users.");
