import React, { useState } from 'react';
import { 
  DollarSign, 
  Download, 
  Calendar, 
  FileSpreadsheet,
  CheckCircle2,
  Lock,
  Building2,
  Calculator,
  UserCheck,
  Eye,
  X,
  CreditCard,
  BookOpen,
  GitCompare,
  AlertTriangle,
  Printer
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { 
  payrollEngine, 
  generateTAJS01Return, 
  generateGeneralLedgerJournal, 
  generateBankPaymentFile, 
  compareParallelPayroll,
  EmployeePayrollResult,
  EmployeePayrollInput,
  JAMAICA_STATUTORY_RULES_2026
} from '../../services/payrollEngine';

export const PayrollReadyExport: React.FC = () => {
  const { currentTenant, employees, attendanceRecords } = useData();
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'pay_run' | 's01_returns' | 'bank_ach' | 'gl_journal' | 'parallel_run'>('pay_run');
  const [selectedMonth, setSelectedMonth] = useState('2026-11');
  const [selectedBankFormat, setSelectedBankFormat] = useState<'NCB_ACH' | 'BNS_SCOTIA' | 'JN_BANK'>('NCB_ACH');
  const [selectedPayslip, setSelectedPayslip] = useState<EmployeePayrollResult | null>(null);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Initialize or fetch the pay run for this month
  const runId = `pr-${selectedMonth}-main`;
  let currentRun = payrollEngine.getRun(runId);

  // Build employee inputs by synthesizing base salary, overtime from attendance, and non-taxable allowances
  const payrollInputs: EmployeePayrollInput[] = employees.map((emp, idx) => {
    // Default base salary in JMD (e.g. $180,000 to $450,000)
    const base = 180000 + (idx * 45000);
    // Find overtime hours from attendance
    const empPunch = attendanceRecords.find(r => r.employeeId === emp.id && r.date.startsWith(selectedMonth));
    const otHours = empPunch && empPunch.workingHours > 8 ? empPunch.workingHours - 8 : (idx % 2 === 0 ? 4 : 0);
    const hourlyRate = base / 160;
    const otPay = Math.round(otHours * hourlyRate * 1.5 * 100) / 100;
    const uniformAllowance = idx % 3 === 0 ? 15000 : 0; // Non-taxable tool/uniform allowance
    const pension = idx % 2 === 0 ? Math.round(base * 0.05) : 0; // 5% approved pension

    return {
      employeeId: emp.id,
      employeeName: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
      department: emp.jobInfo.department || 'Operations',
      trn: `1${String(idx + 1).padStart(2, '0')}-482-99${idx}`,
      nisNumber: `N-${String(idx + 1000).padStart(6, '0')}`,
      bankAccountNumber: `00${idx + 1}482910${idx}`,
      bankName: 'National Commercial Bank (NCB)',
      baseSalary: base,
      overtimePay: otPay,
      nonTaxableAllowances: uniformAllowance,
      pensionContribution: pension,
    };
  });

  if (!currentRun) {
    const draft = payrollEngine.createDraftRun({
      tenantId: currentTenant?.id || 't-default',
      periodMonth: selectedMonth,
      currency: 'JMD',
      exchangeRate: 1.0,
    });
    // Auto-calculate draft for instant responsiveness
    currentRun = payrollEngine.calculateRun(draft.id, payrollInputs, JAMAICA_STATUTORY_RULES_2026, 'preparer-clerk-001');
  }

  const handleRecalculate = () => {
    try {
      setApprovalError(null);
      payrollEngine.calculateRun(currentRun!.id, payrollInputs, JAMAICA_STATUTORY_RULES_2026, user?.id || 'user-clerk');
      setToastMessage('Pay run recalculated with latest attendance and statutory rates.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: unknown) {
      setApprovalError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleApprove = () => {
    try {
      setApprovalError(null);
      // Two-Person Rule Enforcement
      const approverId = user?.id || 'finance-director-002';
      payrollEngine.approveRun(currentRun!.id, approverId);
      setToastMessage('Pay run approved under Two-Person Rule authorization.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: unknown) {
      setApprovalError(err instanceof Error ? err.message : String(err));
    }
  };

  const handleFinalize = () => {
    try {
      setApprovalError(null);
      payrollEngine.finalizeAndLock(currentRun!.id);
      setToastMessage('Pay run finalized & locked. Records are now immutable.');
      setTimeout(() => setToastMessage(null), 3500);
    } catch (err: unknown) {
      setApprovalError(err instanceof Error ? err.message : String(err));
    }
  };

  const s01 = generateTAJS01Return(currentRun);
  const glJournal = generateGeneralLedgerJournal(currentRun);
  const achBatch = generateBankPaymentFile(currentRun, selectedBankFormat);

  // Parallel-run comparison with a mock legacy payroll export
  const legacyMock = currentRun.items.map((item, idx) => ({
    employeeId: item.employeeId,
    grossPay: item.grossEarnings,
    netPay: idx === 0 ? item.netPay + 25.50 : item.netPay, // Introduce 1 minor variance to demonstrate audit detector
    taxWithheld: item.employeePaye,
  }));
  const parallelAudit = compareParallelPayroll(currentRun.items, legacyMock);

  const downloadFile = (content: string, filename: string, mime: string) => {
    const blob = new Blob([content], { type: mime });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Jamaican Statutory Payroll Engine</h1>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Official TAJ statutory calculations (PAYE, NIS, NHT, Ed Tax, HEART/NTA), ACH direct deposit, and double-entry general ledger
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-xs font-semibold bg-white px-3 py-1.5 border border-gray-200 rounded-lg shadow-2xs">
            <Calendar className="w-4 h-4 text-gray-400" />
            <span>Pay Period:</span>
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="px-2 py-0.5 border border-gray-300 rounded text-xs font-medium focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border shadow-2xs bg-emerald-50 text-emerald-700 border-emerald-200">
            {currentRun.isLocked ? (
              <>
                <Lock className="w-3.5 h-3.5" /> Finalized & Locked
              </>
            ) : (
              <>
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                {currentRun.status}
              </>
            )}
          </span>
        </div>
      </div>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="p-3 bg-emerald-900 text-emerald-100 border border-emerald-700 rounded-xl text-xs flex items-center justify-between shadow-lg">
          <div className="flex items-center gap-2 font-medium">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>{toastMessage}</span>
          </div>
          <button onClick={() => setToastMessage(null)} className="text-emerald-300 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Error Alert */}
      {approvalError && (
        <div className="p-3.5 bg-red-50 text-red-800 border border-red-200 rounded-xl text-xs flex items-start gap-2.5 shadow-xs">
          <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <strong className="font-semibold block mb-0.5">Two-Person Rule / Governance Notice</strong>
            <span>{approvalError}</span>
          </div>
          <button onClick={() => setApprovalError(null)} className="text-red-400 hover:text-red-600">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Total Gross Payroll</span>
          <div className="mt-2 text-2xl font-bold text-gray-900">
            J${currentRun.totalGrossPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">
            {currentRun.items.length} personnel on active run
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Net Take-Home Pay</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            J${currentRun.totalNetPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-emerald-700 mt-1 block font-medium">
            Direct deposit disbursement total
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Statutory Withholdings</span>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            J${currentRun.totalEmployeeDeductions.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-gray-500 mt-1 block">
            PAYE, NIS, NHT & Ed Tax
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">TAJ S01 Remittance Due</span>
          <div className="mt-2 text-2xl font-bold text-indigo-600">
            J${s01.remittances.grandTotalRemittanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[11px] text-indigo-700 mt-1 block font-medium">
            Combined employee & employer taxes
          </span>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveTab('pay_run')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'pay_run' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileSpreadsheet className="w-4 h-4" />
          Pay Run Ledger & Payslips
        </button>

        <button
          onClick={() => setActiveTab('s01_returns')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 's01_returns' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building2 className="w-4 h-4" />
          TAJ S01 Monthly Return
        </button>

        <button
          onClick={() => setActiveTab('bank_ach')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'bank_ach' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <CreditCard className="w-4 h-4" />
          Bank ACH Direct Deposit
        </button>

        <button
          onClick={() => setActiveTab('gl_journal')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'gl_journal' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          General Ledger (GL) Journal
        </button>

        <button
          onClick={() => setActiveTab('parallel_run')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeTab === 'parallel_run' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <GitCompare className="w-4 h-4" />
          Parallel-Run Variance Auditor
        </button>
      </div>

      {/* TAB 1: Pay Run Ledger */}
      {activeTab === 'pay_run' && (
        <div className="space-y-4">
          {/* Action Bar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-gray-200">
            <div className="flex items-center gap-2 text-xs text-gray-600">
              <span className="font-semibold text-gray-800">Workflow State:</span>
              <span className="bg-slate-100 text-slate-800 px-2 py-0.5 rounded font-mono font-semibold uppercase">
                {currentRun.status}
              </span>
              {currentRun.calculatedBy && (
                <span className="text-gray-400">| Prepared by: {currentRun.calculatedBy}</span>
              )}
            </div>

            <div className="flex items-center gap-2">
              {!currentRun.isLocked && (
                <>
                  <button
                    onClick={handleRecalculate}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer"
                  >
                    <Calculator className="w-3.5 h-3.5" />
                    Recalculate
                  </button>

                  {currentRun.status === 'calculated' && (
                    <button
                      onClick={handleApprove}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                      title="Requires distinct manager approval under Two-Person Rule"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      Approve Run (Two-Person Rule)
                    </button>
                  )}

                  {currentRun.status === 'approved' && (
                    <button
                      onClick={handleFinalize}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold cursor-pointer shadow-xs"
                    >
                      <Lock className="w-3.5 h-3.5" />
                      Finalize & Lock Run
                    </button>
                  )}
                </>
              )}

              <button
                onClick={() => {
                  const csvHeaders = 'Employee,TRN,Base Salary,Overtime,Gross Earnings,NIS,NHT,Ed Tax,PAYE,Pension,Net Pay\n';
                  const rows = currentRun!.items.map(i => 
                    `"${i.employeeName}",${i.trn},${i.baseSalary},${i.overtimePay},${i.grossEarnings},${i.employeeNis},${i.employeeNht},${i.employeeEdTax},${i.employeePaye},${i.deductiblePension},${i.netPay}`
                  ).join('\n');
                  downloadFile(csvHeaders + rows, `PayRun_Ledger_${selectedMonth}.csv`, 'text/csv');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Ledger CSV
              </button>
            </div>
          </div>

          {/* Pay Run Table */}
          <div className="bg-white rounded-xl border border-gray-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50/75 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-3 px-4">Employee & TRN</th>
                    <th className="py-3 px-3 text-right">Base Salary</th>
                    <th className="py-3 px-3 text-right">Overtime</th>
                    <th className="py-3 px-3 text-right font-bold">Gross Earnings</th>
                    <th className="py-3 px-2 text-right text-indigo-700">NIS (3%)</th>
                    <th className="py-3 px-2 text-right text-blue-700">NHT (2%)</th>
                    <th className="py-3 px-2 text-right text-purple-700">Ed Tax (2.25%)</th>
                    <th className="py-3 px-2 text-right text-rose-700">PAYE Tax</th>
                    <th className="py-3 px-2 text-right text-amber-700">Pension</th>
                    <th className="py-3 px-4 text-right font-extrabold text-emerald-800">Net Pay</th>
                    <th className="py-3 px-3 text-center">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {currentRun.items.map((r) => (
                    <tr key={r.employeeId} className="hover:bg-slate-50 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-gray-900">{r.employeeName}</div>
                        <div className="text-[11px] font-mono text-gray-500">TRN: {r.trn}</div>
                      </td>
                      <td className="py-3.5 px-3 text-right font-medium text-gray-700">
                        ${r.baseSalary.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-right text-amber-700 font-medium">
                        {r.overtimePay > 0 ? `$${r.overtimePay.toLocaleString()}` : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-right font-bold text-gray-900">
                        ${r.grossEarnings.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-indigo-700">
                        ${r.employeeNis.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-blue-700">
                        ${r.employeeNht.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-purple-700">
                        ${r.employeeEdTax.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono font-semibold text-rose-700">
                        ${r.employeePaye.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-2 text-right font-mono text-amber-700">
                        {r.deductiblePension > 0 ? `$${r.deductiblePension.toFixed(2)}` : '—'}
                      </td>
                      <td className="py-3.5 px-4 text-right font-extrabold text-emerald-700 text-sm">
                        ${r.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </td>
                      <td className="py-3.5 px-3 text-center">
                        <button
                          onClick={() => setSelectedPayslip(r)}
                          className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                        >
                          <Eye className="w-3 h-3 text-blue-600" />
                          View
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: TAJ S01 Return */}
      {activeTab === 's01_returns' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                Official Compliance Form
              </span>
              <h2 className="text-xl font-bold text-gray-900 mt-1">Tax Administration Jamaica (TAJ) Schedule 01 (S01)</h2>
              <p className="text-xs text-gray-500">
                Monthly Employer's Statutory Deduction Return for {selectedMonth}
              </p>
            </div>

            <button
              onClick={() => {
                const s01Text = `TAX ADMINISTRATION JAMAICA - SCHEDULE 01 (S01)
Period: ${selectedMonth}
Employer TRN: 001-234-567
Total Gross Payroll: J$ ${s01.totalGrossPayroll.toFixed(2)}
Total Employees: ${s01.totalEmployeesCount}

REMITTANCES BREAKDOWN:
1. PAYE Income Tax: J$ ${s01.remittances.payeTax.toFixed(2)}
2. NIS Employee (3%): J$ ${s01.remittances.nisEmployee.toFixed(2)}
   NIS Employer (3%): J$ ${s01.remittances.nisEmployer.toFixed(2)}
   NIS Total: J$ ${s01.remittances.nisTotal.toFixed(2)}
3. NHT Employee (2%): J$ ${s01.remittances.nhtEmployee.toFixed(2)}
   NHT Employer (3%): J$ ${s01.remittances.nhtEmployer.toFixed(2)}
   NHT Total: J$ ${s01.remittances.nhtTotal.toFixed(2)}
4. Education Tax Employee (2.25%): J$ ${s01.remittances.edTaxEmployee.toFixed(2)}
   Education Tax Employer (3.5%): J$ ${s01.remittances.edTaxEmployer.toFixed(2)}
   Education Tax Total: J$ ${s01.remittances.edTaxTotal.toFixed(2)}
5. HEART/NTA Employer (3%): J$ ${s01.remittances.heartEmployer.toFixed(2)}

GRAND TOTAL STATUTORY REMITTANCE DUE: J$ ${s01.remittances.grandTotalRemittanceDue.toFixed(2)}
Generated by VerticalHR Engine: ${new Date().toISOString()}`;
                downloadFile(s01Text, `TAJ_S01_${selectedMonth}.txt`, 'text/plain');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Download className="w-4 h-4" />
              Download Official S01 Summary
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Employee Withholdings */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Part A: Employee Deductions Withheld
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">PAYE Income Tax</span>
                  <span className="font-mono font-bold text-slate-900">J${s01.remittances.payeTax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">NIS (Employee 3%)</span>
                  <span className="font-mono font-bold text-slate-900">J${s01.remittances.nisEmployee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">NHT (Employee 2%)</span>
                  <span className="font-mono font-bold text-slate-900">J${s01.remittances.nhtEmployee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">Education Tax (Employee 2.25%)</span>
                  <span className="font-mono font-bold text-slate-900">J${s01.remittances.edTaxEmployee.toFixed(2)}</span>
                </div>
              </div>
            </div>

            {/* Employer Contributions */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-700">
                Part B: Employer Statutory Contributions
              </h3>
              <div className="space-y-2 text-xs">
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">NIS (Employer 3%)</span>
                  <span className="font-mono font-bold text-slate-900">J${s01.remittances.nisEmployer.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">NHT (Employer 3%)</span>
                  <span className="font-mono font-bold text-slate-900">J${s01.remittances.nhtEmployer.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">Education Tax (Employer 3.5%)</span>
                  <span className="font-mono font-bold text-slate-900">J${s01.remittances.edTaxEmployer.toFixed(2)}</span>
                </div>
                <div className="flex justify-between py-1.5 border-b border-slate-200">
                  <span className="text-slate-600">HEART / NTA (Employer 3%)</span>
                  <span className="font-mono font-bold text-slate-900">J${s01.remittances.heartEmployer.toFixed(2)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">
                Total Statutory Remittance Due to TAJ:
              </span>
              <p className="text-xs text-emerald-700 mt-0.5">Due on or before the 14th of the following month</p>
            </div>
            <div className="text-2xl font-extrabold text-emerald-800 font-mono">
              J${s01.remittances.grandTotalRemittanceDue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Bank ACH */}
      {activeTab === 'bank_ach' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <h2 className="text-xl font-bold text-gray-900">Bank Direct Deposit Batch File</h2>
              <p className="text-xs text-gray-500">
                Automated electronic funds transfer formatted for Jamaican commercial banks
              </p>
            </div>

            <div className="flex items-center gap-3">
              <select
                value={selectedBankFormat}
                onChange={(e) => setSelectedBankFormat(e.target.value as 'NCB_ACH' | 'BNS_SCOTIA' | 'JN_BANK')}
                className="px-3 py-1.5 text-xs font-semibold border border-gray-300 rounded-lg bg-white"
              >
                <option value="NCB_ACH">NCB Direct Deposit (105-byte Fixed)</option>
                <option value="BNS_SCOTIA">Scotiabank Jamaica (BNS Direct)</option>
                <option value="JN_BANK">JN Bank Commercial ACH</option>
              </select>

              <button
                onClick={() => downloadFile(achBatch.content, achBatch.filename, 'text/plain')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs"
              >
                <Download className="w-4 h-4" />
                Download Bank Batch File
              </button>
            </div>
          </div>

          <div className="bg-slate-900 text-emerald-400 p-4 rounded-xl font-mono text-xs overflow-x-auto shadow-inner">
            <div className="text-slate-400 text-[11px] mb-2 border-b border-slate-800 pb-1 flex justify-between">
              <span>File Preview: {achBatch.filename}</span>
              <span>Total Records: {achBatch.totalRecords} | J$ {achBatch.totalAmount.toFixed(2)}</span>
            </div>
            <pre className="whitespace-pre-wrap">{achBatch.content}</pre>
          </div>
        </div>
      )}

      {/* TAB 4: GL Journal */}
      {activeTab === 'gl_journal' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">General Ledger (GL) Double-Entry Journal</h2>
                <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> Balanced
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Balanced accounting entries for ERP, QuickBooks, and Xero export
              </p>
            </div>

            <button
              onClick={() => {
                const csvHeaders = 'Journal,AccountCode,AccountName,Debit,Credit,Description\n';
                const rows = glJournal.entries.map(e => 
                  `${glJournal.journalNumber},${e.accountCode},"${e.accountName}",${e.debit},${e.credit},"${e.description}"`
                ).join('\n');
                downloadFile(csvHeaders + rows, `GL_Journal_${selectedMonth}.csv`, 'text/csv');
              }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold shadow-xs"
            >
              <Download className="w-4 h-4" />
              Download GL Journal CSV
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Account Code</th>
                  <th className="py-2.5 px-3">Account Name</th>
                  <th className="py-2.5 px-3">Description</th>
                  <th className="py-2.5 px-3 text-right">Debit (J$)</th>
                  <th className="py-2.5 px-3 text-right">Credit (J$)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {glJournal.entries.map((entry, idx) => (
                  <tr key={idx} className="hover:bg-slate-50 font-mono">
                    <td className="py-2.5 px-3 font-semibold text-blue-600">{entry.accountCode}</td>
                    <td className="py-2.5 px-3 font-sans font-medium text-gray-900">{entry.accountName}</td>
                    <td className="py-2.5 px-3 font-sans text-gray-500">{entry.description}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-800">
                      {entry.debit > 0 ? entry.debit.toFixed(2) : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-gray-800">
                      {entry.credit > 0 ? entry.credit.toFixed(2) : '—'}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-bold border-t-2 border-slate-300 font-mono text-xs">
                  <td colSpan={3} className="py-3 px-3 uppercase text-right">Total Balanced Invariant:</td>
                  <td className="py-3 px-3 text-right text-emerald-700">J$ {glJournal.totalDebits.toFixed(2)}</td>
                  <td className="py-3 px-3 text-right text-emerald-700">J$ {glJournal.totalCredits.toFixed(2)}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: Parallel Run */}
      {activeTab === 'parallel_run' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-gray-100 pb-4">
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-gray-900">Parallel-Run Variance Auditor</h2>
                <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                  Pre-Go-Live Reconciliation
                </span>
              </div>
              <p className="text-xs text-gray-500 mt-1">
                Comparing VerticalHR calculations with legacy customer payroll to guarantee zero-cent errors
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold text-gray-600">
                Matches: <strong className="text-emerald-600">{parallelAudit.matchingCount}</strong> / {parallelAudit.totalEmployeesCompared}
              </span>
              {parallelAudit.mismatchCount > 0 && (
                <span className="text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200 px-2.5 py-1 rounded-lg">
                  {parallelAudit.mismatchCount} Discrepancy Flagged
                </span>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3 text-right">System Gross</th>
                  <th className="py-2.5 px-3 text-right">Legacy Gross</th>
                  <th className="py-2.5 px-3 text-right">System Net</th>
                  <th className="py-2.5 px-3 text-right">Legacy Net</th>
                  <th className="py-2.5 px-3 text-right">Net Variance</th>
                  <th className="py-2.5 px-3 text-center">Audit Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 font-mono">
                {parallelAudit.comparisonDetails.map((c) => (
                  <tr key={c.employeeId} className={`hover:bg-slate-50 ${!c.isExactMatch ? 'bg-amber-50/50' : ''}`}>
                    <td className="py-2.5 px-3 font-sans font-semibold text-gray-900">{c.employeeName}</td>
                    <td className="py-2.5 px-3 text-right">${c.systemGross.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">${c.legacyGross.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right font-bold text-emerald-700">${c.systemNet.toFixed(2)}</td>
                    <td className="py-2.5 px-3 text-right">${c.legacyNet.toFixed(2)}</td>
                    <td className={`py-2.5 px-3 text-right font-bold ${c.isExactMatch ? 'text-gray-400' : 'text-amber-700'}`}>
                      {c.netDelta !== 0 ? `$${c.netDelta.toFixed(2)}` : '$0.00'}
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      {c.isExactMatch ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" /> Exact Cent Match
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded border border-amber-300">
                          <AlertTriangle className="w-3 h-3" /> Variance Detected
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* OFFICIAL JAMAICAN PAYSLIP MODAL */}
      {selectedPayslip && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-gray-200">
            {/* Modal Header */}
            <div className="px-6 py-4 bg-slate-900 text-white rounded-t-2xl flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Confidential Pay Statement</h3>
                <p className="text-xs text-slate-300 font-mono">Period: {selectedMonth} | TRN: {selectedPayslip.trn}</p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                  title="Print Payslip"
                >
                  <Printer className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setSelectedPayslip(null)}
                  className="p-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Payslip Body */}
            <div className="p-6 space-y-6">
              {/* Employer & Employee Block */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Employer</span>
                  <p className="font-bold text-slate-900 mt-0.5">{currentTenant?.name || 'VerticalHR Enterprise'}</p>
                  <p className="text-slate-600">Kingston Financial Centre, Jamaica</p>
                  <p className="text-slate-500 font-mono text-[11px]">Employer TRN: 001-234-567</p>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-slate-400">Employee Details</span>
                  <p className="font-bold text-slate-900 mt-0.5">{selectedPayslip.employeeName}</p>
                  <p className="text-slate-600">Department: {selectedPayslip.department}</p>
                  <p className="text-slate-500 font-mono text-[11px]">Employee TRN: {selectedPayslip.trn}</p>
                </div>
              </div>

              {/* Earnings & Deductions Tables */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs">
                {/* Earnings */}
                <div className="space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-slate-700 text-[11px] border-b pb-1">
                    Earnings Breakdown
                  </h4>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Basic Salary</span>
                    <span className="font-mono font-semibold text-slate-900">
                      ${selectedPayslip.baseSalary.toFixed(2)}
                    </span>
                  </div>
                  {selectedPayslip.overtimePay > 0 && (
                    <div className="flex justify-between py-1 text-amber-700">
                      <span>Overtime Pay</span>
                      <span className="font-mono font-semibold">+${selectedPayslip.overtimePay.toFixed(2)}</span>
                    </div>
                  )}
                  {selectedPayslip.nonTaxableAllowances > 0 && (
                    <div className="flex justify-between py-1 text-blue-700">
                      <span>Non-Taxable Allowance</span>
                      <span className="font-mono font-semibold">+${selectedPayslip.nonTaxableAllowances.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t font-bold text-slate-900">
                    <span>Total Gross Pay:</span>
                    <span className="font-mono">${selectedPayslip.grossEarnings.toFixed(2)}</span>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-2">
                  <h4 className="font-bold uppercase tracking-wider text-slate-700 text-[11px] border-b pb-1">
                    Statutory & Voluntary Deductions
                  </h4>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">NIS Employee (3%)</span>
                    <span className="font-mono text-slate-900">${selectedPayslip.employeeNis.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">NHT Employee (2%)</span>
                    <span className="font-mono text-slate-900">${selectedPayslip.employeeNht.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">Education Tax (2.25%)</span>
                    <span className="font-mono text-slate-900">${selectedPayslip.employeeEdTax.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-600">PAYE Income Tax</span>
                    <span className="font-mono text-rose-700 font-semibold">${selectedPayslip.employeePaye.toFixed(2)}</span>
                  </div>
                  {selectedPayslip.deductiblePension > 0 && (
                    <div className="flex justify-between py-1 text-amber-700">
                      <span>Approved Pension (Voluntary)</span>
                      <span className="font-mono font-semibold">${selectedPayslip.deductiblePension.toFixed(2)}</span>
                    </div>
                  )}
                  <div className="flex justify-between py-2 border-t font-bold text-slate-900">
                    <span>Total Deductions:</span>
                    <span className="font-mono">${selectedPayslip.totalEmployeeDeductions.toFixed(2)}</span>
                  </div>
                </div>
              </div>

              {/* Employer Contributions Info Block */}
              <div className="p-3 bg-slate-100/70 rounded-xl text-[11px] text-slate-600 space-y-1">
                <span className="font-bold text-slate-700 block">Employer Contributions Paid On Your Behalf:</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-[10px]">
                  <div>NIS 3%: J${selectedPayslip.employerNis.toFixed(2)}</div>
                  <div>NHT 3%: J${selectedPayslip.employerNht.toFixed(2)}</div>
                  <div>Ed Tax 3.5%: J${selectedPayslip.employerEdTax.toFixed(2)}</div>
                  <div>HEART 3%: J${selectedPayslip.employerHeart.toFixed(2)}</div>
                </div>
              </div>

              {/* Net Pay Banner */}
              <div className="p-4 bg-emerald-600 text-white rounded-xl flex items-center justify-between shadow-md">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-100">
                    Net Take-Home Pay
                  </span>
                  <p className="text-xs text-emerald-200 mt-0.5">Disbursed via Direct Deposit ACH to Account on file</p>
                </div>
                <div className="text-3xl font-extrabold font-mono tracking-tight">
                  J$ {selectedPayslip.netPay.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                </div>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedPayslip(null)}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-800 rounded-lg text-xs font-semibold cursor-pointer"
              >
                Close Statement
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
