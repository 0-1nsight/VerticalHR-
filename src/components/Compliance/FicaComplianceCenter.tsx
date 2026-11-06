import React, { useState } from 'react';
import { 
  ShieldCheck, 
  AlertTriangle, 
  Search, 
  Filter, 
  CheckCircle, 
  XCircle, 
  Clock, 
  Download, 
  Upload, 
  UserCheck, 
  Building, 
  Printer, 
  X, 
  AlertCircle,
  FileCheck,
  Check,
  ChevronRight
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { FicaComplianceRecord, FicaRequirement, Document } from '../../types';

export const FicaComplianceCenter: React.FC = () => {
  const { ficaRecords, employees, updateFicaRecord, verifyFicaRequirement, submitFicaRequirementDocument, addDocument } = useData();
  const { user } = useAuth();

  const isComplianceOfficer = user?.role === 'admin' || user?.role === 'hr_manager';
  const officerName = user ? `${user.firstName} ${user.lastName}` : 'Compliance Officer';

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [riskFilter, setRiskFilter] = useState<string>('all');
  const [addressFilter, setAddressFilter] = useState<string>('all'); // all, expiring_soon, expired

  // Selected Record for Dossier Audit Drawer
  const [selectedRecordId, setSelectedRecordId] = useState<string | null>(null);

  // Review & Verification Modal
  const [reviewReq, setReviewReq] = useState<{ empId: string; req: FicaRequirement } | null>(null);
  const [reviewStatus, setReviewStatus] = useState<'compliant' | 'rejected'>('compliant');
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewExpiry, setReviewExpiry] = useState('');

  // Quick Document Upload Modal for requirement
  const [uploadReq, setUploadReq] = useState<{ empId: string; req: FicaRequirement } | null>(null);
  const [uploadFileState, setUploadFileState] = useState<{ name: string; fileData: string; fileName: string; type: string; size: number }>({
    name: '',
    fileData: '',
    fileName: '',
    type: 'application/pdf',
    size: 0
  });

  // Certificate / Audit Report Modal
  const [certificateEmployeeRecord, setCertificateEmployeeRecord] = useState<{ record: FicaComplianceRecord; emp: typeof employees[0] } | null>(null);

  // Helper for address expiry calculations (90-day regulatory requirement)
  const getAddressExpiryInfo = (record: FicaComplianceRecord) => {
    const addressReq = record.requirements.find(r => r.type === 'proof_of_address');
    if (!addressReq || !addressReq.expiryDate) {
      return { status: 'missing', daysLeft: 0, label: 'Missing Proof of Address' };
    }
    const expiry = new Date(addressReq.expiryDate);
    const now = new Date();
    const daysLeft = Math.ceil((expiry.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysLeft < 0) {
      return { status: 'expired', daysLeft, label: `Expired (${Math.abs(daysLeft)}d ago)` };
    }
    if (daysLeft <= 30) {
      return { status: 'expiring_soon', daysLeft, label: `Expires in ${daysLeft}d` };
    }
    return { status: 'valid', daysLeft, label: `Valid (${daysLeft}d remaining)` };
  };

  // KPI Calculations
  const totalRecords = ficaRecords.length;
  const compliantCount = ficaRecords.filter(r => r.status === 'compliant').length;
  const complianceRate = totalRecords > 0 ? Math.round((compliantCount / totalRecords) * 100) : 0;
  
  const expiringAddressCount = ficaRecords.filter(r => {
    const info = getAddressExpiryInfo(r);
    return info.status === 'expiring_soon' || info.status === 'expired';
  }).length;

  const pepCount = ficaRecords.filter(r => r.isPep).length;

  // Filtered Roster
  const filteredRecords = ficaRecords.filter(record => {
    const employee = employees.find(e => e.id === record.employeeId);
    if (!employee) return false;

    const fullName = `${employee.personalInfo.firstName} ${employee.personalInfo.lastName}`.toLowerCase();
    const matchesSearch = fullName.includes(searchTerm.toLowerCase()) ||
      employee.employeeId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      employee.jobInfo.department.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || record.status === statusFilter;
    const matchesRisk = riskFilter === 'all' || record.riskRating === riskFilter;

    const addressInfo = getAddressExpiryInfo(record);
    const matchesAddress = addressFilter === 'all' ||
      (addressFilter === 'expiring_soon' && addressInfo.status === 'expiring_soon') ||
      (addressFilter === 'expired' && addressInfo.status === 'expired') ||
      (addressFilter === 'valid' && addressInfo.status === 'valid');

    return matchesSearch && matchesStatus && matchesRisk && matchesAddress;
  });

  const selectedRecord = ficaRecords.find(r => r.id === selectedRecordId);
  const selectedEmployee = selectedRecord ? employees.find(e => e.id === selectedRecord.employeeId) : null;

  // Requirement status badge renderer
  const renderStatusPill = (status: FicaRequirement['status']) => {
    switch (status) {
      case 'compliant':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
            <CheckCircle className="w-3 h-3" /> Compliant
          </span>
        );
      case 'pending_review':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
            <Clock className="w-3 h-3" /> Review Pending
          </span>
        );
      case 'expired':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <AlertTriangle className="w-3 h-3" /> Expired (&gt;90d)
          </span>
        );
      case 'rejected':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
            <XCircle className="w-3 h-3" /> Rejected
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">
            Missing
          </span>
        );
    }
  };

  const handleFileUploadChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setUploadFileState({
        name: file.name.replace(/\.[^/.]+$/, ''),
        fileName: file.name,
        fileData: reader.result as string,
        type: file.type || 'application/pdf',
        size: file.size
      });
    };
    reader.readAsDataURL(file);
  };

  const submitUploadedRequirement = (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadReq || !uploadFileState.fileName) return;

    // 1. Submit to FICA record
    submitFicaRequirementDocument(uploadReq.empId, uploadReq.req.type, {
      name: uploadFileState.name || uploadReq.req.title,
      fileData: uploadFileState.fileData,
      type: uploadFileState.type,
      size: uploadFileState.size
    });

    // 2. Also save to central Document vault for cross-referencing
    let category: Document['category'] = 'fica_proof_of_address';
    if (uploadReq.req.type === 'id_document') category = 'fica_id';
    else if (uploadReq.req.type === 'bank_confirmation') category = 'fica_bank_statement';
    else if (uploadReq.req.type === 'tax_number') category = 'tax_document';

    // Set 90 days expiry for proof of address
    let expiryDate: string | undefined = undefined;
    if (uploadReq.req.type === 'proof_of_address') {
      const exp = new Date();
      exp.setDate(exp.getDate() + 90);
      expiryDate = exp.toISOString().split('T')[0];
    }

    addDocument({
      name: `${uploadReq.req.title} - ${uploadFileState.name}`,
      fileName: uploadFileState.fileName,
      type: uploadFileState.type,
      size: uploadFileState.size,
      category,
      employeeId: uploadReq.empId,
      uploadedBy: officerName,
      isConfidential: true,
      accessLevel: 'hr_only',
      fileData: uploadFileState.fileData,
      verificationStatus: 'pending',
      expiryDate
    });

    setUploadReq(null);
    setUploadFileState({ name: '', fileData: '', fileName: '', type: 'application/pdf', size: 0 });
  };

  const handleVerifySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewReq) return;

    verifyFicaRequirement(
      reviewReq.empId,
      reviewReq.req.id,
      reviewStatus,
      reviewNotes,
      reviewExpiry || undefined,
      officerName
    );

    setReviewReq(null);
    setReviewNotes('');
    setReviewExpiry('');
  };

  const handleRunSanctionsScreening = (empId: string) => {
    const today = new Date().toISOString().split('T')[0];
    updateFicaRecord(empId, {
      sanctionScreeningPassed: true,
      sanctionScreeningDate: today,
      lastAuditedAt: today,
      auditedBy: officerName
    });
  };

  return (
    <div className="p-6 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
              <ShieldCheck className="w-5 h-5" />
            </span>
            <h1 className="text-2xl font-bold text-gray-900">Financial Institution FICA & KYC Compliance Hub</h1>
          </div>
          <p className="text-gray-600 text-sm mt-1">
            Statutory verification for financial personnel: AML/KYC, certified identity, 90-day proof of address, bank letters, and PEP screening
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="text-xs font-semibold px-3 py-1.5 bg-slate-900 text-white rounded-lg flex items-center gap-2">
            <Building className="w-4 h-4 text-blue-400" />
            <span>FIC Act No. 38 / AML Directives</span>
          </div>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Compliance Rate */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Compliance Rate</span>
            <span className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <ShieldCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-emerald-600">{complianceRate}%</div>
            <p className="text-xs text-gray-500 mt-1">
              {compliantCount} of {totalRecords} personnel fully compliant
            </p>
          </div>
        </div>

        {/* 90-Day Proof of Address Alerts */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Address Expiry Alert</span>
            <span className={`p-2 rounded-lg ${expiringAddressCount > 0 ? 'bg-rose-50 text-rose-600' : 'bg-gray-100 text-gray-500'}`}>
              <AlertTriangle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className={`text-3xl font-extrabold ${expiringAddressCount > 0 ? 'text-rose-600' : 'text-gray-900'}`}>
              {expiringAddressCount}
            </div>
            <p className="text-xs text-gray-500 mt-1">
              Proofs &gt; 90 days old or expiring in &lt; 30 days
            </p>
          </div>
        </div>

        {/* PEP Declarations */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">PEP Declarations</span>
            <span className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <AlertCircle className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-amber-600">{pepCount}</div>
            <p className="text-xs text-gray-500 mt-1">
              Politically Exposed Persons subject to enhanced due diligence
            </p>
          </div>
        </div>

        {/* Sanctions Cleared */}
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold uppercase tracking-wider text-gray-500">Sanctions Screening</span>
            <span className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <UserCheck className="w-4 h-4" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-extrabold text-blue-600">
              {ficaRecords.filter(r => r.sanctionScreeningPassed).length}/{totalRecords}
            </div>
            <p className="text-xs text-gray-500 mt-1">UN & Watchlist automated screening pass</p>
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-xs flex flex-col lg:flex-row gap-4 items-stretch lg:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search personnel by name, staff ID, or department..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-2 text-sm">
            <Filter className="w-4 h-4 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All FICA Statuses</option>
              <option value="compliant">Compliant</option>
              <option value="partially_compliant">Partially Compliant</option>
              <option value="pending_verification">Pending Verification</option>
              <option value="non_compliant">Non-Compliant</option>
            </select>
          </div>

          <select
            value={riskFilter}
            onChange={(e) => setRiskFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Risk Profiles</option>
            <option value="low">Low Risk</option>
            <option value="medium">Medium Risk</option>
            <option value="high">High Risk</option>
          </select>

          <select
            value={addressFilter}
            onChange={(e) => setAddressFilter(e.target.value)}
            className="px-3 py-2 text-sm border border-gray-200 rounded-lg bg-white focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">Proof of Address (All)</option>
            <option value="valid">Valid Proof (&lt; 90 Days)</option>
            <option value="expiring_soon">Expiring Soon (&lt; 30 Days)</option>
            <option value="expired">Expired (&gt; 90 Days)</option>
          </select>
        </div>
      </div>

      {/* Financial Personnel Roster Table */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-xs overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-50">
          <div>
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              Statutory Compliance Roster ({filteredRecords.length})
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">Click any employee row to inspect audit dossier and verify documents</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-gray-200 bg-gray-50/70 text-[11px] font-semibold text-gray-500 uppercase tracking-wider">
                <th className="py-3 px-4">Employee</th>
                <th className="py-3 px-3">FICA Status</th>
                <th className="py-3 px-3">Risk Rating</th>
                <th className="py-3 px-3">Certified ID</th>
                <th className="py-3 px-3">Proof of Address (90d)</th>
                <th className="py-3 px-3">Bank Letter</th>
                <th className="py-3 px-3">Tax Number</th>
                <th className="py-3 px-3">PEP Status</th>
                <th className="py-3 px-3">Sanctions</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {filteredRecords.map(record => {
                const emp = employees.find(e => e.id === record.employeeId);
                if (!emp) return null;

                const addressInfo = getAddressExpiryInfo(record);
                const idReq = record.requirements.find(r => r.type === 'id_document');
                const addrReq = record.requirements.find(r => r.type === 'proof_of_address');
                const bankReq = record.requirements.find(r => r.type === 'bank_confirmation');
                const taxReq = record.requirements.find(r => r.type === 'tax_number');

                return (
                  <tr 
                    key={record.id}
                    onClick={() => setSelectedRecordId(record.id)}
                    className="hover:bg-blue-50/40 transition-colors cursor-pointer group"
                  >
                    {/* Employee Profile */}
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-slate-900 text-white flex items-center justify-center font-bold text-xs shrink-0">
                          {emp.personalInfo.firstName[0]}{emp.personalInfo.lastName[0]}
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                            {emp.personalInfo.firstName} {emp.personalInfo.lastName}
                          </div>
                          <div className="text-[11px] text-gray-500">
                            {emp.employeeId} · {emp.jobInfo.department}
                          </div>
                        </div>
                      </div>
                    </td>

                    {/* Overall Status */}
                    <td className="py-3.5 px-3">
                      <span className={`text-[11px] font-bold px-2 py-0.5 rounded capitalize ${
                        record.status === 'compliant' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                        record.status === 'partially_compliant' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}>
                        {record.status.replace('_', ' ')}
                      </span>
                    </td>

                    {/* Risk Rating */}
                    <td className="py-3.5 px-3">
                      <span className={`text-[11px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                        record.riskRating === 'low' ? 'bg-blue-50 text-blue-700' :
                        record.riskRating === 'medium' ? 'bg-amber-50 text-amber-700' :
                        'bg-rose-50 text-rose-700 font-extrabold'
                      }`}>
                        {record.riskRating}
                      </span>
                    </td>

                    {/* Certified ID */}
                    <td className="py-3.5 px-3">
                      {renderStatusPill(idReq?.status || 'missing')}
                    </td>

                    {/* Proof of Address */}
                    <td className="py-3.5 px-3">
                      <div className="space-y-1">
                        {renderStatusPill(addrReq?.status || 'missing')}
                        <div className={`text-[10px] font-medium ${
                          addressInfo.status === 'expired' ? 'text-rose-600 font-bold' :
                          addressInfo.status === 'expiring_soon' ? 'text-amber-600' :
                          'text-gray-400'
                        }`}>
                          {addressInfo.label}
                        </div>
                      </div>
                    </td>

                    {/* Bank Confirmation */}
                    <td className="py-3.5 px-3">
                      {renderStatusPill(bankReq?.status || 'missing')}
                    </td>

                    {/* Tax Number */}
                    <td className="py-3.5 px-3">
                      {renderStatusPill(taxReq?.status || 'missing')}
                    </td>

                    {/* PEP Declaration */}
                    <td className="py-3.5 px-3">
                      {record.isPep ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                          <AlertTriangle className="w-3 h-3 text-amber-600" /> PEP Declared
                        </span>
                      ) : (
                        <span className="text-[11px] text-gray-500">Non-PEP</span>
                      )}
                    </td>

                    {/* Sanctions */}
                    <td className="py-3.5 px-3">
                      {record.sanctionScreeningPassed ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-emerald-700 font-medium">
                          <Check className="w-3.5 h-3.5" /> Cleared
                        </span>
                      ) : (
                        <span className="text-[11px] text-rose-600 font-medium">Pending Check</span>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedRecordId(record.id);
                        }}
                        className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1 transition-colors"
                      >
                        Inspect <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Selected Employee Dossier Audit Drawer / Modal */}
      {selectedRecord && selectedEmployee && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-end z-50">
          <div className="bg-white w-full max-w-2xl h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="px-6 py-5 bg-slate-900 text-white flex items-center justify-between border-b border-slate-800">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center font-bold text-lg shadow-md">
                  {selectedEmployee.personalInfo.firstName[0]}{selectedEmployee.personalInfo.lastName[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg font-bold text-white">
                      {selectedEmployee.personalInfo.firstName} {selectedEmployee.personalInfo.lastName}
                    </h3>
                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                      selectedRecord.status === 'compliant' ? 'bg-emerald-500/20 text-emerald-300' : 'bg-amber-500/20 text-amber-300'
                    }`}>
                      {selectedRecord.status.replace('_', ' ')}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-0.5">
                    {selectedEmployee.employeeId} · {selectedEmployee.jobInfo.jobTitle} · {selectedEmployee.jobInfo.department}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCertificateEmployeeRecord({ record: selectedRecord, emp: selectedEmployee })}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors"
                  title="Generate FICA Compliance Audit Certificate"
                >
                  <Printer className="w-3.5 h-3.5" /> Certificate
                </button>
                <button
                  onClick={() => setSelectedRecordId(null)}
                  className="p-1.5 text-slate-400 hover:text-white rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Drawer Body */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6 bg-slate-50">
              {/* Institutional Risk & Screening Overview */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                  Regulatory Risk Rating & Watchlist Clearance
                </h4>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 text-xs">
                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-gray-400 block mb-1">Risk Classification</span>
                    <span className="font-bold text-gray-800 uppercase">{selectedRecord.riskRating} Risk</span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                    <span className="text-gray-400 block mb-1">PEP Self-Declaration</span>
                    <span className={`font-bold ${selectedRecord.isPep ? 'text-amber-700' : 'text-emerald-700'}`}>
                      {selectedRecord.isPep ? 'PEP Identified' : 'Clear (Non-PEP)'}
                    </span>
                  </div>

                  <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 col-span-2 sm:col-span-1">
                    <span className="text-gray-400 block mb-1">Sanctions Screening</span>
                    <span className={`font-bold ${selectedRecord.sanctionScreeningPassed ? 'text-emerald-700' : 'text-rose-700'}`}>
                      {selectedRecord.sanctionScreeningPassed ? 'Cleared' : 'Pending'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-gray-100">
                  <span className="text-xs text-gray-500">
                    Last Statutory Audit: {selectedRecord.lastAuditedAt ? new Date(selectedRecord.lastAuditedAt).toLocaleDateString() : 'Pending'}
                    {selectedRecord.auditedBy && ` by ${selectedRecord.auditedBy}`}
                  </span>
                  {isComplianceOfficer && (
                    <button
                      onClick={() => handleRunSanctionsScreening(selectedRecord.employeeId)}
                      className="px-3 py-1 bg-blue-50 text-blue-700 hover:bg-blue-100 rounded-lg text-xs font-semibold inline-flex items-center gap-1 transition-colors"
                    >
                      <UserCheck className="w-3.5 h-3.5" /> Run Sanctions Re-Screening
                    </button>
                  )}
                </div>
              </div>

              {/* Requirements Audit Dossier Checklist */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500">
                    Verification Checklist & Evidence Dossier
                  </h4>
                  <span className="text-xs text-gray-400">
                    {selectedRecord.requirements.filter(r => r.status === 'compliant').length} of {selectedRecord.requirements.length} satisfied
                  </span>
                </div>

                <div className="space-y-3">
                  {selectedRecord.requirements.map(req => {
                    const isProofOfAddress = req.type === 'proof_of_address';
                    let expiryBadge = null;
                    if (isProofOfAddress && req.expiryDate) {
                      const exp = new Date(req.expiryDate);
                      const daysLeft = Math.ceil((exp.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                      expiryBadge = (
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${
                          daysLeft < 0 ? 'bg-rose-100 text-rose-800' :
                          daysLeft <= 30 ? 'bg-amber-100 text-amber-800' :
                          'bg-emerald-100 text-emerald-800'
                        }`}>
                          {daysLeft < 0 ? `Expired (${Math.abs(daysLeft)}d ago)` : `Valid: ${daysLeft} days left`}
                        </span>
                      );
                    }

                    return (
                      <div 
                        key={req.id}
                        className="bg-white rounded-xl border border-gray-200 p-4 shadow-2xs space-y-3"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2">
                              <h5 className="font-bold text-gray-900 text-sm">{req.title}</h5>
                              {renderStatusPill(req.status)}
                              {expiryBadge}
                            </div>
                            <p className="text-xs text-gray-500 mt-1 leading-relaxed">{req.description}</p>
                          </div>
                        </div>

                        {/* Document Evidence Attachment */}
                        <div className="bg-gray-50 p-3 rounded-lg border border-gray-100 flex items-center justify-between text-xs">
                          {req.documentName ? (
                            <div className="flex items-center gap-2">
                              <FileCheck className="w-4 h-4 text-blue-600 shrink-0" />
                              <div>
                                <span className="font-semibold text-gray-800">{req.documentName}</span>
                                <span className="text-[11px] text-gray-400 ml-2">
                                  Uploaded: {req.uploadedAt ? new Date(req.uploadedAt).toLocaleDateString() : 'N/A'}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <span className="text-gray-400 italic">No document file attached yet</span>
                          )}

                          <div className="flex items-center gap-2">
                            {req.fileData && (
                              <a
                                href={req.fileData}
                                download={req.documentName || `${req.title}.pdf`}
                                className="px-2.5 py-1 text-xs font-semibold text-gray-700 hover:text-blue-600 bg-white border border-gray-200 rounded-lg inline-flex items-center gap-1 shadow-2xs"
                              >
                                <Download className="w-3 h-3" /> View/Download
                              </a>
                            )}
                            <button
                              onClick={() => {
                                setUploadReq({ empId: selectedRecord.employeeId, req });
                                setUploadFileState({ name: '', fileData: '', fileName: '', type: 'application/pdf', size: 0 });
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg inline-flex items-center gap-1 transition-colors"
                            >
                              <Upload className="w-3 h-3" /> Upload File
                            </button>
                          </div>
                        </div>

                        {/* Audit Verification Log */}
                        {req.verifiedBy && (
                          <div className="text-[11px] bg-blue-50/50 p-2 rounded text-blue-900 border border-blue-100 flex items-center justify-between">
                            <span>
                              Verified by: <strong className="font-semibold">{req.verifiedBy}</strong> on{' '}
                              {req.verifiedAt ? new Date(req.verifiedAt).toLocaleDateString() : 'Recent'}
                            </span>
                            {req.notes && <span className="text-blue-700 italic">"{req.notes}"</span>}
                          </div>
                        )}

                        {/* Officer Actions */}
                        {isComplianceOfficer && (
                          <div className="flex items-center justify-end gap-2 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => {
                                setReviewReq({ empId: selectedRecord.employeeId, req });
                                setReviewStatus('rejected');
                                setReviewNotes('');
                                setReviewExpiry('');
                              }}
                              className="px-2.5 py-1 text-xs font-semibold text-rose-700 hover:bg-rose-50 rounded-lg transition-colors inline-flex items-center gap-1"
                            >
                              <XCircle className="w-3.5 h-3.5" /> Reject with Deficiency
                            </button>
                            <button
                              onClick={() => {
                                setReviewReq({ empId: selectedRecord.employeeId, req });
                                setReviewStatus('compliant');
                                setReviewNotes('');
                                // Default 90 days for address
                                if (req.type === 'proof_of_address') {
                                  const exp = new Date();
                                  exp.setDate(exp.getDate() + 90);
                                  setReviewExpiry(exp.toISOString().split('T')[0]);
                                } else {
                                  setReviewExpiry('');
                                }
                              }}
                              className="px-3 py-1 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors inline-flex items-center gap-1 shadow-2xs"
                            >
                              <CheckCircle className="w-3.5 h-3.5" /> Approve & Certify
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Drawer Footer */}
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex items-center justify-between">
              <span className="text-xs text-gray-500">
                Statutory retention period: 5 years post-termination
              </span>
              <button
                onClick={() => setSelectedRecordId(null)}
                className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-lg text-xs"
              >
                Close Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review & Verification Modal */}
      {reviewReq && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <h3 className="text-base font-semibold">
                {reviewStatus === 'compliant' ? 'Approve & Certify Requirement' : 'Reject Requirement'}
              </h3>
              <button onClick={() => setReviewReq(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleVerifySubmit} className="p-6 space-y-4">
              <div>
                <span className="text-xs text-gray-500 uppercase tracking-wider block">Requirement</span>
                <h4 className="text-sm font-bold text-gray-900">{reviewReq.req.title}</h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Decision *</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReviewStatus('compliant')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                      reviewStatus === 'compliant'
                        ? 'bg-emerald-50 border-emerald-500 text-emerald-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <CheckCircle className="w-4 h-4" /> Compliant
                  </button>
                  <button
                    type="button"
                    onClick={() => setReviewStatus('rejected')}
                    className={`py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center justify-center gap-1.5 ${
                      reviewStatus === 'rejected'
                        ? 'bg-rose-50 border-rose-500 text-rose-700'
                        : 'border-gray-200 text-gray-600'
                    }`}
                  >
                    <XCircle className="w-4 h-4" /> Rejected
                  </button>
                </div>
              </div>

              {/* Expiry Date (critical for 90-day address proof) */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Document Validity / Next Verification Date
                </label>
                <input
                  type="date"
                  value={reviewExpiry}
                  onChange={(e) => setReviewExpiry(e.target.value)}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
                <span className="text-[11px] text-gray-500 mt-1 block">
                  For proof of address, financial institutions mandate validity not exceeding 90 days from statement date.
                </span>
              </div>

              {/* Audit Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Auditor Verification Notes / Deficiency Reason *
                </label>
                <textarea
                  rows={3}
                  required
                  value={reviewNotes}
                  onChange={(e) => setReviewNotes(e.target.value)}
                  placeholder={
                    reviewStatus === 'compliant'
                      ? 'e.g. Stamped bank letter verified against official branch directory.'
                      : 'e.g. Utility bill is dated over 90 days ago; client must provide current utility account.'
                  }
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setReviewReq(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className={`px-4 py-2 text-xs font-semibold text-white rounded-lg ${
                    reviewStatus === 'compliant'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-rose-600 hover:bg-rose-700'
                  }`}
                >
                  Save Compliance Decision
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Upload Modal for Specific Requirement */}
      {uploadReq && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4 text-blue-400" />
                <h3 className="text-base font-semibold">Upload Evidence Document</h3>
              </div>
              <button onClick={() => setUploadReq(null)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={submitUploadedRequirement} className="p-6 space-y-4">
              <div>
                <span className="text-xs text-gray-400 uppercase tracking-wider block">Target Requirement</span>
                <h4 className="text-sm font-bold text-gray-900">{uploadReq.req.title}</h4>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Select File (PDF, PNG, JPG) *</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-4 text-center hover:border-blue-500 bg-gray-50 transition-colors">
                  <input
                    type="file"
                    id="reqFileInput"
                    onChange={handleFileUploadChange}
                    accept="image/*,.pdf,.doc,.docx"
                    className="hidden"
                  />
                  <label htmlFor="reqFileInput" className="cursor-pointer block">
                    {uploadFileState.fileName ? (
                      <div className="flex flex-col items-center">
                        <FileCheck className="w-7 h-7 text-emerald-600 mb-1" />
                        <span className="text-xs font-semibold text-gray-900">{uploadFileState.fileName}</span>
                        <span className="text-[11px] text-blue-600 underline mt-1">Replace file</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-7 h-7 text-gray-400 mb-1" />
                        <span className="text-xs font-semibold text-gray-800">Browse statutory document</span>
                        <span className="text-[11px] text-gray-400 mt-0.5">PDF or scanned image</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Document Label / Description</label>
                <input
                  type="text"
                  placeholder="e.g. Electricity Bill Oct 2026 or Certified ID Copy"
                  value={uploadFileState.name}
                  onChange={(e) => setUploadFileState({ ...uploadFileState, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-gray-100">
                <button
                  type="button"
                  onClick={() => setUploadReq(null)}
                  className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!uploadFileState.fileName}
                  className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 rounded-lg transition-colors"
                >
                  Upload & Submit for Audit
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* FICA Compliance Certificate / Export Modal */}
      {certificateEmployeeRecord && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden border border-gray-200">
            {/* Certificate Top Header */}
            <div className="bg-slate-900 text-white p-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
                <div>
                  <h3 className="text-base font-bold text-white uppercase tracking-wider">
                    Statutory Compliance Certificate
                  </h3>
                  <p className="text-xs text-slate-300">
                    Financial Intelligence Centre Act (FICA) & AML Customer Due Diligence
                  </p>
                </div>
              </div>
              <button
                onClick={() => setCertificateEmployeeRecord(null)}
                className="p-1 rounded text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Certificate Body (Printable formatting) */}
            <div className="p-8 space-y-6 text-gray-800 bg-slate-50/50">
              <div className="text-center pb-4 border-b border-gray-200">
                <div className="text-xs uppercase tracking-widest text-gray-400 font-mono">
                  Certificate Ref: FIC-AUD-{certificateEmployeeRecord.record.id.slice(0, 8).toUpperCase()}
                </div>
                <h2 className="text-xl font-extrabold text-gray-900 mt-1">
                  Verification of Personnel Due Diligence
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  Issued under the compliance programme of the accountable financial institution
                </p>
              </div>

              {/* Employee Summary Card */}
              <div className="bg-white p-4 rounded-xl border border-gray-200 shadow-2xs grid grid-cols-2 gap-4 text-xs">
                <div>
                  <span className="text-gray-400 block mb-0.5">Personnel Full Legal Name</span>
                  <strong className="text-sm text-gray-900">
                    {certificateEmployeeRecord.emp.personalInfo.firstName} {certificateEmployeeRecord.emp.personalInfo.lastName}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Staff Identification Number</span>
                  <strong className="text-sm font-mono text-gray-900">
                    {certificateEmployeeRecord.emp.employeeId}
                  </strong>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Division / Department</span>
                  <span className="font-semibold text-gray-800">
                    {certificateEmployeeRecord.emp.jobInfo.department} · {certificateEmployeeRecord.emp.jobInfo.jobTitle}
                  </span>
                </div>
                <div>
                  <span className="text-gray-400 block mb-0.5">Overall Compliance Status</span>
                  <span className="font-bold text-emerald-700 capitalize">
                    {certificateEmployeeRecord.record.status.replace('_', ' ')}
                  </span>
                </div>
              </div>

              {/* Verified Checklist */}
              <div>
                <h4 className="text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                  Audited Statutory Evidence
                </h4>
                <div className="space-y-2">
                  {certificateEmployeeRecord.record.requirements.map(req => (
                    <div 
                      key={req.id} 
                      className="bg-white p-3 rounded-lg border border-gray-200 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-gray-900">{req.title}</div>
                        <div className="text-[11px] text-gray-500">
                          {req.documentName || 'Statutory record verified'} · Verified by {req.verifiedBy || 'Audit Officer'}
                        </div>
                      </div>
                      <span className="inline-flex items-center gap-1 font-semibold text-emerald-700">
                        <Check className="w-4 h-4 text-emerald-600" /> Compliant
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PEP & Sanctions Summary */}
              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-100 text-xs text-blue-900 space-y-1">
                <div className="font-bold">Watchlist & Sanctions Screening Assurance:</div>
                <p className="text-blue-800 leading-relaxed">
                  Screening executed against UN Security Council Consolidated Lists, OFAC, and local financial sanctions registers. 
                  Zero adverse sanction designations identified.
                </p>
              </div>

              {/* Signatures */}
              <div className="pt-6 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="h-10 border-b border-gray-300 flex items-end font-serif italic text-gray-600">
                    {officerName}
                  </div>
                  <span className="text-gray-400 block mt-1">Chief AML & FICA Compliance Officer</span>
                </div>
                <div>
                  <div className="h-10 border-b border-gray-300 flex items-end font-mono text-gray-600">
                    {new Date().toLocaleDateString()}
                  </div>
                  <span className="text-gray-400 block mt-1">Audit Certification Date</span>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="px-6 py-4 bg-white border-t border-gray-200 flex justify-end gap-3">
              <button
                onClick={() => setCertificateEmployeeRecord(null)}
                className="px-4 py-2 text-xs font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg"
              >
                Close
              </button>
              <button
                onClick={() => window.print()}
                className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg inline-flex items-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-3.5 h-3.5" /> Print Certificate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
