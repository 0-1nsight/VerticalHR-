import React, { useState } from 'react';
import { 
  Plus, 
  Star, 
  Clock, 
  CheckCircle, 
  Eye, 
  Calendar,
  Award,
  FileSignature,
  CheckCircle2
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { PerformanceReview } from '../../types';
import { PerformanceReviewFormModal } from './PerformanceReviewFormModal';

export const PerformanceReviews: React.FC = () => {
  const { 
    performanceReviews, 
    employees 
  } = useData();
  const { user } = useAuth();

  const [activeCycleTab, setActiveCycleTab] = useState<'all' | 'monthly' | 'quarterly' | 'annual'>('all');
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const getEmployeeName = (empId: string) => {
    const employee = employees.find(emp => emp.id === empId || emp.employeeId === empId);
    return employee ? `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}` : 'Staff Member';
  };

  const getStatusBadge = (status: PerformanceReview['status']) => {
    switch (status) {
      case 'completed':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3.5 h-3.5 mr-1" />
            Finalized & Signed
          </span>
        );
      case 'employee_submitted':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Self-Assessment Submitted
          </span>
        );
      case 'supervisor_review':
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            <Eye className="w-3.5 h-3.5 mr-1" />
            Under Manager Review
          </span>
        );
      case 'draft':
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
            <Clock className="w-3.5 h-3.5 mr-1" />
            Draft Form
          </span>
        );
    }
  };

  // RLS: An employee only sees their own reviews
  const currentEmp = employees.find(
    e => e.email === user?.email || e.employeeId === user?.employeeId || e.id === user?.employeeId
  ) || (user?.role === 'employee' ? employees[0] : undefined);

  const userReviews = user?.role === 'employee' 
    ? performanceReviews.filter(review => 
        (currentEmp && (review.employeeId === currentEmp.id || review.employeeId === currentEmp.employeeId)) ||
        (user?.employeeId && review.employeeId === user.employeeId)
      )
    : performanceReviews;

  const filteredReviews = userReviews.filter(review => {
    if (activeCycleTab === 'all') return true;
    return review.reviewType === activeCycleTab;
  });

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Performance Evaluations</h1>
          <p className="text-gray-600 mt-1">
            Conduct monthly, quarterly, and annual evaluations based on goals, core competencies, and electronic sign-offs
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingReview(null);
              setShowNewModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 shadow-xs"
          >
            <Plus className="w-4 h-4 mr-2" />
            {user?.role === 'employee' ? 'Start Evaluation Form' : 'New Performance Evaluation'}
          </button>
        </div>
      </div>

      {/* Cycle Filtering Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2">
          {[
            { id: 'all', label: 'All Reviews' },
            { id: 'monthly', label: 'Monthly Reviews' },
            { id: 'quarterly', label: 'Quarterly Reviews' },
            { id: 'annual', label: 'Annual Reviews' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveCycleTab(tab.id as typeof activeCycleTab)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                activeCycleTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="text-xs text-gray-500 pr-2">
          Showing {filteredReviews.length} record{filteredReviews.length === 1 ? '' : 's'}
        </div>
      </div>

      {/* Reviews List */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 overflow-hidden divide-y divide-gray-200">
        {filteredReviews.map((review) => (
          <div key={review.id} className="p-6 hover:bg-slate-50/70 transition-colors">
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs px-2 py-0.5 rounded font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {review.reviewType}
                  </span>
                  <h3 className="text-base font-bold text-gray-900">
                    {review.cycleName || `${getEmployeeName(review.employeeId)} - ${review.reviewType.replace('_', ' ')} Review`}
                  </h3>
                  {getStatusBadge(review.status)}
                </div>

                <div className="text-xs text-gray-600 flex flex-wrap items-center gap-x-4 gap-y-1">
                  <span>
                    Staff: <strong className="text-gray-900">{getEmployeeName(review.employeeId)}</strong>
                  </span>
                  <span>·</span>
                  <span className="flex items-center text-gray-500">
                    <Calendar className="w-3.5 h-3.5 mr-1" />
                    {new Date(review.reviewPeriod.startDate).toLocaleDateString()} - {new Date(review.reviewPeriod.endDate).toLocaleDateString()}
                  </span>
                  <span>·</span>
                  <span>Objectives: <strong className="text-gray-900">{review.goals.length}</strong></span>
                  <span>·</span>
                  <span>Competencies: <strong className="text-gray-900">{review.competencies.length}</strong></span>
                  {review.overallScore && (
                    <>
                      <span>·</span>
                      <span className="flex items-center font-bold text-amber-600">
                        <Star className="w-3.5 h-3.5 fill-current mr-1" />
                        {review.overallScore} / 5.0
                      </span>
                    </>
                  )}
                </div>

                {/* Sign-off progress indicators */}
                <div className="flex flex-wrap items-center gap-3 pt-2 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Employee Signature:</span>
                    {review.employeeSignature?.signed ? (
                      <span className="text-emerald-700 font-medium flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" />
                        {review.employeeSignature.signedByName}
                      </span>
                    ) : (
                      <span className="text-amber-600 font-medium">Pending Self-Sign</span>
                    )}
                  </div>
                  <span className="text-gray-300">|</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-gray-500">Manager Sign-off:</span>
                    {review.managerSignature?.signed ? (
                      <span className="text-emerald-700 font-medium flex items-center">
                        <CheckCircle2 className="w-3.5 h-3.5 mr-0.5" />
                        {review.managerSignature.signedByName}
                      </span>
                    ) : (
                      <span className="text-slate-400 font-medium">Awaiting Manager Finalization</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setSelectedReview(review)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 shadow-xs flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  View Details
                </button>
                <button
                  onClick={() => {
                    setEditingReview(review);
                    setShowNewModal(true);
                  }}
                  className="px-3.5 py-1.5 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700 shadow-xs flex items-center gap-1.5"
                >
                  <FileSignature className="w-3.5 h-3.5" />
                  {user?.role === 'employee' ? 'Fill / Review Form' : 'Evaluate & Score'}
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredReviews.length === 0 && (
          <div className="text-center py-12 p-6">
            <Award className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h3 className="text-base font-semibold text-gray-900 mb-1">No reviews found in this category</h3>
            <p className="text-xs text-gray-500 mb-4 max-w-sm mx-auto">
              Start by creating or self-initiating a monthly, quarterly, or annual evaluation form.
            </p>
            <button
              onClick={() => {
                setEditingReview(null);
                setShowNewModal(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Start New Evaluation Form
            </button>
          </div>
        )}
      </div>

      {/* Review Details View Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold tracking-wider text-blue-400">
                  {selectedReview.reviewType} Review Record
                </span>
                <h2 className="text-xl font-bold text-white mt-0.5">
                  {selectedReview.cycleName || getEmployeeName(selectedReview.employeeId)}
                </h2>
                <p className="text-xs text-slate-300 mt-1">
                  Staff: {getEmployeeName(selectedReview.employeeId)} · Period: {new Date(selectedReview.reviewPeriod.startDate).toLocaleDateString()} to {new Date(selectedReview.reviewPeriod.endDate).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => setSelectedReview(null)}
                className="p-1.5 text-slate-400 hover:text-white rounded-lg"
              >
                ✕
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Overall Score */}
              {selectedReview.overallScore && (
                <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Overall Rating</span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-2xl font-black text-amber-900">{selectedReview.overallScore}</span>
                      <span className="text-xs text-amber-700">/ 5.0 Overall Performance</span>
                    </div>
                  </div>
                  <div className="flex items-center text-amber-500">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={`w-5 h-5 ${s <= selectedReview.overallScore! ? 'fill-current' : 'text-amber-200'}`} />
                    ))}
                  </div>
                </div>
              )}

              {/* Goals */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Objectives & Key Results ({selectedReview.goals.length})</h4>
                <div className="space-y-3">
                  {selectedReview.goals.map((g) => (
                    <div key={g.id} className="p-4 bg-slate-50 border border-slate-200 rounded-lg text-xs space-y-2">
                      <div className="flex items-center justify-between">
                        <strong className="text-sm text-gray-900">{g.title}</strong>
                        <span className="font-semibold text-blue-700">{g.progress}% Complete</span>
                      </div>
                      <p className="text-gray-600">{g.description}</p>
                      <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-200 text-gray-700">
                        <div>
                          <span className="font-semibold text-blue-900">Employee Rating:</span> {g.selfScore ? `${g.selfScore}/5` : 'N/A'}
                          {g.selfComments && <p className="text-gray-500 italic mt-0.5">"{g.selfComments}"</p>}
                        </div>
                        <div>
                          <span className="font-semibold text-slate-900">Manager Rating:</span> {g.managerScore ? `${g.managerScore}/5` : 'N/A'}
                          {g.managerComments && <p className="text-gray-500 italic mt-0.5">"{g.managerComments}"</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Competencies */}
              <div>
                <h4 className="text-sm font-bold text-gray-900 mb-3">Core Competencies ({selectedReview.competencies.length})</h4>
                <div className="space-y-2">
                  {selectedReview.competencies.map((c) => (
                    <div key={c.competencyId} className="p-3 bg-white border border-gray-200 rounded-lg flex items-center justify-between text-xs">
                      <div>
                        <strong className="text-gray-900">{c.name}</strong>
                        <span className="ml-2 text-gray-400">({c.category})</span>
                        {c.selfComments && <p className="text-gray-500 italic mt-0.5">Self: "{c.selfComments}"</p>}
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-blue-700 font-semibold">Self: {c.selfRating || '-'}/5</span>
                        <span className="text-indigo-700 font-semibold">Mgr: {c.supervisorRating || '-'}/5</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Signatures */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-gray-200 text-xs">
                <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100">
                  <span className="text-gray-500 block mb-1">Employee Sign-Off:</span>
                  {selectedReview.employeeSignature?.signed ? (
                    <div>
                      <strong className="text-emerald-700 font-bold block">{selectedReview.employeeSignature.signedByName}</strong>
                      <span className="text-gray-400">{new Date(selectedReview.employeeSignature.signedAt).toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="text-amber-600 font-semibold">Pending Signature</span>
                  )}
                </div>
                <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                  <span className="text-gray-500 block mb-1">Manager Sign-Off:</span>
                  {selectedReview.managerSignature?.signed ? (
                    <div>
                      <strong className="text-emerald-700 font-bold block">{selectedReview.managerSignature.signedByName}</strong>
                      <span className="text-gray-400">{new Date(selectedReview.managerSignature.signedAt).toLocaleString()}</span>
                    </div>
                  ) : (
                    <span className="text-slate-400 font-semibold">Pending Approval</span>
                  )}
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
              >
                Close
              </button>
              <button
                onClick={() => {
                  const rev = selectedReview;
                  setSelectedReview(null);
                  setEditingReview(rev);
                  setShowNewModal(true);
                }}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 rounded-lg hover:bg-blue-700"
              >
                Edit / Evaluate
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Form Modal */}
      {showNewModal && (
        <PerformanceReviewFormModal
          review={editingReview}
          onClose={() => {
            setShowNewModal(false);
            setEditingReview(null);
          }}
          onSuccess={() => {
            setShowNewModal(false);
            setEditingReview(null);
          }}
        />
      )}
    </div>
  );
};