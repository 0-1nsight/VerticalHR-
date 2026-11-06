/**
 * VerticalHR Leave Reporting & Payroll-Ready Absence Integration
 * Computes paid vs unpaid absences for payroll cycles, vacation dollar liability,
 * and team "Who is Out" calendar schedules.
 */

export interface EmployeeAbsenceSummary {
  employeeId: string;
  employeeNumber: string;
  employeeName: string;
  department: string;
  periodMonth: string; // YYYY-MM
  standardWorkDays: number;
  paidLeaveDays: number;
  unpaidLeaveDays: number;
  netBillableDays: number;
  dailyRate: number;
  unpaidDeductionAmount: number;
  accruedVacationLiability: number;
}

export interface WhoIsOutEntry {
  employeeId: string;
  employeeName: string;
  department: string;
  leaveType: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  isHalfDay: boolean;
}

/**
 * Calculates monthly payroll absence adjustments for an employee.
 */
export function calculatePayrollLeaveExport(params: {
  employee: {
    id: string;
    employeeNumber: string;
    firstName: string;
    lastName: string;
    department: string;
    annualSalary: number;
  };
  periodMonth: string; // e.g. "2026-03"
  approvedRequests: Array<{
    leaveTypeCode: string;
    startDate: string;
    endDate: string;
    days: number;
  }>;
  availableVacationDays: number;
  standardWorkDaysInMonth?: number;
}): EmployeeAbsenceSummary {
  const { employee, periodMonth, approvedRequests, availableVacationDays, standardWorkDaysInMonth = 22 } = params;

  let paidLeaveDays = 0;
  let unpaidLeaveDays = 0;

  approvedRequests.forEach((req) => {
    if (req.leaveTypeCode === 'UNPAID') {
      unpaidLeaveDays += req.days;
    } else {
      paidLeaveDays += req.days;
    }
  });

  const netBillableDays = Math.max(0, standardWorkDaysInMonth - unpaidLeaveDays);
  // Standard statutory workdays per annum in Jamaica = 260 days (52 weeks * 5 days)
  const dailyRate = Math.round((employee.annualSalary / 260) * 100) / 100;
  const unpaidDeductionAmount = Math.round(unpaidLeaveDays * dailyRate * 100) / 100;
  const accruedVacationLiability = Math.round(availableVacationDays * dailyRate * 100) / 100;

  return {
    employeeId: employee.id,
    employeeNumber: employee.employeeNumber,
    employeeName: `${employee.firstName} ${employee.lastName}`,
    department: employee.department,
    periodMonth,
    standardWorkDays: standardWorkDaysInMonth,
    paidLeaveDays,
    unpaidLeaveDays,
    netBillableDays,
    dailyRate,
    unpaidDeductionAmount,
    accruedVacationLiability,
  };
}

/**
 * Generates the "Who Is Out" schedule for team calendars across a date window.
 */
export function getWhoIsOutSchedule(params: {
  targetDate: string; // YYYY-MM-DD
  activeRequests: Array<{
    employeeId: string;
    employeeName: string;
    department: string;
    leaveTypeName: string;
    startDate: string;
    endDate: string;
    totalDays: number;
    isHalfDay: boolean;
    status: string;
  }>;
}): WhoIsOutEntry[] {
  const targetMs = new Date(params.targetDate + 'T12:00:00Z').getTime();

  return params.activeRequests
    .filter((req) => {
      if (req.status !== 'hr_approved' && req.status !== 'approved') return false;
      const startMs = new Date(req.startDate + 'T00:00:00Z').getTime();
      const endMs = new Date(req.endDate + 'T23:59:59Z').getTime();
      return targetMs >= startMs && targetMs <= endMs;
    })
    .map((req) => ({
      employeeId: req.employeeId,
      employeeName: req.employeeName,
      department: req.department,
      leaveType: req.leaveTypeName,
      startDate: req.startDate,
      endDate: req.endDate,
      totalDays: req.totalDays,
      isHalfDay: req.isHalfDay,
    }));
}
