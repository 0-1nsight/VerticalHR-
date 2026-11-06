import React, { useState } from 'react';
import { Check, X, Eye, Clock, User } from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { ProfileChangeRequest } from '../../types';

export const ProfileChangeRequests: React.FC = () => {
  const { 
    profileChangeRequests, 
    employees, 
    updateProfileChangeRequest,
    addNotification 
  } = useData();
  const { user } = useAuth();
  const [selectedRequest, setSelectedRequest] = useState<ProfileChangeRequest | null>(null);

  const getEmployeeName = (employeeId: string) => {
    const employee = employees.find(emp => emp.id === employeeId);
    return employee ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` : 'N/A';
  };

  const getRequestTypeLabel = (type: string) => {
    switch (type) {
      case 'personal_info': return 'Personal Information';
      case 'contact_info': return 'Contact Information';
      case 'emergency_contact': return 'Emergency Contact';
      case 'bank_info': return 'Bank Information';
      default: return type;
    }
  };

  const handleApproveRequest = (requestId: string) => {
    const request = profileChangeRequests.find(req => req.id === requestId);
    if (request) {
      updateProfileChangeRequest(requestId, {
        status: 'approved',
        reviewedBy: user?.id,
        reviewedAt: new Date().toISOString(),
        reviewComments: 'Approved'
      });

      // Notify employee
      addNotification({
        userId: request.employeeId,
        title: 'Profile Change Approved',
        message: `Your ${getRequestTypeLabel(request.requestType).toLowerCase()} change request has been approved`,
        type: 'success',
        read: false,
        actionRequired: false,
        relatedEntityId: requestId,
        relatedEntityType: 'profile_change_request'
      });
    }
  };

  const handleRejectRequest = (requestId: string) => {
    const reason = 'Documentation required to support proposed profile amendment';
    if (reason) {
      const request = profileChangeRequests.find(req => req.id === requestId);
      if (request) {
        updateProfileChangeRequest(requestId, {
          status: 'rejected',
          reviewedBy: user?.id,
          reviewedAt: new Date().toISOString(),
          reviewComments: reason
        });

        // Notify employee
        addNotification({
          userId: request.employeeId,
          title: 'Profile Change Rejected',
          message: `Your ${getRequestTypeLabel(request.requestType).toLowerCase()} change request has been rejected: ${reason}`,
          type: 'error',
          read: false,
          actionRequired: false,
          relatedEntityId: requestId,
          relatedEntityType: 'profile_change_request'
        });
      }
    }
  };

  const renderChangeComparison = (request: ProfileChangeRequest) => {
    type ChangeData = {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      email?: string;
      phone?: string;
      address?: { street?: string; city?: string };
    };
    const currentData = request.currentData as ChangeData;
    const proposedData = request.proposedData as ChangeData;
    const { requestType } = request;

    switch (requestType) {
      case 'personal_info':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Current Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">First Name:</span> {currentData.firstName}</p>
                  <p><span className="font-medium">Last Name:</span> {currentData.lastName}</p>
                  <p><span className="font-medium">Date of Birth:</span> {currentData.dateOfBirth}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Proposed Changes</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">First Name:</span> {proposedData.firstName}</p>
                  <p><span className="font-medium">Last Name:</span> {proposedData.lastName}</p>
                  <p><span className="font-medium">Date of Birth:</span> {proposedData.dateOfBirth}</p>
                </div>
              </div>
            </div>
          </div>
        );
      case 'contact_info':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Current Information</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Email:</span> {currentData.email}</p>
                  <p><span className="font-medium">Phone:</span> {currentData.phone}</p>
                  <p><span className="font-medium">Address:</span> {currentData.address?.street}, {currentData.address?.city}</p>
                </div>
              </div>
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Proposed Changes</h4>
                <div className="space-y-2 text-sm">
                  <p><span className="font-medium">Email:</span> {proposedData.email}</p>
                  <p><span className="font-medium">Phone:</span> {proposedData.phone}</p>
                  <p><span className="font-medium">Address:</span> {proposedData.address?.street}, {proposedData.address?.city}</p>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return (
          <div className="text-sm text-gray-600">
            <p>Request details not available for display</p>
          </div>
        );
    }
  };

  const pendingRequests = profileChangeRequests.filter(req => req.status === 'pending');
  const canApproveRequests = user?.role === 'admin' || user?.role === 'hr_manager';

  return (
    <div className="p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Profile Change Requests</h1>
        <p className="text-gray-600 mt-1">Review and approve employee profile change requests</p>
      </div>

      {/* Requests List */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-medium text-gray-900">
            Pending Requests ({pendingRequests.length})
          </h3>
        </div>

        <div className="divide-y divide-gray-200">
          {pendingRequests.map((request) => (
            <div key={request.id} className="p-6 hover:bg-gray-50">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h4 className="text-lg font-medium text-gray-900">
                      {getEmployeeName(request.employeeId)}
                    </h4>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      {request.status}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 mb-4">
                    <div className="flex items-center">
                      <User className="w-4 h-4 mr-2" />
                      <span>{getRequestTypeLabel(request.requestType)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="w-4 h-4 mr-2" />
                      <span>{new Date(request.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div>
                      <span className="font-medium">Reason:</span> {request.reason}
                    </div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => setSelectedRequest(request)}
                    className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-blue-700 bg-blue-100 rounded-lg hover:bg-blue-200"
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </button>
                  {canApproveRequests && (
                    <>
                      <button
                        onClick={() => handleApproveRequest(request.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-green-700 bg-green-100 rounded-lg hover:bg-green-200"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleRejectRequest(request.id)}
                        className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {pendingRequests.length === 0 && (
          <div className="text-center py-12">
            <User className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No pending requests</h3>
            <p className="text-gray-600">All profile change requests have been processed.</p>
          </div>
        )}
      </div>

      {/* Request Details Modal */}
      {selectedRequest && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">
                Profile Change Request Details
              </h2>
              <button
                onClick={() => setSelectedRequest(null)}
                className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 max-h-[70vh] overflow-y-auto">
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {getEmployeeName(selectedRequest.employeeId)} - {getRequestTypeLabel(selectedRequest.requestType)}
                </h3>
                <p className="text-gray-600">
                  <span className="font-medium">Requested on:</span> {new Date(selectedRequest.createdAt).toLocaleDateString()}
                </p>
                <p className="text-gray-600">
                  <span className="font-medium">Reason:</span> {selectedRequest.reason}
                </p>
              </div>

              {renderChangeComparison(selectedRequest)}
            </div>

            <div className="flex items-center justify-end space-x-4 px-6 py-4 border-t border-gray-200 bg-gray-50">
              <button
                onClick={() => setSelectedRequest(null)}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Close
              </button>
              {canApproveRequests && selectedRequest.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleRejectRequest(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-red-700 bg-red-100 rounded-lg hover:bg-red-200"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Reject
                  </button>
                  <button
                    onClick={() => {
                      handleApproveRequest(selectedRequest.id);
                      setSelectedRequest(null);
                    }}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-green-600 rounded-lg hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Approve
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};