"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";
import { BedIcon, BathIcon, CarIcon, ExpandIcon } from "@/components/icons";
import { formatPrice } from "@/lib/utils";
import type { DevelopmentFloorPlan } from "@/types/development";

interface PropertiesTableProps {
  floorPlans: DevelopmentFloorPlan[];
  bedsMin: number | null;
  bedsMax: number | null;
}

interface TableRow {
  beds: number | null;
  baths: number | null;
  cars: number | null;
  sqm: number | null;
  price: string | null;
  planType: string | null;
}

function buildRows(floorPlans: DevelopmentFloorPlan[], bedsMin: number | null, bedsMax: number | null): TableRow[] {
  if (floorPlans.length > 0) {
    return floorPlans.map((fp) => {
      // Prefer explicit price_display (e.g. "Contact Agent"), then format price_from
      let price: string | null = null;
      if (fp.price_display) {
        price = fp.price_display;
      } else if (fp.price_from) {
        price = formatPrice(fp.price_from);
      }

      return {
        beds: fp.beds ?? null,
        baths: fp.bath ?? null,
        cars: fp.garage ?? null,
        sqm: fp.internal_sqm,
        price,
        planType: fp.plan_type,
      };
    });
  }

  const min = bedsMin ?? 1;
  const max = bedsMax ?? min;
  return Array.from({ length: Math.max(max - min + 1, 1) }, (_, i) => ({
    beds: min + i,
    baths: null,
    cars: null,
    sqm: null,
    price: null,
    planType: null,
  }));
}

function uniqueBedCounts(rows: TableRow[]): number[] {
  const counts = rows.map((r) => r.beds).filter((b): b is number => b !== null);
  return Array.from(new Set(counts)).sort((a, b) => a - b);
}

function bedLabel(count: number): string {
  return count === 1 ? "1 Bedroom" : `${count} Bedrooms`;
}

export function PropertiesTable({ floorPlans, bedsMin, bedsMax }: PropertiesTableProps) {
  const [activeTab, setActiveTab] = useState<"all" | string>("all");

  const allRows = buildRows(floorPlans, bedsMin, bedsMax);
  const bedCounts = uniqueBedCounts(allRows);
  const hasBedTabs = bedCounts.length > 0;

  const visibleRows =
    activeTab === "all" || !hasBedTabs
      ? allRows
      : allRows.filter((r) => r.beds !== null && r.beds.toString() === activeTab);

  const tabs: { key: string; label: string }[] = [
    { key: "all", label: "All Properties" },
    ...bedCounts.map((b) => ({ key: b.toString(), label: bedLabel(b) })),
  ];

  return (
    <div className="mt-6">
      {/* Tabs */}
      {hasBedTabs && (
        <div className="flex flex-wrap gap-2 mb-6">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={cn(
                "font-mono text-label-sm uppercase tracking-widest px-4 py-2 border transition-colors",
                activeTab === tab.key
                  ? "bg-navy text-white border-navy"
                  : "bg-white text-ink/60 border-line hover:border-navy/40 hover:text-ink"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-navy text-white">
              <th className="font-mono text-label-sm uppercase tracking-widest px-4 py-3 font-normal w-1/5">
                <span className="flex items-center gap-1.5">
                  <BedIcon size={14} className="text-white/60" />
                  Bed
                </span>
              </th>
              <th className="font-mono text-label-sm uppercase tracking-widest px-4 py-3 font-normal w-1/5">
                <span className="flex items-center gap-1.5">
                  <BathIcon size={14} className="text-white/60" />
                  Bath
                </span>
              </th>
              <th className="font-mono text-label-sm uppercase tracking-widest px-4 py-3 font-normal w-1/5">
                <span className="flex items-center gap-1.5">
                  <CarIcon size={14} className="text-white/60" />
                  Car
                </span>
              </th>
              <th className="font-mono text-label-sm uppercase tracking-widest px-4 py-3 font-normal w-1/5">
                <span className="flex items-center gap-1.5">
                  <ExpandIcon size={13} className="text-white/60" />
                  Size
                </span>
              </th>
              <th className="font-mono text-label-sm uppercase tracking-widest px-4 py-3 font-normal text-right w-1/5">
                Price
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={i}
                className={cn(
                  "border-b border-line",
                  i % 2 === 0 ? "bg-white" : "bg-cream/60"
                )}
              >
                <td className="font-sans text-body-md text-ink px-4 py-3">
                  {row.beds !== null ? row.beds : row.planType ?? "–"}
                </td>
                <td className="font-sans text-body-md text-ink/70 px-4 py-3">
                  {row.baths ?? "–"}
                </td>
                <td className="font-sans text-body-md text-ink/70 px-4 py-3">
                  {row.cars ?? "–"}
                </td>
                <td className="font-sans text-body-md text-ink/70 px-4 py-3">
                  {row.sqm ? `${row.sqm} m²` : "–"}
                </td>
                <td className="font-mono text-label-lg text-ink px-4 py-3 text-right">
                  {row.price ?? "–"}
                </td>
              </tr>
            ))}
            {visibleRows.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-8 text-center font-mono text-label-sm uppercase tracking-widest text-ink/30">
                  No properties found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
