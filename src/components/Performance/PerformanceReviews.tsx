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
  Users, 
  Grid, 
  HeartHandshake, 
  DollarSign, 
  Lock, 
  AlertTriangle, 
  ShieldCheck, 
  X 
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { PerformanceReview } from '../../types';
import { PerformanceReviewFormModal } from './PerformanceReviewFormModal';
import { 
  calculate360ReviewScore, 
  getAuthorizedCompensationBands, 
  generatePulseSurveyReport, 
  assessTalentAndAttritionRisk,
  CompensationBand,
  PulseSurveyResponse
} from '../../services/talentEngine';

export const PerformanceReviews: React.FC = () => {
  const { 
    performanceReviews, 
    employees 
  } = useData();
  const { user } = useAuth();

  const [activeMainTab, setActiveMainTab] = useState<'reviews' | '360_feedback' | '9box_matrix' | 'pulse_surveys' | 'compensation'>('reviews');
  const [activeCycleTab, setActiveCycleTab] = useState<'all' | 'monthly' | 'quarterly' | 'annual'>('all');
  const [selectedReview, setSelectedReview] = useState<PerformanceReview | null>(null);
  const [editingReview, setEditingReview] = useState<PerformanceReview | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  const getEmployeeName = (empId?: string) => {
    if (!empId) return 'Assigned Reviewer';
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

  // Sample 360 evaluations data for talent demonstration
  const sample360Evaluations = [
    { relationship: 'manager' as const, score: 4.6, rater: 'Director Marcus Garvey' },
    { relationship: 'peer' as const, score: 4.2, rater: 'Senior Engineer Aaliyah Brown' },
    { relationship: 'direct_report' as const, score: 4.8, rater: 'Junior Developer Devon' },
    { relationship: 'self' as const, score: 4.0, rater: 'Self-Assessment' },
  ];
  const composite360 = calculate360ReviewScore(sample360Evaluations);

  // 9-Box Talent Assessments
  const talentAssessments = employees.map((emp, idx) => {
    const perf = (idx % 3 === 0 ? 3 : idx % 2 === 0 ? 2 : 1) as 1 | 2 | 3;
    const pot = (idx % 2 === 0 ? 3 : 2) as 1 | 2 | 3;
    const compa = idx === 0 ? 0.84 : 1.05; // first employee is underpaid
    const stagnantMonths = idx === 0 ? 28 : 12;

    return assessTalentAndAttritionRisk({
      employeeId: emp.id,
      employeeName: `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}`,
      department: emp.jobInfo.department || 'Operations',
      performanceScore: perf,
      potentialScore: pot,
      tenureYears: 2.5 + idx * 0.5,
      monthsSinceLastPromotionOrRaise: stagnantMonths,
      salaryCompaRatio: compa,
    });
  });

  // Pulse Survey with k-anonymity demonstration
  const pulseResponses: PulseSurveyResponse[] = [
    // Legal (N=3 responses -> k-anonymity triggered)
    { surveyId: 'pulse-q4', department: 'Legal', score: 8, feedback: 'Collaborative team' },
    { surveyId: 'pulse-q4', department: 'Legal', score: 7, feedback: 'Good balance' },
    { surveyId: 'pulse-q4', department: 'Legal', score: 4, feedback: 'Tight deadlines' },
    // Engineering (N=7 responses -> safe to aggregate)
    { surveyId: 'pulse-q4', department: 'Engineering', score: 10, feedback: 'Great leadership and technical autonomy' },
    { surveyId: 'pulse-q4', department: 'Engineering', score: 9, feedback: 'Strong culture of peer support' },
    { surveyId: 'pulse-q4', department: 'Engineering', score: 9, feedback: 'Modern tech stack and CI/CD' },
    { surveyId: 'pulse-q4', department: 'Engineering', score: 9, feedback: 'Empowering team' },
    { surveyId: 'pulse-q4', department: 'Engineering', score: 8, feedback: 'Good compensation and benefits' },
    { surveyId: 'pulse-q4', department: 'Engineering', score: 7, feedback: 'Satisfactory sprint cadence' },
    { surveyId: 'pulse-q4', department: 'Engineering', score: 4, feedback: 'Need clearer specifications' },
  ];

  const engSurveyReport = generatePulseSurveyReport(pulseResponses, 'pulse-q4', 'Engineering', 5);
  const legalSurveyReport = generatePulseSurveyReport(pulseResponses, 'pulse-q4', 'Legal', 5);

  // Compensation Bands with RBAC Protection
  const rawSalaryBands: CompensationBand[] = [
    { id: 'b1', jobFamily: 'Engineering', levelCode: 'L3', title: 'Mid Software Engineer', minSalary: 280000, midSalary: 350000, maxSalary: 420000, currency: 'JMD' },
    { id: 'b2', jobFamily: 'Engineering', levelCode: 'L4', title: 'Senior Software Engineer', minSalary: 420000, midSalary: 520000, maxSalary: 650000, currency: 'JMD' },
    { id: 'b3', jobFamily: 'Finance', levelCode: 'L4', title: 'Senior Financial Analyst', minSalary: 380000, midSalary: 470000, maxSalary: 580000, currency: 'JMD' },
    { id: 'b4', jobFamily: 'Human Resources', levelCode: 'L5', title: 'HR Director', minSalary: 600000, midSalary: 750000, maxSalary: 950000, currency: 'JMD' },
  ];

  let authorizedBands: CompensationBand[] | null = null;
  let compensationAuthError: string | null = null;
  try {
    authorizedBands = getAuthorizedCompensationBands(user?.role || 'employee', rawSalaryBands);
  } catch (err: unknown) {
    compensationAuthError = err instanceof Error ? err.message : String(err);
  }

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <Award className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Performance, Talent & Engagement Suite</h1>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            BambooHR and HiBob-grade reviews, 360-degree feedback, 9-box talent matrix, pulse surveys with k-anonymity, and salary bands
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              setEditingReview(null);
              setShowNewModal(true);
            }}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs cursor-pointer"
          >
            <Plus className="w-4 h-4 mr-1.5" />
            {user?.role === 'employee' ? 'Start Evaluation Form' : 'New Performance Evaluation'}
          </button>
        </div>
      </div>

      {/* Main Suite Navigation Tabs */}
      <div className="flex border-b border-gray-200 gap-6 text-sm font-semibold">
        <button
          onClick={() => setActiveMainTab('reviews')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeMainTab === 'reviews' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <FileSignature className="w-4 h-4" />
          Review Cycles ({filteredReviews.length})
        </button>

        <button
          onClick={() => setActiveMainTab('360_feedback')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeMainTab === '360_feedback' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Users className="w-4 h-4" />
          360° Multi-Rater Feedback
        </button>

        <button
          onClick={() => setActiveMainTab('9box_matrix')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeMainTab === '9box_matrix' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <Grid className="w-4 h-4" />
          9-Box Talent Matrix & Attrition
        </button>

        <button
          onClick={() => setActiveMainTab('pulse_surveys')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeMainTab === 'pulse_surveys' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <HeartHandshake className="w-4 h-4" />
          Pulse Surveys (k-Anonymity)
        </button>

        <button
          onClick={() => setActiveMainTab('compensation')}
          className={`pb-3 flex items-center gap-2 border-b-2 transition-colors cursor-pointer ${
            activeMainTab === 'compensation' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-800'
          }`}
        >
          <DollarSign className="w-4 h-4" />
          Compensation Bands (RBAC)
        </button>
      </div>

      {/* TAB 1: Review Cycles */}
      {activeMainTab === 'reviews' && (
        <div className="space-y-4">
          {/* Cycle Filtering Tabs */}
          <div className="bg-white rounded-xl border border-gray-200 p-2 shadow-2xs flex flex-wrap items-center justify-between gap-2">
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
                  className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
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
          <div className="bg-white rounded-xl shadow-2xs border border-gray-200 overflow-hidden divide-y divide-gray-200">
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

                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                      <span className="font-medium text-gray-700">Staff Member: {getEmployeeName(review.employeeId)}</span>
                      <span>Reviewer: {getEmployeeName(review.reviewerId)}</span>
                      <span className="flex items-center gap-1 font-mono">
                        <Calendar className="w-3.5 h-3.5 text-gray-400" />
                        {review.reviewPeriod.startDate} to {review.reviewPeriod.endDate}
                      </span>
                    </div>

                    {review.finalScore && (
                      <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-semibold text-gray-700">Final Composite Rating:</span>
                        <div className="flex items-center text-amber-500">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <Star 
                              key={star} 
                              className={`w-4 h-4 ${star <= (review.finalScore || 0) ? 'fill-current' : 'text-gray-300'}`} 
                            />
                          ))}
                        </div>
                        <span className="text-xs font-bold text-gray-900">{review.finalScore.toFixed(1)} / 5.0</span>
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setSelectedReview(review)}
                      className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      <Eye className="w-3.5 h-3.5 inline mr-1 text-blue-600" />
                      View Details
                    </button>
                    <button
                      onClick={() => {
                        setEditingReview(review);
                        setShowNewModal(true);
                      }}
                      className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold cursor-pointer transition-colors"
                    >
                      Evaluate
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: 360-Degree Feedback */}
      {activeMainTab === '360_feedback' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900">360-Degree Multi-Rater Feedback Calibration</h2>
            <p className="text-xs text-gray-500 mt-1">
              Balanced multi-source performance reviews incorporating Manager (40%), Peer (30%), Direct Report (20%), and Self-Assessment (10%)
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="p-6 bg-gradient-to-br from-indigo-900 to-slate-900 text-white rounded-xl shadow-md flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-300">Composite Calibration</span>
                <div className="mt-3 text-4xl font-extrabold font-mono text-emerald-400">
                  {composite360.compositeScore.toFixed(2)} <span className="text-sm font-normal text-slate-300">/ 5.00</span>
                </div>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/20 text-emerald-300 rounded-lg text-xs font-semibold border border-emerald-500/30">
                  <Award className="w-3.5 h-3.5" />
                  {composite360.ratingCategory}
                </div>
              </div>
              <p className="text-xs text-slate-400 mt-6">
                Calibrated across 4 independent evaluation perspectives with mathematical role weighting.
              </p>
            </div>

            <div className="md:col-span-2 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">Multi-Rater Scoring Distribution</h3>
              <div className="space-y-2">
                {sample360Evaluations.map((ev, i) => (
                  <div key={i} className="p-3 bg-slate-50 border border-slate-200 rounded-lg flex items-center justify-between text-xs">
                    <div>
                      <span className="font-bold text-gray-900 capitalize">{ev.relationship.replace('_', ' ')}</span>
                      <span className="text-gray-400 ml-2 font-mono">({ev.rater})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-24 bg-gray-200 h-2 rounded-full overflow-hidden">
                        <div className="bg-indigo-600 h-full" style={{ width: `${(ev.score / 5.0) * 100}%` }}></div>
                      </div>
                      <span className="font-bold font-mono text-gray-900">{ev.score.toFixed(1)}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 9-Box Talent Matrix */}
      {activeMainTab === '9box_matrix' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-6">
          <div className="border-b pb-4">
            <h2 className="text-xl font-bold text-gray-900">9-Box Talent Matrix & Predictive Attrition Flight Risk</h2>
            <p className="text-xs text-gray-500 mt-1">
              Data-driven talent distribution mapping Performance vs Potential with automated attrition risk indicators
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-semibold">
            {/* 9 Box Categories Preview */}
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
              <span className="text-emerald-800 uppercase font-bold text-[11px] block">Top Talent (Stars)</span>
              <p className="text-2xl font-bold text-emerald-900 mt-1">
                {talentAssessments.filter(t => t.boxCategory === 'star').length} Personnel
              </p>
              <span className="text-[11px] text-emerald-700 block mt-1">High Performance · High Potential</span>
            </div>

            <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
              <span className="text-blue-800 uppercase font-bold text-[11px] block">Core Growth Players</span>
              <p className="text-2xl font-bold text-blue-900 mt-1">
                {talentAssessments.filter(t => t.boxCategory === 'core_player' || t.boxCategory === 'high_performer').length} Personnel
              </p>
              <span className="text-[11px] text-blue-700 block mt-1">Solid Contributors · Steady Growth</span>
            </div>

            <div className="p-4 bg-rose-50 border border-rose-200 rounded-xl">
              <span className="text-rose-800 uppercase font-bold text-[11px] block">Elevated Flight Risk</span>
              <p className="text-2xl font-bold text-rose-900 mt-1">
                {talentAssessments.filter(t => t.attritionRisk === 'critical' || t.attritionRisk === 'high').length} Personnel
              </p>
              <span className="text-[11px] text-rose-700 block mt-1">Compa-ratio &lt;90% or 24+ mo stagnant</span>
            </div>
          </div>

          {/* Talent Roster Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                  <th className="py-2.5 px-3">Employee</th>
                  <th className="py-2.5 px-3">Department</th>
                  <th className="py-2.5 px-3 text-center">9-Box Quadrant</th>
                  <th className="py-2.5 px-3 text-center">Attrition Risk</th>
                  <th className="py-2.5 px-3">Data-Driven Flight Risk Drivers</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {talentAssessments.map(t => (
                  <tr key={t.employeeId} className="hover:bg-slate-50">
                    <td className="py-2.5 px-3 font-bold text-gray-900">{t.employeeName}</td>
                    <td className="py-2.5 px-3 text-gray-600">{t.department}</td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[11px] font-bold uppercase ${
                        t.boxCategory === 'star' ? 'bg-emerald-100 text-emerald-800' :
                        t.boxCategory === 'high_performer' ? 'bg-blue-100 text-blue-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {t.boxCategory.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        t.attritionRisk === 'critical' ? 'bg-rose-100 text-rose-800 border border-rose-300' :
                        t.attritionRisk === 'high' ? 'bg-amber-100 text-amber-800' :
                        'bg-emerald-50 text-emerald-700'
                      }`}>
                        {t.attritionRisk} Risk
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-gray-600 text-[11px]">
                      {t.attritionDrivers.length > 0 ? (
                        <ul className="list-disc list-inside space-y-0.5">
                          {t.attritionDrivers.map((d, i) => <li key={i}>{d}</li>)}
                        </ul>
                      ) : (
                        <span className="text-gray-400">Stable compensation & promotion cadence</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: Pulse Surveys with k-Anonymity */}
      {activeMainTab === 'pulse_surveys' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-6">
          <div className="border-b pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">Pulse Surveys with Guaranteed k-Anonymity (N &ge; 5)</h2>
              <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded border border-emerald-200 flex items-center gap-1">
                <ShieldCheck className="w-3 h-3" /> Zero-Retaliation Guard
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Surveys enforce a strict minimum threshold of 5 respondents per demographic slice before results can be unlocked
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Group 1: Engineering (N=7 >= 5 -> UNLOCKED) */}
            <div className="p-5 bg-slate-50 border border-slate-200 rounded-xl space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-gray-900">Engineering Department</h3>
                  <span className="text-[11px] text-gray-500">{engSurveyReport.totalResponses} respondents (Threshold met)</span>
                </div>
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded">
                  Report Active
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">Avg Satisfaction</span>
                  <div className="text-2xl font-bold text-gray-900 mt-1">{engSurveyReport.averageScore} / 10</div>
                </div>
                <div className="p-3 bg-white rounded-lg border border-gray-200">
                  <span className="text-[10px] uppercase font-bold text-gray-500 block">eNPS Score</span>
                  <div className="text-2xl font-bold text-emerald-600 mt-1">+{engSurveyReport.eNpsScore}</div>
                </div>
              </div>

              <div>
                <span className="text-[11px] font-bold uppercase text-gray-600 block mb-1">Anonymized Employee Feedback:</span>
                <div className="space-y-1.5 text-xs text-gray-700 max-h-36 overflow-y-auto">
                  {engSurveyReport.anonymizedComments?.map((c, i) => (
                    <div key={i} className="p-2 bg-white rounded border border-gray-200 italic">
                      "{c}"
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Group 2: Legal (N=3 < 5 -> MASKED BY K-ANONYMITY) */}
            <div className="p-5 bg-amber-50/60 border border-amber-200 rounded-xl space-y-4 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-sm font-bold text-amber-900">Legal Department</h3>
                    <span className="text-[11px] text-amber-700">{legalSurveyReport.totalResponses} respondents (N &lt; 5)</span>
                  </div>
                  <span className="text-xs font-bold text-amber-800 bg-amber-200/80 px-2 py-0.5 rounded flex items-center gap-1">
                    <Lock className="w-3 h-3" /> k-Anonymity Locked
                  </span>
                </div>

                <div className="mt-4 p-3 bg-white/80 border border-amber-300 rounded-lg text-xs text-amber-800 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>{legalSurveyReport.maskReason}</span>
                </div>
              </div>

              <p className="text-[11px] text-amber-700 italic">
                Feedback and individual ratings are cryptographically sealed to protect the identity of respondents in small groups.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: Compensation Bands (RBAC Protected) */}
      {activeMainTab === 'compensation' && (
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-2xs space-y-6">
          <div className="border-b pb-4">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">Corporate Compensation & Salary Bands</h2>
              <span className="bg-blue-50 text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded border border-blue-200">
                RBAC Access Control
              </span>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Restricted to authorized HR Administrators, Finance Directors, and Super Admins
            </p>
          </div>

          {compensationAuthError ? (
            <div className="p-6 bg-rose-50 border border-rose-200 rounded-xl text-center space-y-2">
              <Lock className="w-8 h-8 mx-auto text-rose-500" />
              <h3 className="text-sm font-bold text-rose-900">Authorization Restriction</h3>
              <p className="text-xs text-rose-700 max-w-md mx-auto">{compensationAuthError}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-gray-200 bg-gray-50 text-[11px] font-semibold text-gray-600 uppercase tracking-wider">
                    <th className="py-2.5 px-3">Job Family</th>
                    <th className="py-2.5 px-3">Level</th>
                    <th className="py-2.5 px-3">Benchmark Title</th>
                    <th className="py-2.5 px-3 text-right">Band Min</th>
                    <th className="py-2.5 px-3 text-right">Band Midpoint</th>
                    <th className="py-2.5 px-3 text-right">Band Max</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 font-mono">
                  {authorizedBands?.map(band => (
                    <tr key={band.id} className="hover:bg-slate-50">
                      <td className="py-2.5 px-3 font-sans font-semibold text-gray-900">{band.jobFamily}</td>
                      <td className="py-2.5 px-3 text-blue-600 font-bold">{band.levelCode}</td>
                      <td className="py-2.5 px-3 font-sans text-gray-700">{band.title}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">${band.minSalary.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right font-bold text-gray-900">${band.midSalary.toLocaleString()}</td>
                      <td className="py-2.5 px-3 text-right text-gray-600">${band.maxSalary.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Detail Modal */}
      {selectedReview && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 flex items-center justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                  {selectedReview.reviewType}
                </span>
                <h2 className="text-lg font-bold text-gray-900 mt-1">
                  {selectedReview.cycleName || `${getEmployeeName(selectedReview.employeeId)} Review`}
                </h2>
              </div>
              <button 
                onClick={() => setSelectedReview(null)}
                className="text-gray-400 hover:text-gray-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-4 p-3 bg-slate-50 rounded-lg">
                <div>
                  <span className="text-gray-500">Employee:</span>
                  <p className="font-bold text-gray-900">{getEmployeeName(selectedReview.employeeId)}</p>
                </div>
                <div>
                  <span className="text-gray-500">Reviewer:</span>
                  <p className="font-bold text-gray-900">{getEmployeeName(selectedReview.reviewerId)}</p>
                </div>
              </div>

              {selectedReview.feedback && (
                <div>
                  <h4 className="font-bold text-gray-800 uppercase tracking-wider text-[11px] mb-1">Qualitative Feedback:</h4>
                  <p className="p-3 bg-gray-50 rounded-lg text-gray-700 italic border">
                    "{selectedReview.feedback}"
                  </p>
                </div>
              )}
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
              <button
                onClick={() => setSelectedReview(null)}
                className="px-4 py-2 text-xs font-semibold text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 cursor-pointer"
              >
                Close
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