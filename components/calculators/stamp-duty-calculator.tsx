"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";

type State = "ACT" | "NSW" | "NT" | "QLD" | "SA" | "TAS" | "VIC" | "WA";
type PropertyType = "established" | "new" | "vacant-land";
type Occupancy = "primary" | "investment";

const STATES: State[] = ["ACT", "NSW", "NT", "QLD", "SA", "TAS", "VIC", "WA"];

const fmt = (n: number) =>
  "$" + n.toFixed(2).replace(/\B(?=(\d{3})+(?!\d))/g, ",");

// ── Stamp duty bracket calculators ────────────────────────────────────────────

function calcNSW(p: number) {
  if (p <= 14000) return p * 0.0125;
  if (p <= 30000) return 175 + (p - 14000) * 0.015;
  if (p <= 80000) return 415 + (p - 30000) * 0.0175;
  if (p <= 300000) return 1290 + (p - 80000) * 0.035;
  if (p <= 1000000) return 8990 + (p - 300000) * 0.045;
  if (p <= 3000000) return 40490 + (p - 1000000) * 0.055;
  return 150490 + (p - 3000000) * 0.07;
}
function calcVIC(p: number) {
  if (p > 960000) return p * 0.055;
  if (p <= 25000) return p * 0.014;
  if (p <= 130000) return 350 + (p - 25000) * 0.024;
  return 2870 + (p - 130000) * 0.06;
}
function calcQLD(p: number) {
  if (p <= 5000) return 0;
  if (p <= 75000) return (p - 5000) * 0.015;
  if (p <= 540000) return 1050 + (p - 75000) * 0.035;
  if (p <= 1000000) return 17325 + (p - 540000) * 0.045;
  return 38025 + (p - 1000000) * 0.0575;
}
function calcWA(p: number) {
  if (p <= 80000) return p * 0.019;
  if (p <= 100000) return 1520 + (p - 80000) * 0.0285;
  if (p <= 250000) return 2090 + (p - 100000) * 0.038;
  if (p <= 500000) return 7790 + (p - 250000) * 0.0475;
  return 19665 + (p - 500000) * 0.0515;
}
function calcSA(p: number) {
  if (p <= 12000) return p * 0.01;
  if (p <= 30000) return 120 + (p - 12000) * 0.02;
  if (p <= 50000) return 480 + (p - 30000) * 0.03;
  if (p <= 100000) return 1080 + (p - 50000) * 0.035;
  if (p <= 200000) return 2830 + (p - 100000) * 0.04;
  if (p <= 250000) return 6830 + (p - 200000) * 0.0425;
  if (p <= 300000) return 8955 + (p - 250000) * 0.0475;
  if (p <= 500000) return 11330 + (p - 300000) * 0.05;
  return 21330 + (p - 500000) * 0.055;
}
function calcTAS(p: number) {
  if (p <= 3000) return 50;
  if (p <= 25000) return 50 + (p - 3000) * 0.0175;
  if (p <= 75000) return 435 + (p - 25000) * 0.0225;
  if (p <= 200000) return 1560 + (p - 75000) * 0.035;
  if (p <= 375000) return 5935 + (p - 200000) * 0.04;
  if (p <= 725000) return 12935 + (p - 375000) * 0.0425;
  return 27810 + (p - 725000) * 0.045;
}
function calcACT(p: number) {
  if (p <= 200000) return p * 0.006;
  if (p <= 300000) return 1200 + (p - 200000) * 0.022;
  if (p <= 500000) return 3400 + (p - 300000) * 0.034;
  if (p <= 750000) return 10200 + (p - 500000) * 0.0432;
  if (p <= 1000000) return 21000 + (p - 750000) * 0.059;
  return 35750 + (p - 1000000) * 0.064;
}
function calcNT(p: number) {
  const v = p / 1000;
  if (p <= 525000) return Math.max(0, 0.06571441 * v * v + 15 * v);
  return p * 0.0495;
}

function baseStampDuty(state: State, price: number): number {
  switch (state) {
    case "NSW": return calcNSW(price);
    case "VIC": return calcVIC(price);
    case "QLD": return calcQLD(price);
    case "WA": return calcWA(price);
    case "SA": return calcSA(price);
    case "TAS": return calcTAS(price);
    case "ACT": return calcACT(price);
    case "NT": return calcNT(price);
  }
}

function fhbGrant(state: State): number {
  const grants: Partial<Record<State, number>> = {
    NSW: 10000, VIC: 10000, QLD: 30000, WA: 10000, SA: 15000, TAS: 20000, ACT: 0, NT: 10000,
  };
  return grants[state] ?? 0;
}

// ── Toggle component ──────────────────────────────────────────────────────────

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

// ── Main component ────────────────────────────────────────────────────────────

export default function StampDutyCalculator() {
  const [state, setState] = useState<State>("ACT");
  const [price, setPrice] = useState("350000");
  const [firstHome, setFirstHome] = useState<"no" | "yes">("no");
  const [occupancy, setOccupancy] = useState<Occupancy>("primary");
  const [purchaseType, setPurchaseType] = useState<PropertyType>("established");
  const [pensioner, setPensioner] = useState<"no" | "yes">("no");
  const [dependants, setDependants] = useState(0);

  const [result, setResult] = useState({
    stampDuty: 0, mortgageReg: 178, transferFee: 479, total: 0, grant: 0,
  });

  useEffect(() => {
    const p = parseFloat(price.replace(/,/g, "")) || 0;
    if (p <= 0) return;

    let duty = baseStampDuty(state, p);

    // FHB concessions
    if (firstHome === "yes") {
      if (state === "NSW" && p <= 800000 && purchaseType !== "established") duty = 0;
      else if (state === "VIC" && p <= 600000) duty = 0;
      else if (state === "VIC" && p <= 750000) duty *= (750000 - p) / 150000;
      else if (state === "QLD" && p <= 500000 && purchaseType !== "established") duty = 0;
      else if (state === "WA" && p <= 430000) duty = 0;
    }

    // Pensioner concession (rough - varies widely)
    if (pensioner === "yes" && occupancy === "primary") {
      duty = Math.max(0, duty * 0.5);
    }

    const mortgageReg = 143 + Math.min(Math.floor(p / 10000) * 2.5, 500);
    const transferFee = 143 + Math.min(Math.floor(p / 10000) * 4, 2000);
    const grant = firstHome === "yes" ? fhbGrant(state) : 0;

    setResult({
      stampDuty: duty,
      mortgageReg,
      transferFee,
      total: duty + mortgageReg + transferFee,
      grant,
    });
  }, [state, price, firstHome, occupancy, purchaseType, pensioner, dependants]);

  const inputRowCls = "flex items-center justify-between border-b border-[#e8e8e8] py-2.5";
  const inputCls = "bg-[#f0f0f0] border-0 font-sans text-[13px] px-3 py-1.5 text-right w-[140px] outline-none focus:ring-1 focus:ring-orange/40";

  return (
    <div className="max-w-4xl">
      <h2 className="font-sans font-semibold text-navy text-[1.1rem] mb-1">
        Stamp Duty Calculator 2025 – 2026
      </h2>

      {/* State tabs */}
      <div className="flex flex-wrap gap-0 mb-5 border border-[#ccc] w-fit overflow-hidden">
        {STATES.map((s) => (
          <button
            key={s}
            onClick={() => setState(s)}
            className={cn(
              "px-5 py-2 font-sans text-[13px] border-r last:border-r-0 border-[#ccc] transition-colors",
              state === s ? "bg-orange text-white" : "bg-white text-navy hover:bg-orange/10",
            )}
          >
            {s}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* ── Inputs ── */}
        <div>
          <p className="text-orange font-sans font-semibold text-[15px] mb-3">Enter your details</p>
          <div className="space-y-0">
            <Toggle label="Are you first home buyer" options={[{ label: "No", value: "no" }, { label: "Yes", value: "yes" }]} value={firstHome} onChange={setFirstHome} />
            <div className={inputRowCls}>
              <span className="font-sans text-[13px] text-navy">Value of Property</span>
              <input type="number" value={price} onChange={e => setPrice(e.target.value)} className={inputCls} />
            </div>
            <Toggle label="Property type" options={[{ label: "Primary residence", value: "primary" }, { label: "Investment", value: "investment" }]} value={occupancy} onChange={setOccupancy} />
            <Toggle
              label="Are you purchasing"
              options={[
                { label: "Established Home", value: "established" },
                { label: "New Home", value: "new" },
                { label: "Vacant Land", value: "vacant-land" },
              ]}
              value={purchaseType}
              onChange={setPurchaseType}
            />
            <Toggle label="Eligible pensioner?" options={[{ label: "No", value: "no" }, { label: "Yes", value: "yes" }]} value={pensioner} onChange={setPensioner} />
            <NumberButtons label="Number of dependent children" value={dependants} onChange={setDependants} options={[0, 1, 2, 3, 4, 5]} />
          </div>
        </div>

        {/* ── Results ── */}
        <div>
          <div className="grid grid-cols-2 gap-6">
            {/* Government Fees */}
            <div>
              <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">Government Fees</p>
              <div className="space-y-2">
                {[
                  { label: "Stamp Duty on Property", value: result.stampDuty },
                  { label: "Mortgage Registration", value: result.mortgageReg },
                  { label: "Transfer Fee", value: result.transferFee },
                ].map(row => (
                  <div key={row.label} className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
                    <span className="text-navy">{row.label}</span>
                    <span className="text-ink font-medium">{fmt(row.value)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-[13px] font-sans pt-1">
                  <span className="text-orange font-semibold">Total Government Fees</span>
                  <span className="text-orange font-semibold">{fmt(result.total)}</span>
                </div>
              </div>
            </div>

            {/* Government Grant */}
            <div>
              <p className="text-orange font-sans font-semibold text-[15px] border-b border-orange pb-1 mb-3">Government Grant</p>
              <div className="flex justify-between text-[13px] font-sans border-b border-[#f0f0f0] pb-1.5">
                <span className="text-navy">First Home Owner Grant:</span>
                <span className="text-ink font-medium">{fmt(result.grant)}</span>
              </div>
              <div className="flex justify-between text-[13px] font-sans pt-1">
                <span className="text-orange font-semibold">Total Government Grant</span>
                <span className="text-orange font-semibold">{fmt(result.grant)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
