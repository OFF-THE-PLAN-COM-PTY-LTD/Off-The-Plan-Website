'use client';

import { useState, useMemo } from 'react';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const aud = (n: number) =>
  new Intl.NumberFormat('en-AU', {
    style: 'currency',
    currency: 'AUD',
    maximumFractionDigits: 0,
  }).format(n);

function monthlyRepayment(principal: number, annualRate: number, years: number): number {
  if (principal <= 0 || annualRate <= 0 || years <= 0) return 0;
  const r = annualRate / 100 / 12;
  const n = years * 12;
  return (principal * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

// ---------------------------------------------------------------------------
// Stamp Duty logic
// ---------------------------------------------------------------------------
type State = 'VIC' | 'NSW' | 'QLD' | 'WA' | 'SA';
type BuyerType = 'Owner-occupier' | 'Investor' | 'First home buyer';

function calcStampDuty(value: number, state: State, buyerType: BuyerType): number {
  let duty = 0;

  if (state === 'VIC') {
    if (value <= 25000) {
      duty = value * 0.014;
    } else if (value <= 130000) {
      duty = 350 + (value - 25000) * 0.024;
    } else if (value <= 960000) {
      duty = 2870 + (value - 130000) * 0.06;
    } else {
      duty = value * 0.055;
    }
    if (buyerType === 'First home buyer') {
      if (value <= 600000) return 0;
      if (value <= 750000) {
        // Linear reduction: full duty at $750k, 0 at $600k
        const full = duty;
        duty = full * ((value - 600000) / 150000);
      }
    }
  } else if (state === 'NSW') {
    if (value <= 14000) {
      duty = value * 0.0125;
    } else if (value <= 30000) {
      duty = 175 + (value - 14000) * 0.015;
    } else if (value <= 80000) {
      duty = 415 + (value - 30000) * 0.0175;
    } else if (value <= 300000) {
      duty = 1290 + (value - 80000) * 0.035;
    } else if (value <= 1000000) {
      duty = 8990 + (value - 300000) * 0.045;
    } else {
      duty = 40490 + (value - 1000000) * 0.055;
    }
    if (buyerType === 'First home buyer' && value <= 800000) return 0;
  } else if (state === 'QLD') {
    if (value <= 5000) {
      duty = 0;
    } else if (value <= 75000) {
      duty = (value - 5000) * 0.015;
    } else if (value <= 540000) {
      duty = 1050 + (value - 75000) * 0.035;
    } else if (value <= 1000000) {
      duty = 17325 + (value - 540000) * 0.045;
    } else {
      duty = 38025 + (value - 1000000) * 0.0575;
    }
    if (buyerType === 'First home buyer' && value <= 500000) return 0;
  } else if (state === 'WA') {
    if (value <= 80000) {
      duty = value * 0.019;
    } else if (value <= 100000) {
      duty = 1520 + (value - 80000) * 0.0285;
    } else if (value <= 250000) {
      duty = 2090 + (value - 100000) * 0.038;
    } else if (value <= 500000) {
      duty = 7790 + (value - 250000) * 0.0475;
    } else {
      duty = 19665 + (value - 500000) * 0.0515;
    }
  } else if (state === 'SA') {
    if (value <= 12000) {
      duty = value * 0.01;
    } else if (value <= 30000) {
      duty = 120 + (value - 12000) * 0.02;
    } else if (value <= 50000) {
      duty = 480 + (value - 30000) * 0.03;
    } else if (value <= 100000) {
      duty = 1080 + (value - 50000) * 0.035;
    } else if (value <= 200000) {
      duty = 2830 + (value - 100000) * 0.04;
    } else if (value <= 250000) {
      duty = 6830 + (value - 200000) * 0.0425;
    } else if (value <= 300000) {
      duty = 8955 + (value - 250000) * 0.0475;
    } else if (value <= 500000) {
      duty = 11330 + (value - 300000) * 0.05;
    } else {
      duty = 21330 + (value - 500000) * 0.055;
    }
  }

  return Math.round(duty);
}

// ---------------------------------------------------------------------------
// Shared input/label components (inline)
// ---------------------------------------------------------------------------
function Label({ children }: { children: React.ReactNode }) {
  return <span className="section-label block mb-1.5">{children}</span>;
}

function TextInput({
  value,
  onChange,
  type = 'number',
  min,
  step,
}: {
  value: string | number;
  onChange: (v: string) => void;
  type?: string;
  min?: number;
  step?: number;
}) {
  return (
    <input
      type={type}
      value={value}
      min={min}
      step={step}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60"
    />
  );
}

function SelectInput({
  value,
  onChange,
  options,
}: {
  value: string;
  onChange: (v: string) => void;
  options: string[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full border border-line px-3 py-2.5 bg-white font-sans text-body-md outline-none focus:border-orange/60"
    >
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

function ResultPanel({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-navy p-6 md:p-8 flex flex-col gap-5 h-full">
      {children}
    </div>
  );
}

function ResultRow({ label, value, large }: { label: string; value: string; large?: boolean }) {
  return (
    <div>
      <p className="font-mono text-xs uppercase tracking-widest text-ink-light/50 mb-1">{label}</p>
      <p
        className={
          large
            ? 'font-display font-light text-ink-light text-4xl leading-tight'
            : 'font-sans text-ink-light text-xl font-medium'
        }
      >
        {value}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculator 1 — Stamp Duty
// ---------------------------------------------------------------------------
function StampDutyCalc() {
  const [propValue, setPropValue] = useState('750000');
  const [state, setState] = useState<State>('VIC');
  const [buyerType, setBuyerType] = useState<BuyerType>('Owner-occupier');

  const value = parseFloat(propValue) || 0;
  const duty = calcStampDuty(value, state, buyerType);
  const total = value + duty;
  const monthlySaving = total > 0 ? Math.ceil(total / 60) : 0; // save over 5 years

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-5">
        <div>
          <Label>Property value</Label>
          <TextInput value={propValue} onChange={setPropValue} min={0} />
        </div>
        <div>
          <Label>State</Label>
          <SelectInput
            value={state}
            onChange={(v) => setState(v as State)}
            options={['VIC', 'NSW', 'QLD', 'WA', 'SA']}
          />
        </div>
        <div>
          <Label>Buyer type</Label>
          <SelectInput
            value={buyerType}
            onChange={(v) => setBuyerType(v as BuyerType)}
            options={['Owner-occupier', 'Investor', 'First home buyer']}
          />
        </div>
      </div>
      <ResultPanel>
        <ResultRow label="Stamp duty" value={aud(duty)} large />
        <ResultRow label="Total purchase cost" value={aud(total)} />
        <ResultRow label="Monthly saving needed (5 yrs)" value={aud(monthlySaving)} />
      </ResultPanel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculator 2 — Borrowing Power
// ---------------------------------------------------------------------------
function BorrowingPowerCalc() {
  const [income, setIncome] = useState('95000');
  const [partnerIncome, setPartnerIncome] = useState('0');
  const [expenses, setExpenses] = useState('2500');
  const [rate, setRate] = useState('6.5');
  const [term, setTerm] = useState('30');
  const [dependants, setDependants] = useState('0');

  const dependantAllowance: Record<string, number> = {
    '0': 0,
    '1': 500,
    '2': 800,
    '3+': 1100,
  };

  const result = useMemo(() => {
    const annualIncome = (parseFloat(income) || 0) + (parseFloat(partnerIncome) || 0);
    const monthlyIncome = annualIncome / 12;
    const monthlyExpenses = parseFloat(expenses) || 0;
    const dep = dependantAllowance[dependants] ?? 0;
    const available = monthlyIncome * 0.3 - monthlyExpenses / 4 - dep;
    if (available <= 0) return { power: 0, repayment: 0 };

    const r = (parseFloat(rate) || 0) / 100 / 12;
    const n = parseInt(term) * 12;
    if (r <= 0 || n <= 0) return { power: 0, repayment: 0 };

    const power = (available * (Math.pow(1 + r, n) - 1)) / (r * Math.pow(1 + r, n));
    const repayment = monthlyRepayment(power, parseFloat(rate) || 0, parseInt(term));
    return { power: Math.round(power), repayment: Math.round(repayment) };
  }, [income, partnerIncome, expenses, rate, term, dependants]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-5">
        <div>
          <Label>Annual income ($)</Label>
          <TextInput value={income} onChange={setIncome} min={0} />
        </div>
        <div>
          <Label>Partner income ($ optional)</Label>
          <TextInput value={partnerIncome} onChange={setPartnerIncome} min={0} />
        </div>
        <div>
          <Label>Monthly expenses ($)</Label>
          <TextInput value={expenses} onChange={setExpenses} min={0} />
        </div>
        <div>
          <Label>Interest rate (%)</Label>
          <TextInput value={rate} onChange={setRate} min={0} step={0.1} />
        </div>
        <div>
          <Label>Loan term</Label>
          <SelectInput value={term} onChange={setTerm} options={['25', '30']} />
        </div>
        <div>
          <Label>Number of dependants</Label>
          <SelectInput
            value={dependants}
            onChange={setDependants}
            options={['0', '1', '2', '3+']}
          />
        </div>
      </div>
      <ResultPanel>
        <ResultRow label="Maximum borrowing power" value={aud(result.power)} large />
        <ResultRow label="Est. monthly repayment" value={aud(result.repayment)} />
        <p className="font-sans text-xs text-ink-light/50 mt-2">
          Based on 30% of income serviceability — lenders vary.
        </p>
      </ResultPanel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculator 3 — Loan Repayment
// ---------------------------------------------------------------------------
function LoanRepaymentCalc() {
  const [loanAmount, setLoanAmount] = useState('600000');
  const [rate, setRate] = useState('6.5');
  const [term, setTerm] = useState('30');
  const [frequency, setFrequency] = useState('Monthly');

  const result = useMemo(() => {
    const P = parseFloat(loanAmount) || 0;
    const annualRate = parseFloat(rate) || 0;
    const years = parseInt(term);

    const freqMap: Record<string, number> = { Monthly: 12, Fortnightly: 26, Weekly: 52 };
    const periods = freqMap[frequency];

    const r = annualRate / 100 / periods;
    const n = years * periods;

    if (P <= 0 || r <= 0 || n <= 0) return null;

    const repayment = (P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
    const totalRepaid = repayment * n;
    const totalInterest = totalRepaid - P;
    const interestPct = ((totalInterest / P) * 100).toFixed(1);

    return {
      repayment: Math.round(repayment),
      totalRepaid: Math.round(totalRepaid),
      totalInterest: Math.round(totalInterest),
      interestPct,
    };
  }, [loanAmount, rate, term, frequency]);

  const freqLabel = frequency === 'Monthly' ? '/month' : frequency === 'Fortnightly' ? '/fortnight' : '/week';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-5">
        <div>
          <Label>Loan amount ($)</Label>
          <TextInput value={loanAmount} onChange={setLoanAmount} min={0} />
        </div>
        <div>
          <Label>Interest rate (%)</Label>
          <TextInput value={rate} onChange={setRate} min={0} step={0.1} />
        </div>
        <div>
          <Label>Loan term (years)</Label>
          <SelectInput value={term} onChange={setTerm} options={['10', '15', '20', '25', '30']} />
        </div>
        <div>
          <Label>Repayment frequency</Label>
          <SelectInput
            value={frequency}
            onChange={setFrequency}
            options={['Monthly', 'Fortnightly', 'Weekly']}
          />
        </div>
      </div>
      <ResultPanel>
        {result ? (
          <>
            <ResultRow label={`Repayment ${freqLabel}`} value={aud(result.repayment)} large />
            <ResultRow label="Total repaid" value={aud(result.totalRepaid)} />
            <ResultRow label="Total interest paid" value={aud(result.totalInterest)} />
            <ResultRow label="Interest as % of loan" value={`${result.interestPct}%`} />
          </>
        ) : (
          <p className="text-ink-light/50 font-sans text-sm">Enter values to see results.</p>
        )}
      </ResultPanel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculator 4 — Budget Planner
// ---------------------------------------------------------------------------
function estimateTax(gross: number): number {
  let tax = 0;
  if (gross <= 18200) {
    tax = 0;
  } else if (gross <= 45000) {
    tax = (gross - 18200) * 0.19;
  } else if (gross <= 120000) {
    tax = 5092 + (gross - 45000) * 0.325;
  } else if (gross <= 180000) {
    tax = 29467 + (gross - 120000) * 0.37;
  } else {
    tax = 51667 + (gross - 180000) * 0.45;
  }
  // Medicare levy 2%
  tax += gross * 0.02;
  return tax;
}

function BudgetPlannerCalc() {
  const [salary, setSalary] = useState('90000');
  const [partnerSalary, setPartnerSalary] = useState('0');
  const [otherIncome, setOtherIncome] = useState('0');
  const [rentMortgage, setRentMortgage] = useState('2000');
  const [living, setLiving] = useState('1500');
  const [transport, setTransport] = useState('500');
  const [other, setOther] = useState('300');

  const result = useMemo(() => {
    const grossSalary = parseFloat(salary) || 0;
    const grossPartner = parseFloat(partnerSalary) || 0;
    const other_ = parseFloat(otherIncome) || 0;

    const totalGrossAnnual = grossSalary + grossPartner + other_;
    const taxSalary = estimateTax(grossSalary);
    const taxPartner = estimateTax(grossPartner);
    const totalTaxAnnual = taxSalary + taxPartner;

    const netMonthlyIncome = (totalGrossAnnual - totalTaxAnnual) / 12;

    const totalMonthlyExpenses =
      (parseFloat(rentMortgage) || 0) +
      (parseFloat(living) || 0) +
      (parseFloat(transport) || 0) +
      (parseFloat(other) || 0);

    const surplus = netMonthlyIncome - totalMonthlyExpenses;
    const annualSavings = surplus * 12;

    // 20% deposit on $800k = $160k
    const depositTarget = 160000;
    const yearsToDeposit = surplus > 0 ? depositTarget / (surplus * 12) : null;

    return {
      netMonthlyIncome: Math.round(netMonthlyIncome),
      totalMonthlyExpenses: Math.round(totalMonthlyExpenses),
      surplus: Math.round(surplus),
      annualSavings: Math.round(annualSavings),
      yearsToDeposit: yearsToDeposit !== null ? Math.ceil(yearsToDeposit * 10) / 10 : null,
    };
  }, [salary, partnerSalary, otherIncome, rentMortgage, living, transport, other]);

  const surplusColor = result.surplus >= 0 ? 'text-green-400' : 'text-red-400';

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-5">
        <p className="section-label text-orange">Income</p>
        <div>
          <Label>Gross annual salary ($)</Label>
          <TextInput value={salary} onChange={setSalary} min={0} />
        </div>
        <div>
          <Label>Partner salary ($ optional)</Label>
          <TextInput value={partnerSalary} onChange={setPartnerSalary} min={0} />
        </div>
        <div>
          <Label>Other income per year ($)</Label>
          <TextInput value={otherIncome} onChange={setOtherIncome} min={0} />
        </div>
        <p className="section-label text-orange mt-2">Monthly Expenses</p>
        <div>
          <Label>Rent / mortgage ($)</Label>
          <TextInput value={rentMortgage} onChange={setRentMortgage} min={0} />
        </div>
        <div>
          <Label>Living expenses ($)</Label>
          <TextInput value={living} onChange={setLiving} min={0} />
        </div>
        <div>
          <Label>Car / transport ($)</Label>
          <TextInput value={transport} onChange={setTransport} min={0} />
        </div>
        <div>
          <Label>Other ($)</Label>
          <TextInput value={other} onChange={setOther} min={0} />
        </div>
      </div>
      <ResultPanel>
        <ResultRow label="Net monthly income" value={aud(result.netMonthlyIncome)} />
        <ResultRow label="Total monthly expenses" value={aud(result.totalMonthlyExpenses)} />
        <div>
          <p className="font-mono text-xs uppercase tracking-widest text-ink-light/50 mb-1">Monthly surplus</p>
          <p className={`font-display font-light text-4xl leading-tight ${surplusColor}`}>
            {aud(result.surplus)}
          </p>
        </div>
        <ResultRow label="Annual savings potential" value={aud(result.annualSavings)} />
        {result.yearsToDeposit !== null ? (
          <p className="font-sans text-xs text-ink-light/50 mt-2">
            At this rate you could save a {aud(160000)} deposit (20% of $800k) in{' '}
            <strong className="text-ink-light">{result.yearsToDeposit} years</strong>.
          </p>
        ) : (
          <p className="font-sans text-xs text-orange mt-2">
            Increase your surplus to start building a deposit.
          </p>
        )}
      </ResultPanel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculator 5 — Loan Comparison
// ---------------------------------------------------------------------------
type LoanInputs = { amount: string; rate: string; term: string; fees: string };

function calcLoanMetrics(inputs: LoanInputs) {
  const P = parseFloat(inputs.amount) || 0;
  const annualRate = parseFloat(inputs.rate) || 0;
  const years = parseInt(inputs.term) || 0;
  const fees = parseFloat(inputs.fees) || 0;

  if (P <= 0 || annualRate <= 0 || years <= 0) return null;

  const repayment = monthlyRepayment(P, annualRate, years);
  const totalRepaid = repayment * years * 12;
  const totalInterest = totalRepaid - P;
  const totalCost = totalRepaid + fees * years;

  return {
    repayment: Math.round(repayment),
    totalRepaid: Math.round(totalRepaid),
    totalInterest: Math.round(totalInterest),
    totalCost: Math.round(totalCost),
  };
}

function LoanComparisonCalc() {
  const [loanA, setLoanA] = useState<LoanInputs>({
    amount: '600000',
    rate: '6.5',
    term: '30',
    fees: '300',
  });
  const [loanB, setLoanB] = useState<LoanInputs>({
    amount: '600000',
    rate: '6.1',
    term: '30',
    fees: '500',
  });

  const metricsA = useMemo(() => calcLoanMetrics(loanA), [loanA]);
  const metricsB = useMemo(() => calcLoanMetrics(loanB), [loanB]);

  const aBetter =
    metricsA && metricsB ? metricsA.totalCost <= metricsB.totalCost : null;
  const saving =
    metricsA && metricsB ? Math.abs(metricsA.totalCost - metricsB.totalCost) : 0;

  function LoanInputGroup({
    label,
    inputs,
    onChange,
  }: {
    label: string;
    inputs: LoanInputs;
    onChange: (f: keyof LoanInputs, v: string) => void;
  }) {
    return (
      <div className="flex flex-col gap-4">
        <p className="section-label text-orange">{label}</p>
        <div>
          <Label>Loan amount ($)</Label>
          <TextInput value={inputs.amount} onChange={(v) => onChange('amount', v)} min={0} />
        </div>
        <div>
          <Label>Interest rate (%)</Label>
          <TextInput value={inputs.rate} onChange={(v) => onChange('rate', v)} step={0.1} />
        </div>
        <div>
          <Label>Term (years)</Label>
          <SelectInput
            value={inputs.term}
            onChange={(v) => onChange('term', v)}
            options={['10', '15', '20', '25', '30']}
          />
        </div>
        <div>
          <Label>Annual fees ($)</Label>
          <TextInput value={inputs.fees} onChange={(v) => onChange('fees', v)} min={0} />
        </div>
      </div>
    );
  }

  const rows: { label: string; key: keyof NonNullable<ReturnType<typeof calcLoanMetrics>> }[] = [
    { label: 'Monthly repayment', key: 'repayment' },
    { label: 'Total repaid', key: 'totalRepaid' },
    { label: 'Total interest', key: 'totalInterest' },
    { label: 'Total cost (incl. fees)', key: 'totalCost' },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <LoanInputGroup
          label="Loan A"
          inputs={loanA}
          onChange={(f, v) => setLoanA((p) => ({ ...p, [f]: v }))}
        />
        <LoanInputGroup
          label="Loan B"
          inputs={loanB}
          onChange={(f, v) => setLoanB((p) => ({ ...p, [f]: v }))}
        />
      </div>

      <div className="bg-navy p-6 md:p-8">
        {metricsA && metricsB ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr>
                    <th className="font-mono text-xs uppercase tracking-widest text-ink-light/50 pb-4 pr-6 w-1/3"></th>
                    <th className="font-mono text-xs uppercase tracking-widest text-ink-light/50 pb-4 pr-6">
                      Loan A
                    </th>
                    <th className="font-mono text-xs uppercase tracking-widest text-ink-light/50 pb-4">
                      Loan B
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const aVal = metricsA[row.key];
                    const bVal = metricsB[row.key];
                    const aWins = aVal <= bVal;
                    return (
                      <tr key={row.key} className="border-t border-white/10">
                        <td className="font-mono text-xs uppercase tracking-widest text-ink-light/40 py-3 pr-6">
                          {row.label}
                        </td>
                        <td
                          className={`font-sans text-base py-3 pr-6 ${
                            row.key === 'totalCost'
                              ? aWins
                                ? 'text-orange font-semibold'
                                : 'text-ink-light'
                              : 'text-ink-light'
                          }`}
                        >
                          {aud(aVal)}
                        </td>
                        <td
                          className={`font-sans text-base py-3 ${
                            row.key === 'totalCost'
                              ? !aWins
                                ? 'text-orange font-semibold'
                                : 'text-ink-light'
                              : 'text-ink-light'
                          }`}
                        >
                          {aud(bVal)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {saving > 0 && (
              <p className="font-sans text-sm text-ink-light/70 mt-6">
                <span className="text-orange font-semibold">
                  {aBetter ? 'Loan A' : 'Loan B'}
                </span>{' '}
                saves you <strong className="text-ink-light">{aud(saving)}</strong> over the term.
              </p>
            )}
          </>
        ) : (
          <p className="text-ink-light/50 font-sans text-sm">Enter values above to compare.</p>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Calculator 6 — Mortgage Switching
// ---------------------------------------------------------------------------
function MortgageSwitchingCalc() {
  const [balance, setBalance] = useState('450000');
  const [currentRate, setCurrentRate] = useState('7.2');
  const [newRate, setNewRate] = useState('6.1');
  const [remainingTerm, setRemainingTerm] = useState('22');
  const [switchingCosts, setSwitchingCosts] = useState('3000');

  const result = useMemo(() => {
    const P = parseFloat(balance) || 0;
    const rCurrent = parseFloat(currentRate) || 0;
    const rNew = parseFloat(newRate) || 0;
    const years = parseInt(remainingTerm) || 0;
    const costs = parseFloat(switchingCosts) || 0;

    if (P <= 0 || rCurrent <= 0 || rNew <= 0 || years <= 0) return null;

    const currentRepayment = monthlyRepayment(P, rCurrent, years);
    const newRepayment = monthlyRepayment(P, rNew, years);
    const monthlySaving = currentRepayment - newRepayment;

    if (monthlySaving <= 0) return { monthlySaving: 0, breakEven: null, totalSaved: 0 };

    const breakEven = Math.ceil(costs / monthlySaving);
    const currentTotal = currentRepayment * years * 12;
    const newTotal = newRepayment * years * 12;
    const totalSaved = currentTotal - newTotal - costs;

    return {
      monthlySaving: Math.round(monthlySaving),
      breakEven,
      totalSaved: Math.round(totalSaved),
    };
  }, [balance, currentRate, newRate, remainingTerm, switchingCosts]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
      <div className="flex flex-col gap-5">
        <div>
          <Label>Current loan balance ($)</Label>
          <TextInput value={balance} onChange={setBalance} min={0} />
        </div>
        <div>
          <Label>Current interest rate (%)</Label>
          <TextInput value={currentRate} onChange={setCurrentRate} step={0.1} />
        </div>
        <div>
          <Label>New interest rate (%)</Label>
          <TextInput value={newRate} onChange={setNewRate} step={0.1} />
        </div>
        <div>
          <Label>Remaining loan term (years)</Label>
          <TextInput value={remainingTerm} onChange={setRemainingTerm} min={1} />
        </div>
        <div>
          <Label>Switching costs ($)</Label>
          <TextInput value={switchingCosts} onChange={setSwitchingCosts} min={0} />
        </div>
      </div>
      <ResultPanel>
        {result ? (
          result.monthlySaving > 0 ? (
            <>
              <ResultRow label="Monthly saving" value={aud(result.monthlySaving)} large />
              {result.breakEven !== null && (
                <ResultRow label="Break-even period" value={`${result.breakEven} months`} />
              )}
              <ResultRow label="Total interest saved" value={aud(result.totalSaved)} />
              {result.breakEven !== null && (
                <p className="font-sans text-xs text-ink-light/50 mt-2">
                  Worth switching if you plan to stay more than{' '}
                  <strong className="text-ink-light">{result.breakEven} months</strong>.
                </p>
              )}
            </>
          ) : (
            <p className="font-sans text-sm text-orange">
              The new rate doesn&apos;t offer a saving. Switching may not be worthwhile.
            </p>
          )
        ) : (
          <p className="text-ink-light/50 font-sans text-sm">Enter values to see results.</p>
        )}
      </ResultPanel>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Tab definitions
// ---------------------------------------------------------------------------
const TABS = [
  { id: 'stamp-duty', label: 'Stamp Duty' },
  { id: 'borrowing-power', label: 'Borrowing Power' },
  { id: 'loan-repayment', label: 'Loan Repayment' },
  { id: 'budget-planner', label: 'Budget Planner' },
  { id: 'loan-comparison', label: 'Loan Comparison' },
  { id: 'mortgage-switching', label: 'Mortgage Switching' },
] as const;

type TabId = (typeof TABS)[number]['id'];

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------
export default function ResourcesPage() {
  const [activeTab, setActiveTab] = useState<TabId>('stamp-duty');

  return (
    <div className="min-h-screen bg-cream">
      {/* Hero */}
      <section className="bg-navy pt-24 pb-14">
        <div className="container-padded">
          <p className="section-label text-orange mb-4">Tools</p>
          <h1 className="font-display font-light text-ink-light text-section-xl mb-3">
            Financial Calculators
          </h1>
          <p className="font-sans text-body-md text-ink-light/60">
            Plan your purchase with confidence.
          </p>
        </div>
      </section>

      {/* Tab bar */}
      <div className="bg-white border-b border-line sticky top-0 z-10">
        <div className="container-padded">
          <div className="flex overflow-x-auto gap-0 -mb-px">
            {TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex-shrink-0 px-5 py-4 font-sans text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    isActive
                      ? 'border-orange text-navy'
                      : 'border-transparent text-ink/40 hover:text-ink/70'
                  }`}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Calculator panels */}
      <div className="bg-cream-alt py-12">
        <div className="container-padded">
          <div className="max-w-2xl mx-auto">
            {activeTab === 'stamp-duty' && <StampDutyCalc />}
            {activeTab === 'borrowing-power' && <BorrowingPowerCalc />}
            {activeTab === 'loan-repayment' && <LoanRepaymentCalc />}
            {activeTab === 'budget-planner' && <BudgetPlannerCalc />}
            {activeTab === 'loan-comparison' && (
              <div className="max-w-2xl">
                <LoanComparisonCalc />
              </div>
            )}
            {activeTab === 'mortgage-switching' && <MortgageSwitchingCalc />}
          </div>
        </div>
      </div>

      {/* Disclaimer */}
      <div className="bg-cream border-t border-line py-8">
        <div className="container-padded">
          <p className="font-sans text-xs text-ink/40 max-w-2xl mx-auto text-center">
            These calculators provide estimates only. Consult a licensed financial adviser and
            mortgage broker before making any financial decisions.
          </p>
        </div>
      </div>
    </div>
  );
}
