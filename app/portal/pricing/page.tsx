import { redirect } from "next/navigation";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import UpgradeCards from "@/components/admin/upgrade-cards";
import { UPGRADE_TIERS } from "@/lib/upgrade-tiers";

const plans = [
  {
    name: "Developer and Agency Listing",
    price: 299,
    highlighted: false,
    features: [
      "Low fixed rate per listing per month",
      "Ideal For: New Apartments, Townhouses, Land and Estates, Commercial",
      "Easy to use dashboard — upload and edit your projects, includes basic analytics and lead capture",
      "6 or 12 month term, with 21 day cancellation policy",
      "List today, simply register, upload your project and begin your subscription with a credit card. [or] contact us for other payment options",
    ],
  },
  {
    name: "Builders Package",
    price: 399,
    highlighted: true,
    features: [
      "Low fixed rate per listing per month",
      "Ideal For: House and Land, Over 55's / Retirement",
      "Easy to use dashboard — upload and edit your projects, includes basic analytics and lead capture",
      "6 or 12 month term, with 21 day cancellation policy",
      "List today, simply register, upload your project and begin your subscription with a credit card. [or] contact us for other payment options",
    ],
  },
];

// Featured Upgrade tiers live in lib/upgrade-tiers.ts so both this
// member-portal page and the public /features-and-pricing page render
// the same data and stay in sync.
const upgrades = UPGRADE_TIERS;

export default async function PortalPricing() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: devs } = await supabaseAdmin
    .from("developments")
    .select("id, name, hero_image_url, feature_image_url, is_featured, images:development_images(url, is_hero)")
    .eq("owner_user_id", user.id)
    .order("is_featured", { ascending: false })
    .limit(50);

  const listingImages: string[] = (devs ?? [])
    .map((d) => {
      const imgs = (d.images ?? []) as { url: string; is_hero: boolean }[];
      const hero = imgs.find((i) => i.is_hero)?.url ?? imgs[0]?.url;
      return hero ?? d.hero_image_url ?? d.feature_image_url ?? "";
    })
    .filter(Boolean)
    .slice(0, 6);

  const projects = (devs ?? []).map((d) => ({ id: d.id, name: d.name }));

  return (
    <div>
      {/* Page title */}
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold uppercase tracking-widest" style={{ color: "#1a2340" }}>
          Plans and Pricing
        </h1>
      </div>

      {/* ── Main plans ── */}
      <div className="rounded-xl overflow-hidden mb-10" style={{ background: "#1a2340" }}>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left — phone mockup */}
          <div className="flex items-center justify-center p-6 lg:p-10">
            <div className="relative w-full max-w-[340px]">
              <div className="text-center mb-6">
                <p className="text-white/60 text-xs uppercase tracking-widest mb-1">Start Listing with</p>
                <h2 className="text-white font-bold text-xl uppercase tracking-widest">
                  Off The Plan<sup className="text-[0.45em] align-super ml-0.5">®</sup>
                </h2>
              </div>
              <Image
                src="/Phone-Mock-05.png"
                alt="Off The Plan App"
                width={340}
                height={680}
                className="mx-auto drop-shadow-2xl w-full h-auto"
                sizes="(min-width: 1024px) 340px, (min-width: 640px) 300px, 260px"
                priority
              />
            </div>
          </div>

          {/* Right — plan cards */}
          <div className="p-6 flex flex-col gap-4 justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div key={plan.name} className="rounded-lg overflow-hidden flex flex-col bg-white">
                  <div
                    className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest"
                    style={{
                      background: plan.highlighted ? "#e85d26" : "#e8e8e8",
                      color: plan.highlighted ? "#fff" : "#1a2340",
                    }}
                  >
                    {plan.name}
                  </div>
                  <div className="px-4 pt-4 pb-2 text-center border-b border-gray-100">
                    <span className="font-bold" style={{ fontSize: 36, color: "#1a2340" }}>
                      ${plan.price}
                    </span>
                    <span className="text-gray-400 text-sm"> /month</span>
                  </div>
                  <div className="px-4 py-4 flex flex-col gap-2 flex-1">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle size={13} className="flex-shrink-0 mt-0.5" style={{ color: "#e85d26" }} />
                        <p className="text-xs text-gray-600 leading-snug">{f}</p>
                      </div>
                    ))}
                  </div>
                  <div className="px-4 pb-4">
                    <a
                      href="/portal/listings/new"
                      className="block text-center py-2.5 text-xs font-bold uppercase tracking-widest transition-opacity hover:opacity-80"
                      style={{
                        background: plan.highlighted ? "#e85d26" : "#e8e8e8",
                        color: plan.highlighted ? "#fff" : "#1a2340",
                      }}
                    >
                      List Today
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-white/40 text-[11px] leading-relaxed text-center">
              1. Terms available: 6 months and 12 months. 2. Automatic debit each month for the selected term or until cancellation. 2. 21 day cancellation policy.
            </p>
          </div>
        </div>
      </div>

      {/* ── Featured Upgrades ── */}
      <div className="text-center mb-6">
        <h2 className="text-lg font-bold uppercase tracking-widest mb-2" style={{ color: "#1a2340" }}>
          Featured Upgrades
        </h2>
        <p className="text-sm text-gray-500 max-w-xl mx-auto">
          These upgrades are billed manually in addition to the standard monthly subscriptions.
          Please see below our current listing upgrade options.
        </p>
      </div>

      <UpgradeCards
        upgrades={upgrades}
        listingImages={listingImages}
        projects={projects}
        promoFlagHref="/portal/listings"
      />
    </div>
  );
}
