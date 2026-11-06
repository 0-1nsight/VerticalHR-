import React, { useState } from 'react';
import { Plus, Edit, Trash2, X } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { LeaveType } from '../../types';

export const LeaveTypesManager: React.FC = () => {
  const { leaveTypes, addLeaveType, updateLeaveType, deleteLeaveType } = useData();
  const [showModal, setShowModal] = useState(false);
  const [editingType, setEditingType] = useState<LeaveType | null>(null);

  const [formState, setFormState] = useState({
    name: '',
    allowance: 20,
    carryOver: false,
    carryOverLimit: 5,
    accrualRate: 1.67,
    description: '',
    requiresApproval: true,
    maxConsecutiveDays: 10,
  });

  const handleOpenAdd = () => {
    setEditingType(null);
    setFormState({
      name: '',
      allowance: 20,
      carryOver: false,
      carryOverLimit: 5,
      accrualRate: 1.67,
      description: '',
      requiresApproval: true,
      maxConsecutiveDays: 10,
    });
    setShowModal(true);
  };

  const handleOpenEdit = (type: LeaveType) => {
    setEditingType(type);
    setFormState({
      name: type.name,
      allowance: type.allowance,
      carryOver: type.carryOver,
      carryOverLimit: type.carryOverLimit || 0,
      accrualRate: type.accrualRate,
      description: type.description,
      requiresApproval: type.requiresApproval,
      maxConsecutiveDays: type.maxConsecutiveDays || 10,
    });
    setShowModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingType) {
      updateLeaveType(editingType.id, {
        name: formState.name,
        allowance: Number(formState.allowance),
        carryOver: formState.carryOver,
        carryOverLimit: Number(formState.carryOverLimit),
        accrualRate: Number(formState.accrualRate),
        description: formState.description,
        requiresApproval: formState.requiresApproval,
        maxConsecutiveDays: Number(formState.maxConsecutiveDays),
      });
    } else {
      addLeaveType({
        name: formState.name,
        allowance: Number(formState.allowance),
        carryOver: formState.carryOver,
        carryOverLimit: Number(formState.carryOverLimit),
        accrualRate: Number(formState.accrualRate),
        description: formState.description,
        requiresApproval: formState.requiresApproval,
        maxConsecutiveDays: Number(formState.maxConsecutiveDays),
      });
    }
    setShowModal(false);
  };

  const handleDelete = (id: string) => {
    deleteLeaveType(id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Categories & Policies</h1>
          <p className="text-gray-600 text-sm mt-1">Configure organizational absence types, accrual rules, and carry-over limits</p>
        </div>
        <button
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Add Leave Type
        </button>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {leaveTypes.map((type) => (
          <div key={type.id} className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 flex flex-col justify-between hover:border-blue-200 transition-colors">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{type.name}</h3>
                  <p className="text-xs text-gray-500 mt-1">{type.description || 'Standard corporate leave policy'}</p>
                </div>
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center font-bold text-base">
                  {type.allowance}d
                </div>
              </div>

              <div className="mt-6 space-y-2.5 text-xs border-t border-gray-100 pt-4 text-gray-600">
                <div className="flex justify-between">
                  <span className="text-gray-500">Yearly Allowance:</span>
                  <span className="font-semibold text-gray-900">{type.allowance} Days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Monthly Accrual:</span>
                  <span className="font-medium text-gray-800">{type.accrualRate} days / mo</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Carry Over:</span>
                  <span className="font-medium text-gray-800">
                    {type.carryOver ? `Yes (Max ${type.carryOverLimit || 0} days)` : 'No (Use or lose)'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Max Consecutive:</span>
                  <span className="font-medium text-gray-800">{type.maxConsecutiveDays || 'Uncapped'} days</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Approval Required:</span>
                  <span className="font-medium text-gray-800">{type.requiresApproval ? 'Yes (Manager + HR)' : 'Auto-approved'}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
              <button
                onClick={() => handleOpenEdit(type)}
                className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                title="Edit Policy"
              >
                <Edit className="w-4 h-4" />
              </button>
              <button
                onClick={() => handleDelete(type.id)}
                className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                title="Delete Policy"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">
                {editingType ? 'Edit Leave Policy' : 'Create New Leave Policy'}
              </h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Leave Type Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Parental Leave, Study Leave"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Brief summary of policy eligibility..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Annual Allowance (Days)</label>
                  <input
                    type="number"
                    min="0"
                    max="365"
                    value={formState.allowance}
                    onChange={(e) => setFormState({ ...formState, allowance: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Monthly Accrual Rate</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formState.accrualRate}
                    onChange={(e) => setFormState({ ...formState, accrualRate: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Consecutive Days</label>
                  <input
                    type="number"
                    min="1"
                    value={formState.maxConsecutiveDays}
                    onChange={(e) => setFormState({ ...formState, maxConsecutiveDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Carry Over Cap</label>
                  <input
                    type="number"
                    min="0"
                    disabled={!formState.carryOver}
                    value={formState.carryOverLimit}
                    onChange={(e) => setFormState({ ...formState, carryOverLimit: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100"
                  />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.carryOver}
                    onChange={(e) => setFormState({ ...formState, carryOver: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Allow unused days to carry over to next year</span>
                </label>

                <label className="flex items-center space-x-2 text-sm text-gray-700 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formState.requiresApproval}
                    onChange={(e) => setFormState({ ...formState, requiresApproval: e.target.checked })}
                    className="rounded text-blue-600 focus:ring-blue-500"
                  />
                  <span>Require supervisor / HR approval before taking leave</span>
                </label>
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
                  {editingType ? 'Save Changes' : 'Create Leave Type'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
