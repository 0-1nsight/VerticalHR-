/**
 * VerticalHR Phase 6 Acceptance & Verification Test Suite
 * Validates:
 * 1. Interview Scorecard Weighted Criteria & Recommendation Engine
 * 2. Tamper-Evident E-Sign Offer Letter Hashing & Audit Fingerprinting
 * 3. 1-Click Candidate-to-Employee Conversion with 30/60/90 Onboarding Tasks
 * 4. Offboarding Exit Clearance Settlement & Final Pay Encashment
 * 5. Candidate Consent & Statutory Retention Expiry Rules
 */

import {
  scoreCandidateInterview,
  generateTamperEvidentOfferLetter,
  convertCandidateToEmployeeWithChecklist,
  calculateExitSettlement,
  validateCandidateConsentAndRetention,
  ScorecardInput,
  OfferLetterSpec,
  ExitSettlementInput
} from '../services/recruitingEngine';
import { Candidate, JobRequisition } from '../types';

export async function runPhase6Tests(): Promise<{ passed: boolean; results: string[] }> {
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
    // 1. Interview Scorecard Weighted Criteria & Recommendation Test
    // ------------------------------------------------------------------------
    // Weights: Tech 35%, Problem Solving 30%, Culture 20%, Communication 15%
    const strongCandidate: ScorecardInput = {
      candidateId: 'cand-101',
      interviewerId: 'user-4',
      technicalCompetency: 5, // 5 * 0.35 = 1.75
      problemSolving: 5,       // 5 * 0.30 = 1.50
      culturalAlignment: 4,    // 4 * 0.20 = 0.80
      communicationSkills: 4   // 4 * 0.15 = 0.60 -> Total: 4.65 -> strong_hire
    };
    const strongEval = scoreCandidateInterview(strongCandidate);

    const moderateCandidate: ScorecardInput = {
      candidateId: 'cand-102',
      interviewerId: 'user-4',
      technicalCompetency: 3, // 3 * 0.35 = 1.05
      problemSolving: 4,       // 4 * 0.30 = 1.20
      culturalAlignment: 4,    // 4 * 0.20 = 0.80
      communicationSkills: 4   // 4 * 0.15 = 0.60 -> Total: 3.65 -> hire
    };
    const modEval = scoreCandidateInterview(moderateCandidate);

    const scorecardValid =
      strongEval.overallScore === 4.65 &&
      strongEval.recommendation === 'strong_hire' &&
      modEval.overallScore === 3.65 &&
      modEval.recommendation === 'hire';

    logResult('Interview Scorecard Weighted Criteria & Recommendation Engine', scorecardValid);

    // ------------------------------------------------------------------------
    // 2. Tamper-Evident E-Sign Offer Letter Hashing & Audit Fingerprinting
    // ------------------------------------------------------------------------
    const offerSpec: OfferLetterSpec = {
      candidateId: 'cand-101',
      candidateName: 'Rohan Sterling',
      candidateEmail: 'rohan.sterling@example.com',
      jobTitle: 'Senior Systems Architect',
      department: 'Engineering',
      baseSalary: 140000,
      currency: 'USD',
      startDate: '2026-12-01',
      expiryDate: '2026-11-20',
      signerName: 'Rohan Sterling',
      signerEmail: 'rohan.sterling@example.com',
      signerIp: '190.130.45.12',
      signedAt: '2026-11-10T14:30:00.000Z'
    };

    const signedOffer = generateTamperEvidentOfferLetter(offerSpec);
    const offerTamperValid =
      signedOffer.isValid &&
      signedOffer.tamperEvidentHash.length === 64 &&
      signedOffer.signatureAuditTrail.signerIp === '190.130.45.12' &&
      signedOffer.signatureAuditTrail.documentFingerprint === signedOffer.tamperEvidentHash;

    logResult('Tamper-Evident E-Sign Offer Letter Hashing & Audit Fingerprinting', offerTamperValid);

    // ------------------------------------------------------------------------
    // 3. 1-Click Candidate-to-Employee Conversion with 30/60/90 Onboarding Tasks
    // ------------------------------------------------------------------------
    const testCandidate: Candidate = {
      id: 'cand-202',
      tenantId: 'tenant-001',
      requisitionId: 'req-01',
      jobTitle: 'AML Compliance Specialist',
      name: 'Tamara Richards',
      email: 'tamara.richards@example.com',
      phone: '+1 (876) 555-8833',
      stage: 'offer',
      score: 4.8,
      source: 'LinkedIn',
      appliedDate: '2026-10-15',
      notes: 'Strong financial regulations background'
    };

    const testRequisition: Partial<JobRequisition> = {
      id: 'req-01',
      title: 'AML Compliance Specialist',
      department: 'Compliance',
      hiringManager: 'Elena Rostova',
      location: 'Kingston Corporate Hub',
      employmentType: 'full_time',
      salaryBudget: { min: 110000, max: 135000, currency: 'USD' }
    };

    const conversion = convertCandidateToEmployeeWithChecklist(testCandidate, testRequisition, 'EMP099');
    const employeeCreated = conversion.employee;
    const tasks = conversion.onboardingTasks;

    const conversionValid =
      employeeCreated.employeeId === 'EMP099' &&
      employeeCreated.personalInfo.firstName === 'Tamara' &&
      employeeCreated.personalInfo.lastName === 'Richards' &&
      employeeCreated.jobInfo.department === 'Compliance' &&
      employeeCreated.jobInfo.reportingManager === 'Elena Rostova' &&
      tasks.length === 5 &&
      tasks.some(t => t.title.includes('Laptop')) &&
      tasks.some(t => t.title.includes('30-Day')) &&
      tasks.some(t => t.title.includes('90-Day'));

    logResult('1-Click Candidate-to-Employee Conversion with 30/60/90 Onboarding Tasks', conversionValid);

    // ------------------------------------------------------------------------
    // 4. Offboarding Exit Clearance Settlement & Final Pay Encashment
    // ------------------------------------------------------------------------
    // Monthly salary: $220,000. Working days in month: 22 -> Daily rate: $10,000
    // Worked 12 days in exit month = $120,000 (12,000,000 minor units)
    // Accrued unused vacation: 4.5 days = $45,000 (4,500,000 minor units)
    // Gross settlement: $165,000 (16,500,000 minor units)
    // Asset deduction: $15,000 unreturned monitor (1,500,000 minor units)
    // Net settlement: $150,000 (15,000,000 minor units)
    const exitInput: ExitSettlementInput = {
      employeeId: 'EMP001',
      monthlySalary: 220000,
      daysWorkedInMonth: 12,
      totalWorkingDaysInMonth: 22,
      accruedUnusedVacationDays: 4.5,
      equipmentDeductionsMinorUnits: 1500000,
      unreimbursedAdvancesMinorUnits: 0
    };

    const settlement = calculateExitSettlement(exitInput);
    const exitValid =
      settlement.dailyRate === 10000 &&
      settlement.proRataSalaryMinorUnits === 12000000 &&
      settlement.vacationEncashmentMinorUnits === 4500000 &&
      settlement.grossSettlementMinorUnits === 16500000 &&
      settlement.netPayableSettlementMinorUnits === 15000000 &&
      settlement.isReadyForPayroll === true;

    logResult('Offboarding Exit Clearance Settlement & Final Pay Encashment', exitValid);

    // ------------------------------------------------------------------------
    // 5. Candidate Consent & Statutory Retention Expiry Rules
    // ------------------------------------------------------------------------
    // Applied 2 months ago -> valid (10 months remaining)
    const recentApplication = validateCandidateConsentAndRetention('2026-09-01', 12);
    // Applied 15 months ago -> expired
    const oldApplication = validateCandidateConsentAndRetention('2025-05-01', 12);

    const retentionValid =
      recentApplication.isValid === true &&
      recentApplication.daysRemaining > 0 &&
      oldApplication.isValid === false &&
      oldApplication.daysRemaining <= 0;

    logResult('Candidate Consent & Statutory Retention Expiry Rules', retentionValid);

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logResult('Phase 6 Test Suite Exception', false, errorMsg);
  }

  return { passed: allPassed, results };
}
