import React, { useState } from 'react';
import { 
  X, 
  Star, 
  CheckCircle, 
  Calendar, 
  Award, 
  TrendingUp, 
  ShieldCheck, 
  Plus, 
  Trash2,
  FileSignature
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { PerformanceReview, PerformanceGoal, CompetencyRating, Employee, UserRole } from '../../types';

interface PerformanceReviewFormModalProps {
  review?: PerformanceReview | null;
  onClose: () => void;
  onSuccess?: () => void;
  employee?: Employee;
  isOpen?: boolean;
  onSave?: (updated: PerformanceReview) => void;
  currentUserRole?: UserRole;
  currentUserId?: string;
}

const defaultCompetenciesList = [
  {
    competencyId: 'comp-1',
    name: 'Technical & Role Competency',
    category: 'Execution',
    description: 'Job knowledge, code/work quality, architectural precision, adhering to domain standards.',
    currentLevel: 4,
    targetLevel: 5
  },
  {
    competencyId: 'comp-2',
    name: 'Collaboration & Teamwork',
    category: 'Teamwork',
    description: 'Cross-functional transparency, active listening, supporting peers, and team cohesion.',
    currentLevel: 4,
    targetLevel: 4
  },
  {
    competencyId: 'comp-3',
    name: 'Problem Solving & Innovation',
    category: 'Initiative',
    description: 'Critical thinking, resolving complex blockers independently, proposing scalable workflows.',
    currentLevel: 4,
    targetLevel: 5
  },
  {
    competencyId: 'comp-4',
    name: 'Accountability & Delivery',
    category: 'Execution',
    description: 'Honoring commitments, meeting sprint deadlines, reliability, taking full ownership of results.',
    currentLevel: 4,
    targetLevel: 5
  },
  {
    competencyId: 'comp-5',
    name: 'Leadership, Ethics & Compliance',
    category: 'Governance',
    description: 'Upholding statutory FICA standards, data privacy, business ethics, and guiding other staff.',
    currentLevel: 4,
    targetLevel: 5
  }
];

export const PerformanceReviewFormModal: React.FC<PerformanceReviewFormModalProps> = ({
  review,
  onClose,
  onSuccess
}) => {
  const { employees, addPerformanceReview, updatePerformanceReview } = useData();
  const { user } = useAuth();

  const isEmployeeRole = user?.role === 'employee';
  const isManagerOrAdmin = user?.role === 'line_manager' || user?.role === 'admin' || user?.role === 'hr_manager' || user?.role === 'hr_admin' || user?.role === 'super_admin';

  // Find target employee
  const initialEmpId = review?.employeeId || (isEmployeeRole ? (user?.employeeId || '1') : (employees[0]?.id || '1'));
  const [employeeId, setEmployeeId] = useState(initialEmpId);
  const targetEmployee = employees.find(e => e.id === employeeId || e.employeeId === employeeId) || employees[0];

  // Review Cycle
  const [reviewType, setReviewType] = useState<PerformanceReview['reviewType']>(review?.reviewType || 'monthly');
  const [cycleName, setCycleName] = useState(
    review?.cycleName || (reviewType === 'monthly' ? 'November 2026 Monthly Performance Sprint' : reviewType === 'quarterly' ? 'Q4 2026 Quarterly Performance Review' : '2026 Annual Performance & Growth Review')
  );
  const [startDate, setStartDate] = useState(review?.reviewPeriod.startDate || new Date(Date.now() - 86400000 * 30).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(review?.reviewPeriod.endDate || new Date().toISOString().split('T')[0]);

  // Goals State
  const initialGoals: PerformanceGoal[] = review?.goals && review.goals.length > 0 ? review.goals : [
    {
      id: `g-${Date.now()}-1`,
      title: 'Core Deliverables & Sprint Commitments',
      description: 'Achieve all assigned technical milestones and maintain high code quality standards.',
      targetDate: endDate,
      status: 'in_progress',
      progress: 90,
      weight: 50,
      measurableOutcomes: ['All sprint tickets closed with unit tests', 'Zero blocker regressions'],
      selfScore: 4,
      selfComments: 'Delivered core functionality on schedule with clean architectural separation.',
      managerScore: 4,
      managerComments: 'Consistently strong output and dependable delivery.'
    },
    {
      id: `g-${Date.now()}-2`,
      title: 'Compliance, FICA & System Security',
      description: 'Ensure all compliance rules, row-level access controls, and data protection policies are strictly enforced.',
      targetDate: endDate,
      status: 'completed',
      progress: 100,
      weight: 30,
      measurableOutcomes: ['Passed all security checks', 'All required policy agreements signed'],
      selfScore: 5,
      selfComments: 'Maintained 100% adherence to institutional policies and access controls.',
      managerScore: 5,
      managerComments: 'Exceptional attention to institutional security guidelines.'
    },
    {
      id: `g-${Date.now()}-3`,
      title: 'Mentorship & Professional Development',
      description: 'Engage in peer code reviews, continuous learning, and team technical enablement.',
      targetDate: endDate,
      status: 'in_progress',
      progress: 85,
      weight: 20,
      measurableOutcomes: ['Active peer review participation', 'Enrolled in advanced training'],
      selfScore: 4,
      selfComments: 'Actively contributed to architectural reviews and helped onboard team members.',
      managerScore: 4,
      managerComments: 'Great team player; provides constructive feedback to colleagues.'
    }
  ];
  const [goals, setGoals] = useState<PerformanceGoal[]>(initialGoals);

  // Competencies State
  const initialCompetencies: CompetencyRating[] = review?.competencies && review.competencies.length > 0
    ? review.competencies
    : defaultCompetenciesList.map(c => ({
        competencyId: c.competencyId,
        name: c.name,
        category: c.category,
        description: c.description,
        currentLevel: c.currentLevel,
        targetLevel: c.targetLevel,
        selfRating: 4,
        selfComments: 'Demonstrated solid performance aligned with team goals.',
        supervisorRating: 4,
        supervisorComments: 'Meets and occasionally exceeds expectations for level.',
        developmentActions: []
      }));
  const [competencies, setCompetencies] = useState<CompetencyRating[]>(initialCompetencies);

  // Summaries
  const [selfStrengths, setSelfStrengths] = useState(review?.selfAssessment?.strengths?.join('\n') || 'Proactive problem solving\nStrict adherence to security & compliance\nReliable sprint delivery');
  const [selfImprovements, setSelfImprovements] = useState(review?.selfAssessment?.areasForImprovement?.join('\n') || 'Deepen automated test coverage\nParticipate in tech brown-bag presentations');
  const [selfOverallComments, setSelfOverallComments] = useState(review?.selfAssessment?.overallComments || 'I feel confident in my contributions throughout this cycle and look forward to tackling more architectural leadership responsibilities.');

  const [managerComments, setManagerComments] = useState(review?.supervisorAssessment?.overallComments || 'Very pleased with the employee\'s growth, accountability, and technical rigor throughout this cycle.');
  const [developmentPlan, setDevelopmentPlan] = useState(review?.developmentPlan || 'Sponsor advanced cloud certifications and assign lead on upcoming multi-tenant scalability initiative.');

  // Electronic Signatures
  const [employeeSignName, setEmployeeSignName] = useState(review?.employeeSignature?.signedByName || (isEmployeeRole ? `${user?.firstName} ${user?.lastName}` : ''));
  const [employeeSignCheck, setEmployeeSignCheck] = useState(review?.employeeSignature?.signed || false);

  const [managerSignName, setManagerSignName] = useState(review?.managerSignature?.signedByName || (isManagerOrAdmin ? `${user?.firstName} ${user?.lastName}` : ''));
  const [managerSignCheck, setManagerSignCheck] = useState(review?.managerSignature?.signed || false);

  // Active form section
  const [activeSection, setActiveSection] = useState<'details' | 'goals' | 'competencies' | 'summary' | 'sign'>('goals');

  // Handle goal updates
  const updateGoalField = <K extends keyof PerformanceGoal>(index: number, field: K, value: PerformanceGoal[K]) => {
    setGoals(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  const handleAddGoal = () => {
    const newG: PerformanceGoal = {
      id: `g-${Date.now()}`,
      title: 'New Performance Objective',
      description: 'Describe key target or OKR milestone',
      targetDate: endDate,
      status: 'in_progress',
      progress: 0,
      weight: 20,
      measurableOutcomes: ['Specific deliverable metric'],
      selfScore: 3,
      managerScore: 3
    };
    setGoals([...goals, newG]);
  };

  const handleRemoveGoal = (index: number) => {
    setGoals(goals.filter((_, i) => i !== index));
  };

  // Handle competency updates
  const updateCompetencyField = <K extends keyof CompetencyRating>(index: number, field: K, value: CompetencyRating[K]) => {
    setCompetencies(prev => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  };

  // Calculate Overall Score
  const calculateOverallScore = () => {
    let totalScore = 0;
    let count = 0;
    competencies.forEach(c => {
      const score = c.supervisorRating || c.selfRating || 0;
      if (score > 0) {
        totalScore += score;
        count++;
      }
    });
    return count > 0 ? Number((totalScore / count).toFixed(1)) : 4.0;
  };

  const handleSubmit = (actionStatus: 'draft' | 'employee_submitted' | 'completed') => {
    const overallScore = calculateOverallScore();

    const reviewPayload = {
      employeeId: targetEmployee.id,
      reviewType,
      cycleName,
      reviewPeriod: {
        startDate,
        endDate
      },
      status: actionStatus,
      overallScore,
      goals,
      competencies,
      developmentPlan,
      selfAssessment: {
        ratings: competencies.map(c => ({
          category: c.name || 'General',
          score: c.selfRating || 4,
          comments: c.selfComments || ''
        })),
        overallComments: selfOverallComments,
        strengths: selfStrengths.split('\n').filter(s => s.trim() !== ''),
        areasForImprovement: selfImprovements.split('\n').filter(s => s.trim() !== ''),
        submittedAt: new Date().toISOString()
      },
      supervisorAssessment: actionStatus === 'completed' || isManagerOrAdmin ? {
        ratings: competencies.map(c => ({
          category: c.name || 'General',
          score: c.supervisorRating || 4,
          comments: c.supervisorComments || ''
        })),
        overallComments: managerComments,
        strengths: [],
        areasForImprovement: [],
        submittedAt: new Date().toISOString()
      } : review?.supervisorAssessment,
      employeeSignature: employeeSignCheck ? {
        signed: true,
        signedByName: employeeSignName || `${user?.firstName} ${user?.lastName}`,
        signedAt: review?.employeeSignature?.signedAt || new Date().toISOString()
      } : review?.employeeSignature,
      managerSignature: managerSignCheck && isManagerOrAdmin ? {
        signed: true,
        signedByName: managerSignName || `${user?.firstName} ${user?.lastName}`,
        signedAt: new Date().toISOString()
      } : review?.managerSignature
    };

    if (review?.id) {
      updatePerformanceReview(review.id, reviewPayload);
    } else {
      addPerformanceReview(reviewPayload);
    }

    if (onSuccess) onSuccess();
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden border border-gray-100">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 text-white p-6 flex items-start justify-between">
          <div>
            <div className="flex items-center gap-3">
              <span className="p-2 bg-blue-500/20 text-blue-400 rounded-lg">
                <Award className="w-5 h-5" />
              </span>
              <div>
                <h2 className="text-xl font-bold text-white">
                  {review?.id ? 'Performance Evaluation Form' : 'New Performance Evaluation Form'}
                </h2>
                <p className="text-xs text-slate-300 mt-0.5">
                  Structured assessment based on period goals, core competencies, and electronic sign-offs
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-300 mt-3 pt-3 border-t border-white/10">
              {isManagerOrAdmin && !review?.id ? (
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-white">Employee:</span>
                  <select
                    value={employeeId}
                    onChange={(e) => setEmployeeId(e.target.value)}
                    className="bg-slate-800 text-white border border-slate-700 rounded px-2 py-1 text-xs focus:ring-1 focus:ring-blue-500"
                  >
                    {employees.map(emp => (
                      <option key={emp.id} value={emp.id}>
                        {emp.personalInfo.firstName} {emp.personalInfo.lastName} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <span className="font-semibold text-white">
                  Employee: {targetEmployee.personalInfo.firstName} {targetEmployee.personalInfo.lastName} ({targetEmployee.employeeId})
                </span>
              )}
              <span>·</span>
              <span>Role: {targetEmployee.jobInfo.jobTitle}</span>
              <span>·</span>
              <span>Dept: {targetEmployee.jobInfo.department}</span>
              <span>·</span>
              <span className="capitalize px-2 py-0.5 bg-blue-500/30 text-blue-200 rounded font-medium">
                {reviewType} Cycle
              </span>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Section Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 overflow-x-auto">
          {[
            { id: 'goals', label: `1. Goals & OKRs (${goals.length})` },
            { id: 'competencies', label: `2. Core Competencies (${competencies.length})` },
            { id: 'summary', label: '3. Growth & Development' },
            { id: 'sign', label: '4. Review & Electronic Sign-Off' },
            { id: 'details', label: 'Cycle Settings' }
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveSection(tab.id as typeof activeSection)}
              className={`px-4 py-3 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                activeSection === tab.id
                  ? 'border-blue-600 text-blue-600 bg-white font-semibold'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50/50">
          
          {/* SECTION 1: GOALS & OKRS */}
          {activeSection === 'goals' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-bold text-gray-900">Period Goals & OKRs Evaluation</h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Rate achievements against deliverables and measurable outcomes for this {reviewType} review.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleAddGoal}
                  className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg hover:bg-blue-100"
                >
                  <Plus className="w-3.5 h-3.5 mr-1" />
                  Add Objective
                </button>
              </div>

              <div className="space-y-4">
                {goals.map((goal, idx) => (
                  <div key={goal.id} className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="w-6 h-6 rounded-full bg-slate-100 text-slate-700 text-xs font-bold flex items-center justify-center">
                            {idx + 1}
                          </span>
                          <input
                            type="text"
                            value={goal.title}
                            onChange={(e) => updateGoalField(idx, 'title', e.target.value)}
                            className="font-semibold text-gray-900 text-sm border-b border-transparent hover:border-gray-300 focus:border-blue-500 focus:outline-none w-full px-1"
                            placeholder="Objective title"
                          />
                        </div>
                        <textarea
                          value={goal.description}
                          onChange={(e) => updateGoalField(idx, 'description', e.target.value)}
                          rows={2}
                          className="w-full text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg p-2 focus:ring-1 focus:ring-blue-500 focus:outline-none mt-1"
                          placeholder="Describe the objective, target deliverable, or scope..."
                        />
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 rounded-md font-medium bg-blue-50 text-blue-700 border border-blue-200">
                          {goal.progress}% Completed
                        </span>
                        {goals.length > 1 && (
                          <button
                            type="button"
                            onClick={() => handleRemoveGoal(idx)}
                            className="text-gray-400 hover:text-red-500 p-1"
                            title="Remove objective"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Progress Slider */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-gray-100 text-xs">
                      <div>
                        <div className="flex justify-between text-gray-600 mb-1">
                          <span>Target Progress</span>
                          <span className="font-semibold text-gray-900">{goal.progress}%</span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={goal.progress}
                          onChange={(e) => updateGoalField(idx, 'progress', Number(e.target.value))}
                          className="w-full accent-blue-600 cursor-pointer"
                        />
                      </div>
                      <div>
                        <div className="flex justify-between text-gray-600 mb-1">
                          <span>Weighting</span>
                          <span className="font-semibold text-gray-900">{goal.weight || 25}%</span>
                        </div>
                        <input
                          type="number"
                          min="5"
                          max="100"
                          value={goal.weight || 25}
                          onChange={(e) => updateGoalField(idx, 'weight', Number(e.target.value))}
                          className="w-full px-2 py-1 bg-gray-50 border border-gray-200 rounded text-xs"
                        />
                      </div>
                    </div>

                    {/* Two Column Evaluation: Employee Self-Score & Manager Score */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                      {/* Employee Self-Score */}
                      <div className="p-3 bg-blue-50/50 rounded-lg border border-blue-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-900">Employee Self-Rating</span>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                disabled={!isEmployeeRole && !isManagerOrAdmin}
                                onClick={() => updateGoalField(idx, 'selfScore', star)}
                                className={`p-0.5 ${star <= (goal.selfScore || 0) ? 'text-amber-500' : 'text-gray-300'} hover:scale-110 transition-transform`}
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-gray-700 ml-1">{goal.selfScore || 0}/5</span>
                          </div>
                        </div>
                        <textarea
                          value={goal.selfComments || ''}
                          onChange={(e) => updateGoalField(idx, 'selfComments', e.target.value)}
                          rows={2}
                          className="w-full text-xs bg-white border border-blue-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Employee self-reflection on milestones achieved..."
                        />
                      </div>

                      {/* Manager Score */}
                      <div className="p-3 bg-slate-100/70 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">Manager Evaluation Rating</span>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <button
                                key={star}
                                type="button"
                                disabled={!isManagerOrAdmin}
                                onClick={() => updateGoalField(idx, 'managerScore', star)}
                                className={`p-0.5 ${star <= (goal.managerScore || 0) ? 'text-indigo-600' : 'text-gray-300'} hover:scale-110 transition-transform`}
                              >
                                <Star className="w-4 h-4 fill-current" />
                              </button>
                            ))}
                            <span className="text-xs font-bold text-gray-700 ml-1">{goal.managerScore || 0}/5</span>
                          </div>
                        </div>
                        <textarea
                          value={goal.managerComments || ''}
                          onChange={(e) => updateGoalField(idx, 'managerComments', e.target.value)}
                          rows={2}
                          disabled={!isManagerOrAdmin}
                          className="w-full text-xs bg-white border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                          placeholder={isManagerOrAdmin ? "Manager evaluation feedback on this goal..." : "Awaiting manager assessment..."}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 2: CORE COMPETENCIES */}
          {activeSection === 'competencies' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Core Competencies Evaluation</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Evaluate behavioral and professional competencies based on standard corporate benchmarks (1 = Needs Development, 3 = Meets Expectations, 5 = Role Model).
                </p>
              </div>

              <div className="space-y-4">
                {competencies.map((comp, idx) => (
                  <div key={comp.competencyId} className="bg-white border border-gray-200 rounded-xl p-5 shadow-xs space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-xs font-semibold rounded">
                            {comp.category}
                          </span>
                          <h4 className="text-sm font-bold text-gray-900">{comp.name}</h4>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">{comp.description}</p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-gray-100">
                      {/* Self-Rating */}
                      <div className="p-3 bg-blue-50/40 rounded-lg border border-blue-100 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-blue-900">Employee Self-Score</span>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                disabled={!isEmployeeRole && !isManagerOrAdmin}
                                onClick={() => updateCompetencyField(idx, 'selfRating', lvl)}
                                className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                                  comp.selfRating === lvl
                                    ? 'bg-blue-600 text-white shadow-xs'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                }`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={comp.selfComments || ''}
                          onChange={(e) => updateCompetencyField(idx, 'selfComments', e.target.value)}
                          rows={2}
                          className="w-full text-xs bg-white border border-blue-200 rounded p-2 focus:outline-none focus:ring-1 focus:ring-blue-500"
                          placeholder="Evidence of demonstrating this competency..."
                        />
                      </div>

                      {/* Supervisor Rating */}
                      <div className="p-3 bg-slate-100/60 rounded-lg border border-slate-200 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-slate-800">Manager Evaluation</span>
                          <div className="flex items-center space-x-1">
                            {[1, 2, 3, 4, 5].map((lvl) => (
                              <button
                                key={lvl}
                                type="button"
                                disabled={!isManagerOrAdmin}
                                onClick={() => updateCompetencyField(idx, 'supervisorRating', lvl)}
                                className={`w-6 h-6 rounded text-xs font-bold transition-all ${
                                  comp.supervisorRating === lvl
                                    ? 'bg-indigo-600 text-white shadow-xs'
                                    : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-100'
                                } disabled:opacity-60`}
                              >
                                {lvl}
                              </button>
                            ))}
                          </div>
                        </div>
                        <textarea
                          value={comp.supervisorComments || ''}
                          onChange={(e) => updateCompetencyField(idx, 'supervisorComments', e.target.value)}
                          rows={2}
                          disabled={!isManagerOrAdmin}
                          className="w-full text-xs bg-white border border-gray-300 rounded p-2 focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100 disabled:text-gray-500"
                          placeholder={isManagerOrAdmin ? "Manager observations & behavioral coaching..." : "Awaiting manager input..."}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SECTION 3: GROWTH & DEVELOPMENT */}
          {activeSection === 'summary' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Summary, Accomplishments & Growth Plan</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Summarize key accomplishments, focus areas for improvement, and upcoming mentorship or training programs.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-blue-900 flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-blue-600" />
                    Employee Self-Assessment Summary
                  </h4>
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Key Strengths & Major Accomplishments
                    </label>
                    <textarea
                      value={selfStrengths}
                      onChange={(e) => setSelfStrengths(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                      placeholder="List key successes (one per line)..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Areas Identified for Growth & Improvement
                    </label>
                    <textarea
                      value={selfImprovements}
                      onChange={(e) => setSelfImprovements(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                      placeholder="List personal growth opportunities..."
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Employee Overall Reflection & Feedback
                    </label>
                    <textarea
                      value={selfOverallComments}
                      onChange={(e) => setSelfOverallComments(e.target.value)}
                      rows={3}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-blue-500"
                      placeholder="General comments on role, team support, and career trajectory..."
                    />
                  </div>
                </div>

                <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Award className="w-4 h-4 text-indigo-600" />
                    Manager Review & Development Action Plan
                  </h4>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Manager Overall Assessment & Feedback
                    </label>
                    <textarea
                      value={managerComments}
                      onChange={(e) => setManagerComments(e.target.value)}
                      rows={4}
                      disabled={!isManagerOrAdmin}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
                      placeholder={isManagerOrAdmin ? "Provide holistic review feedback..." : "Awaiting manager input..."}
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Career Development, Training & Next Cycle Plan
                    </label>
                    <textarea
                      value={developmentPlan}
                      onChange={(e) => setDevelopmentPlan(e.target.value)}
                      rows={4}
                      disabled={!isManagerOrAdmin}
                      className="w-full text-xs p-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
                      placeholder={isManagerOrAdmin ? "Detail specific courses, certifications, and growth milestones..." : "Awaiting manager development plan..."}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 4: REVIEW & ELECTRONIC SIGN-OFF */}
          {activeSection === 'sign' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-base font-bold text-gray-900">Review & Electronic Signatures</h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  Both parties review all evaluated goals, competencies, and developmental objectives and certify the record with an electronic signature.
                </p>
              </div>

              {/* Score Snapshot */}
              <div className="bg-white p-5 rounded-xl border border-gray-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Calculated Score</span>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-2xl font-bold text-gray-900">{calculateOverallScore()}</span>
                    <span className="text-sm text-gray-400">/ 5.0</span>
                    <div className="flex items-center text-amber-500 ml-2">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className={`w-4 h-4 ${s <= calculateOverallScore() ? 'fill-current' : 'text-gray-200'}`} />
                      ))}
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-600 space-y-1">
                  <div>Objectives Evaluated: <span className="font-semibold text-gray-900">{goals.length}</span></div>
                  <div>Competencies Evaluated: <span className="font-semibold text-gray-900">{competencies.length}</span></div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Employee Signature Card */}
                <div className="bg-white p-5 rounded-xl border border-blue-200 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                      <FileSignature className="w-4 h-4 text-blue-600" />
                      Employee Self-Review Sign-Off
                    </span>
                    {employeeSignCheck && (
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex items-center">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Signed
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    "I hereby certify that I have conducted a diligent self-evaluation of my period goals, competencies, and achievements to the best of my knowledge."
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Signatory Full Legal Name
                      </label>
                      <input
                        type="text"
                        value={employeeSignName}
                        onChange={(e) => setEmployeeSignName(e.target.value)}
                        placeholder="e.g. Johnathan Doe"
                        className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                    </div>

                    <label className="flex items-start gap-2.5 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={employeeSignCheck}
                        onChange={(e) => setEmployeeSignCheck(e.target.checked)}
                        className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-xs text-gray-700 select-none">
                        I confirm and affix my electronic signature to this evaluation on {new Date().toLocaleDateString()}.
                      </span>
                    </label>
                  </div>
                </div>

                {/* Manager Signature Card */}
                <div className="bg-white p-5 rounded-xl border border-slate-300 shadow-xs space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 uppercase tracking-wider flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4 text-indigo-600" />
                      Manager & HR Review Sign-Off
                    </span>
                    {managerSignCheck && (
                      <span className="text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full font-medium flex items-center">
                        <CheckCircle className="w-3.5 h-3.5 mr-1" /> Approved
                      </span>
                    )}
                  </div>

                  <p className="text-xs text-gray-600 leading-relaxed">
                    "I confirm that I have evaluated the employee's performance, conducted a 1-on-1 feedback discussion, and agreed on development action items."
                  </p>

                  <div className="space-y-3 pt-2">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">
                        Manager / Reviewer Full Name
                      </label>
                      <input
                        type="text"
                        value={managerSignName}
                        onChange={(e) => setManagerSignName(e.target.value)}
                        disabled={!isManagerOrAdmin}
                        placeholder="e.g. David Chen (Engineering Director)"
                        className="w-full text-xs p-2 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-500 disabled:bg-gray-100"
                      />
                    </div>

                    <label className={`flex items-start gap-2.5 ${isManagerOrAdmin ? 'cursor-pointer' : 'opacity-60 cursor-not-allowed'}`}>
                      <input
                        type="checkbox"
                        checked={managerSignCheck}
                        disabled={!isManagerOrAdmin}
                        onChange={(e) => setManagerSignCheck(e.target.checked)}
                        className="mt-0.5 rounded text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-xs text-gray-700 select-none">
                        Manager confirmation & sign-off ({isManagerOrAdmin ? 'Authorized' : 'Requires Manager/HR Login'}).
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* SECTION 5: CYCLE SETTINGS */}
          {activeSection === 'details' && (
            <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs space-y-4">
              <h3 className="text-sm font-bold text-gray-900">Review Cycle Configuration</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Review Cadence / Type</label>
                  <select
                    value={reviewType}
                    onChange={(e) => {
                      const val = e.target.value as PerformanceReview['reviewType'];
                      setReviewType(val);
                      if (val === 'monthly') setCycleName('November 2026 Monthly Performance Sprint');
                      else if (val === 'quarterly') setCycleName('Q4 2026 Quarterly Performance Review');
                      else if (val === 'annual') setCycleName('2026 Annual Comprehensive Performance Review');
                    }}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                  >
                    <option value="monthly">Monthly Review (Continuous Feedback)</option>
                    <option value="quarterly">Quarterly Review (Quarterly OKRs)</option>
                    <option value="annual">Annual Review (Year-End Evaluation)</option>
                    <option value="semi_annual">Semi-Annual Review</option>
                    <option value="probationary">Probationary Review</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Cycle Title</label>
                  <input
                    type="text"
                    value={cycleName}
                    onChange={(e) => setCycleName(e.target.value)}
                    className="w-full text-xs p-2 border border-gray-300 rounded-lg"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Period Start Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Period End Date</label>
                  <div className="relative">
                    <Calendar className="w-4 h-4 text-gray-400 absolute left-2.5 top-2.5" />
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg"
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="p-4 sm:px-6 bg-white border-t border-gray-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() => handleSubmit('draft')}
              className="px-4 py-2 border border-slate-300 bg-white text-slate-800 rounded-lg text-xs font-medium hover:bg-slate-50"
            >
              Save as Draft
            </button>
          </div>

          <div className="flex items-center gap-2">
            {/* If Employee: Submit Self-Assessment */}
            <button
              type="button"
              onClick={() => handleSubmit('employee_submitted')}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-medium hover:bg-blue-700 shadow-xs flex items-center gap-1.5"
            >
              <FileSignature className="w-4 h-4" />
              Submit Self-Assessment
            </button>

            {/* If Manager or Admin: Finalize & Sign */}
            {isManagerOrAdmin && (
              <button
                type="button"
                onClick={() => handleSubmit('completed')}
                className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-medium hover:bg-emerald-700 shadow-xs flex items-center gap-1.5"
              >
                <CheckCircle className="w-4 h-4" />
                Finalize & Sign Review
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
