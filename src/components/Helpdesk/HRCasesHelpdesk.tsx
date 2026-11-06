import React, { useState } from 'react';
import { 
  LifeBuoy, 
  Search, 
  Plus, 
  Clock, 
  BookOpen, 
  Send, 
  Lock, 
  ChevronRight,
  X
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { HRCase, KnowledgeBaseArticle } from '../../types';

export const HRCasesHelpdesk: React.FC = () => {
  const { hrCases, knowledgeBase, addHRCase, addCaseReply, updateCaseStatus } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedCase, setSelectedCase] = useState<HRCase | null>(null);

  // Modals
  const [showNewCaseModal, setShowNewCaseModal] = useState(false);
  const [showKBModal, setShowKBModal] = useState<KnowledgeBaseArticle | null>(null);

  // Form State
  const [newCaseSubject, setNewCaseSubject] = useState('');
  const [newCaseCategory, setNewCaseCategory] = useState<HRCase['category']>('benefits');
  const [newCasePriority, setNewCasePriority] = useState<HRCase['priority']>('medium');
  const [newCaseDesc, setNewCaseDesc] = useState('');

  // Reply State
  const [replyText, setReplyText] = useState('');
  const [isInternalNote, setIsInternalNote] = useState(false);

  const currentUser = user || { firstName: 'Staff', lastName: 'Member', id: '1', role: 'employee' };

  // Live Knowledge Base suggestions based on subject search
  const suggestedArticles = newCaseSubject.trim().length > 3
    ? knowledgeBase.filter(kb => 
        kb.title.toLowerCase().includes(newCaseSubject.toLowerCase()) ||
        kb.summary.toLowerCase().includes(newCaseSubject.toLowerCase())
      )
    : [];

  const filteredCases = hrCases.filter(c => {
    const matchesSearch = c.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.caseNumber.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat = selectedCategory === 'all' || c.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesCat && matchesStatus;
  });

  const handleCreateCase = (e: React.FormEvent) => {
    e.preventDefault();
    // SLA due: 24h for urgent/high, 48h for normal
    const hours = newCasePriority === 'urgent' ? 8 : newCasePriority === 'high' ? 24 : 48;
    const slaDueAt = new Date(Date.now() + 3600000 * hours).toISOString();

    addHRCase({
      employeeId: currentUser.id,
      employeeName: `${currentUser.firstName} ${currentUser.lastName}`,
      department: 'Engineering',
      category: newCaseCategory,
      priority: newCasePriority,
      status: 'new',
      subject: newCaseSubject,
      description: newCaseDesc,
      slaDueAt,
      assignedTo: 'HR Support Desk'
    });

    setShowNewCaseModal(false);
    setNewCaseSubject('');
    setNewCaseDesc('');
  };

  const handleSendReply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCase || !replyText.trim()) return;

    addCaseReply(selectedCase.id, {
      sender: `${currentUser.firstName} ${currentUser.lastName} (${currentUser.role === 'admin' || currentUser.role === 'hr_manager' ? 'HR Staff' : 'Employee'})`,
      message: replyText,
      isInternal: isInternalNote
    });

    // Update local preview
    setSelectedCase(prev => prev ? {
      ...prev,
      replies: [
        ...prev.replies,
        {
          id: `rep-${Date.now()}`,
          sender: `${currentUser.firstName} ${currentUser.lastName}`,
          message: replyText,
          timestamp: new Date().toISOString(),
          isInternal: isInternalNote
        }
      ]
    } : null);

    setReplyText('');
    setIsInternalNote(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <LifeBuoy className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">HR Inquiries & Helpdesk Services</h1>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Employee cases with SLA timers, confidential internal notes, and instant Knowledge Base answers
          </p>
        </div>

        <button
          onClick={() => setShowNewCaseModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition-colors"
        >
          <Plus className="w-4 h-4" /> Open New Case
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Open Inquiries</span>
          <div className="mt-2 text-2xl font-bold text-amber-600">
            {hrCases.filter(c => c.status !== 'resolved' && c.status !== 'closed').length}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">Active across all departments</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">SLA Compliance</span>
          <div className="mt-2 text-2xl font-bold text-emerald-600">96.8%</div>
          <span className="text-[11px] text-gray-400 mt-1 block">Within statutory 24-48h target</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Resolved Cases</span>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {hrCases.filter(c => c.status === 'resolved' || c.status === 'closed').length}
          </div>
          <span className="text-[11px] text-gray-400 mt-1 block">Closed with satisfaction</span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs">
          <span className="text-xs font-semibold text-gray-500 uppercase tracking-wider block">Knowledge Base</span>
          <div className="mt-2 text-2xl font-bold text-purple-600">{knowledgeBase.length} Articles</div>
          <span className="text-[11px] text-gray-400 mt-1 block">Instant self-service policy guides</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search cases by subject, ticket number, or employee..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 capitalize"
          >
            <option value="all">All Categories</option>
            <option value="payroll">Payroll & Overtime</option>
            <option value="benefits">Benefits & Medical</option>
            <option value="grievance">Grievance</option>
            <option value="policy">Policy Clarification</option>
            <option value="it">IT & Access</option>
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500 capitalize"
          >
            <option value="all">All Statuses</option>
            <option value="new">New</option>
            <option value="in_progress">In Progress</option>
            <option value="waiting_employee">Waiting on Employee</option>
            <option value="resolved">Resolved</option>
            <option value="closed">Closed</option>
          </select>
        </div>
      </div>

      {/* Main Grid: Cases List & Active Discussion Thread */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Cases List */}
        <div className="lg:col-span-2 space-y-3">
          {filteredCases.map(item => {
            const isSelected = selectedCase?.id === item.id;
            const slaExpired = new Date(item.slaDueAt).getTime() < Date.now();

            return (
              <div
                key={item.id}
                onClick={() => setSelectedCase(item)}
                className={`bg-white border rounded-xl p-5 shadow-xs transition-all cursor-pointer hover:border-blue-300 ${
                  isSelected ? 'border-blue-600 ring-2 ring-blue-500/20' : 'border-gray-200'
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {item.caseNumber}
                      </span>
                      <span className="text-[11px] font-semibold text-gray-600 capitalize bg-gray-100 px-2 py-0.5 rounded">
                        {item.category}
                      </span>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        item.priority === 'urgent' ? 'bg-rose-100 text-rose-800' :
                        item.priority === 'high' ? 'bg-amber-100 text-amber-800' :
                        'bg-gray-100 text-gray-700'
                      }`}>
                        {item.priority}
                      </span>
                    </div>
                    <h3 className="text-sm font-bold text-gray-900 mt-2">{item.subject}</h3>
                    <p className="text-xs text-gray-500 mt-0.5">
                      Submitted by: <strong className="text-gray-700">{item.employeeName}</strong> ({item.department}) · {item.assignedTo}
                    </p>
                  </div>

                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full capitalize shrink-0 ${
                    item.status === 'resolved' ? 'bg-emerald-50 text-emerald-700' :
                    item.status === 'in_progress' ? 'bg-blue-50 text-blue-700' :
                    'bg-amber-50 text-amber-700'
                  }`}>
                    {item.status.replace('_', ' ')}
                  </span>
                </div>

                <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-1.5">
                    <Clock className={`w-3.5 h-3.5 ${slaExpired ? 'text-rose-600' : 'text-gray-400'}`} />
                    <span className={slaExpired ? 'text-rose-600 font-semibold' : ''}>
                      SLA Target: {new Date(item.slaDueAt).toLocaleDateString()}
                    </span>
                  </div>
                  <span className="text-blue-600 font-medium inline-flex items-center gap-1">
                    {item.replies.length} Replies <ChevronRight className="w-3.5 h-3.5" />
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Selected Case Conversation Thread */}
        <div>
          {selectedCase ? (
            <div className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4 sticky top-6">
              <div className="flex items-center justify-between border-b pb-3">
                <span className="text-xs font-mono font-bold text-blue-600">{selectedCase.caseNumber}</span>
                <div className="flex items-center gap-1">
                  <select
                    value={selectedCase.status}
                    onChange={(e) => {
                      updateCaseStatus(selectedCase.id, e.target.value as HRCase['status']);
                      setSelectedCase({ ...selectedCase, status: e.target.value as HRCase['status'] });
                    }}
                    className="text-xs font-semibold px-2 py-1 rounded bg-gray-50 border border-gray-200"
                  >
                    <option value="new">New</option>
                    <option value="in_progress">In Progress</option>
                    <option value="waiting_employee">Waiting on Employee</option>
                    <option value="resolved">Resolved</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
              </div>

              <div>
                <h4 className="text-sm font-bold text-gray-900">{selectedCase.subject}</h4>
                <p className="text-xs text-gray-600 mt-1 leading-relaxed bg-gray-50 p-3 rounded-lg border border-gray-100">
                  {selectedCase.description}
                </p>
              </div>

              {/* Thread history */}
              <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                {selectedCase.replies.map(rep => (
                  <div 
                    key={rep.id} 
                    className={`p-3 rounded-xl text-xs space-y-1 ${
                      rep.isInternal 
                        ? 'bg-amber-50/80 border border-amber-200 text-amber-900' 
                        : 'bg-blue-50/60 border border-blue-100 text-blue-900'
                    }`}
                  >
                    <div className="flex items-center justify-between font-bold text-[11px]">
                      <span>{rep.sender}</span>
                      {rep.isInternal && (
                        <span className="text-[10px] text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded flex items-center gap-1">
                          <Lock className="w-2.5 h-2.5" /> Internal Note
                        </span>
                      )}
                    </div>
                    <p className="leading-relaxed">{rep.message}</p>
                    <span className="text-[10px] opacity-70 block">{new Date(rep.timestamp).toLocaleTimeString()}</span>
                  </div>
                ))}
              </div>

              {/* Reply Form */}
              <form onSubmit={handleSendReply} className="pt-2 border-t border-gray-100 space-y-2">
                <textarea
                  rows={2}
                  required
                  placeholder={isInternalNote ? "Write private internal note for HR staff..." : "Reply to employee..."}
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                
                <div className="flex items-center justify-between">
                  <label className="inline-flex items-center gap-1.5 text-xs text-gray-600 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternalNote}
                      onChange={(e) => setIsInternalNote(e.target.checked)}
                      className="w-3.5 h-3.5 text-blue-600 rounded"
                    />
                    <span>Internal Note Only</span>
                  </label>

                  <button
                    type="submit"
                    className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1 shadow-2xs"
                  >
                    <Send className="w-3 h-3" /> Send Reply
                  </button>
                </div>
              </form>
            </div>
          ) : (
            <div className="bg-white rounded-xl border border-gray-200 p-8 text-center text-xs text-gray-400 shadow-xs">
              Select an inquiry to view replies, SLA milestones, or add staff notes.
            </div>
          )}
        </div>
      </div>

      {/* New Case Modal */}
      {showNewCaseModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-base font-semibold">Open HR Support Inquiry</h3>
              <button onClick={() => setShowNewCaseModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCase} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Subject / Question *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Question about 90-day proof of address renewal"
                  value={newCaseSubject}
                  onChange={(e) => setNewCaseSubject(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Live Knowledge Base Suggestions */}
              {suggestedArticles.length > 0 && (
                <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg space-y-2">
                  <span className="text-[11px] font-bold text-purple-900 flex items-center gap-1">
                    <BookOpen className="w-3.5 h-3.5" /> Suggested Knowledge Base Articles:
                  </span>
                  <div className="space-y-1">
                    {suggestedArticles.map(art => (
                      <button
                        key={art.id}
                        type="button"
                        onClick={() => setShowKBModal(art)}
                        className="w-full text-left p-2 bg-white rounded border border-purple-100 hover:border-purple-300 text-xs font-semibold text-purple-900 flex items-center justify-between"
                      >
                        <span>{art.title}</span>
                        <ChevronRight className="w-3 h-3 text-purple-500" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={newCaseCategory}
                    onChange={(e) => setNewCaseCategory(e.target.value as HRCase['category'])}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="payroll">Payroll & Overtime</option>
                    <option value="benefits">Benefits & Healthcare</option>
                    <option value="grievance">Grievance</option>
                    <option value="policy">Policy & Leave</option>
                    <option value="it">IT & Access Setup</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Priority</label>
                  <select
                    value={newCasePriority}
                    onChange={(e) => setNewCasePriority(e.target.value as HRCase['priority'])}
                    className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg bg-white"
                  >
                    <option value="low">Low (72h SLA)</option>
                    <option value="medium">Medium (48h SLA)</option>
                    <option value="high">High (24h SLA)</option>
                    <option value="urgent">Urgent (8h SLA)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Inquiry Details *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Provide all background information to assist fast resolution..."
                  value={newCaseDesc}
                  onChange={(e) => setNewCaseDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowNewCaseModal(false)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg"
                >
                  Submit Inquiry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Article Detail Modal */}
      {showKBModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-base font-semibold">{showKBModal.title}</h3>
              <button onClick={() => setShowKBModal(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 text-xs text-gray-700">
              <div className="bg-purple-50 p-3 rounded-lg border border-purple-200 font-semibold text-purple-900">
                {showKBModal.summary}
              </div>
              <p className="leading-relaxed whitespace-pre-wrap">{showKBModal.content}</p>
              <div className="pt-4 border-t border-gray-100 flex justify-end">
                <button
                  onClick={() => setShowKBModal(null)}
                  className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg font-medium"
                >
                  Close Article
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
