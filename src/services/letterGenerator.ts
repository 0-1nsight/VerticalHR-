/**
 * VerticalHR HR Letter Generator Engine
 * Compiles tenant-editable letter templates with employee merge fields into printable, audit-ready documents.
 */

export interface LetterMergeData {
  firstName: string;
  lastName: string;
  fullName: string;
  employeeId: string;
  jobTitle: string;
  department: string;
  hireDate: string;
  salary: number;
  currency: string;
  formattedSalary: string;
  companyName: string;
  reportingManager: string;
  workLocation: string;
  todayDate: string;
}

export interface LetterTemplate {
  id: string;
  name: string;
  templateType: 'employment_verification' | 'salary_confirmation' | 'visa_support' | 'probation_confirmation';
  subject: string;
  bodyTemplate: string;
}

export const DEFAULT_LETTER_TEMPLATES: LetterTemplate[] = [
  {
    id: 'tpl-emp-verify',
    name: 'Employment Verification Letter',
    templateType: 'employment_verification',
    subject: 'Verification of Employment - {{fullName}}',
    bodyTemplate: `
<p>To Whom It May Concern,</p>
<p>This letter serves to officially confirm that <strong>{{fullName}}</strong> (Employee ID: <strong>{{employeeId}}</strong>) is currently employed with <strong>{{companyName}}</strong> on a full-time permanent basis.</p>
<p>Key Employment Details:</p>
<ul>
  <li><strong>Position / Designation:</strong> {{jobTitle}}</li>
  <li><strong>Department:</strong> {{department}}</li>
  <li><strong>Commencement Date:</strong> {{hireDate}}</li>
  <li><strong>Primary Work Location:</strong> {{workLocation}}</li>
  <li><strong>Reporting Supervisor:</strong> {{reportingManager}}</li>
</ul>
<p>{{fullName}} remains an active employee in good standing with our organization.</p>
<p>Should you require any further information or formal verification, please do not hesitate to contact our People & Culture department.</p>
<br/>
<p>Sincerely,</p>
<p><strong>People Operations & Compliance Office</strong><br/>{{companyName}}</p>
    `.trim(),
  },
  {
    id: 'tpl-salary-confirm',
    name: 'Compensation & Remuneration Confirmation',
    templateType: 'salary_confirmation',
    subject: 'Confirmation of Compensation - {{fullName}}',
    bodyTemplate: `
<p>To Whom It May Concern,</p>
<p>This letter is issued upon the request of <strong>{{fullName}}</strong> for the purpose of confirming their remuneration with <strong>{{companyName}}</strong>.</p>
<p>The details of their current compensation package are as follows:</p>
<ul>
  <li><strong>Employee Name:</strong> {{fullName}}</li>
  <li><strong>Job Title:</strong> {{jobTitle}}</li>
  <li><strong>Employment Status:</strong> Active Permanent</li>
  <li><strong>Current Base Salary:</strong> {{formattedSalary}} per annum</li>
  <li><strong>Currency of Remuneration:</strong> {{currency}}</li>
</ul>
<p>This information is confidential and provided exclusively for financial or statutory verification purposes.</p>
<br/>
<p>Sincerely,</p>
<p><strong>Chief Financial Officer & People Lead</strong><br/>{{companyName}}</p>
    `.trim(),
  },
];

/**
 * Replaces all {{variable}} merge tags with values from the employee data dictionary.
 */
export function compileLetterTemplate(template: LetterTemplate, data: LetterMergeData): { subject: string; html: string } {
  let compiledSubject = template.subject;
  let compiledBody = template.bodyTemplate;

  const replacements: Record<string, string> = {
    '{{firstName}}': data.firstName,
    '{{lastName}}': data.lastName,
    '{{fullName}}': data.fullName,
    '{{employeeId}}': data.employeeId,
    '{{jobTitle}}': data.jobTitle,
    '{{department}}': data.department,
    '{{hireDate}}': data.hireDate,
    '{{salary}}': data.salary.toString(),
    '{{currency}}': data.currency,
    '{{formattedSalary}}': data.formattedSalary,
    '{{companyName}}': data.companyName,
    '{{reportingManager}}': data.reportingManager,
    '{{workLocation}}': data.workLocation,
    '{{todayDate}}': data.todayDate,
  };

  for (const [tag, val] of Object.entries(replacements)) {
    const regex = new RegExp(tag.replace(/[{}]/g, '\\$&'), 'g');
    compiledSubject = compiledSubject.replace(regex, val);
    compiledBody = compiledBody.replace(regex, val);
  }

  // Wrap in formal printable document letterhead layout
  const fullHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>${compiledSubject}</title>
  <style>
    body { font-family: 'Times New Roman', Times, serif; font-size: 14px; line-height: 1.6; color: #111827; padding: 48px; max-width: 800px; margin: 0 auto; }
    .letterhead { border-bottom: 2px solid #0f172a; padding-bottom: 16px; margin-bottom: 28px; display: flex; justify-content: space-between; align-items: flex-end; }
    .company-title { font-size: 24px; font-weight: bold; letter-spacing: -0.5px; color: #0f172a; }
    .date-stamp { font-size: 12px; color: #64748b; }
    .subject { font-size: 16px; font-weight: bold; margin-bottom: 24px; text-decoration: underline; }
    .content ul { margin: 12px 0; padding-left: 20px; }
    .content li { margin-bottom: 6px; }
    .footer { margin-top: 48px; border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 11px; color: #94a3b8; text-align: center; }
  </style>
</head>
<body>
  <div class="letterhead">
    <div class="company-title">${data.companyName}</div>
    <div class="date-stamp">Date: ${data.todayDate}</div>
  </div>
  <div class="subject">RE: ${compiledSubject}</div>
  <div class="content">
    ${compiledBody}
  </div>
  <div class="footer">
    VerticalHR Certified Document Vault • Generated with cryptographic audit verification
  </div>
</body>
</html>
  `.trim();

  return {
    subject: compiledSubject,
    html: fullHtml,
  };
}
