"use client";

import { useState } from "react";
import { cn } from "@/lib/utils";

type Freq = "weekly" | "fortnightly" | "monthly" | "annually";
type TabKey = "details" | "summary";

interface FieldState {
  amount: string;
  freq: Freq;
}

type BudgetData = Record<string, FieldState>;

const FREQ_MULTIPLIERS: Record<Freq, number> = {
  weekly: 52,
  fortnightly: 26,
  monthly: 12,
  annually: 1,
};

function toAnnual(f: FieldState): number {
  const v = parseFloat(f.amount.replace(/,/g, "")) || 0;
  return v * FREQ_MULTIPLIERS[f.freq];
}

const fmt = (n: number) =>
  "$" + Math.round(Math.abs(n)).toLocaleString("en-AU");

// ── Budget categories ─────────────────────────────────────────────────────────

const SECTIONS = [
  {
    key: "income",
    label: "Income",
    isIncome: true,
    fields: [
      { key: "salary", label: "Salary (after tax)" },
      { key: "partnerSalary", label: "Partner salary" },
      { key: "otherIncome", label: "Other income" },
      { key: "rentalIncome", label: "Rental income" },
      { key: "govBenefits", label: "Government benefits" },
    ],
  },
  {
    key: "housing",
    label: "Housing",
    isIncome: false,
    fields: [
      { key: "rentMortgage", label: "Rent / Mortgage" },
      { key: "councilRates", label: "Council rates" },
      { key: "utilities", label: "Utilities" },
      { key: "homeInsurance", label: "Home & contents insurance" },
      { key: "bodyCorp", label: "Body corporate" },
      { key: "maintenance", label: "Maintenance & repairs" },
    ],
  },
  {
    key: "transport",
    label: "Transport",
    isIncome: false,
    fields: [
      { key: "fuel", label: "Fuel" },
      { key: "carLoan", label: "Car loan repayment" },
      { key: "registration", label: "Registration & CTP" },
      { key: "carInsurance", label: "Car insurance" },
      { key: "publicTransport", label: "Public transport" },
      { key: "parking", label: "Parking & tolls" },
    ],
  },
  {
    key: "living",
    label: "Living Expenses",
    isIncome: false,
    fields: [
      { key: "groceries", label: "Groceries" },
      { key: "diningOut", label: "Dining out" },
      { key: "health", label: "Health & medical" },
      { key: "education", label: "Education" },
      { key: "childcare", label: "Childcare" },
      { key: "entertainment", label: "Entertainment" },
      { key: "clothing", label: "Clothing" },
      { key: "subscriptions", label: "Subscriptions" },
      { key: "personalCare", label: "Personal care" },
      { key: "petExpenses", label: "Pet expenses" },
    ],
  },
  {
    key: "savings",
    label: "Savings & Debts",
    isIncome: false,
    fields: [
      { key: "creditCard", label: "Credit card repayments" },
      { key: "personalLoan", label: "Personal loan repayments" },
      { key: "regularSavings", label: "Regular savings" },
      { key: "super", label: "Superannuation (extra)" },
      { key: "investments", label: "Investments" },
    ],
  },
] as const;

type SectionKey = typeof SECTIONS[number]["key"];

function makeInitialState(): BudgetData {
  const data: BudgetData = {};
  SECTIONS.forEach(section => {
    section.fields.forEach(f => {
      data[f.key] = { amount: "", freq: "monthly" };
    });
  });
  return data;
}

function FreqSelect({ value, onChange }: { value: Freq; onChange: (v: Freq) => void }) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value as Freq)}
      className="bg-[#e8e8e8] border-0 font-sans text-[11px] px-1 py-1 outline-none cursor-pointer text-navy"
    >
      <option value="weekly">Weekly</option>
      <option value="fortnightly">Fortnightly</option>
      <option value="monthly">Monthly</option>
      <option value="annually">Annually</option>
    </select>
  );
}

// ── Accordion section ─────────────────────────────────────────────────────────

function AccordionSection({
  section, data, onUpdate,
}: {
  section: typeof SECTIONS[number];
  data: BudgetData;
  onUpdate: (key: string, field: keyof FieldState, value: string) => void;
}) {
  const [open, setOpen] = useState(section.key === "income");

  const sectionTotal = section.fields.reduce(
    (sum, f) => sum + toAnnual(data[f.key]),
    0
  );

  return (
    <div className="border-b border-[#e8e8e8]">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-3 text-left"
      >
        <span className="font-sans font-semibold text-[13px] text-navy">{section.label}</span>
        <div className="flex items-center gap-3">
          {sectionTotal > 0 && (
            <span className="font-sans text-[12px] text-ink/50">{fmt(sectionTotal)}/yr</span>
          )}
          <span className={cn(
            "w-5 h-5 border border-[#ccc] flex items-center justify-center font-sans text-[14px] leading-none text-navy transition-transform",
          )}>
            {open ? "−" : "+"}
          </span>
        </div>
      </button>
      {open && (
        <div className="pb-2">
          {section.fields.map(field => (
            <div key={field.key} className="flex items-center py-1.5 gap-2 border-b border-[#f4f4f4] last:border-0">
              <span className="font-sans text-[12px] text-navy flex-1">{field.label}</span>
              <input
                type="number"
                value={data[field.key].amount}
                onChange={e => onUpdate(field.key, "amount", e.target.value)}
                placeholder="0"
                className="bg-[#f0f0f0] border-0 font-sans text-[12px] px-2 py-1 text-right w-[70px] outline-none focus:ring-1 focus:ring-orange/40"
              />
              <FreqSelect value={data[field.key].freq} onChange={v => onUpdate(field.key, "freq", v)} />
              <span className="font-sans text-[11px] text-ink/40 w-[70px] text-right">
                {fmt(toAnnual(data[field.key]))}/yr
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BudgetPlanner() {
  const [tab, setTab] = useState<TabKey>("details");
  const [data, setData] = useState<BudgetData>(makeInitialState);

  function updateField(key: string, field: keyof FieldState, value: string) {
    setData(prev => ({ ...prev, [key]: { ...prev[key], [field]: value } }));
  }

  const incomeSection = SECTIONS.find(s => s.isIncome)!;
  const expenseSections = SECTIONS.filter(s => !s.isIncome);

  const totalAnnualIncome = incomeSection.fields.reduce(
    (sum, f) => sum + toAnnual(data[f.key]),
    0
  );
  const totalAnnualExpenses = expenseSections.reduce(
    (sum, section) => sum + section.fields.reduce((s2, f) => s2 + toAnnual(data[f.key]), 0),
    0
  );
  const annualSurplus = totalAnnualIncome - totalAnnualExpenses;
  const monthlySurplus = annualSurplus / 12;

  return (
    <div className="max-w-4xl">
      <h2 className="font-sans font-semibold text-navy text-[1.1rem] mb-5">
        Budget Planner 2025 – 2026
      </h2>

      {/* Tabs */}
      <div className="flex border border-[#ccc] w-fit overflow-hidden mb-6">
        {([
          { key: "details" as TabKey, label: "Enter Details" },
          { key: "summary" as TabKey, label: "View Summary" },
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Income */}
          <div>
            <p className="text-orange font-sans font-semibold text-[15px] mb-3">Income</p>
            <AccordionSection section={incomeSection} data={data} onUpdate={updateField} />
          </div>

          {/* Expenses */}
          <div>
            <p className="text-orange font-sans font-semibold text-[15px] mb-3">Expenses</p>
            {expenseSections.map(section => (
              <AccordionSection key={section.key} section={section} data={data} onUpdate={updateField} />
            ))}
          </div>
        </div>
      ) : (
        /* ── Summary tab ── */
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Left: breakdown */}
          <div>
            <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">Income Summary</p>
            <div className="space-y-1.5 mb-6">
              {incomeSection.fields.map(f => {
                const annual = toAnnual(data[f.key]);
                if (!annual) return null;
                return (
                  <div key={f.key} className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
                    <span className="text-navy">{f.label}</span>
                    <span className="text-ink font-medium">{fmt(annual)}/yr</span>
                  </div>
                );
              })}
              <div className="flex justify-between text-[13px] font-sans pt-1">
                <span className="text-orange font-semibold">Total Annual Income</span>
                <span className="text-orange font-semibold">{fmt(totalAnnualIncome)}/yr</span>
              </div>
            </div>

            <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">Expense Summary</p>
            <div className="space-y-1.5">
              {expenseSections.map(section => {
                const total = section.fields.reduce((s, f) => s + toAnnual(data[f.key]), 0);
                if (!total) return null;
                return (
                  <div key={section.key} className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
                    <span className="text-navy">{section.label}</span>
                    <span className="text-ink font-medium">{fmt(total)}/yr</span>
                  </div>
                );
              })}
              <div className="flex justify-between text-[13px] font-sans pt-1">
                <span className="text-orange font-semibold">Total Annual Expenses</span>
                <span className="text-orange font-semibold">{fmt(totalAnnualExpenses)}/yr</span>
              </div>
            </div>
          </div>

          {/* Right: surplus/deficit */}
          <div>
            <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">
              {annualSurplus >= 0 ? "Surplus" : "Deficit"}
            </p>
            <div className="space-y-2 mb-6">
              {[
                { label: "Annual income", value: fmt(totalAnnualIncome) },
                { label: "Annual expenses", value: fmt(totalAnnualExpenses) },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
                  <span className="text-navy">{row.label}</span>
                  <span className="text-ink font-medium">{row.value}</span>
                </div>
              ))}
              <div className="flex justify-between text-[13px] font-sans pt-1">
                <span className="text-orange font-semibold">Annual {annualSurplus >= 0 ? "surplus" : "deficit"}</span>
                <span className={cn("font-semibold text-[13px]", annualSurplus >= 0 ? "text-orange" : "text-red-500")}>
                  {annualSurplus >= 0 ? "+" : "−"}{fmt(annualSurplus)}/yr
                </span>
              </div>
            </div>

            <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">Monthly Overview</p>
            <div className="space-y-2">
              {[
                { label: "Monthly income", value: fmt(totalAnnualIncome / 12) },
                { label: "Monthly expenses", value: fmt(totalAnnualExpenses / 12) },
              ].map(row => (
                <div key={row.label} className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
                  <span className="text-navy">{row.label}</span>
                  <span className="text-ink font-medium">{row.value}/mo</span>
                </div>
              ))}
              <div className="flex justify-between text-[13px] font-sans pt-1">
                <span className="text-orange font-semibold">Monthly {monthlySurplus >= 0 ? "surplus" : "deficit"}</span>
                <span className={cn("font-semibold text-[13px]", monthlySurplus >= 0 ? "text-orange" : "text-red-500")}>
                  {monthlySurplus >= 0 ? "+" : "−"}{fmt(monthlySurplus)}/mo
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
