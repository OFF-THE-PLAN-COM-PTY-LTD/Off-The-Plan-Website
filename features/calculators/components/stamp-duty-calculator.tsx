"use client";

import { useState, useEffect, useCallback } from "react";
import { createPortal } from "react-dom";
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

// ── Rates & Thresholds data ───────────────────────────────────────────────────

interface RateRow { property: string; duty: string }
interface RateTable {
  title: string;
  col1?: string;
  col2?: string;
  rows: RateRow[];
  note?: string;
}
interface IncomeThresholdRow { dependants: string; threshold: string }
interface StateRates {
  name: string;
  tables: RateTable[];
  incomeThresholds?: { title: string; intro?: string; rows: IncomeThresholdRow[] };
  extraNotes?: string[];
  fees?: { label: string; amount: string }[];
}

const RATES_INFO: Record<State, StateRates> = {
  ACT: {
    name: "Australian Capital Territory",
    tables: [
      {
        title: "Stamp Duty – General Rate and Threshold from 1 July 2024",
        col2: "Duty Payable: Owner Occupier",
        rows: [
          { property: "Up to $260,000", duty: "$0.28 per $100 or part thereof, whichever is greater" },
          { property: "$260,001 to $300,000", duty: "$728 plus $2.20 per $100 or part thereof by which the value exceeds $260,000" },
          { property: "$300,001 to $500,000", duty: "$1,608 plus $3.40 per $100 or part thereof by which the value exceeds $300,000" },
          { property: "$500,001 to $750,000", duty: "$8,408 plus $4.32 per $100 or part thereof by which the value exceeds $500,000" },
          { property: "$750,001 to $1,000,000", duty: "$19,208 plus $5.90 per $100 or part thereof by which the value exceeds $750,000" },
          { property: "$1,000,001 to $1,455,000", duty: "$33,958 plus $6.40 per $100 or part thereof by which the value exceeds $1,000,000" },
          { property: "More than $1,455,000", duty: "A flat rate of $4.54 per $100 applied to the total transaction value" },
        ],
      },
      {
        title: "",
        col2: "Duty Payable: Non-Owner Occupier",
        rows: [
          { property: "Up to $200,000", duty: "$1.20 per $100 or part thereof, whichever is greater" },
          { property: "$200,001 to $300,000", duty: "$2,400 plus $2.20 per $100 or part thereof by which the value exceeds $200,000" },
          { property: "$300,001 to $500,000", duty: "$4,600 plus $3.40 per $100 or part thereof by which the value exceeds $300,000" },
          { property: "$500,001 to $750,000", duty: "$11,400 plus $4.32 per $100 or part thereof by which the value exceeds $500,000" },
          { property: "$750,001 to $1,000,000", duty: "$22,200 plus $5.90 per $100 or part thereof by which the value exceeds $750,000" },
          { property: "$1,000,001 to $1,455,000", duty: "$36,950 plus $6.40 per $100 or part thereof by which the value exceeds $1,000,000" },
          { property: "$1,455,001 and over", duty: "A flat rate of $4.54 per $100 applied to the total transaction value" },
        ],
      },
      {
        title: "Stamp Duty – Home Buyer Concessions 1 July 2025",
        col2: "Duty Payable",
        rows: [
          { property: "Less than or equal to $1,020,000", duty: "$0" },
          { property: "More than $1,020,000 but less than $1,455,000", duty: "$6 for every $100, or part of $100, by which the dutiable value exceeds $1,020,000" },
          { property: "$1,455,000 or more", duty: "A flat rate of $6.40 per $100 applied to the total dutiable value, less an amount of $35,238" },
        ],
      },
    ],
    incomeThresholds: {
      title: "Income Threshold Amount after 1 July 2025",
      intro: "To be eligible for a duty concession, the income test must be satisfied. The combined total income of all applicants and their domestic partner/s over the 1 year period prior to the date of the grant, transfer or agreement for transfer (whichever is first) must be less than or equal to the relevant income threshold as follows:",
      rows: [
        { dependants: "0", threshold: "$250,000" },
        { dependants: "1", threshold: "$254,600" },
        { dependants: "2", threshold: "$259,200" },
        { dependants: "3", threshold: "$263,800" },
        { dependants: "4", threshold: "$268,400" },
        { dependants: "5 or more", threshold: "$273,000" },
      ],
    },
    extraNotes: [
      "Stamp Duty – Pensioner Duty Concession From 1 July 2025, the benefit of the concession is capped at the duty payable for owner occupier property purchases valued at $1,020,000. This means that eligible pensioners acquiring properties valued at $1,020,000 or under will not pay duty, while those acquiring property over $1,020,000 may now be eligible for a reduction in duty of $35,238.",
      "First Home Owner Grant: After 1 July 2019, the First Home Owner Grant (FHOG) no longer exists. The FHOG was replaced by the new Home Buyer Concession Scheme, which provides a full duty concession for eligible buyers.",
    ],
    fees: [
      { label: "Mortgage Registration Fee 1 July 2025", amount: "$178.00" },
      { label: "Land Transfer Fee", amount: "$479.00" },
    ],
  },

  NSW: {
    name: "New South Wales",
    tables: [
      {
        title: "Stamp Duty – General Rate",
        col2: "Duty Payable",
        rows: [
          { property: "$0 to $14,000", duty: "$1.25 per $100 or part thereof" },
          { property: "$14,001 to $30,000", duty: "$175 plus $1.50 per $100 or part thereof by which the value exceeds $14,000" },
          { property: "$30,001 to $80,000", duty: "$415 plus $1.75 per $100 or part thereof by which the value exceeds $30,000" },
          { property: "$80,001 to $300,000", duty: "$1,290 plus $3.50 per $100 or part thereof by which the value exceeds $80,000" },
          { property: "$300,001 to $1,000,000", duty: "$8,990 plus $4.50 per $100 or part thereof by which the value exceeds $300,000" },
          { property: "$1,000,001 to $3,000,000", duty: "$40,490 plus $5.50 per $100 or part thereof by which the value exceeds $1,000,000" },
          { property: "Over $3,000,000", duty: "$150,490 plus $7.00 per $100 or part thereof by which the value exceeds $3,000,000" },
        ],
      },
      {
        title: "First Home Buyer Concession",
        col2: "Duty Payable",
        rows: [
          { property: "Up to $800,000 (new home or vacant land)", duty: "$0 – full exemption" },
          { property: "$800,001 to $1,000,000 (new home)", duty: "Concessional rate (sliding scale)" },
          { property: "Up to $650,000 (established home)", duty: "$0 – full exemption" },
          { property: "$650,001 to $800,000 (established home)", duty: "Concessional rate (sliding scale)" },
        ],
      },
    ],
    extraNotes: [
      "First Home Owner Grant: $10,000 for first home buyers purchasing or building a new home valued up to $600,000.",
      "Foreign purchaser surcharge: An additional 8% surcharge applies to foreign persons purchasing residential land in NSW.",
    ],
    fees: [
      { label: "Mortgage Registration Fee", amount: "$154.20 (approx.)" },
      { label: "Transfer Fee", amount: "$154.20 base (varies with value)" },
    ],
  },

  VIC: {
    name: "Victoria",
    tables: [
      {
        title: "Stamp Duty – General Rate",
        col2: "Duty Payable",
        rows: [
          { property: "$0 to $25,000", duty: "$1.40 per $100 or part thereof" },
          { property: "$25,001 to $130,000", duty: "$350 plus $2.40 per $100 or part thereof by which the value exceeds $25,000" },
          { property: "$130,001 to $960,000", duty: "$2,870 plus $6.00 per $100 or part thereof by which the value exceeds $130,000" },
          { property: "Over $960,000", duty: "Flat rate of $5.50 per $100 applied to the total dutiable value" },
        ],
      },
      {
        title: "First Home Buyer Duty Reduction",
        col2: "Duty Payable",
        rows: [
          { property: "Up to $600,000", duty: "$0 – full exemption" },
          { property: "$600,001 to $750,000", duty: "Concessional rate (pro-rata reduction based on value)" },
          { property: "Over $750,000", duty: "No concession – general rate applies" },
        ],
      },
    ],
    extraNotes: [
      "First Home Owner Grant: $10,000 for first home buyers purchasing or building a new home valued up to $750,000.",
      "Principal Place of Residence (PPR) concession applies to homes that will be used as primary residence.",
      "Foreign purchaser additional duty: 8% surcharge on top of general duty rate.",
    ],
    fees: [
      { label: "Mortgage Registration Fee", amount: "$119.70 (approx.)" },
      { label: "Transfer Fee", amount: "$119.70 base (varies with value)" },
    ],
  },

  QLD: {
    name: "Queensland",
    tables: [
      {
        title: "Stamp Duty – General Rate",
        col2: "Duty Payable",
        rows: [
          { property: "$0 to $5,000", duty: "$0" },
          { property: "$5,001 to $75,000", duty: "$1.50 per $100 or part thereof by which the value exceeds $5,000" },
          { property: "$75,001 to $540,000", duty: "$1,050 plus $3.50 per $100 or part thereof by which the value exceeds $75,000" },
          { property: "$540,001 to $1,000,000", duty: "$17,325 plus $4.50 per $100 or part thereof by which the value exceeds $540,000" },
          { property: "Over $1,000,000", duty: "$38,025 plus $5.75 per $100 or part thereof by which the value exceeds $1,000,000" },
        ],
      },
      {
        title: "First Home Concession",
        col2: "Duty Payable",
        rows: [
          { property: "Up to $500,000 (new home or vacant land)", duty: "$0 – full exemption" },
          { property: "Up to $550,000 (established home)", duty: "$0 – full exemption" },
          { property: "$550,001 to $700,000 (established home)", duty: "Concessional rate (sliding scale)" },
        ],
      },
    ],
    extraNotes: [
      "First Home Owner Grant: $30,000 for first home buyers purchasing or building a new home valued up to $750,000.",
      "Home Concession: A concession may be available for homes used as a principal place of residence.",
    ],
    fees: [
      { label: "Mortgage Registration Fee", amount: "$195 base (varies with loan amount)" },
      { label: "Transfer Fee", amount: "$195 base (varies with value)" },
    ],
  },

  WA: {
    name: "Western Australia",
    tables: [
      {
        title: "Stamp Duty – General Rate",
        col2: "Duty Payable",
        rows: [
          { property: "$0 to $80,000", duty: "$1.90 per $100 or part thereof" },
          { property: "$80,001 to $100,000", duty: "$1,520 plus $2.85 per $100 or part thereof by which the value exceeds $80,000" },
          { property: "$100,001 to $250,000", duty: "$2,090 plus $3.80 per $100 or part thereof by which the value exceeds $100,000" },
          { property: "$250,001 to $500,000", duty: "$7,790 plus $4.75 per $100 or part thereof by which the value exceeds $250,000" },
          { property: "Over $500,000", duty: "$19,665 plus $5.15 per $100 or part thereof by which the value exceeds $500,000" },
        ],
      },
      {
        title: "First Home Owner Rate of Duty",
        col2: "Duty Payable",
        rows: [
          { property: "Up to $430,000", duty: "$0 – full exemption" },
          { property: "$430,001 to $530,000", duty: "Concessional rate (sliding scale)" },
          { property: "Over $530,000", duty: "General rate applies" },
        ],
      },
    ],
    extraNotes: [
      "First Home Owner Grant: $10,000 for first home buyers purchasing or building a new home.",
      "Note: Vacant land thresholds may differ. Please confirm current thresholds with the WA Office of State Revenue.",
    ],
    fees: [
      { label: "Mortgage Registration Fee", amount: "$180 approx. (varies with loan amount)" },
      { label: "Transfer Fee", amount: "$180 approx. (varies with value)" },
    ],
  },

  SA: {
    name: "South Australia",
    tables: [
      {
        title: "Stamp Duty – General Rate",
        col2: "Duty Payable",
        rows: [
          { property: "$0 to $12,000", duty: "$1.00 per $100 or part thereof" },
          { property: "$12,001 to $30,000", duty: "$120 plus $2.00 per $100 or part thereof by which the value exceeds $12,000" },
          { property: "$30,001 to $50,000", duty: "$480 plus $3.00 per $100 or part thereof by which the value exceeds $30,000" },
          { property: "$50,001 to $100,000", duty: "$1,080 plus $3.50 per $100 or part thereof by which the value exceeds $50,000" },
          { property: "$100,001 to $200,000", duty: "$2,830 plus $4.00 per $100 or part thereof by which the value exceeds $100,000" },
          { property: "$200,001 to $250,000", duty: "$6,830 plus $4.25 per $100 or part thereof by which the value exceeds $200,000" },
          { property: "$250,001 to $300,000", duty: "$8,955 plus $4.75 per $100 or part thereof by which the value exceeds $250,000" },
          { property: "$300,001 to $500,000", duty: "$11,330 plus $5.00 per $100 or part thereof by which the value exceeds $300,000" },
          { property: "Over $500,000", duty: "$21,330 plus $5.50 per $100 or part thereof by which the value exceeds $500,000" },
        ],
      },
    ],
    extraNotes: [
      "First Home Owner Grant: $15,000 for eligible first home buyers purchasing or building a new home.",
      "Stamp duty is not payable on the purchase of land for farming or pastoral purposes. Please confirm current thresholds with RevenueSA.",
    ],
    fees: [
      { label: "Mortgage Registration Fee", amount: "Approx. $160 (varies with loan amount)" },
      { label: "Transfer Fee", amount: "Approx. $160 (varies with value)" },
    ],
  },

  TAS: {
    name: "Tasmania",
    tables: [
      {
        title: "Stamp Duty – General Rate",
        col2: "Duty Payable",
        rows: [
          { property: "$0 to $3,000", duty: "$50 (minimum)" },
          { property: "$3,001 to $25,000", duty: "$50 plus $1.75 per $100 or part thereof by which the value exceeds $3,000" },
          { property: "$25,001 to $75,000", duty: "$435 plus $2.25 per $100 or part thereof by which the value exceeds $25,000" },
          { property: "$75,001 to $200,000", duty: "$1,560 plus $3.50 per $100 or part thereof by which the value exceeds $75,000" },
          { property: "$200,001 to $375,000", duty: "$5,935 plus $4.00 per $100 or part thereof by which the value exceeds $200,000" },
          { property: "$375,001 to $725,000", duty: "$12,935 plus $4.25 per $100 or part thereof by which the value exceeds $375,000" },
          { property: "Over $725,000", duty: "$27,810 plus $4.50 per $100 or part thereof by which the value exceeds $725,000" },
        ],
      },
    ],
    extraNotes: [
      "First Home Owner Grant: $20,000 for eligible first home buyers purchasing or building a new home.",
      "Pensioner concession may apply – contact the State Revenue Office of Tasmania for current details.",
    ],
    fees: [
      { label: "Mortgage Registration Fee", amount: "Approx. $130 (varies with loan amount)" },
      { label: "Transfer Fee", amount: "Approx. $180 (varies with value)" },
    ],
  },

  NT: {
    name: "Northern Territory",
    tables: [
      {
        title: "Stamp Duty – General Rate",
        col2: "Duty Payable",
        rows: [
          { property: "Up to $525,000", duty: "Sliding scale: 0.06571441 × (V ÷ 1000)² + 15 × (V ÷ 1000), where V is the property value" },
          { property: "Over $525,000", duty: "Flat rate of $4.95 per $100 applied to the total transaction value" },
        ],
        note: "The sliding scale formula produces a gradually increasing effective rate. At $525,000 this equates to approximately $26,731.",
      },
      {
        title: "First Home Owner Concession",
        col2: "Duty Payable",
        rows: [
          { property: "Up to $500,000 (new home)", duty: "Full concession may apply – contact Territory Revenue Office" },
          { property: "Established home", duty: "A concession of up to $18,601 may apply for eligible first home buyers" },
        ],
      },
    ],
    extraNotes: [
      "First Home Owner Grant: $10,000 for eligible first home buyers purchasing or building a new home.",
      "Rates and concessions are subject to change. Please confirm current thresholds with the NT Territory Revenue Office.",
    ],
    fees: [
      { label: "Mortgage Registration Fee", amount: "Approx. $140 (varies with loan amount)" },
      { label: "Transfer Fee", amount: "Approx. $140 (varies with value)" },
    ],
  },
};

// ── Rates Modal ───────────────────────────────────────────────────────────────

function RatesModal({ state, onClose }: { state: State; onClose: () => void }) {
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

  const info = RATES_INFO[state];

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
          "relative w-full max-w-[600px] bg-white shadow-2xl mb-12 transition-all duration-200",
          visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2",
        )}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#e0e0e0] px-5 py-3.5">
          <h3 className="font-sans font-semibold text-orange text-[1rem]">{info.name}</h3>
          <button
            onClick={handleClose}
            aria-label="Close"
            className="text-ink/35 hover:text-ink/70 transition-colors text-[1.4rem] leading-none mt-[-2px]"
          >
            ×
          </button>
        </div>

        {/* Scrollable content */}
        <div className="px-5 py-5 space-y-6 overflow-y-auto" style={{ maxHeight: "calc(85vh - 56px)" }}>
          {info.tables.map((table, ti) => (
            <div key={ti}>
              {table.title && (
                <p className="font-sans font-semibold text-[12px] text-navy mb-2">{table.title}</p>
              )}
              {table.note && (
                <p className="font-sans text-[11px] text-ink/55 mb-2 leading-relaxed italic">{table.note}</p>
              )}
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left font-sans font-semibold text-navy bg-[#f2f2f2] px-3 py-2 border border-[#ddd] w-[40%]">
                      {table.col1 ?? "Property Value"}
                    </th>
                    <th className="text-left font-sans font-semibold text-navy bg-[#f2f2f2] px-3 py-2 border border-[#ddd]">
                      {table.col2 ?? "Duty Payable"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {table.rows.map((row, ri) => (
                    <tr key={ri}>
                      <td className="font-sans text-ink px-3 py-2 border border-[#eee] align-top">{row.property}</td>
                      <td className="font-sans text-ink px-3 py-2 border border-[#eee] align-top">{row.duty}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}

          {info.incomeThresholds && (
            <div>
              <p className="font-sans font-semibold text-[12px] text-navy mb-2">{info.incomeThresholds.title}</p>
              {info.incomeThresholds.intro && (
                <p className="font-sans text-[11px] text-ink/55 mb-2 leading-relaxed">{info.incomeThresholds.intro}</p>
              )}
              <table className="w-full border-collapse text-[12px]">
                <thead>
                  <tr>
                    <th className="text-left font-sans font-semibold text-navy bg-[#f2f2f2] px-3 py-2 border border-[#ddd]">
                      Number of dependent Children
                    </th>
                    <th className="text-left font-sans font-semibold text-navy bg-[#f2f2f2] px-3 py-2 border border-[#ddd]">
                      Income Threshold
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {info.incomeThresholds.rows.map((row, ri) => (
                    <tr key={ri}>
                      <td className="font-sans text-ink px-3 py-2 border border-[#eee]">{row.dependants}</td>
                      <td className="font-sans text-ink px-3 py-2 border border-[#eee]">{row.threshold}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {info.extraNotes?.map((note, ni) => (
            <p key={ni} className="font-sans text-[12px] text-ink/70 leading-relaxed">{note}</p>
          ))}

          {info.fees && (
            <div className="space-y-1 border-t border-[#eee] pt-4">
              {info.fees.map((fee, fi) => (
                <p key={fi} className="font-sans font-semibold text-[13px] text-navy">
                  {fee.label}: <span className="text-ink font-normal">{fee.amount}</span>
                </p>
              ))}
            </div>
          )}

          {/* Close button at bottom */}
          <div className="flex justify-end pt-2">
            <button
              onClick={handleClose}
              className="border border-[#ccc] font-sans text-[12px] text-navy px-6 py-1.5 hover:bg-[#f5f5f5] transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );

  return createPortal(content, document.body);
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
  const [showRates, setShowRates] = useState(false);
  const [mounted, setMounted] = useState(false);

  const [result, setResult] = useState({
    stampDuty: 0, mortgageReg: 178, transferFee: 479, total: 0, grant: 0,
  });

  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

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

    // Pensioner concession (rough — varies widely by state)
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

      {/* ── Print & Rates buttons ── */}
      <div className="flex gap-2 mt-6">
        <button
          onClick={() => window.print()}
          className="flex items-center gap-2 bg-navy text-white font-sans text-[13px] px-5 py-2 hover:bg-navy/80 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M5 7V3h10v4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" />
            <rect x="3" y="7" width="14" height="9" rx="1" stroke="currentColor" strokeWidth="1.5" />
            <path d="M7 13h6M7 16h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
            <circle cx="15" cy="10" r="1" fill="currentColor" />
          </svg>
          Print
        </button>
        <button
          onClick={() => setShowRates(true)}
          className="flex items-center gap-2 bg-orange text-white font-sans text-[13px] px-5 py-2 hover:bg-orange/90 transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden="true">
            <path d="M4 5h12M4 10h12M4 15h8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Rates and Thresholds
        </button>
      </div>

      {/* ── Rates Modal ── */}
      {mounted && showRates && createPortal(
        <RatesModal state={state} onClose={() => setShowRates(false)} />,
        document.body,
      )}
    </div>
  );
}
