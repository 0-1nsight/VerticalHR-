import React, { useState } from 'react';
import { Plus, CreditCard as Edit, Trash2, Users, Building, ChevronRight, ChevronDown } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Department } from '../../types';

export const OrganizationalStructure: React.FC = () => {
  const { 
    departments, 
    employees, 
    addDepartment, 
    updateDepartment 
  } = useData();
  const { user } = useAuth();
  const [showNewDepartmentForm, setShowNewDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [expandedDepartments, setExpandedDepartments] = useState<Set<string>>(new Set());

  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    managerId: '',
    maxLeavePerDay: 3,
    parentDepartmentId: '',
  });

  const canManageStructure = user?.role === 'admin' || user?.role === 'hr_manager';

  const handleSubmitNewDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    
    addDepartment({
      ...newDepartment,
      employeeCount: 0,
    });

    setNewDepartment({
      name: '',
      description: '',
      managerId: '',
      maxLeavePerDay: 3,
      parentDepartmentId: '',
    });
    setShowNewDepartmentForm(false);
  };

  const handleEditDepartment = (department: Department) => {
    setEditingDepartment(department);
    setNewDepartment({
      name: department.name,
      description: department.description,
      managerId: department.managerId || '',
      maxLeavePerDay: department.maxLeavePerDay,
      parentDepartmentId: department.parentDepartmentId || '',
    });
    setShowNewDepartmentForm(true);
  };

  const handleUpdateDepartment = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingDepartment) {
      updateDepartment(editingDepartment.id, newDepartment);
      setEditingDepartment(null);
    }

    setNewDepartment({
      name: '',
      description: '',
      managerId: '',
      maxLeavePerDay: 3,
      parentDepartmentId: '',
    });
    setShowNewDepartmentForm(false);
  };

  const toggleDepartmentExpansion = (departmentId: string) => {
    const newExpanded = new Set(expandedDepartments);
    if (newExpanded.has(departmentId)) {
      newExpanded.delete(departmentId);
    } else {
      newExpanded.add(departmentId);
    }
    setExpandedDepartments(newExpanded);
  };

  const getDepartmentEmployees = (departmentName: string) => {
    return employees.filter(emp => emp.jobInfo.department === departmentName);
  };

  const getManagerName = (managerId: string) => {
    const manager = employees.find(emp => emp.id === managerId);
    return manager ? `${manager.personalInfo.firstName} ${manager.personalInfo.lastName}` : 'Not assigned';
  };

  const getSubDepartments = (parentId: string) => {
    return departments.filter(dept => dept.parentDepartmentId === parentId);
  };

  const getRootDepartments = () => {
    return departments.filter(dept => !dept.parentDepartmentId);
  };

  const renderDepartmentTree = (department: Department, level = 0) => {
    const isExpanded = expandedDepartments.has(department.id);
    const subDepartments = getSubDepartments(department.id);
    const departmentEmployees = getDepartmentEmployees(department.name);
    const hasSubDepartments = subDepartments.length > 0;

    return (
      <div key={department.id} className={`${level > 0 ? 'ml-6 border-l border-gray-200 pl-4' : ''}`}>
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {hasSubDepartments && (
                <button
                  onClick={() => toggleDepartmentExpansion(department.id)}
                  className="p-1 hover:bg-gray-100 rounded"
                >
                  {isExpanded ? (
                    <ChevronDown className="w-4 h-4 text-gray-500" />
                  ) : (
                    <ChevronRight className="w-4 h-4 text-gray-500" />
                  )}
                </button>
              )}
              <Building className="w-5 h-5 text-blue-600" />
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{department.name}</h3>
                <p className="text-sm text-gray-600">{department.description}</p>
              </div>
            </div>
            
            {canManageStructure && (
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditDepartment(department)}
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>

          <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
            <div className="flex items-center text-gray-600">
              <Users className="w-4 h-4 mr-2" />
              <span>{departmentEmployees.length} employees</span>
            </div>
            <div className="text-gray-600">
              <span className="font-medium">Manager:</span> {getManagerName(department.managerId || '')}
            </div>
            <div className="text-gray-600">
              <span className="font-medium">Max Leave/Day:</span> {department.maxLeavePerDay}
            </div>
          </div>

          {departmentEmployees.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Team Members</h4>
              <div className="flex flex-wrap gap-2">
                {departmentEmployees.slice(0, 5).map((employee) => (
                  <span
                    key={employee.id}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                  </span>
                ))}
                {departmentEmployees.length > 5 && (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                    +{departmentEmployees.length - 5} more
                  </span>
                )}
              </div>
            </div>
          )}
        </div>

        {hasSubDepartments && isExpanded && (
          <div className="ml-4">
            {subDepartments.map(subDept => renderDepartmentTree(subDept, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Organizational Structure</h1>
          <p className="text-gray-600 mt-1">Manage departments and company hierarchy</p>
        </div>
        {canManageStructure && (
          <div className="flex items-center space-x-3 mt-4 sm:mt-0">
            <button
              onClick={() => setShowNewDepartmentForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Department
            </button>
          </div>
        )}
      </div>

      {/* Department Form Modal */}
      {showNewDepartmentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h3>
              
              <form onSubmit={editingDepartment ? handleUpdateDepartment : handleSubmitNewDepartment} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Name
                  </label>
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description
                  </label>
                  <textarea
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department Manager
                  </label>
                  <select
                    value={newDepartment.managerId}
                    onChange={(e) => setNewDepartment({ ...newDepartment, managerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">Select Manager</option>
                    {employees.map((employee) => (
                      <option key={employee.id} value={employee.id}>
                        {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Parent Department
                  </label>
                  <select
                    value={newDepartment.parentDepartmentId}
                    onChange={(e) => setNewDepartment({ ...newDepartment, parentDepartmentId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">None (Root Department)</option>
                    {departments.map((department) => (
                      <option key={department.id} value={department.id}>
                        {department.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Maximum Leave Per Day
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newDepartment.maxLeavePerDay}
                    onChange={(e) => setNewDepartment({ ...newDepartment, maxLeavePerDay: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewDepartmentForm(false);
                      setEditingDepartment(null);
                      setNewDepartment({
                        name: '',
                        description: '',
                        managerId: '',
                        maxLeavePerDay: 3,
                        parentDepartmentId: '',
                      });
                    }}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    {editingDepartment ? 'Update Department' : 'Add Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Organizational Chart */}
      <div className="space-y-4">
        {getRootDepartments().map(department => renderDepartmentTree(department))}
      </div>

      {departments.length === 0 && (
        <div className="text-center py-12">
          <Building className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No departments found</h3>
          <p className="text-gray-600 mb-6">
            Create your first department to start building your organizational structure.
          </p>
          {canManageStructure && (
            <button
              onClick={() => setShowNewDepartmentForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add First Department
            </button>
          )}
        </div>
      )}
    </div>
  );
};