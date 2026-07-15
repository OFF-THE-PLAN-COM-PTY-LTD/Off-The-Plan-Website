"use client";

import { useState } from "react";
import Image from "next/image";
import { categorySlug } from "@/lib/listing-url";
import { ListingRowActions } from "./listing-row-actions";

type AgencyOption = { id: string; label: string };

export type ListingGroup = {
  key: string;
  title: string;
  listings: any[];
};

export function ListingsTabs({ groups, agencies }: { groups: ListingGroup[]; agencies: AgencyOption[] }) {
  const tabs = groups.filter((g) => g.listings.length > 0);
  const [active, setActive] = useState(tabs[0]?.key ?? "");

  if (tabs.length === 0) return null;

  const activeGroup = tabs.find((g) => g.key === active) ?? tabs[0];

  return (
    <div className="mb-10">
      {/* Tab bar */}
      <div className="flex flex-wrap gap-1 border-b border-line mb-4">
        {tabs.map((g) => {
          const isActive = g.key === activeGroup.key;
          return (
            <button
              key={g.key}
              type="button"
              onClick={() => setActive(g.key)}
              className={`font-mono font-bold text-sm uppercase tracking-widest px-4 py-3 -mb-px border-b-2 transition-colors ${
                isActive
                  ? "border-orange text-navy"
                  : "border-transparent text-ink/40 hover:text-navy"
              }`}
            >
              {g.title}
              <span
                className={`ml-2 font-sans text-xs ${isActive ? "text-orange" : "text-ink/30"}`}
              >
                {g.listings.length}
              </span>
            </button>
          );
        })}
      </div>

      <div className="bg-white border border-line overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr className="border-b-2 border-orange/30">
              {["Thumbnail", "Project", "Price", "Type", "Status", "Actions"].map((h) => (
                <th key={h} className="font-mono text-[11px] uppercase tracking-widest text-orange px-4 py-3">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {activeGroup.listings.map((listing) => (
              <tr key={listing.id} className="border-b border-line last:border-0 hover:bg-cream-alt transition-colors">
                {/* Thumbnail */}
                <td className="px-4 py-3 w-24">
                  {listing.hero_image_url ? (
                    <div className="relative w-20 h-14 overflow-hidden flex-shrink-0">
                      <Image
                        src={listing.hero_image_url}
                        alt={listing.name}
                        fill
                        className="object-cover"
                        sizes="80px"
                      />
                    </div>
                  ) : (
                    <div className="w-20 h-14 bg-navy/10 flex items-center justify-center flex-shrink-0">
                      <span className="font-mono text-[9px] text-ink/30 uppercase">No img</span>
                    </div>
                  )}
                </td>

                {/* Project */}
                <td className="px-4 py-3 max-w-[220px]">
                  <p className="font-sans text-sm font-semibold text-orange leading-tight mb-0.5">{listing.name}</p>
                  {listing.developer?.name && (
                    <p className="font-sans text-xs text-ink/50">
                      Created by:{" "}
                      {listing.developer.id ? (
                        <a
                          href={`/admin/agencies/${listing.developer.id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-orange hover:underline"
                        >
                          {listing.developer.name}
                        </a>
                      ) : (
                        listing.developer.name
                      )}
                    </p>
                  )}
                  <p className="font-sans text-xs text-ink/40">{listing.suburb}, {listing.state}</p>
                </td>

                {/* Price */}
                <td className="px-4 py-3 font-sans text-sm text-ink/70 whitespace-nowrap">
                  {listing.price_display ?? "—"}
                </td>

                {/* Type */}
                <td className="px-4 py-3 font-sans text-sm text-ink/70 whitespace-nowrap">
                  {listing.type ?? "—"}
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <div className="flex flex-col gap-1">
                    {listing.is_published ? (
                      <span className="inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-green-500 text-green-600 whitespace-nowrap">
                        Active
                      </span>
                    ) : (
                      <span className="inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-ink/20 text-ink/40 whitespace-nowrap">
                        Inactive
                      </span>
                    )}
                    {listing.is_featured && (
                      <span className="inline-block font-mono text-[10px] uppercase tracking-wider px-2 py-0.5 border border-orange text-orange whitespace-nowrap">
                        Featured
                      </span>
                    )}
                  </div>
                </td>

                {/* Actions */}
                <td className="px-4 py-3">
                  <ListingRowActions
                    id={listing.id}
                    slug={listing.slug}
                    category={categorySlug(listing.type)}
                    isPublished={listing.is_published}
                    isFeatured={listing.is_featured}
                    tier={listing.tier ?? null}
                    agencyId={listing.agency_id ?? null}
                    orgName={listing.developer?.name ?? null}
                    listingName={listing.name}
                    agencies={agencies}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
