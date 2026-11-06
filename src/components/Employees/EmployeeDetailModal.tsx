import React, { useState } from 'react';
import { 
  X, 
  User, 
  Briefcase, 
  MapPin, 
  Mail, 
  Phone, 
  Calendar, 
  ShieldCheck, 
  GraduationCap, 
  History, 
  DollarSign,
  FileText,
  Upload,
  Download,
  Image as ImageIcon,
  Award
} from 'lucide-react';
import { Employee, Document } from '../../types';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';

interface EmployeeDetailModalProps {
  employee: Employee;
  onClose: () => void;
  onEdit?: () => void;
}

export const EmployeeDetailModal: React.FC<EmployeeDetailModalProps> = ({ employee, onClose, onEdit }) => {
  const { getDocumentsByEmployee, addDocument } = useData();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<'profile' | 'job' | 'qualifications' | 'history' | 'vetting' | 'documents'>('profile');
  const [showUploadInline, setShowUploadInline] = useState(false);
  const [uploadName, setUploadName] = useState('');
  const [uploadCategory, setUploadCategory] = useState<Document['category']>('qualification');
  const [uploadFile, setUploadFile] = useState<{ name: string; data: string; type: string; size: number } | null>(null);

  const empDocs = getDocumentsByEmployee(employee.id);

  const handleInlineFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadFile({
        name: file.name,
        data: reader.result as string,
        type: file.type || 'application/pdf',
        size: file.size
      });
      if (!uploadName) {
        setUploadName(file.name.replace(/\.[^/.]+$/, ''));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleInlineUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    addDocument({
      name: uploadName || uploadFile.name,
      fileName: uploadFile.name,
      type: uploadFile.type,
      size: uploadFile.size,
      category: uploadCategory,
      employeeId: employee.id,
      uploadedBy: user ? `${user.firstName} ${user.lastName}` : 'HR Portal',
      isConfidential: false,
      accessLevel: 'employee_and_hr',
      fileData: uploadFile.data,
      verificationStatus: 'pending'
    });

    setShowUploadInline(false);
    setUploadName('');
    setUploadFile(null);
  };

  const { personalInfo, jobInfo, jobHistory = [], qualifications = [], vettingStatus } = employee;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="bg-slate-900 text-white p-6 flex items-start justify-between">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 rounded-full bg-blue-600 flex items-center justify-center text-xl font-bold text-white shadow-md">
              {personalInfo.firstName[0]}{personalInfo.lastName[0]}
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-semibold text-white">
                  {personalInfo.firstName} {personalInfo.lastName}
                </h2>
                <span className="text-xs px-2.5 py-0.5 rounded-md font-medium uppercase tracking-wider bg-white/10 text-slate-200">
                  {jobInfo.employmentStatus}
                </span>
              </div>
              <p className="text-slate-300 text-sm mt-0.5">{jobInfo.jobTitle} · {jobInfo.department}</p>
              <div className="flex items-center gap-4 text-xs text-slate-400 mt-2">
                <span>ID: {employee.employeeId}</span>
                <span>·</span>
                <span>Hired: {new Date(jobInfo.hireDate).toLocaleDateString()}</span>
                <span>·</span>
                <span>{jobInfo.workLocation}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Tabs */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-2">
          {[
            { id: 'profile', label: 'Personal & Contact', icon: <User className="w-4 h-4" /> },
            { id: 'job', label: 'Employment & Pay', icon: <Briefcase className="w-4 h-4" /> },
            { id: 'qualifications', label: 'Qualifications', icon: <GraduationCap className="w-4 h-4" /> },
            { id: 'history', label: 'Job History', icon: <History className="w-4 h-4" /> },
            { id: 'vetting', label: 'Vetting & Security', icon: <ShieldCheck className="w-4 h-4" /> },
            { id: 'documents', label: `Documents & Photos (${empDocs.length})`, icon: <FileText className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-blue-600 text-blue-600 bg-white'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto flex-1 space-y-6">
          {activeTab === 'profile' && (
            <div className="space-y-6">
              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Contact Details</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center text-sm text-gray-700">
                    <Mail className="w-4 h-4 text-gray-400 mr-2.5" />
                    <span>{personalInfo.email}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Phone className="w-4 h-4 text-gray-400 mr-2.5" />
                    <span>{personalInfo.phone}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <Calendar className="w-4 h-4 text-gray-400 mr-2.5" />
                    <span>DOB: {new Date(personalInfo.dateOfBirth).toLocaleDateString()}</span>
                  </div>
                  <div className="flex items-center text-sm text-gray-700">
                    <MapPin className="w-4 h-4 text-gray-400 mr-2.5" />
                    <span>{personalInfo.address.street}, {personalInfo.address.city}, {personalInfo.address.state} {personalInfo.address.zipCode}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500 mb-3">Emergency Contact</h3>
                <div className="bg-gray-50 p-4 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{personalInfo.emergencyContact.name}</p>
                    <p className="text-xs text-gray-500">Relationship: {personalInfo.emergencyContact.relationship}</p>
                  </div>
                  <div className="text-sm text-gray-700 flex items-center">
                    <Phone className="w-4 h-4 text-gray-400 mr-2" />
                    <span>{personalInfo.emergencyContact.phone}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'job' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500">Department</span>
                  <p className="text-base font-semibold text-gray-900 mt-0.5">{jobInfo.department}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500">Position Title</span>
                  <p className="text-base font-semibold text-gray-900 mt-0.5">{jobInfo.jobTitle}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500">Reporting Manager</span>
                  <p className="text-base font-semibold text-gray-900 mt-0.5">{jobInfo.reportingManager}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500">Employment Type</span>
                  <p className="text-base font-semibold text-gray-900 mt-0.5 capitalize">{jobInfo.employmentType.replace('_', ' ')}</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500">Annual Compensation</span>
                  <p className="text-base font-semibold text-gray-900 mt-0.5 flex items-center">
                    <DollarSign className="w-4 h-4 text-emerald-600" />
                    {jobInfo.salary.toLocaleString()} / yr
                  </p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-500">Work Location</span>
                  <p className="text-base font-semibold text-gray-900 mt-0.5">{jobInfo.workLocation}</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'qualifications' && (
            <div className="space-y-4">
              {qualifications.length > 0 ? (
                qualifications.map((q) => (
                  <div key={q.id} className="p-4 border border-gray-200 rounded-lg flex items-start justify-between">
                    <div>
                      <h4 className="text-sm font-semibold text-gray-900">{q.name}</h4>
                      <p className="text-xs text-gray-600 mt-0.5">{q.institution}</p>
                      <p className="text-xs text-gray-400 mt-1">Obtained: {new Date(q.dateObtained).toLocaleDateString()}</p>
                    </div>
                    {q.verified && (
                      <span className="inline-flex items-center text-xs text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                        Verified
                      </span>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No educational qualifications registered yet.
                </div>
              )}
            </div>
          )}

          {activeTab === 'history' && (
            <div className="space-y-4">
              {jobHistory.length > 0 ? (
                jobHistory.map((h) => (
                  <div key={h.id} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-gray-900">{h.position}</h4>
                        <p className="text-xs font-medium text-blue-600 mt-0.5">{h.company}</p>
                      </div>
                      <span className="text-xs text-gray-500">
                        {new Date(h.startDate).toLocaleDateString()} — {new Date(h.endDate).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-2">{h.description}</p>
                    {h.reasonForLeaving && (
                      <p className="text-xs text-gray-400 mt-1">Reason for leaving: {h.reasonForLeaving}</p>
                    )}
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-gray-500 text-sm">
                  No prior employment history documented.
                </div>
              )}
            </div>
          )}

          {activeTab === 'vetting' && (
            <div className="space-y-4">
              <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Criminal & Police Background Check</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {vettingStatus?.policeRecordDate 
                      ? `Completed on ${new Date(vettingStatus.policeRecordDate).toLocaleDateString()}` 
                      : 'Pending verification'}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded font-medium ${
                  vettingStatus?.policeRecordCheck 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {vettingStatus?.policeRecordCheck ? 'Passed & Cleared' : 'Under Review'}
                </span>
              </div>

              <div className="p-4 border border-gray-200 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="text-sm font-semibold text-gray-900">Identity & Right-to-Work Vetting</h4>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {vettingStatus?.backgroundCheckDate 
                      ? `Verified on ${new Date(vettingStatus.backgroundCheckDate).toLocaleDateString()}` 
                      : 'Not completed'}
                  </p>
                </div>
                <span className={`text-xs px-2.5 py-1 rounded font-medium ${
                  vettingStatus?.backgroundCheckCompleted 
                    ? 'bg-emerald-50 text-emerald-700' 
                    : 'bg-amber-50 text-amber-700'
                }`}>
                  {vettingStatus?.backgroundCheckCompleted ? 'Verified' : 'Pending'}
                </span>
              </div>
            </div>
          )}

          {activeTab === 'documents' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-semibold uppercase tracking-wider text-gray-500">
                    Personnel Document & Photo Archive
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Diplomas, certifications, headshots, and statutory verification documents
                  </p>
                </div>
                <button
                  onClick={() => setShowUploadInline(!showUploadInline)}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 transition-colors shadow-2xs"
                >
                  <Upload className="w-3.5 h-3.5" /> Upload File / Photo
                </button>
              </div>

              {/* Inline Upload Box */}
              {showUploadInline && (
                <form onSubmit={handleInlineUploadSubmit} className="bg-blue-50/50 border border-blue-200 rounded-xl p-4 space-y-3">
                  <h4 className="text-xs font-bold text-blue-900 uppercase tracking-wider">Upload Personnel File</h4>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Document Title *</label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Master of Business Administration Degree"
                        value={uploadName}
                        onChange={(e) => setUploadName(e.target.value)}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-medium text-gray-700 mb-1">Category *</label>
                      <select
                        value={uploadCategory}
                        onChange={(e) => setUploadCategory(e.target.value as Document['category'])}
                        className="w-full px-3 py-1.5 text-xs border border-gray-300 rounded-lg bg-white"
                      >
                        <option value="qualification">Qualification / Diploma</option>
                        <option value="certification">Professional Certification</option>
                        <option value="photo">Personnel Photo / ID Photo</option>
                        <option value="fica_proof_of_address">FICA Proof of Address (&lt; 3mo)</option>
                        <option value="fica_id">Certified Identity Document</option>
                        <option value="fica_bank_statement">Bank Confirmation Letter</option>
                        <option value="tax_document">Tax Document</option>
                        <option value="contract">Employment Contract</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">Select File (Image, PDF, PPT) *</label>
                    <input
                      type="file"
                      required
                      onChange={handleInlineFileChange}
                      accept="image/*,.pdf,.doc,.docx,.ppt,.pptx"
                      className="block w-full text-xs text-gray-500 file:mr-4 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-blue-600 file:text-white hover:file:bg-blue-700"
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowUploadInline(false)}
                      className="px-3 py-1 text-xs text-gray-600 hover:bg-gray-100 rounded-lg"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={!uploadFile}
                      className="px-3 py-1 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg"
                    >
                      Save Document
                    </button>
                  </div>
                </form>
              )}

              {/* Photo Gallery if photos exist */}
              {empDocs.some(d => d.category === 'photo' || d.type.startsWith('image/')) && (
                <div>
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 mb-2 flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5 text-emerald-600" />
                    Personnel Photos & ID Images
                  </h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {empDocs
                      .filter(d => d.category === 'photo' || d.type.startsWith('image/'))
                      .map(photo => (
                        <div key={photo.id} className="group relative rounded-lg overflow-hidden border border-gray-200 bg-gray-100 aspect-square">
                          <img
                            src={photo.fileData || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80'}
                            alt={photo.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-end p-2 text-white">
                            <span className="text-[11px] font-semibold truncate">{photo.name}</span>
                            {photo.fileData && (
                              <a
                                href={photo.fileData}
                                download={photo.fileName || `${photo.name}.jpg`}
                                className="text-[10px] text-blue-300 underline mt-0.5 inline-flex items-center gap-1"
                              >
                                <Download className="w-3 h-3" /> Download
                              </a>
                            )}
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}

              {/* Documents List */}
              <div className="space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-600 flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5 text-blue-600" />
                  Uploaded Documents & Accreditations ({empDocs.length})
                </h4>

                {empDocs.length === 0 ? (
                  <div className="p-8 text-center bg-gray-50 rounded-xl border border-dashed border-gray-300">
                    <FileText className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs text-gray-500">No documents or photos uploaded for this employee yet.</p>
                  </div>
                ) : (
                  empDocs.map(doc => (
                    <div 
                      key={doc.id}
                      className="p-3 bg-gray-50 rounded-xl border border-gray-200 flex items-center justify-between gap-3 hover:bg-white hover:border-blue-200 transition-all"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-white rounded-lg border border-gray-200 text-blue-600">
                          {doc.category === 'qualification' ? <GraduationCap className="w-4 h-4" /> :
                           doc.category === 'certification' ? <Award className="w-4 h-4 text-amber-600" /> :
                           doc.category === 'photo' ? <ImageIcon className="w-4 h-4 text-emerald-600" /> :
                           <FileText className="w-4 h-4" />}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h5 className="text-xs font-bold text-gray-900">{doc.name}</h5>
                            <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded capitalize ${
                              doc.verificationStatus === 'verified' ? 'bg-emerald-50 text-emerald-700' :
                              doc.verificationStatus === 'rejected' ? 'bg-rose-50 text-rose-700' :
                              'bg-amber-50 text-amber-700'
                            }`}>
                              {doc.verificationStatus || 'Pending'}
                            </span>
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5">
                            {doc.category.replace('_', ' ')} · Uploaded {new Date(doc.uploadDate).toLocaleDateString()}
                            {doc.expiryDate && ` · Expiry: ${doc.expiryDate}`}
                          </p>
                        </div>
                      </div>

                      {doc.fileData && (
                        <a
                          href={doc.fileData}
                          download={doc.fileName || `${doc.name}.pdf`}
                          className="px-2.5 py-1.5 bg-white hover:bg-blue-50 text-blue-700 text-xs font-semibold rounded-lg border border-gray-200 inline-flex items-center gap-1 shadow-2xs transition-colors shrink-0"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-gray-200 bg-gray-50 flex items-center justify-between">
          <span className="text-xs text-gray-500">Record last updated: {new Date(employee.updatedAt).toLocaleDateString()}</span>
          <div className="flex items-center gap-3">
            {onEdit && (
              <button
                onClick={() => {
                  onClose();
                  onEdit();
                }}
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
              >
                Edit Profile
              </button>
            )}
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
