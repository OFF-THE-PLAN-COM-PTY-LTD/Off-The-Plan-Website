import Link from "next/link";

const plans = [
  {
    name: "Starter",
    price: "Contact Us",
    features: ["1 active listing", "Basic analytics", "Enquiry management", "Email support"],
    highlight: false,
  },
  {
    name: "Professional",
    price: "Contact Us",
    features: ["Up to 5 active listings", "Full analytics dashboard", "Featured listing (1)", "Priority support", "CSV lead exports"],
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Contact Us",
    features: ["Unlimited listings", "Full analytics dashboard", "Multiple featured listings", "Dedicated account manager", "Custom reporting"],
    highlight: false,
  },
];

export default function PortalPricing() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="font-serif text-2xl text-ink">Pricing</h1>
        <p className="font-sans text-sm text-ink/50 mt-1">Choose the plan that suits your portfolio.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {plans.map((plan) => (
          <div
            key={plan.name}
            className={`bg-white p-6 flex flex-col gap-5 ${plan.highlight ? "ring-2 ring-orange" : "border border-line"}`}
          >
            {plan.highlight && (
              <span className="font-mono text-[9px] uppercase tracking-widest text-white bg-orange px-2 py-0.5 w-fit">
                Most Popular
              </span>
            )}
            <div>
              <p className="font-mono text-[11px] uppercase tracking-widest text-ink/50">{plan.name}</p>
              <p className="font-serif text-2xl text-ink mt-1">{plan.price}</p>
            </div>
            <ul className="flex flex-col gap-2 flex-1">
              {plan.features.map((f) => (
                <li key={f} className="flex items-start gap-2 font-sans text-sm text-ink/70">
                  <span className="text-orange mt-0.5 flex-shrink-0">✓</span>
                  {f}
                </li>
              ))}
            </ul>
            <Link
              href="/contact"
              className={`font-mono text-[10px] uppercase tracking-widest px-4 py-2.5 text-center transition-colors ${
                plan.highlight
                  ? "bg-orange text-white hover:bg-orange/90"
                  : "border border-ink text-ink hover:bg-ink hover:text-white"
              }`}
            >
              Get in Touch
            </Link>
          </div>
        ))}
      </div>

      <p className="font-sans text-xs text-ink/40 text-center">
        All pricing is tailored. Contact the Off The Plan team to discuss your requirements.
      </p>
    </div>
  );
}
