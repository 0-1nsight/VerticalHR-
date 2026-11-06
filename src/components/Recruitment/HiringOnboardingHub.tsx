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
  Check
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Candidate, JobRequisition } from '../../types';

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

  const [activeTab, setActiveTab] = useState<'pipeline' | 'requisitions' | 'onboarding' | 'exit'>('pipeline');

  // Modals
  const [showReqModal, setShowReqModal] = useState(false);
  const [showCandModal, setShowCandModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);

  // Forms
  const [reqForm, setReqForm] = useState({
    title: '',
    department: 'Engineering',
    hiringManager: 'Marcus Sterling',
    location: 'Kingston Corporate Hub',
    headcount: 1,
    employmentType: 'full_time' as JobRequisition['employmentType'],
    salaryMin: 90000,
    salaryMax: 120000,
    urgency: 'normal' as JobRequisition['urgency'],
    targetStartDate: '',
    jobDescription: ''
  });

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

      {/* Tabs */}
      <div className="flex border-b border-gray-200 bg-white px-4 rounded-xl shadow-xs">
        {[
          { id: 'pipeline', label: `Candidate Pipeline (${candidates.length})`, icon: <Users className="w-4 h-4" /> },
          { id: 'requisitions', label: `Open Requisitions (${jobRequisitions.length})`, icon: <Briefcase className="w-4 h-4" /> },
          { id: 'onboarding', label: `Onboarding Tasks (${onboardingTasks.length})`, icon: <UserCheck className="w-4 h-4" /> },
          { id: 'exit', label: `Exit Clearances (${exitClearances.length})`, icon: <Clock className="w-4 h-4" /> },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as typeof activeTab)}
            className={`flex items-center gap-2 px-5 py-3.5 text-xs font-bold border-b-2 transition-colors ${
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
                      onClick={() => setSelectedCandidate(cand)}
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
                      New Hire: <strong className="text-gray-700">{task.employeeName}</strong> ({task.department}) · Assigned: {task.assignedTo}
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

      {/* TAB 4: EXIT CLEARANCE */}
      {activeTab === 'exit' && (
        <div className="space-y-4">
          {exitClearances.map(exit => (
            <div key={exit.id} className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex items-start justify-between">
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

      {/* Candidate Inspector & 1-Click Convert Drawer */}
      {selectedCandidate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-lg h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            <div className="px-6 py-4 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-bold text-white">{selectedCandidate.name}</h3>
                <p className="text-xs text-slate-300">{selectedCandidate.jobTitle}</p>
              </div>
              <button onClick={() => setSelectedCandidate(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              <div className="bg-gray-50 p-3.5 rounded-xl border border-gray-200 space-y-1.5">
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
                  Interviewer Evaluation & Feedback
                </label>
                <div className="p-3 bg-gray-50 rounded-lg border border-gray-200 text-gray-700 leading-relaxed">
                  {selectedCandidate.interviewerFeedback || 'No interview evaluation entered yet.'}
                </div>
              </div>

              {/* 1-Click Convert to Core HR Employee */}
              <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl space-y-2">
                <div className="flex items-center gap-2 text-blue-900 font-bold">
                  <UserPlus className="w-4 h-4 text-blue-600" />
                  <span>1-Click Convert to Core HR Employee</span>
                </div>
                <p className="text-gray-600 text-[11px] leading-relaxed">
                  Automatically generates an Employee ID, provisions onboarding checklists, initializes FICA compliance records, and updates status to Hired.
                </p>
                <button
                  onClick={() => handleConvertCandidate(selectedCandidate.id)}
                  className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold text-xs shadow-xs transition-colors"
                >
                  Confirm & Convert Candidate to Employee
                </button>
              </div>
            </div>

            <div className="px-6 py-3 bg-gray-50 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => setSelectedCandidate(null)}
                className="px-4 py-2 bg-white border border-gray-300 rounded-lg text-xs font-medium text-gray-700"
              >
                Close
              </button>
            </div>
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
                <label className="block text-xs font-semibold text-gray-700 mb-1">Job Summary</label>
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
