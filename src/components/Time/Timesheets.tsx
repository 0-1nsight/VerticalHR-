import React, { useState, useEffect } from 'react';
import { 
  CheckCircle2, 
  XCircle, 
  Plus, 
  Send, 
  Calendar, 
  X
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { TimesheetRecord, TimesheetEntry } from '../../types';

export const Timesheets: React.FC = () => {
  const { employees, timesheets, addTimesheet, updateTimesheet } = useData();
  const { user } = useAuth();

  const isEmployee = user?.role === 'employee';
  const currentEmp = employees.find(
    e => e.email === user?.email || e.id === user?.employeeId || e.employeeId === user?.employeeId
  ) || employees[0];
  const currentEmpId = currentEmp?.id || user?.employeeId || '1';
  const currentEmpCode = currentEmp?.employeeId || 'EMP001';

  const visibleTimesheets = isEmployee
    ? timesheets.filter(ts => ts.employeeId === currentEmpId || ts.employeeId === currentEmpCode)
    : timesheets;

  const [selectedTimesheet, setSelectedTimesheet] = useState<TimesheetRecord | null>(visibleTimesheets[0] || null);
  const [showNewModal, setShowNewModal] = useState(false);
  const [newEntries, setNewEntries] = useState<Omit<TimesheetEntry, 'id'>[]>([
    { day: 'Monday', date: '2026-11-02', project: 'HR Platform Core', task: 'Development and testing', hours: 8 },
    { day: 'Tuesday', date: '2026-11-03', project: 'HR Platform Core', task: 'Feature implementation', hours: 8 },
    { day: 'Wednesday', date: '2026-11-04', project: 'Client Integration', task: 'API synchronization', hours: 8 },
    { day: 'Thursday', date: '2026-11-05', project: 'Client Integration', task: 'Client demo & adjustments', hours: 8 },
    { day: 'Friday', date: '2026-11-06', project: 'Operations', task: 'Team sprint retro & support', hours: 8 },
  ]);

  useEffect(() => {
    if (!selectedTimesheet || !visibleTimesheets.some(ts => ts.id === selectedTimesheet.id)) {
      setSelectedTimesheet(visibleTimesheets[0] || null);
    }
  }, [visibleTimesheets, selectedTimesheet]);

  const canApprove = !isEmployee && (user?.role === 'admin' || user?.role === 'hr_manager' || user?.role === 'line_manager' || user?.role === 'super_admin' || user?.role === 'supervisor');

  const handleCreateTimesheet = (e: React.FormEvent) => {
    e.preventDefault();
    const entriesWithIds: TimesheetEntry[] = newEntries.map((entry, idx) => ({
      ...entry,
      id: `entry-${Date.now()}-${idx}`
    }));
    const totalHours = entriesWithIds.reduce((sum, item) => sum + item.hours, 0);

    addTimesheet({
      employeeId: currentEmpId,
      weekStartDate: newEntries[0].date,
      weekEndDate: newEntries[newEntries.length - 1].date,
      entries: entriesWithIds,
      totalHours,
      status: 'submitted',
      submittedAt: new Date().toISOString(),
      comments: 'Weekly hours submitted for review.'
    });

    setShowNewModal(false);
  };

  const handleUpdateEntryHours = (idx: number, hours: number) => {
    const updated = [...newEntries];
    updated[idx].hours = Math.max(0, Math.min(24, hours));
    setNewEntries(updated);
  };

  const handleUpdateEntryTask = (idx: number, task: string) => {
    const updated = [...newEntries];
    updated[idx].task = task;
    setNewEntries(updated);
  };

  const handleUpdateEntryProject = (idx: number, project: string) => {
    const updated = [...newEntries];
    updated[idx].project = project;
    setNewEntries(updated);
  };

  const handleApprove = (id: string) => {
    updateTimesheet(id, {
      status: 'approved',
      comments: 'Approved by manager.'
    });
    if (selectedTimesheet?.id === id) {
      setSelectedTimesheet(prev => prev ? { ...prev, status: 'approved', comments: 'Approved by manager.' } : null);
    }
  };

  const handleReject = (id: string) => {
    const comment = 'Hours require revision by submitter.';
    updateTimesheet(id, {
      status: 'rejected',
      comments: comment
    });
    if (selectedTimesheet?.id === id) {
      setSelectedTimesheet(prev => prev ? { ...prev, status: 'rejected', comments: comment } : null);
    }
  };

  const getEmployeeName = (empId: string) => {
    const emp = employees.find(e => e.id === empId);
    return emp ? `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : `Employee #${empId}`;
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Weekly Timesheets & Project Hours</h1>
          <p className="text-gray-600 text-sm mt-1">Review activity logs, project time allocations, and approval queues</p>
        </div>
        <button
          onClick={() => setShowNewModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
        >
          <Plus className="w-4 h-4" />
          Submit New Timesheet
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Timesheet List */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="p-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-gray-900">
              {isEmployee ? 'My Submitted Timesheets' : 'Submitted Timesheets'}
            </h2>
            <span className="text-xs text-gray-500">{visibleTimesheets.length} total</span>
          </div>

          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {visibleTimesheets.map(ts => {
              const isSelected = selectedTimesheet?.id === ts.id;
              return (
                <div
                  key={ts.id}
                  onClick={() => setSelectedTimesheet(ts)}
                  className={`p-4 cursor-pointer transition-colors ${
                    isSelected ? 'bg-blue-50/60 border-l-4 border-blue-600' : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold text-gray-900">{getEmployeeName(ts.employeeId)}</p>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${
                      ts.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      ts.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {ts.status}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 mt-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-400" />
                    <span>Week: {ts.weekStartDate} — {ts.weekEndDate}</span>
                  </div>
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-100 text-xs">
                    <span className="text-gray-500">Logged Time:</span>
                    <span className="font-semibold text-gray-900">{ts.totalHours} hrs</span>
                  </div>
                </div>
              );
            })}
            {visibleTimesheets.length === 0 && (
              <div className="p-8 text-center text-sm text-gray-500">
                No timesheets recorded yet. Click "Submit New Timesheet" to create one.
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Timesheet Details & Daily Entries */}
        <div className="lg:col-span-2 space-y-6">
          {selectedTimesheet ? (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-4 border-b border-gray-200">
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-900">
                      Timesheet: {getEmployeeName(selectedTimesheet.employeeId)}
                    </h2>
                    <span className={`text-xs px-2 py-0.5 rounded font-medium capitalize ${
                      selectedTimesheet.status === 'approved' ? 'bg-emerald-50 text-emerald-700' :
                      selectedTimesheet.status === 'rejected' ? 'bg-red-50 text-red-700' :
                      'bg-amber-50 text-amber-700'
                    }`}>
                      {selectedTimesheet.status}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Coverage: {selectedTimesheet.weekStartDate} to {selectedTimesheet.weekEndDate} · Submitted: {new Date(selectedTimesheet.submittedAt || Date.now()).toLocaleDateString()}
                  </p>
                </div>

                {canApprove && selectedTimesheet.status === 'submitted' && (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleApprove(selectedTimesheet.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(selectedTimesheet.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-red-300 text-red-600 hover:bg-red-50 rounded-lg text-xs font-semibold"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      Reject
                    </button>
                  </div>
                )}
              </div>

              {/* Entries Grid */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 text-left text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase">Day & Date</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase">Project</th>
                      <th className="px-4 py-2.5 text-xs font-semibold text-gray-600 uppercase">Task Description</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 uppercase">Hours</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {selectedTimesheet.entries.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-medium text-gray-900">
                          {entry.day} ({entry.date})
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs text-blue-600 font-medium">
                          {entry.project}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-700">
                          {entry.task}
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap text-xs font-bold text-gray-900 text-right">
                          {entry.hours} hrs
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50 border-t-2 border-gray-200">
                      <td colSpan={3} className="px-4 py-3 text-xs font-bold text-gray-900 text-right">
                        Weekly Total Logged:
                      </td>
                      <td className="px-4 py-3 text-sm font-extrabold text-blue-700 text-right">
                        {selectedTimesheet.totalHours} hrs
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {selectedTimesheet.comments && (
                <div className="bg-gray-50 p-4 rounded-lg text-xs text-gray-600">
                  <span className="font-semibold text-gray-900">Notes & Feedback:</span> {selectedTimesheet.comments}
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 shadow-xs p-12 text-center text-gray-500 text-sm">
              Select a timesheet from the list to view daily hours.
            </div>
          )}
        </div>
      </div>

      {/* New Timesheet Modal */}
      {showNewModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Submit Weekly Timesheet</h3>
              <button onClick={() => setShowNewModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateTimesheet} className="p-6 space-y-4 overflow-y-auto flex-1">
              <p className="text-xs text-gray-500">
                Specify projects, tasks, and daily work hours for Monday through Friday.
              </p>

              <div className="space-y-3">
                {newEntries.map((entry, idx) => (
                  <div key={entry.day} className="p-3 bg-gray-50 rounded-lg border border-gray-200 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-gray-900">{entry.day} ({entry.date})</span>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="0"
                          max="24"
                          step="0.5"
                          value={entry.hours}
                          onChange={(e) => handleUpdateEntryHours(idx, Number(e.target.value))}
                          className="w-16 px-2 py-1 text-xs border border-gray-300 rounded font-semibold text-right"
                          required
                        />
                        <span className="text-xs text-gray-500">hrs</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      <input
                        type="text"
                        placeholder="Project Name"
                        value={entry.project}
                        onChange={(e) => handleUpdateEntryProject(idx, e.target.value)}
                        className="px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
                        required
                      />
                      <input
                        type="text"
                        placeholder="Key Task Description"
                        value={entry.task}
                        onChange={(e) => handleUpdateEntryTask(idx, e.target.value)}
                        className="px-2.5 py-1.5 text-xs border border-gray-300 rounded bg-white"
                        required
                      />
                    </div>
                  </div>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-between text-sm font-semibold text-gray-900">
                <span>Total Weekly Hours:</span>
                <span className="text-blue-600 text-base">
                  {newEntries.reduce((sum, item) => sum + item.hours, 0)} hrs
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  <Send className="w-4 h-4" />
                  Submit for Approval
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
