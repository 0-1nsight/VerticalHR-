import React, { useState } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Mail,
  Phone,
  MapPin,
  Users
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Employee } from '../../types';
import { EmployeeDetailModal } from './EmployeeDetailModal';
import { BulkImportExportModal } from './BulkImportExportModal';
import { LetterGeneratorModal } from './LetterGeneratorModal';
import { EmployeeSelfServicePortal } from './EmployeeSelfServicePortal';
import { FileSignature, UploadCloud } from 'lucide-react';

interface EmployeeListProps {
  onAddEmployee: () => void;
  onEditEmployee: (employee: Employee) => void;
}

export const EmployeeList: React.FC<EmployeeListProps> = ({ onAddEmployee, onEditEmployee }) => {
  const { employees, deleteEmployee } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDepartment, setSelectedDepartment] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [viewingEmployee, setViewingEmployee] = useState<Employee | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [selectedLetterEmpId, setSelectedLetterEmpId] = useState<string | undefined>(undefined);

  // Row Level Security: An employee accesses their dedicated self-service portal directly
  if (user?.role === 'employee') {
    return <EmployeeSelfServicePortal />;
  }

  const filteredEmployees = employees.filter(employee => {
    const matchesSearch = 
      employee.personalInfo.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.personalInfo.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.personalInfo.email.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesDepartment = !selectedDepartment || employee.jobInfo.department === selectedDepartment;
    const matchesStatus = !selectedStatus || employee.jobInfo.employmentStatus === selectedStatus;

    return matchesSearch && matchesDepartment && matchesStatus;
  });

  const departments = [...new Set(employees.map(emp => emp.jobInfo.department))];
  const statuses = [...new Set(employees.map(emp => emp.jobInfo.employmentStatus))];

  const canManageEmployees = user?.role === 'admin' || user?.role === 'hr_manager' || user?.role === 'hr_admin' || user?.role === 'super_admin';

  const handleDeleteEmployee = (employeeId: string) => {
    deleteEmployee(employeeId);
  };

  const exportToCSV = () => {
    const headers = [
      'Employee ID',
      'Name',
      'Email',
      'Department',
      'Job Title',
      'Status',
      'Hire Date',
      'Phone',
      'Location'
    ];

    const csvData = filteredEmployees.map(emp => [
      emp.employeeId,
      `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
      emp.personalInfo.email,
      emp.jobInfo.department,
      emp.jobInfo.jobTitle,
      emp.jobInfo.employmentStatus,
      emp.jobInfo.hireDate,
      emp.personalInfo.phone,
      emp.jobInfo.workLocation
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'employees.csv';
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personnel Directory & Profiles</h1>
          <p className="text-gray-600 mt-1">Manage personnel records, employment lifecycle, documents, and official letters</p>
        </div>
        <div className="flex flex-wrap items-center gap-2 mt-4 sm:mt-0">
          <button
            onClick={() => setShowBulkModal(true)}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-xs"
            title="Bulk CSV Import with pre-validation and Full Roster Export"
          >
            <UploadCloud className="w-4 h-4 mr-2 text-blue-600" />
            Bulk CSV Tools
          </button>
          <button
            onClick={() => {
              setSelectedLetterEmpId(undefined);
              setShowLetterModal(true);
            }}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-xs"
            title="Generate official letters on company letterhead"
          >
            <FileSignature className="w-4 h-4 mr-2 text-indigo-600" />
            Official Letters
          </button>
          <button
            onClick={exportToCSV}
            className="inline-flex items-center px-3.5 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 shadow-xs"
          >
            <Download className="w-4 h-4 mr-2" />
            Quick Export
          </button>
          {canManageEmployees && (
            <button
              onClick={onAddEmployee}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-xs"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </button>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          
          <select
            value={selectedDepartment}
            onChange={(e) => setSelectedDepartment(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Departments</option>
            {departments.map(dept => (
              <option key={dept} value={dept}>{dept}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="">All Statuses</option>
            {statuses.map(status => (
              <option key={status} value={status} className="capitalize">
                {status.replace('_', ' ')}
              </option>
            ))}
          </select>

          <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
            <Filter className="w-4 h-4 mr-2" />
            More Filters
          </button>
        </div>
      </div>

      {/* Employee Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredEmployees.map((employee) => (
          <div key={employee.id} className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            {/* Employee Header */}
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">
                  {employee.personalInfo.firstName} {employee.personalInfo.lastName}
                </h3>
                <p className="text-sm text-gray-600">{employee.employeeId}</p>
              </div>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                employee.jobInfo.employmentStatus === 'active' 
                  ? 'bg-green-100 text-green-800' 
                  : employee.jobInfo.employmentStatus === 'inactive'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {employee.jobInfo.employmentStatus}
              </span>
            </div>

            {/* Job Information */}
            <div className="space-y-2 mb-4">
              <div>
                <p className="text-sm font-medium text-gray-900">{employee.jobInfo.jobTitle}</p>
                <p className="text-sm text-gray-600">{employee.jobInfo.department}</p>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <MapPin className="w-4 h-4 mr-1" />
                {employee.jobInfo.workLocation}
              </div>
            </div>

            {/* Contact Information */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center text-sm text-gray-600">
                <Mail className="w-4 h-4 mr-2" />
                <a href={`mailto:${employee.personalInfo.email}`} className="text-blue-600 hover:text-blue-800">
                  {employee.personalInfo.email}
                </a>
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Phone className="w-4 h-4 mr-2" />
                <a href={`tel:${employee.personalInfo.phone}`} className="text-blue-600 hover:text-blue-800">
                  {employee.personalInfo.phone}
                </a>
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t border-gray-200">
              <div className="text-sm text-gray-500">
                Hired: {new Date(employee.jobInfo.hireDate).toLocaleDateString()}
              </div>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={() => setViewingEmployee(employee)}
                  title="View Profile Details"
                  className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg"
                >
                  <Eye className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => {
                    setSelectedLetterEmpId(employee.id);
                    setShowLetterModal(true);
                  }}
                  title="Generate Official Letter for Employee"
                  className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg"
                >
                  <FileSignature className="w-4 h-4" />
                </button>
                {canManageEmployees && (
                  <>
                    <button 
                      onClick={() => onEditEmployee(employee)}
                      className="p-2 text-gray-400 hover:text-green-600 hover:bg-green-50 rounded-lg"
                    >
                      <Edit className="w-4 h-4" />
                    </button>
                    <button 
                      onClick={() => handleDeleteEmployee(employee.id)}
                      className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredEmployees.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-400 mb-4">
            <Users className="w-16 h-16 mx-auto" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No employees found</h3>
          <p className="text-gray-600 mb-6">
            {searchTerm || selectedDepartment || selectedStatus 
              ? 'Try adjusting your filters to see more results.'
              : 'Get started by adding your first employee.'
            }
          </p>
          {canManageEmployees && !searchTerm && !selectedDepartment && !selectedStatus && (
            <button
              onClick={onAddEmployee}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Employee
            </button>
          )}
        </div>
      )}

      {viewingEmployee && (
        <EmployeeDetailModal
          employee={viewingEmployee}
          onClose={() => setViewingEmployee(null)}
          onEdit={() => {
            const emp = viewingEmployee;
            setViewingEmployee(null);
            onEditEmployee(emp);
          }}
        />
      )}

      {showBulkModal && (
        <BulkImportExportModal onClose={() => setShowBulkModal(false)} />
      )}

      {showLetterModal && (
        <LetterGeneratorModal
          initialEmployeeId={selectedLetterEmpId}
          onClose={() => {
            setShowLetterModal(false);
            setSelectedLetterEmpId(undefined);
          }}
        />
      )}
    </div>
  );
};