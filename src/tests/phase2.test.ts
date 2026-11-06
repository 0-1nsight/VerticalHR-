/**
 * VerticalHR Phase 2 Acceptance & Verification Test Suite
 * Validates:
 * 1. Accrual Edge Cases (Full Month, Mid-Month Hire Pro-rata, Leap Years, Unpaid Leave)
 * 2. Immutable Ledger Balance Recomputation (Exact Reproduction)
 * 3. Jamaican Statutory Public Holidays & Weekend Exclusion
 * 4. Leave Request Validation (Overlaps, Blackouts, Balances, Documentation)
 * 5. Payroll-Ready Absence Integration & Vacation Dollar Liability
 */

import {
  calculateWorkingDays,
  calculateMonthlyAccrual,
  computeBalanceFromLedger,
  validateLeaveRequest,
  LeaveTypePolicy,
  LeaveLedgerEntry,
  JAMAICAN_STATUTORY_HOLIDAYS_2026,
} from '../services/leaveEngine';
import { calculatePayrollLeaveExport } from '../services/leaveReports';

export async function runPhase2Tests(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];
  let allPassed = true;

  const logResult = (name: string, success: boolean, detail?: string) => {
    if (success) {
      results.push(`PASS: ${name}`);
    } else {
      results.push(`FAIL: ${name}${detail ? ` -> ${detail}` : ''}`);
      allPassed = false;
    }
  };

  try {
    const vacationPolicy: LeaveTypePolicy = {
      id: 'leave-vacation-uuid',
      tenantId: 'tenant-001',
      name: 'Statutory Vacation Leave',
      code: 'VACATION',
      accrualMethod: 'monthly',
      accrualRatePerPeriod: 1.167, // 14 days per annum
      annualQuota: 14.0,
      carryOverAllowed: true,
      carryOverCap: 5.0,
      carryOverExpiryMonths: 6,
      allowNegativeBalance: false,
      negativeLimit: 0,
      unit: 'days',
      requiresDocumentation: false,
      documentationThresholdDays: 0,
    };

    const sickPolicy: LeaveTypePolicy = {
      id: 'leave-sick-uuid',
      tenantId: 'tenant-001',
      name: 'Sick Leave',
      code: 'SICK',
      accrualMethod: 'upfront',
      accrualRatePerPeriod: 0,
      annualQuota: 10.0,
      carryOverAllowed: false,
      carryOverCap: 0,
      carryOverExpiryMonths: 0,
      allowNegativeBalance: false,
      negativeLimit: 0,
      unit: 'days',
      requiresDocumentation: true,
      documentationThresholdDays: 2,
    };

    // ------------------------------------------------------------------------
    // 1. Accrual Edge Cases: Full Month vs Mid-Month Hire vs Leap Year
    // ------------------------------------------------------------------------
    // Standard full month accrual
    const fullMonthAccrual = calculateMonthlyAccrual({
      employeeId: 'emp-01',
      leaveType: vacationPolicy,
      hireDateStr: '2025-01-01',
      year: 2026,
      month: 4, // April (30 days)
    });

    // Mid-month hire (hired April 16 in a 30-day month -> 15 active days = exactly 50%)
    const midMonthAccrual = calculateMonthlyAccrual({
      employeeId: 'emp-02',
      leaveType: vacationPolicy,
      hireDateStr: '2026-04-16',
      year: 2026,
      month: 4,
    });

    // Leap year February (Feb 2028 has 29 days; hire on Feb 15 -> 15 active days out of 29)
    const leapYearAccrual = calculateMonthlyAccrual({
      employeeId: 'emp-03',
      leaveType: vacationPolicy,
      hireDateStr: '2028-02-15',
      year: 2028,
      month: 2,
    });

    const accrualsCorrect =
      fullMonthAccrual.unitsToAccrue === 1.167 &&
      midMonthAccrual.unitsToAccrue === 0.584 && // round(1.167 * (15/30)) = 0.584
      leapYearAccrual.unitsToAccrue === 0.604; // round(1.167 * (15/29)) = 0.604

    logResult('Accrual Engine Edge Cases (Full Month, Mid-Month Pro-rata & Leap Years)', accrualsCorrect);

    // ------------------------------------------------------------------------
    // 2. Immutable Ledger Recomputation Test
    // ------------------------------------------------------------------------
    const ledger: LeaveLedgerEntry[] = [
      {
        id: '1',
        tenantId: 'tenant-001',
        employeeId: 'emp-01',
        leaveTypeId: vacationPolicy.id,
        entryType: 'accrual',
        units: 1.167,
        effectiveDate: '2026-01-31',
        reason: 'Monthly accrual Jan 2026',
        createdAt: '2026-01-31T00:00:00Z',
      },
      {
        id: '2',
        tenantId: 'tenant-001',
        employeeId: 'emp-01',
        leaveTypeId: vacationPolicy.id,
        entryType: 'accrual',
        units: 1.167,
        effectiveDate: '2026-02-28',
        reason: 'Monthly accrual Feb 2026',
        createdAt: '2026-02-28T00:00:00Z',
      },
      {
        id: '3',
        tenantId: 'tenant-001',
        employeeId: 'emp-01',
        leaveTypeId: vacationPolicy.id,
        entryType: 'carry_over',
        units: 4.0,
        effectiveDate: '2026-01-01',
        reason: 'Carried forward from 2025',
        createdAt: '2026-01-01T00:00:00Z',
      },
      {
        id: '4',
        tenantId: 'tenant-001',
        employeeId: 'emp-01',
        leaveTypeId: vacationPolicy.id,
        entryType: 'usage',
        units: -3.0,
        effectiveDate: '2026-02-10',
        reason: 'Annual leave taken',
        createdAt: '2026-02-10T00:00:00Z',
      },
      {
        id: '5',
        tenantId: 'tenant-001',
        employeeId: 'emp-01',
        leaveTypeId: vacationPolicy.id,
        entryType: 'adjustment',
        units: 1.0,
        effectiveDate: '2026-02-15',
        reason: 'Approved compensation day adjustment',
        createdAt: '2026-02-15T00:00:00Z',
      },
      {
        id: '6',
        tenantId: 'tenant-001',
        employeeId: 'emp-01',
        leaveTypeId: vacationPolicy.id,
        entryType: 'expiry',
        units: -1.0,
        effectiveDate: '2026-06-30',
        reason: 'Unused carry-over expired after 6 months',
        createdAt: '2026-06-30T00:00:00Z',
      },
    ];

    // As of March 1: allocated (2.334) + carried (4.0) + adj (1.0) - used (3.0) = 4.334 available
    const marchBalance = computeBalanceFromLedger(ledger, '2026-03-01');
    // As of July 1 (after expiry of 1.0 day): 3.334 available
    const julyBalance = computeBalanceFromLedger(ledger, '2026-07-01');

    const ledgerMatches =
      marchBalance.available === 4.334 &&
      marchBalance.used === 3.0 &&
      julyBalance.available === 3.334 &&
      julyBalance.expired === 1.0;

    logResult('Immutable Ledger Balance Recomputation & Expiry Fidelity', ledgerMatches);

    // ------------------------------------------------------------------------
    // 3. Jamaican Statutory Public Holidays & Weekend Exclusion Test
    // ------------------------------------------------------------------------
    // Easter Window 2026: April 2 (Thu) to April 8 (Wed) = 7 calendar days
    // - April 2 (Thu): Work day
    // - April 3 (Fri): Good Friday (Statutory Holiday - skipped)
    // - April 4 (Sat): Weekend (skipped)
    // - April 5 (Sun): Weekend (skipped)
    // - April 6 (Mon): Easter Monday (Statutory Holiday - skipped)
    // - April 7 (Tue): Work day
    // - April 8 (Wed): Work day
    // Total working days should be EXACTLY 3 days!
    const easterWorkingDays = calculateWorkingDays('2026-04-02', '2026-04-08', JAMAICAN_STATUTORY_HOLIDAYS_2026);
    logResult('Statutory Public Holiday & Weekend Exclusion (Easter Test: 7 cal days -> 3 work days)', easterWorkingDays === 3);

    // ------------------------------------------------------------------------
    // 4. Overlap & Policy Sufficiency Validation Test
    // ------------------------------------------------------------------------
    // Test 4A: Balance sufficiency
    const overdraftRequest = validateLeaveRequest({
      startDate: '2026-05-04',
      endDate: '2026-05-15', // 10 working days requested
      leaveType: vacationPolicy,
      currentBalance: marchBalance, // only 4.334 available, no negative allowed
      existingRequests: [],
    });

    // Test 4B: Overlap detection
    const overlappingRequest = validateLeaveRequest({
      startDate: '2026-05-04',
      endDate: '2026-05-06',
      leaveType: vacationPolicy,
      currentBalance: { ...marchBalance, available: 15.0 },
      existingRequests: [{ startDate: '2026-05-05', endDate: '2026-05-08', status: 'hr_approved' }],
    });

    // Test 4C: Blackout period conflict
    const blackoutRequest = validateLeaveRequest({
      startDate: '2026-03-25',
      endDate: '2026-03-27',
      leaveType: vacationPolicy,
      currentBalance: { ...marchBalance, available: 15.0 },
      existingRequests: [],
      blackoutPeriods: [{ startDate: '2026-03-20', endDate: '2026-03-31', title: 'Q1 Financial Audit Lockout' }],
    });

    // Test 4D: Sick documentation requirement (> 2 days)
    const undocumentedSick = validateLeaveRequest({
      startDate: '2026-05-04',
      endDate: '2026-05-07', // 4 days sick leave requested
      leaveType: sickPolicy,
      currentBalance: { leaveTypeId: sickPolicy.id, allocated: 10, used: 0, carriedOver: 0, expired: 0, adjustments: 0, available: 10 },
      existingRequests: [],
      hasSupportingDocument: false,
    });

    const validationsCorrect =
      !overdraftRequest.valid &&
      !overlappingRequest.valid &&
      !blackoutRequest.valid &&
      !undocumentedSick.valid;

    logResult('Leave Validation (Overdraft, Overlap, Blackouts & Medical Proof)', validationsCorrect);

    // ------------------------------------------------------------------------
    // 5. Payroll-Ready Absence Integration & Vacation Liability Test
    // ------------------------------------------------------------------------
    const payrollExport = calculatePayrollLeaveExport({
      employee: {
        id: 'emp-01',
        employeeNumber: 'EMP-9101',
        firstName: 'Aaliyah',
        lastName: 'Brown',
        department: 'Marketing',
        annualSalary: 104000, // $104,000 / 260 statutory days = $400/day
      },
      periodMonth: '2026-03',
      approvedRequests: [
        { leaveTypeCode: 'VACATION', startDate: '2026-03-02', endDate: '2026-03-04', days: 3 },
        { leaveTypeCode: 'UNPAID', startDate: '2026-03-10', endDate: '2026-03-11', days: 2 },
      ],
      availableVacationDays: 5.5,
    });

    const payrollValid =
      payrollExport.dailyRate === 400 &&
      payrollExport.paidLeaveDays === 3 &&
      payrollExport.unpaidLeaveDays === 2 &&
      payrollExport.netBillableDays === 20 && // 22 standard - 2 unpaid
      payrollExport.unpaidDeductionAmount === 800 && // 2 unpaid * $400
      payrollExport.accruedVacationLiability === 2200; // 5.5 days * $400

    logResult('Payroll-Ready Leave Summary & Vacation Dollar Liability', payrollValid);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(`FATAL ERROR: ${msg}`);
    allPassed = false;
  }

  return { passed: allPassed, results };
}
