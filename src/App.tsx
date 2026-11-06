import { useState } from 'react';
import { useAuth } from './contexts/AuthContext';
import { LoginForm } from './components/Auth/LoginForm';
import { Header } from './components/Layout/Header';
import { Sidebar } from './components/Layout/Sidebar';
import { Dashboard } from './components/Dashboard/Dashboard';
import { EmployeeList } from './components/Employees/EmployeeList';
import { EmployeeForm } from './components/Employees/EmployeeForm';
import { LeaveRequests } from './components/Leave/LeaveRequests';
import { LeaveBalances } from './components/Leave/LeaveBalances';
import { LeaveTypesManager } from './components/Leave/LeaveTypesManager';
import { ProfileChangeRequests } from './components/Employees/ProfileChangeRequests';
import { PerformanceReviews } from './components/Performance/PerformanceReviews';
import { GoalsAndOKRs } from './components/Performance/GoalsAndOKRs';
import { CareerMovements } from './components/Performance/CareerMovements';
import { AttendanceTracker } from './components/Time/AttendanceTracker';
import { Timesheets } from './components/Time/Timesheets';
import { TrainingCourses } from './components/Training/TrainingCourses';
import { CertificationsManager } from './components/Training/CertificationsManager';
import { HRReports } from './components/Reports/HRReports';
import { OrganizationalStructure } from './components/Admin/OrganizationalStructure';
import { JobBoard } from './components/Admin/JobBoard';
import { UserManagement } from './components/Admin/UserManagement';
import { SystemSettingsManager } from './components/Admin/SystemSettingsManager';
import { StrategicHRGuide } from './components/Admin/StrategicHRGuide';
import { DocumentManager } from './components/Documents/DocumentManager';
import { FicaComplianceCenter } from './components/Compliance/FicaComplianceCenter';
import { ApprovalsInbox } from './components/Workflows/ApprovalsInbox';
import { HiringOnboardingHub } from './components/Recruitment/HiringOnboardingHub';
import { PayrollReadyExport } from './components/Payroll/PayrollReadyExport';
import { AuditTrailViewer } from './components/Audit/AuditTrailViewer';
import { HRCasesHelpdesk } from './components/Helpdesk/HRCasesHelpdesk';
import { BillingAndIntegrations } from './components/Platform/BillingAndIntegrations';
import { LaunchReadinessHub } from './components/Launch/LaunchReadinessHub';
import { useData } from './contexts/DataContext';
import { Employee } from './types';

function App() {
  const { user, isLoading } = useAuth();
  const { addEmployee, updateEmployee } = useData();
  const [activeModule, setActiveModule] = useState('dashboard');
  const [showEmployeeForm, setShowEmployeeForm] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();

  const handleAddEmployee = () => {
    setEditingEmployee(undefined);
    setShowEmployeeForm(true);
  };

  const handleEditEmployee = (employee: Employee) => {
    setEditingEmployee(employee);
    setShowEmployeeForm(true);
  };

  const handleSaveEmployee = (employeeData: Omit<Employee, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (editingEmployee) {
      updateEmployee(editingEmployee.id, employeeData);
    } else {
      addEmployee(employeeData);
    }
    setShowEmployeeForm(false);
    setEditingEmployee(undefined);
  };

  const handleCloseEmployeeForm = () => {
    setShowEmployeeForm(false);
    setEditingEmployee(undefined);
  };

  const handleModuleChange = (moduleId: string) => {
    if (moduleId === 'add-employee') {
      setActiveModule('employees');
      handleAddEmployee();
    } else {
      setActiveModule(moduleId);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-sm font-medium text-gray-600">Initializing VerticalHRM...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <LoginForm />;
  }

  const renderActiveModule = () => {
    switch (activeModule) {
      case 'dashboard':
        return <Dashboard onNavigate={handleModuleChange} />;
      case 'approvals-inbox':
        return <ApprovalsInbox />;
      case 'hiring-hub':
        return <HiringOnboardingHub />;
      case 'hr-helpdesk':
        return <HRCasesHelpdesk />;
      case 'payroll-export':
        return <PayrollReadyExport />;
      case 'audit-trail':
        return <AuditTrailViewer />;
      case 'employees':
        return (
          <EmployeeList 
            onAddEmployee={handleAddEmployee}
            onEditEmployee={handleEditEmployee}
          />
        );
      case 'profile-change-requests':
        return <ProfileChangeRequests />;
      case 'leave-requests':
        return <LeaveRequests />;
      case 'leave-balance':
        return <LeaveBalances />;
      case 'leave-types':
        return <LeaveTypesManager />;
      case 'attendance':
        return <AttendanceTracker />;
      case 'timesheets':
        return <Timesheets />;
      case 'performance-reviews':
        return <PerformanceReviews />;
      case 'goals':
        return <GoalsAndOKRs />;
      case 'career-movements':
        return <CareerMovements />;
      case 'courses':
        return <TrainingCourses />;
      case 'certifications':
        return <CertificationsManager />;
      case 'employee-reports':
        return <HRReports initialTab="employee-reports" />;
      case 'leave-reports':
        return <HRReports initialTab="leave-reports" />;
      case 'attendance-reports':
        return <HRReports initialTab="attendance-reports" />;
      case 'organizational-structure':
        return <OrganizationalStructure />;
      case 'job-postings':
        return <JobBoard />;
      case 'documents':
        return <DocumentManager />;
      case 'fica-compliance':
        return <FicaComplianceCenter />;
      case 'user-management':
        return <UserManagement />;
      case 'system-settings':
        return <SystemSettingsManager />;
      case 'strategic-guide':
        return <StrategicHRGuide />;
      case 'billing-platform':
      case 'ai-policy-assistant':
        return <BillingAndIntegrations />;
      case 'launch-readiness':
        return <LaunchReadinessHub />;
      default:
        return (
          <div className="flex items-center justify-center h-full p-12">
            <div className="text-center bg-white p-8 rounded-xl border border-gray-200 shadow-xs max-w-md">
              <h2 className="text-xl font-bold text-gray-900 mb-2">
                {activeModule.replace('-', ' ').replace(/\b\w/g, l => l.toUpperCase())}
              </h2>
              <p className="text-gray-600 text-sm mb-4">You have selected module {activeModule}.</p>
              <button
                onClick={() => setActiveModule('dashboard')}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
              >
                Return to Dashboard
              </button>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar activeModule={activeModule} onModuleChange={handleModuleChange} />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-auto bg-slate-50">
          {renderActiveModule()}
        </main>
      </div>

      {/* Employee Form Modal */}
      {showEmployeeForm && (
        <EmployeeForm
          employee={editingEmployee}
          onClose={handleCloseEmployeeForm}
          onSave={handleSaveEmployee}
        />
      )}
    </div>
  );
}

export default App;