import React, { useState } from 'react';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Briefcase, 
  ShieldCheck, 
  FileText, 
  Upload, 
  FileSignature, 
  CheckCircle, 
  Clock, 
  Edit3, 
  Download, 
  X, 
  Building, 
  Lock, 
  Search,
  Plus,
  Send,
  LifeBuoy
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Document, HRCase } from '../../types';
import { LetterGeneratorModal } from './LetterGeneratorModal';

export const EmployeeSelfServicePortal: React.FC = () => {
  const { 
    employees, 
    documents, 
    workflowApprovals, 
    leaveTypes,
    leaveBalances,
    addLeaveRequest,
    addHRCase,
    addDocument, 
    signDocument, 
    submitProfileUpdateRequest,
    currentTenant 
  } = useData();
  const { user } = useAuth();

  // Find the logged-in employee record
  const currentEmpId = user?.employeeId || (user?.email === 'employee@verticalhrm.com' ? '1' : employees[0]?.id || '1');
  const employee = employees.find(e => e.id === currentEmpId || e.employeeId === currentEmpId) || employees[0];

  const [activeTab, setActiveTab] = useState<'profile' | 'sign_documents' | 'documents' | 'requests' | 'directory'>('profile');

  // Modals
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [showSignModal, setShowSignModal] = useState<Document | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showLetterModal, setShowLetterModal] = useState(false);
  const [directorySearch, setDirectorySearch] = useState('');

  // Update profile form state
  const [phone, setPhone] = useState(employee?.personalInfo.phone || '');
  const [street, setStreet] = useState(employee?.personalInfo.address.street || '');
  const [city, setCity] = useState(employee?.personalInfo.address.city || '');
  const [state, setState] = useState(employee?.personalInfo.address.state || '');
  const [zipCode, setZipCode] = useState(employee?.personalInfo.address.zipCode || '');
  const [emergencyName, setEmergencyName] = useState(employee?.personalInfo.emergencyContact.name || '');
  const [emergencyRel, setEmergencyRel] = useState(employee?.personalInfo.emergencyContact.relationship || '');
  const [emergencyPhone, setEmergencyPhone] = useState(employee?.personalInfo.emergencyContact.phone || '');
  
  // Banking update
  const [bankName, setBankName] = useState(employee?.bankInfo?.bankName || 'National Commercial Bank');
  const [accountNumber, setAccountNumber] = useState(employee?.bankInfo?.accountNumber || '•••• •••• 4492');
  const [routingNumber, setRoutingNumber] = useState(employee?.bankInfo?.routingNumber || '021000021');
  const [accountType, setAccountType] = useState<'checking' | 'savings'>(employee?.bankInfo?.accountType || 'checking');
  const [updateSuccessMsg, setUpdateSuccessMsg] = useState('');

  // Sign Document Modal State
  const [signerName, setSignerName] = useState(`${user?.firstName || employee.personalInfo.firstName} ${user?.lastName || employee.personalInfo.lastName}`);
  const [signAccepted, setSignAccepted] = useState(false);

  // Upload modal state
  const [uploadCategory, setUploadCategory] = useState<Document['category']>('qualification');
  const [uploadName, setUploadName] = useState('');
  const [uploadFile, setUploadFile] = useState<{ name: string; data: string; type: string; size: number } | null>(null);

  // Filtered documents for this employee
  const myDocs = documents.filter(d => d.employeeId === employee.id || d.employeeId === employee.employeeId || !d.employeeId);
  const signableDocs = myDocs.filter(d => d.requiresSignature);

  // Strict Row Level Security: An employee ONLY ever sees their own requests
  const myApprovals = workflowApprovals.filter(a => 
    a.requesterId === employee.employeeId || 
    (a.requesterName.trim().toLowerCase() === `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`.trim().toLowerCase())
  );

  // Multi-option request modal state
  const [showNewRequestModal, setShowNewRequestModal] = useState(false);
  const [requestKind, setRequestKind] = useState<'leave' | 'profile' | 'case'>('leave');

  // Leave Form State
  const [leaveTypeId, setLeaveTypeId] = useState(leaveTypes[0]?.id || '1');
  const [leaveStartDate, setLeaveStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [leaveEndDate, setLeaveEndDate] = useState(new Date(Date.now() + 86400000 * 3).toISOString().split('T')[0]);
  const [leaveReason, setLeaveReason] = useState('');

  // HR Case Form State
  const [caseCategory, setCaseCategory] = useState<HRCase['category']>('payroll');
  const [caseSubject, setCaseSubject] = useState('');
  const [casePriority, setCasePriority] = useState<HRCase['priority']>('medium');
  const [caseDescription, setCaseDescription] = useState('');

  const selectedBalance = leaveBalances.find(b => (b.employeeId === employee.id || b.employeeId === employee.employeeId) && b.leaveTypeId === leaveTypeId);

  const handleLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const days = Math.max(1, Math.ceil((new Date(leaveEndDate).getTime() - new Date(leaveStartDate).getTime()) / (1000 * 3600 * 24)) + 1);
    addLeaveRequest({
      employeeId: employee.id,
      leaveTypeId: leaveTypeId || (leaveTypes[0]?.id ?? '1'),
      startDate: leaveStartDate,
      endDate: leaveEndDate,
      days,
      reason: leaveReason || 'Personal leave request',
      status: 'pending'
    });
    setUpdateSuccessMsg(`Leave application for ${days} days submitted for supervisor approval.`);
    setShowNewRequestModal(false);
    setLeaveReason('');
    setTimeout(() => setUpdateSuccessMsg(''), 5000);
  };

  const handleCaseSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    addHRCase({
      employeeId: employee.employeeId,
      employeeName: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
      department: employee.jobInfo.department,
      subject: caseSubject,
      category: caseCategory,
      priority: casePriority,
      status: 'new',
      description: caseDescription,
      slaDueAt: new Date(Date.now() + 48 * 3600 * 1000).toISOString(),
      assignedTo: 'HR Support'
    });
    setUpdateSuccessMsg('Official HR inquiry submitted to Helpdesk. Tracking ticket generated.');
    setShowNewRequestModal(false);
    setCaseSubject('');
    setCaseDescription('');
    setTimeout(() => setUpdateSuccessMsg(''), 5000);
  };

  const handleUpdateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const hasBankingChange = bankName !== employee?.bankInfo?.bankName || accountNumber !== employee?.bankInfo?.accountNumber;
    
    submitProfileUpdateRequest(
      employee.id,
      {
        phone,
        address: {
          street,
          city,
          state,
          zipCode,
          country: employee.personalInfo.address.country
        },
        emergencyContact: {
          name: emergencyName,
          relationship: emergencyRel,
          phone: emergencyPhone
        },
        bankInfo: hasBankingChange ? {
          bankName,
          accountNumber,
          routingNumber,
          accountType,
          isVerified: false
        } : employee.bankInfo
      },
      hasBankingChange // requires approval if banking info changed
    );

    setUpdateSuccessMsg(
      hasBankingChange 
        ? 'Contact details updated. Banking changes submitted to HR for statutory FICA review.' 
        : 'Your personal information has been updated successfully.'
    );
    setShowUpdateModal(false);
    setTimeout(() => setUpdateSuccessMsg(''), 5000);
  };

  const handleSignSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!showSignModal || !signAccepted) return;

    signDocument(showSignModal.id, signerName);
    setShowSignModal(null);
    setSignAccepted(false);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleUploadSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile) return;

    addDocument({
      name: uploadName || uploadFile.name,
      fileName: uploadFile.name,
      type: uploadFile.type,
      size: uploadFile.size,
      category: uploadCategory,
      employeeId: employee.id,
      uploadedBy: `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`,
      isConfidential: uploadCategory === 'identity' || uploadCategory === 'photo',
      accessLevel: 'employee_and_hr',
      fileData: uploadFile.data,
      verificationStatus: 'pending'
    });

    setShowUploadModal(false);
    setUploadName('');
    setUploadFile(null);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Employee Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-indigo-900 rounded-2xl p-6 text-white shadow-md flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="flex items-center space-x-5">
          <div className="w-16 h-16 rounded-2xl bg-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-lg border-2 border-white/20">
            {employee.personalInfo.firstName[0]}{employee.personalInfo.lastName[0]}
          </div>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold text-white">
                {employee.personalInfo.firstName} {employee.personalInfo.lastName}
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                {employee.jobInfo.employmentStatus}
              </span>
            </div>
            <p className="text-sm text-slate-300 mt-1">
              {employee.jobInfo.jobTitle} · {employee.jobInfo.department} · Staff ID: <span className="font-mono text-white">{employee.employeeId}</span>
            </p>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400 mt-2">
              <span className="flex items-center">
                <Building className="w-3.5 h-3.5 mr-1" />
                {employee.jobInfo.workLocation}
              </span>
              <span>·</span>
              <span>Reporting Manager: {employee.jobInfo.reportingManager}</span>
              <span>·</span>
              <span>Entity: {currentTenant.name}</span>
            </div>
          </div>
        </div>

        {/* Quick action triggers */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowUpdateModal(true)}
            className="px-4 py-2 bg-white text-slate-900 rounded-xl text-xs font-bold hover:bg-slate-100 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <Edit3 className="w-3.5 h-3.5 text-blue-600" />
            Update Information
          </button>
          <button
            onClick={() => setShowLetterModal(true)}
            className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <FileSignature className="w-3.5 h-3.5" />
            Request Official Letter
          </button>
        </div>
      </div>

      {/* Success Notification */}
      {updateSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-emerald-800 text-sm shadow-xs">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0" />
            <span>{updateSuccessMsg}</span>
          </div>
          <button onClick={() => setUpdateSuccessMsg('')} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white rounded-xl border border-gray-200 p-1.5 shadow-xs flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center space-x-1 sm:space-x-2 overflow-x-auto">
          {[
            { id: 'profile', label: 'My Personal Profile', icon: <User className="w-4 h-4" /> },
            { id: 'sign_documents', label: `Review & Sign Documents (${signableDocs.length})`, icon: <FileSignature className="w-4 h-4" /> },
            { id: 'documents', label: `My Qualifications & Vault (${myDocs.length})`, icon: <FileText className="w-4 h-4" /> },
            { id: 'requests', label: `My Requests & Status (${myApprovals.length})`, icon: <Clock className="w-4 h-4" /> },
            { id: 'directory', label: 'Colleague Directory', icon: <Building className="w-4 h-4" /> },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-semibold transition-all whitespace-nowrap ${
                activeTab === tab.id
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* TAB 1: MY PERSONAL PROFILE */}
      {activeTab === 'profile' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Contact Details & Address */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <User className="w-4 h-4 text-blue-600" />
                  Personal & Contact Details
                </h3>
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Edit Contact Info
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg">
                  <span className="text-gray-500 block mb-1">Corporate Email</span>
                  <div className="flex items-center text-gray-900 font-semibold">
                    <Mail className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {employee.personalInfo.email}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg">
                  <span className="text-gray-500 block mb-1">Primary Phone</span>
                  <div className="flex items-center text-gray-900 font-semibold">
                    <Phone className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {employee.personalInfo.phone}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg">
                  <span className="text-gray-500 block mb-1">Date of Birth</span>
                  <div className="flex items-center text-gray-900 font-semibold">
                    <Calendar className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {new Date(employee.personalInfo.dateOfBirth).toLocaleDateString()}
                  </div>
                </div>

                <div className="p-3.5 bg-slate-50 rounded-lg">
                  <span className="text-gray-500 block mb-1">Residential Address</span>
                  <div className="flex items-center text-gray-900 font-semibold">
                    <MapPin className="w-3.5 h-3.5 mr-1.5 text-gray-400" />
                    {employee.personalInfo.address.street}, {employee.personalInfo.address.city}, {employee.personalInfo.address.state} {employee.personalInfo.address.zipCode}
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Primary Emergency Contact
                </h3>
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Update Contact
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg">
                  <span className="text-gray-500 block mb-1">Contact Name</span>
                  <span className="text-gray-900 font-bold">{employee.personalInfo.emergencyContact.name}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg">
                  <span className="text-gray-500 block mb-1">Relationship</span>
                  <span className="text-gray-900 font-semibold">{employee.personalInfo.emergencyContact.relationship}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg">
                  <span className="text-gray-500 block mb-1">Emergency Phone</span>
                  <span className="text-gray-900 font-semibold flex items-center">
                    <Phone className="w-3.5 h-3.5 mr-1 text-gray-400" />
                    {employee.personalInfo.emergencyContact.phone}
                  </span>
                </div>
              </div>
            </div>

            {/* Banking Details (Sensitive & Row-Level Secured) */}
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
              <div className="flex items-center justify-between border-b border-gray-100 pb-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                    <Lock className="w-4 h-4 text-amber-600" />
                    Direct Deposit & Payroll Banking (FICA Compliant)
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">
                    Modifications to banking accounts require HR verification and official bank confirmation upload.
                  </p>
                </div>
                <button
                  onClick={() => setShowUpdateModal(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  Request Change
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                <div className="p-3.5 bg-slate-50 rounded-lg">
                  <span className="text-gray-500 block mb-1">Bank Institution</span>
                  <span className="text-gray-900 font-bold">{employee.bankInfo?.bankName || 'National Commercial Bank'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg">
                  <span className="text-gray-500 block mb-1">Account Number</span>
                  <span className="text-gray-900 font-mono font-bold">{employee.bankInfo?.accountNumber || '•••• •••• 4492'}</span>
                </div>
                <div className="p-3.5 bg-slate-50 rounded-lg">
                  <span className="text-gray-500 block mb-1">Status</span>
                  <span className="text-emerald-700 font-semibold flex items-center">
                    <ShieldCheck className="w-3.5 h-3.5 mr-1" />
                    FICA Verified
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Job Overview & Quick Summary */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl border border-gray-200 p-6 shadow-xs space-y-4">
              <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-600" />
                Employment Summary
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Department:</span>
                  <span className="font-bold text-gray-900">{employee.jobInfo.department}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Job Title:</span>
                  <span className="font-bold text-gray-900">{employee.jobInfo.jobTitle}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Employment Type:</span>
                  <span className="font-semibold text-gray-900 capitalize">{employee.jobInfo.employmentType.replace('_', ' ')}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Hire Date:</span>
                  <span className="font-semibold text-gray-900">{new Date(employee.jobInfo.hireDate).toLocaleDateString()}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-gray-100">
                  <span className="text-gray-500">Reporting Manager:</span>
                  <span className="font-semibold text-gray-900">{employee.jobInfo.reportingManager}</span>
                </div>
                <div className="flex justify-between py-2">
                  <span className="text-gray-500">Work Location:</span>
                  <span className="font-semibold text-gray-900">{employee.jobInfo.workLocation}</span>
                </div>
              </div>
            </div>

            {/* Quick Action Card: Official Letter Request */}
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 border border-blue-200 rounded-xl p-5 shadow-xs space-y-3">
              <div className="flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-indigo-600" />
                <h4 className="text-sm font-bold text-indigo-950">Official Letters on Demand</h4>
              </div>
              <p className="text-xs text-indigo-800 leading-relaxed">
                Generate an official employment verification, salary confirmation, or visa support letter directly on corporate letterhead.
              </p>
              <button
                onClick={() => setShowLetterModal(true)}
                className="w-full py-2 bg-indigo-600 text-white rounded-lg text-xs font-semibold hover:bg-indigo-700 shadow-xs flex items-center justify-center gap-1.5"
              >
                <FileSignature className="w-3.5 h-3.5" />
                Generate Official Letter
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: REVIEW & SIGN DOCUMENTS */}
      {activeTab === 'sign_documents' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">Documents Requiring Review & Signature</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Statutory regulatory declarations, company policy acknowledgments, and annual agreements requiring your electronic signature.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {signableDocs.map((doc) => {
              const isSigned = doc.signature?.signed;
              return (
                <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-4 flex flex-col justify-between">
                  <div className="space-y-2">
                    <div className="flex items-start justify-between gap-3">
                      <h4 className="text-sm font-bold text-gray-900">{doc.name}</h4>
                      {isSigned ? (
                        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full flex items-center border border-emerald-200">
                          <CheckCircle className="w-3.5 h-3.5 mr-1" />
                          Signed
                        </span>
                      ) : (
                        <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-full flex items-center border border-amber-200">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          Signature Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-600">
                      File: {doc.fileName || 'Statutory_Document.pdf'} · Uploaded: {new Date(doc.uploadDate).toLocaleDateString()}
                    </p>
                    {isSigned && (
                      <div className="p-2.5 bg-emerald-50/50 rounded-lg border border-emerald-100 text-xs text-emerald-800 space-y-0.5">
                        <div>Signed By: <strong className="font-semibold">{doc.signature?.signedByName}</strong></div>
                        <div className="text-gray-500">Timestamp: {new Date(doc.signature!.signedAt).toLocaleString()}</div>
                      </div>
                    )}
                  </div>

                  <div className="pt-3 border-t border-gray-100 flex items-center justify-between">
                    <span className="text-xs text-gray-400 capitalize">{doc.category.replace('_', ' ')}</span>
                    <button
                      onClick={() => setShowSignModal(doc)}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                        isSigned
                          ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                          : 'bg-blue-600 text-white hover:bg-blue-700 shadow-xs'
                      }`}
                    >
                      <FileSignature className="w-3.5 h-3.5" />
                      {isSigned ? 'View Signed Document' : 'Review & Sign'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: MY QUALIFICATIONS & VAULT */}
      {activeTab === 'documents' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">My Document & Qualification Vault</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Upload degrees, certifications, national identification, and professional credentials.
              </p>
            </div>
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
            >
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Upload New Document / Photo
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {myDocs.map((doc) => (
              <div key={doc.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3 flex flex-col justify-between">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <span className="text-xs px-2 py-0.5 rounded font-semibold bg-slate-100 text-slate-700 uppercase">
                      {doc.category.replace('_', ' ')}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                      doc.verificationStatus === 'verified' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                    }`}>
                      {doc.verificationStatus}
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-gray-900 line-clamp-2">{doc.name}</h4>
                  <p className="text-xs text-gray-500">{doc.fileName} · {(doc.size / 1024 / 1024).toFixed(1)} MB</p>
                  {doc.verificationNotes && (
                    <p className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded">
                      Note: {doc.verificationNotes}
                    </p>
                  )}
                </div>

                <div className="pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                  <span>Uploaded {new Date(doc.uploadDate).toLocaleDateString()}</span>
                  <a
                    href={doc.fileData || '#'}
                    download={doc.fileName || 'document.pdf'}
                    className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                    title="Download document"
                  >
                    <Download className="w-4 h-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: MY REQUESTS & STATUS */}
      {activeTab === 'requests' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-gray-900">My Submitted Requests & Approval Tracking</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Track the multi-tier review status of your profile change requests, leave requests, and official inquiries.
              </p>
            </div>
            <button
              onClick={() => setShowNewRequestModal(true)}
              className="px-3.5 py-1.5 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs flex items-center gap-1.5"
            >
              <Plus className="w-3.5 h-3.5" />
              Make a New Request
            </button>
          </div>

          <div className="bg-white rounded-xl border border-gray-200 overflow-hidden divide-y divide-gray-200 shadow-xs">
            {myApprovals.map((req) => {
              const auditSteps = req.history || req.auditTrail || [];
              const assignedTarget = req.assignedTo || req.currentApproverRole?.replace('_', ' ') || 'Manager / HR';
              const reqDetails = req.details as Record<string, string | number | undefined> | undefined;
              return (
                <div key={req.id} className="p-5 hover:bg-slate-50/60 transition-colors">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-0.5 rounded font-bold uppercase bg-blue-50 text-blue-700 border border-blue-200">
                          {req.type.replace('_', ' ')}
                        </span>
                        <h4 className="text-sm font-bold text-gray-900">{req.title}</h4>
                        <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold ${
                          req.status === 'approved' ? 'bg-emerald-100 text-emerald-800' :
                          req.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-amber-100 text-amber-800'
                        }`}>
                          {req.status.toUpperCase()}
                        </span>
                      </div>
                      <p className="text-xs text-gray-500">
                        Submitted on {new Date(req.submittedAt).toLocaleString()} · Assigned to: <strong className="text-gray-800">{assignedTarget}</strong>
                      </p>
                    </div>

                    <div className="text-xs font-semibold text-slate-700 bg-slate-100 px-3 py-1 rounded-lg">
                      Step {req.currentStep} of {req.totalSteps}
                    </div>
                  </div>

                  {/* Details summary */}
                  {reqDetails && Object.keys(reqDetails).length > 0 && (
                    <div className="mt-2.5 p-2.5 bg-slate-50 rounded-lg text-xs text-slate-600 flex flex-wrap gap-x-4 gap-y-1">
                      {reqDetails.startDate && (
                        <span>Period: <strong className="text-slate-800">{String(reqDetails.startDate)} to {String(reqDetails.endDate)}</strong></span>
                      )}
                      {reqDetails.days && (
                        <span>Duration: <strong className="text-slate-800">{String(reqDetails.days)} Days</strong></span>
                      )}
                      {reqDetails.reason && (
                        <span>Reason: <em>"{String(reqDetails.reason)}"</em></span>
                      )}
                      {reqDetails.newBankName && (
                        <span>New Bank: <strong className="text-slate-800">{String(reqDetails.newBankName)}</strong></span>
                      )}
                    </div>
                  )}

                  {auditSteps.length > 0 && (
                    <div className="mt-3 pt-3 border-t border-gray-100 space-y-1 text-xs text-gray-600">
                      <span className="font-semibold text-gray-700">Approval & Audit Trail:</span>
                      {auditSteps.map((h: { step?: number; approverName?: string; actor?: string; action: string; comments?: string; timestamp: string }, i: number) => {
                        const stepActor = 'actor' in h ? h.actor : 'approverName' in h ? h.approverName : 'Reviewer';
                        return (
                          <div key={i} className="flex items-center gap-2 text-gray-500">
                            <span>• {new Date(h.timestamp).toLocaleDateString()}:</span>
                            <strong className="text-gray-800">{stepActor}</strong>
                            <span className="uppercase text-2xs font-bold px-1.5 py-0.5 rounded bg-gray-100">{h.action}</span>
                            {h.comments && <span>- "{h.comments}"</span>}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}

            {myApprovals.length === 0 && (
              <div className="p-12 text-center text-gray-500 text-xs">
                You have not submitted any active requests yet.
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 5: COLLEAGUE DIRECTORY (Row Level Secured) */}
      {activeTab === 'directory' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-gray-900">Organization Colleague Directory</h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Search work contact details across all departments. (Sensitive personal data & compensation are redacted under row-level security).
              </p>
            </div>
            <div className="relative w-full sm:w-72">
              <Search className="w-4 h-4 text-gray-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Search colleagues by name, role, dept..."
                value={directorySearch}
                onChange={(e) => setDirectorySearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {employees
              .filter(emp => 
                emp.personalInfo.firstName.toLowerCase().includes(directorySearch.toLowerCase()) ||
                emp.personalInfo.lastName.toLowerCase().includes(directorySearch.toLowerCase()) ||
                emp.jobInfo.department.toLowerCase().includes(directorySearch.toLowerCase()) ||
                emp.jobInfo.jobTitle.toLowerCase().includes(directorySearch.toLowerCase())
              )
              .map(colleague => (
                <div key={colleague.id} className="bg-white rounded-xl border border-gray-200 p-5 shadow-xs space-y-3">
                  <div className="flex items-center space-x-3">
                    <div className="w-12 h-12 rounded-full bg-slate-800 text-white font-bold flex items-center justify-center text-sm">
                      {colleague.personalInfo.firstName[0]}{colleague.personalInfo.lastName[0]}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-gray-900">
                        {colleague.personalInfo.firstName} {colleague.personalInfo.lastName}
                      </h4>
                      <p className="text-xs text-gray-500">{colleague.jobInfo.jobTitle}</p>
                      <span className="text-xs text-blue-600 font-medium">{colleague.jobInfo.department}</span>
                    </div>
                  </div>

                  <div className="pt-3 border-t border-gray-100 space-y-1.5 text-xs text-gray-600">
                    <div className="flex items-center">
                      <Mail className="w-3.5 h-3.5 mr-2 text-gray-400" />
                      <a href={`mailto:${colleague.personalInfo.email}`} className="text-blue-600 hover:underline">
                        {colleague.personalInfo.email}
                      </a>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-2 text-gray-400" />
                      <span>{colleague.jobInfo.workLocation}</span>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      )}

      {/* MODAL 1: UPDATE PERSONAL INFORMATION */}
      {showUpdateModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-lg font-bold">Update My Information</h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Update contact details or submit banking changes for statutory HR review
                </p>
              </div>
              <button onClick={() => setShowUpdateModal(false)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleUpdateSubmit} className="p-6 overflow-y-auto flex-1 space-y-5 text-xs">
              <div className="space-y-3">
                <h4 className="font-bold text-gray-900 text-sm">Contact Information</h4>
                <div>
                  <label className="block font-medium text-gray-700 mb-1">Primary Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm">Residential Address</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <label className="block font-medium text-gray-700 mb-1">Street Address</label>
                    <input
                      type="text"
                      value={street}
                      onChange={(e) => setStreet(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">City</label>
                    <input
                      type="text"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">State / Province / Parish</label>
                    <input
                      type="text"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">ZIP / Postal Code</label>
                    <input
                      type="text"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <h4 className="font-bold text-gray-900 text-sm">Emergency Contact</h4>
                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Contact Name</label>
                    <input
                      type="text"
                      value={emergencyName}
                      onChange={(e) => setEmergencyName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Relationship</label>
                    <input
                      type="text"
                      value={emergencyRel}
                      onChange={(e) => setEmergencyRel(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Contact Phone</label>
                    <input
                      type="text"
                      value={emergencyPhone}
                      onChange={(e) => setEmergencyPhone(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-3 pt-3 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <h4 className="font-bold text-gray-900 text-sm">Direct Deposit Bank Information</h4>
                  <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                    Requires HR Approval
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Banking Institution</label>
                    <input
                      type="text"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Account Number</label>
                    <input
                      type="text"
                      value={accountNumber}
                      onChange={(e) => setAccountNumber(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Routing Number</label>
                    <input
                      type="text"
                      value={routingNumber}
                      onChange={(e) => setRoutingNumber(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-mono"
                      required
                    />
                  </div>
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Account Type</label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as 'checking' | 'savings')}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                    >
                      <option value="checking">Checking</option>
                      <option value="savings">Savings</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setShowUpdateModal(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 shadow-xs"
                >
                  Save & Submit Updates
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: REVIEW & SIGN DOCUMENT */}
      {showSignModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-blue-400">Electronic Document Signing</span>
                <h3 className="text-lg font-bold text-white mt-0.5">{showSignModal.name}</h3>
              </div>
              <button onClick={() => setShowSignModal(null)} className="text-slate-400 hover:text-white">
                ✕
              </button>
            </div>

            <form onSubmit={handleSignSubmit} className="p-6 overflow-y-auto flex-1 space-y-4 text-xs">
              <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-3 leading-relaxed text-gray-700 max-h-64 overflow-y-auto">
                <h4 className="font-bold text-gray-900 text-sm">Policy Terms & Declarations</h4>
                <p>
                  As an employee of {currentTenant.name}, you are required to adhere to all corporate governance, anti-bribery, information confidentiality, and statutory FICA regulations.
                </p>
                <p>
                  By affixing your digital signature below, you confirm that you have read, understood, and agree to abide by all stipulations outlined in this official document. Failure to comply with these governance standards may result in formal disciplinary action under labor regulations.
                </p>
                <div className="p-3 bg-white border border-slate-200 rounded text-gray-600 text-xs">
                  Document ID: <span className="font-mono">{showSignModal.id}</span> · Category: <span className="capitalize">{showSignModal.category}</span> · Status: {showSignModal.verificationStatus}
                </div>
              </div>

              {showSignModal.signature?.signed ? (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1 text-emerald-900">
                  <div className="flex items-center gap-2 font-bold text-sm">
                    <CheckCircle className="w-4 h-4 text-emerald-600" />
                    Document Already Signed
                  </div>
                  <p>Signed by: <strong>{showSignModal.signature.signedByName}</strong></p>
                  <p className="text-emerald-700">Date: {new Date(showSignModal.signature.signedAt).toLocaleString()}</p>
                </div>
              ) : (
                <div className="space-y-4 pt-2">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">
                      Signatory Legal Name
                    </label>
                    <input
                      type="text"
                      value={signerName}
                      onChange={(e) => setSignerName(e.target.value)}
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs font-semibold"
                      required
                    />
                  </div>

                  <label className="flex items-start gap-2.5 cursor-pointer p-3 bg-blue-50/50 border border-blue-200 rounded-xl">
                    <input
                      type="checkbox"
                      checked={signAccepted}
                      onChange={(e) => setSignAccepted(e.target.checked)}
                      className="mt-0.5 rounded text-blue-600 focus:ring-blue-500"
                      required
                    />
                    <span className="text-gray-800 font-medium">
                      I legally acknowledge and affix my electronic signature to this policy document as of {new Date().toLocaleDateString()}.
                    </span>
                  </label>
                </div>
              )}

              <div className="p-4 bg-gray-50 border-t border-gray-200 flex justify-end gap-2 -mx-6 -mb-6">
                <button
                  type="button"
                  onClick={() => setShowSignModal(null)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold hover:bg-gray-100"
                >
                  Close
                </button>
                {!showSignModal.signature?.signed && (
                  <button
                    type="submit"
                    disabled={!signAccepted}
                    className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-semibold hover:bg-emerald-700 disabled:opacity-50 shadow-xs flex items-center gap-1.5"
                  >
                    <CheckCircle className="w-3.5 h-3.5" />
                    Affix Signature & Submit
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: UPLOAD DOCUMENT */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-gray-900">Upload Qualification / Photo</h3>
              <button onClick={() => setShowUploadModal(false)} className="text-gray-400 hover:text-gray-600">
                ✕
              </button>
            </div>

            <form onSubmit={handleUploadSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-medium text-gray-700 mb-1">Document Category</label>
                <select
                  value={uploadCategory}
                  onChange={(e) => setUploadCategory(e.target.value as Document['category'])}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                >
                  <option value="qualification">Degree / Diploma / Academic Qualification</option>
                  <option value="certification">Professional Certification</option>
                  <option value="photo">Official Profile Photo</option>
                  <option value="identity">National Identification / Passport</option>
                  <option value="fica_proof_of_address">FICA Proof of Address</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Document Title</label>
                <input
                  type="text"
                  placeholder="e.g. Master of Science Degree Certificate"
                  value={uploadName}
                  onChange={(e) => setUploadName(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div>
                <label className="block font-medium text-gray-700 mb-1">Choose File (PDF or Image)</label>
                <input
                  type="file"
                  accept="application/pdf,image/*"
                  onChange={handleFileUpload}
                  className="w-full p-2 border border-dashed border-gray-300 rounded-lg text-xs"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowUploadModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFile}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 disabled:opacity-50"
                >
                  Upload File
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: MAKE A NEW REQUEST (LEAVE, PROFILE / BANKING, HR INQUIRY) */}
      {showNewRequestModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <span className="text-xs uppercase font-bold text-blue-400">Employee Self-Service Submission</span>
                <h3 className="text-lg font-bold text-white mt-0.5">Submit Official Request</h3>
              </div>
              <button onClick={() => setShowNewRequestModal(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Request Type Selector */}
            <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setRequestKind('leave')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  requestKind === 'leave'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <Calendar className="w-3.5 h-3.5" />
                Apply for Leave
              </button>
              <button
                type="button"
                onClick={() => setRequestKind('profile')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  requestKind === 'profile'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <User className="w-3.5 h-3.5" />
                Contact / Bank Update
              </button>
              <button
                type="button"
                onClick={() => setRequestKind('case')}
                className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold border-b-2 transition-colors ${
                  requestKind === 'case'
                    ? 'border-blue-600 text-blue-600 bg-white'
                    : 'border-transparent text-gray-500 hover:text-gray-800'
                }`}
              >
                <LifeBuoy className="w-3.5 h-3.5" />
                HR Inquiry / Helpdesk
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 text-xs">
              {/* KIND 1: LEAVE APPLICATION */}
              {requestKind === 'leave' && (
                <form onSubmit={handleLeaveSubmit} className="space-y-4">
                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Leave Type *</label>
                    <select
                      value={leaveTypeId}
                      onChange={(e) => setLeaveTypeId(e.target.value)}
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-xs bg-white"
                      required
                    >
                      {leaveTypes.map((lt) => (
                        <option key={lt.id} value={lt.id}>
                          {lt.name} (Max {lt.daysAllowed} Days/yr)
                        </option>
                      ))}
                    </select>
                  </div>

                  {selectedBalance && (
                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-between text-xs text-blue-900">
                      <span>Available Balance:</span>
                      <strong className="font-bold text-sm text-blue-700">{selectedBalance.available} Days</strong>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Start Date *</label>
                      <input
                        type="date"
                        value={leaveStartDate}
                        onChange={(e) => setLeaveStartDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                        required
                      />
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">End Date *</label>
                      <input
                        type="date"
                        value={leaveEndDate}
                        onChange={(e) => setLeaveEndDate(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                        required
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Reason & Coverage Notes *</label>
                    <textarea
                      rows={3}
                      value={leaveReason}
                      onChange={(e) => setLeaveReason(e.target.value)}
                      placeholder="Specify the reason for leave and handoff notes for your team..."
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowNewRequestModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Submit Leave Request
                    </button>
                  </div>
                </form>
              )}

              {/* KIND 2: CONTACT / BANKING UPDATE */}
              {requestKind === 'profile' && (
                <div className="space-y-4">
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-900 leading-relaxed">
                    Personal contact changes take effect immediately. Direct deposit and bank account revisions are submitted for statutory HR compliance and FICA verification.
                  </div>
                  <div className="flex justify-center pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowNewRequestModal(false);
                        setShowUpdateModal(true);
                      }}
                      className="px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-2 shadow-xs"
                    >
                      <Edit3 className="w-4 h-4" />
                      Open Profile & Direct Deposit Editor
                    </button>
                  </div>
                </div>
              )}

              {/* KIND 3: HR CASE / INQUIRY */}
              {requestKind === 'case' && (
                <form onSubmit={handleCaseSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Category *</label>
                      <select
                        value={caseCategory}
                        onChange={(e) => setCaseCategory(e.target.value as HRCase['category'])}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                        required
                      >
                        <option value="payroll">Payroll & Tax Reconciliation</option>
                        <option value="benefits">Benefits & Health Insurance</option>
                        <option value="workplace">Workplace Accommodation</option>
                        <option value="general">General Policy Inquiry</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-medium text-gray-700 mb-1">Priority</label>
                      <select
                        value={casePriority}
                        onChange={(e) => setCasePriority(e.target.value as HRCase['priority'])}
                        className="w-full p-2 border border-gray-300 rounded-lg text-xs bg-white"
                      >
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Subject *</label>
                    <input
                      type="text"
                      value={caseSubject}
                      onChange={(e) => setCaseSubject(e.target.value)}
                      placeholder="e.g. Clarification regarding retroactive salary adjustment"
                      className="w-full p-2 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div>
                    <label className="block font-medium text-gray-700 mb-1">Detailed Description *</label>
                    <textarea
                      rows={4}
                      value={caseDescription}
                      onChange={(e) => setCaseDescription(e.target.value)}
                      placeholder="Please provide full details so HR operations can address your inquiry promptly..."
                      className="w-full p-2.5 border border-gray-300 rounded-lg text-xs"
                      required
                    />
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => setShowNewRequestModal(false)}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-xs font-semibold"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-xs"
                    >
                      <LifeBuoy className="w-3.5 h-3.5" />
                      Submit HR Inquiry
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 5: LETTER GENERATOR */}
      {showLetterModal && (
        <LetterGeneratorModal
          initialEmployeeId={employee.id}
          onClose={() => setShowLetterModal(false)}
        />
      )}
    </div>
  );
};
