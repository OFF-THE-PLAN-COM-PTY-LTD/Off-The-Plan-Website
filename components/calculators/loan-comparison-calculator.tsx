"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { cn } from "@/lib/utils";

// ─── Formatters ───────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  "$" + Math.round(Math.abs(n)).toLocaleString("en-AU");

const fmtDec = (n: number) =>
  "$" + Math.abs(n).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// ─── Types & Defaults ─────────────────────────────────────────────────────────

interface LoanParams {
  rate: string;
  term: string;
  monthlyFee: string;
  upfrontFee: string;
}

interface LoanResult {
  monthly: number;
  totalInterest: number;
  totalFees: number;
  totalCost: number;
}

const DEFAULTS = {
  loanAmount: "500000",
  loan1: { rate: "6.50", term: "30", monthlyFee: "0",  upfrontFee: "400" },
  loan2: { rate: "5.99", term: "30", monthlyFee: "10", upfrontFee: "300" },
} as const;

// ─── Calculation ──────────────────────────────────────────────────────────────

function calcLoan(principal: number, params: LoanParams): LoanResult {
  const r = (parseFloat(params.rate) || 0) / 12 / 100;
  const n = (parseInt(params.term) || 30) * 12;
  const monthly = r > 0 ? principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
  const totalInterest = Math.max(0, monthly * n - principal);
  const upfront = parseFloat(params.upfrontFee) || 0;
  const mFee = parseFloat(params.monthlyFee) || 0;
  const totalFees = upfront + mFee * n;
  return { monthly, totalInterest, totalFees, totalCost: monthly * n + totalFees };
}

// ─── Savings Chart ────────────────────────────────────────────────────────────

function SavingsChart({
  P, loan1, loan2,
}: {
  P: number;
  loan1: LoanParams;
  loan2: LoanParams;
}) {
  const term1 = parseInt(loan1.term) || 30;
  const term2 = parseInt(loan2.term) || 30;
  const maxTerm = Math.max(term1, term2);

  const r1 = (parseFloat(loan1.rate) || 0) / 12 / 100;
  const n1 = term1 * 12;
  const m1 = r1 > 0 ? P * (r1 * Math.pow(1 + r1, n1)) / (Math.pow(1 + r1, n1) - 1) : 0;
  const f1 = parseFloat(loan1.monthlyFee) || 0;
  const u1 = parseFloat(loan1.upfrontFee) || 0;

  const r2 = (parseFloat(loan2.rate) || 0) / 12 / 100;
  const n2 = term2 * 12;
  const m2 = r2 > 0 ? P * (r2 * Math.pow(1 + r2, n2)) / (Math.pow(1 + r2, n2) - 1) : 0;
  const f2 = parseFloat(loan2.monthlyFee) || 0;
  const u2 = parseFloat(loan2.upfrontFee) || 0;

  // Year-by-year cumulative saving: Loan1_paid − Loan2_paid
  const points: number[] = [];
  for (let y = 0; y <= maxTerm; y++) {
    const mo = y * 12;
    const paid1 = m1 * Math.min(mo, n1) + u1 + f1 * Math.min(mo, n1);
    const paid2 = m2 * Math.min(mo, n2) + u2 + f2 * Math.min(mo, n2);
    points.push(paid1 - paid2);
  }

  // Chart dimensions
  const vW = 340, vH = 200;
  const pL = 52, pR = 8, pT = 12, pB = 38;
  const cW = vW - pL - pR;
  const cH = vH - pT - pB;

  // Y axis range — nice rounded ticks
  const minVal = Math.min(...points);
  const maxVal = Math.max(...points);
  const span = maxVal - minVal || 1;
  const rawPad = span * 0.2;

  const tickInterval =
    span > 200000 ? 100000 :
    span > 100000 ? 50000  :
    span > 50000  ? 20000  :
    span > 20000  ? 10000  :
    span > 10000  ? 5000   :
    span > 5000   ? 2000   : 1000;

  const yMin = Math.floor((minVal - rawPad) / tickInterval) * tickInterval;
  const yMax = Math.ceil((maxVal + rawPad) / tickInterval) * tickInterval;
  const yRange = yMax - yMin;

  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax; v += tickInterval) yTicks.push(v);

  // Coordinate helpers
  const xAt = (yr: number) => pL + (yr / maxTerm) * cW;
  const yAt = (val: number) => pT + ((yMax - val) / yRange) * cH;
  const y0 = yAt(0);

  // SVG paths
  const ptStr = points.map((v, i) => `${xAt(i)},${yAt(v)}`).join(" L ");
  const linePath = `M ${ptStr}`;
  const areaPath = `${linePath} L ${xAt(maxTerm)},${y0} L ${xAt(0)},${y0} Z`;

  // X ticks every 5 years
  const xTicks: number[] = [];
  for (let y = 0; y <= maxTerm; y += 5) xTicks.push(y);

  function fmtK(n: number): string {
    const abs = Math.abs(n);
    const sign = n < 0 ? "-$" : "$";
    if (abs >= 1000) return sign + Math.round(abs / 1000) + "K";
    return sign + Math.round(abs);
  }

  return (
    <div>
      {/* Legend */}
      <div className="flex items-center gap-1.5 mb-1 justify-end">
        <div className="w-3 h-3 bg-orange opacity-70" />
        <span className="font-sans text-[10px] text-navy">Saved Interest and Fees</span>
      </div>

      <svg viewBox={`0 0 ${vW} ${vH}`} width="100%" className="overflow-visible">
        {/* Horizontal grid lines */}
        {yTicks.map(tick => (
          <line key={tick}
            x1={pL} y1={yAt(tick)} x2={pL + cW} y2={yAt(tick)}
            stroke={tick === 0 ? "#999" : "#e8e8e8"}
            strokeWidth={tick === 0 ? 1 : 0.5}
            strokeDasharray={tick === 0 ? "none" : "2,2"}
          />
        ))}

        {/* Filled area */}
        <path d={areaPath} fill="rgba(230,126,34,0.25)" />
        {/* Line */}
        <path d={linePath} fill="none" stroke="#e67e22" strokeWidth="1.5" />

        {/* Y axis labels */}
        {yTicks.map(tick => (
          <text key={tick}
            x={pL - 4} y={yAt(tick) + 3.5}
            textAnchor="end" fontSize="9" fill="#777" fontFamily="sans-serif"
          >
            {fmtK(tick)}
          </text>
        ))}

        {/* Y axis title — rotated */}
        <text
          x={9} y={pT + cH / 2}
          textAnchor="middle" fontSize="8.5" fill="#888" fontFamily="sans-serif"
          transform={`rotate(-90, 9, ${pT + cH / 2})`}
        >
          Amount Saved
        </text>

        {/* X axis ticks + labels */}
        {xTicks.map(yr => (
          <g key={yr}>
            <line x1={xAt(yr)} y1={pT + cH} x2={xAt(yr)} y2={pT + cH + 4} stroke="#bbb" strokeWidth="0.5" />
            <text x={xAt(yr)} y={pT + cH + 14} textAnchor="middle" fontSize="9" fill="#777" fontFamily="sans-serif">
              {yr}
            </text>
          </g>
        ))}

        {/* X axis title */}
        <text
          x={pL + cW / 2} y={vH - 2}
          textAnchor="middle" fontSize="8.5" fill="#888" fontFamily="sans-serif"
        >
          Years
        </text>

        {/* Axis lines */}
        <line x1={pL} y1={pT} x2={pL} y2={pT + cH} stroke="#ccc" strokeWidth="1" />
        <line x1={pL} y1={pT + cH} x2={pL + cW} y2={pT + cH} stroke="#ccc" strokeWidth="1" />
      </svg>
    </div>
  );
}

// ─── Assumption Modal ─────────────────────────────────────────────────────────

function AssumptionModal({ onClose }: { onClose: () => void }) {
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
          "bg-white w-full max-w-lg mx-4 shadow-xl transition-all duration-150",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
        )}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-end px-4 pt-3">
          <button onClick={close} className="text-ink/40 hover:text-ink text-[22px] leading-none">×</button>
        </div>

        <div className="px-6 pb-2">
          <p className="font-sans font-semibold text-orange text-[15px] mb-1">Description</p>
          <div className="border-b border-[#e8e8e8] mb-3" />
          <p className="font-sans text-[13px] text-ink/70 leading-relaxed mb-5">
            Compare any two loans on the market for a direct cost comparison. Determine which is the
            cheapest in total fees and interest over the life of the loan.
          </p>

          <p className="font-sans font-semibold text-orange text-[15px] mb-3">Assumptions</p>
          <ul className="space-y-2 list-disc list-outside pl-4">
            {[
              "Interest is calculated by compounding on the same repayment frequency selected, i.e. weekly, fortnightly, monthly. In practice, interest compounding frequency may not be the same as repayment frequency.",
              "It is assumed that a year consists 26 fortnights or 52 weeks which is counted as 364 days rather than 365 or 366 days.",
              "No rounding is done throughout calculation whereas repayments are rounded to at least the nearer cent in practice.",
              "This calculator does not take into account some loan features such as redraw facilities and offset accounts etc.",
            ].map((text, i) => (
              <li key={i} className="font-sans text-[13px] text-ink/70 leading-relaxed">{text}</li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end px-6 py-4">
          <button
            onClick={close}
            className="bg-orange text-white font-sans text-[13px] px-6 py-1.5 hover:bg-orange/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Input row helpers ────────────────────────────────────────────────────────

const inputCls =
  "bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[120px] outline-none focus:ring-1 focus:ring-orange/40";
const rowCls = "flex items-center justify-between border-b border-[#e8e8e8] py-2.5";

function LoanColumn({
  label, params, onChange,
}: {
  label: string;
  params: LoanParams;
  onChange: (p: LoanParams) => void;
}) {
  return (
    <div>
      <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">{label}</p>
      <div className="space-y-0">
        <div className={rowCls}>
          <span className="font-sans text-[13px] text-navy">Upfront fee</span>
          <input type="number" value={params.upfrontFee}
            onChange={e => onChange({ ...params, upfrontFee: e.target.value })}
            placeholder="0" className={inputCls} />
        </div>
        <div className={rowCls}>
          <span className="font-sans text-[13px] text-navy">Ongoing monthly fee</span>
          <input type="number" value={params.monthlyFee}
            onChange={e => onChange({ ...params, monthlyFee: e.target.value })}
            placeholder="0" className={inputCls} />
        </div>
        <div className={rowCls}>
          <span className="font-sans text-[13px] text-navy">Interest rate (%)</span>
          <input type="number" step="0.01" value={params.rate}
            onChange={e => onChange({ ...params, rate: e.target.value })}
            placeholder="6.50" className={inputCls} />
        </div>
        <div className={rowCls}>
          <span className="font-sans text-[13px] text-navy">Loan term (years)</span>
          <select value={params.term}
            onChange={e => onChange({ ...params, term: e.target.value })}
            className="bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[120px] outline-none cursor-pointer">
            {[5, 10, 15, 20, 25, 30].map(y => (
              <option key={y} value={y}>{y} years</option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function LoanComparisonCalculator() {
  const [loanAmount, setLoanAmount] = useState(DEFAULTS.loanAmount);
  const [loan1, setLoan1] = useState<LoanParams>({ ...DEFAULTS.loan1 });
  const [loan2, setLoan2] = useState<LoanParams>({ ...DEFAULTS.loan2 });
  const [result1, setResult1] = useState<LoanResult | null>(null);
  const [result2, setResult2] = useState<LoanResult | null>(null);
  const [showAssumption, setShowAssumption] = useState(false);

  useEffect(() => {
    const P = parseFloat(loanAmount.replace(/,/g, "")) || 0;
    if (P <= 0) { setResult1(null); setResult2(null); return; }
    setResult1(calcLoan(P, loan1));
    setResult2(calcLoan(P, loan2));
  }, [loanAmount, loan1, loan2]);

  function handleReset() {
    setLoanAmount(DEFAULTS.loanAmount);
    setLoan1({ ...DEFAULTS.loan1 });
    setLoan2({ ...DEFAULTS.loan2 });
  }

  const P = parseFloat(loanAmount.replace(/,/g, "")) || 0;
  const saving = result1 && result2 ? result1.totalCost - result2.totalCost : null;
  const cheaperLoan = saving !== null ? (saving > 0 ? "Loan 2" : saving < 0 ? "Loan 1" : null) : null;
  const savingAbs = saving !== null ? Math.abs(saving) : 0;

  return (
    <div className="max-w-4xl">
      <h2 className="font-sans font-semibold text-navy text-[1.1rem] mb-5">
        Loan Comparison Calculator 2025 – 2026
      </h2>

      {/* Common details */}
      <div className="mb-6">
        <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">
          Enter common loan details
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-10">
          <div className={rowCls}>
            <span className="font-sans text-[13px] text-navy">Loan amount</span>
            <input type="number" value={loanAmount}
              onChange={e => setLoanAmount(e.target.value)}
              className={inputCls} placeholder="500000" />
          </div>
        </div>
      </div>

      {/* Per-loan inputs */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
        <LoanColumn label="Enter loan 1 details" params={loan1} onChange={setLoan1} />
        <LoanColumn label="Enter loan 2 details" params={loan2} onChange={setLoan2} />
      </div>

      {/* Results + Chart */}
      {result1 && result2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-6">
          {/* Left: comparison table */}
          <div>
            <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-4">
              View your results
            </p>

            {/* Saving headline */}
            {cheaperLoan && savingAbs >= 1 && (
              <p className="font-sans font-semibold text-orange text-[1.05rem] mb-4">
                {cheaperLoan} will save you: {fmt(savingAbs)}
              </p>
            )}
            {(!cheaperLoan || savingAbs < 1) && (
              <p className="font-sans text-[13px] text-navy/60 mb-4">Both loans have the same total cost.</p>
            )}

            {/* Comparison table */}
            <table className="w-full border-collapse">
              <thead>
                <tr>
                  <th className="text-left font-sans text-[11px] text-ink/40 uppercase tracking-wide py-1.5 pr-2 w-auto" />
                  <th className="text-right font-sans text-[11px] text-orange font-semibold py-1.5 px-2 w-[90px]">Loan 1</th>
                  <th className="text-right font-sans text-[11px] text-orange font-semibold py-1.5 pl-2 w-[90px]">Loan 2</th>
                </tr>
              </thead>
              <tbody>
                {[
                  { label: "Monthly repayment", v1: fmtDec(result1.monthly),       v2: fmtDec(result2.monthly) },
                  { label: "Total interest",    v1: fmt(result1.totalInterest),     v2: fmt(result2.totalInterest) },
                  { label: "Total fees",        v1: fmt(result1.totalFees),         v2: fmt(result2.totalFees) },
                  { label: "Total payments",    v1: fmt(result1.totalCost),         v2: fmt(result2.totalCost) },
                ].map((row, i) => (
                  <tr key={row.label} className={cn(
                    "border-b border-dashed border-[#ddd]",
                    i === 3 && "border-solid border-[#bbb] font-semibold"
                  )}>
                    <td className="font-sans text-[12px] text-navy py-2.5 pr-2">{row.label}</td>
                    <td className="text-right font-sans text-[12px] text-ink py-2.5 px-2">{row.v1}</td>
                    <td className="text-right font-sans text-[12px] text-ink py-2.5 pl-2">{row.v2}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Right: chart */}
          <div>
            <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">
              Loan Balance Chart
            </p>
            {P > 0 && <SavingsChart P={P} loan1={loan1} loan2={loan2} />}
          </div>
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 flex-wrap border-t border-[#e8e8e8] pt-5">
        <button
          onClick={handleReset}
          className="flex items-center gap-1.5 bg-orange text-white font-sans text-[12px] px-5 py-2 hover:bg-orange/90 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
            <path d="M3 3v5h5"/>
          </svg>
          Reset
        </button>
        <button
          onClick={() => window.print()}
          className="flex items-center gap-1.5 bg-orange text-white font-sans text-[12px] px-5 py-2 hover:bg-orange/90 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="6 9 6 2 18 2 18 9"/>
            <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
            <rect x="6" y="14" width="12" height="8"/>
          </svg>
          Print
        </button>
        <button
          onClick={() => setShowAssumption(true)}
          className="flex items-center gap-1.5 bg-orange text-white font-sans text-[12px] px-5 py-2 hover:bg-orange/90 transition-colors"
        >
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
            <line x1="8" y1="18" x2="21" y2="18"/>
            <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
            <line x1="3" y1="18" x2="3.01" y2="18"/>
          </svg>
          Assumption
        </button>
      </div>

      {showAssumption && <AssumptionModal onClose={() => setShowAssumption(false)} />}
    </div>
  );
}
