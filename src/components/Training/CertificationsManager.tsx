import React, { useState } from 'react';
import { 
  Award, 
  Plus, 
  Search, 
  Filter, 
  ShieldCheck, 
  X
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { CertificationRecord } from '../../types';

export const CertificationsManager: React.FC = () => {
  const { certifications, employees, addCertification } = useData();
  const { user } = useAuth();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('all');
  const [showModal, setShowModal] = useState(false);

  const [formState, setFormState] = useState({
    employeeId: employees[0]?.id || '1',
    name: '',
    issuingOrganization: '',
    issueDate: new Date().toISOString().split('T')[0],
    expiryDate: new Date(Date.now() + 365 * 86400000 * 2).toISOString().split('T')[0],
    credentialId: '',
    status: 'active' as CertificationRecord['status']
  });

  const canManage = user?.role === 'admin' || user?.role === 'hr_manager';

  const enrichedCerts = certifications.map(c => {
    const emp = employees.find(e => e.id === c.employeeId);
    return {
      ...c,
      employeeName: emp ? `${emp.personalInfo.firstName} ${emp.personalInfo.lastName}` : `Employee #${c.employeeId}`,
      department: emp?.jobInfo.department || 'N/A'
    };
  });

  const filteredCerts = enrichedCerts.filter(c => {
    const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
      c.employeeName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.credentialId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || c.status === selectedStatus;
    return matchesSearch && matchesStatus;
  });

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addCertification({
      employeeId: formState.employeeId,
      name: formState.name,
      issuingOrganization: formState.issuingOrganization,
      issueDate: formState.issueDate,
      expiryDate: formState.expiryDate,
      credentialId: formState.credentialId,
      status: formState.status
    });
    setShowModal(false);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personnel Licenses & Certifications</h1>
          <p className="text-gray-600 text-sm mt-1">Track professional credentials, renewal windows, and compliance certifications</p>
        </div>
        {canManage && (
          <button
            onClick={() => {
              setFormState({
                employeeId: employees[0]?.id || '1',
                name: '',
                issuingOrganization: '',
                issueDate: new Date().toISOString().split('T')[0],
                expiryDate: new Date(Date.now() + 365 * 86400000 * 2).toISOString().split('T')[0],
                credentialId: `CERT-${Math.floor(100000 + Math.random() * 900000)}`,
                status: 'active'
              });
              setShowModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Add Certification
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative flex-1 w-full">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search certification, holder, or credential ID..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="flex items-center gap-2 text-sm text-gray-600">
            <Filter className="w-4 h-4 text-gray-400" />
            <span>Status:</span>
          </div>
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Certifications</option>
            <option value="active">Active & Verified</option>
            <option value="expiring_soon">Expiring Soon</option>
            <option value="expired">Expired</option>
          </select>
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCerts.map((cert) => (
          <div key={cert.id} className="bg-white rounded-xl border border-gray-200 shadow-xs p-6 flex flex-col justify-between hover:border-blue-200 transition-colors">
            <div>
              <div className="flex items-start justify-between">
                <div className="w-10 h-10 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Award className="w-5 h-5" />
                </div>
                <span className={`text-xs px-2.5 py-0.5 rounded font-medium capitalize ${
                  cert.status === 'active' ? 'bg-emerald-50 text-emerald-700' :
                  cert.status === 'expiring_soon' ? 'bg-amber-50 text-amber-700' :
                  'bg-red-50 text-red-700'
                }`}>
                  {cert.status.replace('_', ' ')}
                </span>
              </div>

              <h3 className="text-base font-bold text-gray-900 mt-4">{cert.name}</h3>
              <p className="text-xs text-gray-500 mt-0.5">{cert.issuingOrganization}</p>

              <div className="mt-4 pt-3 border-t border-gray-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Credential Holder:</span>
                  <span className="font-semibold text-gray-900">{cert.employeeName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Department:</span>
                  <span className="text-gray-700">{cert.department}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">License ID:</span>
                  <span className="font-mono text-gray-800">{cert.credentialId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Issue Date:</span>
                  <span className="text-gray-700">{new Date(cert.issueDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Expiration:</span>
                  <span className={`font-semibold ${
                    cert.status === 'expired' ? 'text-red-600' : 
                    cert.status === 'expiring_soon' ? 'text-amber-600' : 'text-gray-900'
                  }`}>
                    {new Date(cert.expiryDate).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-emerald-700">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                Verified Credential
              </span>
            </div>
          </div>
        ))}

        {filteredCerts.length === 0 && (
          <div className="col-span-full py-12 text-center text-sm text-gray-500">
            No certifications found matching your filters.
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h3 className="text-base font-semibold text-gray-900">Add Professional Certification</h3>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Employee</label>
                <select
                  value={formState.employeeId}
                  onChange={(e) => setFormState({ ...formState, employeeId: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  {employees.map(e => (
                    <option key={e.id} value={e.id}>
                      {e.personalInfo.firstName} {e.personalInfo.lastName} ({e.jobInfo.department})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Certification Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Project Management Professional (PMP)"
                  value={formState.name}
                  onChange={(e) => setFormState({ ...formState, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Issuing Body / Authority</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. PMI, CompTIA, AWS"
                    value={formState.issuingOrganization}
                    onChange={(e) => setFormState({ ...formState, issuingOrganization: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Credential / License ID</label>
                  <input
                    type="text"
                    required
                    value={formState.credentialId}
                    onChange={(e) => setFormState({ ...formState, credentialId: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Issue Date</label>
                  <input
                    type="date"
                    required
                    value={formState.issueDate}
                    onChange={(e) => setFormState({ ...formState, issueDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">Expiry Date</label>
                  <input
                    type="date"
                    required
                    value={formState.expiryDate}
                    onChange={(e) => setFormState({ ...formState, expiryDate: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={formState.status}
                  onChange={(e) => setFormState({ ...formState, status: e.target.value as CertificationRecord['status'] })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                  <option value="active">Active & Verified</option>
                  <option value="expiring_soon">Expiring Soon (&lt; 60 days)</option>
                  <option value="expired">Expired</option>
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
                  Save Credential
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
