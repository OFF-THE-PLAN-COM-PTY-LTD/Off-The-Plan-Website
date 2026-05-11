"use client";

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

export function PropertiesTable({ floorPlans, bedsMin, bedsMax }: PropertiesTableProps) {
  const allRows = buildRows(floorPlans, bedsMin, bedsMax);

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-navy text-white">
            <th className="font-sans text-[13px] font-normal px-4 py-3">
              <span className="flex items-center gap-2">
                <BedIcon size={14} className="text-white/60 shrink-0" />
                Number Of Bedrooms
              </span>
            </th>
            <th className="font-sans text-[13px] font-normal px-4 py-3">
              <span className="flex items-center gap-2">
                <BathIcon size={14} className="text-white/60 shrink-0" />
                Number Of Bathrooms
              </span>
            </th>
            <th className="font-sans text-[13px] font-normal px-4 py-3">
              <span className="flex items-center gap-2">
                <CarIcon size={14} className="text-white/60 shrink-0" />
                Parking Spaces
              </span>
            </th>
            <th className="font-sans text-[13px] font-normal px-4 py-3">
              <span className="flex items-center gap-2">
                <ExpandIcon size={13} className="text-white/60 shrink-0" />
                Total Apartment Size
              </span>
            </th>
            <th className="font-sans text-[13px] font-normal px-4 py-3 text-right">
              Price From
            </th>
          </tr>
        </thead>
        <tbody>
          {allRows.map((row, i) => (
            <tr key={i} className="border-b border-line bg-white hover:bg-cream/40 transition-colors">
              <td className="font-sans text-[14px] text-ink px-4 py-3">
                {row.beds !== null ? row.beds : row.planType ?? ""}
              </td>
              <td className="font-sans text-[14px] text-ink/70 px-4 py-3">
                {row.baths ?? ""}
              </td>
              <td className="font-sans text-[14px] text-ink/70 px-4 py-3">
                {row.cars ?? ""}
              </td>
              <td className="font-sans text-[14px] text-ink/70 px-4 py-3">
                {row.sqm ?? ""}
              </td>
              <td className="font-sans text-[14px] text-ink px-4 py-3 text-right">
                {row.price ?? ""}
              </td>
            </tr>
          ))}
          {allRows.length === 0 && (
            <tr>
              <td colSpan={5} className="px-4 py-8 text-center font-mono text-label-sm uppercase tracking-widest text-ink/30">
                No properties found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
