"use client";

import { getStocklistFields } from "@/lib/listing-card-fields";
import { AccordionSection } from "../fields/accordion-section";
import { MAX_STOCKLIST_ROWS } from "../constants";
import type { MiniStocklistEntry } from "../types";

// Renders as the "Properties Available" table on the public
// listing page. Up to 20 rows per Tim's spec. All cells are
// free text so admins can mirror the existing site's mixed
// content (e.g. "Contact Agent" or "Fr. $660,000").

interface Props {
  type: string;
  miniStocklist: MiniStocklistEntry[];
  addStocklistRow: () => void;
  removeStocklistRow: (index: number) => void;
  updateStocklistRow: (index: number, field: keyof MiniStocklistEntry, value: string) => void;
}

export function PropertiesAvailableSection({
  type,
  miniStocklist,
  addStocklistRow,
  removeStocklistRow,
  updateStocklistRow,
}: Props) {
  return (
    <AccordionSection title="Properties Available (Mini Stocklist)">
      <div>
        <p className="font-sans text-sm text-ink/60 mb-4">
          The longer per-unit availability table on the listing detail page.
          Restricted to {MAX_STOCKLIST_ROWS} rows. All fields accept free text —
          leave blank cells empty to show as "—" on the public table.
        </p>
        {miniStocklist.length > 0 && (() => {
          const stockFields = getStocklistFields(type);
          return (
            <div className="overflow-x-auto mb-4">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b-2 border-orange/20">
                    {stockFields.map((f) => (
                      <th key={f.key} className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">{f.label}</th>
                    ))}
                    <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Price From</th>
                    <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {miniStocklist.map((r, i) => (
                    <tr key={i} className="border-b border-line last:border-0">
                      {stockFields.map((f) => {
                        const stockKey = (f.stocklistKey ?? f.key) as keyof MiniStocklistEntry;
                        const cellValue = (r[stockKey] as string | undefined) ?? "";
                        const cellClass = `border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 ${f.inputWidth ?? "w-24"}`;
                        return (
                          <td key={f.key} className="px-4 py-3">
                            {f.type === "select" ? (
                              <select
                                value={cellValue}
                                onChange={(e) => updateStocklistRow(i, stockKey, e.target.value)}
                                className={`${cellClass} cursor-pointer`}
                              >
                                <option value="">{f.placeholder ?? "—"}</option>
                                {f.options?.map((opt) => (
                                  <option key={opt} value={opt}>{opt}</option>
                                ))}
                              </select>
                            ) : (
                              <input
                                type="text"
                                value={cellValue}
                                onChange={(e) => updateStocklistRow(i, stockKey, e.target.value)}
                                placeholder={f.placeholder}
                                className={cellClass}
                              />
                            )}
                          </td>
                        );
                      })}
                      <td className="px-4 py-3">
                        <input type="text" value={r.price} onChange={(e) => updateStocklistRow(i, "price", e.target.value)} placeholder="$890,000 or Contact Agent" className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 w-56" />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => removeStocklistRow(i)}
                          className="font-mono text-[10px] uppercase tracking-widest px-3 py-2 border border-red-300 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          );
        })()}
        <button
          type="button"
          onClick={addStocklistRow}
          disabled={miniStocklist.length >= MAX_STOCKLIST_ROWS}
          className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors mr-2 disabled:opacity-40 disabled:cursor-not-allowed"
        >
          + Add row ({miniStocklist.length}/{MAX_STOCKLIST_ROWS})
        </button>
        <p className="font-sans text-xs text-ink/40 mt-3">
          Changes save when you click <strong>Save changes</strong> at the bottom of the form.
        </p>
      </div>
    </AccordionSection>
  );
}
