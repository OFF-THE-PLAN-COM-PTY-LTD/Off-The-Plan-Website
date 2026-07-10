"use client";

import { useState } from "react";
import Image from "next/image";
import { CheckCircle } from "lucide-react";
import UpgradeModal from "@/components/admin/upgrade-modal";

interface Project {
  id: string;
  name: string;
}

interface Upgrade {
  name: string;
  price: number;
  features: string[];
  cta: string;
  isPromoFlag: boolean;
  /** Stripe checkout tier — present on portal upgrades; unused in admin view. */
  tier?: string;
  /** Illustrative mockup shown on the card (from lib/upgrade-tiers.ts). */
  image: string;
}

interface UpgradeCardsProps {
  upgrades: Upgrade[];
  projects: Project[];
  promoFlagHref?: string;
}

export default function UpgradeCards({ upgrades, projects, promoFlagHref = "/admin/listings" }: UpgradeCardsProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {upgrades.map((u) => (
          <div key={u.name} className="rounded-lg overflow-hidden flex flex-col border border-gray-200 bg-white">
            {/* Header */}
            <div
              className="px-4 py-3 text-center text-xs font-bold uppercase tracking-widest text-white"
              style={{ background: "#1a2340" }}
            >
              {u.name}
            </div>

            {/* Price */}
            <div className="px-4 pt-4 pb-3 text-center">
              <span className="font-bold" style={{ fontSize: 28, color: "#1a2340" }}>
                ${u.price.toLocaleString()}
              </span>
              <span className="text-gray-400 text-sm"> /month</span>
            </div>

            {/* Illustrative mockup of what the upgrade looks like on the site */}
            <div className="mx-4 mb-4 overflow-hidden rounded-sm border border-gray-100">
              <Image
                src={u.image}
                alt={`${u.name} example`}
                width={3456}
                height={9035}
                className="w-full h-auto"
                sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
              />
            </div>

            {/* Features */}
            <div className="px-4 pb-3 flex flex-col gap-2 flex-1">
              {u.features.map((f, i) => (
                <div key={i} className="flex items-start gap-2">
                  <CheckCircle size={12} className="flex-shrink-0 mt-0.5" style={{ color: "#e85d26" }} />
                  <p className="text-xs text-gray-600 leading-snug">{f}</p>
                </div>
              ))}
            </div>

            {/* CTA */}
            <div className="px-4 pb-4 mt-auto">
              {u.isPromoFlag ? (
                <a
                  href={promoFlagHref}
                  className="block text-center py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-80"
                  style={{ background: "#1a2340" }}
                >
                  {u.cta}
                </a>
              ) : (
                <button
                  onClick={() => setActiveModal(u.name)}
                  className="w-full text-center py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-80"
                  style={{ background: "#1a2340" }}
                >
                  {u.cta}
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {activeModal && (
        <UpgradeModal
          upgradeType={activeModal}
          projects={projects}
          availableUpgrades={upgrades.map(({ name, price }) => ({ name, price }))}
          onClose={() => setActiveModal(null)}
        />
      )}
    </>
  );
}
