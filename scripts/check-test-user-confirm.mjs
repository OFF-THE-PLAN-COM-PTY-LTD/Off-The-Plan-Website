import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";
const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n").filter((l) => l && !l.trimStart().startsWith("#") && l.includes("=")).map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }),
);
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
const { data } = await sb.auth.admin.listUsers({ page: 1, perPage: 200 });
const u = data.users.find((x) => (x.email ?? "").toLowerCase() === "ched+meridian@meetapex.ai");
if (!u) { console.log("Test user not found!"); process.exit(0); }
console.log("Test user:");
console.log("  id:                  ", u.id);
console.log("  email:               ", u.email);
console.log("  email_confirmed_at:  ", u.email_confirmed_at ?? "(not confirmed)");
console.log("  last_sign_in_at:     ", u.last_sign_in_at ?? "(never)");
console.log("  created_at:          ", u.created_at);
