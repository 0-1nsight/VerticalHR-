import React, { useState } from 'react';
import { 
  Upload, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  FileSpreadsheet,
  Layers
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { 
  validateBatchImport, 
  SupportedSourceFormat, 
  ValidationPreviewResult 
} from '../../services/importer';

interface BulkImportExportModalProps {
  onClose: () => void;
}

export const BulkImportExportModal: React.FC<BulkImportExportModalProps> = ({ onClose }) => {
  const { employees, bulkImportEmployees, currentTenant } = useData();

  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [selectedFormat, setSelectedFormat] = useState<SupportedSourceFormat>('auto');
  const [fileName, setFileName] = useState<string>('');
  const [preview, setPreview] = useState<ValidationPreviewResult | null>(null);
  const [rawRows, setRawRows] = useState<Record<string, string>[]>([]);
  const [importResult, setImportResult] = useState<{ successCount: number; errors: string[] } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setImportResult(null);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter((l) => l.trim() !== '');
    if (lines.length <= 1) {
      setPreview({
        detectedFormat: 'none',
        totalRows: 0,
        validRows: [],
        errors: [{ rowNumber: 1, field: 'header', message: 'CSV file must contain a header row and at least one data row.', rawRecord: {} }],
        canCommit: false,
      });
      return;
    }

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, string>[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^["']|["']$/g, ''));
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });
      rows.push(rowObj);
    }

    setRawRows(rows);
    const validation = validateBatchImport(rows, selectedFormat);
    setPreview(validation);
  };

  const handleFormatChange = (newFormat: SupportedSourceFormat) => {
    setSelectedFormat(newFormat);
    if (rawRows.length > 0) {
      const validation = validateBatchImport(rawRows, newFormat);
      setPreview(validation);
    }
  };

  const handleExecuteImport = () => {
    if (!preview || preview.validRows.length === 0) return;

    // Convert normalized rows for Context state
    const mappedForContext = preview.validRows.map((r) => ({
      employeeId: r.employeeNumber,
      firstName: r.firstName,
      lastName: r.lastName,
      email: r.email,
      phone: r.phone,
      department: r.department,
      jobTitle: r.jobTitle,
      salary: String(r.salaryMinorUnits / 100),
      hireDate: r.hireDate,
      workLocation: `${currentTenant.name} Corporate Hub`,
      employmentType: 'full_time',
    }));

    const result = bulkImportEmployees(mappedForContext);
    setImportResult(result);
  };

  const downloadSample = (type: 'verticalhr' | 'bamboohr' | 'zoho' | 'orangehrm') => {
    let sampleCSV = '';
    let downloadName = '';

    if (type === 'bamboohr') {
      downloadName = 'BambooHR_Export_Sample.csv';
      sampleCSV = `Employee #,First Name,Last Name,Work Email,Mobile Phone,Department,Job Title,Pay Rate,Hire Date,SIN/SSN,Bank Account
BAM-101,Aaliyah,Brown,aaliyah.b@example.com,+1-876-555-0199,Marketing,Senior Brand Manager,$95000,2022-03-15,TRN-901-112,NCB-441092
BAM-102,Damian,Smith,damian.s@example.com,+1-876-555-0182,Finance,Financial Risk Officer,$88000,2023-01-10,TRN-901-113,BNS-771891`;
    } else if (type === 'zoho') {
      downloadName = 'Zoho_People_Export_Sample.csv';
      sampleCSV = `Employee ID,First Name,Last Name,Email address,Phone number,Department Name,Designation,Salary,Date of Joining,Tax ID,Account Number
ZOHO-201,Aaliyah,Brown,aaliyah.b@example.com,+1-876-555-0199,Marketing,Senior Brand Manager,95000,2022-03-15,TRN-901-112,NCB-441092
ZOHO-202,Damian,Smith,damian.s@example.com,+1-876-555-0182,Finance,Financial Risk Officer,88000,2023-01-10,TRN-901-113,BNS-771891`;
    } else if (type === 'orangehrm') {
      downloadName = 'OrangeHRM_Export_Sample.csv';
      sampleCSV = `Emp ID,First Name,Last Name,Work Email,Telephone,Sub Unit,Job Title,Basic Salary,Joined Date,SSN,Direct Deposit Account
OHRM-301,Aaliyah,Brown,aaliyah.b@example.com,+1-876-555-0199,Marketing,Senior Brand Manager,95000,2022-03-15,TRN-901-112,NCB-441092
OHRM-302,Damian,Smith,damian.s@example.com,+1-876-555-0182,Finance,Financial Risk Officer,88000,2023-01-10,TRN-901-113,BNS-771891`;
    } else {
      downloadName = 'VerticalHR_Import_Template.csv';
      sampleCSV = `employeeId,firstName,lastName,email,phone,department,jobTitle,salary,hireDate,trn,bankAccount
EMP-9101,Aaliyah,Brown,aaliyah.b@example.com,+1-876-555-0199,Marketing,Senior Brand Manager,95000,2022-03-15,134-889-021,876-092-441
EMP-9102,Damian,Smith,damian.s@example.com,+1-876-555-0182,Finance,Financial Risk Officer,88000,2023-01-10,134-889-022,876-092-442`;
    }

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + sampleCSV);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', downloadName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadExportCSV = () => {
    const headers = [
      'Employee ID',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Department',
      'Job Title',
      'Employment Status',
      'Hire Date',
      'Salary',
      'Work Location',
      'Tenant',
    ];

    const rows = employees.map((e) => [
      e.employeeId,
      `"${e.personalInfo.firstName}"`,
      `"${e.personalInfo.lastName}"`,
      `"${e.personalInfo.email}"`,
      `"${e.personalInfo.phone}"`,
      `"${e.jobInfo.department}"`,
      `"${e.jobInfo.jobTitle}"`,
      e.jobInfo.employmentStatus,
      e.jobInfo.hireDate,
      e.jobInfo.salary,
      `"${e.jobInfo.workLocation}"`,
      `"${currentTenant.name}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute(
      'download',
      `Personnel_Master_Export_${currentTenant.subdomain}_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-3xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold">Bulk Employee Import & Migration Hub</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-gray-200 bg-gray-50 px-6 pt-2">
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'import' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500'
            }`}
          >
            HRIS Ingestion & Mappers
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors ${
              activeTab === 'export' ? 'border-blue-600 text-blue-600 bg-white' : 'border-transparent text-gray-500'
            }`}
          >
            Master Roster Export ({employees.length} Personnel)
          </button>
        </div>

        {/* Body */}
        <div className="p-6 overflow-y-auto flex-1 text-xs space-y-4">
          {activeTab === 'import' ? (
            <div className="space-y-4">
              {/* Migration Mappers Selection */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-800 font-bold text-xs">
                    <Layers className="w-4 h-4 text-blue-600" />
                    <span>Source System Migration Mapper</span>
                  </div>
                  <span className="text-2xs font-semibold uppercase px-2 py-0.5 rounded bg-blue-100 text-blue-800">
                    Auto-Format Detection Enabled
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {[
                    { id: 'auto', label: 'Auto Detect' },
                    { id: 'bamboohr', label: 'BambooHR' },
                    { id: 'zoho', label: 'Zoho People' },
                    { id: 'orangehrm', label: 'OrangeHRM' },
                  ].map((fmt) => (
                    <button
                      key={fmt.id}
                      onClick={() => handleFormatChange(fmt.id as SupportedSourceFormat)}
                      className={`px-3 py-2 rounded-lg text-xs font-medium border text-center transition-all ${
                        selectedFormat === fmt.id
                          ? 'border-blue-600 bg-blue-50 text-blue-700 font-bold'
                          : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {fmt.label}
                    </button>
                  ))}
                </div>

                {/* Sample Template Downloads */}
                <div className="pt-2 border-t border-slate-200 flex flex-wrap items-center justify-between gap-2 text-slate-600 text-[11px]">
                  <span>Download Sample Formats:</span>
                  <div className="flex flex-wrap gap-1.5">
                    <button onClick={() => downloadSample('verticalhr')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-semibold inline-flex items-center gap-1">
                      <Download className="w-3 h-3 text-blue-600" /> Standard
                    </button>
                    <button onClick={() => downloadSample('bamboohr')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-semibold inline-flex items-center gap-1">
                      <Download className="w-3 h-3 text-emerald-600" /> BambooHR
                    </button>
                    <button onClick={() => downloadSample('zoho')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-semibold inline-flex items-center gap-1">
                      <Download className="w-3 h-3 text-amber-600" /> Zoho People
                    </button>
                    <button onClick={() => downloadSample('orangehrm')} className="px-2 py-1 bg-white border border-gray-300 rounded hover:bg-gray-100 font-semibold inline-flex items-center gap-1">
                      <Download className="w-3 h-3 text-purple-600" /> OrangeHRM
                    </button>
                  </div>
                </div>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Upload Personnel Spreadsheet (.csv)</label>
                <div className="border-2 border-dashed border-gray-300 rounded-xl p-5 text-center bg-gray-50 hover:border-blue-500 transition-colors">
                  <input
                    type="file"
                    id="bulkCsvFile"
                    accept=".csv,text/csv"
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <label htmlFor="bulkCsvFile" className="cursor-pointer block">
                    {fileName ? (
                      <div className="flex flex-col items-center">
                        <FileSpreadsheet className="w-8 h-8 text-emerald-600 mb-2" />
                        <span className="text-xs font-bold text-gray-900">{fileName}</span>
                        {preview && (
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[11px] text-gray-500">{preview.totalRows} records parsed</span>
                            <span className="text-2xs font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                              Format: {preview.detectedFormat.toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs font-semibold text-gray-800">Select or drop CSV employee spreadsheet</span>
                        <span className="text-[11px] text-gray-400 mt-1">Supports BambooHR, Zoho, OrangeHRM, or Standard formats</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Validation Diagnostics Feedback */}
              {preview && preview.errors.length > 0 && (
                <div className="p-3.5 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1.5">
                  <span className="font-bold flex items-center gap-1.5 text-xs">
                    <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
                    Validation Diagnostics ({preview.errors.length} Issues Found) - Atomic Rollback Enforced
                  </span>
                  <p className="text-[11px] text-rose-700">
                    To maintain strict data integrity, zero records are committed until validation issues are corrected.
                  </p>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5 max-h-28 overflow-y-auto font-mono">
                    {preview.errors.slice(0, 10).map((err, idx) => (
                      <li key={idx}>
                        Row #{err.rowNumber} [{err.field}]: {err.message}
                      </li>
                    ))}
                    {preview.errors.length > 10 && (
                      <li className="font-sans italic">...and {preview.errors.length - 10} more rows</li>
                    )}
                  </ul>
                </div>
              )}

              {/* Import Result Notification */}
              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h5 className="font-bold">Import Batch Committed Successfully!</h5>
                      <p className="text-[11px] text-emerald-700">
                        Added {importResult.successCount} new personnel records to {currentTenant.name} with encrypted sensitive identifiers and hash-chained audit logging.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Pre-Import Validation Preview Table */}
              {preview && preview.validRows.length > 0 && !importResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                      Pre-Import Validation Preview ({preview.validRows.length} Valid Records Ready)
                    </span>
                    <span className="text-2xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                      AES-256-GCM Encryption Gated
                    </span>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-52">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Emp #</th>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Department</th>
                          <th className="py-2 px-3">Job Title</th>
                          <th className="py-2 px-3 text-right">Annual Salary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {preview.validRows.slice(0, 10).map((r, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-1.5 px-3 font-mono text-gray-600">{r.employeeNumber}</td>
                            <td className="py-1.5 px-3 font-semibold text-gray-900">
                              {r.firstName} {r.lastName}
                            </td>
                            <td className="py-1.5 px-3 text-gray-600">{r.email}</td>
                            <td className="py-1.5 px-3">{r.department}</td>
                            <td className="py-1.5 px-3">{r.jobTitle}</td>
                            <td className="py-1.5 px-3 text-right font-mono font-medium">
                              ${(r.salaryMinorUnits / 100).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                  {preview.validRows.length > 10 && (
                    <p className="text-[11px] text-gray-400 italic text-right">
                      Showing 10 of {preview.validRows.length} validated records
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4 text-center py-6">
              <FileSpreadsheet className="w-12 h-12 text-emerald-600 mx-auto" />
              <div>
                <h4 className="text-sm font-bold text-gray-900">Export Complete Enterprise Roster</h4>
                <p className="text-xs text-gray-500 max-w-md mx-auto mt-1 leading-relaxed">
                  Generates an export of all {employees.length} personnel records including job titles, departments, salaries, hire dates, and tenant context.
                </p>
              </div>

              <button
                onClick={downloadExportCSV}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-bold inline-flex items-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" /> Download Complete Roster (CSV)
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-gray-50 border-t border-gray-200 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Close
          </button>
          {activeTab === 'import' && preview && preview.validRows.length > 0 && !importResult && (
            <button
              onClick={handleExecuteImport}
              disabled={!preview.canCommit}
              className={`px-5 py-2 text-xs font-bold rounded-lg shadow-xs transition-colors ${
                preview.canCommit
                  ? 'bg-blue-600 hover:bg-blue-700 text-white'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
            >
              Confirm Import ({preview.validRows.length} Employees)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
