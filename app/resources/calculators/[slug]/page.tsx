import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

import StampDutyCalculator from "@/components/calculators/stamp-duty-calculator";
import BorrowingPowerCalculator from "@/components/calculators/borrowing-power-calculator";
import LoanRepaymentCalculator from "@/components/calculators/loan-repayment-calculator";
import BudgetPlanner from "@/components/calculators/budget-planner";
import LoanComparisonCalculator from "@/components/calculators/loan-comparison-calculator";
import MortgageSwitchingCalculator from "@/components/calculators/mortgage-switching-calculator";

interface CalculatorMeta {
  title: string;
  description: string;
  component: React.ComponentType;
}

const CALCULATORS: Record<string, CalculatorMeta> = {
  "stamp-duty": {
    title: "Stamp Duty Calculator",
    description: "Estimate stamp duty and government charges across all Australian states and territories.",
    component: StampDutyCalculator,
  },
  "borrowing-power": {
    title: "Borrowing Power Calculator",
    description: "Find out how much you may be able to borrow based on your income and expenses.",
    component: BorrowingPowerCalculator,
  },
  "loan-repayment": {
    title: "Loan Repayment Calculator",
    description: "Calculate your weekly, fortnightly, and monthly loan repayments.",
    component: LoanRepaymentCalculator,
  },
  "budget-planner": {
    title: "Budget Planner",
    description: "Plan your finances and see your monthly surplus or deficit at a glance.",
    component: BudgetPlanner,
  },
  "loan-comparison": {
    title: "Loan Comparison Calculator",
    description: "Compare two loan products side by side to find which option costs less.",
    component: LoanComparisonCalculator,
  },
  "mortgage-switching": {
    title: "Mortgage Switching Calculator",
    description: "Calculate whether refinancing is worth it by comparing costs and savings.",
    component: MortgageSwitchingCalculator,
  },
};

type PageProps = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const calc = CALCULATORS[slug];
  if (!calc) return { title: "Not Found" };
  return { title: `${calc.title} | Resources`, description: calc.description };
}

export function generateStaticParams() {
  return Object.keys(CALCULATORS).map((slug) => ({ slug }));
}

export default async function CalculatorPage({ params }: PageProps) {
  const { slug } = await params;
  const calc = CALCULATORS[slug];
  if (!calc) notFound();

  const Calculator = calc.component;

  return (
    <div className="min-h-screen bg-white pt-16">
      {/* ── Dark navy header with orange title — matches reference ── */}
      <div className="bg-navy px-6 md:px-16 pt-10 pb-8">
        <h1 className="font-sans font-bold text-orange text-[1.8rem] md:text-[2.2rem] uppercase tracking-[0.1em] leading-tight">
          {calc.title}
        </h1>
        <div className="border-b border-white/20 mt-6" />
      </div>

      {/* ── Calculator content ── */}
      <div className="bg-white px-6 md:px-16 py-10">
        <Calculator />
      </div>

      {/* ── Disclaimer ── */}
      <div className="bg-[#f5f4f1] border-t border-line px-6 md:px-16 py-8">
        <p className="font-sans text-[11px] text-ink/40 leading-relaxed max-w-4xl">
          Note: The information provided by the calculator is intended to provide illustrative examples based on stated assumptions and your inputs. Calculations are meant as estimates only and it is advised that you consult with a finance broker about your specific circumstances.
        </p>
        <div className="mt-6 flex items-center justify-between flex-wrap gap-4">
          <div className="flex gap-2">
            <Link href="/resources/calculators" className="inline-flex items-center gap-1.5 bg-navy text-white font-sans text-[12px] px-4 py-2 hover:bg-navy/80 transition-colors">
              ← Back to Calculators
            </Link>
          </div>
          <div className="border border-navy px-4 py-2">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Off The Plan" className="h-8 object-contain" />
          </div>
        </div>
      </div>
    </div>
  );
}
