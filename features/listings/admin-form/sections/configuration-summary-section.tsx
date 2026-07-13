"use client";

import { getCardFields } from "@/lib/listing-card-fields";
import { AccordionSection } from "../fields/accordion-section";
import { ExampleHint } from "../fields/example-hint";
import { CardPreview } from "../fields/card-preview";
import { MAX_CONFIG_SUMMARY_ROWS } from "../constants";
import type { FloorPlan } from "../types";

interface Props {
  isNew: boolean;
  isPortal: boolean;
  type: string;
  floorPlans: FloorPlan[];
  addFloorPlan: () => void;
  removeFloorPlan: (index: number) => void;
  updateFloorPlan: (index: number, field: keyof FloorPlan, value: string) => void;
  setPendingDeleteIndex: (i: number | null) => void;
  setFloorPlanDeleteText: (v: string) => void;
}

export function ConfigurationSummarySection({
  isNew,
  isPortal,
  type,
  floorPlans,
  addFloorPlan,
  removeFloorPlan,
  updateFloorPlan,
  setPendingDeleteIndex,
  setFloorPlanDeleteText,
}: Props) {
  return (
    <AccordionSection title="Configuration Summary">
      {isNew ? (
        <p className="font-sans text-sm text-ink/40 italic">Save the listing first to add unit configurations.</p>
      ) : (
        <div>
          <div className="mb-4 flex items-center">
            <p className="font-sans text-xs text-ink/50">
              Up to 4 rows shown on the public listing card.
            </p>
            <ExampleHint title="Where Configuration Summary appears">
              <p>Each row you add here becomes one line of the <strong>Properties Available</strong> stats strip on the listing card on search results.</p>
              <p className="text-ink/50 text-xs">Max 4 rows — the card has space for 4 lines plus the price.</p>
              <CardPreview highlight="summary" />
            </ExampleHint>
          </div>
          {floorPlans.length > 0 && (() => {
            const cardFields = getCardFields(type);
            return (
              <div className="overflow-x-auto mb-4">
                <table className="w-full text-left">
                  <thead>
                    <tr className="border-b-2 border-orange/20">
                      {cardFields.map((f) => (
                        <th key={f.key} className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">{f.label}</th>
                      ))}
                      <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Price From ($)</th>
                      <th className="font-sans text-sm font-semibold text-ink/70 px-4 py-3 whitespace-nowrap">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {floorPlans.map((fp, i) => (
                      <tr key={i} className="border-b border-line last:border-0">
                        {cardFields.map((f) => {
                          const cellValue = (fp[f.key as keyof FloorPlan] as string) ?? "";
                          const cellClass = `border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 ${f.inputWidth ?? "w-24"}`;
                          return (
                            <td key={f.key} className="px-4 py-3">
                              {f.type === "select" ? (
                                <select
                                  value={cellValue}
                                  onChange={(e) => updateFloorPlan(i, f.key as keyof FloorPlan, e.target.value)}
                                  className={`${cellClass} cursor-pointer`}
                                >
                                  <option value="">{f.placeholder ?? "—"}</option>
                                  {f.options?.map((opt) => (
                                    <option key={opt} value={opt}>{opt}</option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type={f.type}
                                  value={cellValue}
                                  onChange={(e) => updateFloorPlan(i, f.key as keyof FloorPlan, e.target.value)}
                                  placeholder={f.placeholder}
                                  className={cellClass}
                                />
                              )}
                            </td>
                          );
                        })}
                        <td className="px-4 py-3">
                          <input type="number" value={fp.price_from} onChange={(e) => updateFloorPlan(i, "price_from", e.target.value)} placeholder="650000" className="border border-line px-3 py-2 bg-white font-sans text-sm text-ink outline-none focus:border-orange/60 w-32" />
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={() => {
                              if (isPortal) {
                                setFloorPlanDeleteText("");
                                setPendingDeleteIndex(i);
                              } else {
                                removeFloorPlan(i);
                              }
                            }}
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
            onClick={addFloorPlan}
            disabled={floorPlans.length >= MAX_CONFIG_SUMMARY_ROWS}
            className="font-mono text-[10px] uppercase tracking-widest px-4 py-2 border border-orange text-orange hover:bg-orange hover:text-white transition-colors mr-2 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            + Add ({floorPlans.length}/{MAX_CONFIG_SUMMARY_ROWS})
          </button>
          {floorPlans.length >= MAX_CONFIG_SUMMARY_ROWS && (
            <p className="font-sans text-xs text-orange mt-2">
              Maximum of {MAX_CONFIG_SUMMARY_ROWS} configurations reached. This is what shows on the public listing card.
            </p>
          )}
          <p className="font-sans text-xs text-ink/40 mt-3">
            Changes save when you click <strong>Save changes</strong> at the bottom of the form.
          </p>
        </div>
      )}
    </AccordionSection>
  );
}
