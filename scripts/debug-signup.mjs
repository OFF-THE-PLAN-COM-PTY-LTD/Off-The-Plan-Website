/**
 * Debug: call auth.signUp directly with a fresh email and print the
 * raw Supabase error. The /api/auth/register-as-developer route was
 * masking every error as "email already registered", which is wrong
 * for several failure modes (weak password, SMTP misconfigured,
 * rate-limited, etc.).
 */

import fs from "node:fs";
import { createClient } from "@supabase/supabase-js";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }),
);

const supabase = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.NEXT_PUBLIC_SUPABASE_ANON_KEY, {
  auth: { persistSession: false },
});

// Use a unique fresh email so we know any error is NOT about "already registered".
const stamp = Math.floor(Math.random() * 1e6);
const email = `ched+debug${stamp}@meetapex.ai`;
const password = "TestPassword!2026";

console.log(`Attempting signUp with: ${email}\n`);

const { data, error } = await supabase.auth.signUp({
  email,
  password,
  options: { data: { full_name: "Debug Test" } },
});

if (error) {
  console.error("Supabase signUp returned an error:");
  console.error("  message:", error.message);
  console.error("  status: ", error.status);
  console.error("  code:   ", error.code);
  console.error("  name:   ", error.name);
  console.error("\nFull error object:");
  console.error(error);
} else {
  console.log("✓ signUp succeeded.");
  console.log("  user.id:               ", data.user?.id);
  console.log("  user.email:            ", data.user?.email);
  console.log("  user.email_confirmed_at:", data.user?.email_confirmed_at);
  console.log("  session:               ", data.session ? "present" : "null");
}
