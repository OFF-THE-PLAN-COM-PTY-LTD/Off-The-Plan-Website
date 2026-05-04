"use client";

import { useState, useEffect } from "react";

const fmt = (n: number) =>
  "$" + Math.round(Math.max(0, n)).toLocaleString("en-AU");

const fmtDec = (n: number) =>
  "$" + Math.max(0, n).toLocaleString("en-AU", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

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

function calcLoan(principal: number, params: LoanParams): LoanResult {
  const r = (parseFloat(params.rate) || 0) / 12 / 100;
  const n = (parseInt(params.term) || 30) * 12;
  const monthly = r > 0 ? principal * (r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1) : 0;
  const totalInterest = monthly * n - principal;
  const upfront = parseFloat(params.upfrontFee) || 0;
  const mFee = parseFloat(params.monthlyFee) || 0;
  const totalFees = upfront + mFee * n;
  return {
    monthly,
    totalInterest,
    totalFees,
    totalCost: monthly * n + totalFees,
  };
}

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
      <p className="text-orange font-sans font-semibold text-[15px] mb-3">{label}</p>
      <div className="space-y-0">
        <div className={rowCls}>
          <span className="font-sans text-[13px] text-navy">Interest rate (%)</span>
          <input
            type="number"
            step="0.01"
            value={params.rate}
            onChange={e => onChange({ ...params, rate: e.target.value })}
            placeholder="6.50"
            className={inputCls}
          />
        </div>
        <div className={rowCls}>
          <span className="font-sans text-[13px] text-navy">Loan term (years)</span>
          <select
            value={params.term}
            onChange={e => onChange({ ...params, term: e.target.value })}
            className="bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[120px] outline-none focus:ring-1 focus:ring-orange/40 cursor-pointer"
          >
            {[5, 10, 15, 20, 25, 30].map(y => (
              <option key={y} value={y}>{y} years</option>
            ))}
          </select>
        </div>
        <div className={rowCls}>
          <span className="font-sans text-[13px] text-navy">Monthly fee</span>
          <input
            type="number"
            value={params.monthlyFee}
            onChange={e => onChange({ ...params, monthlyFee: e.target.value })}
            placeholder="0"
            className={inputCls}
          />
        </div>
        <div className={rowCls}>
          <span className="font-sans text-[13px] text-navy">Upfront fee</span>
          <input
            type="number"
            value={params.upfrontFee}
            onChange={e => onChange({ ...params, upfrontFee: e.target.value })}
            placeholder="0"
            className={inputCls}
          />
        </div>
      </div>
    </div>
  );
}

function ResultColumn({
  label, result,
}: {
  label: string;
  result: LoanResult;
}) {
  return (
    <div>
      <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">{label}</p>
      <div className="space-y-2">
        {[
          { label: "Monthly repayment", value: fmtDec(result.monthly) },
          { label: "Total interest", value: fmt(result.totalInterest) },
          { label: "Total fees", value: fmt(result.totalFees) },
        ].map(row => (
          <div key={row.label} className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
            <span className="text-navy">{row.label}</span>
            <span className="text-ink font-medium">{row.value}</span>
          </div>
        ))}
        <div className="flex justify-between text-[13px] font-sans pt-1">
          <span className="text-orange font-semibold">Total cost</span>
          <span className="text-orange font-semibold">{fmt(result.totalCost)}</span>
        </div>
      </div>
    </div>
  );
}

export default function LoanComparisonCalculator() {
  const [loanAmount, setLoanAmount] = useState("500000");
  const [loan1, setLoan1] = useState<LoanParams>({ rate: "6.50", term: "30", monthlyFee: "0", upfrontFee: "0" });
  const [loan2, setLoan2] = useState<LoanParams>({ rate: "5.99", term: "30", monthlyFee: "10", upfrontFee: "300" });
  const [result1, setResult1] = useState<LoanResult | null>(null);
  const [result2, setResult2] = useState<LoanResult | null>(null);

  useEffect(() => {
    const P = parseFloat(loanAmount.replace(/,/g, "")) || 0;
    if (P <= 0) {
      setResult1(null);
      setResult2(null);
      return;
    }
    setResult1(calcLoan(P, loan1));
    setResult2(calcLoan(P, loan2));
  }, [loanAmount, loan1, loan2]);

  const rowCls2 = "flex items-center justify-between border-b border-[#e8e8e8] py-2.5";
  const inputFullCls =
    "bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[140px] outline-none focus:ring-1 focus:ring-orange/40";

  const saving = result1 && result2 ? result1.totalCost - result2.totalCost : null;

  return (
    <div className="max-w-4xl">
      <h2 className="font-sans font-semibold text-navy text-[1.1rem] mb-5">
        Loan Comparison Calculator 2025 – 2026
      </h2>

      {/* Shared loan amount */}
      <div className="mb-6 pb-5 border-b border-[#e8e8e8]">
        <p className="text-orange font-sans font-semibold text-[15px] mb-3">Loan amount</p>
        <div className={rowCls2}>
          <span className="font-sans text-[13px] text-navy">Loan amount ($)</span>
          <input
            type="number"
            value={loanAmount}
            onChange={e => setLoanAmount(e.target.value)}
            className={inputFullCls}
          />
        </div>
      </div>

      {/* Two-column loan params */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 mb-8">
        <LoanColumn label="Loan 1 Details" params={loan1} onChange={setLoan1} />
        <LoanColumn label="Loan 2 Details" params={loan2} onChange={setLoan2} />
      </div>

      {/* Results */}
      {result1 && result2 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          <ResultColumn label="Loan 1 Results" result={result1} />
          <ResultColumn label="Loan 2 Results" result={result2} />

          {saving !== null && (
            <div className="lg:col-span-2 border-t border-[#e8e8e8] pt-5">
              {Math.abs(saving) < 1 ? (
                <p className="font-sans text-[13px] text-navy/60">Both loans have the same total cost.</p>
              ) : saving > 0 ? (
                <p className="font-sans text-[14px] font-semibold text-navy">
                  Loan 2 saves you{" "}
                  <span className="text-orange">{fmt(saving)}</span>{" "}
                  over the life of the loan.
                </p>
              ) : (
                <p className="font-sans text-[14px] font-semibold text-navy">
                  Loan 1 saves you{" "}
                  <span className="text-orange">{fmt(Math.abs(saving))}</span>{" "}
                  over the life of the loan.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
