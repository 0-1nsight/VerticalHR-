import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Plus, 
  Calendar, 
  User, 
  X, 
  Edit2, 
  Trash2,
  GitFork
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { GoalRecord } from '../../types';
import { calculateWeightedOkrProgress } from '../../services/talentEngine';

export const GoalsAndOKRs: React.FC = () => {
  const { goals, employees, departments, addGoal, updateGoal, deleteGoal } = useData();
  const { user } = useAuth();

  const currentEmp = employees.find(
    e => e.email === user?.email || e.employeeId === user?.employeeId || e.id === user?.employeeId
  ) || (user?.role === 'employee' ? employees[0] : undefined);

  const [activeCategory, setActiveCategory] = useState<'all' | 'company' | 'department' | 'individual'>('all');
  const [showModal, setShowModal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalRecord | null>(null);

  const [formState, setFormState] = useState({
    title: '',
    description: '',
    category: 'individual' as GoalRecord['category'],
    department: departments[0]?.name || 'Engineering',
    employeeId: currentEmp?.id || employees[0]?.id || '1',
    targetDate: '2026-12-31',
    progress: 0,
    status: 'in_progress' as GoalRecord['status'],
    measurableOutcomesStr: 'Outcome 1, Outcome 2'
  });

  const filteredGoals = goals.filter(g => {
    // Row Level Security: Employee only sees their own individual goals (+ company/department wide goals)
    if (user?.role === 'employee') {
      if (g.category === 'individual') {
        const isMine = (currentEmp && (g.employeeId === currentEmp.id || g.employeeId === currentEmp.employeeId)) ||
          (user?.employeeId && g.employeeId === user.employeeId);
        if (!isMine) return false;
      }
    }
    if (activeCategory === 'all') return true;
    return g.category === activeCategory;
  });

  const handleOpenAdd = () => {
    setEditingGoal(null);
    setFormState({
      title: '',
      description: '',
      category: 'individual',
      department: departments[0]?.name || 'Engineering',
      employeeId: employees[0]?.id || '1',
      targetDate: '2026-12-31',
      progress: 0,
      status: 'in_progress',
      measurableOutcomesStr: ''
    });
    setShowModal(true);
  };

  const handleOpenEdit = (goal: GoalRecord) => {
    setEditingGoal(goal);
    setFormState({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      department: goal.department || departments[0]?.name || '',
      employeeId: goal.employeeId || employees[0]?.id || '',
      targetDate: goal.targetDate,
      progress: goal.progress,
      status: goal.status,
      measurableOutcomesStr: goal.measurableOutcomes.join('\n')
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const outcomes = formState.measurableOutcomesStr
      .split('\n')
      .map(s => s.trim())
      .filter(Boolean);

    if (editingGoal) {
      updateGoal(editingGoal.id, {
        title: formState.title,
        description: formState.description,
        category: formState.category,
        department: formState.category === 'department' ? formState.department : undefined,
        employeeId: formState.category === 'individual' ? formState.employeeId : undefined,
        targetDate: formState.targetDate,
        progress: Number(formState.progress),
        status: formState.progress >= 100 ? 'completed' : formState.status,
        measurableOutcomes: outcomes.length ? outcomes : ['Achieve target KPI benchmarks']
      });
    } else {
      addGoal({
        title: formState.title,
        description: formState.description,
        category: formState.category,
        department: formState.category === 'department' ? formState.department : undefined,
        employeeId: formState.category === 'individual' ? formState.employeeId : undefined,
        targetDate: formState.targetDate,
        progress: Number(formState.progress),
        status: formState.progress >= 100 ? 'completed' : formState.status,
        measurableOutcomes: outcomes.length ? outcomes : ['Achieve target KPI benchmarks']
      });
    }
    setShowModal(false);
  };

  const handleQuickProgress = (goalId: string, newProgress: number) => {
    updateGoal(goalId, {
      progress: newProgress,
      status: newProgress >= 100 ? 'completed' : newProgress > 0 ? 'in_progress' : 'not_started'
    });
  };

  const getOwnerLabel = (goal: GoalRecord) => {
    if (goal.category === 'company') return 'Entire Organization';
    if (goal.category === 'department') return `Dept: ${goal.department || 'All'}`;
    const emp = employees.find(e => e.id === goal.employeeId);
    return emp ? `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : 'Unassigned';
  };

  const okrItems = filteredGoals.map((g) => ({
    id: g.id,
    tenantId: 'tenant-001',
    level: g.category as 'company' | 'department' | 'individual',
    title: g.title,
    metricTarget: 100,
    metricCurrent: g.progress,
    weightPercentage: filteredGoals.length > 0 ? Math.round((100 / filteredGoals.length) * 10) / 10 : 0,
    status: g.status,
  }));
  const okrRollup = calculateWeightedOkrProgress(okrItems);

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Goals & Objectives (OKRs)</h1>
          <p className="text-gray-600 text-sm mt-1">Cascade company vision down to department milestones and individual contributor targets</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Create Objective
        </button>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {[
          { id: 'all', label: 'All Objectives' },
          { id: 'company', label: 'Company-Wide' },
          { id: 'department', label: 'Departmental' },
          { id: 'individual', label: 'Individual Contributor' },
        ].map(cat => (
          <button
            key={cat.id}
            onClick={() => setActiveCategory(cat.id as typeof activeCategory)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Cascading Alignment & Weighted Rollup Summary */}
      <div className="p-4 bg-white rounded-xl border border-gray-200 shadow-2xs flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
            <GitFork className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider">Cascading Alignment & Mathematical Weighting</h3>
            <p className="text-xs text-gray-500">Corporate Vision &rarr; Department Milestones &rarr; Contributor Key Results</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Total Objective Weight:</span>
            <span className={`font-mono font-bold px-2 py-0.5 rounded ${okrRollup.isValidWeighting ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-amber-50 text-amber-700 border border-amber-200'}`}>
              {okrRollup.totalWeight}% {okrRollup.isValidWeighting ? '(100% Balanced)' : '(Rebalancing Recommended)'}
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="text-gray-500">Weighted Progress:</span>
            <span className="font-mono font-bold text-blue-700 bg-blue-50 border border-blue-200 px-2 py-0.5 rounded">
              {okrRollup.overallWeightedProgress}% Achieved
            </span>
          </div>
        </div>
      </div>

      {/* Objectives Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredGoals.map((goal) => {
          const isDone = goal.progress >= 100 || goal.status === 'completed';
          return (
            <div key={goal.id} className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 flex flex-col justify-between hover:border-blue-200 transition-colors">
              <div>
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-xs uppercase tracking-wider font-semibold text-blue-600">
                      {goal.category} OKR
                    </span>
                    <h3 className="text-base font-bold text-gray-900 mt-1">{goal.title}</h3>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${
                    isDone ? 'bg-emerald-50 text-emerald-700' :
                    goal.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                    goal.status === 'overdue' ? 'bg-red-50 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {isDone ? 'completed' : goal.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-xs text-gray-600 mt-2 leading-relaxed">{goal.description}</p>

                <div className="flex items-center gap-4 text-xs text-gray-500 mt-3 pt-3 border-t border-gray-100">
                  <div className="flex items-center gap-1.5">
                    <User className="w-3.5 h-3.5 text-gray-400" />
                    <span>{getOwnerLabel(goal)}</span>
                  </div>
                  <span>·</span>
                  <div className="flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Target: {goal.targetDate}</span>
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-4">
                  <div className="flex justify-between text-xs font-medium text-gray-700 mb-1">
                    <span>Progress</span>
                    <span className="font-bold text-blue-600">{goal.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-100 h-2 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all duration-300 ${
                        isDone ? 'bg-emerald-500' : 'bg-blue-600'
                      }`}
                      style={{ width: `${Math.min(100, goal.progress)}%` }}
                    ></div>
                  </div>
                  {/* Quick slider adjustment */}
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-[10px] text-gray-400">Update:</span>
                    {[25, 50, 75, 100].map(val => (
                      <button
                        key={val}
                        onClick={() => handleQuickProgress(goal.id, val)}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition-colors ${
                          goal.progress === val
                            ? 'bg-blue-50 border-blue-400 text-blue-700 font-bold'
                            : 'bg-white border-gray-200 text-gray-500 hover:border-gray-300'
                        }`}
                      >
                        {val}%
                      </button>
                    ))}
                  </div>
                </div>

                {/* Measurable Key Results */}
                {goal.measurableOutcomes.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-gray-100">
                    <span className="text-xs font-semibold text-gray-700 block mb-2">Key Results:</span>
                    <ul className="space-y-1.5">
                      {goal.measurableOutcomes.map((outcome, idx) => (
                        <li key={idx} className="flex items-start text-xs text-gray-600">
                          <CheckCircle2 className={`w-3.5 h-3.5 mr-2 shrink-0 mt-0.5 ${isDone ? 'text-emerald-500' : 'text-gray-300'}`} />
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  onClick={() => handleOpenEdit(goal)}
                  className="p-1.5 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50"
                  title="Edit Goal"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => deleteGoal(goal.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                  title="Delete Goal"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {editingGoal ? 'Edit Objective & Key Result' : 'Create New OKR'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Objective Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Expand automated testing coverage to 85%"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Scope / Category</label>
                  <select
                    value={formState.category}
                    onChange={(e) => setFormState({ ...formState, category: e.target.value as GoalRecord['category'] })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="company">Company-Wide</option>
                    <option value="department">Department</option>
                    <option value="individual">Individual Contributor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Target Due Date</label>
                  <input
                    type="date"
                    required
                    value={formState.targetDate}
                    onChange={(e) => setFormState({ ...formState, targetDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              {formState.category === 'department' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={formState.department}
                    onChange={(e) => setFormState({ ...formState, department: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {formState.category === 'individual' && (
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Assigned Employee</label>
                  <select
                    value={formState.employeeId}
                    onChange={(e) => setFormState({ ...formState, employeeId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.personalInfo.firstName} {e.personalInfo.lastName} ({e.jobInfo.department})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description & Strategic Context</label>
                <textarea
                  rows={2}
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Measurable Key Results (one per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="Increase test pass rate to 99%&#10;Conduct training for 15 engineers"
                  value={formState.measurableOutcomesStr}
                  onChange={(e) => setFormState({ ...formState, measurableOutcomesStr: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Current Progress (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={formState.progress}
                    onChange={(e) => setFormState({ ...formState, progress: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={formState.status}
                    onChange={(e) => setFormState({ ...formState, status: e.target.value as GoalRecord['status'] })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="overdue">Overdue</option>
                  </select>
                </div>
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
                  {editingGoal ? 'Save Objective' : 'Create Objective'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
