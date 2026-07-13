"use client";

import { formatPrice } from "@/lib/utils";
import type { DevelopmentFloorPlan, MiniStocklistRow } from "@/types/development";
import { getStocklistFields } from "@/lib/listing-card-fields";

interface PropertiesTableProps {
  floorPlans: DevelopmentFloorPlan[];
  bedsMin: number | null;
  bedsMax: number | null;
  /**
   * "Mini stocklist" — the longer Properties-Available table (up to
   * 20 rows). When present, rendered verbatim and the floor_plan /
   * beds-range fallback is skipped. Source: `developments.mini_stocklist`
   * jsonb column.
   */
  miniStocklist?: MiniStocklistRow[] | null;
  /**
   * Listing category — drives which columns and icons show up on the
   * table. Per dev spec v4 (e.g. Land and Estates → Lot/Land/Frontage/Depth).
   */
  developmentType?: string | null;
}

interface TableRow {
  /** Aligned 1:1 with cardFields. Null = render blank cell. */
  values: (string | null)[];
  price: string | null;
}

export function PropertiesTable({ floorPlans, bedsMin, bedsMax, miniStocklist, developmentType }: PropertiesTableProps) {
  const cardFields = getStocklistFields(developmentType);

  const allRows: TableRow[] = (() => {
    // 1. Mini stocklist wins when populated.
    if (miniStocklist && miniStocklist.length > 0) {
      return miniStocklist.slice(0, 20).map((r) => ({
        values: cardFields.map((f) => {
          const stockKey = (f.stocklistKey ?? f.key) as keyof MiniStocklistRow;
          const raw = r[stockKey];
          return raw == null || raw === "" ? null : String(raw);
        }),
        price: r.price ?? null,
      }));
    }
    // 2. Configuration Summary (development_floor_plans) — same keys as
    //    the public card.
    if (floorPlans.length > 0) {
      return floorPlans.map((fp) => {
        let price: string | null = null;
        if (fp.price_display) price = fp.price_display;
        else if (fp.price_from) price = formatPrice(fp.price_from);
        return {
          values: cardFields.map((f) => {
            const raw = (fp as unknown as Record<string, unknown>)[f.key];
            return raw == null || raw === "" ? null : String(raw);
          }),
          price,
        };
      });
    }
    // 3. Bed-range fallback — residential only.
    if (cardFields[0]?.key !== "beds") return [];
    const min = bedsMin ?? 1;
    const max = bedsMax ?? min;
    return Array.from({ length: Math.max(max - min + 1, 1) }, (_, i) => ({
      values: cardFields.map((f) => (f.key === "beds" ? String(min + i) : null)),
      price: null,
    }));
  })();

  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-navy text-white">
            {cardFields.map((f) => {
              const Icon = f.icon;
              return (
                <th key={f.key} className="font-sans text-[13px] font-normal px-4 py-3">
                  <span className="flex items-center gap-2">
                    <Icon size={14} className="text-white/60 shrink-0" />
                    {f.label}
                  </span>
                </th>
              );
            })}
            <th className="font-sans text-[13px] font-normal px-4 py-3 text-right">
              Price From
            </th>
          </tr>
        </thead>
        <tbody>
          {allRows.map((row, i) => (
            <tr key={i} className="border-b border-line bg-white hover:bg-cream/40 transition-colors">
              {row.values.map((v, ci) => (
                <td key={ci} className="font-sans text-[14px] text-ink/70 px-4 py-3">
                  {v ?? ""}
                </td>
              ))}
              <td className="font-sans text-[14px] text-ink px-4 py-3 text-right">
                {row.price ?? ""}
              </td>
            </tr>
          ))}
          {allRows.length === 0 && (
            <tr>
              <td colSpan={cardFields.length + 1} className="px-4 py-8 text-center font-mono text-label-sm uppercase tracking-widest text-ink/30">
                No properties found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
