import React, { useState } from 'react';
import { 
  Upload, 
  Download, 
  AlertTriangle, 
  CheckCircle, 
  X, 
  FileSpreadsheet
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';

interface BulkImportExportModalProps {
  onClose: () => void;
}

export const BulkImportExportModal: React.FC<BulkImportExportModalProps> = ({ onClose }) => {
  const { employees, bulkImportEmployees, currentTenant } = useData();

  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [fileName, setFileName] = useState<string>('');
  const [parsedRows, setParsedRows] = useState<Record<string, string>[]>([]);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [importResult, setImportResult] = useState<{ successCount: number; errors: string[] } | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = () => {
      const text = reader.result as string;
      parseCSV(text);
    };
    reader.readAsText(file);
  };

  const parseCSV = (text: string) => {
    const lines = text.split('\n').filter(l => l.trim() !== '');
    if (lines.length <= 1) {
      setValidationErrors(['CSV file must contain a header row and at least one data row.']);
      return;
    }

    const headers = lines[0].split(',').map(h => h.trim().replace(/^["']|["']$/g, ''));
    const rows: Record<string, string>[] = [];
    const errors: string[] = [];

    const existingEmails = new Set(employees.map(e => e.personalInfo.email.toLowerCase()));

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map(v => v.trim().replace(/^["']|["']$/g, ''));
      const rowObj: Record<string, string> = {};
      headers.forEach((h, idx) => {
        rowObj[h] = values[idx] || '';
      });

      // Quick validation
      const email = (rowObj.email || '').toLowerCase();
      const firstName = rowObj.firstName || '';
      const lastName = rowObj.lastName || '';

      if (!email || !email.includes('@')) {
        errors.push(`Row #${i}: Invalid email '${email}'`);
      } else if (existingEmails.has(email)) {
        errors.push(`Row #${i}: Email '${email}' already exists in current tenant roster`);
      }

      if (!firstName || !lastName) {
        errors.push(`Row #${i}: Missing mandatory firstName or lastName`);
      }

      rows.push(rowObj);
    }

    setParsedRows(rows);
    setValidationErrors(errors);
  };

  const handleExecuteImport = () => {
    if (parsedRows.length === 0) return;
    const result = bulkImportEmployees(parsedRows);
    setImportResult(result);
  };

  const downloadSampleTemplate = () => {
    const sampleCSV = `employeeId,firstName,lastName,email,phone,department,jobTitle,salary,workLocation
EMP-9101,Aaliyah,Brown,aaliyah.b@example.com,+1-876-555-0199,Marketing,Senior Brand Manager,95000,Kingston Corporate Hub
EMP-9102,Damian,Smith,damian.s@example.com,+1-876-555-0182,Finance,Financial Risk Officer,88000,Kingston Corporate Hub
EMP-9103,Nia,Davis,nia.davis@example.com,+1-876-555-0174,Engineering,DevOps Engineer,115000,Remote Hub`;

    const encodedUri = encodeURI('data:text/csv;charset=utf-8,' + sampleCSV);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'HRM_Bulk_Employee_Import_Template.csv');
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
      'Tenant'
    ];

    const rows = employees.map(e => [
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
      `"${currentTenant.name}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Personnel_Master_Export_${currentTenant.subdomain}_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-emerald-400" />
            <h3 className="text-base font-semibold">Bulk Employee Import & Master Export</h3>
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
            Bulk CSV Import
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
              <div className="flex items-center justify-between bg-blue-50/60 p-3.5 rounded-xl border border-blue-100 text-blue-900">
                <div>
                  <h4 className="font-bold">Need a formatted CSV spreadsheet template?</h4>
                  <p className="text-[11px] opacity-80 mt-0.5">Download our standardized template with column headers and sample data.</p>
                </div>
                <button
                  onClick={downloadSampleTemplate}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg text-xs inline-flex items-center gap-1.5 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" /> Sample Template
                </button>
              </div>

              {/* Upload Dropzone */}
              <div>
                <label className="block text-xs font-semibold text-gray-700 mb-1">Upload CSV Data File</label>
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
                        <span className="text-[11px] text-gray-500 mt-0.5">{parsedRows.length} rows parsed</span>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center">
                        <Upload className="w-8 h-8 text-gray-400 mb-2" />
                        <span className="text-xs font-semibold text-gray-800">Select or drop CSV employee spreadsheet</span>
                        <span className="text-[11px] text-gray-400 mt-1">Comma-separated values (.csv)</span>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              {/* Validation Feedback */}
              {validationErrors.length > 0 && (
                <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-800 space-y-1">
                  <span className="font-bold flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5 text-rose-600" /> Validation Warnings ({validationErrors.length})
                  </span>
                  <ul className="list-disc pl-5 text-[11px] space-y-0.5 max-h-24 overflow-y-auto">
                    {validationErrors.map((err, idx) => (
                      <li key={idx}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Import Result Notification */}
              {importResult && (
                <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                      <h5 className="font-bold">Import Successful!</h5>
                      <p className="text-[11px] text-emerald-700">
                        Added {importResult.successCount} new personnel records to {currentTenant.name}.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Parsed Rows Preview Table */}
              {parsedRows.length > 0 && !importResult && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-gray-700 uppercase tracking-wider text-[11px]">
                      Pre-Import Validation Preview ({parsedRows.length} Records)
                    </span>
                    <span className="text-[11px] text-gray-400">Ready to ingest into Core HR</span>
                  </div>

                  <div className="border border-gray-200 rounded-lg overflow-x-auto max-h-48">
                    <table className="w-full text-left text-[11px]">
                      <thead className="bg-gray-50 border-b border-gray-200 text-gray-500 font-semibold">
                        <tr>
                          <th className="py-2 px-3">Name</th>
                          <th className="py-2 px-3">Email</th>
                          <th className="py-2 px-3">Department</th>
                          <th className="py-2 px-3">Job Title</th>
                          <th className="py-2 px-3 text-right">Salary</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {parsedRows.slice(0, 10).map((r, idx) => (
                          <tr key={idx} className="hover:bg-gray-50">
                            <td className="py-1.5 px-3 font-semibold">{r.firstName} {r.lastName}</td>
                            <td className="py-1.5 px-3 text-gray-600">{r.email}</td>
                            <td className="py-1.5 px-3">{r.department}</td>
                            <td className="py-1.5 px-3">{r.jobTitle}</td>
                            <td className="py-1.5 px-3 text-right font-mono">${Number(r.salary || 0).toLocaleString()}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
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
          {activeTab === 'import' && parsedRows.length > 0 && !importResult && (
            <button
              onClick={handleExecuteImport}
              className="px-5 py-2 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
            >
              Confirm Import ({parsedRows.length} Employees)
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
