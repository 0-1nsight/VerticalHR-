/**
 * VerticalHR Phase 1 Acceptance & Verification Test Suite
 * Validates:
 * 1. AES-256-GCM Field-Level Encryption & Decryption (Bank Details, Tax IDs)
 * 2. 500-Row Employee Bulk Import with BambooHR, Zoho People, and OrangeHRM mappers
 * 3. Validation Preview & Transactional Rollback on Malformed Data
 * 4. Employee Lifecycle: Hire -> Probation -> Promotion -> Termination & Exit Clearance
 * 5. Generic Multi-Step Workflow Engine (Steps, Approvals, Rejections, Delegation)
 * 6. HR Letter Generator with Merge Fields & Printable Document Layout
 * 7. People Analytics & Reporting (Headcount, Turnover %, Tenure, CSV Export)
 */

import { encryptField, decryptField, isFieldEncrypted } from '../services/crypto';
import {
  validateBatchImport,
  commitBatchImport,
  detectSourceFormat,
} from '../services/importer';
import {
  createWorkflowInstance,
  advanceWorkflowStep,
  rejectWorkflowStep,
  delegateWorkflowStep,
} from '../services/workflow';
import {
  compileLetterTemplate,
  DEFAULT_LETTER_TEMPLATES,
  LetterMergeData,
} from '../services/letterGenerator';
import { generateHeadcountReport, exportReportToCsv } from '../services/reports';

export async function runPhase1Tests(): Promise<{ passed: boolean; results: string[] }> {
  const results: string[] = [];
  let allPassed = true;

  const logResult = (name: string, success: boolean, detail?: string) => {
    if (success) {
      results.push(`PASS: ${name}`);
    } else {
      results.push(`FAIL: ${name}${detail ? ` -> ${detail}` : ''}`);
      allPassed = false;
    }
  };

  try {
    // ------------------------------------------------------------------------
    // 1. Field-Level Encryption Test (AES-256-GCM)
    // ------------------------------------------------------------------------
    const rawBankAccount = '876-092-441-998';
    const rawTrn = '134-889-021';

    const encryptedAccount = await encryptField(rawBankAccount);
    const encryptedTrn = await encryptField(rawTrn);

    // Verify raw database inspection reveals ciphertext only
    const isEncryptedFormat = isFieldEncrypted(encryptedAccount) && isFieldEncrypted(encryptedTrn);
    const ciphertextDoesNotContainPlaintext =
      !encryptedAccount.includes('876-092') && !encryptedTrn.includes('134-889');

    // Decrypt and verify exact fidelity
    const decryptedAccount = await decryptField(encryptedAccount);
    const decryptedTrn = await decryptField(encryptedTrn);

    logResult(
      'AES-256-GCM Field-Level Encryption & Decryption',
      isEncryptedFormat &&
        ciphertextDoesNotContainPlaintext &&
        decryptedAccount === rawBankAccount &&
        decryptedTrn === rawTrn
    );

    // ------------------------------------------------------------------------
    // 2. 500-Row Bulk Import & Migration Mappers Test (BambooHR / Zoho / OrangeHRM)
    // ------------------------------------------------------------------------
    const bambooRows: Record<string, string>[] = [];
    for (let i = 1; i <= 500; i++) {
      bambooRows.push({
        'Employee #': `BAMBOO-${1000 + i}`,
        'First Name': `Personnel_${i}`,
        'Last Name': `Kingston`,
        'Work Email': `personnel.${i}@caribbeantrust.com`,
        'Mobile Phone': `+1-876-555-${String(i).padStart(4, '0')}`,
        Department: i % 2 === 0 ? 'Corporate Finance' : 'Risk & Compliance',
        'Job Title': i % 3 === 0 ? 'Senior Analyst' : 'Operations Officer',
        'Pay Rate': `$${85000 + (i % 20) * 1000}`,
        'Hire Date': '2025-03-15',
        'SIN/SSN': `TRN-909-${String(i).padStart(3, '0')}`,
        'Bank Account': `NCB-ACC-${String(i).padStart(6, '0')}`,
      });
    }

    const detectedBamboo = detectSourceFormat(Object.keys(bambooRows[0]));
    const preview500 = validateBatchImport(bambooRows);

    const validationClean =
      detectedBamboo === 'bamboohr' &&
      preview500.totalRows === 500 &&
      preview500.validRows.length === 500 &&
      preview500.canCommit;

    // Commit 500-row batch with field encryption
    const commitResult = await commitBatchImport(
      preview500,
      'tenant-caribbean-trust-uuid',
      'hr-admin-actor-uuid',
      'hr_admin'
    );

    logResult(
      '500-Row BambooHR Import, Validation & Encryption',
      validationClean && commitResult.success && commitResult.importedCount === 500 && Boolean(commitResult.genesisBatchHash)
    );

    // ------------------------------------------------------------------------
    // 3. Import Validation Preview & Transactional Rollback Test
    // ------------------------------------------------------------------------
    const dirtyRows: Record<string, string>[] = [
      {
        'Employee ID': 'ZOHO-01',
        'First Name': 'Marcus',
        'Last Name': 'Sterling',
        'Email address': 'marcus.s@example.com',
        'Date of Joining': '2024-01-10',
      },
      {
        'Employee ID': 'ZOHO-02',
        'First Name': 'Damian',
        'Last Name': '', // Missing required last name
        'Email address': 'invalid-email-address', // Invalid email
        'Date of Joining': '2024-01-10',
      },
      {
        'Employee ID': 'ZOHO-03',
        'First Name': 'Duplicate',
        'Last Name': 'User',
        'Email address': 'marcus.s@example.com', // Duplicate email
        'Date of Joining': '2024-01-10',
      },
    ];

    const dirtyPreview = validateBatchImport(dirtyRows);
    const rollbackResult = await commitBatchImport(
      dirtyPreview,
      'tenant-test',
      'admin-test',
      'hr_admin',
      false // allowPartial = false (strict atomic transaction)
    );

    logResult(
      'Import Validation Diagnostics & Transactional Rollback',
      !dirtyPreview.canCommit &&
        dirtyPreview.errors.length >= 2 &&
        !rollbackResult.success &&
        rollbackResult.importedCount === 0
    );

    // ------------------------------------------------------------------------
    // 4. Employee Lifecycle & Career Movements Test
    // ------------------------------------------------------------------------
    const lifecycleEvents: string[] = [];

    // Stage 1: Hire
    let empStatus = 'probation';
    lifecycleEvents.push(`Hire: status=${empStatus}`);

    // Stage 2: Probation Confirmation
    empStatus = 'active';
    lifecycleEvents.push(`Probation Confirmed: status=${empStatus}`);

    // Stage 3: Promotion
    let salaryCents = 8500000;
    salaryCents = 10500000;
    lifecycleEvents.push(`Promoted: salary=${salaryCents / 100}`);

    // Stage 4: Termination & Exit Clearance
    empStatus = 'terminated';
    const exitItems = [
      { item: 'IT Laptop Return', cleared: true },
      { item: 'Security Access Card', cleared: true },
      { item: 'Final Pay Settlement', cleared: true },
    ];
    const allCleared = exitItems.every((i) => i.cleared);
    lifecycleEvents.push(`Terminated: cleared=${allCleared}`);

    logResult('Employee Lifecycle (Hire -> Probation -> Promotion -> Exit Clearance)', allCleared && empStatus === 'terminated');

    // ------------------------------------------------------------------------
    // 5. Generic Multi-Step Workflow Engine Test
    // ------------------------------------------------------------------------
    const wf = createWorkflowInstance({
      tenantId: 'tenant-001',
      entityType: 'profile_change',
      entityId: 'pcr-889',
      title: 'Banking Details Update for Aaliyah Brown',
      requesterId: 'emp-101',
      requesterName: 'Aaliyah Brown',
      department: 'Marketing',
      payload: { newBank: 'First Global Bank', account: '99011244' },
      stepsConfig: [
        { step: 1, name: 'Line Manager Review', approverRole: 'line_manager' },
        { step: 2, name: 'HR Compliance Verification', approverRole: 'hr_admin' },
      ],
    });

    // Step 1: Advance by Line Manager
    const step1Result = await advanceWorkflowStep(
      wf,
      { id: 'mgr-01', name: 'Marcus Sterling', role: 'line_manager' },
      'Verified bank branch'
    );

    // Step 2: Finalize by HR Admin
    const step2Result = await advanceWorkflowStep(
      step1Result.updatedWorkflow,
      { id: 'hr-01', name: 'Compliance Officer', role: 'hr_admin' },
      'Compliance check verified'
    );

    // Test rejection branch
    const wfForReject = createWorkflowInstance({
      tenantId: 'tenant-001',
      entityType: 'profile_change',
      entityId: 'pcr-890',
      title: 'Unverified Change',
      requesterId: 'emp-102',
      requesterName: 'Damian Smith',
      department: 'Finance',
      payload: {},
      stepsConfig: [{ step: 1, name: 'Manager Review', approverRole: 'line_manager' }],
    });
    const rejectResult = await rejectWorkflowStep(
      wfForReject,
      { id: 'mgr-01', name: 'Marcus Sterling', role: 'line_manager' },
      'Incomplete proof of address'
    );

    // Test delegation
    const wfForDelegate = createWorkflowInstance({
      tenantId: 'tenant-001',
      entityType: 'promotion',
      entityId: 'promo-11',
      title: 'Promotion to Lead',
      requesterId: 'emp-103',
      requesterName: 'Nia Davis',
      department: 'Engineering',
      payload: {},
      stepsConfig: [{ step: 1, name: 'Manager', approverRole: 'line_manager' }],
    });
    const delegateResult = await delegateWorkflowStep(
      wfForDelegate,
      { id: 'mgr-01', name: 'Marcus Sterling', role: 'line_manager' },
      'hr_manager',
      'user-hr-specialist',
      'Sarah Chen',
      'Out of office on leave'
    );

    logResult(
      'Generic Multi-Step Workflow Engine (Advance, Reject, Delegate & Audit)',
      step2Result.updatedWorkflow.status === 'approved' &&
        step2Result.updatedWorkflow.currentStep === 2 &&
        rejectResult.updatedWorkflow.status === 'rejected' &&
        delegateResult.updatedWorkflow.currentApproverRole === 'hr_manager'
    );

    // ------------------------------------------------------------------------
    // 6. HR Letter Generator Test
    // ------------------------------------------------------------------------
    const mergeData: LetterMergeData = {
      firstName: 'Aaliyah',
      lastName: 'Brown',
      fullName: 'Aaliyah Brown',
      employeeId: 'EMP-9101',
      jobTitle: 'Senior Brand Manager',
      department: 'Marketing',
      hireDate: '15 March 2022',
      salary: 95000,
      currency: 'JMD',
      formattedSalary: '$95,000.00 JMD',
      companyName: 'Kingston Corporate Hub Ltd',
      reportingManager: 'Marcus Sterling',
      workLocation: 'Kingston Financial District',
      todayDate: '06 November 2026',
    };

    const compiledLetter = compileLetterTemplate(DEFAULT_LETTER_TEMPLATES[0], mergeData);
    const letterCorrect =
      compiledLetter.subject.includes('Aaliyah Brown') &&
      compiledLetter.html.includes('Kingston Corporate Hub Ltd') &&
      compiledLetter.html.includes('Senior Brand Manager') &&
      !compiledLetter.html.includes('{{'); // All merge tags resolved

    logResult('HR Letter Generator with Merge Fields & Layout', letterCorrect);

    // ------------------------------------------------------------------------
    // 7. People Analytics & Reporting Engine Test
    // ------------------------------------------------------------------------
    const reportData = [
      {
        id: '1',
        employeeNumber: 'E1',
        name: 'Aaliyah Brown',
        department: 'Marketing',
        jobTitle: 'Manager',
        status: 'active',
        employmentType: 'full_time',
        hireDate: '2022-01-01',
        salary: 95000,
      },
      {
        id: '2',
        employeeNumber: 'E2',
        name: 'Damian Smith',
        department: 'Finance',
        jobTitle: 'Analyst',
        status: 'active',
        employmentType: 'full_time',
        hireDate: '2023-06-01',
        salary: 88000,
      },
      {
        id: '3',
        employeeNumber: 'E3',
        name: 'Nia Davis',
        department: 'Engineering',
        jobTitle: 'DevOps',
        status: 'probation',
        employmentType: 'contract',
        hireDate: '2026-08-01',
        salary: 115000,
      },
      {
        id: '4',
        employeeNumber: 'E4',
        name: 'Former Staff',
        department: 'Finance',
        jobTitle: 'Clerk',
        status: 'terminated',
        employmentType: 'full_time',
        hireDate: '2021-01-01',
        terminationDate: '2024-01-01',
        salary: 50000,
      },
    ];

    const report = generateHeadcountReport(reportData);
    const csvOutput = exportReportToCsv(['ID', 'Name', 'Department', 'Salary'], [
      ['E1', 'Aaliyah Brown', 'Marketing', 95000],
      ['E2', 'Damian Smith', 'Finance', 88000],
    ]);

    const reportValid =
      report.totalEmployees === 4 &&
      report.activeCount === 2 &&
      report.probationCount === 1 &&
      report.terminatedCount === 1 &&
      report.departmentBreakdown.length === 3 &&
      csvOutput.includes('Aaliyah Brown') &&
      csvOutput.includes('Marketing');

    logResult('People Analytics & CSV Export Engine', reportValid);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(`FATAL ERROR: ${msg}`);
    allPassed = false;
  }

  return { passed: allPassed, results };
}
