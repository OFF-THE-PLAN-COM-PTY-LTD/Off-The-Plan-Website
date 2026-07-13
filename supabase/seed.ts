/**
 * Seed script for Off The Plan database.
 * Run after migrations: npx ts-node supabase/seed.ts
 * Requires real Supabase credentials in .env.local
 */
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || supabaseUrl.includes("placeholder")) {
  console.error("❌ Set real NEXT_PUBLIC_SUPABASE_URL in .env.local before seeding.");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function seed() {
  console.log("🌱 Seeding Off The Plan database...\n");

  // Developer accounts (the consolidated `accounts` table, type='Developer').
  const { data: devs, error: devErr } = await supabase
    .from("accounts")
    .upsert(
      [
        {
          type: "Developer",
          slug: "metro-developments",
          name: "Metro Developments",
          description:
            "One of Victoria's leading residential developers with over 20 years building premium apartments.",
          abn: "12 345 678 901",
          state: "VIC",
          is_published: true,
        },
        {
          type: "Developer",
          slug: "harbor-group",
          name: "Harbor Group",
          description: "Sydney-based developer specialising in harbourside apartments.",
          abn: "98 765 432 109",
          state: "NSW",
          is_published: true,
        },
      ],
      { onConflict: "slug" }
    )
    .select();

  if (devErr) { console.error("Developer accounts error:", devErr); return; }
  console.log(`✅ ${devs!.length} developer accounts`);

  const metroId = devs!.find((d) => d.slug === "metro-developments")!.id;
  const harborId = devs!.find((d) => d.slug === "harbor-group")!.id;

  // Developments
  const { data: devsList, error: devsErr } = await supabase
    .from("developments")
    .upsert(
      [
        { slug: "parkview-south-yarra", name: "Parkview", suburb: "South Yarra", state: "VIC", price_from: 75000000, price_display: "$750K", beds_min: 1, beds_max: 3, completion_quarter: "Q3 2026", type: "Apartments", account_id: metroId, tag: "Featured", status: "Selling now", summary: "A considered collection of 84 residences set against the gardens of South Yarra.", architect: "Fender Katsalidis", interiors: "Studio Tate", landscape: "Openwork", builder: "Probuild", levels: 14, residence_count: 84, lat: -37.8389, lng: 144.9938, is_published: true, is_featured: true },
        { slug: "the-retreat-toorak", name: "The Retreat", suburb: "Toorak", state: "VIC", price_from: 200000000, price_display: "$2M", beds_min: 2, beds_max: 4, completion_quarter: "Q1 2027", type: "Townhouses", account_id: metroId, tag: "Editor's pick", status: "Register interest", summary: "Twelve boutique townhouses in the heart of Toorak.", architect: "Rothelowman", interiors: "Hecker Guthrie", landscape: "Jack Merlo", builder: "Hickory", levels: 3, residence_count: 12, lat: -37.8432, lng: 145.0108, is_published: true, is_featured: true },
        { slug: "harbour-one-sydney", name: "Harbour One", suburb: "Barangaroo", state: "NSW", price_from: 350000000, price_display: "$3.5M", beds_min: 2, beds_max: 5, completion_quarter: "Q4 2027", type: "Apartments", account_id: harborId, tag: "New launch", status: "Selling now", summary: "42 levels of harbour-facing residences with uninterrupted Opera House views.", architect: "SJB", interiors: "Mim Design", landscape: "Dangar Barin Smith", builder: "Multiplex", levels: 42, residence_count: 186, lat: -33.8617, lng: 151.2006, is_published: true, is_featured: false },
        { slug: "eden-glen-waverley", name: "Eden", suburb: "Glen Waverley", state: "VIC", price_from: 60000000, price_display: "$600K", beds_min: 2, beds_max: 3, completion_quarter: "Q2 2026", type: "Townhouses", account_id: metroId, tag: "Trending", status: "Final release", summary: "Final release of 8 remaining townhouses in this sought-after enclave.", architect: "CHT Architects", interiors: "Mim Design", landscape: "Tract", builder: "LU Simon", levels: 2, residence_count: 32, lat: -37.8769, lng: 145.1607, is_published: true, is_featured: false },
        { slug: "horizon-brisbane", name: "Horizon", suburb: "Brisbane City", state: "QLD", price_from: 80000000, price_display: "$800K", beds_min: 1, beds_max: 3, completion_quarter: "Q3 2027", type: "Apartments", account_id: metroId, tag: "Featured", status: "Selling now", summary: "A striking 38-level tower anchoring Brisbane's Waterfront precinct.", architect: "Cottee Parker", interiors: "DKO", landscape: "Urbis", builder: "Hutchinson Builders", levels: 38, residence_count: 220, lat: -27.4698, lng: 153.0251, is_published: true, is_featured: false },
        { slug: "the-grove-armadale", name: "The Grove", suburb: "Armadale", state: "VIC", price_from: 95000000, price_display: "$950K", beds_min: 2, beds_max: 3, completion_quarter: "Q4 2026", type: "Apartments", account_id: metroId, tag: "Editor's pick", status: "Selling now", summary: "Fifty-two residences in one of Melbourne's most walkable neighbourhoods.", architect: "Ewert Leaf", interiors: "Studio Tate", landscape: "Openwork", builder: "Hacer Group", levels: 8, residence_count: 52, lat: -37.8559, lng: 145.0163, is_published: true, is_featured: false },
        { slug: "coastal-manly", name: "Coastal", suburb: "Manly", state: "NSW", price_from: 280000000, price_display: "$2.8M", beds_min: 3, beds_max: 4, completion_quarter: "Q2 2027", type: "Penthouses", account_id: harborId, tag: "New launch", status: "Register interest", summary: "Six full-floor penthouses with 360-degree ocean and harbour views.", architect: "Tonkin Zulaikha Greer", interiors: "Greg Natale", landscape: "Secret Gardens", builder: "Icon Construction", levels: 7, residence_count: 6, lat: -33.7969, lng: 151.2842, is_published: true, is_featured: false },
        { slug: "king-street-newtown", name: "King Street", suburb: "Newtown", state: "NSW", price_from: 72000000, price_display: "$720K", beds_min: 1, beds_max: 2, completion_quarter: "Q1 2026", type: "Apartments", account_id: harborId, tag: "Trending", status: "Selling now", summary: "68 design-led apartments above Newtown's iconic strip.", architect: "Bates Smart", interiors: "Amber Road", landscape: "Aspect Studios", builder: "Richard Crookes", levels: 10, residence_count: 68, lat: -33.8976, lng: 151.1797, is_published: true, is_featured: false },
      ],
      { onConflict: "slug" }
    )
    .select();

  if (devsErr) { console.error("Developments error:", devsErr); return; }
  console.log(`✅ ${devsList!.length} developments`);

  // Journal articles
  const { data: articles, error: articleErr } = await supabase
    .from("journal_articles")
    .upsert(
      [
        { slug: "why-off-the-plan-apartments-make-sense-in-2026", title: "Why Off-the-Plan Apartments Make Sense in 2026", category: "Market", author: "The Editors", read_time_minutes: 6, published_at: "2026-04-28T09:00:00.000Z", is_published: true, body_html: "<p>The case for buying off-the-plan has never been stronger.</p>" },
        { slug: "inside-the-design-process-fender-katsalidis", title: "Inside the Design Process: A Conversation with Fender Katsalidis", category: "Interview", author: "Charlotte Reid", read_time_minutes: 8, published_at: "2026-04-21T09:00:00.000Z", is_published: true, body_html: "<p>Few firms have shaped Australia's urban skyline as distinctively as Fender Katsalidis.</p>" },
        { slug: "the-buyers-guide-to-contract-review", title: "The Buyer's Guide to Off-the-Plan Contract Review", category: "Guide", author: "The Editors", read_time_minutes: 10, published_at: "2026-04-14T09:00:00.000Z", is_published: true, body_html: "<p>Before you sign, understand what you're signing.</p>" },
        { slug: "south-yarra-the-perennial-address", title: "South Yarra: The Perennial Address", category: "Editorial", author: "James Whitfield", read_time_minutes: 5, published_at: "2026-04-07T09:00:00.000Z", is_published: true, body_html: "<p>South Yarra has absorbed ten years of apartment supply without flinching.</p>" },
      ],
      { onConflict: "slug" }
    )
    .select();

  if (articleErr) { console.error("Articles error:", articleErr); return; }
  console.log(`✅ ${articles!.length} journal articles`);

  console.log("\n✅ Seeding complete!");
}

seed().catch(console.error);
