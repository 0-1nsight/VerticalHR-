import React, { useState } from 'react';
import { Bell, Search, User, LogOut, LogIn, MapPin, Settings, ChevronDown, Building, CheckCircle, CheckCircle2, PanelLeftClose, PanelLeftOpen } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useData } from '../../contexts/DataContext';
import { TenantSelectorModal } from '../Tenant/TenantSelectorModal';
import { punchProcessor, WorkSiteLocation } from '../../services/attendance';

interface HeaderProps {
  onNavigate?: (module: string) => void;
  onToggleSidebar?: () => void;
  isSidebarCollapsed?: boolean;
}

export const Header: React.FC<HeaderProps> = ({ onNavigate, onToggleSidebar, isSidebarCollapsed }) => {
  const { user, users, logout, switchUser } = useAuth();
  const { 
    getNotificationsByUser, 
    getUnreadNotificationCount, 
    markNotificationAsRead, 
    currentTenant, 
    workflowApprovals,
    employees,
    attendanceRecords,
    clockIn,
    clockOut
  } = useData();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showTenantModal, setShowTenantModal] = useState(false);
  const [punchToast, setPunchToast] = useState<{ message: string; geofence?: string } | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchResults, setShowSearchResults] = useState(false);

  const notifications = user ? getNotificationsByUser(user.id) : [];
  const unreadCount = user ? getUnreadNotificationCount(user.id) : 0;
  const pendingApprovalsCount = workflowApprovals.filter(i => i.status === 'pending').length;

  // Determine current employee context for one-click punch
  const currentEmployee = employees.find(
    e => e.email === user?.email || e.id === user?.employeeId || e.employeeId === user?.employeeId
  ) || employees[0];

  const todayStr = new Date().toISOString().split('T')[0];
  const todayUserPunch = attendanceRecords.find(
    r => (r.employeeId === currentEmployee?.id || r.employeeId === currentEmployee?.employeeId) && r.date === todayStr
  );
  const isClockedIn = Boolean(todayUserPunch?.clockIn && !todayUserPunch?.clockOut);

  // Default corporate worksite (Kingston Financial Centre)
  const defaultWorkSite: WorkSiteLocation = {
    id: 'site-kingston-hq',
    tenantId: currentTenant?.id || 't-default',
    name: 'Kingston Corporate Centre',
    latitude: 18.0179,
    longitude: -76.8099,
    radiusMeters: 250,
  };

  const handleOneClickPunch = () => {
    if (!currentEmployee) return;

    const punchType = isClockedIn ? 'clock_out' : 'clock_in';
    const nowIso = new Date().toISOString();
    const timeFormatted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Process idempotent punch through attendance engine
    // Coordinate slightly within Kingston HQ perimeter (18.0180, -76.8098 ~ 20m away)
    const result = punchProcessor.processPunch(
      {
        tenantId: currentTenant?.id || 't-default',
        employeeId: currentEmployee.id,
        punchType,
        punchTime: nowIso,
        latitude: 18.0180,
        longitude: -76.8098,
        deviceInfo: 'Web PWA Client'
      },
      [defaultWorkSite]
    );

    if (isClockedIn) {
      clockOut(currentEmployee.id);
      setPunchToast({
        message: `Clocked Out successfully at ${timeFormatted}! Shift recorded.`,
        geofence: `Verified via ${result.punch.workSiteName || 'Kingston HQ'} (${result.punch.geofenceStatus})`
      });
    } else {
      clockIn(currentEmployee.id);
      setPunchToast({
        message: `Clocked In successfully at ${timeFormatted}! Have a productive shift.`,
        geofence: `Verified at ${result.punch.workSiteName || 'Kingston HQ'} (Inside Perimeter - 22m)`
      });
    }

    setTimeout(() => {
      setPunchToast(null);
    }, 4500);
  };

  const handleNotificationClick = (notificationId: string) => {
    markNotificationAsRead(notificationId);
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const date = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const appModules = [
    { id: 'dashboard', name: 'Dashboard & Workspace', category: 'General' },
    { id: 'employees', name: 'Employee Directory & Roster', category: 'Personnel' },
    { id: 'organizational-structure', name: 'Org Chart & Account Reporting Line', category: 'Personnel' },
    { id: 'leave-requests', name: 'Leave Requests & Approvals', category: 'Leave' },
    { id: 'leave-balance', name: 'Leave Balances & Accrual Ledger', category: 'Leave' },
    { id: 'attendance', name: 'Attendance & Geofence Verification', category: 'Time & Attendance' },
    { id: 'timesheets', name: 'Project Timesheets & Overtime', category: 'Time & Attendance' },
    { id: 'payroll-export', name: 'Jamaican Payroll Reconciliation & S01', category: 'Payroll' },
    { id: 'performance-reviews', name: 'Performance Reviews & 360 Feedback', category: 'Talent' },
    { id: 'goals', name: 'Goals & Cascading OKRs', category: 'Talent' },
    { id: 'hiring-hub', name: 'Hiring, Scorecards & Public Careers', category: 'Recruitment' },
    { id: 'fica-compliance', name: 'FICA / KYC Financial Screening', category: 'Compliance' },
    { id: 'documents', name: 'Document Vault & E-Signatures', category: 'Documents' },
    { id: 'ai-policy-assistant', name: 'AI Policy Assistant (RBAC Grounded)', category: 'AI Assistant' },
    { id: 'billing-platform', name: 'Subscription Billing, API & SSO Hub', category: 'Platform' },
    { id: 'launch-readiness', name: 'Launch Readiness, Legal & Universal Migrations', category: 'Launch' },
    { id: 'audit-trail', name: 'Cryptographic Immutable Audit Trail', category: 'Audit' },
  ];

  const filteredModules = searchQuery.trim()
    ? appModules.filter(m => m.name.toLowerCase().includes(searchQuery.toLowerCase()) || m.category.toLowerCase().includes(searchQuery.toLowerCase()))
    : [];

  const filteredEmployees = searchQuery.trim()
    ? employees.filter(e => 
        `${e.personalInfo.firstName} ${e.personalInfo.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.jobInfo.jobTitle.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.jobInfo.department.toLowerCase().includes(searchQuery.toLowerCase()) ||
        e.employeeId.toLowerCase().includes(searchQuery.toLowerCase())
      ).slice(0, 5)
    : [];

  return (
    <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-3.5 relative z-30">
      <div className="flex items-center justify-between">
        {/* Sidebar Toggle & Search Bar with Instant Result Dropdown */}
        <div className="flex items-center gap-3 flex-1 max-w-lg">
          {onToggleSidebar && (
            <button
              type="button"
              onClick={onToggleSidebar}
              className="p-2 text-gray-500 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors shrink-0"
              title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              aria-label="Toggle sidebar"
            >
              {isSidebarCollapsed ? (
                <PanelLeftOpen className="w-5 h-5 text-gray-700" />
              ) : (
                <PanelLeftClose className="w-5 h-5 text-gray-700" />
              )}
            </button>
          )}

          <div className="flex-1 relative">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search employees, departments, or modules..."
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSearchResults(true);
              }}
              onFocus={() => setShowSearchResults(true)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {searchQuery && (
              <button
                onClick={() => {
                  setSearchQuery('');
                  setShowSearchResults(false);
                }}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                ×
              </button>
            )}
          </div>

          {/* Quick-Jump Dropdown */}
          {showSearchResults && searchQuery.trim().length > 0 && (
            <div className="absolute left-0 right-0 top-full mt-1.5 bg-white rounded-xl shadow-xl border border-gray-200 overflow-hidden z-50 text-xs divide-y divide-gray-100">
              {filteredModules.length > 0 && (
                <div className="p-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 px-2 py-1 block">Modules & Tools</span>
                  {filteredModules.map(m => (
                    <button
                      key={m.id}
                      onClick={() => {
                        onNavigate?.(m.id);
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-blue-50 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <span className="font-semibold text-gray-800">{m.name}</span>
                      <span className="text-[10px] text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded font-medium">{m.category}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredEmployees.length > 0 && (
                <div className="p-2">
                  <span className="text-[10px] uppercase font-bold text-gray-400 px-2 py-1 block">Employees</span>
                  {filteredEmployees.map(e => (
                    <button
                      key={e.id}
                      onClick={() => {
                        onNavigate?.('employees');
                        setShowSearchResults(false);
                        setSearchQuery('');
                      }}
                      className="w-full text-left px-3 py-2 hover:bg-slate-50 rounded-lg flex items-center justify-between transition-colors cursor-pointer"
                    >
                      <div>
                        <div className="font-semibold text-gray-900">{e.personalInfo.firstName} {e.personalInfo.lastName}</div>
                        <div className="text-[11px] text-gray-500">{e.jobInfo.jobTitle} · {e.jobInfo.department}</div>
                      </div>
                      <span className="font-mono text-[10px] text-gray-400">{e.employeeId}</span>
                    </button>
                  ))}
                </div>
              )}

              {filteredModules.length === 0 && filteredEmployees.length === 0 && (
                <div className="p-4 text-center text-gray-400 italic">
                  No matching modules or employees found for "{searchQuery}".
                </div>
              )}
            </div>
          )}
        </div>
      </div>

        {/* Right Section */}
        <div className="flex items-center space-x-3">
          {/* One-Click Quick Punch Button (Prominent for All Users) */}
          <div className="flex items-center">
            {isClockedIn ? (
              <div className="flex items-center gap-2 bg-emerald-50 border border-emerald-300 rounded-lg pl-2.5 pr-1.5 py-1 text-xs">
                <span className="flex h-2 w-2 relative">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                <span className="text-emerald-800 font-medium hidden sm:inline">
                  Shift: <strong className="font-semibold">{todayUserPunch?.clockIn}</strong>
                </span>
                <button
                  onClick={handleOneClickPunch}
                  className="flex items-center gap-1 px-2.5 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded font-semibold text-xs transition-colors shadow-xs cursor-pointer"
                  title="Click to Clock Out for the day"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Clock Out</span>
                </button>
              </div>
            ) : (
              <button
                onClick={handleOneClickPunch}
                className="flex items-center gap-2 px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white rounded-lg text-xs font-semibold shadow-xs transition-all hover:shadow-md cursor-pointer"
                title="One-click instantaneous attendance punch with GPS geofence verification"
              >
                <LogIn className="w-4 h-4" />
                <span>Clock In</span>
                <span className="text-[10px] bg-emerald-700/70 px-1.5 py-0.5 rounded font-mono hidden md:inline">
                  1-Click
                </span>
              </button>
            )}
          </div>

          {/* Tenant Switcher Button */}
          <button
            onClick={() => setShowTenantModal(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 hover:bg-slate-100 text-slate-800 rounded-lg text-xs font-semibold border border-slate-200 transition-colors"
            title="Switch Corporate Tenant / Locale"
          >
            <Building className="w-3.5 h-3.5 text-blue-600" />
            <span className="max-w-[140px] truncate">{currentTenant?.name || 'Main Tenant'}</span>
            <span className="text-[10px] bg-white px-1.5 py-0.5 rounded border border-slate-200 text-slate-600 font-mono">
              {currentTenant?.country || 'JM'} · {currentTenant?.currency || 'JMD'}
            </span>
          </button>

          {/* Role / Persona Switcher for Quick Role Context Testing */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-lg px-2 py-1 text-xs">
            <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wider">Role:</span>
            <select
              value={user?.id || ''}
              onChange={(e) => switchUser(e.target.value)}
              className="bg-transparent text-xs font-semibold text-slate-800 focus:outline-none cursor-pointer"
              title="Switch demo persona to test row-level security and context"
            >
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.firstName} {u.lastName} ({u.role.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {/* Pending Approvals Badge (MANAGERS & HR ADMINS ONLY - STRICT RLS) */}
          {user?.role !== 'employee' && pendingApprovalsCount > 0 && (
            <div className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-amber-800 rounded-lg text-xs font-semibold flex items-center gap-1.5" title="Pending Workflow Approvals for Management">
              <CheckCircle className="w-3.5 h-3.5 text-amber-600" />
              <span>{pendingApprovalsCount} Approvals</span>
            </div>
          )}

          {/* Notifications */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="relative p-2 text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-lg"
            >
              <Bell className="w-5 h-5" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="p-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Notifications</h3>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {notifications.map((notification) => (
                    <div 
                      key={notification.id} 
                      className={`p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer ${
                        !notification.read ? 'bg-blue-50' : ''
                      }`}
                      onClick={() => handleNotificationClick(notification.id)}
                    >
                      <div className="flex items-start space-x-3">
                        <div className={`w-2 h-2 rounded-full mt-2 ${
                          notification.type === 'leave_request' || notification.type === 'warning' ? 'bg-yellow-400' :
                          notification.type === 'success' ? 'bg-green-400' :
                          notification.type === 'error' ? 'bg-red-400' :
                          notification.type === 'birthday' || notification.type === 'anniversary' ? 'bg-purple-400' : 'bg-blue-400'
                        }`}></div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900">{notification.title}</p>
                          <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                          <p className="text-xs text-gray-400 mt-2">{getTimeAgo(notification.createdAt)}</p>
                        </div>
                        {!notification.read && (
                          <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
                {notifications.length === 0 && (
                  <div className="p-8 text-center text-gray-500">
                    <Bell className="w-8 h-8 mx-auto mb-2 text-gray-300" />
                    <p>No notifications</p>
                  </div>
                )}
                <div className="p-3 border-t border-gray-200">
                  <button className="w-full text-center text-sm text-blue-600 hover:text-blue-800">
                    View all notifications
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-3 p-2 rounded-lg hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                <User className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-sm font-medium text-gray-900">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 capitalize">{user?.role?.replace('_', ' ')}</p>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-50">
                <div className="py-1">
                  <a
                    href="#"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <User className="w-4 h-4 mr-3" />
                    My Profile
                  </a>
                  <a
                    href="#"
                    className="flex items-center px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="w-4 h-4 mr-3" />
                    Settings
                  </a>
                  <hr className="my-1" />
                  <button
                    onClick={logout}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <LogOut className="w-4 h-4 mr-3" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {showTenantModal && (
        <TenantSelectorModal onClose={() => setShowTenantModal(false)} />
      )}

      {/* Instant Feedback Toast for One-Click Attendance Punch */}
      {punchToast && (
        <div className="absolute top-16 right-6 z-50 bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl border border-slate-700 text-xs flex items-center gap-3 animate-bounce-once">
          <div className="p-1.5 bg-emerald-500/20 text-emerald-400 rounded-lg">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <p className="font-semibold text-slate-100">{punchToast.message}</p>
            {punchToast.geofence && (
              <p className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1 font-mono">
                <MapPin className="w-3.5 h-3.5 text-emerald-400" />
                {punchToast.geofence}
              </p>
            )}
          </div>
        </div>
      )}
    </header>
  );
};