import React, { useState } from 'react';
import { 
  FileText, 
  Printer, 
  X
} from 'lucide-react';
import { useData } from '../../contexts/DataContext';
import { Employee, HRLetterTemplate } from '../../types';

interface LetterGeneratorModalProps {
  employee?: Employee;
  initialEmployeeId?: string;
  onClose: () => void;
}

export const LetterGeneratorModal: React.FC<LetterGeneratorModalProps> = ({ employee, initialEmployeeId, onClose }) => {
  const { employees, currentTenant } = useData();

  const [selectedEmpId, setSelectedEmpId] = useState(initialEmployeeId || employee?.id || employees[0]?.id || '1');
  const [selectedType, setSelectedType] = useState<HRLetterTemplate['type']>('employment_verification');
  const [customAddressee, setCustomAddressee] = useState('To Whom It May Concern');

  const targetEmp = employees.find(e => e.id === selectedEmpId) || employees[0];

  const letterTemplates: Record<HRLetterTemplate['type'], { title: string; body: string }> = {
    employment_verification: {
      title: 'Official Certificate of Employment Verification',
      body: `This letter serves to officially confirm that {{FIRST_NAME}} {{LAST_NAME}} (Staff Identification: {{EMPLOYEE_ID}}) is currently employed with {{TENANT_NAME}} on a {{EMPLOYMENT_TYPE}} basis.

{{FIRST_NAME}} commenced employment on {{HIRE_DATE}} and currently holds the position of {{JOB_TITLE}} within the {{DEPARTMENT}} division.

Throughout their tenure, {{FIRST_NAME}} has demonstrated commendable dedication and adhered rigorously to all corporate governance, statutory FICA regulations, and ethical guidelines.

Should you require any further validation or detailed employment background verification, please contact our Human Resources & People Operations department directly.`
    },
    salary_confirmation: {
      title: 'Confidential Compensation & Remuneration Confirmation',
      body: `This certificate provides authoritative verification that {{FIRST_NAME}} {{LAST_NAME}} is an active employee of {{TENANT_NAME}}, serving as {{JOB_TITLE}}.

As of the date of this letter, {{FIRST_NAME}} receives an annual gross base compensation of {{CURRENCY}} {{SALARY}}, payable in regular monthly instalments, subject to statutory income tax deductions and pension contributions in accordance with {{TENANT_COUNTRY}} labor law.

This confirmation is issued in strict confidence upon the formal request of the employee for banking, financial, or residential mortgage qualification purposes.`
    },
    visa_support: {
      title: 'Diplomatic Mission / Consular Visa Support Letter',
      body: `To the Consular Section / Diplomatic Mission:

Please be advised that {{FIRST_NAME}} {{LAST_NAME}}, holder of Staff Identification {{EMPLOYEE_ID}}, is employed on a permanent full-time basis as {{JOB_TITLE}} at {{TENANT_NAME}} in {{TENANT_COUNTRY}}.

The management has approved approved leave for {{FIRST_NAME}} to travel internationally. Following their travels, {{FIRST_NAME}} is expected to resume their standard professional duties at our offices.

We respectfully request that you facilitate their visa application accordingly.`
    },
    probation_confirmation: {
      title: 'Formal Confirmation of Employment Post-Probation',
      body: `Dear {{FIRST_NAME}},

Following the comprehensive review of your initial probationary performance period, we are delighted to inform you that your permanent appointment as {{JOB_TITLE}} within the {{DEPARTMENT}} division has been formally approved.

Your dedication to institutional compliance, exemplary work ethic, and professional collaboration have met and exceeded all benchmarks set by the management of {{TENANT_NAME}}.

Congratulations on reaching this significant milestone in your professional journey with us.`
    }
  };

  const activeTemplate = letterTemplates[selectedType];

  const generateLetterText = () => {
    let text = activeTemplate.body;
    text = text.replace(/{{FIRST_NAME}}/g, targetEmp.personalInfo.firstName);
    text = text.replace(/{{LAST_NAME}}/g, targetEmp.personalInfo.lastName);
    text = text.replace(/{{EMPLOYEE_ID}}/g, targetEmp.employeeId);
    text = text.replace(/{{JOB_TITLE}}/g, targetEmp.jobInfo.jobTitle);
    text = text.replace(/{{DEPARTMENT}}/g, targetEmp.jobInfo.department);
    text = text.replace(/{{EMPLOYMENT_TYPE}}/g, targetEmp.jobInfo.employmentType.replace('_', ' '));
    text = text.replace(/{{HIRE_DATE}}/g, new Date(targetEmp.jobInfo.hireDate).toLocaleDateString());
    text = text.replace(/{{SALARY}}/g, targetEmp.jobInfo.salary.toLocaleString());
    text = text.replace(/{{CURRENCY}}/g, currentTenant.currency);
    text = text.replace(/{{TENANT_NAME}}/g, currentTenant.name);
    text = text.replace(/{{TENANT_COUNTRY}}/g, currentTenant.country);
    return text;
  };

  const letterBody = generateLetterText();

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl max-w-4xl w-full max-h-[92vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-blue-400" />
            <h3 className="text-base font-semibold">HR Document & Letterhead Generator</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Left Controls */}
          <div className="w-full md:w-80 bg-slate-50 border-r border-slate-200 p-5 space-y-4 overflow-y-auto text-xs shrink-0">
            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Target Employee
              </label>
              <select
                value={selectedEmpId}
                onChange={(e) => setSelectedEmpId(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              >
                {employees.map(e => (
                  <option key={e.id} value={e.id}>
                    {e.personalInfo.firstName} {e.personalInfo.lastName} ({e.employeeId})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Letter Template
              </label>
              <div className="space-y-1.5">
                {[
                  { id: 'employment_verification', label: 'Employment Verification' },
                  { id: 'salary_confirmation', label: 'Salary Confirmation' },
                  { id: 'visa_support', label: 'Consular Visa Support' },
                  { id: 'probation_confirmation', label: 'Probation Confirmation' },
                ].map(opt => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setSelectedType(opt.id as typeof selectedType)}
                    className={`w-full text-left p-2.5 rounded-lg border font-semibold transition-colors ${
                      selectedType === opt.id
                        ? 'border-blue-600 bg-blue-50 text-blue-900'
                        : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-bold text-gray-700 uppercase tracking-wider mb-1">
                Recipient / Addressee
              </label>
              <input
                type="text"
                value={customAddressee}
                onChange={(e) => setCustomAddressee(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg bg-white"
              />
            </div>

            <div className="pt-3 border-t border-slate-200 space-y-2">
              <button
                onClick={() => window.print()}
                className="w-full py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-bold flex items-center justify-center gap-1.5 shadow-2xs"
              >
                <Printer className="w-4 h-4" /> Print / Export PDF
              </button>
            </div>
          </div>

          {/* Right Letterhead Canvas */}
          <div className="flex-1 bg-slate-200 p-6 overflow-y-auto flex items-center justify-center">
            <div className="bg-white max-w-2xl w-full p-10 shadow-xl border border-gray-200 text-gray-800 space-y-6 min-h-[500px] flex flex-col justify-between">
              
              {/* Official Corporate Header */}
              <div>
                <div className="flex items-start justify-between border-b-2 border-slate-900 pb-4">
                  <div>
                    <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                      {currentTenant.name}
                    </h2>
                    <p className="text-xs text-slate-500 font-medium">
                      Division of People Operations & Human Resources · {currentTenant.country}
                    </p>
                    <p className="text-[11px] text-slate-400">
                      12 Trafalgar Road · Kingston 10, Jamaica · HR Ref: {currentTenant.subdomain.toUpperCase()}
                    </p>
                  </div>
                  <div className="w-12 h-12 bg-slate-900 text-white rounded-lg flex items-center justify-center font-bold text-lg">
                    APX
                  </div>
                </div>

                <div className="mt-4 flex justify-between text-xs text-gray-500">
                  <span>Date: {new Date().toLocaleDateString()}</span>
                  <span>Ref No: HR-LTR-{Math.floor(100000 + Math.random() * 900000)}</span>
                </div>

                <div className="mt-4 text-xs font-semibold text-gray-700">
                  {customAddressee}
                </div>

                <h3 className="text-sm font-extrabold text-gray-900 uppercase tracking-wide mt-4 pb-1 border-b border-gray-200">
                  {activeTemplate.title}
                </h3>
              </div>

              {/* Body */}
              <div className="space-y-3 text-xs leading-relaxed text-gray-700 whitespace-pre-line flex-1 my-4">
                {letterBody}
              </div>

              {/* Signature Block */}
              <div className="pt-6 border-t border-gray-200 grid grid-cols-2 gap-8 text-xs">
                <div>
                  <div className="h-8 border-b border-gray-300 font-serif italic text-gray-600 flex items-end">
                    Marcus Sterling
                  </div>
                  <span className="font-bold text-gray-900 block mt-1">Marcus Sterling</span>
                  <span className="text-[11px] text-gray-500">Director of Human Resources</span>
                  <span className="text-[10px] text-gray-400 block">{currentTenant.name}</span>
                </div>
                <div className="text-right flex flex-col justify-end">
                  <span className="text-[10px] text-gray-400">Official Document Seal</span>
                  <span className="font-mono text-[10px] text-emerald-700 font-bold">DIGITALLY VERIFIED</span>
                </div>
              </div>

            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
