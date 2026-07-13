"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

type RepayFreq = "monthly" | "fortnightly" | "weekly";
type FeeFreq = "monthly" | "fortnightly" | "weekly" | "annually";

const REPAY_FREQ_LABEL: Record<RepayFreq, string> = {
  monthly: "Monthly",
  fortnightly: "Fortnightly",
  weekly: "Weekly",
};

// Payments-per-year for each frequency
const REPAY_PER_YEAR: Record<RepayFreq, number> = {
  monthly: 12,
  fortnightly: 26,
  weekly: 52,
};

const FEE_PER_YEAR: Record<FeeFreq, number> = {
  monthly: 12,
  fortnightly: 26,
  weekly: 52,
  annually: 1,
};

function fmtDec(n: number): string {
  return "$" + Math.max(0, n).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

function fmtInt(n: number): string {
  return "$" + Math.round(Math.max(0, n)).toLocaleString("en-AU");
}

function fmtK(n: number): string {
  if (n >= 1000000) return `$${(n / 1000000).toFixed(1)}M`;
  if (n >= 1000) return `$${Math.round(n / 1000)}K`;
  return `$${Math.round(n)}`;
}

// ── Loan Balance Chart ────────────────────────────────────────────────────────

function LoanBalanceChart({
  principal, monthlyPayment, annualRate, termYears,
}: {
  principal: number;
  monthlyPayment: number;
  annualRate: number;
  termYears: number;
}) {
  const empty = principal <= 0 || monthlyPayment <= 0 || termYears <= 0;

  const points: { year: number; balance: number; totalRemaining: number }[] = [];
  if (!empty) {
    let balance = principal;
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

  const W = 320, H = 190;
  const pL = 48, pR = 8, pT = 8, pB = 30;
  const cW = W - pL - pR, cH = H - pT - pB;

  const maxVal = empty ? 100 : (points[0]?.totalRemaining ?? principal);
  const toX = (year: number) => pL + (year / termYears) * cW;
  const toY = (val: number) => pT + cH - Math.min(1, val / maxVal) * cH;

  const yTicks = [0, 0.25, 0.5, 0.75, 1];
  const xStep = termYears <= 10 ? 2 : 5;
  const xTicks: number[] = [];
  for (let y = 0; y <= termYears; y += xStep) xTicks.push(y);
  if (xTicks[xTicks.length - 1] !== termYears) xTicks.push(termYears);

  function areaPath(key: "balance" | "totalRemaining") {
    if (!points.length) return "";
    const pts = points.map(p => `${toX(p.year).toFixed(1)},${toY(p[key]).toFixed(1)}`);
    return (
      `M ${pts[0]} ` +
      pts.slice(1).map(p => `L ${p}`).join(" ") +
      ` L ${toX(termYears).toFixed(1)},${(pT + cH).toFixed(1)}` +
      ` L ${pL},${(pT + cH).toFixed(1)} Z`
    );
  }

  return (
    <div>
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
      <svg viewBox={`0 0 ${W} ${H}`} width="100%" style={{ overflow: "visible" }} aria-label="Loan balance chart">
        {yTicks.map(f => (
          <line key={f} x1={pL} y1={toY(maxVal * f)} x2={pL + cW} y2={toY(maxVal * f)} stroke="#e0e4ea" strokeWidth="0.8" />
        ))}
        {!empty && <path d={areaPath("totalRemaining")} fill="#1e3a5f" opacity="0.45" />}
        {!empty && <path d={areaPath("balance")} fill="#e87722" opacity="0.85" />}
        {empty && <circle cx={pL + cW / 2} cy={pT + cH / 2} r="2" fill="#ccc" />}
        <line x1={pL} y1={pT} x2={pL} y2={pT + cH} stroke="#c0c8d4" strokeWidth="1" />
        <line x1={pL} y1={pT + cH} x2={pL + cW} y2={pT + cH} stroke="#c0c8d4" strokeWidth="1" />
        {yTicks.map(f => (
          <text key={f} x={pL - 4} y={toY(maxVal * f) + 3} textAnchor="end" fontSize="7.5" fill="#7a8799" fontFamily="sans-serif">
            {empty ? (f === 0 ? "$0" : "") : fmtK(maxVal * f)}
          </text>
        ))}
        {xTicks.map(year => (
          <text key={year} x={toX(year)} y={pT + cH + 11} textAnchor="middle" fontSize="7.5" fill="#7a8799" fontFamily="sans-serif">
            {year}
          </text>
        ))}
        <text x={10} y={pT + cH / 2} textAnchor="middle" fontSize="7.5" fill="#7a8799" fontFamily="sans-serif" transform={`rotate(-90, 10, ${pT + cH / 2})`}>
          Amount Owing
        </text>
        <text x={pL + cW / 2} y={H} textAnchor="middle" fontSize="7.5" fill="#7a8799" fontFamily="sans-serif">
          Years
        </text>
      </svg>
    </div>
  );
}

// ── Assumption Modal ──────────────────────────────────────────────────────────

const LOAN_REPAYMENT_ASSUMPTIONS = [
  "It does not take into account any possible up-front fees. Only Ongoing fees are used not Upfront or End of loan fees (i.e. discharge costs).",
  "Interest rate does not change over the loan term.",
  "Interest is calculated by compounding on the same repayment frequency selected, i.e. weekly, fortnightly, monthly. In practice, the interest compounding frequency may not be the same as repayment frequency.",
  "It is assumed that a year consists of 26 fortnights or 52 weeks which is counted as 364 days rather than 365 or 366 days.",
  "No rounding is done throughout the calculation whereas repayments are rounded to at least the nearest cent in practice.",
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
          "relative w-full max-w-[540px] bg-white shadow-2xl mb-12 transition-all duration-200",
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
            This calculator helps you work out what your regular repayments will be based on your loan
            amount. The repayment frequency can be changed to monthly, fortnightly or weekly. Calculates
            both Principal and Interest repayments for a loan term.
          </p>
          <div>
            <p className="font-sans font-semibold text-orange text-[1rem] mb-3">Assumptions</p>
            <ul className="space-y-2">
              {LOAN_REPAYMENT_ASSUMPTIONS.map((item, i) => (
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

// ── Main component ────────────────────────────────────────────────────────────

const DEFAULTS = {
  loanAmount: "400000",
  interestRate: "5.50",
  loanTerm: "30",
  loanFee: "0",
  loanFeeFreq: "monthly" as FeeFreq,
  repayFreq: "monthly" as RepayFreq,
};

export default function LoanRepaymentCalculator() {
  const [loanAmount, setLoanAmount] = useState(DEFAULTS.loanAmount);
  const [interestRate, setInterestRate] = useState(DEFAULTS.interestRate);
  const [loanTerm, setLoanTerm] = useState(DEFAULTS.loanTerm);
  const [loanFee, setLoanFee] = useState(DEFAULTS.loanFee);
  const [loanFeeFreq, setLoanFeeFreq] = useState<FeeFreq>(DEFAULTS.loanFeeFreq);
  const [repayFreq, setRepayFreq] = useState<RepayFreq>(DEFAULTS.repayFreq);

  const [showAssumption, setShowAssumption] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [result, setResult] = useState({
    repayment: 0,
    monthlyRepayment: 0,
    totalInterestFee: 0,
    totalPayments: 0,
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  useEffect(() => {
    const P = parseFloat(loanAmount.replace(/,/g, "")) || 0;
    const rate = parseFloat(interestRate) || 0;
    const years = parseInt(loanTerm) || 30;
    const fee = parseFloat(loanFee) || 0;

    if (P <= 0 || rate <= 0) {
      setResult({ repayment: 0, monthlyRepayment: 0, totalInterestFee: 0, totalPayments: 0 });
      return;
    }

    // Monthly amortisation
    const r = rate / 12 / 100;
    const n = years * 12;
    const monthlyRepayment = r > 0 ? P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : P / n;

    // Annual fee → total fees over term
    const annualFee = fee * FEE_PER_YEAR[loanFeeFreq];
    const totalFees = annualFee * years;

    const totalPrincipalInterest = monthlyRepayment * n;
    const totalPayments = totalPrincipalInterest + totalFees;
    const totalInterestFee = totalPrincipalInterest - P + totalFees;

    // Frequency-adjusted repayment for display
    const freqN = REPAY_PER_YEAR[repayFreq];
    const repayment = (monthlyRepayment * 12) / freqN;

    setResult({ repayment, monthlyRepayment, totalInterestFee, totalPayments });
  }, [loanAmount, interestRate, loanTerm, loanFee, loanFeeFreq, repayFreq]);

  function handleReset() {
    setLoanAmount(DEFAULTS.loanAmount);
    setInterestRate(DEFAULTS.interestRate);
    setLoanTerm(DEFAULTS.loanTerm);
    setLoanFee(DEFAULTS.loanFee);
    setLoanFeeFreq(DEFAULTS.loanFeeFreq);
    setRepayFreq(DEFAULTS.repayFreq);
  }

  const inputCls =
    "bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[140px] outline-none focus:ring-1 focus:ring-orange/40";
  const rowCls = "flex items-center justify-between border-b border-[#e8e8e8] py-2.5";
  const selectCls =
    "bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[140px] outline-none focus:ring-1 focus:ring-orange/40 cursor-pointer";

  return (
    <div className="max-w-4xl">
      <h2 className="font-sans font-semibold text-navy text-[1.1rem] mb-5">
        Loan Repayment Calculator 2025 – 2026
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">

        {/* ── Left: Inputs + Results ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] mb-3">Enter your details</p>
          <div className="space-y-0">
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Loan Amount</span>
              <input type="number" value={loanAmount} onChange={e => setLoanAmount(e.target.value)} className={inputCls} />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Interest Rate (%)</span>
              <input type="number" step="0.01" value={interestRate} onChange={e => setInterestRate(e.target.value)} className={inputCls} />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Loan Term</span>
              <select value={loanTerm} onChange={e => setLoanTerm(e.target.value)} className={selectCls}>
                {[5, 10, 15, 20, 25, 30].map(y => (
                  <option key={y} value={y}>{y} years</option>
                ))}
              </select>
            </div>

            {/* Loan Fee: amount + frequency */}
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Loan Fee</span>
              <div className="flex">
                <input
                  type="number"
                  value={loanFee}
                  onChange={e => setLoanFee(e.target.value)}
                  placeholder="0"
                  className="bg-[#f0f0f0] border-0 font-sans text-[13px] px-2 py-1.5 text-right w-[70px] outline-none focus:ring-1 focus:ring-orange/40"
                />
                <select
                  value={loanFeeFreq}
                  onChange={e => setLoanFeeFreq(e.target.value as FeeFreq)}
                  className="bg-[#e8e8e8] border-0 font-sans text-[11px] px-1 py-1.5 outline-none focus:ring-1 focus:ring-orange/40 cursor-pointer text-navy"
                >
                  <option value="monthly">Monthly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="weekly">Weekly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>

            {/* Repayment Frequency */}
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Repayment Frequency</span>
              <select
                value={repayFreq}
                onChange={e => setRepayFreq(e.target.value as RepayFreq)}
                className={selectCls}
              >
                <option value="monthly">Monthly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
          </div>

          {/* Orange Reset */}
          <button
            onClick={handleReset}
            className="mt-4 flex items-center gap-2 bg-orange text-white font-sans text-[13px] px-5 py-2 hover:bg-orange/90 transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
              <path d="M4 10a6 6 0 1 1 1.8 4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              <path d="M4 14V10H8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Reset
          </button>

          {/* Results */}
          <div className="mt-6">
            <p className="text-orange font-sans font-semibold text-[15px] mb-2">View your results</p>
            <div className="border-b border-[#e8e8e8] pb-3 mb-3">
              <div className="flex items-baseline justify-between">
                <span className="font-sans text-[13px] text-orange font-semibold">
                  {REPAY_FREQ_LABEL[repayFreq]} Repayment
                </span>
                <span className="font-sans font-semibold text-orange text-[1.4rem] leading-none">
                  {fmtDec(result.repayment)}
                </span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
                <span className="text-navy">Total Interest / Fee Payable</span>
                <span className="text-ink font-medium">{fmtInt(result.totalInterestFee)}</span>
              </div>
              <div className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
                <span className="text-navy">Total Payments</span>
                <span className="text-ink font-medium">{fmtInt(result.totalPayments)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Chart + buttons ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] mb-3">Loan Balance Chart</p>
          <LoanBalanceChart
            principal={parseFloat(loanAmount.replace(/,/g, "")) || 0}
            monthlyPayment={result.monthlyRepayment}
            annualRate={parseFloat(interestRate) || 0}
            termYears={parseInt(loanTerm) || 30}
          />

          {/* Print + Assumption */}
          <div className="flex gap-2 mt-6">
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
              className="flex items-center gap-2 bg-orange text-white font-sans text-[13px] px-5 py-2 hover:bg-orange/90 transition-colors"
            >
              <svg width="13" height="13" viewBox="0 0 20 20" fill="none" aria-hidden="true">
                <path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
              Assumption
            </button>
          </div>
        </div>
      </div>

      {mounted && showAssumption && createPortal(
        <AssumptionModal onClose={() => setShowAssumption(false)} />,
        document.body,
      )}
    </div>
  );
}
