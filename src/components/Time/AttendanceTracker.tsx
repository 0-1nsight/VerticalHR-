import React, { useState, useEffect } from 'react';
import { 
  Calendar, 
  Search, 
  LogIn, 
  LogOut, 
  Plus,
  X
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { AttendanceRecord } from '../../types';

export const AttendanceTracker: React.FC = () => {
  const { employees, attendanceRecords, addAttendanceRecord, clockIn, clockOut } = useData();
  const { user } = useAuth();

  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [showManualModal, setShowManualModal] = useState(false);

  const [manualForm, setManualForm] = useState({
    employeeId: employees[0]?.id || '',
    date: new Date().toISOString().split('T')[0],
    clockIn: '09:00 AM',
    clockOut: '05:00 PM',
    status: 'present' as AttendanceRecord['status'],
    workingHours: 8.0,
    notes: ''
  });

  // Ticking clock for real-time punch widget
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const isEmployee = user?.role === 'employee';
  const currentEmployee = employees.find(
    e => e.email === user?.email || e.id === user?.employeeId || e.employeeId === user?.employeeId
  ) || employees[0];
  const currentEmpId = currentEmployee?.id || '1';
  const currentEmpCode = currentEmployee?.employeeId || 'EMP001';

  const todayStr = new Date().toISOString().split('T')[0];
  const todayUserPunch = attendanceRecords.find(
    r => (r.employeeId === currentEmpId || r.employeeId === currentEmpCode) && r.date === todayStr
  );

  const isClockedIn = Boolean(todayUserPunch?.clockIn && !todayUserPunch?.clockOut);

  const handlePunchToggle = () => {
    if (!currentEmployee) return;
    if (isClockedIn) {
      clockOut(currentEmployee.id);
    } else {
      clockIn(currentEmployee.id);
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addAttendanceRecord({
      employeeId: isEmployee ? currentEmpId : manualForm.employeeId,
      date: manualForm.date,
      clockIn: manualForm.clockIn,
      clockOut: manualForm.clockOut,
      status: manualForm.status,
      workingHours: Number(manualForm.workingHours),
      notes: manualForm.notes
    });
    setShowManualModal(false);
  };

  // Enriched logs with employee names & departments scoped under RLS
  const scopedRecords = isEmployee 
    ? attendanceRecords.filter(r => r.employeeId === currentEmpId || r.employeeId === currentEmpCode)
    : attendanceRecords;

  const enrichedRecords = scopedRecords.map(r => {
    const emp = employees.find(e => e.id === r.employeeId || e.employeeId === r.employeeId);
    return {
      ...r,
      employeeName: emp ? `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : `Employee #${r.employeeId}`,
      department: emp?.jobInfo.department || 'N/A'
    };
  });

  const filteredRecords = enrichedRecords.filter(r => {
    const matchesSearch = r.employeeName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || r.status === selectedStatus;
    const matchesDate = !selectedDate || r.date === selectedDate;
    return matchesSearch && matchesStatus && matchesDate;
  });

  // Metrics (Personalized for Employee, Enterprise for Managers)
  const myTotalPresent = scopedRecords.filter(r => r.status === 'present').length;
  const myTotalLate = scopedRecords.filter(r => r.status === 'late').length;
  const myHoursLogged = scopedRecords.reduce((sum, r) => sum + (r.workingHours || 0), 0).toFixed(1);

  const todayRecords = attendanceRecords.filter(r => r.date === todayStr);
  const presentCount = todayRecords.filter(r => r.status === 'present').length;
  const lateCount = todayRecords.filter(r => r.status === 'late').length;
  const onLeaveCount = todayRecords.filter(r => r.status === 'on_leave').length;

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time & Attendance Tracking</h1>
          <p className="text-gray-600 text-sm mt-1">Real-time punch clock, daily roster verification, and punctuality oversight</p>
        </div>
        <button
          onClick={() => setShowManualModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-sm font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Log Manual Punch
        </button>
      </div>

      {/* Hero Punch Widget + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Clock Card */}
        <div className="bg-gradient-to-br from-slate-900 to-slate-800 text-white p-6 rounded-xl shadow-md flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between text-xs text-slate-300 uppercase tracking-wider font-semibold">
              <span>Virtual Punch Clock</span>
              <span className="flex items-center gap-1.5 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                System Live
              </span>
            </div>

            <div className="mt-4">
              <div className="text-3xl font-extrabold tracking-tight">
                {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
              </div>
              <p className="text-xs text-slate-400 mt-1">
                {currentTime.toLocaleDateString(undefined, { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
              </p>
            </div>

            <div className="mt-4 p-3 bg-white/10 rounded-lg text-xs space-y-1">
              <div className="flex justify-between text-slate-300">
                <span>Logged as:</span>
                <span className="font-semibold text-white">{currentEmployee?.personalInfo.firstName} {currentEmployee?.personalInfo.lastName}</span>
              </div>
              <div className="flex justify-between text-slate-300">
                <span>Today's Clock In:</span>
                <span className="text-white font-medium">{todayUserPunch?.clockIn || 'Not clocked in'}</span>
              </div>
              {todayUserPunch?.clockOut && (
                <div className="flex justify-between text-slate-300">
                  <span>Today's Clock Out:</span>
                  <span className="text-white font-medium">{todayUserPunch.clockOut}</span>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handlePunchToggle}
              className={`w-full py-3 px-4 rounded-lg font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                isClockedIn 
                  ? 'bg-amber-600 hover:bg-amber-700 text-white' 
                  : 'bg-emerald-600 hover:bg-emerald-700 text-white'
              }`}
            >
              {isClockedIn ? (
                <>
                  <LogOut className="w-4 h-4" />
                  Clock Out For The Day
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" />
                  Clock In Now
                </>
              )}
            </button>
          </div>
        </div>

        {/* Attendance Summary KPIs */}
        <div className="lg:col-span-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {isEmployee ? 'My Days Present' : 'Present On-Duty'}
              </span>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {isEmployee ? myTotalPresent : presentCount}
              </p>
              <span className="text-xs text-emerald-600 mt-1 block">
                {isEmployee ? 'Verified shifts logged' : 'Active on shift today'}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-4">
              <div 
                className="bg-emerald-500 h-full" 
                style={{ width: `${isEmployee ? 100 : employees.length ? (presentCount / employees.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {isEmployee ? 'Total Hours Worked' : 'Late Arrivals'}
              </span>
              <p className="text-3xl font-bold text-amber-600 mt-2">
                {isEmployee ? `${myHoursLogged} hrs` : lateCount}
              </p>
              <span className="text-xs text-gray-500 mt-1 block">
                {isEmployee ? 'Accumulated duty duration' : 'Clocked past grace window'}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-4">
              <div 
                className="bg-amber-500 h-full" 
                style={{ width: `${isEmployee ? 85 : employees.length ? (lateCount / employees.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>

          <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs flex flex-col justify-between">
            <div>
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider">
                {isEmployee ? 'Late / Grace Flags' : 'On Approved Leave'}
              </span>
              <p className="text-3xl font-bold text-blue-600 mt-2">
                {isEmployee ? myTotalLate : onLeaveCount}
              </p>
              <span className="text-xs text-gray-500 mt-1 block">
                {isEmployee ? 'Punctuality records' : 'Scheduled PTO / sick days'}
              </span>
            </div>
            <div className="w-full bg-gray-100 h-1.5 rounded-full overflow-hidden mt-4">
              <div 
                className="bg-blue-500 h-full" 
                style={{ width: `${isEmployee ? (myTotalLate ? 20 : 0) : employees.length ? (onLeaveCount / employees.length) * 100 : 0}%` }}
              ></div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search employee attendance logs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="present">Present</option>
            <option value="late">Late Arrival</option>
            <option value="half_day">Half Day</option>
            <option value="on_leave">On Leave</option>
            <option value="absent">Absent</option>
          </select>
        </div>
      </div>

      {/* Logs Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Department</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Clock In</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Clock Out</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Work Hours</th>
                <th className="px-6 py-3.5 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3.5 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {filteredRecords.map((r) => (
                <tr key={r.id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{r.employeeName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {r.department}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {r.date}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-900">
                    {r.clockIn || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                    {r.clockOut || '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-semibold text-gray-800">
                    {r.workingHours ? `${r.workingHours} hrs` : '—'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                      r.status === 'present' ? 'bg-emerald-50 text-emerald-700' :
                      r.status === 'late' ? 'bg-amber-50 text-amber-700' :
                      r.status === 'on_leave' ? 'bg-blue-50 text-blue-700' :
                      'bg-red-50 text-red-700'
                    }`}>
                      {r.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">
                    {r.notes || 'Normal entry'}
                  </td>
                </tr>
              ))}
              {filteredRecords.length === 0 && (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-sm text-gray-500">
                    No attendance records found for this period.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Manual Entry Modal */}
      {showManualModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Manual Punch Entry</h3>
              <button onClick={() => setShowManualModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleManualSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employee</label>
                {isEmployee ? (
                  <div className="w-full px-3 py-2 text-sm bg-gray-50 border border-gray-300 rounded-lg text-gray-800 font-semibold">
                    {currentEmployee.personalInfo.firstName} {currentEmployee.personalInfo.lastName} ({currentEmployee.jobInfo.department})
                  </div>
                ) : (
                  <select
                    value={manualForm.employeeId}
                    onChange={(e) => setManualForm({ ...manualForm, employeeId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {employees.map(e => (
                      <option key={e.id} value={e.id}>
                        {e.personalInfo.firstName} {e.personalInfo.lastName} ({e.jobInfo.department})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  required
                  value={manualForm.date}
                  onChange={(e) => setManualForm({ ...manualForm, date: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Clock In Time</label>
                  <input
                    type="text"
                    placeholder="09:00 AM"
                    value={manualForm.clockIn}
                    onChange={(e) => setManualForm({ ...manualForm, clockIn: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Clock Out Time</label>
                  <input
                    type="text"
                    placeholder="05:00 PM"
                    value={manualForm.clockOut}
                    onChange={(e) => setManualForm({ ...manualForm, clockOut: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={manualForm.status}
                    onChange={(e) => setManualForm({ ...manualForm, status: e.target.value as AttendanceRecord['status'] })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="present">Present</option>
                    <option value="late">Late</option>
                    <option value="half_day">Half Day</option>
                    <option value="on_leave">On Leave</option>
                    <option value="absent">Absent</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Working Hours</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0"
                    max="24"
                    value={manualForm.workingHours}
                    onChange={(e) => setManualForm({ ...manualForm, workingHours: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Reason / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Off-site client meeting or forgot badge"
                  value={manualForm.notes}
                  onChange={(e) => setManualForm({ ...manualForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowManualModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  Record Attendance
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
