import Image from "next/image";
import { CheckCircle } from "lucide-react";

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
      "Ideal For: House and Land, New Home Designs",
      "Easy to use dashboard — upload and edit your projects, includes basic analytics and lead capture",
      "6 or 12 month term, with 21 day cancellation policy",
      "List today, simply register, upload your project and begin your subscription with a credit card. [or] contact us for other payment options",
    ],
  },
];

const upgrades = [
  {
    name: "Promo Flag",
    price: 50,
    preview: "/off-the-plan-banner-portrait.png",
    features: [
      "Available for all properties",
      "Promotional flag on the listing",
      "Add a short snappy message",
      "$50 + GST per month",
    ],
    cta: "ADD A PROMO FLAG",
    href: "mailto:hello@offtheplan.com.au?subject=Promo Flag Request",
  },
  {
    name: "Featured Project Tier 2",
    price: 200,
    preview: "/off-the-plan-banner-landscape.png",
    features: [
      "Available for all properties",
      "Property featured under the home page banner (2nd row)",
      "$200 + GST per month",
      "Up to 8 available each month",
    ],
    cta: "REQUEST AN UPGRADE",
    href: "mailto:hello@offtheplan.com.au?subject=Featured Project Tier 2 Request",
  },
  {
    name: "Featured Project Tier 1",
    price: 400,
    preview: "/off-the-plan-banner-landscape.png",
    features: [
      "Available to New Apartments and Townhouses",
      "Property featured under the home page banner",
      "$400 + GST per month",
      "Up to 6 available each month",
    ],
    cta: "REQUEST AN UPGRADE",
    href: "mailto:hello@offtheplan.com.au?subject=Featured Project Tier 1 Request",
  },
  {
    name: "Home Page Main Banner",
    price: 1000,
    preview: "/off-the-plan-banner-landscape.png",
    features: [
      "Available to: New Apartments and Townhouses",
      "Up to 3 available per month, 33% share of voice",
      "Feature HERO project on home page",
      "$1000 + GST",
    ],
    cta: "REQUEST AN UPGRADE",
    href: "mailto:hello@offtheplan.com.au?subject=Home Page Main Banner Request",
  },
];

export default function PricingPage() {
  return (
    <div>
      {/* Page title */}
      <div className="text-center mb-8">
        <h1
          className="text-2xl font-bold uppercase tracking-widest"
          style={{ color: "#1a2340" }}
        >
          Plans and Pricing
        </h1>
      </div>

      {/* ── Main plans ── */}
      <div
        className="rounded-xl overflow-hidden mb-10"
        style={{ background: "#1a2340" }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Left — phone mockup */}
          <div className="flex items-center justify-center p-10">
            <div className="relative">
              <div className="text-center mb-6">
                <p className="text-white/60 text-xs uppercase tracking-widest mb-1">
                  Start Listing with
                </p>
                <h2 className="text-white font-bold text-xl uppercase tracking-widest">
                  Off The Plan
                </h2>
              </div>
              <Image
                src="/Phone-Mock-05.png"
                alt="Off The Plan App"
                width={220}
                height={440}
                className="mx-auto drop-shadow-2xl"
              />
            </div>
          </div>

          {/* Right — plan cards */}
          <div className="p-6 flex flex-col gap-4 justify-center">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {plans.map((plan) => (
                <div
                  key={plan.name}
                  className="rounded-lg overflow-hidden flex flex-col"
                  style={{ background: "#fff" }}
                >
                  {/* Header */}
                  <div
                    className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest"
                    style={{
                      background: plan.highlighted ? "#e85d26" : "#e8e8e8",
                      color: plan.highlighted ? "#fff" : "#1a2340",
                    }}
                  >
                    {plan.name}
                  </div>

                  {/* Price */}
                  <div className="px-4 pt-4 pb-2 text-center border-b border-gray-100">
                    <span
                      className="font-bold"
                      style={{ fontSize: 36, color: "#1a2340" }}
                    >
                      ${plan.price}
                    </span>
                    <span className="text-gray-400 text-sm"> /month</span>
                  </div>

                  {/* Features */}
                  <div className="px-4 py-4 flex flex-col gap-2 flex-1">
                    {plan.features.map((f, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <CheckCircle
                          size={13}
                          className="flex-shrink-0 mt-0.5"
                          style={{ color: "#e85d26" }}
                        />
                        <p className="text-xs text-gray-600 leading-snug">{f}</p>
                      </div>
                    ))}
                  </div>

                  {/* CTA */}
                  <div className="px-4 pb-4">
                    <a
                      href="mailto:hello@offtheplan.com.au?subject=New Listing Enquiry"
                      className="block text-center py-2.5 text-xs font-bold uppercase tracking-widest transition-colors"
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

            {/* Terms */}
            <p className="text-white/40 text-[11px] leading-relaxed text-center">
              1. Terms available: 6 months and 12 months. 2. Automatic debit each month
              for the selected term or until cancellation. 2. 21 day cancellation policy.
            </p>
          </div>
        </div>
      </div>

      {/* ── Featured Upgrades ── */}
      <div className="text-center mb-6">
        <h2
          className="text-lg font-bold uppercase tracking-widest mb-2"
          style={{ color: "#1a2340" }}
        >
          Featured Upgrades
        </h2>
        <p className="text-sm text-gray-500 max-w-xl mx-auto">
          These upgrades are billed manually in addition to the standard monthly
          subscriptions. Please see below our current listing upgrade options.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {upgrades.map((u) => (
          <div
            key={u.name}
            className="rounded-lg overflow-hidden flex flex-col border border-gray-200 bg-white"
          >
            {/* Header */}
            <div
              className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white"
              style={{ background: "#1a2340" }}
            >
              {u.name}
            </div>

            {/* Price */}
            <div className="px-4 pt-4 pb-2 text-center">
              <span
                className="font-bold"
                style={{ fontSize: 28, color: "#1a2340" }}
              >
                ${u.price.toLocaleString()}
              </span>
              <span className="text-gray-400 text-sm"> /month</span>
            </div>

            {/* Preview image */}
            <div className="mx-4 mb-3 rounded overflow-hidden border border-gray-100 relative h-32 bg-gray-50">
              <Image
                src={u.preview}
                alt={u.name}
                fill
                className="object-cover"
              />
            </div>

            {/* Features */}
            <div className="px-4 pb-3 flex flex-col gap-2 flex-1">
              {u.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle
                    size={12}
                    className="flex-shrink-0 mt-0.5"
                    style={{ color: "#e85d26" }}
                  />
                  <p className="text-xs text-gray-600 leading-snug">{f}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-4 pb-4 mt-auto">
              <a
                href={u.href}
                className="block text-center py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-80"
                style={{ background: "#1a2340" }}
              >
                {u.cta}
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
