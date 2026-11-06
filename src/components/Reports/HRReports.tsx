import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  Download
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { ShieldAlert } from 'lucide-react';

interface HRReportsProps {
  initialTab?: 'employee-reports' | 'leave-reports' | 'attendance-reports';
}

export const HRReports: React.FC<HRReportsProps> = ({ initialTab = 'employee-reports' }) => {
  const { employees, departments, leaveTypes, leaveBalances, attendanceRecords } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'employee-reports' | 'leave-reports' | 'attendance-reports'>(initialTab);

  if (user?.role === 'employee') {
    return (
      <div className="p-8 max-w-3xl mx-auto">
        <div className="bg-white border border-slate-200 rounded-2xl p-8 shadow-xs text-center">
          <div className="w-14 h-14 bg-amber-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-amber-200">
            <ShieldAlert className="w-7 h-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-bold text-gray-900 mb-2">Restricted Access (Row-Level Security)</h2>
          <p className="text-gray-600 text-sm max-w-lg mx-auto leading-relaxed mb-6">
            Company-wide workforce analytics, aggregate salary distributions, and organizational reports are restricted to Human Resources, Management, and Compliance Auditors.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 max-w-md mx-auto text-left text-xs text-slate-700 space-y-2 mb-6">
            <p className="font-semibold text-slate-800">Your Available Self-Service Portals:</p>
            <ul className="list-disc list-inside space-y-1 text-slate-600">
              <li>Review, sign documents, and update personal data under <strong>My Profile & Employment</strong></li>
              <li>Track submitted leave and profile requests in <strong>My Requests & Status</strong></li>
              <li>Complete Monthly, Quarterly, and Annual evaluations in <strong>My Performance Reviews</strong></li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // 1. Employee Metrics
  const totalEmployees = employees.length;
  const activeCount = employees.filter(e => e.jobInfo.employmentStatus === 'active').length;
  const fullTimeCount = employees.filter(e => e.jobInfo.employmentType === 'full_time').length;
  const totalPayroll = employees.reduce((sum, e) => sum + e.jobInfo.salary, 0);
  const avgSalary = totalEmployees > 0 ? Math.round(totalPayroll / totalEmployees) : 0;

  // Department Distribution
  const deptBreakdown = departments.map(d => {
    const count = employees.filter(e => e.jobInfo.department === d.name).length;
    const deptPayroll = employees.filter(e => e.jobInfo.department === d.name).reduce((sum, e) => sum + e.jobInfo.salary, 0);
    const pct = totalEmployees > 0 ? ((count / totalEmployees) * 100).toFixed(0) : 0;
    return { name: d.name, count, deptPayroll, pct };
  });

  // 2. Leave Metrics
  const totalLeaveAllocated = leaveBalances.reduce((sum, b) => sum + b.allocated, 0);
  const totalLeaveUsed = leaveBalances.reduce((sum, b) => sum + b.used, 0);
  const totalLeaveAvailable = leaveBalances.reduce((sum, b) => sum + b.available, 0);
  const leaveUtilizationRate = totalLeaveAllocated > 0 ? ((totalLeaveUsed / totalLeaveAllocated) * 100).toFixed(1) : '0';

  // 3. Attendance Metrics
  const totalPunchRecords = attendanceRecords.length;
  const onTimeCount = attendanceRecords.filter(r => r.status === 'present').length;
  const lateAttendanceCount = attendanceRecords.filter(r => r.status === 'late').length;
  const onTimePercentage = totalPunchRecords > 0 ? ((onTimeCount / totalPunchRecords) * 100).toFixed(1) : '100';
  const totalHoursWorked = attendanceRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0);
  const avgDailyHours = totalPunchRecords > 0 ? (totalHoursWorked / totalPunchRecords).toFixed(1) : '8.0';

  // Export handlers
  const exportEmployeeCSV = () => {
    const headers = ['Employee ID', 'Name', 'Department', 'Job Title', 'Status', 'Employment Type', 'Salary', 'Hire Date'];
    const rows = employees.map(e => [
      e.employeeId,
      `"${e.personalInfo.firstName} ${e.personalInfo.lastName}"`,
      `"${e.jobInfo.department}"`,
      `"${e.jobInfo.jobTitle}"`,
      e.jobInfo.employmentStatus,
      e.jobInfo.employmentType,
      e.jobInfo.salary,
      e.jobInfo.hireDate
    ]);
    downloadCSV('employee-headcount-report.csv', [headers, ...rows]);
  };

  const exportLeaveCSV = () => {
    const headers = ['Employee ID', 'Leave Type', 'Allocated', 'Used', 'Pending', 'Available', 'Carried Forward', 'Year'];
    const rows = leaveBalances.map(b => {
      const lt = leaveTypes.find(t => t.id === b.leaveTypeId)?.name || b.leaveTypeId;
      return [b.employeeId, `"${lt}"`, b.allocated, b.used, b.pending, b.available, b.carriedForward, b.year];
    });
    downloadCSV('leave-utilization-report.csv', [headers, ...rows]);
  };

  const exportAttendanceCSV = () => {
    const headers = ['Record ID', 'Employee ID', 'Date', 'Clock In', 'Clock Out', 'Status', 'Working Hours', 'Notes'];
    const rows = attendanceRecords.map(r => [
      r.id,
      r.employeeId,
      r.date,
      `"${r.clockIn || ''}"`,
      `"${r.clockOut || ''}"`,
      r.status,
      r.workingHours,
      `"${r.notes || ''}"`
    ]);
    downloadCSV('attendance-report.csv', [headers, ...rows]);
  };

  const downloadCSV = (filename: string, data: (string | number)[][]) => {
    const csvContent = data.map(r => r.join(',')).join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Workforce Analytics & Executive Reports</h1>
          <p className="text-gray-600 text-sm mt-1">High-level KPIs, department breakdown, absence analytics, and data export</p>
        </div>
        <button
          onClick={() => {
            if (activeTab === 'employee-reports') exportEmployeeCSV();
            else if (activeTab === 'leave-reports') exportLeaveCSV();
            else exportAttendanceCSV();
          }}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
        >
          <Download className="w-4 h-4" />
          Export Current Report (CSV)
        </button>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 gap-2">
        {[
          { id: 'employee-reports', label: 'Headcount & Demographics', icon: <Users className="w-4 h-4" /> },
          { id: 'leave-reports', label: 'Leave & PTO Utilization', icon: <Calendar className="w-4 h-4" /> },
          { id: 'attendance-reports', label: 'Punctuality & Hours Worked', icon: <Clock className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600 font-bold'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: EMPLOYEE REPORTS */}
      {activeTab === 'employee-reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Headcount</span>
              <p className="text-2xl font-bold text-gray-900 mt-2">{totalEmployees} personnel</p>
              <span className="text-xs text-emerald-600 mt-1 block">{activeCount} active status</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Full-Time Ratio</span>
              <p className="text-2xl font-bold text-blue-600 mt-2">
                {totalEmployees > 0 ? ((fullTimeCount / totalEmployees) * 100).toFixed(0) : 0}%
              </p>
              <span className="text-xs text-gray-500 mt-1 block">{fullTimeCount} full-time positions</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Annual Payroll</span>
              <p className="text-2xl font-bold text-gray-900 mt-2">${totalPayroll.toLocaleString()}</p>
              <span className="text-xs text-gray-500 mt-1 block">Annualized compensation pool</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Salary</span>
              <p className="text-2xl font-bold text-purple-600 mt-2">${avgSalary.toLocaleString()}</p>
              <span className="text-xs text-gray-500 mt-1 block">Per full-time employee</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Department Distribution & Budget</h3>
            <div className="space-y-4">
              {deptBreakdown.map(dept => (
                <div key={dept.name} className="space-y-1.5">
                  <div className="flex justify-between text-xs font-semibold text-gray-700">
                    <span>{dept.name} ({dept.count} members)</span>
                    <span>${dept.deptPayroll.toLocaleString()} ({dept.pct}%)</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-blue-600 h-full rounded-full transition-all"
                      style={{ width: `${Math.max(5, Number(dept.pct))}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: LEAVE REPORTS */}
      {activeTab === 'leave-reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Company Utilization Rate</span>
              <p className="text-3xl font-extrabold text-blue-600 mt-2">{leaveUtilizationRate}%</p>
              <span className="text-xs text-gray-500 mt-1 block">Of allocated days taken to date</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Days Consumed</span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-2">{totalLeaveUsed} Days</p>
              <span className="text-xs text-gray-500 mt-1 block">Approved absences</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Available Balance Pool</span>
              <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalLeaveAvailable} Days</p>
              <span className="text-xs text-gray-500 mt-1 block">Remaining across all personnel</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <h3 className="text-base font-bold text-gray-900 mb-4">Leave Category Allowances</h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {leaveTypes.map(lt => {
                const balancesOfType = leaveBalances.filter(b => b.leaveTypeId === lt.id);
                const usedInType = balancesOfType.reduce((sum, b) => sum + b.used, 0);
                const allocatedInType = balancesOfType.reduce((sum, b) => sum + b.allocated, 0);
                const typeUtilization = allocatedInType > 0 ? ((usedInType / allocatedInType) * 100).toFixed(0) : 0;
                return (
                  <div key={lt.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                    <p className="text-sm font-bold text-gray-900">{lt.name}</p>
                    <div className="flex justify-between text-xs text-gray-600 mt-2">
                      <span>Used: {usedInType}d</span>
                      <span>Total: {allocatedInType}d</span>
                    </div>
                    <div className="w-full bg-gray-200 h-2 rounded-full overflow-hidden mt-2">
                      <div 
                        className="bg-blue-600 h-full"
                        style={{ width: `${Math.min(100, Number(typeUtilization))}%` }}
                      ></div>
                    </div>
                    <span className="text-[11px] text-gray-500 mt-1.5 block">{typeUtilization}% utilized</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: ATTENDANCE REPORTS */}
      {activeTab === 'attendance-reports' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">On-Time Punctuality</span>
              <p className="text-3xl font-extrabold text-emerald-600 mt-2">{onTimePercentage}%</p>
              <span className="text-xs text-gray-500 mt-1 block">{onTimeCount} on-time vs {lateAttendanceCount} late</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Daily Hours</span>
              <p className="text-3xl font-extrabold text-blue-600 mt-2">{avgDailyHours} hrs</p>
              <span className="text-xs text-gray-500 mt-1 block">Target standard shift: 8.0 hrs</span>
            </div>
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Hours Recorded</span>
              <p className="text-3xl font-extrabold text-gray-900 mt-2">{totalHoursWorked.toFixed(0)} hrs</p>
              <span className="text-xs text-gray-500 mt-1 block">Logged across team punch cards</span>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
            <h3 className="text-base font-bold text-gray-900 mb-3">Attendance Health Summary</h3>
            <p className="text-xs text-gray-600 leading-relaxed">
              Employee attendance adherence is performing well above standard operational benchmarks (92%).
              HR policies allow a 15-minute grace period before tardiness flags are registered in compliance audits.
            </p>
          </div>
        </div>
      )}
    </div>
  );
};
