"use client";

import { useState, useEffect } from "react";

const fmt = (n: number) =>
  "$" + Math.round(Math.abs(n)).toLocaleString("en-AU");

const fmtDec = (n: number) =>
  "$" + Math.abs(n).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

function calcMonthly(principal: number, annualRate: number, years: number): number {
  const r = annualRate / 12 / 100;
  const n = years * 12;
  if (r === 0 || n === 0) return 0;
  return principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function totalInterestPaid(monthly: number, years: number, principal: number): number {
  return Math.max(0, monthly * years * 12 - principal);
}

interface Scenario {
  label: string;
  description: string;
  monthlyRepayment: number;
  totalInterest: number;
  totalCost: number;
  saving: number | null;
}

const inputCls =
  "bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[140px] outline-none focus:ring-1 focus:ring-orange/40";
const rowCls = "flex items-center justify-between border-b border-[#e8e8e8] py-2.5";

export default function MortgageSwitchingCalculator() {
  const [balance, setBalance] = useState("400000");
  const [currentRate, setCurrentRate] = useState("7.20");
  const [remainingTerm, setRemainingTerm] = useState("25");
  const [currentFee, setCurrentFee] = useState("0");
  const [newRate, setNewRate] = useState("6.20");
  const [newTerm, setNewTerm] = useState("25");
  const [newFee, setNewFee] = useState("0");
  const [dischargeFee, setDischargeFee] = useState("350");
  const [applicationFee, setApplicationFee] = useState("0");
  const [otherCosts, setOtherCosts] = useState("0");

  const [scenarios, setScenarios] = useState<Scenario[]>([]);

  useEffect(() => {
    const P = parseFloat(balance.replace(/,/g, "")) || 0;
    const cRate = parseFloat(currentRate) || 0;
    const cTerm = parseInt(remainingTerm) || 0;
    const cFee = parseFloat(currentFee) || 0;
    const nRate = parseFloat(newRate) || 0;
    const nTerm = parseInt(newTerm) || cTerm;
    const nFee = parseFloat(newFee) || 0;

    if (P <= 0 || cRate <= 0 || cTerm <= 0 || nRate <= 0) {
      setScenarios([]);
      return;
    }

    const switchCosts =
      (parseFloat(dischargeFee) || 0) +
      (parseFloat(applicationFee) || 0) +
      (parseFloat(otherCosts) || 0);

    // Scenario 1: Don't refinance — keep current loan
    const s1Base = calcMonthly(P, cRate, cTerm);
    const s1Monthly = s1Base + cFee;
    const s1Interest = totalInterestPaid(s1Base, cTerm, P);
    const s1Total = s1Monthly * cTerm * 12;

    // Scenario 2: Refinance — pay minimum (new loan repayment)
    const s2Base = calcMonthly(P, nRate, nTerm);
    const s2Monthly = s2Base + nFee;
    const s2Interest = totalInterestPaid(s2Base, nTerm, P);
    const s2Total = s2Monthly * nTerm * 12 + switchCosts;

    // Scenario 3: Refinance — keep paying current repayment amount (pay off faster)
    const s3Monthly = s1Monthly;
    const s3NetPayment = s3Monthly - nFee;
    const rMonthly = nRate / 12 / 100;
    let s3Months = nTerm * 12;
    if (rMonthly > 0 && s3NetPayment > P * rMonthly) {
      s3Months = Math.log(s3NetPayment / (s3NetPayment - P * rMonthly)) / Math.log(1 + rMonthly);
    }
    const s3Years = s3Months / 12;
    const s3Total = s3Monthly * s3Months + switchCosts;
    const s3Interest = totalInterestPaid(s3NetPayment, s3Years, P);

    setScenarios([
      {
        label: "Scenario 1",
        description: "Not Refinancing",
        monthlyRepayment: s1Monthly,
        totalInterest: s1Interest,
        totalCost: s1Total,
        saving: null,
      },
      {
        label: "Scenario 2",
        description: "Refinance — minimum repayment",
        monthlyRepayment: s2Monthly,
        totalInterest: s2Interest,
        totalCost: s2Total,
        saving: s1Total - s2Total,
      },
      {
        label: "Scenario 3",
        description: `Refinance — maintain current repayment (~${Math.round(s3Years)} yrs)`,
        monthlyRepayment: s3Monthly,
        totalInterest: s3Interest,
        totalCost: s3Total,
        saving: s1Total - s3Total,
      },
    ]);
  }, [balance, currentRate, remainingTerm, currentFee, newRate, newTerm, newFee,
      dischargeFee, applicationFee, otherCosts]);

  return (
    <div className="max-w-4xl">
      <h2 className="font-sans font-semibold text-navy text-[1.1rem] mb-5">
        Mortgage Switching Calculator 2025 – 2026
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
        {/* ── Left: Current loan ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] mb-3">Current loan details</p>
          <div className="space-y-0">
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Remaining balance</span>
              <input type="number" value={balance} onChange={e => setBalance(e.target.value)} className={inputCls} placeholder="400000" />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Interest rate (%)</span>
              <input type="number" step="0.01" value={currentRate} onChange={e => setCurrentRate(e.target.value)} className={inputCls} placeholder="7.20" />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Remaining term (years)</span>
              <input type="number" value={remainingTerm} onChange={e => setRemainingTerm(e.target.value)} className={inputCls} placeholder="25" />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Monthly fee</span>
              <input type="number" value={currentFee} onChange={e => setCurrentFee(e.target.value)} className={inputCls} placeholder="0" />
            </div>
          </div>
        </div>

        {/* ── Right: New loan + Switching costs ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] mb-3">New loan details</p>
          <div className="space-y-0 mb-6">
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Interest rate (%)</span>
              <input type="number" step="0.01" value={newRate} onChange={e => setNewRate(e.target.value)} className={inputCls} placeholder="6.20" />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Loan term (years)</span>
              <input type="number" value={newTerm} onChange={e => setNewTerm(e.target.value)} className={inputCls} placeholder="25" />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Monthly fee</span>
              <input type="number" value={newFee} onChange={e => setNewFee(e.target.value)} className={inputCls} placeholder="0" />
            </div>
          </div>

          <p className="text-orange font-sans font-semibold text-[15px] mb-3">Switching costs</p>
          <div className="space-y-0">
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Discharge fee</span>
              <input type="number" value={dischargeFee} onChange={e => setDischargeFee(e.target.value)} className={inputCls} />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Application fee</span>
              <input type="number" value={applicationFee} onChange={e => setApplicationFee(e.target.value)} className={inputCls} />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Other costs</span>
              <input type="number" value={otherCosts} onChange={e => setOtherCosts(e.target.value)} className={inputCls} />
            </div>
          </div>
        </div>
      </div>

      {/* ── Scenarios ── */}
      {scenarios.length > 0 && (
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-5">Comparison Scenarios</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {scenarios.map((sc, i) => (
              <div key={i} className="border border-[#e0e0e0] p-5">
                <p className="font-sans font-semibold text-navy text-[13px] mb-0.5">{sc.label}</p>
                <p className="font-sans text-[11px] text-ink/50 mb-4 leading-snug">{sc.description}</p>
                <div className="space-y-2">
                  <div className="flex justify-between text-[12px] font-sans border-b border-[#f0f0f0] pb-1.5">
                    <span className="text-navy">Monthly repayment</span>
                    <span className="text-ink font-medium">{fmtDec(sc.monthlyRepayment)}</span>
                  </div>
                  <div className="flex justify-between text-[12px] font-sans border-b border-[#f0f0f0] pb-1.5">
                    <span className="text-navy">Total interest</span>
                    <span className="text-ink font-medium">{fmt(sc.totalInterest)}</span>
                  </div>
                  <div className="flex justify-between text-[12px] font-sans border-b border-[#f0f0f0] pb-1.5">
                    <span className="text-navy">Total cost</span>
                    <span className="text-ink font-medium">{fmt(sc.totalCost)}</span>
                  </div>
                  {sc.saving !== null && (
                    <div className="flex justify-between text-[12px] font-sans pt-1">
                      <span className="text-orange font-semibold">
                        {sc.saving >= 0 ? "You save" : "You pay extra"}
                      </span>
                      <span className={`font-semibold text-[13px] ${sc.saving >= 0 ? "text-orange" : "text-red-500"}`}>
                        {sc.saving >= 0 ? "" : "−"}{fmt(Math.abs(sc.saving))}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
