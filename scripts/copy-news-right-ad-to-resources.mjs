/**
 * One-off: copy the existing news/right banner ad to resources/right so the
 * resources page side banner matches news + guides without Tim having to
 * re-upload the same image. Tim can later replace the image on either slot
 * independently via /admin/ads.
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

// Pick up whichever side banner Tim has already configured — prefer news, fall back to guides.
const { data: source } = await supabase
  .from("ads")
  .select("desktop_image_url, mobile_image_url, web_link, ad_type, adsense_code")
  .in("page", ["news", "guides"])
  .eq("position", "right")
  .eq("is_active", true)
  .order("page", { ascending: true })
  .limit(1)
  .maybeSingle();

if (!source) {
  console.log("No existing news/guides right banner found. Nothing to copy.");
  process.exit(0);
}

// Skip if a resources/right ad already exists.
const { data: existing } = await supabase
  .from("ads")
  .select("id")
  .eq("page", "resources")
  .eq("position", "right")
  .maybeSingle();

if (existing) {
  console.log("resources/right ad already exists. Skipping.");
  process.exit(0);
}

const { error } = await supabase.from("ads").insert({
  page: "resources",
  position: "right",
  ad_type: source.ad_type,
  desktop_image_url: source.desktop_image_url,
  mobile_image_url: source.mobile_image_url,
  web_link: source.web_link,
  adsense_code: source.adsense_code,
  is_active: true,
  sort_order: 0,
});

if (error) {
  console.error("insert failed:", error);
  process.exit(1);
}
console.log("✓ Copied news/right banner to resources/right.");
