import React, { useState } from 'react';
import { 
  FileText, 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  ShieldCheck, 
  Image as ImageIcon,
  Award,
  GraduationCap,
  X,
  FileCheck,
  Lock,
  UserCheck
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Document } from '../../types';

export const DocumentManager: React.FC = () => {
  const { documents, employees, addDocument, deleteDocument, verifyDocument } = useData();
  const { user } = useAuth();

  const isHrOrAdmin = user?.role === 'admin' || user?.role === 'hr_manager';
  const currentEmpId = user?.employeeId || employees[0]?.id || '1';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string>(isHrOrAdmin ? 'all' : currentEmpId);
  const [selectedStatus, setSelectedStatus] = useState<string>('all');

  // Modals
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [previewDoc, setPreviewDoc] = useState<Document | null>(null);
  const [verifyModalDoc, setVerifyModalDoc] = useState<Document | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');

  // Upload Form State
  const [uploadForm, setUploadForm] = useState({
    name: '',
    category: 'qualification' as Document['category'],
    employeeId: isHrOrAdmin ? (employees[0]?.id || '1') : currentEmpId,
    isConfidential: false,
    expiryDate: '',
    fileData: '',
    fileName: '',
    fileType: '',
    fileSize: 0
  });
  const [uploadError, setUploadError] = useState('');

  // Handle file select & base64 encoding
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 15 * 1024 * 1024) {
      setUploadError('File size exceeds 15MB limit.');
      return;
    }
    setUploadError('');

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setUploadForm(prev => ({
        ...prev,
        fileName: file.name,
        fileType: file.type || 'application/octet-stream',
        fileSize: file.size,
        fileData: result,
        name: prev.name.trim() === '' ? file.name.replace(/\.[^/.]+$/, '') : prev.name
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.fileData && !uploadForm.fileName) {
      setUploadError('Please select a file to upload.');
      return;
    }

    addDocument({
      name: uploadForm.name || uploadForm.fileName,
      fileName: uploadForm.fileName || `${uploadForm.name}.pdf`,
      type: uploadForm.fileType || 'application/pdf',
      size: uploadForm.fileSize || 1024 * 500,
      category: uploadForm.category,
      employeeId: uploadForm.employeeId,
      uploadedBy: user ? `${user.firstName} ${user.lastName}` : 'System User',
      isConfidential: uploadForm.isConfidential,
      accessLevel: uploadForm.isConfidential ? 'hr_only' : 'employee_and_hr',
      fileData: uploadForm.fileData,
      verificationStatus: 'pending',
      expiryDate: uploadForm.expiryDate || undefined
    });

    setShowUploadModal(false);
    setUploadForm({
      name: '',
      category: 'qualification',
      employeeId: isHrOrAdmin ? (employees[0]?.id || '1') : currentEmpId,
      isConfidential: false,
      expiryDate: '',
      fileData: '',
      fileName: '',
      fileType: '',
      fileSize: 0
    });
  };

  const handleVerifySubmit = (status: 'verified' | 'rejected') => {
    if (!verifyModalDoc) return;
    verifyDocument(
      verifyModalDoc.id,
      status,
      verificationNotes,
      user ? `${user.firstName} ${user.lastName}` : 'Compliance Officer'
    );
    setVerifyModalDoc(null);
    setVerificationNotes('');
    if (previewDoc?.id === verifyModalDoc.id) {
      setPreviewDoc(prev => prev ? {
        ...prev,
        verificationStatus: status,
        verificationNotes,
        verifiedBy: user ? `${user.firstName} ${user.lastName}` : 'Compliance Officer',
        verifiedAt: new Date().toISOString()
      } : null);
    }
  };

  // Filter documents
  const filteredDocuments = documents.filter(doc => {
    // If not HR/Admin, can only view own documents
    if (!isHrOrAdmin && doc.employeeId !== currentEmpId) {
      return false;
    }

    const matchesEmployee = selectedEmployeeId === 'all' || doc.employeeId === selectedEmployeeId;
    const matchesCategory = selectedCategory === 'all' || doc.category === selectedCategory;
    const matchesStatus = selectedStatus === 'all' || (doc.verificationStatus || 'pending') === selectedStatus;
    const matchesSearch = doc.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.fileName && doc.fileName.toLowerCase().includes(searchTerm.toLowerCase())) ||
      doc.category.toLowerCase().includes(searchTerm.toLowerCase());

    return matchesEmployee && matchesCategory && matchesStatus && matchesSearch;
  });

  const getCategoryIcon = (category: Document['category']) => {
    switch (category) {
      case 'qualification':
        return <GraduationCap className="w-5 h-5 text-indigo-600" />;
      case 'certification':
        return <Award className="w-5 h-5 text-amber-600" />;
      case 'photo':
        return <ImageIcon className="w-5 h-5 text-emerald-600" />;
      case 'fica_proof_of_address':
      case 'fica_id':
      case 'fica_bank_statement':
        return <ShieldCheck className="w-5 h-5 text-blue-600" />;
      case 'tax_document':
      case 'contract':
        return <FileCheck className="w-5 h-5 text-purple-600" />;
      default:
        return <FileText className="w-5 h-5 text-gray-500" />;
    }
  };

  const getCategoryLabel = (category: Document['category']) => {
    switch (category) {
      case 'qualification': return 'Qualification / Degree';
      case 'certification': return 'Industry Certification';
      case 'photo': return 'Personnel Photo / ID Photo';
      case 'fica_proof_of_address': return 'FICA Proof of Address (< 3mo)';
      case 'fica_id': return 'FICA Certified ID/Passport';
      case 'fica_bank_statement': return 'FICA Bank Confirmation';
      case 'tax_document': return 'SARS / Tax Clearance';
      case 'contract': return 'Employment Contract';
      case 'identity': return 'National ID / Passport';
      default: return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  // Helper to check 90-day expiry for FICA proof of address
  const getFicaExpiryWarning = (doc: Document) => {
    if (doc.category !== 'fica_proof_of_address' || !doc.expiryDate) return null;
    const expiry = new Date(doc.expiryDate);
    const now = new Date();
    const diffDays = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      return { text: `Expired ${Math.abs(diffDays)} days ago (Must be < 90 days old)`, isExpired: true };
    }
    if (diffDays <= 30) {
      return { text: `Expires in ${diffDays} days - renewal required soon`, isExpiringSoon: true };
    }
    return { text: `Valid for ${diffDays} more days`, isValid: true };
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Personnel Document & Photo Vault</h1>
          <p className="text-gray-600 text-sm mt-1">
            Secure storage for qualifications, certifications, personnel photos, and regulatory FICA compliance dossiers
          </p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors shadow-xs"
        >
          <Upload className="w-4 h-4" />
          Upload Document or Photo
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Total Documents</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-gray-900">{documents.length}</div>
            <p className="text-xs text-gray-500 mt-1">Stored across all employee records</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Qualifications & Certs</span>
            <span className="p-2 bg-indigo-50 text-indigo-600 rounded-lg">
              <GraduationCap className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-indigo-700">
              {documents.filter(d => d.category === 'qualification' || d.category === 'certification').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Degrees, diplomas & vendor credentials</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">FICA & Regulatory</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-emerald-700">
              {documents.filter(d => d.category.startsWith('fica_')).length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Proof of address, IDs & bank letters</p>
          </div>
        </div>

        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Pending Review</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <Clock className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-bold text-amber-700">
              {documents.filter(d => (d.verificationStatus || 'pending') === 'pending').length}
            </div>
            <p className="text-xs text-gray-500 mt-1">Awaiting compliance verification</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search documents by name, category, or file..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {isHrOrAdmin && (
            <div className="flex items-center gap-2 text-sm">
              <UserCheck className="w-4 h-4 text-gray-400" />
              <select
                value={selectedEmployeeId}
                onChange={(e) => setSelectedEmployeeId(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">All Personnel</option>
                {employees.map(emp => (
                  <option key={emp.id} value={emp.id}>
                    {emp.personalInfo.firstName} {emp.personalInfo.lastName} ({emp.employeeId})
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Categories</option>
              <option value="qualification">Qualifications / Degrees</option>
              <option value="certification">Certifications</option>
              <option value="photo">Photos & Headshots</option>
              <option value="fica_proof_of_address">FICA Proof of Address</option>
              <option value="fica_id">FICA Certified ID</option>
              <option value="fica_bank_statement">FICA Bank Statement</option>
              <option value="tax_document">Tax Documents</option>
              <option value="contract">Employment Contracts</option>
            </select>
          </div>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:outline-hidden focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Verification Statuses</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending Review</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {/* Documents Grid / Table */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-12 text-center shadow-xs">
          <FileText className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-base font-semibold text-gray-900">No documents found</h3>
          <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
            Try adjusting your search query, selecting a different category, or upload a new document or photo.
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 inline-flex items-center gap-2"
          >
            <Upload className="w-4 h-4" />
            Upload File Now
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredDocuments.map(doc => {
            const owner = employees.find(e => e.id === doc.employeeId);
            const ficaExpiry = getFicaExpiryWarning(doc);
            const isImage = doc.type.startsWith('image/') || doc.category === 'photo';

            return (
              <div 
                key={doc.id} 
                className="bg-white rounded-xl border border-gray-200 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between overflow-hidden"
              >
                {/* Visual Thumbnail or Banner */}
                {isImage && doc.fileData ? (
                  <div className="h-40 bg-gray-100 overflow-hidden relative group">
                    <img 
                      src={doc.fileData} 
                      alt={doc.name} 
                      className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="p-2 bg-white/90 text-gray-900 rounded-lg hover:bg-white text-xs font-semibold flex items-center gap-1.5 shadow"
                      >
                        <Eye className="w-3.5 h-3.5" /> View Full
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="h-24 bg-gradient-to-r from-slate-50 to-blue-50/50 p-4 border-b border-gray-100 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-xs">
                        {getCategoryIcon(doc.category)}
                      </div>
                      <div>
                        <span className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                          {doc.type.includes('pdf') ? 'PDF Document' : doc.type.split('/')[1]?.toUpperCase() || 'Document'}
                        </span>
                        <p className="text-xs text-gray-500">{formatFileSize(doc.size)}</p>
                      </div>
                    </div>
                    {doc.isConfidential && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                        <Lock className="w-3 h-3" /> Confidential
                      </span>
                    )}
                  </div>
                )}

                {/* Card Body */}
                <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2" title={doc.name}>
                        {doc.name}
                      </h3>
                      {/* Verification Status Badge */}
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full inline-flex items-center gap-1 shrink-0 ${
                        doc.verificationStatus === 'verified'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : doc.verificationStatus === 'rejected'
                          ? 'bg-rose-50 text-rose-700 border border-rose-200'
                          : 'bg-amber-50 text-amber-700 border border-amber-200'
                      }`}>
                        {doc.verificationStatus === 'verified' ? <CheckCircle className="w-3 h-3" /> :
                         doc.verificationStatus === 'rejected' ? <XCircle className="w-3 h-3" /> :
                         <Clock className="w-3 h-3" />}
                        {doc.verificationStatus === 'verified' ? 'Verified' :
                         doc.verificationStatus === 'rejected' ? 'Rejected' : 'Pending Review'}
                      </span>
                    </div>

                    <div className="mt-2 space-y-1.5 text-xs text-gray-500">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Category:</span>
                        <span className="font-medium text-gray-700">{getCategoryLabel(doc.category)}</span>
                      </div>
                      {owner && (
                        <div className="flex items-center justify-between">
                          <span className="text-gray-400">Personnel:</span>
                          <span className="font-medium text-gray-900">
                            {owner.personalInfo.firstName} {owner.personalInfo.lastName}
                          </span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400">Uploaded:</span>
                        <span>{new Date(doc.uploadDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* FICA 90-day expiry alert banner */}
                    {ficaExpiry && (
                      <div className={`mt-3 p-2 rounded text-[11px] font-medium flex items-center gap-1.5 ${
                        ficaExpiry.isExpired 
                          ? 'bg-rose-50 text-rose-800 border border-rose-200'
                          : ficaExpiry.isExpiringSoon
                          ? 'bg-amber-50 text-amber-800 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      }`}>
                        {ficaExpiry.isExpired ? <AlertTriangle className="w-3.5 h-3.5 text-rose-600 shrink-0" /> : <ShieldCheck className="w-3.5 h-3.5 shrink-0" />}
                        <span>{ficaExpiry.text}</span>
                      </div>
                    )}

                    {doc.verificationNotes && (
                      <div className="mt-2 text-xs bg-gray-50 p-2 rounded text-gray-600 border border-gray-100">
                        <span className="font-semibold text-gray-700">Audit note:</span> {doc.verificationNotes}
                      </div>
                    )}
                  </div>

                  {/* Card Actions */}
                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setPreviewDoc(doc)}
                        className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors"
                        title="Preview Document"
                      >
                        <Eye className="w-3.5 h-3.5" /> Preview
                      </button>
                      {doc.fileData && (
                        <a
                          href={doc.fileData}
                          download={doc.fileName || `${doc.name}.pdf`}
                          className="px-2.5 py-1.5 text-xs font-semibold text-gray-700 hover:text-emerald-600 hover:bg-emerald-50 rounded-lg flex items-center gap-1 transition-colors"
                          title="Download File"
                        >
                          <Download className="w-3.5 h-3.5" /> Download
                        </a>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      {isHrOrAdmin && (
                        <button
                          onClick={() => {
                            setVerifyModalDoc(doc);
                            setVerificationNotes(doc.verificationNotes || '');
                          }}
                          className="px-2.5 py-1.5 text-xs font-semibold text-blue-700 hover:bg-blue-50 rounded-lg flex items-center gap-1 transition-colors"
                          title="Review & Verify Document"
                        >
                          <ShieldCheck className="w-3.5 h-3.5" /> Review
                        </button>
                      )}
                      {(isHrOrAdmin || doc.uploadedBy.includes(user?.firstName || '')) && (
                        <button
                          onClick={() => deleteDocument(doc.id)}
                          className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                          title="Delete Document"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Upload Document / Photo Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Upload className="w-5 h-5 text-blue-400" />
                <h3 className="text-base font-semibold">Upload Document or Photo</h3>
              </div>
              <button onClick={() => setShowUploadModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="p-6 space-y-4">
              {uploadError && (
                <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>{uploadError}</span>
                </div>
              )}

              {/* File Upload Zone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  File Attachment (Images, PDF, PPT, Word) *
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center hover:border-blue-500 transition-colors bg-gray-50">
                  <input
                    type="file"
                    id="docFileInput"
                    onChange={handleFileChange}
                    accept="image/*,.pdf,.ppt,.pptx,.doc,.docx"
                    className="hidden"
                  />
                  <label htmlFor="docFileInput" className="cursor-pointer block">
                    {uploadForm.fileName ? (
                      <div className="flex flex-col items-center">
                        <FileCheck className="w-8 h-8 text-emerald-600 mb-2" />
                        <span className="text-sm font-semibold text-gray-900">{uploadForm.fileName}</span>
                        <span className="text-xs text-gray-500 mt-0.5">{formatFileSize(uploadForm.fileSize)}</span>
                        <span className="text-xs text-blue-600 underline mt-2">Click to replace file</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-sm font-semibold text-gray-800">Click to browse or drop file here</span>
                        <span className="text-xs text-gray-500 mt-1">Supports PNG, JPG, PDF, PPT, Word up to 15MB</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Document Title */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Document / Photo Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. B.Sc Computer Science Degree or Utility Bill Dec 2026"
                  value={uploadForm.name}
                  onChange={(e) => setUploadForm({ ...uploadForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Category & Employee */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 mb-1">Category *</label>
                  <select
                    value={uploadForm.category}
                    onChange={(e) => setUploadForm({ ...uploadForm, category: e.target.value as Document['category'] })}
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="qualification">Qualification / Degree</option>
                    <option value="certification">Industry Certification</option>
                    <option value="photo">Photo / Headshot</option>
                    <option value="fica_proof_of_address">FICA Proof of Address (&lt; 3mo)</option>
                    <option value="fica_id">FICA Certified ID/Passport</option>
                    <option value="fica_bank_statement">FICA Bank Statement (&lt; 3mo)</option>
                    <option value="tax_document">SARS / Tax Document</option>
                    <option value="contract">Employment Contract</option>
                    <option value="personal">Personal Document</option>
                  </select>
                </div>

                {isHrOrAdmin ? (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Personnel / Employee *</label>
                    <select
                      value={uploadForm.employeeId}
                      onChange={(e) => setUploadForm({ ...uploadForm, employeeId: e.target.value })}
                      className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
                    >
                      {employees.map(emp => (
                        <option key={emp.id} value={emp.id}>
                          {emp.personalInfo.firstName} {emp.personalInfo.lastName} ({emp.employeeId})
                        </option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div>
                    <label className="block text-xs font-semibold text-gray-700 mb-1">Owner</label>
                    <input
                      type="text"
                      disabled
                      value={`${user?.firstName} ${user?.lastName}`}
                      className="w-full px-3 py-2 text-sm bg-gray-100 border border-gray-300 rounded-lg text-gray-600"
                    />
                  </div>
                )}
              </div>

              {/* Expiry Date (critical for 90-day FICA proofs & Certifications) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Document Expiry / Renewal Date (Required for FICA 90-day proof or certifications)
                </label>
                <input
                  type="date"
                  value={uploadForm.expiryDate}
                  onChange={(e) => setUploadForm({ ...uploadForm, expiryDate: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  Tip: For financial institution FICA address verification, proof must be dated within 90 days.
                </span>
              </div>

              {/* Confidential Toggle */}
              {isHrOrAdmin && (
                <div className="flex items-center gap-2 pt-2">
                  <input
                    type="checkbox"
                    id="confidentialCheck"
                    checked={uploadForm.isConfidential}
                    onChange={(e) => setUploadForm({ ...uploadForm, isConfidential: e.target.checked })}
                    className="w-4 h-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                  <label htmlFor="confidentialCheck" className="text-xs text-gray-700 font-medium">
                    Mark as Confidential (Restricted to HR Management & Compliance Officers)
                  </label>
                </div>
              )}

              {/* Footer Buttons */}
              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  Save & Secure Document
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {previewDoc && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/10 rounded-lg">
                  {getCategoryIcon(previewDoc.category)}
                </div>
                <div>
                  <h3 className="text-base font-semibold text-white">{previewDoc.name}</h3>
                  <p className="text-xs text-slate-300">
                    {previewDoc.fileName || previewDoc.name} · {formatFileSize(previewDoc.size)}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {previewDoc.fileData && (
                  <a
                    href={previewDoc.fileData}
                    download={previewDoc.fileName || `${previewDoc.name}.pdf`}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" /> Download
                  </a>
                )}
                <button
                  onClick={() => setPreviewDoc(null)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Viewer Body */}
            <div className="flex-1 overflow-y-auto p-6 bg-slate-100 flex items-center justify-center">
              {previewDoc.type.startsWith('image/') || previewDoc.category === 'photo' ? (
                <div className="max-w-2xl bg-white p-2 rounded-xl shadow-md border border-gray-200 overflow-hidden">
                  <img
                    src={previewDoc.fileData || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80'}
                    alt={previewDoc.name}
                    className="max-h-[60vh] w-auto mx-auto object-contain rounded-lg"
                  />
                </div>
              ) : (
                <div className="bg-white rounded-xl border border-gray-200 shadow-lg p-8 max-w-2xl w-full space-y-6">
                  <div className="flex items-center justify-between border-b pb-4">
                    <div className="flex items-center gap-3">
                      <div className="p-3 bg-blue-50 text-blue-600 rounded-lg">
                        <FileCheck className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-bold text-gray-900">{previewDoc.name}</h4>
                        <p className="text-xs text-gray-500">Document Type: {previewDoc.type}</p>
                      </div>
                    </div>
                    <span className="text-xs font-mono bg-gray-100 px-2.5 py-1 rounded">
                      ID: {previewDoc.id.slice(0, 8)}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-xs">
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-400 block mb-1">Category</span>
                      <span className="font-semibold text-gray-800">{getCategoryLabel(previewDoc.category)}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-400 block mb-1">Upload Date</span>
                      <span className="font-semibold text-gray-800">{new Date(previewDoc.uploadDate).toLocaleString()}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-400 block mb-1">Uploaded By</span>
                      <span className="font-semibold text-gray-800">{previewDoc.uploadedBy}</span>
                    </div>
                    <div className="bg-gray-50 p-3 rounded-lg">
                      <span className="text-gray-400 block mb-1">Verification Status</span>
                      <span className="font-semibold capitalize text-gray-800">{previewDoc.verificationStatus || 'Pending'}</span>
                    </div>
                  </div>

                  {previewDoc.verificationNotes && (
                    <div className="p-3 bg-blue-50/60 rounded-lg border border-blue-100 text-xs text-blue-900">
                      <span className="font-bold">Compliance Review Notes: </span>
                      {previewDoc.verificationNotes}
                    </div>
                  )}

                  <div className="text-center py-6 border-t border-dashed border-gray-200">
                    <p className="text-xs text-gray-500 mb-3">
                      High-fidelity document record stored in encrypted vault.
                    </p>
                    {previewDoc.fileData ? (
                      <a
                        href={previewDoc.fileData}
                        download={previewDoc.fileName || `${previewDoc.name}.pdf`}
                        className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
                      >
                        <Download className="w-4 h-4" /> Download Official File
                      </a>
                    ) : (
                      <span className="text-xs text-gray-400 italic">No direct file payload attached</span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Viewer Footer */}
            <div className="px-6 py-3 bg-white border-t border-gray-200 flex items-center justify-between text-xs text-gray-500">
              <span>Security Classification: {previewDoc.isConfidential ? 'Restricted Confidential' : 'Internal Use'}</span>
              <button
                onClick={() => setPreviewDoc(null)}
                className="px-4 py-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg font-medium text-gray-700"
              >
                Close Preview
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Verification Modal (Compliance / HR) */}
      {verifyModalDoc && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <h3 className="text-base font-semibold">Verify Compliance Document</h3>
              </div>
              <button onClick={() => setVerifyModalDoc(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 space-y-4">
              <div>
                <h4 className="text-sm font-bold text-gray-900">{verifyModalDoc.name}</h4>
                <p className="text-xs text-gray-500 mt-0.5">
                  Category: {getCategoryLabel(verifyModalDoc.category)}
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Verification Notes / Audit Log
                </label>
                <textarea
                  rows={3}
                  value={verificationNotes}
                  onChange={(e) => setVerificationNotes(e.target.value)}
                  placeholder="e.g. Verified against Home Affairs database / Stamped bank letter verified valid within 90 days..."
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setVerifyModalDoc(null)}
                  className="px-3 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifySubmit('rejected')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg inline-flex items-center gap-1"
                >
                  <XCircle className="w-3.5 h-3.5" /> Reject Document
                </button>
                <button
                  type="button"
                  onClick={() => handleVerifySubmit('verified')}
                  className="px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg inline-flex items-center gap-1"
                >
                  <CheckCircle className="w-3.5 h-3.5" /> Approve & Verify
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
