/**
 * VerticalHR People Analytics & Reporting Engine
 * Computes headcount, department distribution, turnover, tenure analytics, and CSV exports.
 */

export interface EmployeeReportRecord {
  id: string;
  employeeNumber: string;
  name: string;
  department: string;
  jobTitle: string;
  status: string;
  employmentType: string;
  hireDate: string;
  terminationDate?: string;
  salary: number;
  gender?: string;
}

export interface HeadcountSummary {
  totalEmployees: number;
  activeCount: number;
  probationCount: number;
  terminatedCount: number;
  turnoverRatePercent: number;
  averageTenureYears: number;
  departmentBreakdown: Array<{
    department: string;
    headcount: number;
    percentage: number;
    totalSalary: number;
  }>;
  employmentTypeBreakdown: Array<{
    type: string;
    count: number;
  }>;
}

/**
 * Computes comprehensive headcount, turnover, and tenure metrics.
 */
export function generateHeadcountReport(employees: EmployeeReportRecord[]): HeadcountSummary {
  const total = employees.length;
  if (total === 0) {
    return {
      totalEmployees: 0,
      activeCount: 0,
      probationCount: 0,
      terminatedCount: 0,
      turnoverRatePercent: 0,
      averageTenureYears: 0,
      departmentBreakdown: [],
      employmentTypeBreakdown: [],
    };
  }

  let activeCount = 0;
  let probationCount = 0;
  let terminatedCount = 0;
  let totalTenureDays = 0;

  const deptMap: Record<string, { count: number; salary: number }> = {};
  const typeMap: Record<string, number> = {};

  const now = new Date().getTime();

  employees.forEach((emp) => {
    if (emp.status === 'active') activeCount++;
    else if (emp.status === 'probation') probationCount++;
    else if (emp.status === 'terminated' || emp.status === 'resigned') terminatedCount++;

    // Department grouping
    const dept = emp.department || 'Unassigned';
    if (!deptMap[dept]) deptMap[dept] = { count: 0, salary: 0 };
    deptMap[dept].count++;
    deptMap[dept].salary += emp.salary || 0;

    // Employment type grouping
    const type = emp.employmentType || 'full_time';
    typeMap[type] = (typeMap[type] || 0) + 1;

    // Tenure calculation
    const hireTime = new Date(emp.hireDate).getTime();
    const endTime = emp.terminationDate ? new Date(emp.terminationDate).getTime() : now;
    if (!isNaN(hireTime)) {
      totalTenureDays += Math.max(0, (endTime - hireTime) / (1000 * 3600 * 24));
    }
  });

  const averageTenureYears = Math.round((totalTenureDays / total / 365.25) * 10) / 10;
  const averageActiveBase = Math.max(1, activeCount + probationCount);
  const turnoverRatePercent = Math.round((terminatedCount / averageActiveBase) * 100 * 10) / 10;

  const departmentBreakdown = Object.entries(deptMap).map(([department, data]) => ({
    department,
    headcount: data.count,
    percentage: Math.round((data.count / total) * 100),
    totalSalary: data.salary,
  }));

  const employmentTypeBreakdown = Object.entries(typeMap).map(([type, count]) => ({
    type,
    count,
  }));

  return {
    totalEmployees: total,
    activeCount,
    probationCount,
    terminatedCount,
    turnoverRatePercent,
    averageTenureYears,
    departmentBreakdown,
    employmentTypeBreakdown,
  };
}

/**
 * Serializes report rows into standard RFC 4180 CSV format.
 */
export function exportReportToCsv(headers: string[], rows: (string | number)[][]): string {
  const escapeCell = (val: string | number): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [headers.map(escapeCell).join(',')];
  rows.forEach((row) => {
    lines.push(row.map(escapeCell).join(','));
  });

  return lines.join('\n');
}
