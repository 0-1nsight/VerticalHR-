import React, { useState } from 'react';
import { 
  BarChart3, 
  Search, 
  Filter, 
  Calendar, 
  Edit3, 
  CheckCircle2, 
  AlertCircle,
  X
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { LeaveBalance } from '../../types';

export const LeaveBalances: React.FC = () => {
  const { employees, leaveTypes, leaveBalances, updateLeaveBalance, departments } = useData();
  const { user } = useAuth();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('all');
  const [selectedLeaveType, setSelectedLeaveType] = useState('all');
  const [editingBalance, setEditingBalance] = useState<LeaveBalance | null>(null);
  const [adjustmentForm, setAdjustmentForm] = useState({
    allocated: 0,
    carriedForward: 0,
    used: 0,
    note: ''
  });

  const canManageBalances = user?.role === 'admin' || user?.role === 'hr_manager' || user?.role === 'super_admin' || user?.role === 'hr_admin';

  const isEmployee = user?.role === 'employee';
  const currentEmp = employees.find(
    e => e.email === user?.email || e.id === user?.employeeId || e.employeeId === user?.employeeId
  ) || employees[0];
  const currentEmpId = currentEmp?.id || '1';
  const currentEmpCode = currentEmp?.employeeId || 'EMP001';

  // Strict Row-Level Security: Employee only sees their own leave balances
  const scopedBalances = isEmployee
    ? leaveBalances.filter(b => b.employeeId === currentEmpId || b.employeeId === currentEmpCode)
    : leaveBalances;

  // Join balances with employee and leave type details
  const enrichedBalances = scopedBalances.map(balance => {
    const emp = employees.find(e => e.id === balance.employeeId || e.employeeId === balance.employeeId);
    const lt = leaveTypes.find(t => t.id === balance.leaveTypeId);
    return {
      ...balance,
      employeeName: emp ? `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : `Employee #${balance.employeeId}`,
      employeeDepartment: emp?.jobInfo.department || 'Unknown',
      leaveTypeName: lt?.name || 'Standard Leave',
    };
  });

  const filteredBalances = enrichedBalances.filter(item => {
    const matchesSearch = item.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDept = selectedDepartment === 'all' || item.employeeDepartment === selectedDepartment;
    const matchesType = selectedLeaveType === 'all' || item.leaveTypeId === selectedLeaveType;
    return matchesSearch && matchesDept && matchesType;
  });

  const handleOpenAdjust = (balance: LeaveBalance) => {
    setEditingBalance(balance);
    setAdjustmentForm({
      allocated: balance.allocated,
      carriedForward: balance.carriedForward,
      used: balance.used,
      note: ''
    });
  };

  const handleSaveAdjustment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingBalance) return;

    const newAvailable = Math.max(0, adjustmentForm.allocated + adjustmentForm.carriedForward - adjustmentForm.used - editingBalance.pending);
    updateLeaveBalance(editingBalance.employeeId, editingBalance.leaveTypeId, {
      allocated: Number(adjustmentForm.allocated),
      carriedForward: Number(adjustmentForm.carriedForward),
      used: Number(adjustmentForm.used),
      available: newAvailable
    });

    setEditingBalance(null);
  };

  // Metrics
  const totalAllocated = leaveBalances.reduce((sum, b) => sum + b.allocated, 0);
  const totalUsed = leaveBalances.reduce((sum, b) => sum + b.used, 0);
  const totalAvailable = leaveBalances.reduce((sum, b) => sum + b.available, 0);
  const totalPending = leaveBalances.reduce((sum, b) => sum + b.pending, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Balances & Entitlements</h1>
          <p className="text-gray-600 text-sm mt-1">Monitor personnel leave accruals, utilization, and carry-overs</p>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Allocated Days</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Calendar className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalAllocated} <span className="text-xs font-normal text-gray-500">days</span></p>
          <span className="text-xs text-gray-500 mt-1 block">Annual organizational pool</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Consumed</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-emerald-600 mt-2">{totalUsed} <span className="text-xs font-normal text-gray-500">days</span></p>
          <span className="text-xs text-gray-500 mt-1 block">Approved and taken</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Pending In-Review</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-amber-600 mt-2">{totalPending} <span className="text-xs font-normal text-gray-500">days</span></p>
          <span className="text-xs text-gray-500 mt-1 block">Awaiting supervisor or HR review</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">Total Available</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <BarChart3 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{totalAvailable} <span className="text-xs font-normal text-gray-500">days</span></p>
          <span className="text-xs text-gray-500 mt-1 block">Remaining available balance</span>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600 min-w-max">
            <Filter className="w-4 h-4 text-gray-400" />
            <span>Filter:</span>
          </div>
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Departments</option>
            {departments.map(d => (
              <option key={d.id} value={d.name}>{d.name}</option>
            ))}
          </select>

          <select
            value={selectedLeaveType}
            onChange={(e) => setSelectedLeaveType(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Leave Types</option>
            {leaveTypes.map(t => (
              <option key={t.id} value={t.id}>{t.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Leave Category</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Allocated</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Used</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Pending</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Available</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Carry Over</th>
                {canManageBalances && (
                  <th className="px-6 py-3.5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">Actions</th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredBalances.map((item, idx) => (
                <tr key={`${item.employeeId}-${item.leaveTypeId}-${idx}`} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.employeeName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {item.employeeDepartment}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-800 font-medium">
                    {item.leaveTypeName}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-700 font-medium">
                    {item.allocated}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                    {item.used}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-amber-600 font-medium">
                    {item.pending > 0 ? item.pending : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className="font-semibold text-emerald-700">
                      {item.available}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                    {item.carriedForward}
                  </td>
                  {canManageBalances && (
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <button
                        onClick={() => handleOpenAdjust(item)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        Adjust
                      </button>
                    </td>
                  )}
                </tr>
              ))}
              {filteredBalances.length === 0 && (
                <tr>
                  <td colSpan={9} className="px-6 py-12 text-center text-sm text-gray-500">
                    No leave balance records matched your criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Adjust Balance Modal */}
      {editingBalance && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Adjust Leave Balance</h3>
              <button onClick={() => setEditingBalance(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveAdjustment} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Annual Allocation (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={adjustmentForm.allocated}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, allocated: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Carried Forward (Days)</label>
                <input
                  type="number"
                  min="0"
                  max="50"
                  value={adjustmentForm.carriedForward}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, carriedForward: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Days Used To Date</label>
                <input
                  type="number"
                  min="0"
                  max="100"
                  value={adjustmentForm.used}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, used: Number(e.target.value) })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Adjustment Reason / Audit Note</label>
                <input
                  type="text"
                  placeholder="e.g., Year-end reconciliation or compensatory award"
                  value={adjustmentForm.note}
                  onChange={(e) => setAdjustmentForm({ ...adjustmentForm, note: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setEditingBalance(null)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  Save Adjustments
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
