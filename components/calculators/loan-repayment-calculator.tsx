"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type LoanType = "pi" | "io";

const fmt = (n: number) =>
  "$" + Math.max(0, n).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

export default function LoanRepaymentCalculator() {
  const [loanAmount, setLoanAmount] = useState("500000");
  const [interestRate, setInterestRate] = useState("6.00");
  const [loanTerm, setLoanTerm] = useState("30");
  const [loanType, setLoanType] = useState<LoanType>("pi");

  const [result, setResult] = useState({
    monthly: 0,
    fortnightly: 0,
    weekly: 0,
    totalRepaid: 0,
    totalInterest: 0,
  });

  useEffect(() => {
    const P = parseFloat(loanAmount.replace(/,/g, "")) || 0;
    const annualRate = parseFloat(interestRate) || 0;
    const years = parseInt(loanTerm) || 30;

    if (P <= 0 || annualRate <= 0) return;

    const r = annualRate / 12 / 100;
    const n = years * 12;

    let monthly: number;
    if (loanType === "pi") {
      monthly = r > 0 ? P * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : P / n;
    } else {
      monthly = P * r;
    }

    const totalRepaid = loanType === "pi" ? monthly * n : monthly * n + P;
    const totalInterest = totalRepaid - P;

    setResult({
      monthly,
      fortnightly: monthly / 2,
      weekly: monthly / 4.33,
      totalRepaid,
      totalInterest,
    });
  }, [loanAmount, interestRate, loanTerm, loanType]);

  const inputCls =
    "bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[140px] outline-none focus:ring-1 focus:ring-orange/40";
  const rowCls = "flex items-center justify-between border-b border-[#e8e8e8] py-2.5";

  return (
    <div className="max-w-4xl">
      <h2 className="font-sans font-semibold text-navy text-[1.1rem] mb-5">
        Loan Repayment Calculator 2025 – 2026
      </h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Left: Inputs ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] mb-3">Enter your details</p>
          <div className="space-y-0">
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Loan amount</span>
              <input
                type="number"
                value={loanAmount}
                onChange={e => setLoanAmount(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Interest rate (%)</span>
              <input
                type="number"
                step="0.01"
                value={interestRate}
                onChange={e => setInterestRate(e.target.value)}
                className={inputCls}
              />
            </div>
            <div className={rowCls}>
              <span className="font-sans text-[13px] text-navy">Loan term (years)</span>
              <select
                value={loanTerm}
                onChange={e => setLoanTerm(e.target.value)}
                className="bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[140px] outline-none focus:ring-1 focus:ring-orange/40 cursor-pointer"
              >
                {[5, 10, 15, 20, 25, 30].map(y => (
                  <option key={y} value={y}>{y} years</option>
                ))}
              </select>
            </div>
            <Toggle
              label="Repayment type"
              options={[
                { label: "P & I", value: "pi" },
                { label: "Interest Only", value: "io" },
              ]}
              value={loanType}
              onChange={setLoanType}
            />
          </div>

          <button
            onClick={() => {
              setLoanAmount("500000");
              setInterestRate("6.00");
              setLoanTerm("30");
              setLoanType("pi");
            }}
            className="mt-5 border border-[#ccc] text-navy font-sans text-[12px] px-5 py-1.5 hover:bg-[#f0f0f0] transition-colors"
          >
            Reset
          </button>
        </div>

        {/* ── Right: Results ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">Your repayments</p>
          <div className="space-y-2 mb-5">
            <div className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
              <span className="text-navy font-medium">Monthly repayment</span>
              <span className="text-orange font-semibold text-[1.1rem]">{fmt(result.monthly)}</span>
            </div>
            <div className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
              <span className="text-navy">Fortnightly repayment</span>
              <span className="text-ink font-medium">{fmt(result.fortnightly)}</span>
            </div>
            <div className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
              <span className="text-navy">Weekly repayment</span>
              <span className="text-ink font-medium">{fmt(result.weekly)}</span>
            </div>
          </div>

          <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">Loan summary</p>
          <div className="space-y-2">
            <div className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
              <span className="text-navy">Total amount repaid</span>
              <span className="text-ink font-medium">{fmt(result.totalRepaid)}</span>
            </div>
            <div className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
              <span className="text-navy">Total interest payable</span>
              <span className="text-ink font-medium">{fmt(result.totalInterest)}</span>
            </div>
          </div>

          {loanType === "io" && (
            <p className="font-sans text-[11px] text-ink/40 mt-4 leading-relaxed">
              Interest only period shown. Principal must be repaid at end of term or by refinancing.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
