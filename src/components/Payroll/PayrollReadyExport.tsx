import React, { useState } from 'react';
import { 
  DollarSign, 
  Download, 
  Calendar, 
  FileSpreadsheet
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

export const PayrollReadyExport: React.FC = () => {
  const { getPayrollExport, currentTenant } = useData();

  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const payrollSummary = getPayrollExport(selectedMonth);

  const downloadPayrollCSV = () => {
    const headers = [
      'Employee ID',
      'Employee Name',
      'Department',
      'Base Monthly Salary',
      'Billable Days Worked',
      'Paid Leave Days',
      'Unpaid Leave Days',
      'Overtime Hours',
      'Overtime Pay',
      'Estimated Gross Pay',
      'Currency'
    ];

    const rows = payrollSummary.records.map(r => [
      r.employeeId,
      `"${r.employeeName}"`,
      `"${r.department}"`,
      r.salary,
      r.daysWorked,
      r.paidLeaveDays,
      r.unpaidLeaveDays,
      r.overtimeHours,
      r.overtimePay,
      r.grossPayEstimate,
      currentTenant.currency
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Payroll_Export_${currentTenant.subdomain}_${selectedMonth}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Payroll-Ready Reconciliation & Export</h1>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Standardized attendance days, approved leave deductions, and overtime calculations formatted for any payroll engine
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Pay Period:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2.5 py-1.5 border border-gray-300 rounded-lg bg-white text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <button
            onClick={downloadPayrollCSV}
            className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
          >
            <Download className="w-4 h-4" /> Download Payroll CSV
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Personnel</span>
          <div className="mt-2 text-2xl font-bold text-gray-900">{payrollSummary.totalEmployees}</div>
          <span className="text-[11px] text-gray-400 mt-1 block">Active on payroll ledger</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Days Worked</span>
          <div className="mt-2 text-2xl font-bold text-blue-600">{payrollSummary.totalBillableDays}</div>
          <span className="text-[11px] text-gray-400 mt-1 block">Standard 22-day working period</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Paid Leave Days</span>
          <div className="mt-2 text-2xl font-bold text-indigo-600">{payrollSummary.totalLeaveDays} Days</div>
          <span className="text-[11px] text-gray-400 mt-1 block">Approved annual & sick leave</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Accrued Overtime</span>
          <div className="mt-2 text-2xl font-bold text-amber-600">{payrollSummary.totalOvertimeHours} Hours</div>
          <span className="text-[11px] text-gray-400 mt-1 block">Surplus verified timesheet hours</span>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              Payroll Ledger for {selectedMonth} ({currentTenant.name})
            </h3>
          </div>
          <span className="text-xs text-gray-500">
            Currency: <strong className="font-bold text-gray-800">{currentTenant.currency} ({currentTenant.currencySymbol})</strong>
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/50 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Staff ID</th>
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">Department</th>
                <th className="py-3 px-3 text-right">Base Salary</th>
                <th className="py-3 px-3 text-center">Days Worked</th>
                <th className="py-3 px-3 text-center">Paid Leave</th>
                <th className="py-3 px-3 text-center">Unpaid</th>
                <th className="py-3 px-3 text-center">Overtime</th>
                <th className="py-3 px-3 text-right">OT Pay</th>
                <th className="py-3 px-4 text-right">Est. Gross Pay</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payrollSummary.records.map(record => (
                <tr key={record.employeeId} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-blue-600">{record.employeeId}</td>
                  <td className="py-3.5 px-4 font-bold text-gray-900">{record.employeeName}</td>
                  <td className="py-3.5 px-3 text-gray-600">{record.department}</td>
                  <td className="py-3.5 px-3 text-right font-medium text-gray-800">
                    {currentTenant.currencySymbol}{record.salary.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-3 text-center font-semibold text-emerald-700">
                    {record.daysWorked}d
                  </td>
                  <td className="py-3.5 px-3 text-center text-blue-700">{record.paidLeaveDays}d</td>
                  <td className="py-3.5 px-3 text-center text-gray-400">{record.unpaidLeaveDays}d</td>
                  <td className="py-3.5 px-3 text-center font-semibold text-amber-700">
                    {record.overtimeHours > 0 ? `+${record.overtimeHours}h` : '0h'}
                  </td>
                  <td className="py-3.5 px-3 text-right font-medium text-amber-800">
                    {currentTenant.currencySymbol}{record.overtimePay.toLocaleString()}
                  </td>
                  <td className="py-3.5 px-4 text-right font-bold text-gray-900">
                    {currentTenant.currencySymbol}{record.grossPayEstimate.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
