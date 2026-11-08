import React, { useState } from 'react';
import { 
  Users, 
  UserPlus, 
  Briefcase, 
  Clock, 
  Plus, 
  Calendar, 
  Star, 
  X, 
  UserCheck, 
  Check,
  FileText,
  ShieldCheck,
  Globe,
  Calculator,
  Search,
  CheckCircle2,
  Lock
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Candidate, JobRequisition, ExitClearance } from '../../types';
import {
  scoreCandidateInterview,
  generateTamperEvidentOfferLetter,
  calculateExitSettlement,
  validateCandidateConsentAndRetention,
  ScorecardResult,
  SignedOfferResult,
  ExitSettlementResult
} from '../../services/recruitingEngine';

export const HiringOnboardingHub: React.FC = () => {
  const { 
    candidates, 
    jobRequisitions, 
    onboardingTasks, 
    exitClearances, 
    currentTenant,
    addJobRequisition,
    addCandidate,
    updateCandidateStage,
    convertCandidateToEmployee,
    updateOnboardingTask,
    updateExitClearanceItem
  } = useData();

  const [activeTab, setActiveTab] = useState<'pipeline' | 'requisitions' | 'onboarding' | 'exit' | 'careers-portal'>('pipeline');

  // Modals
  const [showReqModal, setShowReqModal] = useState(false);
  const [showCandModal, setShowCandModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [candSubTab, setCandSubTab] = useState<'overview' | 'scorecard' | 'offer'>('overview');

  // Candidate Scorecard Form
  const [scoreForm, setScoreForm] = useState({
    technical: 4,
    problemSolving: 4,
    culturalAlignment: 4,
    communication: 4,
    notes: 'Demonstrated strong subject matter expertise and clear communication style.'
  });
  const [scorecardResult, setScorecardResult] = useState<ScorecardResult | null>(null);

  // Offer Letter Form
  const [offerForm, setOfferForm] = useState({
    baseSalary: 120000,
    startDate: new Date(Date.now() + 86400000 * 14).toISOString().split('T')[0],
    expiryDays: 7,
    signerName: 'Marcus Sterling',
    signerEmail: 'm.sterling@verticalhr.com',
    signerIp: '190.130.45.12'
  });
  const [signedOfferResult, setSignedOfferResult] = useState<SignedOfferResult | null>(null);

  // Exit Settlement Modal State
  const [selectedExitForSettlement, setSelectedExitForSettlement] = useState<ExitClearance | null>(null);
  const [settlementForm, setSettlementForm] = useState({
    monthlySalary: 350000,
    daysWorkedInMonth: 15,
    totalWorkingDaysInMonth: 22,
    accruedVacationDays: 8.5,
    equipmentDeductionsMinorUnits: 0,
    unreimbursedAdvancesMinorUnits: 0
  });
  const [settlementResult, setSettlementResult] = useState<ExitSettlementResult | null>(null);

  // Careers Portal Live Application Form State
  const [selectedCareerJob, setSelectedCareerJob] = useState<JobRequisition | null>(null);
  const [careerAppForm, setCareerAppForm] = useState({
    name: '',
    email: '',
    phone: '',
    resumeName: 'Resume_2026.pdf',
    notes: '',
    consentAccepted: true
  });
  const [careerAppSuccess, setCareerAppSuccess] = useState<string | null>(null);
  const [careerSearch, setCareerSearch] = useState('');
  const [careerDeptFilter, setCareerDeptFilter] = useState('all');

  // Requisition Creation Form
  const [reqForm, setReqForm] = useState({
    title: '',
    department: 'Compliance & Legal',
    hiringManager: 'Marcus Sterling',
    location: 'Kingston Corporate Hub',
    headcount: 1,
    employmentType: 'full_time' as JobRequisition['employmentType'],
    salaryMin: 90000,
    salaryMax: 125000,
    urgency: 'normal' as JobRequisition['urgency'],
    targetStartDate: '',
    jobDescription: ''
  });

  // Manual Candidate Creation Form
  const [candForm, setCandForm] = useState({
    requisitionId: jobRequisitions[0]?.id || '',
    jobTitle: jobRequisitions[0]?.title || 'AML Analyst',
    name: '',
    email: '',
    phone: '',
    source: 'LinkedIn' as Candidate['source'],
    notes: '',
    score: 4
  });

  const stages: Candidate['stage'][] = ['applied', 'screening', 'interview', 'offer', 'hired', 'rejected'];

  const stageLabels: Record<Candidate['stage'], string> = {
    applied: 'Applied & New',
    screening: 'HR Phone Screen',
    interview: 'Panel Interview',
    offer: 'Offer Extended',
    hired: 'Hired & Converted',
    rejected: 'Archived / Declined'
  };

  const handleCreateRequisition = (e: React.FormEvent) => {
    e.preventDefault();
    addJobRequisition({
      title: reqForm.title,
      department: reqForm.department,
      hiringManager: reqForm.hiringManager,
      location: reqForm.location,
      headcount: Number(reqForm.headcount),
      employmentType: reqForm.employmentType,
      salaryBudget: {
        min: Number(reqForm.salaryMin),
        max: Number(reqForm.salaryMax),
        currency: currentTenant.currency
      },
      urgency: reqForm.urgency,
      status: 'open',
      targetStartDate: reqForm.targetStartDate || new Date(Date.now() + 86400000 * 30).toISOString().split('T')[0],
      jobDescription: reqForm.jobDescription
    });
    setShowReqModal(false);
  };

  const handleCreateCandidate = (e: React.FormEvent) => {
    e.preventDefault();
    addCandidate({
      requisitionId: candForm.requisitionId,
      jobTitle: candForm.jobTitle,
      name: candForm.name,
      email: candForm.email,
      phone: candForm.phone,
      stage: 'applied',
      score: Number(candForm.score),
      source: candForm.source,
      notes: candForm.notes
    });
    setShowCandModal(false);
    setCandForm({
      requisitionId: jobRequisitions[0]?.id || '',
      jobTitle: jobRequisitions[0]?.title || 'AML Analyst',
      name: '',
      email: '',
      phone: '',
      source: 'LinkedIn',
      notes: '',
      score: 4
    });
  };

  const handleConvertCandidate = (candidateId: string) => {
    convertCandidateToEmployee(candidateId);
    setSelectedCandidate(null);
    setActiveTab('onboarding');
  };

  const handleCalculateScorecard = () => {
    if (!selectedCandidate) return;
    const result = scoreCandidateInterview({
      candidateId: selectedCandidate.id,
      interviewerId: 'EMP001',
      technicalCompetency: scoreForm.technical,
      problemSolving: scoreForm.problemSolving,
      culturalAlignment: scoreForm.culturalAlignment,
      communicationSkills: scoreForm.communication,
      notes: scoreForm.notes
    });
    setScorecardResult(result);
  };

  const handleGenerateOfferLetter = () => {
    if (!selectedCandidate) return;
    const expiry = new Date(Date.now() + 86400000 * offerForm.expiryDays).toISOString().split('T')[0];
    const signed = generateTamperEvidentOfferLetter({
      candidateId: selectedCandidate.id,
      candidateName: selectedCandidate.name,
      candidateEmail: selectedCandidate.email,
      jobTitle: selectedCandidate.jobTitle,
      department: 'Corporate Operations',
      baseSalary: offerForm.baseSalary,
      currency: currentTenant.currency,
      startDate: offerForm.startDate,
      expiryDate: expiry,
      signerName: offerForm.signerName,
      signerEmail: offerForm.signerEmail,
      signerIp: offerForm.signerIp
    });
    setSignedOfferResult(signed);
    updateCandidateStage(selectedCandidate.id, 'offer');
  };

  const handleOpenSettlement = (exit: ExitClearance) => {
    setSelectedExitForSettlement(exit);
    const result = calculateExitSettlement({
      employeeId: exit.employeeId,
      monthlySalary: settlementForm.monthlySalary,
      daysWorkedInMonth: settlementForm.daysWorkedInMonth,
      totalWorkingDaysInMonth: settlementForm.totalWorkingDaysInMonth,
      accruedUnusedVacationDays: settlementForm.accruedVacationDays,
      equipmentDeductionsMinorUnits: settlementForm.equipmentDeductionsMinorUnits * 100,
      unreimbursedAdvancesMinorUnits: settlementForm.unreimbursedAdvancesMinorUnits * 100
    });
    setSettlementResult(result);
  };

  const handleRecalculateSettlement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedExitForSettlement) return;
    const result = calculateExitSettlement({
      employeeId: selectedExitForSettlement.employeeId,
      monthlySalary: Number(settlementForm.monthlySalary),
      daysWorkedInMonth: Number(settlementForm.daysWorkedInMonth),
      totalWorkingDaysInMonth: Number(settlementForm.totalWorkingDaysInMonth),
      accruedUnusedVacationDays: Number(settlementForm.accruedVacationDays),
      equipmentDeductionsMinorUnits: Number(settlementForm.equipmentDeductionsMinorUnits) * 100,
      unreimbursedAdvancesMinorUnits: Number(settlementForm.unreimbursedAdvancesMinorUnits) * 100
    });
    setSettlementResult(result);
  };

  const handleSubmitCareerApplication = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCareerJob) return;
    if (!careerAppForm.consentAccepted) {
      alert('Candidate consent under the Jamaica Data Protection Act is required to submit.');
      return;
    }

    addCandidate({
      requisitionId: selectedCareerJob.id,
      jobTitle: selectedCareerJob.title,
      name: careerAppForm.name,
      email: careerAppForm.email,
      phone: careerAppForm.phone,
      stage: 'applied',
      score: 4.5,
      source: 'Careers Portal',
      notes: `Applied via Public Portal. Resume: ${careerAppForm.resumeName}. Notes: ${careerAppForm.notes}`
    });

    setCareerAppSuccess(`Application submitted successfully for ${careerAppForm.name}! Added to pipeline.`);
    setCareerAppForm({
      name: '',
      email: '',
      phone: '',
      resumeName: 'Resume_2026.pdf',
      notes: '',
      consentAccepted: true
    });
    setSelectedCareerJob(null);
    setTimeout(() => setCareerAppSuccess(null), 5000);
  };

  const filteredRequisitions = jobRequisitions.filter(r => {
    const matchesSearch = r.title.toLowerCase().includes(careerSearch.toLowerCase()) || 
                          r.department.toLowerCase().includes(careerSearch.toLowerCase()) ||
                          r.location.toLowerCase().includes(careerSearch.toLowerCase());
    const matchesDept = careerDeptFilter === 'all' || r.department.toLowerCase() === careerDeptFilter.toLowerCase();
    return matchesSearch && matchesDept;
  });

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <Briefcase className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Talent Acquisition & Lifecycle Hub</h1>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Job requisitions, candidate pipeline Kanban, 1-click hire conversion, onboarding checklists, and exit clearances
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setShowReqModal(true)}
            className="px-3 py-2 bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors"
          >
            <Plus className="w-4 h-4" /> New Requisition
          </button>
          <button
            onClick={() => setShowCandModal(true)}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 shadow-xs transition-colors"
          >
            <UserPlus className="w-4 h-4" /> Add Candidate
          </button>
        </div>
      </div>

      {careerAppSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            {careerAppSuccess}
          </span>
          <button onClick={() => setCareerAppSuccess(null)} className="text-emerald-700 font-bold">×</button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-xl shadow-xs overflow-x-auto">
        {[
          { id: 'pipeline', label: `Candidate Pipeline (${candidates.length})`, icon: <Users className="w-4 h-4" /> },
          { id: 'requisitions', label: `Open Requisitions (${jobRequisitions.length})`, icon: <Briefcase className="w-4 h-4" /> },
          { id: 'onboarding', label: `Onboarding Tasks (${onboardingTasks.length})`, icon: <UserCheck className="w-4 h-4" /> },
          { id: 'exit', label: `Exit Clearances (${exitClearances.length})`, icon: <Clock className="w-4 h-4" /> },
          { id: 'careers-portal', label: `Public Careers Portal Preview`, icon: <Globe className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-800'
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* TAB 1: KANBAN PIPELINE */}
      {activeTab === 'pipeline' && (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 overflow-x-auto pb-4">
          {stages.map(stage => {
            const stageCandidates = candidates.filter(c => c.stage === stage);
            return (
              <div key={stage} className="bg-slate-50/70 rounded-xl border border-slate-200 p-3 min-w-[220px] flex flex-col">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-3">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    {stageLabels[stage]}
                  </span>
                  <span className="w-5 h-5 rounded-full bg-slate-200 text-slate-700 text-[11px] font-bold flex items-center justify-center">
                    {stageCandidates.length}
                  </span>
                </div>

                <div className="space-y-3 flex-1">
                  {stageCandidates.map(cand => (
                    <div
                      key={cand.id}
                      onClick={() => {
                        setSelectedCandidate(cand);
                        setCandSubTab('overview');
                        setScorecardResult(null);
                        setSignedOfferResult(null);
                      }}
                      className="bg-white p-3.5 rounded-xl border border-gray-200 shadow-2xs hover:border-blue-300 hover:shadow-xs transition-all cursor-pointer space-y-2"
                    >
                      <div className="flex items-start justify-between gap-1">
                        <h4 className="text-xs font-bold text-gray-900 leading-tight">{cand.name}</h4>
                        <span className="text-[10px] font-semibold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
                          {cand.source}
                        </span>
                      </div>
                      <p className="text-[11px] text-gray-500 leading-snug line-clamp-1">{cand.jobTitle}</p>
                      
                      <div className="flex items-center justify-between pt-2 border-t border-gray-100 text-[11px]">
                        <div className="flex items-center text-amber-500 gap-0.5 font-bold">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{cand.score}</span>
                        </div>
                        <span className="text-gray-400">{cand.appliedDate}</span>
                      </div>
                    </div>
                  ))}

                  {stageCandidates.length === 0 && (
                    <div className="py-8 text-center text-xs text-gray-400 italic">No candidates</div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* TAB 2: JOB REQUISITIONS */}
      {activeTab === 'requisitions' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {jobRequisitions.map(req => (
            <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                    {req.id}
                  </span>
                  <h3 className="text-sm font-bold text-gray-900 mt-2">{req.title}</h3>
                  <p className="text-xs text-gray-500 mt-0.5">{req.department} · {req.location}</p>
                </div>
                <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                  req.urgency === 'urgent' ? 'bg-rose-50 text-rose-700 border border-rose-200' : 'bg-gray-100 text-gray-600'
                }`}>
                  {req.urgency}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs bg-gray-50 p-3 rounded-lg border border-gray-100">
                <div>
                  <span className="text-gray-400 block mb-0.5">Headcount</span>
                  <span className="font-bold text-gray-800">{req.headcount} Openings</span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Budget Range</span>
                  <span className="font-bold text-gray-800">
                    {req.salaryBudget.currency} {req.salaryBudget.min.toLocaleString()} - {req.salaryBudget.max.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-xs text-gray-600 line-clamp-2 leading-relaxed">{req.jobDescription}</p>

              <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>Hiring Lead: {req.hiringManager}</span>
                <span className="text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                  {candidates.filter(c => c.requisitionId === req.id).length} Active Applicants
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 3: ONBOARDING TASKS */}
      {activeTab === 'onboarding' && (
        <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex items-center justify-between">
            <h3 className="text-xs font-bold uppercase tracking-wider text-gray-700">
              New Hire 30/60/90-Day Task Readiness Checklists
            </h3>
            <span className="text-xs text-gray-500">
              {onboardingTasks.filter(t => t.status === 'completed').length} of {onboardingTasks.length} Completed
            </span>
          </div>

          <div className="divide-y divide-gray-100">
            {onboardingTasks.map(task => (
              <div key={task.id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50 transition-colors">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => updateOnboardingTask(task.id, task.status === 'completed' ? 'pending' : 'completed')}
                    className={`p-1.5 rounded-lg border transition-colors ${
                      task.status === 'completed'
                        ? 'bg-emerald-600 border-emerald-600 text-white'
                        : 'border-gray-300 hover:border-blue-500 text-transparent'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </button>

                  <div>
                    <h4 className={`text-xs font-bold ${task.status === 'completed' ? 'line-through text-gray-400' : 'text-gray-900'}`}>
                      {task.title}
                    </h4>
                    <p className="text-[11px] text-gray-500 mt-0.5">
                      New Hire: <strong className="text-gray-700">{task.employeeName || task.candidateName}</strong> ({task.department || 'Onboarding'}) · Assigned: {task.assignedTo}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-[11px] text-gray-400 flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> Due {task.dueDate}
                  </span>
                  <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                    task.status === 'completed' ? 'bg-emerald-50 text-emerald-700' :
                    task.status === 'in_progress' ? 'bg-amber-50 text-amber-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {task.status.replace('_', ' ')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: EXIT CLEARANCE & FINAL SETTLEMENT */}
      {activeTab === 'exit' && (
        <div className="space-y-4">
          {exitClearances.map(exit => (
            <div key={exit.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-gray-900">{exit.employeeName}</h3>
                    <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-amber-50 text-amber-700 border border-amber-200">
                      {exit.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {exit.department} · Resigned: {exit.resignationDate} · Final Working Day: {exit.finalWorkingDay}
                  </p>
                  <p className="text-xs text-gray-600 italic mt-1">Reason: "{exit.reason}"</p>
                </div>

                <button
                  onClick={() => handleOpenSettlement(exit)}
                  className="px-3.5 py-2 bg-indigo-50 border border-indigo-200 text-indigo-700 hover:bg-indigo-100 rounded-lg text-xs font-bold inline-flex items-center gap-1.5 transition-colors self-start"
                >
                  <Calculator className="w-4 h-4" /> Final Pay & Settlement
                </button>
              </div>

              {/* Clearance Items Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {exit.items.map((item, idx) => (
                  <div key={idx} className="bg-gray-50 p-3 rounded-lg border border-gray-200 flex flex-col justify-between space-y-2">
                    <div>
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-gray-800">{item.department}</span>
                        <button
                          onClick={() => updateExitClearanceItem(exit.id, item.department, !item.cleared)}
                          className={`p-1 rounded text-xs font-bold ${
                            item.cleared ? 'text-emerald-700 bg-emerald-100' : 'text-gray-400 bg-gray-200'
                          }`}
                        >
                          {item.cleared ? 'Cleared' : 'Pending'}
                        </button>
                      </div>
                      {item.notes && <p className="text-[11px] text-gray-500 mt-1">{item.notes}</p>}
                    </div>
                    {item.clearedBy && (
                      <span className="text-[10px] text-gray-400">Signed: {item.clearedBy}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* TAB 5: PUBLIC CAREERS PORTAL PREVIEW */}
      {activeTab === 'careers-portal' && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-slate-900 to-blue-950 text-white p-8 rounded-2xl shadow-lg">
            <div className="max-w-2xl">
              <span className="px-3 py-1 bg-blue-500/20 text-blue-300 text-xs font-mono font-bold rounded-full uppercase tracking-wider">
                Public Tenant Careers Portal
              </span>
              <h2 className="text-3xl font-extrabold tracking-tight mt-3">Careers at {currentTenant.name}</h2>
              <p className="text-slate-300 text-sm mt-2 leading-relaxed">
                Explore open requisitions across financial compliance, risk analysis, core engineering, and HR leadership. Real-time applications integrate with our applicant pipeline.
              </p>
            </div>

            {/* Search and Filters */}
            <div className="mt-6 flex flex-col sm:flex-row gap-3 pt-6 border-t border-slate-800">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Search by job title, location, or keywords..."
                  value={careerSearch}
                  onChange={(e) => setCareerSearch(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <select
                value={careerDeptFilter}
                onChange={(e) => setCareerDeptFilter(e.target.value)}
                className="px-3 py-2 bg-slate-800/80 border border-slate-700 rounded-lg text-xs text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Departments</option>
                <option value="Engineering">Engineering</option>
                <option value="Compliance & Legal">Compliance & Legal</option>
                <option value="Finance & Payroll">Finance & Payroll</option>
                <option value="Human Resources">Human Resources</option>
              </select>
            </div>
          </div>

          {/* Job Postings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredRequisitions.map(req => (
              <div key={req.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs flex flex-col justify-between space-y-4 hover:border-blue-300 hover:shadow-md transition-all">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[11px] font-bold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                      {req.department}
                    </span>
                    <span className="text-xs text-gray-400">{req.location}</span>
                  </div>
                  <h3 className="text-base font-bold text-gray-900">{req.title}</h3>
                  <p className="text-xs text-gray-600 line-clamp-3 leading-relaxed">{req.jobDescription}</p>
                </div>

                <div className="pt-4 border-t border-gray-100 flex items-center justify-between">
                  <div className="text-xs">
                    <span className="text-gray-400 block text-[10px] uppercase">Compensation</span>
                    <span className="font-bold text-gray-900">
                      {req.salaryBudget.currency} {req.salaryBudget.min.toLocaleString()} - {req.salaryBudget.max.toLocaleString()}
                    </span>
                  </div>
                  <button
                    onClick={() => {
                      setSelectedCareerJob(req);
                      setCareerAppForm(prev => ({ ...prev, notes: `Interest in ${req.title} position.` }));
                    }}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors shadow-2xs"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Candidate Inspector & Offer Letter Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedCandidate.name}</h3>
                <p className="text-xs text-slate-300">{selectedCandidate.jobTitle} · Requisition: {selectedCandidate.requisitionId}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Drawer Sub-Tabs */}
            <div className="flex border-b border-gray-200 bg-gray-50 px-6">
              {[
                { id: 'overview', label: 'Candidate Profile' },
                { id: 'scorecard', label: 'Interview Scorecard' },
                { id: 'offer', label: 'Offer Letter & E-Sign' }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setCandSubTab(tab.id as typeof candSubTab)}
                  className={`py-3 px-3 text-xs font-bold border-b-2 transition-colors ${
                    candSubTab === tab.id
                      ? 'border-blue-600 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-800'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              {/* SUBTAB 1: PROFILE OVERVIEW */}
              {candSubTab === 'overview' && (
                <>
                  <div className="bg-gray-50 p-4 rounded-xl border border-gray-200 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Email:</span>
                      <span className="font-semibold text-gray-900">{selectedCandidate.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Phone:</span>
                      <span className="font-semibold text-gray-900">{selectedCandidate.phone}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Candidate Source:</span>
                      <span className="font-semibold text-gray-900">{selectedCandidate.source}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Applied Date:</span>
                      <span className="font-semibold text-gray-900">{selectedCandidate.appliedDate}</span>
                    </div>
                    {(() => {
                      const retentionCheck = validateCandidateConsentAndRetention(selectedCandidate.appliedDate);
                      return (
                        <div className="flex justify-between items-center pt-2 border-t border-gray-200">
                          <span className="text-gray-400">JDPA Statutory Retention:</span>
                          <span className={`font-semibold ${retentionCheck.isValid ? 'text-emerald-700' : 'text-rose-700'}`}>
                            {retentionCheck.isValid ? `Valid (${retentionCheck.daysRemaining} days remaining)` : 'Expired / Action Required'}
                          </span>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Update Pipeline Stage
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {stages.map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => updateCandidateStage(selectedCandidate.id, st)}
                          className={`py-2 px-2 text-[11px] font-bold rounded-lg border capitalize transition-colors ${
                            selectedCandidate.stage === st
                              ? 'bg-blue-600 border-blue-600 text-white'
                              : 'bg-white border-gray-200 text-gray-700 hover:border-gray-300'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-1.5">
                      Interviewer Evaluation & Notes
                    </label>
                    <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 leading-relaxed">
                      {selectedCandidate.notes || 'No candidate notes entered.'}
                    </div>
                  </div>

                  {/* 1-Click Convert to Core HR Employee */}
                  <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2">
                    <div className="flex items-center gap-2 text-blue-900 font-bold">
                      <UserPlus className="w-4 h-4 text-blue-600" />
                      <span>1-Click Convert to Core HR Employee</span>
                    </div>
                    <p className="text-gray-600 text-[11px] leading-relaxed">
                      Generates sequential Employee ID, provisions 30/60/90-day onboarding checklists, registers initial FICA compliance file, and moves candidate to Hired.
                    </p>
                    <button
                      onClick={() => handleConvertCandidate(selectedCandidate.id)}
                      className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                    >
                      Confirm & Convert Candidate to Employee
                    </button>
                  </div>
                </>
              )}

              {/* SUBTAB 2: INTERVIEW SCORECARD */}
              {candSubTab === 'scorecard' && (
                <div className="space-y-4">
                  <div className="bg-blue-50/60 p-3 rounded-lg border border-blue-200 text-blue-900 text-xs">
                    Structured evaluation across 4 weighted dimensions: Technical (35%), Problem Solving (30%), Culture (20%), Communication (15%).
                  </div>

                  <div className="space-y-3">
                    {[
                      { key: 'technical', label: 'Technical Competency (35%)', value: scoreForm.technical },
                      { key: 'problemSolving', label: 'Problem Solving & Logic (30%)', value: scoreForm.problemSolving },
                      { key: 'culturalAlignment', label: 'Cultural Alignment & Ethics (20%)', value: scoreForm.culturalAlignment },
                      { key: 'communication', label: 'Communication & Teamwork (15%)', value: scoreForm.communication }
                    ].map(field => (
                      <div key={field.key} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="flex justify-between items-center mb-1">
                          <label className="font-bold text-gray-800">{field.label}</label>
                          <span className="font-bold text-blue-600">{field.value} / 5</span>
                        </div>
                        <input
                          type="range"
                          min="1"
                          max="5"
                          step="0.5"
                          value={field.value}
                          onChange={(e) => setScoreForm({ ...scoreForm, [field.key]: Number(e.target.value) })}
                          className="w-full accent-blue-600"
                        />
                      </div>
                    ))}

                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Qualitative Notes</label>
                      <textarea
                        rows={2}
                        value={scoreForm.notes}
                        onChange={(e) => setScoreForm({ ...scoreForm, notes: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleCalculateScorecard}
                      className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-lg transition-colors"
                    >
                      Calculate Composite Score & Recommendation
                    </button>

                    {scorecardResult && (
                      <div className="p-4 bg-slate-900 text-white rounded-xl space-y-2 mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Composite Score:</span>
                          <span className="text-base font-extrabold text-amber-400">{scorecardResult.overallScore.toFixed(2)} / 5.0</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-slate-400">Algorithmic Recommendation:</span>
                          <span className={`px-2 py-0.5 rounded font-extrabold uppercase text-[10px] ${
                            scorecardResult.recommendation === 'strong_hire' ? 'bg-emerald-500 text-slate-950' :
                            scorecardResult.recommendation === 'hire' ? 'bg-blue-400 text-slate-950' :
                            scorecardResult.recommendation === 'lean_hire' ? 'bg-amber-400 text-slate-950' : 'bg-rose-500 text-white'
                          }`}>
                            {scorecardResult.recommendation.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* SUBTAB 3: OFFER LETTER & E-SIGN */}
              {candSubTab === 'offer' && (
                <div className="space-y-4">
                  <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200 text-indigo-900 text-xs">
                    Issue a tamper-evident offer letter with SHA-256 document fingerprinting and signer audit trail.
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Annual Base Salary ({currentTenant.currency})</label>
                      <input
                        type="number"
                        value={offerForm.baseSalary}
                        onChange={(e) => setOfferForm({ ...offerForm, baseSalary: Number(e.target.value) })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Target Start Date</label>
                      <input
                        type="date"
                        value={offerForm.startDate}
                        onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Authorizing Signer Name</label>
                      <input
                        type="text"
                        value={offerForm.signerName}
                        onChange={(e) => setOfferForm({ ...offerForm, signerName: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-gray-700 mb-1">Signer IP Address</label>
                      <input
                        type="text"
                        value={offerForm.signerIp}
                        onChange={(e) => setOfferForm({ ...offerForm, signerIp: e.target.value })}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg text-xs font-mono"
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={handleGenerateOfferLetter}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                  >
                    <Lock className="w-4 h-4" /> Generate & Sign Official Offer Letter
                  </button>

                  {signedOfferResult && (
                    <div className="p-4 bg-slate-900 text-white rounded-xl space-y-3">
                      <div className="flex items-center gap-2 text-emerald-400 font-bold">
                        <ShieldCheck className="w-4 h-4" />
                        <span>Tamper-Evident SHA-256 Certified Offer</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 uppercase tracking-wider block">SHA-256 Document Fingerprint:</span>
                        <code className="text-[10px] text-emerald-300 font-mono break-all bg-slate-950 p-1.5 rounded block mt-0.5">
                          {signedOfferResult.tamperEvidentHash}
                        </code>
                      </div>
                      <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-300 pt-2 border-t border-slate-800">
                        <div>Signer: <strong>{signedOfferResult.signatureAuditTrail.signerName}</strong></div>
                        <div>IP: <code>{signedOfferResult.signatureAuditTrail.signerIp}</code></div>
                        <div className="col-span-2">Timestamp: {signedOfferResult.signatureAuditTrail.signedAt}</div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Clearance Final Settlement Modal */}
      {selectedExitForSettlement && settlementResult && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <div>
                <h3 className="text-base font-semibold">Exit Settlement & Final Pay Calculation</h3>
                <p className="text-xs text-slate-300">{selectedExitForSettlement.employeeName} ({selectedExitForSettlement.department})</p>
              </div>
              <button onClick={() => setSelectedExitForSettlement(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecalculateSettlement} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Monthly Salary ({currentTenant.currency})</label>
                  <input
                    type="number"
                    value={settlementForm.monthlySalary}
                    onChange={(e) => setSettlementForm({ ...settlementForm, monthlySalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Accrued Unused Vacation (Days)</label>
                  <input
                    type="number"
                    step="0.5"
                    value={settlementForm.accruedVacationDays}
                    onChange={(e) => setSettlementForm({ ...settlementForm, accruedVacationDays: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Days Worked in Final Month</label>
                  <input
                    type="number"
                    value={settlementForm.daysWorkedInMonth}
                    onChange={(e) => setSettlementForm({ ...settlementForm, daysWorkedInMonth: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-gray-700 mb-1">Equipment / Advance Deductions</label>
                  <input
                    type="number"
                    value={settlementForm.equipmentDeductionsMinorUnits}
                    onChange={(e) => setSettlementForm({ ...settlementForm, equipmentDeductionsMinorUnits: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2 text-xs">
                <div className="flex justify-between text-gray-600">
                  <span>Pro-Rata Worked Salary:</span>
                  <span className="font-bold text-gray-900">${(settlementResult.proRataSalaryMinorUnits / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-emerald-700">
                  <span>Vacation Encashment ({settlementForm.accruedVacationDays} days):</span>
                  <span className="font-bold">+${(settlementResult.vacationEncashmentMinorUnits / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="flex justify-between text-rose-700">
                  <span>Deductions / Unreturned Assets:</span>
                  <span className="font-bold">-${(settlementResult.totalDeductionsMinorUnits / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between text-sm font-extrabold text-blue-900">
                  <span>Net Payable Settlement:</span>
                  <span>${(settlementResult.netPayableSettlementMinorUnits / 100).toLocaleString(undefined, { minimumFractionDigits: 2 })} {currentTenant.currency}</span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700"
                >
                  Recalculate
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedExitForSettlement(null)}
                  className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg text-xs font-medium hover:bg-gray-200"
                >
                  Done
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Careers Portal Apply Modal */}
      {selectedCareerJob && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold">Apply for Position</h3>
                <p className="text-xs text-slate-300">{selectedCareerJob.title} · {selectedCareerJob.department}</p>
              </div>
              <button onClick={() => setSelectedCareerJob(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitCareerApplication} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Jordan Barrett"
                  value={careerAppForm.name}
                  onChange={(e) => setCareerAppForm({ ...careerAppForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    placeholder="jordan@example.com"
                    value={careerAppForm.email}
                    onChange={(e) => setCareerAppForm({ ...careerAppForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (876) 555-0144"
                    value={careerAppForm.phone}
                    onChange={(e) => setCareerAppForm({ ...careerAppForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Attach Resume / CV (PDF, DOCX)</label>
                <div className="border border-dashed border-gray-300 p-3 rounded-lg text-center bg-gray-50 flex items-center justify-between">
                  <span className="text-xs text-gray-600 font-mono flex items-center gap-1.5">
                    <FileText className="w-4 h-4 text-blue-600" />
                    {careerAppForm.resumeName}
                  </span>
                  <span className="text-[10px] bg-blue-100 text-blue-700 font-bold px-2 py-0.5 rounded">Attached</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Brief Cover Note / Qualifications</label>
                <textarea
                  rows={2}
                  value={careerAppForm.notes}
                  onChange={(e) => setCareerAppForm({ ...careerAppForm, notes: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                />
              </div>

              {/* JDPA Consent Checkbox */}
              <div className="p-3 bg-blue-50/60 border border-blue-200 rounded-lg flex items-start gap-2.5">
                <input
                  type="checkbox"
                  id="consent"
                  checked={careerAppForm.consentAccepted}
                  onChange={(e) => setCareerAppForm({ ...careerAppForm, consentAccepted: e.target.checked })}
                  className="mt-0.5 accent-blue-600"
                />
                <label htmlFor="consent" className="text-[11px] text-gray-700 leading-snug">
                  I consent to the collection and processing of my application data in compliance with the Jamaica Data Protection Act (JDPA 2020) for recruitment purposes with a statutory 12-month retention period.
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setSelectedCareerJob(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Submit Application
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Requisition Modal */}
      {showReqModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-base font-semibold">Create Job Requisition</h3>
              <button onClick={() => setShowReqModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateRequisition} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Requisition Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Regulatory Reporting Specialist"
                  value={reqForm.title}
                  onChange={(e) => setReqForm({ ...reqForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Department *</label>
                  <input
                    type="text"
                    required
                    value={reqForm.department}
                    onChange={(e) => setReqForm({ ...reqForm, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Headcount *</label>
                  <input
                    type="number"
                    min="1"
                    value={reqForm.headcount}
                    onChange={(e) => setReqForm({ ...reqForm, headcount: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Salary Min ({currentTenant.currency})</label>
                  <input
                    type="number"
                    value={reqForm.salaryMin}
                    onChange={(e) => setReqForm({ ...reqForm, salaryMin: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Salary Max ({currentTenant.currency})</label>
                  <input
                    type="number"
                    value={reqForm.salaryMax}
                    onChange={(e) => setReqForm({ ...reqForm, salaryMax: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Job Description</label>
                <textarea
                  rows={3}
                  value={reqForm.jobDescription}
                  onChange={(e) => setReqForm({ ...reqForm, jobDescription: e.target.value })}
                  placeholder="Outline responsibilities and mandatory compliance background..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowReqModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Publish Requisition
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Candidate Modal */}
      {showCandModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-base font-semibold">Add Candidate to Pipeline</h3>
              <button onClick={() => setShowCandModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCandidate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Target Requisition / Position *</label>
                <select
                  value={candForm.requisitionId}
                  onChange={(e) => {
                    const req = jobRequisitions.find(r => r.id === e.target.value);
                    setCandForm({
                      ...candForm,
                      requisitionId: e.target.value,
                      jobTitle: req?.title || candForm.jobTitle
                    });
                  }}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                >
                  {jobRequisitions.map(r => (
                    <option key={r.id} value={r.id}>{r.title} ({r.department})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Full Legal Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Richard Hendricks"
                  value={candForm.name}
                  onChange={(e) => setCandForm({ ...candForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={candForm.email}
                    onChange={(e) => setCandForm({ ...candForm, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Phone</label>
                  <input
                    type="text"
                    value={candForm.phone}
                    onChange={(e) => setCandForm({ ...candForm, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Source</label>
                  <select
                    value={candForm.source}
                    onChange={(e) => setCandForm({ ...candForm, source: e.target.value as Candidate['source'] })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Careers Portal">Careers Portal</option>
                    <option value="Referral">Referral</option>
                    <option value="Recruiter">Recruiter</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Initial Rating (1-5)</label>
                  <input
                    type="number"
                    min="1"
                    max="5"
                    step="0.1"
                    value={candForm.score}
                    onChange={(e) => setCandForm({ ...candForm, score: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowCandModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Add Candidate
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
