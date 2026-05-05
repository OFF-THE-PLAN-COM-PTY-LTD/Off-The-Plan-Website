"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

type Freq = "weekly" | "fortnightly" | "monthly" | "quarterly" | "annually";
type Tab = "details" | "summary";

interface FieldState {
  amount: string;
  freq: Freq;
}

type BudgetData = Record<string, FieldState>;

interface SectionConfig {
  key: string;
  label: string;
  isIncome: boolean;
  totalLabel: string;
  fields: { key: string; label: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const FREQ_MUL: Record<Freq, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  quarterly: 4,
  annually: 1,
};

function toAnnual(f: FieldState): number {
  const v = parseFloat(f.amount) || 0;
  return v * FREQ_MUL[f.freq];
}

const fmt = (n: number) =>
  "$" + Math.round(Math.abs(n)).toLocaleString("en-AU");

const SECTIONS: SectionConfig[] = [
  {
    key: "income",
    label: "Total Income",
    isIncome: true,
    totalLabel: "Total annual income",
    fields: [
      { key: "netSalary", label: "Net salary" },
      { key: "netBonuses", label: "Net bonuses" },
      { key: "partnerSalary", label: "Net salary – partner" },
      { key: "partnerBonuses", label: "Net bonuses – partner" },
      { key: "investmentIncome", label: "Investment income" },
      { key: "pensions", label: "Pensions & allowances" },
      { key: "rentalIncome", label: "Rental / asset income" },
      { key: "otherIncome", label: "Other income" },
    ],
  },
  {
    key: "homeExpenses",
    label: "Home Expenses",
    isIncome: false,
    totalLabel: "Total annual home expense",
    fields: [
      { key: "homeMaintenance", label: "Home maintenance & renovations" },
      { key: "councilRates", label: "Rates & levies (council, water etc.)" },
      { key: "gardening", label: "Gardening & pool expenses" },
      { key: "homeServices", label: "Home services (cleaning etc.)" },
      { key: "pestControl", label: "Pest control" },
      { key: "phone", label: "Phone, mobile & internet" },
      { key: "utilities", label: "Utilities (electricity, gas etc.)" },
      { key: "homeOther", label: "Other" },
    ],
  },
  {
    key: "livingExpenses",
    label: "Living Expenses",
    isIncome: false,
    totalLabel: "Total annual living expense",
    fields: [
      { key: "groceries", label: "Groceries & food" },
      { key: "clothing", label: "Clothes & shoes" },
      { key: "household", label: "Household purchases" },
      { key: "medical", label: "Medical & pharmaceutical" },
      { key: "childcare", label: "Child care & child minding" },
      { key: "petCare", label: "Pet care" },
      { key: "laundry", label: "Laundry & dry cleaning" },
      { key: "education", label: "Education expenses" },
      { key: "livingOther", label: "Other" },
    ],
  },
  {
    key: "transport",
    label: "Vehicle & Transport",
    isIncome: false,
    totalLabel: "Total annual vehicle & transport",
    fields: [
      { key: "registration", label: "Registration fees" },
      { key: "carMaintenance", label: "Maintenance & repairs" },
      { key: "petrol", label: "Petrol" },
      { key: "transportFares", label: "Transport & fares" },
      { key: "parking", label: "Parking" },
      { key: "transportOther", label: "Other" },
    ],
  },
  {
    key: "mortgageDebt",
    label: "Mortgage & Debt Repayments",
    isIncome: false,
    totalLabel: "Total annual mortgage & debt",
    fields: [
      { key: "mortgage", label: "Mortgage repayments" },
      { key: "personalLoan", label: "Personal loan repayments" },
      { key: "creditCard", label: "Credit card repayments" },
      { key: "carLoan", label: "Car loan repayments" },
      { key: "otherDebt", label: "Other debt repayments" },
    ],
  },
  {
    key: "leisure",
    label: "Leisure & Entertainment",
    isIncome: false,
    totalLabel: "Total annual leisure",
    fields: [
      { key: "diningOut", label: "Dining out & takeaway" },
      { key: "travel", label: "Travel & holidays" },
      { key: "hobbies", label: "Hobbies & sport" },
      { key: "streaming", label: "Streaming & subscriptions" },
      { key: "leisureOther", label: "Other" },
    ],
  },
  {
    key: "insurance",
    label: "Insurance",
    isIncome: false,
    totalLabel: "Total annual insurance",
    fields: [
      { key: "lifeInsurance", label: "Life insurance" },
      { key: "healthInsurance", label: "Health insurance" },
      { key: "incomeProtection", label: "Income protection" },
      { key: "carInsurance", label: "Car insurance" },
      { key: "homeInsurance", label: "Home & contents insurance" },
      { key: "insuranceOther", label: "Other" },
    ],
  },
  {
    key: "superannuation",
    label: "Superannuation",
    isIncome: false,
    totalLabel: "Total annual superannuation",
    fields: [
      { key: "superEmployer", label: "Employer contributions" },
      { key: "superExtra", label: "Additional voluntary contributions" },
      { key: "superSalSacrifice", label: "Salary sacrifice" },
    ],
  },
];

function makeData(): BudgetData {
  const d: BudgetData = {};
  SECTIONS.forEach(s => s.fields.forEach(f => {
    d[f.key] = { amount: "", freq: "monthly" };
  }));
  return d;
}

function makeOpen(v: boolean): Record<string, boolean> {
  return Object.fromEntries(SECTIONS.map(s => [s.key, v]));
}

// ─── About Modal ─────────────────────────────────────────────────────────────

function AboutModal({ onClose }: { onClose: () => void }) {
  const [mounted, setMounted] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    setMounted(true);
    requestAnimationFrame(() => setVisible(true));
    return () => setMounted(false);
  }, []);

  function close() {
    setVisible(false);
    setTimeout(onClose, 180);
  }

  if (!mounted) return null;

  return createPortal(
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center bg-black/40 transition-opacity duration-150",
        visible ? "opacity-100" : "opacity-0"
      )}
      onClick={close}
    >
      <div
        className={cn(
          "bg-white w-full max-w-md mx-4 shadow-xl transition-all duration-150",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-end px-4 pt-3">
          <button onClick={close} className="text-ink/40 hover:text-ink text-[22px] leading-none">×</button>
        </div>
        <div className="px-6 pb-4">
          <div className="border-l-4 border-orange pl-4">
            <p className="font-sans font-semibold text-orange text-[15px] mb-2">Description</p>
            <p className="font-sans text-[13px] text-ink/70 leading-relaxed">
              The Budget Planner can help you work out your income and expenses and find out your financial position.
            </p>
          </div>
        </div>
        <div className="flex justify-end px-6 pb-5">
          <button
            onClick={close}
            className="font-sans text-[13px] text-navy border border-navy/30 px-5 py-1.5 hover:bg-navy hover:text-white transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Section Accordion ────────────────────────────────────────────────────────

function SectionAccordion({
  section, data, open, onToggle, onUpdate,
}: {
  section: SectionConfig;
  data: BudgetData;
  open: boolean;
  onToggle: () => void;
  onUpdate: (key: string, field: "amount" | "freq", value: string) => void;
}) {
  const sectionTotal = section.fields.reduce((sum, f) => sum + toAnnual(data[f.key]), 0);

  return (
    <div className="border-b border-[#e0e0e0] last:border-b-0">
      {/* Header */}
      <button
        onClick={onToggle}
        className="w-full flex items-center justify-between bg-[#f5f5f5] px-5 py-3 text-left hover:bg-[#efefef] transition-colors group"
      >
        <div className="flex items-center gap-3">
          <div className={cn("w-[3px] h-4", section.isIncome ? "bg-orange" : "bg-navy/40")} />
          <span className="font-sans font-semibold text-[13px] text-navy">{section.label}</span>
          {sectionTotal > 0 && (
            <span className={cn(
              "font-sans text-[11px] px-2 py-0.5",
              section.isIncome
                ? "bg-orange/10 text-orange"
                : "text-ink/50 bg-white border border-[#e0e0e0]"
            )}>
              {fmt(sectionTotal)}/yr
            </span>
          )}
        </div>
        <span className="w-6 h-6 border border-[#d0d0d0] bg-white flex items-center justify-center font-sans text-[16px] leading-none text-navy/60 group-hover:border-orange group-hover:text-orange transition-colors flex-shrink-0">
          {open ? "−" : "+"}
        </span>
      </button>

      {open && (
        <div>
          {/* Column headers */}
          <div className="hidden sm:flex items-center px-5 py-2 bg-white border-b border-[#f0f0f0]">
            <span className="flex-1 font-sans text-[10px] text-ink/40 uppercase tracking-wider">Description</span>
            <span className="w-[130px] font-sans text-[10px] text-ink/40 uppercase tracking-wider">Frequency</span>
            <span className="w-[88px] text-right font-sans text-[10px] text-ink/40 uppercase tracking-wider">Amount</span>
            <span className="w-[88px] text-right font-sans text-[10px] text-ink/40 uppercase tracking-wider pr-0.5">Annual</span>
          </div>

          {/* Field rows */}
          {section.fields.map(field => {
            const annual = toAnnual(data[field.key]);
            return (
              <div
                key={field.key}
                className="flex items-center px-5 py-2 border-b border-[#f5f5f5] last:border-0 hover:bg-[#fafafa]"
              >
                <span className="flex-1 font-sans text-[12px] text-navy pr-3 leading-snug">{field.label}</span>
                <div className="w-[130px]">
                  <select
                    value={data[field.key].freq}
                    onChange={e => onUpdate(field.key, "freq", e.target.value)}
                    className="bg-[#ebebeb] border-0 font-sans text-[11px] px-2 py-1 outline-none cursor-pointer text-navy w-[120px]"
                  >
                    <option value="weekly">Weekly</option>
                    <option value="fortnightly">Fortnightly</option>
                    <option value="monthly">Monthly</option>
                    <option value="quarterly">Quarterly</option>
                    <option value="annually">Annually</option>
                  </select>
                </div>
                <div className="w-[88px] flex justify-end">
                  <input
                    type="number"
                    value={data[field.key].amount}
                    onChange={e => onUpdate(field.key, "amount", e.target.value)}
                    placeholder="0"
                    className="bg-[#f0f0f0] border-0 font-sans text-[12px] px-2 py-1 text-right w-[78px] outline-none focus:ring-1 focus:ring-orange/40"
                  />
                </div>
                <div className="w-[88px] text-right">
                  <span className={cn(
                    "font-sans text-[12px]",
                    annual > 0 ? "text-navy font-medium" : "text-ink/25"
                  )}>
                    {fmt(annual)}
                  </span>
                </div>
              </div>
            );
          })}

          {/* Section footer total */}
          <div className="flex items-center px-5 py-2.5 bg-[#fafafa] border-t border-[#e8e8e8]">
            <span className="flex-1 font-sans text-[11px] text-ink/50 italic">{section.totalLabel}:</span>
            <span className={cn(
              "font-sans text-[13px] font-semibold w-[88px] text-right",
              section.isIncome ? "text-orange" : "text-navy"
            )}>
              {fmt(sectionTotal)}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Summary Tab ─────────────────────────────────────────────────────────────

function SummaryView({ data }: { data: BudgetData }) {
  const incomeSection = SECTIONS.find(s => s.isIncome)!;
  const expenseSections = SECTIONS.filter(s => !s.isIncome);

  const totalIncome = incomeSection.fields.reduce((sum, f) => sum + toAnnual(data[f.key]), 0);
  const expSectionTotals = expenseSections.map(s => ({
    ...s,
    total: s.fields.reduce((sum, f) => sum + toAnnual(data[f.key]), 0),
  }));
  const totalExpenses = expSectionTotals.reduce((sum, s) => sum + s.total, 0);
  const surplus = totalIncome - totalExpenses;
  const isSurplus = surplus >= 0;

  return (
    <div>
      {/* Financial position banner */}
      <div className={cn(
        "border-l-4 p-5 mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4",
        isSurplus ? "border-orange bg-orange/5" : "border-red-400 bg-red-50"
      )}>
        <div>
          <p className="font-sans text-[10px] uppercase tracking-wider text-ink/50 mb-0.5">
            Monthly {isSurplus ? "surplus" : "deficit"}
          </p>
          <p className={cn("font-sans font-bold leading-none", isSurplus ? "text-orange" : "text-red-500")}>
            <span className="text-[2.2rem]">{isSurplus ? "+" : "−"}{fmt(Math.abs(surplus / 12))}</span>
            <span className="text-[13px] font-normal ml-1.5">/mo</span>
          </p>
          <p className="font-sans text-[11px] text-ink/40 mt-1">
            {fmt(Math.abs(surplus))}/yr · {isSurplus ? "income exceeds expenses" : "expenses exceed income"}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:gap-4">
          {[
            { label: "Monthly income", value: fmt(totalIncome / 12) },
            { label: "Monthly expenses", value: fmt(totalExpenses / 12) },
          ].map(item => (
            <div key={item.label} className="bg-white/70 px-4 py-3 text-center">
              <p className="font-sans text-[10px] text-ink/40 uppercase tracking-wide mb-0.5">{item.label}</p>
              <p className="font-sans text-[15px] font-semibold text-navy">{item.value}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Income vs Expenses comparison */}
        <div>
          <p className="text-orange font-sans font-semibold text-[14px] border-b border-orange pb-1 mb-4">Income vs. Expenses</p>

          {[
            { label: "Total annual income", value: totalIncome, color: "bg-orange", pct: 100 },
            { label: "Total annual expenses", value: totalExpenses, color: "bg-navy", pct: totalIncome > 0 ? Math.min(100, (totalExpenses / totalIncome) * 100) : 0 },
          ].map(row => (
            <div key={row.label} className="mb-5">
              <div className="flex justify-between font-sans text-[12px] mb-1.5">
                <span className="text-navy">{row.label}</span>
                <span className="font-medium text-ink">{fmt(row.value)}</span>
              </div>
              <div className="h-2 bg-[#ebebeb] overflow-hidden">
                <div
                  className={cn("h-full transition-all duration-500", row.color)}
                  style={{ width: `${row.pct}%` }}
                />
              </div>
            </div>
          ))}

          <div className="border-t border-[#e8e8e8] pt-4 mt-2 flex justify-between font-sans text-[13px]">
            <span className="text-navy font-semibold">Annual {isSurplus ? "surplus" : "deficit"}</span>
            <span className={cn("font-semibold", isSurplus ? "text-orange" : "text-red-500")}>
              {isSurplus ? "+" : "−"}{fmt(Math.abs(surplus))}
            </span>
          </div>

          {/* Income breakdown */}
          <p className="text-orange font-sans font-semibold text-[14px] border-b border-orange pb-1 mb-3 mt-8">Income Breakdown</p>
          <div className="space-y-1.5">
            {incomeSection.fields.map(f => {
              const annual = toAnnual(data[f.key]);
              if (!annual) return null;
              return (
                <div key={f.key} className="flex justify-between text-[12px] font-sans border-b border-[#f0f0f0] pb-1.5">
                  <span className="text-navy">{f.label}</span>
                  <span className="text-ink font-medium">{fmt(annual)}</span>
                </div>
              );
            })}
            {totalIncome > 0 && (
              <div className="flex justify-between text-[12px] font-sans pt-0.5">
                <span className="text-orange font-semibold">Total</span>
                <span className="text-orange font-semibold">{fmt(totalIncome)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Right: Expense breakdown by category */}
        <div>
          <p className="text-orange font-sans font-semibold text-[14px] border-b border-orange pb-1 mb-4">Expense Breakdown</p>
          {expSectionTotals.map(section => {
            const pct = totalExpenses > 0 ? (section.total / totalExpenses) * 100 : 0;
            return (
              <div key={section.key} className="mb-4">
                <div className="flex justify-between font-sans text-[12px] mb-1.5">
                  <span className="text-navy">{section.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-ink/50 text-[11px]">{Math.round(pct)}%</span>
                    <span className="text-ink font-medium">{fmt(section.total)}</span>
                  </div>
                </div>
                <div className="h-1.5 bg-[#ebebeb] overflow-hidden">
                  <div
                    className="h-full bg-navy/50 transition-all duration-500"
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
          {totalExpenses > 0 && (
            <div className="border-t border-[#e8e8e8] pt-3 mt-2 flex justify-between font-sans text-[13px]">
              <span className="text-navy font-semibold">Total annual expenses</span>
              <span className="font-semibold text-navy">{fmt(totalExpenses)}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BudgetPlanner() {
  const [tab, setTab] = useState<Tab>("details");
  const [data, setData] = useState<BudgetData>(makeData);
  const [openSections, setOpenSections] = useState<Record<string, boolean>>(makeOpen(true));
  const [showAbout, setShowAbout] = useState(false);

  function update(key: string, field: "amount" | "freq", value: string) {
    setData(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  const ACTION_BUTTONS = [
    { label: "Open All", action: () => setOpenSections(makeOpen(true)), variant: "navy" },
    { label: "Close All", action: () => setOpenSections(makeOpen(false)), variant: "navy" },
    { label: "Clear All", action: () => setData(makeData()), variant: "navy" },
    { label: "Print", action: () => window.print(), variant: "navy" },
    { label: "About", action: () => setShowAbout(true), variant: "orange" },
  ] as const;

  return (
    <div className="max-w-5xl">
      <h2 className="font-sans font-semibold text-navy text-[1.1rem] mb-5">
        Budget Planner 2025 – 2026
      </h2>

      {/* Tabs */}
      <div className="flex border border-[#ccc] w-fit overflow-hidden mb-6">
        {([
          { key: "details" as Tab, label: "Enter your details" },
          { key: "summary" as Tab, label: "View summary" },
        ]).map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={cn(
              "px-6 py-2 font-sans text-[13px] border-r last:border-r-0 border-[#ccc] transition-colors",
              tab === t.key ? "bg-orange text-white" : "bg-white text-navy hover:bg-orange/10",
            )}
          >
            {t.label}
          </button>
        ))}
      </div>

      {tab === "details" ? (
        <>
          {/* Accordion */}
          <div className="border border-[#e0e0e0] overflow-hidden">
            {SECTIONS.map(section => (
              <SectionAccordion
                key={section.key}
                section={section}
                data={data}
                open={!!openSections[section.key]}
                onToggle={() =>
                  setOpenSections(prev => ({ ...prev, [section.key]: !prev[section.key] }))
                }
                onUpdate={update}
              />
            ))}
          </div>

          {/* Action bar */}
          <div className="flex gap-2 mt-5 flex-wrap">
            {ACTION_BUTTONS.map(btn => (
              <button
                key={btn.label}
                onClick={btn.action}
                className={cn(
                  "font-sans text-[12px] px-5 py-1.5 border transition-colors",
                  btn.variant === "orange"
                    ? "border-orange text-orange hover:bg-orange hover:text-white"
                    : "border-navy text-navy hover:bg-navy hover:text-white"
                )}
              >
                {btn.label}
              </button>
            ))}
          </div>
        </>
      ) : (
        <SummaryView data={data} />
      )}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
