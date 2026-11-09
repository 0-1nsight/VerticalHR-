import React, { useState, useMemo } from 'react';
import { 
  Building, 
  Users, 
  ChevronRight, 
  ChevronDown, 
  Plus, 
  CreditCard as Edit, 
  Mail, 
  Phone, 
  MapPin, 
  Search, 
  Sparkles, 
  Layers, 
  RotateCcw,
  User
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Department, Employee } from '../../types';

export const OrganizationalStructure: React.FC = () => {
  const { 
    departments, 
    employees, 
    addDepartment, 
    updateDepartment
  } = useData();
  const { user, users, switchUser } = useAuth();

  // Active top-level tab
  const [activeTab, setActiveTab] = useState<'my-org' | 'tree' | 'departments'>('my-org');

  // Find the employee matching the authenticated user
  const loggedInEmployee = useMemo(() => {
    if (!user) return employees[0] || null;
    return employees.find(
      (e) => (user.employeeId && e.employeeId === user.employeeId) ||
             e.personalInfo.email.toLowerCase() === user.email.toLowerCase() ||
             (e.personalInfo.firstName.toLowerCase() === user.firstName.toLowerCase() &&
              e.personalInfo.lastName.toLowerCase() === user.lastName.toLowerCase())
    ) || employees[0] || null;
  }, [user, employees]);

  // The employee currently selected as focal point
  const [focalEmployeeId, setFocalEmployeeId] = useState<string>('');

  const activeFocalEmployee = useMemo(() => {
    if (focalEmployeeId) {
      const found = employees.find(e => e.id === focalEmployeeId || e.employeeId === focalEmployeeId);
      if (found) return found;
    }
    return loggedInEmployee || employees[0] || null;
  }, [focalEmployeeId, loggedInEmployee, employees]);

  // Selected employee for detail modal
  const [selectedDetailEmployee, setSelectedDetailEmployee] = useState<Employee | null>(null);

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDeptFilter, setSelectedDeptFilter] = useState('ALL');
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['EMP000', 'EMP004', 'EMP003', 'EMP002']));

  // Department CRUD states
  const [showNewDepartmentForm, setShowNewDepartmentForm] = useState(false);
  const [editingDepartment, setEditingDepartment] = useState<Department | null>(null);
  const [newDepartment, setNewDepartment] = useState({
    name: '',
    description: '',
    managerId: '',
    maxLeavePerDay: 3,
    parentDepartmentId: '',
  });

  const canManageStructure = user?.role === 'super_admin' || user?.role === 'hr_admin' || user?.role === 'admin' || user?.role === 'hr_manager';

  // Upward reporting chain (e.g. John Doe -> David Chen -> Marcus Vance)
  const reportingChain = useMemo(() => {
    if (!activeFocalEmployee) return [];
    const chain: Employee[] = [];
    const visited = new Set<string>();

    const findEmp = (idOrEmpId?: string) => {
      if (!idOrEmpId) return undefined;
      return employees.find(e => e.id === idOrEmpId || e.employeeId === idOrEmpId);
    };

    let current: Employee | undefined = activeFocalEmployee;
    visited.add(current.employeeId);

    while (current) {
      const managerId = current.jobInfo.reportsTo || current.jobInfo.supervisorId;
      let manager = findEmp(managerId);

      // Fallback matching by manager name
      if (!manager && current.jobInfo.reportingManager && current.jobInfo.reportingManager !== 'Board of Directors') {
        manager = employees.find(
          e => `${e.personalInfo.firstName} ${e.personalInfo.lastName}`.toLowerCase() ===
               current?.jobInfo.reportingManager.toLowerCase()
        );
      }

      if (manager && !visited.has(manager.employeeId)) {
        chain.unshift(manager); // Add to beginning so root is top
        visited.add(manager.employeeId);
        current = manager;
      } else {
        break;
      }
    }

    return chain;
  }, [activeFocalEmployee, employees]);

  // Direct reports of active focal employee
  const directReports = useMemo(() => {
    if (!activeFocalEmployee) return [];
    const focalEmpId = activeFocalEmployee.employeeId;
    const focalFullName = `${activeFocalEmployee.personalInfo.firstName} ${activeFocalEmployee.personalInfo.lastName}`.toLowerCase();

    return employees.filter(e => {
      if (e.id === activeFocalEmployee.id) return false;
      return (
        e.jobInfo.reportsTo === focalEmpId ||
        e.jobInfo.supervisorId === focalEmpId ||
        (e.jobInfo.reportingManager && e.jobInfo.reportingManager.toLowerCase() === focalFullName)
      );
    });
  }, [activeFocalEmployee, employees]);

  // Peers (colleagues reporting to the same manager)
  const peers = useMemo(() => {
    if (!activeFocalEmployee) return [];
    const focalManagerId = activeFocalEmployee.jobInfo.reportsTo || activeFocalEmployee.jobInfo.supervisorId;
    const focalManagerName = activeFocalEmployee.jobInfo.reportingManager?.toLowerCase();

    if (!focalManagerId && !focalManagerName) return [];

    return employees.filter(e => {
      if (e.id === activeFocalEmployee.id) return false;
      const reportsToMatch = focalManagerId && (e.jobInfo.reportsTo === focalManagerId || e.jobInfo.supervisorId === focalManagerId);
      const managerNameMatch = focalManagerName && e.jobInfo.reportingManager?.toLowerCase() === focalManagerName;
      return reportsToMatch || managerNameMatch;
    });
  }, [activeFocalEmployee, employees]);

  // Build tree data starting from root employees (who do not report to anyone in the company)
  const rootEmployees = useMemo(() => {
    return employees.filter(e => {
      const reportsTo = e.jobInfo.reportsTo;
      const managerName = e.jobInfo.reportingManager;
      if (!reportsTo && (!managerName || managerName.toLowerCase().includes('board'))) return true;
      // Check if reportsTo refers to an employee that doesn't exist in our employee list
      if (reportsTo && !employees.some(other => other.employeeId === reportsTo || other.id === reportsTo)) return true;
      return false;
    });
  }, [employees]);

  const getDirectReportsForEmployee = (emp: Employee) => {
    const empId = emp.employeeId;
    const fullName = `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`.toLowerCase();
    return employees.filter(e => {
      if (e.id === emp.id) return false;
      return (
        e.jobInfo.reportsTo === empId ||
        e.jobInfo.supervisorId === empId ||
        (e.jobInfo.reportingManager && e.jobInfo.reportingManager.toLowerCase() === fullName)
      );
    });
  };

  const toggleNodeExpansion = (empId: string) => {
    setExpandedNodes(prev => {
      const next = new Set(prev);
      if (next.has(empId)) {
        next.delete(empId);
      } else {
        next.add(empId);
      }
      return next;
    });
  };

  const isSelf = (emp: Employee) => {
    return loggedInEmployee && loggedInEmployee.id === emp.id;
  };

  const isFocal = (emp: Employee) => {
    return activeFocalEmployee && activeFocalEmployee.id === emp.id;
  };

  // Department Management Handlers
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

  const handleEditDepartment = (dept: Department) => {
    setEditingDepartment(dept);
    setNewDepartment({
      name: dept.name,
      description: dept.description,
      managerId: dept.managerId || '',
      maxLeavePerDay: dept.maxLeavePerDay,
      parentDepartmentId: dept.parentDepartmentId || '',
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

  // Color mapping by department
  const getDeptColor = (deptName?: string) => {
    const name = deptName || '';
    if (name.includes('Executive')) return { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200', dot: 'bg-amber-500' };
    if (name.includes('Human Resources')) return { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200', dot: 'bg-purple-500' };
    if (name.includes('Engineering')) return { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', dot: 'bg-blue-500' };
    if (name.includes('Compliance')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    if (name.includes('Finance')) return { bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', dot: 'bg-emerald-500' };
    return { bg: 'bg-slate-50', text: 'text-slate-700', border: 'border-slate-200', dot: 'bg-slate-400' };
  };

  // Render a single hierarchy node in the tree
  const renderTreeNode = (emp: Employee, depth = 0) => {
    const reports = getDirectReportsForEmployee(emp);
    const hasReports = reports.length > 0;
    const isExpanded = expandedNodes.has(emp.employeeId);
    const userIsSelf = isSelf(emp);
    const userIsFocal = isFocal(emp);
    const deptTheme = getDeptColor(emp.jobInfo.department);

    // Apply department and query filter
    const matchesQuery = searchQuery === '' || 
      `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.jobInfo.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      emp.employeeId.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesDept = selectedDeptFilter === 'ALL' || emp.jobInfo.department === selectedDeptFilter;

    return (
      <div key={emp.id} className="relative flex flex-col items-center">
        {/* Node Card */}
        <div 
          onClick={() => setSelectedDetailEmployee(emp)}
          className={`group relative w-72 rounded-xl p-4 transition-all duration-200 cursor-pointer border text-left bg-white ${
            userIsFocal 
              ? 'ring-2 ring-blue-600 shadow-md border-blue-300' 
              : userIsSelf 
                ? 'ring-2 ring-indigo-500 shadow-sm border-indigo-200' 
                : 'hover:shadow-md hover:border-gray-300 border-gray-200 shadow-xs'
          } ${!matchesQuery || !matchesDept ? 'opacity-40 hover:opacity-100' : ''}`}
        >
          {/* Badges strip */}
          <div className="flex items-center justify-between mb-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${deptTheme.bg} ${deptTheme.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${deptTheme.dot}`} />
              {emp.jobInfo.department}
            </span>

            {userIsSelf && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-600 text-white shadow-2xs">
                ★ You
              </span>
            )}
            {!userIsSelf && userIsFocal && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-600 text-white shadow-2xs">
                Focused
              </span>
            )}
          </div>

          {/* Profile header */}
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <img
                src={emp.profilePhoto || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=250'}
                alt={`${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`}
                className="w-12 h-12 rounded-full object-cover border-2 border-white shadow-2xs"
              />
              <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
            </div>

            <div className="min-w-0 flex-1">
              <h4 className="text-sm font-bold text-gray-900 truncate">
                {emp.personalInfo.firstName} {emp.personalInfo.lastName}
              </h4>
              <p className="text-xs text-gray-600 truncate font-medium">
                {emp.jobInfo.jobTitle}
              </p>
              <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                {emp.employeeId} · {emp.jobInfo.workLocation.split(' ')[0]}
              </p>
            </div>
          </div>

          {/* Footer stats & actions */}
          <div className="mt-3 pt-2.5 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="inline-flex items-center gap-1 text-gray-600 font-medium">
              <Users className="w-3.5 h-3.5 text-gray-400" />
              {reports.length} {reports.length === 1 ? 'Report' : 'Reports'}
            </span>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  setFocalEmployeeId(emp.id);
                  setActiveTab('my-org');
                }}
                className="text-[10px] font-bold text-blue-600 hover:text-blue-800 hover:underline px-1.5 py-0.5 rounded hover:bg-blue-50"
              >
                Focus Org
              </button>
            </div>
          </div>

          {/* Expand/Collapse Button for subordinates */}
          {hasReports && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                toggleNodeExpansion(emp.employeeId);
              }}
              className="absolute -bottom-3.5 left-1/2 -translate-x-1/2 px-2.5 py-0.5 rounded-full bg-white border border-gray-300 text-[10px] font-bold text-gray-700 shadow-2xs hover:bg-gray-50 flex items-center gap-1 z-10"
            >
              {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
              <span>{reports.length}</span>
            </button>
          )}
        </div>

        {/* Tree Branch connectors to subordinates */}
        {hasReports && isExpanded && (
          <div className="flex flex-col items-center w-full">
            {/* Vertical stem from parent */}
            <div className="w-0.5 h-6 bg-gray-300" />

            {reports.length === 1 ? (
              /* Single subordinate: direct vertical line */
              <div className="flex flex-col items-center">
                <div className="w-0.5 h-6 bg-gray-300" />
                <div className="px-3">
                  {renderTreeNode(reports[0], depth + 1)}
                </div>
              </div>
            ) : (
              /* Multiple subordinates: curved branch connectors */
              <div className="flex items-start justify-center relative">
                {reports.map((reportEmp, idx) => {
                  const isFirst = idx === 0;
                  const isLast = idx === reports.length - 1;

                  return (
                    <div key={reportEmp.id} className="flex flex-col items-center relative">
                      {/* Branch connector above child */}
                      <div className="w-full h-8 relative">
                        {isFirst ? (
                          /* First employee: curve from right sibling direction down into employee center */
                          <div className="absolute top-0 right-0 left-1/2 bottom-0 border-t-2 border-l-2 border-gray-300 rounded-tl-2xl" />
                        ) : isLast ? (
                          /* Last employee: curve from left sibling direction down into employee center with NO line going continuously */
                          <div className="absolute top-0 left-0 right-1/2 bottom-0 border-t-2 border-r-2 border-gray-300 rounded-tr-2xl" />
                        ) : (
                          /* Middle employee: continuous horizontal line with vertical drop line */
                          <>
                            <div className="absolute top-0 left-0 right-0 border-t-2 border-gray-300" />
                            <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-0.5 bg-gray-300" />
                          </>
                        )}
                      </div>

                      {/* Subordinate node wrapper with spacing */}
                      <div className="px-3">
                        {renderTreeNode(reportEmp, depth + 1)}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6 space-y-6 max-w-7xl mx-auto">
      {/* Top Banner & Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-white p-6 rounded-2xl border border-gray-200 shadow-xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <Building className="w-6 h-6" />
            </span>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Organizational Structure & Hierarchy</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Interactive reporting tree, manager escalation lines, direct reports, and user-centric org focus
              </p>
            </div>
          </div>
        </div>

        {/* User Account Context Switcher & Indicator */}
        <div className="flex flex-wrap items-center gap-2.5">
          {loggedInEmployee && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-indigo-50 border border-indigo-100 rounded-xl">
              <img
                src={loggedInEmployee.profilePhoto}
                alt={loggedInEmployee.personalInfo.firstName}
                className="w-7 h-7 rounded-full object-cover"
              />
              <div className="text-xs">
                <span className="text-indigo-900 font-bold block leading-tight">
                  {loggedInEmployee.personalInfo.firstName} {loggedInEmployee.personalInfo.lastName}
                </span>
                <span className="text-indigo-600 text-[10px]">Logged-in Account</span>
              </div>
            </div>
          )}

          {/* Quick Perspective Switcher for Testing/RBAC simulation */}
          <div className="flex items-center gap-1.5 text-xs">
            <label className="text-gray-500 font-medium text-xs">Account View:</label>
            <select
              value={user?.id || ''}
              onChange={(e) => {
                if (switchUser) switchUser(e.target.value);
                setFocalEmployeeId(''); // reset focal to new user
              }}
              className="text-xs font-semibold bg-gray-50 border border-gray-300 rounded-lg px-2.5 py-1.5 text-gray-800 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {users.map(u => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-xl shadow-xs">
        <button
          onClick={() => setActiveTab('my-org')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'my-org'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <User className="w-4 h-4" />
          My Reporting Line & Team Focus
          {activeFocalEmployee && activeFocalEmployee.id !== loggedInEmployee?.id && (
            <span className="ml-1 text-[10px] font-semibold bg-blue-100 text-blue-800 px-1.5 py-0.2 rounded-full">
              Focused on {activeFocalEmployee.personalInfo.firstName}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('tree')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'tree'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Layers className="w-4 h-4" />
          Company-Wide Org Chart Tree
        </button>

        <button
          onClick={() => setActiveTab('departments')}
          className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
            activeTab === 'departments'
              ? 'border-blue-600 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Building className="w-4 h-4" />
          Department Structure ({departments.length})
        </button>
      </div>

      {/* =================================================================== */}
      {/* TAB 1: USER-ACCOUNT FOCUSED ORG VIEW ("My Reporting Line")           */}
      {/* =================================================================== */}
      {activeTab === 'my-org' && activeFocalEmployee && (
        <div className="space-y-6">
          {/* Quick Notice Banner if focused on someone other than logged-in user */}
          {activeFocalEmployee.id !== loggedInEmployee?.id && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-center justify-between text-xs text-blue-900">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-blue-600" />
                <span>
                  You are currently inspecting the reporting hierarchy for <strong>{activeFocalEmployee.personalInfo.firstName} {activeFocalEmployee.personalInfo.lastName}</strong> ({activeFocalEmployee.jobInfo.jobTitle}).
                </span>
              </div>
              <button
                type="button"
                onClick={() => setFocalEmployeeId(loggedInEmployee?.id || '')}
                className="inline-flex items-center gap-1 px-3 py-1 bg-white border border-blue-300 rounded-lg text-blue-700 font-bold hover:bg-blue-100 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                Reset Focus to My Account
              </button>
            </div>
          )}

          {/* SECTION 1: UPWARD REPORTING LINE (MANAGERS) */}
          {reportingChain.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Upward Reporting Chain ({reportingChain.length} Levels)
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Direct managers leading up to Executive Leadership
                  </p>
                </div>
              </div>

              <div className="flex flex-col md:flex-row items-center gap-3 overflow-x-auto pb-2">
                {reportingChain.map((manager, idx) => {
                  const isTopLevel = idx === 0;
                  const isDirectManager = idx === reportingChain.length - 1;

                  return (
                    <React.Fragment key={manager.id}>
                      <div 
                        onClick={() => setSelectedDetailEmployee(manager)}
                        className={`min-w-[240px] p-3.5 rounded-xl border bg-slate-50/70 hover:bg-slate-100/70 transition-all cursor-pointer relative group ${
                          isDirectManager ? 'border-blue-300 ring-1 ring-blue-200' : 'border-gray-200'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            isDirectManager 
                              ? 'bg-blue-100 text-blue-800' 
                              : isTopLevel 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-gray-100 text-gray-700'
                          }`}>
                            {isDirectManager ? 'Direct Manager' : isTopLevel ? 'Executive / CEO' : `Level +${reportingChain.length - idx}`}
                          </span>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFocalEmployeeId(manager.id);
                            }}
                            className="text-[10px] text-blue-600 font-bold hover:underline opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Focus Here
                          </button>
                        </div>

                        <div className="flex items-center gap-3">
                          <img
                            src={manager.profilePhoto}
                            alt={manager.personalInfo.firstName}
                            className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                          />
                          <div className="min-w-0 flex-1">
                            <h4 className="text-xs font-bold text-gray-900 truncate">
                              {manager.personalInfo.firstName} {manager.personalInfo.lastName}
                            </h4>
                            <p className="text-[11px] text-gray-600 truncate font-medium">
                              {manager.jobInfo.jobTitle}
                            </p>
                            <p className="text-[10px] text-gray-400 truncate">
                              {manager.jobInfo.department}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Connecting arrow */}
                      <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 hidden md:block" />
                      <ChevronDown className="w-5 h-5 text-gray-400 shrink-0 md:hidden" />
                    </React.Fragment>
                  );
                })}

                {/* Arrow pointing to Focal Node */}
                <div className="text-xs font-bold text-blue-600 flex items-center gap-1">
                  <span>Reports To</span>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 2: THE FOCAL USER CARD (YOU / SELECTED) */}
          <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-950 text-white rounded-2xl p-6 shadow-xl relative overflow-hidden border border-slate-800">
            {/* Background watermarks */}
            <div className="absolute right-0 top-0 bottom-0 w-96 bg-gradient-to-l from-blue-500/20 to-transparent pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex flex-col sm:flex-row sm:items-center gap-5">
                <div className="relative shrink-0">
                  <img
                    src={activeFocalEmployee.profilePhoto}
                    alt={activeFocalEmployee.personalInfo.firstName}
                    className="w-20 h-20 rounded-2xl object-cover border-3 border-white/80 shadow-lg"
                  />
                  <span className="absolute -bottom-1 -right-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-emerald-400 text-emerald-950 border-2 border-indigo-900">
                    Active
                  </span>
                </div>

                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-white/20 text-white backdrop-blur-xs">
                      {activeFocalEmployee.jobInfo.department}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-400/20 text-amber-300 border border-amber-400/30">
                      ID: {activeFocalEmployee.employeeId}
                    </span>
                    {activeFocalEmployee.id === loggedInEmployee?.id && (
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-black bg-emerald-400 text-emerald-950">
                        YOU ARE HERE
                      </span>
                    )}
                  </div>

                  <h2 className="text-2xl font-black text-white tracking-tight">
                    {activeFocalEmployee.personalInfo.firstName} {activeFocalEmployee.personalInfo.lastName}
                  </h2>
                  <p className="text-blue-100 font-medium text-sm mt-0.5">
                    {activeFocalEmployee.jobInfo.jobTitle}
                  </p>

                  <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-blue-200">
                    <span className="flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5 text-blue-300" />
                      {activeFocalEmployee.personalInfo.email}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Phone className="w-3.5 h-3.5 text-blue-300" />
                      {activeFocalEmployee.personalInfo.phone}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-blue-300" />
                      {activeFocalEmployee.jobInfo.workLocation}
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick stats and action cards */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 shrink-0">
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-200 block">Direct Reports</span>
                  <span className="text-2xl font-black text-white">{directReports.length}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center">
                  <span className="text-[10px] uppercase font-bold text-blue-200 block">Peers / Team</span>
                  <span className="text-2xl font-black text-white">{peers.length}</span>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-3 border border-white/10 text-center col-span-2 sm:col-span-1">
                  <span className="text-[10px] uppercase font-bold text-blue-200 block">Reports To</span>
                  <span className="text-xs font-bold text-white truncate block mt-1.5">
                    {activeFocalEmployee.jobInfo.reportingManager}
                  </span>
                </div>
              </div>
            </div>

            {/* Quick action bar */}
            <div className="mt-5 pt-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-3 text-xs">
              <div className="text-blue-200 text-xs">
                Tenure: Hired {activeFocalEmployee.jobInfo.hireDate} · {activeFocalEmployee.jobInfo.employmentType.replace('_', ' ').toUpperCase()}
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedDetailEmployee(activeFocalEmployee)}
                  className="px-3 py-1.5 rounded-lg bg-white text-blue-900 font-bold text-xs hover:bg-blue-50 transition-colors shadow-xs"
                >
                  View Full Profile
                </button>
              </div>
            </div>
          </div>

          {/* SECTION 3: DIRECT REPORTS (MY SUBORDINATES) */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Direct Reports ({directReports.length})
                </h3>
                <p className="text-xs text-gray-600 mt-0.5">
                  Employees directly reporting to {activeFocalEmployee.personalInfo.firstName}
                </p>
              </div>
              {directReports.length > 0 && (
                <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200">
                  Team Leader / People Manager
                </span>
              )}
            </div>

            {directReports.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {directReports.map(report => (
                  <div
                    key={report.id}
                    onClick={() => setSelectedDetailEmployee(report)}
                    className="p-4 rounded-xl border border-gray-200 hover:border-blue-300 hover:shadow-xs transition-all bg-slate-50/50 cursor-pointer space-y-3 group"
                  >
                    <div className="flex items-center gap-3">
                      <img
                        src={report.profilePhoto}
                        alt={report.personalInfo.firstName}
                        className="w-12 h-12 rounded-full object-cover border border-gray-200 shrink-0"
                      />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {report.personalInfo.firstName} {report.personalInfo.lastName}
                        </h4>
                        <p className="text-[11px] text-gray-600 truncate font-medium">
                          {report.jobInfo.jobTitle}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono mt-0.5">
                          {report.employeeId} · {report.jobInfo.department}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200/70 flex items-center justify-between text-xs">
                      <span className="text-[11px] text-gray-500">
                        {getDirectReportsForEmployee(report).length} Reports
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setFocalEmployeeId(report.id);
                        }}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                      >
                        Drill Down <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                <Users className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <h4 className="text-sm font-bold text-gray-800">No Direct Reports</h4>
                <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1">
                  {activeFocalEmployee.personalInfo.firstName} is currently an individual contributor and has no subordinate team members reporting directly.
                </p>
              </div>
            )}
          </div>

          {/* SECTION 4: PEERS (COLLEAGUES REPORTING TO SAME MANAGER) */}
          {peers.length > 0 && (
            <div className="bg-white rounded-2xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Peer Colleagues ({peers.length})
                  </h3>
                  <p className="text-xs text-gray-600 mt-0.5">
                    Team members also reporting to {activeFocalEmployee.jobInfo.reportingManager}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {peers.map(peer => (
                  <div
                    key={peer.id}
                    onClick={() => setSelectedDetailEmployee(peer)}
                    className="p-3.5 rounded-xl border border-gray-200 hover:border-gray-300 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-between gap-3 group"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <img
                        src={peer.profilePhoto}
                        alt={peer.personalInfo.firstName}
                        className="w-10 h-10 rounded-full object-cover border border-gray-200 shrink-0"
                      />
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-gray-900 group-hover:text-blue-600 transition-colors truncate">
                          {peer.personalInfo.firstName} {peer.personalInfo.lastName}
                        </h4>
                        <p className="text-[11px] text-gray-600 truncate">
                          {peer.jobInfo.jobTitle}
                        </p>
                        <p className="text-[10px] text-gray-400 font-mono">
                          {peer.jobInfo.department}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocalEmployeeId(peer.id);
                      }}
                      className="px-2 py-1 rounded bg-gray-100 hover:bg-blue-50 text-[10px] font-bold text-gray-700 hover:text-blue-600 shrink-0 transition-colors"
                    >
                      Focus
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 2: COMPANY-WIDE ORG CHART TREE                                  */}
      {/* =================================================================== */}
      {activeTab === 'tree' && (
        <div className="space-y-4">
          {/* Controls Bar: Search & Department Filter */}
          <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2 flex-1">
              <div className="relative min-w-[220px]">
                <Search className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search by name, role, ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-3 py-1.5 text-xs bg-gray-50 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              {/* Department pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-xl">
                <button
                  type="button"
                  onClick={() => setSelectedDeptFilter('ALL')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors ${
                    selectedDeptFilter === 'ALL'
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  All Depts
                </button>
                {departments.map(d => (
                  <button
                    key={d.id}
                    type="button"
                    onClick={() => setSelectedDeptFilter(d.name)}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-colors whitespace-nowrap ${
                      selectedDeptFilter === d.name
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                    }`}
                  >
                    {d.name}
                  </button>
                ))}
              </div>
            </div>

            {/* Quick jump to My Account */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => {
                  setExpandedNodes(new Set(employees.map(e => e.employeeId)));
                }}
                className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
              >
                Expand All
              </button>
              <button
                type="button"
                onClick={() => {
                  if (loggedInEmployee) {
                    setFocalEmployeeId(loggedInEmployee.id);
                    setActiveTab('my-org');
                  }
                }}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg transition-colors shadow-xs"
              >
                ★ Find My Account
              </button>
            </div>
          </div>

          {/* Visual Org Canvas */}
          <div className="bg-slate-100/70 rounded-2xl border border-gray-200 p-8 overflow-x-auto min-h-[600px] flex justify-center">
            <div className="inline-flex flex-col items-center">
              {rootEmployees.map(rootEmp => (
                <div key={rootEmp.id} className="mb-12">
                  {renderTreeNode(rootEmp, 0)}
                </div>
              ))}

              {rootEmployees.length === 0 && (
                <div className="text-center py-16 text-gray-400">
                  <Building className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No root leadership found in organization.</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* TAB 3: DEPARTMENT MANAGEMENT                                        */}
      {/* =================================================================== */}
      {activeTab === 'departments' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-lg font-bold text-gray-900">Functional Business Units</h3>
              <p className="text-xs text-gray-500">Configure department heads, staffing allocations, and daily leave caps</p>
            </div>
            {canManageStructure && (
              <button
                onClick={() => {
                  setEditingDepartment(null);
                  setNewDepartment({
                    name: '',
                    description: '',
                    managerId: '',
                    maxLeavePerDay: 3,
                    parentDepartmentId: '',
                  });
                  setShowNewDepartmentForm(true);
                }}
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
              >
                <Plus className="w-4 h-4 mr-1.5" />
                Add Department
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {departments.map(dept => {
              const deptEmployees = employees.filter(e => e.jobInfo.department === dept.name);
              const manager = employees.find(e => e.employeeId === dept.managerId || e.id === dept.managerId);

              return (
                <div key={dept.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="p-1.5 bg-blue-50 text-blue-600 rounded-lg">
                          <Building className="w-4 h-4" />
                        </span>
                        <h4 className="text-sm font-bold text-gray-900">{dept.name}</h4>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 line-clamp-2">{dept.description}</p>
                    </div>

                    {canManageStructure && (
                      <button
                        onClick={() => handleEditDepartment(dept)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <div>
                      <span className="text-gray-400 block mb-0.5">Headcount</span>
                      <span className="font-bold text-gray-800">{deptEmployees.length} Staff</span>
                    </div>
                    <div>
                      <span className="text-gray-400 block mb-0.5">Max Leave/Day</span>
                      <span className="font-bold text-gray-800">{dept.maxLeavePerDay} Staff</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <span className="truncate">
                      Head: <strong className="text-gray-800">{manager ? `${manager.personalInfo.firstName} ${manager.personalInfo.lastName}` : 'Unassigned'}</strong>
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedDeptFilter(dept.name);
                        setActiveTab('tree');
                      }}
                      className="text-blue-600 font-bold hover:underline"
                    >
                      View on Tree →
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* =================================================================== */}
      {/* EMPLOYEE DETAIL MODAL / DRAWER                                      */}
      {/* =================================================================== */}
      {selectedDetailEmployee && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-lg w-full overflow-hidden border border-gray-200">
            {/* Modal Header Banner */}
            <div className="bg-gradient-to-r from-blue-700 to-indigo-700 p-6 text-white relative">
              <button
                type="button"
                onClick={() => setSelectedDetailEmployee(null)}
                className="absolute top-4 right-4 text-white/80 hover:text-white bg-black/10 hover:bg-black/20 rounded-full w-7 h-7 flex items-center justify-center transition-colors"
              >
                ✕
              </button>

              <div className="flex items-center gap-4">
                <img
                  src={selectedDetailEmployee.profilePhoto}
                  alt={selectedDetailEmployee.personalInfo.firstName}
                  className="w-16 h-16 rounded-full object-cover border-2 border-white shadow-md"
                />
                <div>
                  <h3 className="text-xl font-bold">
                    {selectedDetailEmployee.personalInfo.firstName} {selectedDetailEmployee.personalInfo.lastName}
                  </h3>
                  <p className="text-blue-100 text-xs font-medium mt-0.5">
                    {selectedDetailEmployee.jobInfo.jobTitle}
                  </p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white">
                      {selectedDetailEmployee.jobInfo.department}
                    </span>
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-white/20 text-white font-mono">
                      {selectedDetailEmployee.employeeId}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Body */}
            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3 bg-gray-50 p-3.5 rounded-xl border border-gray-100">
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Reports To</span>
                  <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                    {selectedDetailEmployee.jobInfo.reportingManager || 'Executive Board'}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Work Location</span>
                  <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                    {selectedDetailEmployee.jobInfo.workLocation}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Hire Date</span>
                  <span className="font-bold text-gray-800 text-xs mt-0.5 block">
                    {selectedDetailEmployee.jobInfo.hireDate}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block text-[10px] uppercase font-bold">Employment Type</span>
                  <span className="font-bold text-gray-800 text-xs mt-0.5 block uppercase">
                    {selectedDetailEmployee.jobInfo.employmentType.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Direct Reports count */}
              <div>
                <h4 className="font-bold text-gray-800 mb-1.5">Direct Team Members</h4>
                <div className="flex flex-wrap gap-1.5">
                  {getDirectReportsForEmployee(selectedDetailEmployee).map(report => (
                    <span
                      key={report.id}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100"
                    >
                      {report.personalInfo.firstName} {report.personalInfo.lastName} ({report.jobInfo.jobTitle})
                    </span>
                  ))}
                  {getDirectReportsForEmployee(selectedDetailEmployee).length === 0 && (
                    <span className="text-gray-400 italic">No direct reports.</span>
                  )}
                </div>
              </div>

              {/* Contact Information */}
              <div>
                <h4 className="font-bold text-gray-800 mb-1.5">Contact Details</h4>
                <div className="space-y-1.5 text-gray-600">
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-gray-400" />
                    <span>{selectedDetailEmployee.personalInfo.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-gray-400" />
                    <span>{selectedDetailEmployee.personalInfo.phone}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => setSelectedDetailEmployee(null)}
                className="px-4 py-2 text-xs font-bold text-gray-600 hover:text-gray-800"
              >
                Close
              </button>
              <button
                type="button"
                onClick={() => {
                  setFocalEmployeeId(selectedDetailEmployee.id);
                  setSelectedDetailEmployee(null);
                  setActiveTab('my-org');
                }}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold shadow-xs transition-colors"
              >
                Focus Org Chart on {selectedDetailEmployee.personalInfo.firstName}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* DEPARTMENT MODAL */}
      {showNewDepartmentForm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-4">
                {editingDepartment ? 'Edit Department' : 'Add New Department'}
              </h3>
              
              <form onSubmit={editingDepartment ? handleUpdateDepartment : handleSubmitNewDepartment} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-gray-700 mb-1">Department Name</label>
                  <input
                    type="text"
                    value={newDepartment.name}
                    onChange={(e) => setNewDepartment({ ...newDepartment, name: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Description</label>
                  <textarea
                    value={newDepartment.description}
                    onChange={(e) => setNewDepartment({ ...newDepartment, description: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Department Manager / Head</label>
                  <select
                    value={newDepartment.managerId}
                    onChange={(e) => setNewDepartment({ ...newDepartment, managerId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Manager</option>
                    {employees.map((emp) => (
                      <option key={emp.id} value={emp.employeeId}>
                        {emp.personalInfo.firstName} {emp.personalInfo.lastName} ({emp.jobInfo.jobTitle})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-gray-700 mb-1">Maximum Leave Per Day (Capacity Cap)</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={newDepartment.maxLeavePerDay}
                    onChange={(e) => setNewDepartment({ ...newDepartment, maxLeavePerDay: parseInt(e.target.value) || 1 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                  <button
                    type="button"
                    onClick={() => {
                      setShowNewDepartmentForm(false);
                      setEditingDepartment(null);
                    }}
                    className="px-4 py-2 font-bold text-gray-600 hover:text-gray-800"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-white bg-blue-600 font-bold rounded-lg hover:bg-blue-700 shadow-xs"
                  >
                    {editingDepartment ? 'Save Changes' : 'Create Department'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};