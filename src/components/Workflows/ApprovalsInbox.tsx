import React, { useState } from 'react';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  Filter, 
  Search, 
  Calendar, 
  TrendingUp, 
  UserCheck, 
  ShieldCheck, 
  DollarSign, 
  FileText, 
  Check, 
  ChevronRight,
  X
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { WorkflowApprovalItem } from '../../types';

export const ApprovalsInbox: React.FC = () => {
  const { workflowApprovals, approveWorkflowItem, rejectWorkflowItem, delegateWorkflowItem } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('pending');
  const [selectedItem, setSelectedItem] = useState<WorkflowApprovalItem | null>(null);

  // Modals for actions
  const [actionItem, setActionItem] = useState<{ item: WorkflowApprovalItem; action: 'approve' | 'reject' | 'delegate' } | null>(null);
  const [comments, setComments] = useState('');
  const [delegateTarget, setDelegateTarget] = useState('Priya Sharma (Engineering Lead)');

  const approverName = user ? `${user.firstName} ${user.lastName}` : 'Marcus Sterling (HR Admin)';

  const isEmployee = user?.role === 'employee';
  const isLineManager = user?.role === 'line_manager';
  const isAuditor = user?.role === 'auditor';

  // Row-Level Security: Scoped to logged-in user persona
  const roleScopedApprovals = workflowApprovals.filter(item => {
    if (isEmployee) {
      // Employee sees ONLY requests they submitted
      const myEmpId = user.employeeId || 'EMP001';
      const myFullName = `${user.firstName} ${user.lastName}`.trim().toLowerCase();
      return item.requesterId === myEmpId || 
        item.requesterName.trim().toLowerCase() === myFullName;
    }
    if (isLineManager) {
      // Line manager sees requests assigned to manager or team members
      return item.currentApproverRole === 'line_manager' ||
        item.assignedRole === 'line_manager' || 
        (item.assignedTo && item.assignedTo.toLowerCase().includes(user.lastName.toLowerCase())) ||
        item.department === 'Engineering' ||
        item.requesterId === user.employeeId;
    }
    // Admins, HR managers, and auditors see all records
    return true;
  });

  const filteredItems = roleScopedApprovals.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.requesterName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.department.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'all' || item.type === selectedType;
    const matchesStatus = selectedStatus === 'all' || item.status === selectedStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const pendingCount = roleScopedApprovals.filter(i => i.status === 'pending').length;

  const handleActionSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionItem) return;

    if (actionItem.action === 'approve') {
      approveWorkflowItem(actionItem.item.id, approverName, comments);
    } else if (actionItem.action === 'reject') {
      rejectWorkflowItem(actionItem.item.id, approverName, comments);
    } else if (actionItem.action === 'delegate') {
      delegateWorkflowItem(actionItem.item.id, delegateTarget, approverName);
    }

    setActionItem(null);
    setComments('');
    setSelectedItem(null);
  };

  const handleBatchApprovePending = () => {
    filteredItems.filter(i => i.status === 'pending').forEach(item => {
      approveWorkflowItem(item.id, approverName, 'Bulk approved via Executive Inbox');
    });
  };

  const getTypeIcon = (type: WorkflowApprovalItem['type']) => {
    switch (type) {
      case 'leave': return <Calendar className="w-4 h-4 text-orange-600" />;
      case 'promotion': return <TrendingUp className="w-4 h-4 text-emerald-600" />;
      case 'profile_change': return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'requisition': return <DollarSign className="w-4 h-4 text-purple-600" />;
      case 'document': return <ShieldCheck className="w-4 h-4 text-indigo-600" />;
      default: return <FileText className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <CheckCircle className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">
              {isEmployee ? 'My Requests & Approval Tracking' : 'Unified Workflow & Approvals Center'}
            </h1>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            {isEmployee
              ? 'Track the approval progress of your submitted leave, profile changes, and requests through managerial tiers.'
              : 'Enterprise multi-tier approval chains: Leave requests, promotions, profile changes, and requisitions.'
            }
          </p>
        </div>

        <div className="flex items-center gap-3">
          {pendingCount > 0 && !isEmployee && !isAuditor && (
            <button
              onClick={handleBatchApprovePending}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
            >
              <Check className="w-4 h-4" />
              Batch Approve All Filtered ({filteredItems.filter(i => i.status === 'pending').length})
            </button>
          )}
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Pending Approvals</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-amber-600">{pendingCount}</span>
            <span className="text-xs text-gray-400">awaiting decision</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Completed Decisions</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-emerald-600">
              {workflowApprovals.filter(i => i.status === 'approved').length}
            </span>
            <span className="text-xs text-gray-400">approved</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Declined / Returned</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-rose-600">
              {workflowApprovals.filter(i => i.status === 'rejected').length}
            </span>
            <span className="text-xs text-gray-400">rejected</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Average SLA Response</span>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-blue-600">&lt; 4.2h</span>
            <span className="text-xs text-emerald-600 font-semibold">98% within SLA</span>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search approvals by requester, title, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedType}
              onChange={(e) => setSelectedType(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 capitalize"
            >
              <option value="all">All Request Types</option>
              <option value="leave">Leave Request</option>
              <option value="promotion">Promotion / Merit Pay</option>
              <option value="profile_change">Profile & Bank Change</option>
              <option value="requisition">Job Requisition</option>
              <option value="document">Compliance Document</option>
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending My Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="delegated">Delegated</option>
          </select>
        </div>
      </div>

      {/* Items List */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Approvals Table / Card Column */}
        <div className="lg:col-span-2 space-y-3">
          {filteredItems.length === 0 ? (
            <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
              <CheckCircle className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
              <h3 className="text-base font-semibold text-gray-900">Inbox is All Clear</h3>
              <p className="text-xs text-gray-500 mt-1">No pending approval workflows match your current filter.</p>
            </div>
          ) : (
            filteredItems.map(item => {
              const isSelected = selectedItem?.id === item.id;
              return (
                <div
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className={`bg-white border rounded-xl p-5 shadow-xs transition-all cursor-pointer hover:border-blue-300 ${
                    isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-gray-200'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div className="p-2.5 bg-gray-50 rounded-xl border border-gray-100 shrink-0">
                        {getTypeIcon(item.type)}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-mono font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                            {item.id}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                            item.urgency === 'high' ? 'bg-rose-50 text-rose-700' : 'bg-gray-100 text-gray-600'
                          }`}>
                            {item.urgency}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-gray-900 mt-1">{item.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          Requester: <strong className="text-gray-700 font-semibold">{item.requesterName}</strong> · {item.department}
                        </p>
                      </div>
                    </div>

                    <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize shrink-0 ${
                      item.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      item.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      item.status === 'delegated' ? 'bg-purple-50 text-purple-700 border border-purple-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {item.status}
                    </span>
                  </div>

                  {/* Multi-step Workflow Bar */}
                  <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                    <div className="flex items-center gap-2">
                      <Clock className="w-3.5 h-3.5 text-gray-400" />
                      <span>
                        Stage: Step {item.currentStep} of {item.totalSteps} (
                        {item.currentApproverRole === 'line_manager' ? 'Line Manager Approval' : 'HR Admin Sign-off'}
                        )
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      {item.status === 'pending' && !isEmployee && !isAuditor && (
                        <>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionItem({ item, action: 'reject' });
                              setComments('');
                            }}
                            className="px-2.5 py-1 text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-lg transition-colors"
                          >
                            Reject
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setActionItem({ item, action: 'approve' });
                              setComments('');
                            }}
                            className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg shadow-2xs transition-colors"
                          >
                            Approve
                          </button>
                        </>
                      )}
                      <span className="text-gray-300 ml-1">·</span>
                      <span className="text-blue-600 font-medium inline-flex items-center gap-0.5">
                        Details <ChevronRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Selected Item Detail & Audit Trail Sidebar */}
        <div className="space-y-4">
          {selectedItem ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-5 sticky top-6">
              <div className="flex items-center justify-between border-b pb-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Workflow Request Dossier
                </h4>
                <span className="text-xs font-mono text-gray-400">{selectedItem.id}</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-gray-900">{selectedItem.title}</h3>
                <div className="text-xs text-gray-500 mt-1 space-y-1">
                  <div>Requester: <strong className="text-gray-800">{selectedItem.requesterName}</strong></div>
                  <div>Department: {selectedItem.department}</div>
                  <div>Submitted: {new Date(selectedItem.submittedAt).toLocaleString()}</div>
                </div>
              </div>

              {/* Payload Breakdown */}
              <div className="bg-slate-50 p-3.5 rounded-lg border border-slate-200 text-xs space-y-2">
                <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                  Submission Data
                </span>
                {Object.entries(selectedItem.details).map(([key, val]) => (
                  <div key={key} className="flex justify-between gap-2 border-b border-slate-200/60 pb-1">
                    <span className="text-slate-500 capitalize">{key.replace(/([A-Z])/g, ' $1')}:</span>
                    <span className="font-semibold text-slate-800 text-right">{String(val)}</span>
                  </div>
                ))}
              </div>

              {/* Multi-step Approval Chain History */}
              <div>
                <h5 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-blue-600" />
                  Approval Audit Chain
                </h5>
                <div className="space-y-2 text-xs">
                  {selectedItem.auditTrail.length === 0 ? (
                    <div className="text-gray-400 italic">Awaiting initial stage evaluation.</div>
                  ) : (
                    selectedItem.auditTrail.map((log, idx) => (
                      <div key={idx} className="p-2.5 rounded-lg bg-gray-50 border border-gray-100">
                        <div className="flex items-center justify-between font-semibold text-gray-800">
                          <span>{log.approverName}</span>
                          <span className={`text-[10px] uppercase font-bold px-1.5 py-0.5 rounded ${
                            log.action === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                            log.action === 'rejected' ? 'bg-rose-100 text-rose-800' : 'bg-gray-100 text-gray-700'
                          }`}>
                            {log.action}
                          </span>
                        </div>
                        {log.comments && (
                          <p className="text-gray-600 mt-1 text-[11px] italic">"{log.comments}"</p>
                        )}
                        <span className="text-[10px] text-gray-400 mt-1 block">
                          {new Date(log.timestamp).toLocaleString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              {selectedItem.status === 'pending' && !isEmployee && !isAuditor && (
                <div className="pt-3 border-t border-gray-100 grid grid-cols-2 gap-2">
                  <button
                    onClick={() => setActionItem({ item: selectedItem, action: 'reject' })}
                    className="w-full py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors"
                  >
                    <XCircle className="w-3.5 h-3.5" /> Reject
                  </button>
                  <button
                    onClick={() => setActionItem({ item: selectedItem, action: 'approve' })}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition-colors shadow-2xs"
                  >
                    <CheckCircle className="w-3.5 h-3.5" /> Approve
                  </button>
                  <button
                    onClick={() => setActionItem({ item: selectedItem, action: 'delegate' })}
                    className="col-span-2 py-1.5 text-xs text-gray-600 hover:bg-gray-100 rounded-lg font-medium transition-colors"
                  >
                    Delegate to Colleague...
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-400 shadow-xs">
              Select an item to view complete submission details and approval audit history.
            </div>
          )}
        </div>
      </div>

      {/* Action Dialog (Approve / Reject / Delegate) */}
      {actionItem && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-base font-semibold capitalize">
                {actionItem.action === 'approve' ? 'Confirm Approval' :
                 actionItem.action === 'reject' ? 'Reject Submission' : 'Delegate Workflow Approval'}
              </h3>
              <button onClick={() => setActionItem(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleActionSubmit} className="p-6 space-y-4">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider block">Target Request</span>
                <h4 className="text-sm font-bold text-gray-900">{actionItem.item.title}</h4>
                <p className="text-xs text-gray-500 mt-0.5">Requester: {actionItem.item.requesterName}</p>
              </div>

              {actionItem.action === 'delegate' ? (
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Delegate Responsibility To *</label>
                  <input
                    type="text"
                    required
                    value={delegateTarget}
                    onChange={(e) => setDelegateTarget(e.target.value)}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              ) : null}

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  {actionItem.action === 'reject' ? 'Reason for Rejection *' : 'Approval Comments / Conditions'}
                </label>
                <textarea
                  rows={3}
                  required={actionItem.action === 'reject'}
                  value={comments}
                  onChange={(e) => setComments(e.target.value)}
                  placeholder="e.g. Endorsed in accordance with statutory FICA and company leave policy..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setActionItem(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg transition-colors ${
                    actionItem.action === 'approve' ? 'bg-emerald-600 hover:bg-emerald-700' :
                    actionItem.action === 'reject' ? 'bg-rose-600 hover:bg-rose-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  Confirm {actionItem.action}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
