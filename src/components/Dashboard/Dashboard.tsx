import React, { useState } from 'react';
import { 
  Users, 
  Calendar, 
  Clock, 
  TrendingUp, 
  UserPlus, 
  CalendarCheck,
  BarChart3,
  FileSignature,
  FileText,
  CheckCircle2,
  Clock4,
  ArrowRight,
  ShieldCheck,
  Sparkles,
  Award,
  BookOpen,
  Briefcase,
  ChevronRight,
  UserCheck,
  PenTool
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { PerformanceReviewFormModal } from '../Performance/PerformanceReviewFormModal';
import { PerformanceReview } from '../../types';

interface DashboardProps {
  onNavigate?: (module: string) => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ onNavigate }) => {
  const { 
    employees, 
    departments, 
    leaveRequests, 
    leaveBalances, 
    documents, 
    performanceReviews, 
    profileChangeRequests,
    trainingCourses,
    updatePerformanceReview,
    signDocument
  } = useData();
  const { user } = useAuth();

  const [selectedReviewForModal, setSelectedReviewForModal] = useState<PerformanceReview | null>(null);
  const [signingDocId, setSigningDocId] = useState<string | null>(null);

  // Match current employee for employee context
  const currentEmp = employees.find(
    e => e.email === user?.email || e.id === user?.employeeId || e.employeeId === user?.employeeId
  ) || employees[0];
  const currentEmpId = currentEmp?.id || '1';
  const currentEmpCode = currentEmp?.employeeId || 'EMP001';

  const isEmployee = user?.role === 'employee';
  const isLineManager = user?.role === 'line_manager';

  // -------------------------------------------------------------
  // EMPLOYEE-SPECIFIC DATA & CALCULATIONS (STRICT RLS)
  // -------------------------------------------------------------
  const myLeaveBalances = leaveBalances.filter(
    b => b.employeeId === currentEmpId || b.employeeId === currentEmpCode
  );
  const annualLeave = myLeaveBalances.find(b => b.leaveTypeId === '1') || { available: 12.5, allocated: 15, used: 2.5 };
  const sickLeave = myLeaveBalances.find(b => b.leaveTypeId === '2') || { available: 8, allocated: 10, used: 2 };

  // Documents requiring employee signature
  const pendingSignDocuments = documents.filter(d => 
    (d.employeeId === currentEmpId || d.employeeId === currentEmpCode || d.isCompanyWide) &&
    d.requiresSignature && 
    !d.signature?.signed
  );

  // Active performance reviews for this employee
  const myReviews = performanceReviews.filter(
    r => r.employeeId === currentEmpId || r.employeeId === currentEmpCode
  );
  const activeReview = myReviews.find(r => r.status === 'in_progress' || r.status === 'draft') || myReviews[0];

  // Requests submitted by current employee
  const myProfileChanges = profileChangeRequests.filter(r => r.employeeId === currentEmpId);
  const myLeaveList = leaveRequests.filter(r => r.employeeId === currentEmpId || r.employeeId === currentEmpCode);

  // Enrolled courses
  const myEnrolledCourses = trainingCourses.filter(c => {
    const enrolledIds = c.enrolledEmployeeIds || [];
    return enrolledIds.includes(currentEmpId) || enrolledIds.includes(currentEmpCode);
  });

  const handleReviewSave = (updated: PerformanceReview) => {
    updatePerformanceReview(updated.id, updated);
    setSelectedReviewForModal(null);
  };

  const handleQuickSign = (docId: string) => {
    const signerName = `${currentEmp.personalInfo.firstName} ${currentEmp.personalInfo.lastName}`;
    signDocument(docId, signerName);
    setSigningDocId(null);
  };

  // -------------------------------------------------------------
  // EMPLOYEE VIEW (PERSONEL SELF-SERVICE WORKSPACE)
  // -------------------------------------------------------------
  if (isEmployee) {
    return (
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Personalized Welcome Banner */}
        <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-900 rounded-2xl p-6 text-white shadow-md relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
            <Briefcase className="w-64 h-64 text-white" />
          </div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-xs rounded-lg text-xs font-medium text-blue-200">
                <UserCheck className="w-3.5 h-3.5 text-emerald-400" />
                Employee Self-Service Workspace • {currentEmp.jobInfo.department}
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                Welcome back, {currentEmp.personalInfo.firstName} {currentEmp.personalInfo.lastName}
              </h1>
              <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
                {currentEmp.jobInfo.jobTitle} • Staff ID: <span className="font-mono text-white">{currentEmp.employeeId}</span> • Direct Supervisor: <span className="text-white font-medium">{currentEmp.jobInfo.reportsTo || 'David Chen'}</span>
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigate && onNavigate('employees')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
              >
                <UserCheck className="w-4 h-4" />
                My Profile & Records
              </button>
              <button
                onClick={() => onNavigate && onNavigate('leave-requests')}
                className="inline-flex items-center gap-2 px-4 py-2 bg-white/15 hover:bg-white/20 text-white rounded-xl text-sm font-medium backdrop-blur-xs transition-colors"
              >
                <Calendar className="w-4 h-4 text-amber-300" />
                Apply for Leave
              </button>
            </div>
          </div>
        </div>

        {/* Action Required Callout Banner (Review, Sign, Evaluate) */}
        {(pendingSignDocuments.length > 0 || (activeReview && activeReview.status !== 'completed')) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Signature Attention Card */}
            {pendingSignDocuments.length > 0 ? (
              <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-5 flex items-start justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-amber-100 flex items-center justify-center shrink-0 border border-amber-200">
                    <FileSignature className="w-5 h-5 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-amber-950">
                      {pendingSignDocuments.length} Document{pendingSignDocuments.length > 1 ? 's' : ''} Require Your Electronic Signature
                    </h3>
                    <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                      Next required: <strong className="font-medium text-amber-900">{pendingSignDocuments[0].name}</strong>
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <button
                        onClick={() => setSigningDocId(pendingSignDocuments[0].id)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                      >
                        <PenTool className="w-3.5 h-3.5" />
                        Review & Sign Now
                      </button>
                      <button
                        onClick={() => onNavigate && onNavigate('employees')}
                        className="text-xs text-amber-900 hover:underline font-medium px-2 py-1"
                      >
                        View all in Vault
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-emerald-50/80 border border-emerald-200 rounded-xl p-5 flex items-center gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0 border border-emerald-200">
                  <CheckCircle2 className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-emerald-950">Document Signatures Up to Date</h3>
                  <p className="text-xs text-emerald-800 mt-0.5">All required policies, declarations, and employee agreements have been signed.</p>
                </div>
              </div>
            )}

            {/* Performance Review Evaluation Card */}
            {activeReview ? (
              <div className="bg-indigo-50/80 border border-indigo-200 rounded-xl p-5 flex items-start justify-between gap-4 shadow-2xs">
                <div className="flex items-start gap-3.5">
                  <div className="w-10 h-10 rounded-lg bg-indigo-100 flex items-center justify-center shrink-0 border border-indigo-200">
                    <TrendingUp className="w-5 h-5 text-indigo-700" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-indigo-950">
                        {activeReview.cycleName || 'Current Performance Evaluation Cycle'}
                      </h3>
                      <span className="text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 bg-indigo-200/70 text-indigo-800 rounded-sm">
                        {activeReview.reviewType}
                      </span>
                    </div>
                    <p className="text-xs text-indigo-800 mt-0.5">
                      Status: {activeReview.employeeSignature?.signed ? 'Self-Assessment Signed • Awaiting Manager' : 'Self-Assessment & Competencies Form Pending'}
                    </p>
                    <div className="mt-3">
                      <button
                        onClick={() => setSelectedReviewForModal(activeReview)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-2xs transition-colors"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {activeReview.employeeSignature?.signed ? 'View Evaluation Form' : 'Fill Out Evaluation Form'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-5 flex items-center gap-3.5 shadow-2xs">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center shrink-0 border border-slate-200">
                  <Award className="w-5 h-5 text-slate-600" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900">Performance Cycle</h3>
                  <p className="text-xs text-slate-600 mt-0.5">No active reviews requiring input. Next quarterly cycle opens soon.</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Key Personal Metrics Cards (Strict RLS) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Annual Leave</span>
              <Calendar className="w-4 h-4 text-blue-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{annualLeave.available}</span>
              <span className="text-xs text-slate-500 font-medium">days available</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Allocated: {annualLeave.allocated} days • Used: {annualLeave.used} days
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Sick & Medical</span>
              <Clock className="w-4 h-4 text-emerald-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{sickLeave.available}</span>
              <span className="text-xs text-slate-500 font-medium">days remaining</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              {sickLeave.used} days claimed this calendar year
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Pending Requests</span>
              <Clock4 className="w-4 h-4 text-amber-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">
                {myLeaveList.filter(l => l.status === 'pending').length + myProfileChanges.filter(p => p.status === 'pending').length}
              </span>
              <span className="text-xs text-slate-500 font-medium">in approval chain</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              Track multi-level approvals in real-time
            </p>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
            <div className="flex items-center justify-between text-slate-500 mb-2">
              <span className="text-xs font-medium uppercase tracking-wider text-slate-500">Mandatory Training</span>
              <BookOpen className="w-4 h-4 text-purple-600" />
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-slate-900">{myEnrolledCourses.length}</span>
              <span className="text-xs text-slate-500 font-medium">assigned courses</span>
            </div>
            <p className="text-xs text-slate-500 mt-2">
              FICA, AML & Corporate Compliance
            </p>
          </div>
        </div>

        {/* Main Content Columns: My Requests & My Actions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Column 1 & 2: My Submitted Requests & Status */}
          <div className="lg:col-span-2 bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-slate-900">My Requests & Approval Tracking</h2>
                <p className="text-xs text-slate-500 mt-0.5">Real-time status of your submitted leave, profile changes, and letter requests</p>
              </div>
              <button
                onClick={() => onNavigate && onNavigate('approvals-inbox')}
                className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1"
              >
                View all tracking
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="divide-y divide-slate-100">
              {/* Profile Change Requests */}
              {myProfileChanges.map((req) => (
                <div key={req.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                      <UserCheck className="w-4 h-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Personal Information Update</p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        Changes to: {Object.keys(req.changeData).join(', ')}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Submitted: {new Date(req.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-md ${
                      req.status === 'approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {req.status === 'pending' ? 'Step 2: HR Admin Review' : req.status.toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}

              {/* Leave Requests */}
              {myLeaveList.slice(0, 3).map((req) => (
                <div key={req.id} className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between gap-4">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">
                        {req.days} Day{req.days > 1 ? 's' : ''} Leave Application
                      </p>
                      <p className="text-xs text-slate-600 mt-0.5">
                        {req.startDate} to {req.endDate} • {req.reason || 'Personal time off'}
                      </p>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Assigned Approver: David Chen (Line Manager)
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-flex text-xs font-semibold px-2 py-0.5 rounded-md ${
                      req.status === 'approved' || req.status === 'hr_approved' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      req.status === 'rejected' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                      'bg-amber-50 text-amber-700 border border-amber-200'
                    }`}>
                      {req.status === 'pending' ? 'Pending Manager Sign-off' : req.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
              ))}

              {myProfileChanges.length === 0 && myLeaveList.length === 0 && (
                <div className="p-8 text-center text-slate-500">
                  <CheckCircle2 className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                  <p className="text-sm font-medium text-slate-700">No active pending requests</p>
                  <p className="text-xs text-slate-500 mt-1">Use the quick actions on the right to submit a new leave or profile request.</p>
                </div>
              )}
            </div>
          </div>

          {/* Column 3: Quick Self-Service Actions */}
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-2xs">
              <h3 className="text-sm font-bold text-slate-900 mb-3">Self-Service Shortcuts</h3>
              <div className="space-y-2.5">
                <button
                  onClick={() => onNavigate && onNavigate('employees')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-blue-300 hover:bg-blue-50/40 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <UserCheck className="w-4 h-4 text-blue-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Update Personal Data</p>
                      <p className="text-[11px] text-slate-500">Address, phone, bank & contacts</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('leave-requests')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-indigo-300 hover:bg-indigo-50/40 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4 h-4 text-indigo-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Submit Leave Request</p>
                      <p className="text-[11px] text-slate-500">Annual, sick, or bereavement</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('performance-reviews')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-purple-300 hover:bg-purple-50/40 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-purple-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">My Performance Evaluations</p>
                      <p className="text-[11px] text-slate-500">Monthly, quarterly & annual</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>

                <button
                  onClick={() => onNavigate && onNavigate('employees')}
                  className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-emerald-300 hover:bg-emerald-50/40 text-left transition-colors"
                >
                  <div className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-slate-900">Official HR Letters</p>
                      <p className="text-[11px] text-slate-500">Employment & visa verification</p>
                    </div>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                </button>
              </div>
            </div>

            {/* FICA & AML Compliance status */}
            <div className="bg-slate-50 rounded-xl border border-slate-200 p-4">
              <div className="flex items-center gap-2 text-slate-900 mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span className="text-xs font-bold uppercase tracking-wider">FICA Compliance</span>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Your statutory identity, national ID, and proof of residential address are verified with the compliance vault.
              </p>
            </div>
          </div>
        </div>

        {/* Modal: Evaluation Form */}
        {selectedReviewForModal && (
          <PerformanceReviewFormModal
            review={selectedReviewForModal}
            employee={currentEmp}
            isOpen={true}
            onClose={() => setSelectedReviewForModal(null)}
            onSave={handleReviewSave}
            currentUserRole={user?.role}
            currentUserId={user?.id}
          />
        )}

        {/* Modal: Quick Document Sign */}
        {signingDocId && (
          <div className="fixed inset-0 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 border border-slate-200 shadow-xl space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center border border-amber-200">
                  <FileSignature className="w-5 h-5 text-amber-700" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Electronic Policy Signature</h3>
                  <p className="text-xs text-slate-500">Sign with legal timestamp audit trail</p>
                </div>
              </div>

              <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-xs text-slate-700 space-y-2">
                <p className="font-semibold text-slate-900">
                  {documents.find(d => d.id === signingDocId)?.name}
                </p>
                <p className="text-slate-600 leading-relaxed">
                  By clicking "Affix Signature & Confirm", I certify that I have read, understood, and agree to adhere to all terms outlined in this document.
                </p>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-slate-500 font-mono text-[11px]">
                  <span>Signer: {currentEmp.personalInfo.firstName} {currentEmp.personalInfo.lastName}</span>
                  <span>ID: {currentEmp.employeeId}</span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setSigningDocId(null)}
                  className="px-4 py-2 border border-slate-300 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleQuickSign(signingDocId)}
                  className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-semibold shadow-xs"
                >
                  Affix Signature & Confirm
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // -------------------------------------------------------------
  // HR ADMIN / SUPER ADMIN / LINE MANAGER VIEW
  // -------------------------------------------------------------
  const stats = [
    {
      title: isLineManager ? 'Direct Reports' : 'Total Employees',
      value: isLineManager 
        ? employees.filter(e => e.jobInfo.reportsTo === `${user?.firstName} ${user?.lastName}` || e.jobInfo.reportsTo === user?.employeeId).length || 4
        : employees.length,
      icon: <Users className="w-8 h-8 text-blue-600" />,
      change: '+5%',
      changeType: 'positive',
    },
    {
      title: isLineManager ? 'Pending Team Approvals' : 'Pending Leave Requests',
      value: isLineManager
        ? leaveRequests.filter(req => req.status === 'pending').length
        : leaveRequests.filter(req => req.status === 'pending').length,
      icon: <Calendar className="w-8 h-8 text-orange-600" />,
      change: '+12%',
      changeType: 'neutral',
    },
    {
      title: isLineManager ? 'Team Department' : 'Active Departments',
      value: isLineManager ? 1 : departments.length,
      icon: <BarChart3 className="w-8 h-8 text-green-600" />,
      change: '0%',
      changeType: 'neutral',
    },
    {
      title: 'Pending Reviews',
      value: performanceReviews.filter(r => r.status === 'in_progress').length,
      icon: <TrendingUp className="w-8 h-8 text-purple-600" />,
      change: 'Active Cycles',
      changeType: 'positive',
    },
  ];

  const recentActivities = [
    {
      id: '1',
      type: 'leave_request',
      message: 'John Doe submitted a leave request for Dec 20-22',
      time: '2 hours ago',
      status: 'pending',
    },
    {
      id: '2',
      type: 'employee_added',
      message: 'Sarah Smith was added to Engineering department',
      time: '4 hours ago',
      status: 'completed',
    },
    {
      id: '3',
      type: 'leave_approved',
      message: 'David Chen signed off on Mike Johnson\'s leave request',
      time: '6 hours ago',
      status: 'completed',
    },
    {
      id: '4',
      type: 'performance_review',
      message: 'October 2026 Monthly Performance Sprint cycle is active',
      time: '1 day ago',
      status: 'pending',
    },
  ];

  const upcomingEvents = [
    {
      id: '1',
      title: 'October Monthly Performance Evaluations Due',
      date: '2026-11-15',
      type: 'review',
    },
    {
      id: '2',
      title: 'Quarterly Board Compliance & FICA Audit',
      date: '2026-11-20',
      type: 'compliance',
    },
    {
      id: '3',
      title: 'New Employee Orientation & Code of Conduct Signings',
      date: '2026-11-25',
      type: 'training',
    },
  ];

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'leave_request':
        return <Calendar className="w-4 h-4 text-orange-500" />;
      case 'employee_added':
        return <UserPlus className="w-4 h-4 text-green-500" />;
      case 'leave_approved':
        return <CalendarCheck className="w-4 h-4 text-blue-500" />;
      case 'performance_review':
        return <TrendingUp className="w-4 h-4 text-purple-500" />;
      default:
        return <Clock className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Welcome Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
            Welcome back, {user?.firstName}!
          </h1>
          <p className="text-gray-600 text-sm mt-1">
            {isLineManager 
              ? 'Management Overview • Direct Reports & Team Approvals'
              : 'Enterprise Workforce Management & Governance Overview'
            }
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => onNavigate && onNavigate('approvals-inbox')}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors shadow-xs"
          >
            <Clock4 className="w-4 h-4" />
            Approvals Inbox
          </button>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <div key={index} className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-1">{stat.title}</p>
                <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
                <div className="flex items-center mt-2">
                  <span className={`text-xs font-semibold ${
                    stat.changeType === 'positive' ? 'text-green-600' : 
                    stat.changeType === 'negative' ? 'text-red-600' : 'text-gray-600'
                  }`}>
                    {stat.change}
                  </span>
                  <span className="text-xs text-gray-500 ml-1">status</span>
                </div>
              </div>
              <div className="bg-gray-50 rounded-xl p-3 border border-gray-100">
                {stat.icon}
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Activities */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Recent Personnel Activities</h2>
          <div className="space-y-3">
            {recentActivities.map((activity) => (
              <div key={activity.id} className="flex items-start space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                <div className="bg-gray-100 rounded-lg p-2 shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900">{activity.message}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{activity.time}</p>
                </div>
                <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-semibold ${
                  activity.status === 'pending' 
                    ? 'bg-amber-50 text-amber-800 border border-amber-200' 
                    : 'bg-green-50 text-green-800 border border-green-200'
                }`}>
                  {activity.status.toUpperCase()}
                </span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate && onNavigate('approvals-inbox')}
            className="w-full mt-4 text-center text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            View all pending workflow approvals →
          </button>
        </div>

        {/* Upcoming Events & Governance Deadlines */}
        <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
          <h2 className="text-base font-bold text-gray-900 mb-4">Governance & Performance Deadlines</h2>
          <div className="space-y-3">
            {upcomingEvents.map((event) => (
              <div key={event.id} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 border border-transparent hover:border-gray-100 transition-colors">
                <div className={`w-3 h-3 rounded-full shrink-0 ${
                  event.type === 'review' ? 'bg-purple-500' :
                  event.type === 'compliance' ? 'bg-emerald-500' : 'bg-blue-500'
                }`}></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900 truncate">{event.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {new Date(event.date).toLocaleDateString('en-US', {
                      weekday: 'short',
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric'
                    })}
                  </p>
                </div>
                <span className="text-[11px] font-medium text-slate-500 capitalize">
                  {event.type}
                </span>
              </div>
            ))}
          </div>
          <button 
            onClick={() => onNavigate && onNavigate('performance-reviews')}
            className="w-full mt-4 text-center text-xs text-blue-600 hover:text-blue-800 font-semibold"
          >
            Manage active review cycles →
          </button>
        </div>
      </div>

      {/* Quick Actions for HR & Managers */}
      <div className="bg-white rounded-xl shadow-xs border border-gray-200 p-6">
        <h2 className="text-base font-bold text-gray-900 mb-4">Quick Management Actions</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button 
            onClick={() => onNavigate && onNavigate('employees')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:bg-slate-50 hover:border-blue-300 transition-all text-center group"
          >
            <UserPlus className="w-7 h-7 text-blue-600 mb-2 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold text-gray-900">Manage Personnel</span>
            <span className="text-[11px] text-gray-500 mt-0.5">Directory & onboarding</span>
          </button>
          
          <button 
            onClick={() => onNavigate && onNavigate('approvals-inbox')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:bg-slate-50 hover:border-emerald-300 transition-all text-center group"
          >
            <CalendarCheck className="w-7 h-7 text-emerald-600 mb-2 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold text-gray-900">Approvals Inbox</span>
            <span className="text-[11px] text-gray-500 mt-0.5">Leaves & profile changes</span>
          </button>

          <button 
            onClick={() => onNavigate && onNavigate('performance-reviews')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:bg-slate-50 hover:border-purple-300 transition-all text-center group"
          >
            <TrendingUp className="w-7 h-7 text-purple-600 mb-2 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold text-gray-900">Performance Reviews</span>
            <span className="text-[11px] text-gray-500 mt-0.5">Monthly, quarterly & annual</span>
          </button>

          <button 
            onClick={() => onNavigate && onNavigate('employee-reports')}
            className="flex flex-col items-center p-4 border border-gray-200 rounded-xl hover:bg-slate-50 hover:border-amber-300 transition-all text-center group"
          >
            <BarChart3 className="w-7 h-7 text-amber-600 mb-2 group-hover:scale-105 transition-transform" />
            <span className="text-xs font-semibold text-gray-900">Workforce Analytics</span>
            <span className="text-[11px] text-gray-500 mt-0.5">Headcount & metrics</span>
          </button>
        </div>
      </div>
    </div>
  );
};