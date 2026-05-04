"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type Freq = "monthly" | "fortnightly" | "weekly" | "annually";

const FREQ_MULTIPLIERS: Record<Freq, number> = {
  monthly: 12,
  fortnightly: 26,
  weekly: 52,
  annually: 1,
};

function toAnnual(amount: string, freq: Freq): number {
  const v = parseFloat(amount.replace(/,/g, "")) || 0;
  return v * FREQ_MULTIPLIERS[freq];
}

function toMonthly(amount: string, freq: Freq): number {
  return toAnnual(amount, freq) / 12;
}

const fmt = (n: number) =>
  "$" + Math.round(Math.max(0, n)).toLocaleString("en-AU");

const fmtDec = (n: number) =>
  "$" + Math.max(0, n).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ── Shared UI components ──────────────────────────────────────────────────────

function Toggle<T extends string>({
  options, value, onChange, label,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (v: T) => void;
  label: string;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#e8e8e8] py-2.5">
      <span className="font-sans text-[13px] text-navy">{label}</span>
      <div className="flex border border-[#ccc] overflow-hidden">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={cn(
              "px-5 py-1.5 font-sans text-[13px] transition-colors",
              value === opt.value
                ? "bg-orange text-white"
                : "bg-white text-navy hover:bg-orange/10",
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

function NumberButtons({
  label, value, onChange, options,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
  options: number[];
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#e8e8e8] py-2.5">
      <span className="font-sans text-[13px] text-navy">{label}</span>
      <div className="flex border border-[#ccc] overflow-hidden">
        {options.map((n) => (
          <button
            key={n}
            onClick={() => onChange(n)}
            className={cn(
              "w-9 py-1.5 font-sans text-[13px] text-center border-r last:border-r-0 border-[#ccc] transition-colors",
              value === n ? "bg-orange text-white" : "bg-white text-navy hover:bg-orange/10",
            )}
          >
            {n === 5 ? "5+" : n}
          </button>
        ))}
      </div>
    </div>
  );
}

function AmountFreqRow({
  label, amount, freq, onAmount, onFreq,
}: {
  label: string;
  amount: string;
  freq: Freq;
  onAmount: (v: string) => void;
  onFreq: (v: Freq) => void;
}) {
  return (
    <div className="flex items-center justify-between border-b border-[#e8e8e8] py-2.5 gap-2">
      <span className="font-sans text-[13px] text-navy flex-1">{label}</span>
      <div className="flex">
        <input
          type="number"
          value={amount}
          onChange={(e) => onAmount(e.target.value)}
          placeholder="0"
          className="bg-[#f0f0f0] border-0 font-sans text-[13px] px-2 py-1.5 text-right w-[80px] outline-none focus:ring-1 focus:ring-orange/40"
        />
        <select
          value={freq}
          onChange={(e) => onFreq(e.target.value as Freq)}
          className="bg-[#e8e8e8] border-0 font-sans text-[11px] px-1 py-1.5 outline-none focus:ring-1 focus:ring-orange/40 cursor-pointer text-navy"
        >
          <option value="monthly">Monthly</option>
          <option value="fortnightly">Fortnightly</option>
          <option value="weekly">Weekly</option>
          <option value="annually">Annually</option>
        </select>
      </div>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────

export default function BorrowingPowerCalculator() {
  const [joint, setJoint] = useState<"no" | "yes">("no");
  const [dependants, setDependants] = useState(0);

  const [salary1, setSalary1] = useState("");
  const [salary1Freq, setSalary1Freq] = useState<Freq>("annually");
  const [salary2, setSalary2] = useState("");
  const [salary2Freq, setSalary2Freq] = useState<Freq>("annually");
  const [otherIncome, setOtherIncome] = useState("");
  const [otherIncomeFreq, setOtherIncomeFreq] = useState<Freq>("monthly");

  const [living, setLiving] = useState("");
  const [livingFreq, setLivingFreq] = useState<Freq>("monthly");
  const [carLoan, setCarLoan] = useState("");
  const [carLoanFreq, setCarLoanFreq] = useState<Freq>("monthly");
  const [otherPayments, setOtherPayments] = useState("");
  const [otherPaymentsFreq, setOtherPaymentsFreq] = useState<Freq>("monthly");
  const [creditCards, setCreditCards] = useState("");

  const [interestRate, setInterestRate] = useState("6.00");
  const [loanTerm, setLoanTerm] = useState("30");

  const [result, setResult] = useState({
    maxLoan: 0,
    monthly: 0,
    fortnightly: 0,
    weekly: 0,
  });

  useEffect(() => {
    const annualIncome =
      toAnnual(salary1, salary1Freq) +
      (joint === "yes" ? toAnnual(salary2, salary2Freq) : 0) +
      toAnnual(otherIncome, otherIncomeFreq);

    const monthlyIncome = annualIncome / 12;
    const monthlyExpenses =
      toMonthly(living, livingFreq) +
      toMonthly(carLoan, carLoanFreq) +
      toMonthly(otherPayments, otherPaymentsFreq) +
      (parseFloat(creditCards) || 0) * 0.038 +
      dependants * 300;

    const assessmentRate = (parseFloat(interestRate) || 0) + 3;
    const r = assessmentRate / 12 / 100;
    const term = parseInt(loanTerm) || 30;
    const n = term * 12;

    const maxRepayment = Math.max(0, (monthlyIncome - monthlyExpenses) * 0.85);
    const maxLoan = r > 0 ? maxRepayment * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n))) : 0;

    const loanR = (parseFloat(interestRate) || 0) / 12 / 100;
    const monthly =
      loanR > 0 && maxLoan > 0
        ? maxLoan * (loanR * Math.pow(1 + loanR, n)) / (Math.pow(1 + loanR, n) - 1)
        : 0;

    setResult({
      maxLoan,
      monthly,
      fortnightly: monthly / 2,
      weekly: monthly / 4.33,
    });
  }, [joint, dependants, salary1, salary1Freq, salary2, salary2Freq, otherIncome, otherIncomeFreq,
      living, livingFreq, carLoan, carLoanFreq, otherPayments, otherPaymentsFreq, creditCards,
      interestRate, loanTerm]);

  const inputCls =
    "bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[140px] outline-none focus:ring-1 focus:ring-orange/40";
  const rowCls = "flex items-center justify-between border-b border-[#e8e8e8] py-2.5";

  return (
    <div className="max-w-4xl">
      <h2 className="font-sans font-semibold text-navy text-[1.1rem] mb-5">
        Borrowing Power Calculator 2025 – 2026
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Left: Income ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] mb-3">Enter your income details</p>
          <div className="space-y-0">
            <Toggle
              label="Joint Income"
              options={[{ label: "No", value: "no" }, { label: "Yes", value: "yes" }]}
              value={joint}
              onChange={setJoint}
            />
            <NumberButtons
              label="Number of dependants"
              value={dependants}
              onChange={setDependants}
              options={[0, 1, 2, 3, 4, 5]}
            />
            <AmountFreqRow label="Net salary" amount={salary1} freq={salary1Freq} onAmount={setSalary1} onFreq={setSalary1Freq} />
            {joint === "yes" && (
              <AmountFreqRow label="Net salary 2" amount={salary2} freq={salary2Freq} onAmount={setSalary2} onFreq={setSalary2Freq} />
            )}
            <AmountFreqRow label="Other net income" amount={otherIncome} freq={otherIncomeFreq} onAmount={setOtherIncome} onFreq={setOtherIncomeFreq} />
          </div>

          <p className="text-orange font-sans font-semibold text-[15px] mt-6 mb-3">Enter your expense details</p>
          <div className="space-y-0">
            <AmountFreqRow label="Living expenses" amount={living} freq={livingFreq} onAmount={setLiving} onFreq={setLivingFreq} />
            <AmountFreqRow label="Car loan repayment" amount={carLoan} freq={carLoanFreq} onAmount={setCarLoan} onFreq={setCarLoanFreq} />
            <AmountFreqRow label="Other payments" amount={otherPayments} freq={otherPaymentsFreq} onAmount={setOtherPayments} onFreq={setOtherPaymentsFreq} />
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Total credit card limits</span>
              <input type="number" value={creditCards} onChange={e => setCreditCards(e.target.value)} placeholder="0" className={inputCls} />
            </div>
          </div>

          <p className="text-orange font-sans font-semibold text-[15px] mt-6 mb-3">Loan details</p>
          <div className="space-y-0">
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Interest rate (%)</span>
              <input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} className={inputCls} />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Loan term (years)</span>
              <select
                value={loanTerm}
                onChange={e => setLoanTerm(e.target.value)}
                className="bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[140px] outline-none focus:ring-1 focus:ring-orange/40 cursor-pointer"
              >
                {[10, 15, 20, 25, 30].map(y => (
                  <option key={y} value={y}>{y} years</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">View your results</p>

          <div className="mb-5">
            <p className="font-sans text-[12px] text-navy/60 mb-1">You can borrow up to</p>
            <p className="font-sans font-semibold text-orange text-[2.2rem] leading-none">
              {fmt(result.maxLoan)}
            </p>
          </div>

          <div className="space-y-2">
            {[
              { label: "Monthly repayment", value: fmtDec(result.monthly) },
              { label: "Fortnightly repayment", value: fmtDec(result.fortnightly) },
              { label: "Weekly repayment", value: fmtDec(result.weekly) },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
                <span className="text-navy">{row.label}</span>
                <span className="text-ink font-medium">{row.value}</span>
              </div>
            ))}
          </div>

          <p className="font-sans text-[11px] text-ink/40 mt-5 leading-relaxed">
            Includes 3% APRA serviceability buffer. Credit card limits assessed at 3.8%/month. Dependant allowance $300/month each.
          </p>
        </div>
      </div>
    </div>
  );
}
