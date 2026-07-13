"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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

const fmtDec = (n: number) =>
  "$" + Math.max(0, n).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function fmtK(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
}

// ── Loan Balance Chart ────────────────────────────────────────────────────────

function LoanBalanceChart({
  maxLoan, monthlyPayment, annualRate, termYears,
}: {
  maxLoan: number;
  monthlyPayment: number;
  annualRate: number;
  termYears: number;
}) {
  const empty = maxLoan <= 0 || monthlyPayment <= 0 || termYears <= 0;

  // Build amortization year-by-year
  const points: { year: number; balance: number; totalRemaining: number }[] = [];
  if (!empty) {
    let balance = maxLoan;
    const r = annualRate / 12 / 100;
    for (let year = 0; year <= termYears; year++) {
      const remainingMonths = (termYears - year) * 12;
      points.push({
        year,
        balance: Math.max(0, balance),
        totalRemaining: Math.max(0, monthlyPayment * remainingMonths),
      });
      for (let m = 0; m < 12 && balance > 0; m++) {
        const interest = balance * r;
        balance = Math.max(0, balance - (monthlyPayment - interest));
      }
    }
  }

  // SVG layout
  const W = 320;
  const H = 190;
  const pL = 48, pR = 8, pT = 8, pB = 30;
  const cW = W - pL - pR;
  const cH = H - pT - pB;

  const maxVal = empty ? 100 : (points[0]?.totalRemaining ?? maxLoan);

  const toX = (year: number) => pL + (year / termYears) * cW;
  const toY = (val: number) => pT + cH - Math.min(1, val / maxVal) * cH;

  // Y-axis ticks
  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  // X-axis ticks
  const xStep = termYears <= 10 ? 2 : termYears <= 20 ? 5 : 5;
  const xTicks: number[] = [];
  for (let y = 0; y <= termYears; y += xStep) xTicks.push(y);
  if (xTicks[xTicks.length - 1] !== termYears) xTicks.push(termYears);

  // Path builders
  function areaPath(key: "balance" | "totalRemaining") {
    if (!points.length) return "";
    const pts = points.map(p =>
      `${toX(p.year).toFixed(1)},${toY(p[key]).toFixed(1)}`
    );
    return (
      `M ${pts[0]} ` +
      pts.slice(1).map(p => `L ${p}`).join(" ") +
      ` L ${toX(termYears).toFixed(1)},${(pT + cH).toFixed(1)}` +
      ` L ${pL},${(pT + cH).toFixed(1)} Z`
    );
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-4 mb-2">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-orange flex-shrink-0" />
          <span className="font-sans text-[11px] text-navy">Loan Balance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 bg-navy flex-shrink-0" />
          <span className="font-sans text-[11px] text-navy">Total Payment</span>
        </div>
      </div>

      <svg
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
        style={{ overflow: "visible" }}
        aria-label="Loan balance chart"
      >
        {/* Horizontal grid lines */}
        {yTicks.map((f) => (
          <line
            key={f}
            x1={pL} y1={toY(maxVal * f)}
            x2={pL + cW} y2={toY(maxVal * f)}
            stroke="#e0e4ea" strokeWidth="0.8"
          />
        ))}

        {/* Total payment area (navy, behind) */}
        {!empty && (
          <path d={areaPath("totalRemaining")} fill="#1e3a5f" opacity="0.45" />
        )}

        {/* Loan balance area (orange, front) */}
        {!empty && (
          <path d={areaPath("balance")} fill="#e87722" opacity="0.85" />
        )}

        {/* Empty state dot */}
        {empty && (
          <circle
            cx={pL + cW / 2} cy={pT + cH / 2}
            r="2" fill="#ccc"
          />
        )}

        {/* Axes */}
        <line x1={pL} y1={pT} x2={pL} y2={pT + cH} stroke="#c0c8d4" strokeWidth="1" />
        <line x1={pL} y1={pT + cH} x2={pL + cW} y2={pT + cH} stroke="#c0c8d4" strokeWidth="1" />

        {/* Y-axis labels */}
        {yTicks.map((f) => (
          <text
            key={f}
            x={pL - 4} y={toY(maxVal * f) + 3}
            textAnchor="end"
            fontSize="7.5"
            fill="#7a8799"
            fontFamily="sans-serif"
          >
            {empty ? (f === 0 ? "$0" : "") : fmtK(maxVal * f)}
          </text>
        ))}

        {/* X-axis labels */}
        {xTicks.map((year) => (
          <text
            key={year}
            x={toX(year)} y={pT + cH + 11}
            textAnchor="middle"
            fontSize="7.5"
            fill="#7a8799"
            fontFamily="sans-serif"
          >
            {year}
          </text>
        ))}

        {/* Axis titles */}
        <text
          x={10} y={pT + cH / 2}
          textAnchor="middle"
          fontSize="7.5"
          fill="#7a8799"
          fontFamily="sans-serif"
          transform={`rotate(-90, 10, ${pT + cH / 2})`}
        >
          Amount Owing
        </text>
        <text
          x={pL + cW / 2} y={H}
          textAnchor="middle"
          fontSize="7.5"
          fill="#7a8799"
          fontFamily="sans-serif"
        >
          Years
        </text>
      </svg>
    </div>
  );
}

// ── Assumption Modal ──────────────────────────────────────────────────────────

const ASSUMPTIONS = [
  "It does not take into account any possible fees i.e. up-front fees or ongoing fees.",
  "Interest rate does not change over the loan term.",
  "Interest is calculated by compounding on the same repayment frequency selected, i.e. weekly, fortnightly, monthly. In practice, interest compounding frequency may not be the same as repayment frequency.",
  "It is assumed that a year consists 26 fortnights or 52 weeks which is counted as 364 days rather than 365 or 366 days.",
  "No rounding is done throughout calculation whereas repayments are rounded to at least the nearer cent in practice.",
  "Buffer or Extra Interest Rate: In order to avoid the risk of interest increasing, many lenders apply a buffer / extra interest rate to calculate borrowing power but the repayments and total interests payable are still calculated without buffer rate.",
  "The borrowing Power total is calculated at the greater of the Interest rate input + a buffer of 3% or a fixed floor rate of 5.75%",
  "The greater of the estimated Living Expenses input, or a default Household Expenditure Measure amount which is implemented in many Lenders serviceability calculations, is used to calculate the Borrowing Power amount.",
];

function AssumptionModal({ onClose }: { onClose: () => void }) {
  const [visible, setVisible] = useState(false);
  const [bodyMounted, setBodyMounted] = useState(false);

  useEffect(() => {
    setBodyMounted(true);
    const id = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(id);
  }, []);

  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 180);
  }, [onClose]);

  useEffect(() => {
    const fn = (e: KeyboardEvent) => { if (e.key === "Escape") handleClose(); };
    window.addEventListener("keydown", fn);
    return () => window.removeEventListener("keydown", fn);
  }, [handleClose]);

  if (!bodyMounted) return null;

  const content = (
    <div
      className={cn(
        "fixed inset-0 z-[9999] flex items-start justify-center p-4 pt-10 overflow-y-auto transition-opacity duration-200",
        visible ? "opacity-100 bg-black/50" : "opacity-0 bg-black/0 pointer-events-none",
      )}
      onClick={handleClose}
    >
      <div
        className={cn(
          "relative w-full max-w-[560px] bg-white shadow-2xl mb-12 transition-all duration-200",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-3.5">
          <h3 className="font-sans font-semibold text-orange text-[1rem]">Description</h3>
          <button onClick={handleClose} aria-label="Close" className="text-ink/35 hover:text-ink/70 transition-colors text-[1.4rem] leading-none mt-[-2px]">×</button>
        </div>
        <div className="px-5 py-5 space-y-5 overflow-y-auto" style={{ maxHeight: "calc(85vh - 56px)" }}>
          <p className="font-sans text-[13px] text-ink/80 leading-relaxed">
            This calculator is designed to give you an estimate of how much money you can borrow from
            a lender. Note that the borrowing power is calculated on a custom model which can differ
            from lender to lender. The purpose of this calculator is to merely give an indication of
            what a lender could offer you, based on some of your basic incomes and financial
            commitments. You&apos;ll only know how much you can borrow for certain when you apply and
            receive conditional approval for a maximum borrowing amount on a loan.
          </p>
          <div>
            <p className="font-sans font-semibold text-orange text-[1rem] mb-3">Assumptions</p>
            <ul className="space-y-2">
              {ASSUMPTIONS.map((item, i) => (
                <li key={i} className="flex gap-2 font-sans text-[13px] text-ink/80 leading-relaxed">
                  <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-ink/40 flex-shrink-0" />
                  {item}
                </li>
              ))}
            </ul>
          </div>
          <div className="flex justify-end pt-2">
            <button onClick={handleClose} className="bg-orange text-white font-sans text-[13px] px-8 py-2 hover:bg-orange/90 transition-colors">
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
}

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

// ── Defaults & Main component ─────────────────────────────────────────────────

const DEFAULTS = {
  joint: "no" as "no" | "yes",
  dependants: 0,
  salary1: "", salary1Freq: "annually" as Freq,
  salary2: "", salary2Freq: "annually" as Freq,
  otherIncome: "", otherIncomeFreq: "monthly" as Freq,
  living: "", livingFreq: "monthly" as Freq,
  carLoan: "", carLoanFreq: "monthly" as Freq,
  otherPayments: "", otherPaymentsFreq: "monthly" as Freq,
  creditCards: "",
  interestRate: "6.00",
  loanTerm: "30",
};

export default function BorrowingPowerCalculator() {
  const [joint, setJoint] = useState(DEFAULTS.joint);
  const [dependants, setDependants] = useState(DEFAULTS.dependants);

  const [salary1, setSalary1] = useState(DEFAULTS.salary1);
  const [salary1Freq, setSalary1Freq] = useState(DEFAULTS.salary1Freq);
  const [salary2, setSalary2] = useState(DEFAULTS.salary2);
  const [salary2Freq, setSalary2Freq] = useState(DEFAULTS.salary2Freq);
  const [otherIncome, setOtherIncome] = useState(DEFAULTS.otherIncome);
  const [otherIncomeFreq, setOtherIncomeFreq] = useState(DEFAULTS.otherIncomeFreq);

  const [living, setLiving] = useState(DEFAULTS.living);
  const [livingFreq, setLivingFreq] = useState(DEFAULTS.livingFreq);
  const [carLoan, setCarLoan] = useState(DEFAULTS.carLoan);
  const [carLoanFreq, setCarLoanFreq] = useState(DEFAULTS.carLoanFreq);
  const [otherPayments, setOtherPayments] = useState(DEFAULTS.otherPayments);
  const [otherPaymentsFreq, setOtherPaymentsFreq] = useState(DEFAULTS.otherPaymentsFreq);
  const [creditCards, setCreditCards] = useState(DEFAULTS.creditCards);

  const [interestRate, setInterestRate] = useState(DEFAULTS.interestRate);
  const [loanTerm, setLoanTerm] = useState(DEFAULTS.loanTerm);

  const [showAssumption, setShowAssumption] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [result, setResult] = useState({
    maxLoan: 0, monthly: 0, fortnightly: 0, weekly: 0,
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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

    const rate = parseFloat(interestRate) || 0;
    const assessmentRate = Math.max(rate + 3, 5.75);
    const r = assessmentRate / 12 / 100;
    const term = parseInt(loanTerm) || 30;
    const n = term * 12;

    const maxRepayment = Math.max(0, (monthlyIncome - monthlyExpenses) * 0.85);
    const maxLoan = r > 0 ? maxRepayment * ((Math.pow(1 + r, n) - 1) / (r * Math.pow(1 + r, n))) : 0;

    const loanR = rate / 12 / 100;
    const monthly =
      loanR > 0 && maxLoan > 0
        ? maxLoan * (loanR * Math.pow(1 + loanR, n)) / (Math.pow(1 + loanR, n) - 1)
        : 0;

    setResult({ maxLoan, monthly, fortnightly: monthly / 2, weekly: monthly / 4.33 });
  }, [joint, dependants, salary1, salary1Freq, salary2, salary2Freq, otherIncome, otherIncomeFreq,
      living, livingFreq, carLoan, carLoanFreq, otherPayments, otherPaymentsFreq, creditCards,
      interestRate, loanTerm]);

  function handleReset() {
    setJoint(DEFAULTS.joint); setDependants(DEFAULTS.dependants);
    setSalary1(DEFAULTS.salary1); setSalary1Freq(DEFAULTS.salary1Freq);
    setSalary2(DEFAULTS.salary2); setSalary2Freq(DEFAULTS.salary2Freq);
    setOtherIncome(DEFAULTS.otherIncome); setOtherIncomeFreq(DEFAULTS.otherIncomeFreq);
    setLiving(DEFAULTS.living); setLivingFreq(DEFAULTS.livingFreq);
    setCarLoan(DEFAULTS.carLoan); setCarLoanFreq(DEFAULTS.carLoanFreq);
    setOtherPayments(DEFAULTS.otherPayments); setOtherPaymentsFreq(DEFAULTS.otherPaymentsFreq);
    setCreditCards(DEFAULTS.creditCards);
    setInterestRate(DEFAULTS.interestRate); setLoanTerm(DEFAULTS.loanTerm);
  }

  const inputCls =
    "bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[140px] outline-none focus:ring-1 focus:ring-orange/40";
  const rowCls = "flex items-center justify-between border-b border-[#e8e8e8] py-2.5";

  return (
    <div className="max-w-4xl">
      <h2 className="font-sans font-semibold text-navy text-[1.1rem] mb-5">
        Borrowing Power Calculator 2025 – 2026
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ── Left: Income + Loan Details + Results ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] mb-3">Enter your income details</p>
          <div className="space-y-0">
            <Toggle
              label="Joint Income"
              options={[{ label: "Yes", value: "yes" }, { label: "No", value: "no" }]}
              value={joint}
              onChange={setJoint}
            />
            <NumberButtons
              label="Dependent children"
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

          <p className="text-orange font-sans font-semibold text-[15px] mt-6 mb-3">Enter your loan details</p>
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

          {/* Results */}
          <p className="text-orange font-sans font-semibold text-[15px] mt-6 mb-2">View your results</p>
          <div className="border-b border-[#e8e8e8] pb-3 mb-3">
            <p className="font-sans text-[13px] text-navy mb-0.5">You can borrow up to</p>
            <p className="font-sans font-semibold text-orange text-[1.9rem] leading-none">
              {result.maxLoan > 0
                ? "$" + Math.round(result.maxLoan).toLocaleString("en-AU")
                : "$0"}
            </p>
          </div>
          <div className="space-y-2">
            {[
              { label: "Monthly Repayment", value: fmtDec(result.monthly) },
              { label: "Fortnightly Repayment", value: fmtDec(result.fortnightly) },
              { label: "Weekly Repayment", value: fmtDec(result.weekly) },
            ].map(row => (
              <div key={row.label} className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
                <span className="text-navy">{row.label}</span>
                <span className="text-ink font-medium">{row.value}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Right: Expenses + Chart ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] mb-3">Enter your expense details</p>
          <div className="space-y-0">
            <AmountFreqRow label="Living expenses" amount={living} freq={livingFreq} onAmount={setLiving} onFreq={setLivingFreq} />
            <AmountFreqRow label="Car loan repayment" amount={carLoan} freq={carLoanFreq} onAmount={setCarLoan} onFreq={setCarLoanFreq} />
            <AmountFreqRow label="Other payments" amount={otherPayments} freq={otherPaymentsFreq} onAmount={setOtherPayments} onFreq={setOtherPaymentsFreq} />
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Total credit card limits</span>
              <input type="number" value={creditCards} onChange={e => setCreditCards(e.target.value)} placeholder="0" className={inputCls} />
            </div>
          </div>

          {/* Loan Balance Chart */}
          <p className="text-orange font-sans font-semibold text-[15px] mt-6 mb-3">Loan Balance Chart</p>
          <LoanBalanceChart
            maxLoan={result.maxLoan}
            monthlyPayment={result.monthly}
            annualRate={parseFloat(interestRate) || 0}
            termYears={parseInt(loanTerm) || 30}
          />
        </div>
      </div>

      {/* ── Action buttons ── */}
      <div className="flex gap-2 mt-6">
        <button
          onClick={handleReset}
          className="flex items-center gap-2 bg-orange text-white font-sans text-[13px] px-5 py-2 hover:bg-orange/90 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 10a6 6 0 1 1 1.8 4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            <path d="M4 14V10H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Reset
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-navy text-white font-sans text-[13px] px-5 py-2 hover:bg-navy/80 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7V3h10v4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="3" y="7" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 13h6M7 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
          </svg>
          Print
        </button>
        <button
          onClick={() => setShowAssumption(true)}
          className="flex items-center gap-2 bg-navy text-white font-sans text-[13px] px-5 py-2 hover:bg-navy/80 transition-colors"
        >
          <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Assumption
        </button>
      </div>

      {mounted && showAssumption && createPortal(
        <AssumptionModal onClose={() => setShowAssumption(false)} />,
        document.body,
      )}
    </div>
  );
}
