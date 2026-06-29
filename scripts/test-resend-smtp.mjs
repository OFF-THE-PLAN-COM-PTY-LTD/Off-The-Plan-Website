/**
 * Test if Resend's API works with the key we have in .env.local.
 * This is independent of Supabase's SMTP — it tests the API path
 * Resend itself uses for sending. If THIS works, then the issue
 * is with what was typed into the Supabase SMTP form (typo in
 * the API key, wrong sender domain, etc.).
 */

import fs from "node:fs";

const env = Object.fromEntries(
  fs.readFileSync(".env.local", "utf8").split("\n")
    .filter((l) => l && !l.trimStart().startsWith("#") && l.includes("="))
    .map((l) => { const i = l.indexOf("="); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^["']|["']$/g, "")]; }),
);

const RESEND_KEY = env.RESEND_API_KEY;
const FROM = env.RESEND_FROM_EMAIL ?? "Off The Plan <notifications@send.offtheplan.com.au>";

if (!RESEND_KEY) {
  console.error("No RESEND_API_KEY in .env.local");
  process.exit(1);
}

console.log("Testing Resend with key:", RESEND_KEY.slice(0, 10) + "..." + RESEND_KEY.slice(-4));
console.log("Sender:", FROM);
console.log("");

const res = await fetch("https://api.resend.com/emails", {
  method: "POST",
  headers: {
    "Authorization": `Bearer ${RESEND_KEY}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    from: FROM,
    to: ["ched@meetapex.ai"],
    subject: "SMTP debug test — please ignore",
    text: "If you see this in your inbox, the Resend API key works fine. The issue must be in how it was pasted into Supabase's SMTP form.",
  }),
});

const json = await res.json();
console.log("Status:", res.status);
console.log("Response:", JSON.stringify(json, null, 2));
