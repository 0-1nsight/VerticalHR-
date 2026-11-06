import React, { useState } from 'react';
import { Calendar, Clock, Check, X, Eye, Plus, Filter } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

export const LeaveRequests: React.FC = () => {
  const { leaveRequests, employees, leaveTypes, updateLeaveRequest, addLeaveRequest } = useData();
  const { user } = useAuth();
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showNewRequestForm, setShowNewRequestForm] = useState(false);

  const [newRequest, setNewRequest] = useState({
    leaveTypeId: '',
    startDate: '',
    endDate: '',
    reason: '',
  });

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` : 'N/A';
  };

  const getLeaveTypeName = (leaveTypeId: string) => {
    const leaveType = leaveTypes.find(type => type.id === leaveTypeId);
    return leaveType ? leaveType.name : 'N/A';
  };

  const currentEmp = employees.find(
    e => e.email === user?.email || e.id === user?.employeeId || e.employeeId === user?.employeeId
  ) || employees[0];
  const currentEmpId = currentEmp?.id || '1';
  const currentEmpCode = currentEmp?.employeeId || 'EMP001';

  const isEmployee = user?.role === 'employee';
  const baseRequests = isEmployee
    ? leaveRequests.filter(req => req.employeeId === currentEmpId || req.employeeId === currentEmpCode)
    : leaveRequests;

  const filteredRequests = baseRequests.filter(request => {
    if (selectedStatus === 'all') return true;
    return request.status === selectedStatus;
  });

  const canApproveRequests = user?.role === 'admin' || user?.role === 'hr_manager' || user?.role === 'super_admin' || user?.role === 'line_manager';

  const handleApproveRequest = (requestId: string) => {
    const request = leaveRequests.find(req => req.id === requestId);
    if (request) {
      if (user?.role === 'supervisor' && request.status === 'pending') {
        // Supervisor approval - move to HR approval
        updateLeaveRequest(requestId, {
          status: 'supervisor_approved',
          supervisorApproval: {
            approverId: user.id,
            approvedAt: new Date().toISOString(),
            status: 'approved',
            comments: 'Approved by supervisor'
          }
        });
      } else if ((user?.role === 'admin' || user?.role === 'hr_manager') && request.status === 'supervisor_approved') {
        // HR/Admin final approval
        updateLeaveRequest(requestId, {
          status: 'hr_approved',
          hrApproval: {
            approverId: user.id,
            approvedAt: new Date().toISOString(),
            status: 'approved',
            comments: 'Final approval by HR'
          }
        });
      }
    }
  };

  const handleRejectRequest = (requestId: string) => {
    const reason = 'Coverage requirements not met for requested dates';
    if (reason) {
      const request = leaveRequests.find(req => req.id === requestId);
      if (request) {
        if (user?.role === 'supervisor' && request.status === 'pending') {
          updateLeaveRequest(requestId, {
            status: 'rejected',
            supervisorApproval: {
              approverId: user.id,
              approvedAt: new Date().toISOString(),
              status: 'rejected',
              comments: reason
            }
          });
        } else if ((user?.role === 'admin' || user?.role === 'hr_manager')) {
          updateLeaveRequest(requestId, {
            status: 'rejected',
            hrApproval: {
              approverId: user.id,
              approvedAt: new Date().toISOString(),
              status: 'rejected',
              comments: reason
            }
          });
        }
      }
    }
  };

  const handleSubmitNewRequest = (e: React.FormEvent) => {
    e.preventDefault();
    
    const startDate = new Date(newRequest.startDate);
    const endDate = new Date(newRequest.endDate);
    const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;

    addLeaveRequest({
      employeeId: isEmployee ? currentEmpId : (user?.employeeId || user?.id || currentEmpId),
      leaveTypeId: newRequest.leaveTypeId,
      startDate: newRequest.startDate,
      endDate: newRequest.endDate,
      days: diffDays,
      reason: newRequest.reason,
      status: 'pending',
    });

    setNewRequest({
      leaveTypeId: '',
      startDate: '',
      endDate: '',
      reason: '',
    });
    setShowNewRequestForm(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'hr_approved':
        return 'bg-green-100 text-green-800';
      case 'supervisor_approved':
        return 'bg-blue-100 text-blue-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Leave Requests</h1>
          <p className="text-gray-600 mt-1">Manage leave requests and applications</p>
        </div>
        <div className="flex items-center space-x-3 mt-4 sm:mt-0">
          <button
            onClick={() => setShowNewRequestForm(true)}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
          >
            <Plus className="w-4 h-4 mr-2" />
            New Request
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <span className="text-sm font-medium text-gray-700">Filter by status:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* New Request Form Modal */}
      {showNewRequestForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">New Leave Request</h3>
              
              <form onSubmit={handleSubmitNewRequest} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Leave Type
                  </label>
                  <select
                    value={newRequest.leaveTypeId}
                    onChange={(e) => setNewRequest({ ...newRequest, leaveTypeId: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select Leave Type</option>
                    {leaveTypes.map((type) => (
                      <option key={type.id} value={type.id}>{type.name}</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Start Date
                    </label>
                    <input
                      type="date"
                      value={newRequest.startDate}
                      onChange={(e) => setNewRequest({ ...newRequest, startDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      End Date
                    </label>
                    <input
                      type="date"
                      value={newRequest.endDate}
                      onChange={(e) => setNewRequest({ ...newRequest, endDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Reason
                  </label>
                  <textarea
                    value={newRequest.reason}
                    onChange={(e) => setNewRequest({ ...newRequest, reason: e.target.value })}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Please provide reason for leave..."
                    required
                  />
                </div>

                <div className="flex items-center justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowNewRequestForm(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                  >
                    Submit Request
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Leave Requests List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            {user?.role === 'employee' ? 'My Leave Requests' : 'All Leave Requests'}
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {filteredRequests.map((request) => (
            <div key={request.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      {getEmployeeName(request.employeeId)}
                    </h4>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(request.status)}`}>
                      {request.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-2" />
                      <span>{getLeaveTypeName(request.leaveTypeId)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{request.days} day{request.days !== 1 ? 's' : ''}</span>
                    </div>
                    <div>
                      <span className="font-medium">From:</span> {new Date(request.startDate).toLocaleDateString()}
                    </div>
                    <div>
                      <span className="font-medium">To:</span> {new Date(request.endDate).toLocaleDateString()}
                    </div>
                  </div>
                  
                  {request.reason && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Reason:</span>
                      <p className="text-sm text-gray-600 mt-1">{request.reason}</p>
                    </div>
                  )}
                  
                  {request.approverComments && (
                    <div className="mt-2">
                      <span className="text-sm font-medium text-gray-700">Comments:</span>
                      <p className="text-sm text-gray-600 mt-1">{request.approverComments}</p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                {canApproveRequests && (request.status === 'pending' || (request.status === 'supervisor_approved' && (user?.role === 'admin' || user?.role === 'hr_manager'))) && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleApproveRequest(request.id)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      {request.status === 'pending' ? 'Approve' : 'Final Approve'}
                    </button>
                    <button
                      onClick={() => handleRejectRequest(request.id)}
                      className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                    >
                      <X className="w-4 h-4 mr-1" />
                      Reject
                    </button>
                  </div>
                )}

                {!canApproveRequests && (
                  <div className="flex items-center space-x-2 ml-4">
                    <button className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        {filteredRequests.length === 0 && (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No leave requests found</h3>
            <p className="text-gray-600 mb-6">
              {selectedStatus === 'all' 
                ? 'No leave requests have been submitted yet.'
                : `No ${selectedStatus.replace('_', ' ')} leave requests found.`
              }
            </p>
            <button
              onClick={() => setShowNewRequestForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Submit New Request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};