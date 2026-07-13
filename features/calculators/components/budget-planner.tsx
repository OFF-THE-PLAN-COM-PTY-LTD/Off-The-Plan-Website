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

// Helper: convert annual total to all four summary frequencies
function toFreqs(annual: number) {
  return {
    weekly: annual / 52,
    fortnightly: annual / 26,
    monthly: annual / 12,
    annual,
  };
}

const fmtSummary = (n: number) =>
  "$" + Math.round(Math.abs(n)).toLocaleString("en-AU");

function SummaryView({ data }: { data: BudgetData }) {
  const incomeSection = SECTIONS.find(s => s.isIncome)!;
  const expenseSections = SECTIONS.filter(s => !s.isIncome);

  // Combine Insurance + Superannuation into one row
  const SUMMARY_EXPENSE_ROWS: { label: string; keys: string[] }[] = [
    { label: "Home Expenses",              keys: SECTIONS.find(s => s.key === "homeExpenses")!.fields.map(f => f.key) },
    { label: "Living Expenses",            keys: SECTIONS.find(s => s.key === "livingExpenses")!.fields.map(f => f.key) },
    { label: "Vehicle & Transport",        keys: SECTIONS.find(s => s.key === "transport")!.fields.map(f => f.key) },
    { label: "Mortgage & Debt Repayments", keys: SECTIONS.find(s => s.key === "mortgageDebt")!.fields.map(f => f.key) },
    { label: "Leisure and Entertainment",  keys: SECTIONS.find(s => s.key === "leisure")!.fields.map(f => f.key) },
    {
      label: "Insurance and Superannuation",
      keys: [
        ...SECTIONS.find(s => s.key === "insurance")!.fields.map(f => f.key),
        ...SECTIONS.find(s => s.key === "superannuation")!.fields.map(f => f.key),
      ],
    },
  ];

  const incomeAnnual = incomeSection.fields.reduce((sum, f) => sum + toAnnual(data[f.key]), 0);

  const expenseRows = SUMMARY_EXPENSE_ROWS.map(row => ({
    label: row.label,
    annual: row.keys.reduce((sum, k) => sum + toAnnual(data[k]), 0),
  }));

  const totalExpenseAnnual = expenseRows.reduce((sum, r) => sum + r.annual, 0);
  const surplusAnnual = incomeAnnual - totalExpenseAnnual;
  const isSurplus = surplusAnnual >= 0;

  const FREQ_COLS: { key: keyof ReturnType<typeof toFreqs>; label: string }[] = [
    { key: "weekly",       label: "Weekly" },
    { key: "fortnightly",  label: "Fortnightly" },
    { key: "monthly",      label: "Monthly" },
    { key: "annual",       label: "Annual" },
  ];

  const incomeFreqs   = toFreqs(incomeAnnual);
  const expenseFreqs  = toFreqs(totalExpenseAnnual);
  const surplusFreqs  = toFreqs(Math.abs(surplusAnnual));

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[480px] border-collapse">
        <thead>
          <tr>
            <th className="text-left font-sans font-normal text-[13px] text-navy py-2 pr-4 w-auto" />
            {FREQ_COLS.map(col => (
              <th key={col.key} className="text-right font-sans font-semibold text-[13px] text-orange py-2 px-3 w-[100px]">
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {/* Total Income row */}
          <tr className="border-b border-dashed border-[#ddd]">
            <td className="font-sans text-[13px] text-navy py-2.5 pr-4">Total Income</td>
            {FREQ_COLS.map(col => (
              <td key={col.key} className="text-right font-sans text-[13px] text-ink py-2.5 px-3">
                {fmtSummary(incomeFreqs[col.key])}
              </td>
            ))}
          </tr>

          {/* Expense rows */}
          {expenseRows.map(row => (
            <tr key={row.label} className="border-b border-dashed border-[#ddd]">
              <td className="font-sans text-[13px] text-navy py-2.5 pr-4">{row.label}</td>
              {FREQ_COLS.map(col => {
                const freqs = toFreqs(row.annual);
                return (
                  <td key={col.key} className="text-right font-sans text-[13px] text-ink py-2.5 px-3">
                    {fmtSummary(freqs[col.key])}
                  </td>
                );
              })}
            </tr>
          ))}

          {/* Total Expense row */}
          <tr className="border-b border-[#bbb]">
            <td className="font-sans text-[13px] text-navy font-semibold py-2.5 pr-4">Total Expense</td>
            {FREQ_COLS.map(col => (
              <td key={col.key} className="text-right font-sans text-[13px] text-ink font-semibold py-2.5 px-3">
                {fmtSummary(expenseFreqs[col.key])}
              </td>
            ))}
          </tr>

          {/* Surplus / Deficit row */}
          <tr>
            <td className={cn(
              "font-sans text-[13px] font-bold py-3 pr-4 uppercase tracking-wide",
              isSurplus ? "text-orange" : "text-red-500"
            )}>
              {isSurplus ? "Surplus" : "Deficit"}
            </td>
            {FREQ_COLS.map(col => (
              <td key={col.key} className={cn(
                "text-right font-sans text-[13px] font-semibold py-3 px-3",
                isSurplus ? "text-orange" : "text-red-500"
              )}>
                {isSurplus ? "" : "−"}{fmtSummary(surplusFreqs[col.key])}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
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

          {/* Details action bar */}
          <div className="flex gap-2 mt-5 flex-wrap">
            {([
              { label: "Open All",  action: () => setOpenSections(makeOpen(true)),  variant: "navy"   },
              { label: "Close All", action: () => setOpenSections(makeOpen(false)), variant: "navy"   },
              { label: "Clear All", action: () => setData(makeData()),              variant: "navy"   },
              { label: "Print",     action: () => window.print(),                  variant: "orange" },
              { label: "About",     action: () => setShowAbout(true),              variant: "orange" },
            ] as { label: string; action: () => void; variant: "navy" | "orange" }[]).map(btn => (
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
        <>
          <SummaryView data={data} />

          {/* Summary action bar */}
          <div className="flex gap-2 mt-6">
            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 bg-orange text-white font-sans text-[12px] px-5 py-2 hover:bg-orange/90 transition-colors"
            >
              {/* printer icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
              Print
            </button>
            <button
              onClick={() => setShowAbout(true)}
              className="flex items-center gap-1.5 bg-orange text-white font-sans text-[12px] px-5 py-2 hover:bg-orange/90 transition-colors"
            >
              {/* list icon */}
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/>
                <line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/>
                <line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
              About
            </button>
          </div>
        </>
      )}

      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
    </div>
  );
}
