import React, { useState, useEffect, useRef } from 'react';
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
  History,
  CreditCard,
  Sparkles,
  Rocket,
  PanelLeftClose,
  PanelLeftOpen
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';

export interface SidebarProps {
  activeModule: string;
  onModuleChange: (module: string) => void;
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
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
      { id: 'organizational-structure', label: 'Org Chart & Hierarchy', icon: <Building className="w-4 h-4 text-blue-600" /> },
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
    id: 'ai-policy-assistant',
    label: 'AI Policy Assistant',
    icon: <Sparkles className="w-5 h-5 text-indigo-500" />,
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
      { id: 'launch-readiness', label: 'Launch Readiness Hub', icon: <Rocket className="w-4 h-4 text-emerald-600" />, roles: ['super_admin', 'hr_admin', 'admin', 'auditor'] },
      { id: 'billing-platform', label: 'Platform, Billing & API', icon: <CreditCard className="w-4 h-4 text-purple-600" />, roles: ['super_admin', 'hr_admin', 'admin'] },
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

export const Sidebar: React.FC<SidebarProps> = ({ 
  activeModule, 
  onModuleChange,
  isCollapsed: externalCollapsed,
  onToggleCollapse: externalToggleCollapse
}) => {
  const { user } = useAuth();
  const [internalCollapsed, setInternalCollapsed] = useState(() => {
    return localStorage.getItem('vhr_sidebar_collapsed') === 'true';
  });

  const isCollapsed = externalCollapsed !== undefined ? externalCollapsed : internalCollapsed;

  const toggleCollapse = () => {
    if (externalToggleCollapse) {
      externalToggleCollapse();
    } else {
      setInternalCollapsed(prev => {
        const next = !prev;
        localStorage.setItem('vhr_sidebar_collapsed', String(next));
        return next;
      });
    }
  };

  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set(['pim', 'leave']));
  const [flyoutOpenItemId, setFlyoutOpenItemId] = useState<string | null>(null);
  const flyoutRef = useRef<HTMLDivElement | null>(null);

  // Close flyout on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (flyoutRef.current && !flyoutRef.current.contains(event.target as Node)) {
        setFlyoutOpenItemId(null);
      }
    };
    if (flyoutOpenItemId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [flyoutOpenItemId]);

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

  // Render when expanded
  const renderExpandedItem = (item: MenuItem, level = 0) => {
    if (!hasAccess(item)) return null;

    const isExpanded = expandedItems.has(item.id);
    const isActive = activeModule === item.id;
    const hasChildren = item.children && item.children.length > 0;

    return (
      <div key={item.id}>
        <div
          className={`flex items-center px-4 py-2.5 cursor-pointer transition-colors duration-150 select-none ${
            level === 0 ? 'text-xs font-semibold' : 'text-xs ml-4 py-2 font-medium'
          } ${
            isActive 
              ? 'bg-blue-50 text-blue-700 border-r-3 border-blue-600 font-bold' 
              : 'text-gray-700 hover:bg-gray-100 hover:text-gray-900'
          }`}
          onClick={() => {
            if (hasChildren) {
              toggleExpanded(item.id);
            } else {
              onModuleChange(item.id);
            }
          }}
        >
          <span className="mr-3 shrink-0">{item.icon}</span>
          <span className="flex-1 truncate">{getItemLabel(item)}</span>
          {hasChildren && (
            <span className="ml-2 shrink-0 text-gray-400">
              {isExpanded ? (
                <ChevronDown className="w-3.5 h-3.5" />
              ) : (
                <ChevronRight className="w-3.5 h-3.5" />
              )}
            </span>
          )}
        </div>
        
        {hasChildren && isExpanded && (
          <div className="bg-slate-50/70 border-l border-gray-100 ml-4 pl-1">
            {item.children?.map(child => renderExpandedItem(child, level + 1))}
          </div>
        )}
      </div>
    );
  };

  // Render when collapsed
  const renderCollapsedItem = (item: MenuItem) => {
    if (!hasAccess(item)) return null;

    const hasChildren = Boolean(item.children && item.children.length > 0);
    const accessibleChildren = (item.children || []).filter(c => hasAccess(c));
    const isDirectActive = activeModule === item.id;
    const isChildActive = accessibleChildren.some(c => c.id === activeModule);
    const isActive = isDirectActive || isChildActive;
    const isFlyoutOpen = flyoutOpenItemId === item.id;

    const handleClick = () => {
      if (hasChildren) {
        setFlyoutOpenItemId(prev => prev === item.id ? null : item.id);
      } else {
        onModuleChange(item.id);
        setFlyoutOpenItemId(null);
      }
    };

    return (
      <div key={item.id} className="relative group flex justify-center py-1">
        <button
          type="button"
          onClick={handleClick}
          title={getItemLabel(item)}
          className={`w-11 h-11 rounded-xl flex items-center justify-center transition-all duration-150 relative cursor-pointer ${
            isActive
              ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-300/50'
              : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
          }`}
          aria-label={getItemLabel(item)}
        >
          <span className={isActive ? 'text-white' : ''}>{item.icon}</span>

          {/* Child active subtle dot */}
          {isChildActive && (
            <span className="absolute -top-0.5 -right-0.5 w-2.5 h-2.5 bg-amber-400 border-2 border-white rounded-full" />
          )}
        </button>

        {/* Hover Tooltip (when no children and flyout is closed) */}
        {!hasChildren && (
          <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center px-2.5 py-1.5 bg-slate-900 text-white text-xs font-semibold rounded-lg shadow-xl whitespace-nowrap z-50 pointer-events-none">
            {getItemLabel(item)}
            <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-slate-900" />
          </div>
        )}

        {/* Hover/Click Flyout Popover for Categories with Children */}
        {hasChildren && (
          <div 
            className={`absolute left-full ml-3 top-0 w-64 bg-white rounded-xl shadow-2xl border border-gray-200 py-2 z-50 transition-all ${
              isFlyoutOpen ? 'block' : 'hidden group-hover:block'
            }`}
          >
            <div className="px-3.5 py-2 border-b border-gray-100 flex items-center justify-between">
              <span className="text-xs font-bold text-gray-900">{getItemLabel(item)}</span>
              <span className="text-[10px] font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {accessibleChildren.length} items
              </span>
            </div>

            <div className="py-1 max-h-80 overflow-y-auto">
              {accessibleChildren.map(child => {
                const isChildCurrent = activeModule === child.id;
                return (
                  <button
                    key={child.id}
                    type="button"
                    onClick={() => {
                      onModuleChange(child.id);
                      setFlyoutOpenItemId(null);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3.5 py-2 text-xs text-left transition-colors cursor-pointer ${
                      isChildCurrent
                        ? 'bg-blue-50 text-blue-700 font-bold'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-gray-900 font-medium'
                    }`}
                  >
                    <span className="text-gray-500 shrink-0">{child.icon}</span>
                    <span className="truncate">{getItemLabel(child)}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <aside 
      ref={flyoutRef}
      className={`bg-white shadow-md border-r border-gray-200 h-full flex flex-col transition-all duration-300 ease-in-out shrink-0 z-20 ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Sidebar Header */}
      <div className={`border-b border-gray-200 flex items-center transition-all ${
        isCollapsed ? 'p-3 flex-col justify-center gap-2' : 'p-4 justify-between'
      }`}>
        <div 
          onClick={isCollapsed ? toggleCollapse : undefined}
          className={`flex items-center space-x-3 overflow-hidden ${isCollapsed ? 'cursor-pointer' : ''}`}
        >
          <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center shrink-0 shadow-xs hover:bg-blue-700 transition-colors">
            <Building className="w-6 h-6 text-white" />
          </div>
          {!isCollapsed && (
            <div className="min-w-0">
              <h1 className="text-base font-bold text-gray-900 truncate">VerticalHRM</h1>
              <p className="text-[11px] text-gray-500 truncate font-medium">HR Management</p>
            </div>
          )}
        </div>

        {/* The Single Collapse / Expand Widget */}
        <button
          type="button"
          onClick={toggleCollapse}
          className={`p-1.5 rounded-lg border border-gray-200 transition-colors shrink-0 ${
            isCollapsed 
              ? 'text-gray-600 hover:text-blue-600 hover:bg-blue-50 bg-gray-50' 
              : 'text-gray-400 hover:text-gray-700 hover:bg-gray-100 bg-white'
          }`}
          title={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? (
            <PanelLeftOpen className="w-4 h-4" />
          ) : (
            <PanelLeftClose className="w-4 h-4" />
          )}
        </button>
      </div>
      
      {/* Navigation List */}
      <nav className={`mt-3 flex-1 overflow-y-auto ${isCollapsed ? 'px-2 overflow-x-visible' : 'px-1'}`}>
        {menuItems.map(item => 
          isCollapsed ? renderCollapsedItem(item) : renderExpandedItem(item)
        )}
      </nav>
    </aside>
  );
};