import React, { useState } from 'react';
import { 
  TrendingUp, 
  Plus, 
  ArrowRight, 
  Calendar, 
  Award,
  X,
  Building
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { CareerMovement } from '../../types';

export const CareerMovements: React.FC = () => {
  const { careerMovements, employees, departments, addCareerMovement } = useData();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [formState, setFormState] = useState({
    employeeId: employees[0]?.id || '1',
    movementType: 'promotion' as CareerMovement['movementType'],
    toTitle: 'Senior Specialist',
    toDepartment: departments[0]?.name || 'Human Resources',
    toLevel: 2,
    effectiveDate: new Date().toISOString().split('T')[0],
    reason: '',
    previousSalary: 85000,
    newSalary: 98000,
  });

  const canManageMovements = user?.role === 'admin' || user?.role === 'hr_manager';

  const handleOpenAdd = () => {
    const selectedEmp = employees[0];
    setFormState({
      employeeId: selectedEmp?.id || '1',
      movementType: 'promotion',
      toTitle: `${selectedEmp?.jobInfo.jobTitle || 'Role'} (Senior)`,
      toDepartment: selectedEmp?.jobInfo.department || 'Engineering',
      toLevel: 2,
      effectiveDate: new Date().toISOString().split('T')[0],
      reason: 'Recognized for consistent high output and team leadership.',
      previousSalary: selectedEmp?.jobInfo.salary || 80000,
      newSalary: Math.round((selectedEmp?.jobInfo.salary || 80000) * 1.15),
    });
    setShowModal(true);
  };

  const handleEmployeeSelect = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    if (emp) {
      setFormState(prev => ({
        ...prev,
        employeeId: empId,
        toDepartment: emp.jobInfo.department,
        previousSalary: emp.jobInfo.salary,
        newSalary: Math.round(emp.jobInfo.salary * 1.15),
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const emp = employees.find(e => e.id === formState.employeeId);
    if (!emp) return;

    const changePercentage = formState.previousSalary > 0 
      ? Number((((formState.newSalary - formState.previousSalary) / formState.previousSalary) * 100).toFixed(1))
      : 0;

    addCareerMovement({
      employeeId: formState.employeeId,
      movementType: formState.movementType,
      fromPosition: {
        title: emp.jobInfo.jobTitle,
        department: emp.jobInfo.department,
        level: 1
      },
      toPosition: {
        title: formState.toTitle,
        department: formState.toDepartment,
        level: formState.toLevel
      },
      effectiveDate: formState.effectiveDate,
      reason: formState.reason,
      approvedBy: `${user?.firstName || 'HR'} ${user?.lastName || 'Manager'}`,
      salaryChange: {
        previousSalary: formState.previousSalary,
        newSalary: formState.newSalary,
        changePercentage
      }
    });

    setShowModal(false);
  };

  const getEmployee = (empId: string) => employees.find(e => e.id === empId);

  // Stats
  const promotionCount = careerMovements.filter(m => m.movementType === 'promotion').length;
  const transferCount = careerMovements.filter(m => m.movementType === 'transfer').length;
  const avgUplift = careerMovements.length > 0
    ? (careerMovements.reduce((sum, m) => sum + (m.salaryChange?.changePercentage || 0), 0) / careerMovements.length).toFixed(1)
    : '0.0';

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Career Movements & Promotions</h1>
          <p className="text-gray-600 text-sm mt-1">Track title elevations, departmental transfers, and organizational compensation progression</p>
        </div>
        {canManageMovements && (
          <button
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Record Career Movement
          </button>
        )}
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Total Promotions</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{promotionCount}</p>
          <span className="text-xs text-gray-500 mt-1 block">Internal talent career advancements</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Lateral / Department Transfers</span>
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
              <Building className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900 mt-2">{transferCount}</p>
          <span className="text-xs text-gray-500 mt-1 block">Cross-functional team reallocations</span>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Average Salary Uplift</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl font-bold text-purple-600 mt-2">+{avgUplift}%</p>
          <span className="text-xs text-gray-500 mt-1 block">Comp change per advancement</span>
        </div>
      </div>

      {/* Timeline List */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6">
        <h2 className="text-base font-bold text-gray-900 mb-6">Historical Career Trajectory Log</h2>

        <div className="space-y-6">
          {careerMovements.map((movement) => {
            const emp = getEmployee(movement.employeeId);
            return (
              <div key={movement.id} className="relative pl-6 pb-6 border-l-2 border-blue-500 last:pb-0">
                <div className="absolute -left-2 top-0 w-4 h-4 rounded-full bg-blue-600 border-4 border-white shadow-xs"></div>

                <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                    <div>
                      <span className="text-xs font-semibold uppercase tracking-wider text-blue-600">
                        {movement.movementType.replace('_', ' ')}
                      </span>
                      <h3 className="text-base font-bold text-gray-900 mt-0.5">
                        {emp ? `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : `Employee #${movement.employeeId}`}
                      </h3>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <Calendar className="w-3.5 h-3.5" />
                      <span>Effective: {new Date(movement.effectiveDate).toLocaleDateString()}</span>
                    </div>
                  </div>

                  {/* Transition Box */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 my-4 p-4 bg-white rounded-lg border border-gray-200">
                    <div className="space-y-1">
                      <span className="text-[11px] font-semibold text-gray-400 uppercase">Previous Position</span>
                      <p className="text-sm font-bold text-gray-900">{movement.fromPosition.title}</p>
                      <p className="text-xs text-gray-500">{movement.fromPosition.department}</p>
                      {movement.salaryChange && (
                        <p className="text-xs font-medium text-gray-600 pt-1">
                          Base: ${movement.salaryChange.previousSalary.toLocaleString()}
                        </p>
                      )}
                    </div>

                    <div className="space-y-1 border-t md:border-t-0 md:border-l md:pl-4 pt-3 md:pt-0 border-gray-100">
                      <span className="text-[11px] font-semibold text-emerald-600 uppercase">New Position</span>
                      <p className="text-sm font-bold text-gray-900 flex items-center gap-1.5">
                        {movement.toPosition.title}
                        <ArrowRight className="w-3.5 h-3.5 text-emerald-600" />
                      </p>
                      <p className="text-xs text-gray-500">{movement.toPosition.department}</p>
                      {movement.salaryChange && (
                        <p className="text-xs font-bold text-emerald-700 pt-1 flex items-center gap-1">
                          <span>Base: ${movement.salaryChange.newSalary.toLocaleString()}</span>
                          <span className="text-[10px] bg-emerald-50 px-1.5 py-0.2 rounded">
                            (+{movement.salaryChange.changePercentage}%)
                          </span>
                        </p>
                      )}
                    </div>
                  </div>

                  {movement.reason && (
                    <p className="text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">Justification:</span> {movement.reason}
                    </p>
                  )}

                  <div className="text-[11px] text-gray-400 mt-3 pt-2 border-t border-gray-200 flex justify-between">
                    <span>Approved by: {movement.approvedBy}</span>
                    <span>Logged: {new Date(movement.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
            );
          })}

          {careerMovements.length === 0 && (
            <div className="text-center py-12 text-sm text-gray-500">
              No promotions or career adjustments recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Record Career Movement</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Select Employee</label>
                <select
                  value={formState.employeeId}
                  onChange={(e) => handleEmployeeSelect(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.personalInfo.firstName} {e.personalInfo.lastName} — Current: {e.jobInfo.jobTitle} (${e.jobInfo.salary.toLocaleString()})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Movement Type</label>
                  <select
                    value={formState.movementType}
                    onChange={(e) => setFormState({ ...formState, movementType: e.target.value as CareerMovement['movementType'] })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="promotion">Promotion</option>
                    <option value="transfer">Department Transfer</option>
                    <option value="lateral_move">Lateral Move</option>
                    <option value="demotion">Demotion</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Effective Date</label>
                  <input
                    type="date"
                    required
                    value={formState.effectiveDate}
                    onChange={(e) => setFormState({ ...formState, effectiveDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Job Title</label>
                  <input
                    type="text"
                    required
                    value={formState.toTitle}
                    onChange={(e) => setFormState({ ...formState, toTitle: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Department</label>
                  <select
                    value={formState.toDepartment}
                    onChange={(e) => setFormState({ ...formState, toDepartment: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Previous Salary ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.previousSalary}
                    onChange={(e) => setFormState({ ...formState, previousSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">New Salary ($)</label>
                  <input
                    type="number"
                    min="0"
                    value={formState.newSalary}
                    onChange={(e) => setFormState({ ...formState, newSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Promotion / Transfer Justification</label>
                <textarea
                  rows={3}
                  required
                  placeholder="State the achievements, organizational justification, or business need..."
                  value={formState.reason}
                  onChange={(e) => setFormState({ ...formState, reason: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  Confirm Movement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
