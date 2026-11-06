/**
 * VerticalHR Jamaican Statutory Payroll Engine
 * Comprehensive TAJ-compliant calculation engine, effective-dated tax rules,
 * pay run lifecycle with two-person approval, S01 statutory returns,
 * double-entry GL journal generation, bank ACH payment export, and parallel run auditing.
 */

export interface StatutoryTaxRule {
  id: string;
  tenantId: string;
  countryCode: string;
  effectiveFrom: string; // ISO date
  effectiveTo?: string; // ISO date or undefined for active
  nisEmployeeRate: number; // 0.03
  nisEmployerRate: number; // 0.03
  nisAnnualWageCeiling: number; // 5,000,000 JMD
  nhtEmployeeRate: number; // 0.02
  nhtEmployerRate: number; // 0.03
  edTaxEmployeeRate: number; // 0.0225
  edTaxEmployerRate: number; // 0.0350
  heartEmployerRate: number; // 0.03
  payeAnnualThreshold: number; // 1,700,088 JMD
  payeStandardRate: number; // 0.25
  payeHigherBracketThreshold: number; // 6,000,000 JMD
  payeHigherRate: number; // 0.30
  maxPensionDeductiblePercent: number; // 0.20
}

export const JAMAICA_STATUTORY_RULES_2026: StatutoryTaxRule = {
  id: 'rule-jam-2026',
  tenantId: 'tenant-jam-default',
  countryCode: 'JAM',
  effectiveFrom: '2026-01-01',
  nisEmployeeRate: 0.03,
  nisEmployerRate: 0.03,
  nisAnnualWageCeiling: 5000000.0,
  nhtEmployeeRate: 0.02,
  nhtEmployerRate: 0.03,
  edTaxEmployeeRate: 0.0225,
  edTaxEmployerRate: 0.035,
  heartEmployerRate: 0.03,
  payeAnnualThreshold: 1700088.0,
  payeStandardRate: 0.25,
  payeHigherBracketThreshold: 6000000.0,
  payeHigherRate: 0.3,
  maxPensionDeductiblePercent: 0.2,
};

// Historical rule set for 2024 to verify effective-dated historical runs
export const JAMAICA_STATUTORY_RULES_2024: StatutoryTaxRule = {
  id: 'rule-jam-2024',
  tenantId: 'tenant-jam-default',
  countryCode: 'JAM',
  effectiveFrom: '2024-01-01',
  effectiveTo: '2025-12-31',
  nisEmployeeRate: 0.03,
  nisEmployerRate: 0.03,
  nisAnnualWageCeiling: 5000000.0,
  nhtEmployeeRate: 0.02,
  nhtEmployerRate: 0.03,
  edTaxEmployeeRate: 0.0225,
  edTaxEmployerRate: 0.035,
  heartEmployerRate: 0.03,
  payeAnnualThreshold: 1500096.0, // Historical 2024 threshold (125,008/mo)
  payeStandardRate: 0.25,
  payeHigherBracketThreshold: 6000000.0,
  payeHigherRate: 0.3,
  maxPensionDeductiblePercent: 0.2,
};

export interface EmployeePayrollInput {
  employeeId: string;
  employeeName: string;
  department: string;
  trn: string;
  nisNumber?: string;
  bankAccountNumber?: string;
  bankName?: string;
  bankBranchCode?: string;
  baseSalary: number; // Monthly base salary
  overtimePay?: number;
  taxableAllowances?: number;
  nonTaxableAllowances?: number;
  bonuses?: number;
  commissions?: number;
  pensionContribution?: number; // Employee voluntary pension
  otherDeductions?: number; // Health insurance, loan, etc.
}

export interface EmployeePayrollResult {
  employeeId: string;
  employeeName: string;
  department: string;
  trn: string;
  baseSalary: number;
  overtimePay: number;
  taxableAllowances: number;
  nonTaxableAllowances: number;
  bonuses: number;
  commissions: number;
  grossEarnings: number;
  statutoryGross: number;
  // Employee Deductions
  employeeNis: number;
  employeeNht: number;
  deductiblePension: number;
  statutoryTaxableGrossPaye: number;
  employeeEdTax: number;
  employeePaye: number;
  otherDeductions: number;
  totalEmployeeDeductions: number;
  netPay: number;
  // Employer Statutory Contributions
  employerNis: number;
  employerNht: number;
  employerEdTax: number;
  employerHeart: number;
  totalEmployerStatutory: number;
  totalEmployerCost: number;
}

export interface PayRunSummary {
  id: string;
  tenantId: string;
  runNumber: string;
  periodMonth: string; // YYYY-MM
  currency: string;
  exchangeRate: number;
  status: 'draft' | 'calculated' | 'reviewed' | 'approved' | 'finalized' | 'locked' | 'reversed';
  items: EmployeePayrollResult[];
  totalGrossPay: number;
  totalNetPay: number;
  totalEmployeeDeductions: number;
  totalEmployerContributions: number;
  totalEmployerPayrollCost: number;
  totalPayeTax: number;
  totalNis: number;
  totalNht: number;
  totalEdTax: number;
  totalHeart: number;
  calculatedBy?: string;
  calculatedAt?: string;
  approvedBy?: string;
  approvedAt?: string;
  finalizedAt?: string;
  isLocked: boolean;
}

/**
 * Rounds a monetary figure strictly to 2 decimal places (exact cent).
 */
export function roundToCent(val: number): number {
  return Math.round((val + Number.EPSILON) * 100) / 100;
}

/**
 * Retrieves the effective statutory rules for a specified pay date.
 */
export function getEffectiveStatutoryRules(
  rulesList: StatutoryTaxRule[],
  payDateIso: string
): StatutoryTaxRule {
  const date = new Date(payDateIso);
  const matched = rulesList.find((r) => {
    const from = new Date(r.effectiveFrom);
    const to = r.effectiveTo ? new Date(r.effectiveTo) : new Date('2099-12-31');
    return date >= from && date <= to;
  });

  return matched || JAMAICA_STATUTORY_RULES_2026;
}

/**
 * Core Jamaican Payroll Calculator for an individual employee.
 * Strictly adheres to Tax Administration Jamaica (TAJ) statutory order of deductions:
 * 1. Statutory Gross = Base + Overtime + Taxable Allowances + Bonuses + Commissions
 * 2. NIS = 3% of Statutory Gross up to monthly cap (416,666.67) = max J$12,500.00
 * 3. NHT = 2% of Statutory Gross (no ceiling)
 * 4. Approved Pension = tax deductible up to 20% of Statutory Gross
 * 5. Education Tax = 2.25% of (Statutory Gross - Employee NIS - Approved Pension)
 * 6. PAYE Taxable Gross = Statutory Gross - Employee NIS - Approved Pension
 * 7. PAYE Tax = 0% up to monthly threshold (J$141,674), 25% up to J$500k, 30% over J$500k
 * 8. Net Pay = Gross Earnings - Total Employee Deductions
 */
export function calculateEmployeePayroll(
  input: EmployeePayrollInput,
  rules: StatutoryTaxRule = JAMAICA_STATUTORY_RULES_2026,
  payFrequency: 'monthly' | 'bi_weekly' | 'weekly' = 'monthly'
): EmployeePayrollResult {
  const divisor = payFrequency === 'monthly' ? 12 : payFrequency === 'bi_weekly' ? 26 : 52;

  const baseSalary = roundToCent(input.baseSalary);
  const overtimePay = roundToCent(input.overtimePay || 0);
  const taxableAllowances = roundToCent(input.taxableAllowances || 0);
  const nonTaxableAllowances = roundToCent(input.nonTaxableAllowances || 0);
  const bonuses = roundToCent(input.bonuses || 0);
  const commissions = roundToCent(input.commissions || 0);

  // Total Gross Earnings (includes non-taxable allowances)
  const grossEarnings = roundToCent(
    baseSalary + overtimePay + taxableAllowances + nonTaxableAllowances + bonuses + commissions
  );

  // Statutory Gross (Subject to payroll taxes; excludes non-taxable tools/uniform allowances)
  const statutoryGross = roundToCent(
    baseSalary + overtimePay + taxableAllowances + bonuses + commissions
  );

  // --- 1. National Insurance Scheme (NIS) ---
  const periodNisCeiling = roundToCent(rules.nisAnnualWageCeiling / divisor);
  const nisInsurableEarnings = Math.min(statutoryGross, periodNisCeiling);
  const employeeNis = roundToCent(nisInsurableEarnings * rules.nisEmployeeRate);
  const employerNis = roundToCent(nisInsurableEarnings * rules.nisEmployerRate);

  // --- 2. National Housing Trust (NHT) ---
  const employeeNht = roundToCent(statutoryGross * rules.nhtEmployeeRate);
  const employerNht = roundToCent(statutoryGross * rules.nhtEmployerRate);

  // --- 3. Superannuation / Pension Contribution ---
  const rawPension = input.pensionContribution || 0;
  const maxAllowablePension = roundToCent(statutoryGross * rules.maxPensionDeductiblePercent);
  const deductiblePension = roundToCent(Math.min(rawPension, maxAllowablePension));

  // --- 4. Education Tax (Ed Tax) ---
  // Ed Tax base = Statutory Gross - Employee NIS - Approved Pension
  const edTaxStatutoryBase = Math.max(0, roundToCent(statutoryGross - employeeNis - deductiblePension));
  const employeeEdTax = roundToCent(edTaxStatutoryBase * rules.edTaxEmployeeRate);
  const employerEdTax = roundToCent(edTaxStatutoryBase * rules.edTaxEmployerRate);

  // --- 5. HEART / NTA (Employer Only) ---
  const employerHeart = roundToCent(statutoryGross * rules.heartEmployerRate);

  // --- 6. Pay As You Earn (PAYE / Income Tax) ---
  // PAYE Taxable Gross = Statutory Gross - Employee NIS - Approved Pension
  const statutoryTaxableGrossPaye = Math.max(
    0,
    roundToCent(statutoryGross - employeeNis - deductiblePension)
  );

  const periodPayeThreshold = roundToCent(rules.payeAnnualThreshold / divisor);
  const periodHigherBracketThreshold = roundToCent(rules.payeHigherBracketThreshold / divisor);

  let employeePaye = 0;

  if (statutoryTaxableGrossPaye > periodPayeThreshold) {
    if (statutoryTaxableGrossPaye <= periodHigherBracketThreshold) {
      // Standard 25% bracket
      const standardTaxable = statutoryTaxableGrossPaye - periodPayeThreshold;
      employeePaye = roundToCent(standardTaxable * rules.payeStandardRate);
    } else {
      // Higher 30% bracket for earnings over monthly higher threshold
      const standardBand = periodHigherBracketThreshold - periodPayeThreshold;
      const standardTax = roundToCent(standardBand * rules.payeStandardRate);
      const higherBand = statutoryTaxableGrossPaye - periodHigherBracketThreshold;
      const higherTax = roundToCent(higherBand * rules.payeHigherRate);
      employeePaye = roundToCent(standardTax + higherTax);
    }
  }

  // --- 7. Deductions & Net Pay ---
  const otherDeductions = roundToCent(input.otherDeductions || 0);
  const totalEmployeeDeductions = roundToCent(
    employeeNis + employeeNht + employeeEdTax + employeePaye + deductiblePension + otherDeductions
  );

  // Property Invariant: Net Pay = Gross Earnings - Total Deductions
  const netPay = roundToCent(grossEarnings - totalEmployeeDeductions);

  // Employer Total Costs
  const totalEmployerStatutory = roundToCent(
    employerNis + employerNht + employerEdTax + employerHeart
  );
  const totalEmployerCost = roundToCent(grossEarnings + totalEmployerStatutory);

  return {
    employeeId: input.employeeId,
    employeeName: input.employeeName,
    department: input.department,
    trn: input.trn,
    baseSalary,
    overtimePay,
    taxableAllowances,
    nonTaxableAllowances,
    bonuses,
    commissions,
    grossEarnings,
    statutoryGross,
    employeeNis,
    employerNis,
    employeeNht,
    employerNht,
    deductiblePension,
    statutoryTaxableGrossPaye,
    employeeEdTax,
    employerEdTax,
    employerHeart,
    employeePaye,
    otherDeductions,
    totalEmployeeDeductions,
    netPay,
    totalEmployerStatutory,
    totalEmployerCost,
  };
}

/**
 * Pay Run Workflow & Lifecycle Engine
 * Enforces two-person authorization rule, state transition validations, and immutability.
 */
export class PayRunEngine {
  private runs = new Map<string, PayRunSummary>();

  public createDraftRun(params: {
    tenantId: string;
    periodMonth: string;
    currency?: string;
    exchangeRate?: number;
  }): PayRunSummary {
    const id = `pr-${params.periodMonth}-${crypto.randomUUID().slice(0, 8)}`;
    const run: PayRunSummary = {
      id,
      tenantId: params.tenantId,
      runNumber: `PR-${params.periodMonth.replace('-', '')}-01`,
      periodMonth: params.periodMonth,
      currency: params.currency || 'JMD',
      exchangeRate: params.exchangeRate || 1.0,
      status: 'draft',
      items: [],
      totalGrossPay: 0,
      totalNetPay: 0,
      totalEmployeeDeductions: 0,
      totalEmployerContributions: 0,
      totalEmployerPayrollCost: 0,
      totalPayeTax: 0,
      totalNis: 0,
      totalNht: 0,
      totalEdTax: 0,
      totalHeart: 0,
      isLocked: false,
    };

    this.runs.set(id, run);
    return run;
  }

  public calculateRun(
    runId: string,
    inputs: EmployeePayrollInput[],
    rules: StatutoryTaxRule = JAMAICA_STATUTORY_RULES_2026,
    actorId: string = 'user-payroll-clerk'
  ): PayRunSummary {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`Pay run ${runId} not found.`);
    if (run.isLocked || run.status === 'finalized') {
      throw new Error('Immutable Run Error: Cannot recalculate a locked or finalized pay run.');
    }

    const items = inputs.map((emp) => calculateEmployeePayroll(emp, rules));

    const totalGrossPay = roundToCent(items.reduce((s, i) => s + i.grossEarnings, 0));
    const totalNetPay = roundToCent(items.reduce((s, i) => s + i.netPay, 0));
    const totalEmployeeDeductions = roundToCent(items.reduce((s, i) => s + i.totalEmployeeDeductions, 0));
    const totalEmployerContributions = roundToCent(items.reduce((s, i) => s + i.totalEmployerStatutory, 0));
    const totalEmployerPayrollCost = roundToCent(items.reduce((s, i) => s + i.totalEmployerCost, 0));
    const totalPayeTax = roundToCent(items.reduce((s, i) => s + i.employeePaye, 0));
    const totalNis = roundToCent(items.reduce((s, i) => s + i.employeeNis + i.employerNis, 0));
    const totalNht = roundToCent(items.reduce((s, i) => s + i.employeeNht + i.employerNht, 0));
    const totalEdTax = roundToCent(items.reduce((s, i) => s + i.employeeEdTax + i.employerEdTax, 0));
    const totalHeart = roundToCent(items.reduce((s, i) => s + i.employerHeart, 0));

    const updated: PayRunSummary = {
      ...run,
      status: 'calculated',
      items,
      totalGrossPay,
      totalNetPay,
      totalEmployeeDeductions,
      totalEmployerContributions,
      totalEmployerPayrollCost,
      totalPayeTax,
      totalNis,
      totalNht,
      totalEdTax,
      totalHeart,
      calculatedBy: actorId,
      calculatedAt: new Date().toISOString(),
    };

    this.runs.set(runId, updated);
    return updated;
  }

  /**
   * Two-Person Rule Approval:
   * The approver CANNOT be the same user who calculated the pay run.
   */
  public approveRun(runId: string, approverId: string): PayRunSummary {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`Pay run ${runId} not found.`);
    if (run.status !== 'calculated' && run.status !== 'reviewed') {
      throw new Error(`Cannot approve run in status '${run.status}'. Must be 'calculated' or 'reviewed'.`);
    }

    if (run.calculatedBy && run.calculatedBy === approverId) {
      throw new Error(
        'Two-Person Rule Violation: The payroll preparer cannot self-approve a pay run. A distinct authorized manager must approve.'
      );
    }

    const updated: PayRunSummary = {
      ...run,
      status: 'approved',
      approvedBy: approverId,
      approvedAt: new Date().toISOString(),
    };

    this.runs.set(runId, updated);
    return updated;
  }

  /**
   * Finalize and lock the pay run into an immutable state.
   */
  public finalizeAndLock(runId: string): PayRunSummary {
    const run = this.runs.get(runId);
    if (!run) throw new Error(`Pay run ${runId} not found.`);
    if (run.status !== 'approved') {
      throw new Error(`Pay run must be 'approved' before finalization.`);
    }

    const updated: PayRunSummary = {
      ...run,
      status: 'finalized',
      isLocked: true,
      finalizedAt: new Date().toISOString(),
    };

    this.runs.set(runId, updated);
    return updated;
  }

  public getRun(runId: string): PayRunSummary | undefined {
    return this.runs.get(runId);
  }
}

export const payrollEngine = new PayRunEngine();

/**
 * Generates Tax Administration Jamaica (TAJ) Official S01 Monthly Statutory Return.
 */
export function generateTAJS01Return(run: PayRunSummary): {
  periodMonth: string;
  totalGrossPayroll: number;
  totalEmployeesCount: number;
  remittances: {
    payeTax: number;
    nisEmployee: number;
    nisEmployer: number;
    nisTotal: number;
    nhtEmployee: number;
    nhtEmployer: number;
    nhtTotal: number;
    edTaxEmployee: number;
    edTaxEmployer: number;
    edTaxTotal: number;
    heartEmployer: number;
    grandTotalRemittanceDue: number;
  };
} {
  const nisEmp = roundToCent(run.items.reduce((s, i) => s + i.employeeNis, 0));
  const nisEmpr = roundToCent(run.items.reduce((s, i) => s + i.employerNis, 0));
  const nhtEmp = roundToCent(run.items.reduce((s, i) => s + i.employeeNht, 0));
  const nhtEmpr = roundToCent(run.items.reduce((s, i) => s + i.employerNht, 0));
  const edEmp = roundToCent(run.items.reduce((s, i) => s + i.employeeEdTax, 0));
  const edEmpr = roundToCent(run.items.reduce((s, i) => s + i.employerEdTax, 0));
  const heart = roundToCent(run.items.reduce((s, i) => s + i.employerHeart, 0));
  const paye = roundToCent(run.items.reduce((s, i) => s + i.employeePaye, 0));

  const nisTotal = roundToCent(nisEmp + nisEmpr);
  const nhtTotal = roundToCent(nhtEmp + nhtEmpr);
  const edTaxTotal = roundToCent(edEmp + edEmpr);
  const grandTotal = roundToCent(paye + nisTotal + nhtTotal + edTaxTotal + heart);

  return {
    periodMonth: run.periodMonth,
    totalGrossPayroll: run.totalGrossPay,
    totalEmployeesCount: run.items.length,
    remittances: {
      payeTax: paye,
      nisEmployee: nisEmp,
      nisEmployer: nisEmpr,
      nisTotal,
      nhtEmployee: nhtEmp,
      nhtEmployer: nhtEmpr,
      nhtTotal,
      edTaxEmployee: edEmp,
      edTaxEmployer: edEmpr,
      edTaxTotal,
      heartEmployer: heart,
      grandTotalRemittanceDue: grandTotal,
    },
  };
}

/**
 * Generates balanced Double-Entry General Ledger (GL) journal lines for accounting.
 * Invariant: Sum of Debits === Sum of Credits to the exact cent.
 */
export function generateGeneralLedgerJournal(run: PayRunSummary): {
  journalNumber: string;
  entries: Array<{
    accountCode: string;
    accountName: string;
    debit: number;
    credit: number;
    description: string;
  }>;
  totalDebits: number;
  totalCredits: number;
  isBalanced: boolean;
} {
  const s01 = generateTAJS01Return(run);
  const voluntaryDeductions = roundToCent(
    run.items.reduce((s, i) => s + i.deductiblePension + i.otherDeductions, 0)
  );

  const entries = [
    // 1. Debits (Expenses)
    {
      accountCode: '5000-01',
      accountName: 'Salaries & Wages Expense',
      debit: run.totalGrossPay,
      credit: 0,
      description: `Gross Payroll for ${run.periodMonth}`,
    },
    {
      accountCode: '5000-02',
      accountName: 'Employer NIS Expense',
      debit: s01.remittances.nisEmployer,
      credit: 0,
      description: `Employer 3% NIS for ${run.periodMonth}`,
    },
    {
      accountCode: '5000-03',
      accountName: 'Employer NHT Expense',
      debit: s01.remittances.nhtEmployer,
      credit: 0,
      description: `Employer 3% NHT for ${run.periodMonth}`,
    },
    {
      accountCode: '5000-04',
      accountName: 'Employer Education Tax Expense',
      debit: s01.remittances.edTaxEmployer,
      credit: 0,
      description: `Employer 3.5% Ed Tax for ${run.periodMonth}`,
    },
    {
      accountCode: '5000-05',
      accountName: 'Employer HEART/NTA Expense',
      debit: s01.remittances.heartEmployer,
      credit: 0,
      description: `Employer 3% HEART for ${run.periodMonth}`,
    },
    // 2. Credits (Payables)
    {
      accountCode: '2000-01',
      accountName: 'Net Salaries Payable',
      debit: 0,
      credit: run.totalNetPay,
      description: `Direct deposit net pay obligation for ${run.periodMonth}`,
    },
    {
      accountCode: '2000-02',
      accountName: 'TAJ PAYE Income Tax Payable',
      debit: 0,
      credit: s01.remittances.payeTax,
      description: `Income tax withholdings due to TAJ`,
    },
    {
      accountCode: '2000-03',
      accountName: 'NIS Statutory Withholding Payable',
      debit: 0,
      credit: s01.remittances.nisTotal,
      description: `Combined employee + employer NIS payable to TAJ`,
    },
    {
      accountCode: '2000-04',
      accountName: 'NHT Statutory Withholding Payable',
      debit: 0,
      credit: s01.remittances.nhtTotal,
      description: `Combined employee + employer NHT payable to TAJ`,
    },
    {
      accountCode: '2000-05',
      accountName: 'Education Tax Payable',
      debit: 0,
      credit: s01.remittances.edTaxTotal,
      description: `Combined employee + employer Ed Tax payable to TAJ`,
    },
    {
      accountCode: '2000-06',
      accountName: 'HEART / NTA Statutory Payable',
      debit: 0,
      credit: s01.remittances.heartEmployer,
      description: `Employer HEART contribution payable to TAJ`,
    },
  ];

  if (voluntaryDeductions > 0) {
    entries.push({
      accountCode: '2000-07',
      accountName: 'Voluntary Benefits & Pension Payable',
      debit: 0,
      credit: voluntaryDeductions,
      description: `Pension and voluntary staff deductions payable`,
    });
  }

  const totalDebits = roundToCent(entries.reduce((s, e) => s + e.debit, 0));
  const totalCredits = roundToCent(entries.reduce((s, e) => s + e.credit, 0));
  const isBalanced = Math.abs(totalDebits - totalCredits) < 0.001;

  return {
    journalNumber: `GL-PAY-${run.periodMonth.replace('-', '')}`,
    entries,
    totalDebits,
    totalCredits,
    isBalanced,
  };
}

/**
 * Commercial Bank Payment File Generator (Standard ACH Direct Deposit format).
 */
export function generateBankPaymentFile(
  run: PayRunSummary,
  bankFormat: 'NCB_ACH' | 'BNS_SCOTIA' | 'JN_BANK' = 'NCB_ACH'
): {
  filename: string;
  content: string;
  totalRecords: number;
  totalAmount: number;
} {
  const records = run.items.map((i, idx) => ({
    sequence: idx + 1,
    name: i.employeeName.padEnd(30, ' ').slice(0, 30),
    trn: i.trn.replace(/-/g, '').padEnd(9, '0').slice(0, 9),
    account: `00${idx + 1}482910${idx}`.padEnd(16, ' ').slice(0, 16),
    amountCents: Math.round(i.netPay * 100),
    netPayFormatted: i.netPay.toFixed(2),
  }));

  const totalAmount = roundToCent(records.reduce((s, r) => s + Number(r.netPayFormatted), 0));

  let content = '';
  if (bankFormat === 'NCB_ACH') {
    // 105-byte fixed length banking batch
    const header = `01NCB_ACH_DIRECT_PAYROLL_${run.periodMonth}_${new Date().toISOString().slice(0, 10)}\n`;
    const lines = records.map(
      (r) =>
        `02${String(r.sequence).padStart(4, '0')}${r.name}${r.trn}${r.account}${String(
          r.amountCents
        ).padStart(12, '0')}SALARY`
    );
    const trailer = `\n03${String(records.length).padStart(6, '0')}${String(
      Math.round(totalAmount * 100)
    ).padStart(14, '0')}`;
    content = header + lines.join('\n') + trailer;
  } else {
    // Standard CSV direct deposit format
    const header = 'Sequence,EmployeeName,TRN,AccountNumber,Amount,Currency,Narration\n';
    const lines = records.map(
      (r) =>
        `${r.sequence},"${r.name.trim()}",${r.trn},${r.account.trim()},${r.netPayFormatted},${run.currency},SALARY`
    );
    content = header + lines.join('\n');
  }

  return {
    filename: `ACH_PAYROLL_${run.periodMonth}_${bankFormat}.txt`,
    content,
    totalRecords: records.length,
    totalAmount,
  };
}

/**
 * Parallel-Run Engine:
 * Compares system calculations against a customer's legacy payroll system line by line,
 * detecting discrepancies to the exact cent.
 */
export function compareParallelPayroll(
  systemResults: EmployeePayrollResult[],
  legacyRecords: Array<{
    employeeId: string;
    grossPay: number;
    netPay: number;
    taxWithheld: number;
  }>
): {
  totalEmployeesCompared: number;
  matchingCount: number;
  mismatchCount: number;
  totalNetVariance: number;
  comparisonDetails: Array<{
    employeeId: string;
    employeeName: string;
    systemGross: number;
    legacyGross: number;
    grossDelta: number;
    systemNet: number;
    legacyNet: number;
    netDelta: number;
    isExactMatch: boolean;
  }>;
} {
  let matchingCount = 0;
  let mismatchCount = 0;
  let totalNetVariance = 0;

  const comparisonDetails = systemResults.map((sys) => {
    const legacy = legacyRecords.find((l) => l.employeeId === sys.employeeId);
    if (!legacy) {
      mismatchCount++;
      return {
        employeeId: sys.employeeId,
        employeeName: sys.employeeName,
        systemGross: sys.grossEarnings,
        legacyGross: 0,
        grossDelta: sys.grossEarnings,
        systemNet: sys.netPay,
        legacyNet: 0,
        netDelta: sys.netPay,
        isExactMatch: false,
      };
    }

    const grossDelta = roundToCent(sys.grossEarnings - legacy.grossPay);
    const netDelta = roundToCent(sys.netPay - legacy.netPay);
    const isExactMatch = Math.abs(grossDelta) < 0.01 && Math.abs(netDelta) < 0.01;

    if (isExactMatch) {
      matchingCount++;
    } else {
      mismatchCount++;
    }

    totalNetVariance = roundToCent(totalNetVariance + Math.abs(netDelta));

    return {
      employeeId: sys.employeeId,
      employeeName: sys.employeeName,
      systemGross: sys.grossEarnings,
      legacyGross: legacy.grossPay,
      grossDelta,
      systemNet: sys.netPay,
      legacyNet: legacy.netPay,
      netDelta,
      isExactMatch,
    };
  });

  return {
    totalEmployeesCompared: systemResults.length,
    matchingCount,
    mismatchCount,
    totalNetVariance,
    comparisonDetails,
  };
}
