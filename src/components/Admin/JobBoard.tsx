import React, { useState } from 'react';
import { 
  Plus, 
  CheckCircle2, 
  X,
  Trash2
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { JobPosting } from '../../types';

export const JobBoard: React.FC = () => {
  const { jobPostings, departments, addJobPosting, updateJobPosting, deleteJobPosting } = useData();
  const { user } = useAuth();

  const [showModal, setShowModal] = useState(false);
  const [filterStatus, setFilterStatus] = useState<string>('all');

  const [formState, setFormState] = useState({
    title: '',
    departmentId: departments[0]?.id || '1',
    description: '',
    requirementsStr: '',
    responsibilitiesStr: '',
    minSalary: 80000,
    maxSalary: 110000,
    applicationDeadline: '2026-12-15',
    status: 'published' as JobPosting['status']
  });

  const canManage = user?.role === 'admin' || user?.role === 'hr_manager';

  const filteredJobs = jobPostings.filter(job => {
    if (filterStatus === 'all') return true;
    return job.status === filterStatus;
  });

  const handleCreateJob = (e: React.FormEvent) => {
    e.preventDefault();
    const requirements = formState.requirementsStr.split('\n').map(s => s.trim()).filter(Boolean);
    const responsibilities = formState.responsibilitiesStr.split('\n').map(s => s.trim()).filter(Boolean);

    addJobPosting({
      title: formState.title,
      departmentId: formState.departmentId,
      positionId: `pos-${Date.now()}`,
      description: formState.description,
      requirements: requirements.length ? requirements : ['Relevant domain experience required'],
      responsibilities: responsibilities.length ? responsibilities : ['Fulfill standard team deliverables'],
      salaryRange: {
        min: Number(formState.minSalary),
        max: Number(formState.maxSalary)
      },
      applicationDeadline: formState.applicationDeadline,
      status: formState.status,
      postedBy: `${user?.firstName || 'HR'} ${user?.lastName || 'Team'}`
    });

    setShowModal(false);
  };

  const handleStatusChange = (jobId: string, newStatus: JobPosting['status']) => {
    updateJobPosting(jobId, { status: newStatus });
  };

  const getDepartmentName = (deptId: string) => {
    const dept = departments.find(d => d.id === deptId);
    return dept ? dept.name : 'Corporate';
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Recruitment & Job Board</h1>
          <p className="text-gray-600 text-sm mt-1">Manage active vacancies, salary bands, candidate pipelines, and opening statuses</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setFormState({
                title: '',
                departmentId: departments[0]?.id || '1',
                description: '',
                requirementsStr: '3+ years experience\nStrong analytical skills\nCollaborative team player',
                responsibilitiesStr: 'Design and deliver key deliverables\nWork with cross-functional stakeholders',
                minSalary: 85000,
                maxSalary: 115000,
                applicationDeadline: '2026-12-15',
                status: 'published'
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Post New Vacancy
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 border-b border-gray-200 pb-3">
        {[
          { id: 'all', label: 'All Postings' },
          { id: 'published', label: 'Published / Open' },
          { id: 'draft', label: 'Drafts' },
          { id: 'closed', label: 'Closed / Filled' },
        ].map(tab => (
          <button
            key={tab.id}
            onClick={() => setFilterStatus(tab.id)}
            className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
              filterStatus === tab.id
                ? 'bg-blue-600 text-white'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Vacancy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJobs.map(job => (
          <div key={job.id} className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 flex flex-col justify-between hover:border-blue-200 transition-colors">
            <div>
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-xs font-semibold text-blue-600 uppercase tracking-wider">
                    {getDepartmentName(job.departmentId)}
                  </span>
                  <h3 className="text-lg font-bold text-gray-900 mt-1">{job.title}</h3>
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded font-medium capitalize ${
                  job.status === 'published' ? 'bg-emerald-50 text-emerald-700' :
                  job.status === 'draft' ? 'bg-amber-50 text-amber-700' :
                  'bg-gray-100 text-gray-700'
                }`}>
                  {job.status}
                </span>
              </div>

              <p className="text-xs text-gray-600 mt-3 leading-relaxed">{job.description}</p>

              {job.salaryRange && (
                <div className="mt-4 p-3 bg-gray-50 rounded-lg flex items-center justify-between text-xs text-gray-700">
                  <span className="text-gray-500">Compensation Band:</span>
                  <span className="font-bold text-gray-900">
                    ${job.salaryRange.min.toLocaleString()} — ${job.salaryRange.max.toLocaleString()} / yr
                  </span>
                </div>
              )}

              {job.requirements.length > 0 && (
                <div className="mt-4">
                  <span className="text-xs font-semibold text-gray-700 block mb-1.5">Candidate Requirements:</span>
                  <ul className="space-y-1">
                    {job.requirements.slice(0, 3).map((req, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-center">
                        <CheckCircle2 className="w-3 h-3 text-emerald-500 mr-2 shrink-0" />
                        <span>{req}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                <span>Deadline: {new Date(job.applicationDeadline).toLocaleDateString()}</span>
                <span>Posted by: {job.postedBy}</span>
              </div>
            </div>

            {canManage && (
              <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500">Status:</span>
                  <select
                    value={job.status}
                    onChange={(e) => handleStatusChange(job.id, e.target.value as JobPosting['status'])}
                    className="text-xs border border-gray-200 rounded px-2 py-1 bg-white font-medium"
                  >
                    <option value="published">Published</option>
                    <option value="draft">Draft</option>
                    <option value="closed">Closed</option>
                  </select>
                </div>
                <button
                  onClick={() => deleteJobPosting(job.id)}
                  className="p-1.5 text-gray-400 hover:text-red-600 rounded hover:bg-red-50"
                  title="Delete Vacancy"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        ))}

        {filteredJobs.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-gray-500">
            No job vacancies found for the selected status filter.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Post New Job Vacancy</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateJob} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Position Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lead Product Designer"
                  value={formState.title}
                  onChange={(e) => setFormState({ ...formState, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Department</label>
                  <select
                    value={formState.departmentId}
                    onChange={(e) => setFormState({ ...formState, departmentId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Application Deadline</label>
                  <input
                    type="date"
                    required
                    value={formState.applicationDeadline}
                    onChange={(e) => setFormState({ ...formState, applicationDeadline: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Min Salary ($)</label>
                  <input
                    type="number"
                    value={formState.minSalary}
                    onChange={(e) => setFormState({ ...formState, minSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Max Salary ($)</label>
                  <input
                    type="number"
                    value={formState.maxSalary}
                    onChange={(e) => setFormState({ ...formState, maxSalary: Number(e.target.value) })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Role Description</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Overview of the mission and team context..."
                  value={formState.description}
                  onChange={(e) => setFormState({ ...formState, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Requirements (one per line)</label>
                <textarea
                  rows={2}
                  value={formState.requirementsStr}
                  onChange={(e) => setFormState({ ...formState, requirementsStr: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Publish Status</label>
                <select
                  value={formState.status}
                  onChange={(e) => setFormState({ ...formState, status: e.target.value as JobPosting['status'] })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="published">Publish Immediately</option>
                  <option value="draft">Save as Draft</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg font-medium"
                >
                  Publish Vacancy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
