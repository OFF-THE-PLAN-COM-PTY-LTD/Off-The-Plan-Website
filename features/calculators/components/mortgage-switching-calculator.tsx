"use client";

import React, { useState, useEffect } from "react";
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

// ─── Types ────────────────────────────────────────────────────────────────────

type RepayFreq = "monthly" | "fortnightly" | "weekly";
type FeeFreq   = "monthly" | "fortnightly" | "weekly" | "annually";

const REPAY_PER_YEAR: Record<RepayFreq, number> = { monthly: 12, fortnightly: 26, weekly: 52 };
const FEE_PER_YEAR:   Record<FeeFreq, number>   = { monthly: 12, fortnightly: 26, weekly: 52, annually: 1 };
const REPAY_LABEL:    Record<RepayFreq, string>  = { monthly: "Monthly", fortnightly: "Fortnightly", weekly: "Weekly" };

// ─── Defaults ─────────────────────────────────────────────────────────────────

const DEFAULTS = {
  balance:          "500000",
  currentRate:      "5",
  loanTerm:         "20",
  repayFreq:        "monthly"    as RepayFreq,
  currentRegFee:    "10",
  currentRegFeeFreq:"monthly"   as FeeFreq,
  endFee:           "500",
  introTerm:        "1",
  introRate:        "4.00",
  revertRate:       "5",
  upfrontFee:       "1000",
  newRegFee:        "0",
  newRegFeeFreq:    "monthly"   as FeeFreq,
};

// ─── Math helpers ─────────────────────────────────────────────────────────────

function pmt(P: number, annualRate: number, months: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0 || months === 0 || P <= 0) return 0;
  return P * (r * Math.pow(1 + r, months)) / (Math.pow(1 + r, months) - 1);
}

function balanceAfter(P: number, annualRate: number, monthlyPayment: number, months: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return Math.max(0, P - monthlyPayment * months);
  return Math.max(0, P * Math.pow(1 + r, months) - monthlyPayment * (Math.pow(1 + r, months) - 1) / r);
}

function monthsToPayOff(P: number, annualRate: number, monthlyPayment: number): number {
  const r = annualRate / 12 / 100;
  if (r === 0) return monthlyPayment > 0 ? P / monthlyPayment : Infinity;
  if (monthlyPayment <= P * r) return Infinity;
  return Math.log(monthlyPayment / (monthlyPayment - P * r)) / Math.log(1 + r);
}

function toMonthlyFee(fee: number, freq: FeeFreq): number {
  return fee * FEE_PER_YEAR[freq] / 12;
}

function toDisplayRepay(monthly: number, freq: RepayFreq): number {
  return monthly * 12 / REPAY_PER_YEAR[freq];
}

// ─── Bar Chart ────────────────────────────────────────────────────────────────

function RefinanceChart({ chartData, loanTerm }: { chartData: number[]; loanTerm: number }) {
  const vW = 560, vH = 200;
  const pL = 48, pR = 10, pT = 10, pB = 40;
  const cW = vW - pL - pR;
  const cH = vH - pT - pB;

  const maxVal = Math.max(...chartData, 0);
  const minVal = Math.min(...chartData, 0);
  const rawPad = Math.max(Math.abs(maxVal), Math.abs(minVal)) * 0.15 || 500;

  const span = (maxVal - minVal) || 1000;
  const tickInterval =
    span > 200000 ? 100000 :
    span > 100000 ? 50000  :
    span > 50000  ? 20000  :
    span > 20000  ? 10000  :
    span > 10000  ? 5000   :
    span > 5000   ? 2000   :
    span > 2000   ? 1000   : 500;

  const yMax = Math.ceil((maxVal + rawPad) / tickInterval) * tickInterval;
  const yMin = Math.floor((minVal - rawPad) / tickInterval) * tickInterval;
  const yRange = yMax - yMin;

  const yTicks: number[] = [];
  for (let v = yMin; v <= yMax; v += tickInterval) yTicks.push(v);

  const xAt = (i: number) => pL + (i / loanTerm) * cW;
  const yAt = (v: number) => pT + ((yMax - v) / yRange) * cH;
  const y0 = yAt(0);

  const barW = Math.max(3, (cW / (loanTerm + 1)) * 0.75);

  const xTicks: number[] = [];
  for (let y = 0; y <= loanTerm; y += 2) xTicks.push(y);

  function fmtK(n: number): string {
    const abs = Math.abs(n);
    const sign = n < 0 ? "-$" : "$";
    if (abs >= 1000) return sign + Math.round(abs / 1000) + "K";
    return sign + Math.round(abs);
  }

  return (
    <svg viewBox={`0 0 ${vW} ${vH}`} width="100%" className="overflow-visible">
      {/* Horizontal gridlines */}
      {yTicks.map(tick => (
        <line key={tick}
          x1={pL} y1={yAt(tick)} x2={pL + cW} y2={yAt(tick)}
          stroke={tick === 0 ? "#aaa" : "#e8e8e8"}
          strokeWidth={tick === 0 ? 1 : 0.5}
        />
      ))}

      {/* Bars */}
      {chartData.map((v, i) => {
        const x = xAt(i) - barW / 2;
        const barH = Math.abs(yAt(v) - y0);
        const barY = v >= 0 ? yAt(v) : y0;
        return (
          <rect key={i} x={x} y={barY} width={barW} height={Math.max(0.5, barH)}
            fill={v >= 0 ? "#1e3a5f" : "#dc2626"} />
        );
      })}

      {/* Y labels */}
      {yTicks.map(tick => (
        <text key={tick} x={pL - 4} y={yAt(tick) + 3.5}
          textAnchor="end" fontSize="9" fill="#777" fontFamily="sans-serif">
          {fmtK(tick)}
        </text>
      ))}

      {/* Y title */}
      <text x={9} y={pT + cH / 2} textAnchor="middle" fontSize="8.5" fill="#888" fontFamily="sans-serif"
        transform={`rotate(-90, 9, ${pT + cH / 2})`}>
        Save or Cost
      </text>

      {/* X ticks */}
      {xTicks.map(yr => (
        <g key={yr}>
          <line x1={xAt(yr)} y1={y0} x2={xAt(yr)} y2={y0 + 4} stroke="#bbb" strokeWidth="0.5" />
          <text x={xAt(yr)} y={y0 + 14} textAnchor="middle" fontSize="9" fill="#777" fontFamily="sans-serif">
            {yr}
          </text>
        </g>
      ))}

      {/* X title */}
      <text x={pL + cW / 2} y={vH - 2} textAnchor="middle" fontSize="8.5" fill="#888" fontFamily="sans-serif">
        Years
      </text>

      {/* Axes */}
      <line x1={pL} y1={pT} x2={pL} y2={pT + cH} stroke="#ccc" strokeWidth="1" />
      <line x1={pL} y1={y0} x2={pL + cW} y2={y0} stroke="#ccc" strokeWidth="1" />
    </svg>
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
            This calculator helps determine whether Refinance to a new loan is the right option for you
            and it analyses three scenarios (1) not switching and keep repaying the currently loan
            (2) switch to a new loan and make the minimum repayment or (3) switch to a new loan and
            keep current and higher repayment if possible.
          </p>

          <p className="font-sans font-semibold text-orange text-[15px] mb-3">Assumptions</p>
          <ul className="space-y-2 list-disc list-outside pl-4">
            {[
              "Interest is calculated by compounding on the same repayment frequency selected, i.e. weekly, fortnightly, monthly. In practice, the interest compounding frequency may not be the same as the repayment frequency.",
              "It is assumed that a year consists 26 fortnights or 52 weeks which is counted as 364 days rather than 365 or 366 days.",
              "No rounding is done throughout the calculation, whereas repayments are rounded to at least the nearest cent in practice.",
              "This calculator does not take into account some loan features such as redraw facilities and offset accounts etc.",
            ].map((text, i) => (
              <li key={i} className="font-sans text-[13px] text-ink/70 leading-relaxed">{text}</li>
            ))}
          </ul>
        </div>

        <div className="flex justify-end px-6 py-4">
          <button
            onClick={close}
            className="bg-orange text-white font-sans font-semibold text-[13px] px-6 py-1.5 hover:bg-orange/90 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

// ─── Styled helpers ───────────────────────────────────────────────────────────

const inputCls =
  "bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[110px] outline-none focus:ring-1 focus:ring-orange/40";
const selectCls =
  "bg-[#e8e8e8] border-0 font-sans text-[11px] px-2 py-1.5 outline-none cursor-pointer text-navy";
const rowCls = "flex items-center justify-between border-b border-[#e8e8e8] py-2.5";

function ScenarioRow({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div className="flex items-center justify-between border-b border-[#f0f0f0] py-1.5 last:border-0">
      <span className="font-sans text-[12px] text-navy">{label}</span>
      {large ? (
        <span className="font-sans font-bold text-orange text-[1.3rem] leading-none">{value}</span>
      ) : (
        <span className="font-sans text-[12px] text-ink font-medium">{value}</span>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function MortgageSwitchingCalculator() {
  const [balance,           setBalance]           = useState(DEFAULTS.balance);
  const [currentRate,       setCurrentRate]       = useState(DEFAULTS.currentRate);
  const [loanTerm,          setLoanTerm]          = useState(DEFAULTS.loanTerm);
  const [repayFreq,         setRepayFreq]         = useState<RepayFreq>(DEFAULTS.repayFreq);
  const [currentRegFee,     setCurrentRegFee]     = useState(DEFAULTS.currentRegFee);
  const [currentRegFeeFreq, setCurrentRegFeeFreq] = useState<FeeFreq>(DEFAULTS.currentRegFeeFreq);
  const [endFee,            setEndFee]            = useState(DEFAULTS.endFee);
  const [introTerm,         setIntroTerm]         = useState(DEFAULTS.introTerm);
  const [introRate,         setIntroRate]         = useState(DEFAULTS.introRate);
  const [revertRate,        setRevertRate]        = useState(DEFAULTS.revertRate);
  const [upfrontFee,        setUpfrontFee]        = useState(DEFAULTS.upfrontFee);
  const [newRegFee,         setNewRegFee]         = useState(DEFAULTS.newRegFee);
  const [newRegFeeFreq,     setNewRegFeeFreq]     = useState<FeeFreq>(DEFAULTS.newRegFeeFreq);
  const [showAssumption,    setShowAssumption]    = useState(false);

  // ── Derived calculations ──────────────────────────────────────────────────

  const P         = parseFloat(balance.replace(/,/g, "")) || 0;
  const cRate     = parseFloat(currentRate) || 0;
  const term      = parseInt(loanTerm) || 0;
  const iTerm     = parseFloat(introTerm) || 0;
  const iRate     = parseFloat(introRate) || 0;
  const rRate     = parseFloat(revertRate) || 0;
  const upfront   = parseFloat(upfrontFee) || 0;
  const cRegFeeM  = toMonthlyFee(parseFloat(currentRegFee) || 0, currentRegFeeFreq);
  const nRegFeeM  = toMonthlyFee(parseFloat(newRegFee) || 0, newRegFeeFreq);
  const eFee      = parseFloat(endFee) || 0;

  const valid = P > 0 && cRate > 0 && term > 0;

  // Scenario 1 — keep current loan
  const s1Monthly    = pmt(P, cRate, term * 12);
  const s1Display    = toDisplayRepay(s1Monthly, repayFreq);
  const s1TotalPaid  = (s1Monthly + cRegFeeM) * term * 12 + eFee;
  const s1IntFees    = s1TotalPaid - P;

  // Scenario 2 — refinance, pay minimum
  const introMonths  = Math.round(iTerm * 12);
  const remainMonths = term * 12 - introMonths;
  const s2IntroM     = pmt(P, iRate, term * 12);           // min payment at intro rate over full term
  const s2IntroDisp  = toDisplayRepay(s2IntroM, repayFreq);
  const balAfterIntro = balanceAfter(P, iRate, s2IntroM, introMonths);
  const s2RevertM    = pmt(balAfterIntro, rRate, remainMonths);
  const s2RevertDisp = toDisplayRepay(s2RevertM, repayFreq);
  const s2TotalPaid  = s2IntroM * introMonths + s2RevertM * remainMonths + nRegFeeM * term * 12 + upfront;
  const s2IntFees    = s2TotalPaid - P;
  const s2Saving     = s1TotalPaid - s2TotalPaid;

  // Scenario 3 — refinance, keep same repayment
  const s3IntroM     = s1Monthly;                          // same payment, lower intro rate
  const s3IntroDisp  = toDisplayRepay(s3IntroM, repayFreq);
  const s3BalAfterIntro = balanceAfter(P, iRate, s3IntroM, introMonths);
  const s3RemainRaw  = monthsToPayOff(s3BalAfterIntro, rRate, s3IntroM);
  const s3RemainM    = Math.min(s3RemainRaw, remainMonths); // can't exceed original remaining term
  const s3TotalMonths = introMonths + s3RemainM;
  const s3RevertDisp = toDisplayRepay(s3IntroM, repayFreq); // same payment throughout
  const s3TotalPaid  = s3IntroM * s3TotalMonths + nRegFeeM * s3TotalMonths + upfront;
  const s3IntFees    = s3TotalPaid - P;
  const s3Saving     = s1TotalPaid - s3TotalPaid;
  const monthsSaved  = Math.max(0, term * 12 - s3TotalMonths);
  const yearsSaved   = Math.floor(monthsSaved / 12);
  const extraMonths  = Math.round(monthsSaved % 12);
  const timeSaved    = `${yearsSaved} year${yearsSaved !== 1 ? "s" : ""}, ${extraMonths} month${extraMonths !== 1 ? "s" : ""}`;

  // Chart data — cumulative savings per year (Scenario 1 vs Scenario 2)
  const chartData: number[] = [];
  for (let y = 0; y <= term; y++) {
    const mo = y * 12;
    const ef = y === term ? eFee : 0;
    const s1Cum = (s1Monthly + cRegFeeM) * mo + ef;
    const iMo   = Math.min(mo, introMonths);
    const rMo   = Math.max(0, mo - introMonths);
    const s2Cum = s2IntroM * iMo + s2RevertM * rMo + nRegFeeM * mo + upfront;
    chartData.push(s1Cum - s2Cum);
  }

  function handleReset() {
    setBalance(DEFAULTS.balance);
    setCurrentRate(DEFAULTS.currentRate);
    setLoanTerm(DEFAULTS.loanTerm);
    setRepayFreq(DEFAULTS.repayFreq);
    setCurrentRegFee(DEFAULTS.currentRegFee);
    setCurrentRegFeeFreq(DEFAULTS.currentRegFeeFreq);
    setEndFee(DEFAULTS.endFee);
    setIntroTerm(DEFAULTS.introTerm);
    setIntroRate(DEFAULTS.introRate);
    setRevertRate(DEFAULTS.revertRate);
    setUpfrontFee(DEFAULTS.upfrontFee);
    setNewRegFee(DEFAULTS.newRegFee);
    setNewRegFeeFreq(DEFAULTS.newRegFeeFreq);
  }

  const freq = REPAY_LABEL[repayFreq];

  return (
    <div className="max-w-5xl">
      <h2 className="font-sans font-semibold text-navy text-[1.1rem] mb-5">
        Mortgage Refinance Calculator 2025 – 2026
      </h2>

      {/* ── Inputs + Results ──────────────────────────────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">

        {/* ── Left: Inputs ── */}
        <div>
          {/* Current loan */}
          <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">
            Current loan details
          </p>
          <div className="space-y-0 mb-6">
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Loan Amount</span>
              <input type="number" value={balance} onChange={e => setBalance(e.target.value)}
                className={inputCls} placeholder="500000" />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Interest Rate (%)</span>
              <input type="number" step="0.01" value={currentRate} onChange={e => setCurrentRate(e.target.value)}
                className={inputCls} placeholder="5" />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Loan Term</span>
              <div className="flex items-center gap-1.5">
                <input type="number" value={loanTerm} onChange={e => setLoanTerm(e.target.value)}
                  className="bg-[#f0f0f0] border-0 font-sans text-[13px] px-2 py-1.5 text-right w-[52px] outline-none focus:ring-1 focus:ring-orange/40" />
                <span className="font-sans text-[11px] text-ink/50">yrs</span>
                <select value={[5,10,15,20,25,30].includes(parseInt(loanTerm)) ? loanTerm : ""}
                  onChange={e => { if (e.target.value) setLoanTerm(e.target.value); }}
                  className={selectCls}>
                  <option value="">Quick select</option>
                  {[5, 10, 15, 20, 25, 30].map(y => (
                    <option key={y} value={y}>{y} years</option>
                  ))}
                </select>
              </div>
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Repayment Frequency</span>
              <select value={repayFreq} onChange={e => setRepayFreq(e.target.value as RepayFreq)}
                className={cn(selectCls, "w-[110px]")}>
                <option value="monthly">Monthly</option>
                <option value="fortnightly">Fortnightly</option>
                <option value="weekly">Weekly</option>
              </select>
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Regular Fee</span>
              <div className="flex items-center gap-1.5">
                <input type="number" value={currentRegFee} onChange={e => setCurrentRegFee(e.target.value)}
                  className="bg-[#f0f0f0] border-0 font-sans text-[13px] px-2 py-1.5 text-right w-[70px] outline-none focus:ring-1 focus:ring-orange/40"
                  placeholder="0" />
                <select value={currentRegFeeFreq} onChange={e => setCurrentRegFeeFreq(e.target.value as FeeFreq)}
                  className={selectCls}>
                  <option value="monthly">Monthly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="weekly">Weekly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">End Fee</span>
              <input type="number" value={endFee} onChange={e => setEndFee(e.target.value)}
                className={inputCls} placeholder="500" />
            </div>
          </div>

          {/* New loan */}
          <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">
            New loan details
          </p>
          <div className="space-y-0">
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Introductory Term</span>
              <div className="flex items-center gap-1.5">
                <input type="number" value={introTerm} onChange={e => setIntroTerm(e.target.value)}
                  className="bg-[#f0f0f0] border-0 font-sans text-[13px] px-2 py-1.5 text-right w-[52px] outline-none focus:ring-1 focus:ring-orange/40" />
                <span className="font-sans text-[11px] text-ink/50">yr</span>
              </div>
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Introductory Rate (%)</span>
              <input type="number" step="0.01" value={introRate} onChange={e => setIntroRate(e.target.value)}
                className={inputCls} placeholder="4.00" />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Standard or Revert Rate (%)</span>
              <input type="number" step="0.01" value={revertRate} onChange={e => setRevertRate(e.target.value)}
                className={inputCls} placeholder="5" />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Upfront Refinance Fees</span>
              <input type="number" value={upfrontFee} onChange={e => setUpfrontFee(e.target.value)}
                className={inputCls} placeholder="1000" />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Regular Fee</span>
              <div className="flex items-center gap-1.5">
                <input type="number" value={newRegFee} onChange={e => setNewRegFee(e.target.value)}
                  className="bg-[#f0f0f0] border-0 font-sans text-[13px] px-2 py-1.5 text-right w-[70px] outline-none focus:ring-1 focus:ring-orange/40"
                  placeholder="0" />
                <select value={newRegFeeFreq} onChange={e => setNewRegFeeFreq(e.target.value as FeeFreq)}
                  className={selectCls}>
                  <option value="monthly">Monthly</option>
                  <option value="fortnightly">Fortnightly</option>
                  <option value="weekly">Weekly</option>
                  <option value="annually">Annually</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* ── Right: Results ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-4">
            View your results
          </p>

          {!valid ? (
            <p className="font-sans text-[13px] text-ink/40">Enter loan details to see results.</p>
          ) : (
            <div className="space-y-5">
              {/* Scenario 1 */}
              <div>
                <p className="font-sans font-semibold text-orange text-[13px] mb-2">
                  Scenario 1: Not Refinance
                </p>
                <div className="space-y-0">
                  <ScenarioRow label={`${freq} repayment`}    value={fmtDec(s1Display)} />
                  <ScenarioRow label="Total interest &amp; fees" value={fmt(s1IntFees)} />
                </div>
              </div>

              {/* Scenario 2 */}
              <div>
                <p className="font-sans font-semibold text-orange text-[13px] mb-2">
                  Scenario 2: Refinance and minimum repayment
                </p>
                <div className="space-y-0">
                  <ScenarioRow label={`${freq} repayment (Intro term)`} value={fmtDec(s2IntroDisp)} />
                  <ScenarioRow label={`${freq} repayment`}              value={fmtDec(s2RevertDisp)} />
                  <ScenarioRow label="Total interest &amp; fees"        value={fmt(s2IntFees)} />
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="font-sans text-[12px] text-navy">Total saving over the life of the loan</span>
                    <span className={cn(
                      "font-sans font-bold text-[1.3rem] leading-none",
                      s2Saving >= 0 ? "text-orange" : "text-red-500"
                    )}>
                      {s2Saving < 0 ? "−" : ""}{fmt(Math.abs(s2Saving))}
                    </span>
                  </div>
                </div>
              </div>

              {/* Scenario 3 */}
              <div>
                <p className="font-sans font-semibold text-orange text-[13px] mb-2">
                  Scenario 3: Refinance and higher repayment
                </p>
                <div className="space-y-0">
                  <ScenarioRow label={`${freq} repayment (Intro term)`} value={fmtDec(s3IntroDisp)} />
                  <ScenarioRow label={`${freq} repayment`}              value={fmtDec(s3RevertDisp)} />
                  <ScenarioRow label="Total interest &amp; fees"        value={fmt(s3IntFees)} />
                  <ScenarioRow label="Time saved"                       value={timeSaved} />
                  <div className="flex items-center justify-between pt-1.5">
                    <span className="font-sans text-[12px] text-navy">Total saving over the life of the loan</span>
                    <span className={cn(
                      "font-sans font-bold text-[1.3rem] leading-none",
                      s3Saving >= 0 ? "text-orange" : "text-red-500"
                    )}>
                      {s3Saving < 0 ? "−" : ""}{fmt(Math.abs(s3Saving))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ── Chart ── */}
      {valid && (
        <div className="border-t border-[#e8e8e8] pt-6 mb-6">
          <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-4">
            Refinance Save or Cost Chart
          </p>
          <RefinanceChart chartData={chartData} loanTerm={parseInt(loanTerm) || 20} />
        </div>
      )}

      {/* ── Action buttons ── */}
      <div className="flex gap-2 flex-wrap border-t border-[#e8e8e8] pt-5">
        {([
          {
            label: "Reset",
            action: handleReset,
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                <path d="M3 3v5h5"/>
              </svg>
            ),
          },
          {
            label: "Print",
            action: () => window.print(),
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"/>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/>
                <rect x="6" y="14" width="12" height="8"/>
              </svg>
            ),
          },
          {
            label: "Assumption",
            action: () => setShowAssumption(true),
            icon: (
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="8" y1="6" x2="21" y2="6"/><line x1="8" y1="12" x2="21" y2="12"/>
                <line x1="8" y1="18" x2="21" y2="18"/>
                <line x1="3" y1="6" x2="3.01" y2="6"/><line x1="3" y1="12" x2="3.01" y2="12"/>
                <line x1="3" y1="18" x2="3.01" y2="18"/>
              </svg>
            ),
          },
        ] as { label: string; action: () => void; icon: React.ReactNode }[]).map(btn => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="flex items-center gap-2 bg-orange text-white font-sans font-semibold text-[13px] px-5 py-2 hover:bg-orange/90 active:scale-95 transition-all"
          >
            {btn.icon}
            {btn.label}
          </button>
        ))}
      </div>

      {showAssumption && <AssumptionModal onClose={() => setShowAssumption(false)} />}
    </div>
  );
}
