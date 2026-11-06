/**
 * VerticalHR Production Leave Accrual & Ledger Engine
 * Implements immutable ledger balances, idempotent scheduled accruals,
 * Jamaican statutory public holidays, business day calculations, and overlap validation.
 */

export interface LeaveTypePolicy {
  id: string;
  tenantId: string;
  name: string;
  code: string;
  accrualMethod: 'monthly' | 'anniversary' | 'upfront' | 'none';
  accrualRatePerPeriod: number; // e.g. 1.167 days per month
  annualQuota: number; // e.g. 14 days statutory vacation
  carryOverAllowed: boolean;
  carryOverCap: number; // e.g. 5 days
  carryOverExpiryMonths: number; // e.g. expires June 30 (6 months)
  allowNegativeBalance: boolean;
  negativeLimit: number;
  unit: 'days' | 'half_days' | 'hours';
  requiresDocumentation: boolean;
  documentationThresholdDays: number;
}

export interface LeaveLedgerEntry {
  id: string;
  tenantId: string;
  employeeId: string;
  leaveTypeId: string;
  entryType: 'accrual' | 'usage' | 'carry_over' | 'adjustment' | 'expiry' | 'cancellation_credit';
  units: number; // Positive = credit, Negative = debit
  effectiveDate: string; // YYYY-MM-DD
  idempotencyKey?: string;
  referenceId?: string;
  reason: string;
  createdAt: string;
}

export interface RecomputedLeaveBalance {
  leaveTypeId: string;
  allocated: number;
  used: number;
  carriedOver: number;
  expired: number;
  adjustments: number;
  available: number;
}

export interface PublicHoliday {
  name: string;
  date: string; // YYYY-MM-DD
  observedDate: string; // YYYY-MM-DD
}

export interface BlackoutPeriod {
  startDate: string;
  endDate: string;
  title: string;
  departmentId?: string;
}

/**
 * Official Jamaican Statutory Public Holidays (Public Holidays Act of Jamaica).
 * Configured with official observance rules (Sunday holidays observed on Monday).
 */
export const JAMAICAN_STATUTORY_HOLIDAYS_2026: PublicHoliday[] = [
  { name: "New Year's Day", date: '2026-01-01', observedDate: '2026-01-01' },
  { name: 'Ash Wednesday', date: '2026-02-18', observedDate: '2026-02-18' },
  { name: 'Good Friday', date: '2026-04-03', observedDate: '2026-04-03' },
  { name: 'Easter Monday', date: '2026-04-06', observedDate: '2026-04-06' },
  { name: 'Labour Day', date: '2026-05-23', observedDate: '2026-05-25' }, // Saturday/Sunday observance rule
  { name: 'Emancipation Day', date: '2026-08-01', observedDate: '2026-08-03' }, // Saturday/Sunday roll
  { name: 'Independence Day', date: '2026-08-06', observedDate: '2026-08-06' },
  { name: 'National Heroes Day', date: '2026-10-19', observedDate: '2026-10-19' }, // 3rd Monday in October
  { name: 'Christmas Day', date: '2026-12-25', observedDate: '2026-12-25' },
  { name: 'Boxing Day', date: '2026-12-26', observedDate: '2026-12-28' }, // Weekend roll
];

/**
 * Checks if a specific date is a weekend (Saturday or Sunday).
 */
export function isWeekend(dateStr: string): boolean {
  const d = new Date(dateStr + 'T12:00:00Z');
  const day = d.getUTCDay();
  return day === 0 || day === 6; // 0 = Sun, 6 = Sat
}

/**
 * Calculates net working days between startDate and endDate (inclusive),
 * excluding weekends and statutory public holidays.
 */
export function calculateWorkingDays(
  startDateStr: string,
  endDateStr: string,
  holidays: PublicHoliday[] = JAMAICAN_STATUTORY_HOLIDAYS_2026,
  isHalfDay = false
): number {
  if (isHalfDay) {
    return 0.5;
  }

  const holidaySet = new Set(holidays.map((h) => h.observedDate));
  let count = 0;

  const current = new Date(startDateStr + 'T12:00:00Z');
  const end = new Date(endDateStr + 'T12:00:00Z');

  if (current > end) {
    throw new Error('Start date cannot be after end date.');
  }

  while (current <= end) {
    const yyyyMmDd = current.toISOString().split('T')[0];
    const day = current.getUTCDay();

    // Only count Monday-Friday non-holidays
    if (day !== 0 && day !== 6 && !holidaySet.has(yyyyMmDd)) {
      count++;
    }

    current.setUTCDate(current.getUTCDate() + 1);
  }

  return count;
}

/**
 * Recomputes an employee's exact leave balance directly from their immutable ledger transactions.
 * Never relies on a mutable balance column.
 */
export function computeBalanceFromLedger(
  entries: LeaveLedgerEntry[],
  asOfDateStr?: string
): RecomputedLeaveBalance {
  const asOf = asOfDateStr ? new Date(asOfDateStr + 'T23:59:59Z').getTime() : Date.now();

  let allocated = 0;
  let used = 0;
  let carriedOver = 0;
  let expired = 0;
  let adjustments = 0;

  entries.forEach((e) => {
    const entryTime = new Date(e.effectiveDate + 'T12:00:00Z').getTime();
    if (entryTime > asOf) return; // Ignore future entries

    switch (e.entryType) {
      case 'accrual':
        allocated += e.units;
        break;
      case 'usage':
        used += Math.abs(e.units); // Always positive count of used units
        break;
      case 'carry_over':
        carriedOver += e.units;
        break;
      case 'expiry':
        expired += Math.abs(e.units);
        break;
      case 'adjustment':
        adjustments += e.units;
        break;
      case 'cancellation_credit':
        used -= e.units; // Refund used days
        break;
    }
  });

  const available = Math.round((allocated + carriedOver + adjustments - used - expired) * 1000) / 1000;

  return {
    leaveTypeId: entries[0]?.leaveTypeId || 'unknown',
    allocated: Math.round(allocated * 1000) / 1000,
    used: Math.round(used * 1000) / 1000,
    carriedOver: Math.round(carriedOver * 1000) / 1000,
    expired: Math.round(expired * 1000) / 1000,
    adjustments: Math.round(adjustments * 1000) / 1000,
    available,
  };
}

/**
 * Computes monthly accrual credit with pro-rating for mid-month hires and leap years.
 * Idempotent: can be re-run safely.
 */
export function calculateMonthlyAccrual(params: {
  employeeId: string;
  leaveType: LeaveTypePolicy;
  hireDateStr: string;
  year: number;
  month: number; // 1 to 12
}): {
  shouldAccrue: boolean;
  unitsToAccrue: number;
  idempotencyKey: string;
  reason: string;
} {
  const { employeeId, leaveType, hireDateStr, year, month } = params;

  const monthStr = String(month).padStart(2, '0');
  const idempotencyKey = `accrual:${year}-${monthStr}:${employeeId}:${leaveType.id}`;

  if (leaveType.accrualMethod !== 'monthly') {
    return { shouldAccrue: false, unitsToAccrue: 0, idempotencyKey, reason: 'Non-monthly accrual method' };
  }

  // Days in this month (handles Feb 29 in leap years: new Date(year, month, 0).getDate())
  const totalDaysInMonth = new Date(year, month, 0).getDate();
  const monthStart = new Date(Date.UTC(year, month - 1, 1));
  const monthEnd = new Date(Date.UTC(year, month - 1, totalDaysInMonth));

  const hireDate = new Date(hireDateStr + 'T00:00:00Z');

  // Employee hired after this month: 0 accrual
  if (hireDate > monthEnd) {
    return { shouldAccrue: false, unitsToAccrue: 0, idempotencyKey, reason: 'Employee not yet hired' };
  }

  // Standard full-month accrual
  if (hireDate <= monthStart) {
    return {
      shouldAccrue: true,
      unitsToAccrue: leaveType.accrualRatePerPeriod,
      idempotencyKey,
      reason: `Full monthly accrual for ${year}-${monthStr}`,
    };
  }

  // Mid-month hire: pro-rate by active days in month
  const activeDays = totalDaysInMonth - hireDate.getUTCDate() + 1;
  const proRataFactor = activeDays / totalDaysInMonth;
  const proRatedUnits = Math.round(leaveType.accrualRatePerPeriod * proRataFactor * 1000) / 1000;

  return {
    shouldAccrue: true,
    unitsToAccrue: proRatedUnits,
    idempotencyKey,
    reason: `Pro-rated mid-month hire accrual (${activeDays}/${totalDaysInMonth} days in ${year}-${monthStr})`,
  };
}

/**
 * Validates a new leave request against overlaps, blackout dates, balance limits, and documentation.
 */
export function validateLeaveRequest(params: {
  startDate: string;
  endDate: string;
  isHalfDay?: boolean;
  leaveType: LeaveTypePolicy;
  currentBalance: RecomputedLeaveBalance;
  existingRequests: Array<{ startDate: string; endDate: string; status: string }>;
  blackoutPeriods?: BlackoutPeriod[];
  departmentId?: string;
  hasSupportingDocument?: boolean;
}): { valid: boolean; calculatedDays: number; error?: string } {
  const {
    startDate,
    endDate,
    isHalfDay = false,
    leaveType,
    currentBalance,
    existingRequests,
    blackoutPeriods = [],
    departmentId,
    hasSupportingDocument = false,
  } = params;

  if (new Date(startDate) > new Date(endDate)) {
    return { valid: false, calculatedDays: 0, error: 'Start date cannot exceed end date.' };
  }

  const calculatedDays = calculateWorkingDays(startDate, endDate, JAMAICAN_STATUTORY_HOLIDAYS_2026, isHalfDay);
  if (calculatedDays === 0) {
    return { valid: false, calculatedDays: 0, error: 'Selected range contains zero working days (weekends or public holidays).' };
  }

  // 1. Balance sufficiency check
  const projectedBalance = currentBalance.available - calculatedDays;
  if (projectedBalance < 0) {
    if (!leaveType.allowNegativeBalance) {
      return {
        valid: false,
        calculatedDays,
        error: `Insufficient leave balance. Requested: ${calculatedDays} days, Available: ${currentBalance.available} days.`,
      };
    }
    if (Math.abs(projectedBalance) > leaveType.negativeLimit) {
      return {
        valid: false,
        calculatedDays,
        error: `Requested leave exceeds allowable negative balance limit of -${leaveType.negativeLimit} days.`,
      };
    }
  }

  // 2. Overlap check against existing active requests
  const startMs = new Date(startDate + 'T00:00:00Z').getTime();
  const endMs = new Date(endDate + 'T23:59:59Z').getTime();

  for (const req of existingRequests) {
    if (req.status === 'rejected' || req.status === 'cancelled') continue;
    const existingStart = new Date(req.startDate + 'T00:00:00Z').getTime();
    const existingEnd = new Date(req.endDate + 'T23:59:59Z').getTime();

    if (startMs <= existingEnd && endMs >= existingStart) {
      return {
        valid: false,
        calculatedDays,
        error: `Date conflict: You already have a ${req.status} leave request between ${req.startDate} and ${req.endDate}.`,
      };
    }
  }

  // 3. Blackout period conflict check
  for (const bp of blackoutPeriods) {
    if (bp.departmentId && departmentId && bp.departmentId !== departmentId) continue;
    const bpStart = new Date(bp.startDate + 'T00:00:00Z').getTime();
    const bpEnd = new Date(bp.endDate + 'T23:59:59Z').getTime();

    if (startMs <= bpEnd && endMs >= bpStart) {
      return {
        valid: false,
        calculatedDays,
        error: `Cannot request leave during organizational blackout period: "${bp.title}" (${bp.startDate} to ${bp.endDate}).`,
      };
    }
  }

  // 4. Mandatory medical / proof documentation check
  if (leaveType.requiresDocumentation && calculatedDays > leaveType.documentationThresholdDays && !hasSupportingDocument) {
    return {
      valid: false,
      calculatedDays,
      error: `Supporting documentation (e.g., medical certificate) is mandatory for ${leaveType.name} exceeding ${leaveType.documentationThresholdDays} consecutive days.`,
    };
  }

  return { valid: true, calculatedDays };
}
