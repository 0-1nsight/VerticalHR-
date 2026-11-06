import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Calendar, 
  Clock, 
  BarChart3, 
  Settings, 
  FileText,
  Building,
  ChevronDown,
  ChevronRight,
  Home,
  UserCheck,
  BookOpen,
  Award,
  TrendingUp,
  Lightbulb,
  ShieldCheck,
  CheckCircle,
  DollarSign,
  LifeBuoy,
  History
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
}

interface MenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  children?: MenuItem[];
  roles?: string[];
}

const menuItems: MenuItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <Home className="w-5 h-5" />,
  },
  {
    id: 'approvals-inbox',
    label: 'Approvals & Workflows',
    icon: <CheckCircle className="w-5 h-5 text-emerald-600" />,
    roles: ['super_admin', 'hr_admin', 'admin', 'hr_manager', 'line_manager'],
  },
  {
    id: 'hiring-hub',
    label: 'Hiring & Onboarding',
    icon: <UserPlus className="w-5 h-5 text-indigo-600" />,
    roles: ['super_admin', 'hr_admin', 'admin', 'hr_manager', 'line_manager'],
  },
  {
    id: 'pim',
    label: 'Personnel Information',
    icon: <Users className="w-5 h-5" />,
    children: [
      { id: 'employees', label: 'Employee List', icon: <Users className="w-4 h-4" /> },
      { id: 'add-employee', label: 'Add Employee', icon: <UserPlus className="w-4 h-4" />, roles: ['super_admin', 'hr_admin', 'admin', 'hr_manager'] },
      { id: 'documents', label: 'Document & Photo Vault', icon: <FileText className="w-4 h-4" /> },
      { id: 'profile-change-requests', label: 'Profile Change Requests', icon: <FileText className="w-4 h-4" />, roles: ['super_admin', 'hr_admin', 'admin', 'hr_manager'] },
    ],
  },
  {
    id: 'leave',
    label: 'Leave Management',
    icon: <Calendar className="w-5 h-5" />,
    children: [
      { id: 'leave-requests', label: 'Leave Requests', icon: <Calendar className="w-4 h-4" /> },
      { id: 'leave-balance', label: 'Leave Balance', icon: <BarChart3 className="w-4 h-4" /> },
      { id: 'leave-types', label: 'Leave Types', icon: <FileText className="w-4 h-4" />, roles: ['super_admin', 'hr_admin', 'admin', 'hr_manager'] },
    ],
  },
  {
    id: 'time',
    label: 'Time & Attendance',
    icon: <Clock className="w-5 h-5" />,
    children: [
      { id: 'timesheets', label: 'Timesheets', icon: <Clock className="w-4 h-4" /> },
      { id: 'attendance', label: 'Attendance', icon: <UserCheck className="w-4 h-4" /> },
      { id: 'payroll-export', label: 'Payroll Reconciliation', icon: <DollarSign className="w-4 h-4 text-emerald-600" />, roles: ['super_admin', 'hr_admin', 'admin', 'hr_manager', 'auditor'] },
    ],
  },
  {
    id: 'hr-helpdesk',
    label: 'HR Cases & Helpdesk',
    icon: <LifeBuoy className="w-5 h-5 text-amber-500" />,
  },
  {
    id: 'performance',
    label: 'Performance',
    icon: <Award className="w-5 h-5" />,
    children: [
      { id: 'performance-reviews', label: 'Performance Reviews', icon: <FileText className="w-4 h-4" /> },
      { id: 'goals', label: 'Goals & OKRs', icon: <Award className="w-4 h-4" /> },
      { id: 'career-movements', label: 'Career Movements', icon: <TrendingUp className="w-4 h-4" />, roles: ['super_admin', 'hr_admin', 'admin', 'hr_manager'] },
    ],
  },
  {
    id: 'training',
    label: 'Training & Development',
    icon: <BookOpen className="w-5 h-5" />,
    children: [
      { id: 'courses', label: 'Training Courses', icon: <BookOpen className="w-4 h-4" /> },
      { id: 'certifications', label: 'Certifications', icon: <Award className="w-4 h-4" /> },
    ],
  },
  {
    id: 'reports',
    label: 'Reports & Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    roles: ['super_admin', 'hr_admin', 'admin', 'hr_manager', 'auditor'],
    children: [
      { id: 'employee-reports', label: 'Employee Reports', icon: <Users className="w-4 h-4" /> },
      { id: 'leave-reports', label: 'Leave Reports', icon: <Calendar className="w-4 h-4" /> },
      { id: 'attendance-reports', label: 'Attendance Reports', icon: <Clock className="w-4 h-4" /> },
    ],
  },
  {
    id: 'admin',
    label: 'Administration',
    icon: <Settings className="w-5 h-5" />,
    roles: ['super_admin', 'hr_admin', 'admin', 'hr_manager', 'auditor'],
    children: [
      { id: 'audit-trail', label: 'Immutable Audit Trail', icon: <History className="w-4 h-4 text-blue-600" />, roles: ['super_admin', 'hr_admin', 'admin', 'hr_manager', 'auditor'] },
      { id: 'fica-compliance', label: 'FICA & KYC Compliance', icon: <ShieldCheck className="w-4 h-4 text-emerald-600" /> },
      { id: 'organizational-structure', label: 'Organizational Structure', icon: <Building className="w-4 h-4" /> },
      { id: 'job-postings', label: 'Job Board', icon: <FileText className="w-4 h-4" /> },
      { id: 'user-management', label: 'User Management', icon: <Users className="w-4 h-4" />, roles: ['super_admin', 'hr_admin', 'admin'] },
      { id: 'system-settings', label: 'System Settings', icon: <Settings className="w-4 h-4" />, roles: ['super_admin', 'hr_admin', 'admin'] },
      { id: 'strategic-guide', label: 'HR Strategy & Ideas', icon: <Lightbulb className="w-4 h-4 text-amber-500" /> },
    ],
  },
];

export const Sidebar: React.FC<SidebarProps> = ({ activeModule, onModuleChange }) => {
  const { user } = useAuth();
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['pim', 'leave']));

  const toggleExpanded = (itemId: string) => {
    const newExpanded = new Set(expandedItems);
    if (newExpanded.has(itemId)) {
      newExpanded.delete(itemId);
    } else {
      newExpanded.add(itemId);
    }
    setExpandedItems(newExpanded);
  };

  const hasAccess = (item: MenuItem) => {
    if (!item.roles || item.roles.length === 0) return true;
    if (!user?.role) return false;
    if (user.role === 'super_admin') return true;
    if (user.role === 'admin' && item.roles.some(r => ['admin', 'hr_admin', 'hr_manager'].includes(r))) return true;
    if (user.role === 'hr_admin' && item.roles.some(r => ['admin', 'hr_admin', 'hr_manager'].includes(r))) return true;
    return item.roles.includes(user.role);
  };

  const renderMenuItem = (item: MenuItem, level = 0) => {
    if (!hasAccess(item)) return null;

    const isExpanded = expandedItems.has(item.id);
    const isActive = activeModule === item.id;
    const hasChildren = item.children && item.children.length > 0;

    const getItemLabel = (m: MenuItem) => {
      if (user?.role === 'employee') {
        if (m.id === 'pim') return 'My Profile & Employment';
        if (m.id === 'employees') return 'My Profile & Information';
        if (m.id === 'approvals-inbox') return 'My Requests & Status';
        if (m.id === 'performance-reviews') return 'My Performance Reviews';
        if (m.id === 'goals') return 'My Goals & OKRs';
        if (m.id === 'leave-requests') return 'My Leave Requests';
        if (m.id === 'timesheets') return 'My Timesheets';
        if (m.id === 'attendance') return 'My Attendance Log';
      }
      return m.label;
    };

    return (
      <div key={item.id}>
        <div
          className={`flex items-center px-4 py-2 cursor-pointer transition-colors duration-200 ${
            level === 0 ? 'text-sm font-medium' : 'text-sm ml-4'
          } ${
            isActive 
              ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700' 
              : 'text-gray-700 hover:bg-gray-100'
          }`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              onModuleChange(item.id);
            }
          }}
        >
          <span className="mr-3">{item.icon}</span>
          <span className="flex-1">{getItemLabel(item)}</span>
          {hasChildren && (
            <span className="ml-2">
              {isExpanded ? (
                <ChevronDown className="w-4 h-4" />
              ) : (
                <ChevronRight className="w-4 h-4" />
              )}
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="bg-gray-50">
            {item.children?.map(child => renderMenuItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="w-64 bg-white shadow-lg h-full overflow-y-auto">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center">
            <Building className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">VerticalHRM</h1>
            <p className="text-sm text-gray-500">HR Management</p>
          </div>
        </div>
      </div>
      
      <nav className="mt-6">
        {menuItems.map(item => renderMenuItem(item))}
      </nav>
    </div>
  );
};