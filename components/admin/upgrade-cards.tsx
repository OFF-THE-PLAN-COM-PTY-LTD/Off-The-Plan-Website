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
}

interface UpgradeCardsProps {
  upgrades: Upgrade[];
  listingImages: string[];
  projects: Project[];
  promoFlagHref?: string;
  /**
   * When true, every card CTA links straight to Stripe checkout for that
   * tier instead of opening the manual "request an upgrade" modal. Enabled
   * in the member portal; left off in the admin view.
   */
  checkout?: boolean;
}

export default function UpgradeCards({ upgrades, listingImages, projects, promoFlagHref = "/admin/listings", checkout = false }: UpgradeCardsProps) {
  const [activeModal, setActiveModal] = useState<string | null>(null);

  const slots = Array.from({ length: 6 }, (_, i) => listingImages[i] ?? null);

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

            {/* 6-image grid */}
            <div className="mx-4 mb-4 grid grid-cols-3 gap-1">
              {slots.map((src, i) => (
                <div key={i} className="relative bg-gray-100 overflow-hidden rounded-sm" style={{ aspectRatio: "16/9" }}>
                  {src ? (
                    <Image src={src} alt="" fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full bg-gray-200" />
                  )}
                </div>
              ))}
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
              {checkout ? (
                <a
                  href={`/api/stripe/checkout?tier=${u.tier}`}
                  className="block text-center py-2.5 text-xs font-bold uppercase tracking-widest text-white transition-opacity hover:opacity-80"
                  style={{ background: "#1a2340" }}
                >
                  {u.cta}
                </a>
              ) : u.isPromoFlag ? (
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
