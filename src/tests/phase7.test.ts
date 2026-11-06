/**
 * VerticalHR Phase 7 Acceptance & Verification Test Suite
 * Validates:
 * 1. Explainable Compliance Risk Rating Formula & Point Breakdown
 * 2. Strict Segregation of Duties Enforcement (Uploader cannot verify own document)
 * 3. Real Sandbox Watchlist Screening (OFAC & Jamaica FID PEP match detection)
 * 4. False-Positive Adjudication with Tamper-Evident Audit Fingerprint
 * 5. Regulator-Ready Evidence Pack Generation for BOJ / FID Audit Inspection
 */

import {
  calculateComplianceRiskScore,
  validateVerificationSegregation,
  screenAgainstSanctionsWatchlist,
  adjudicateScreeningHit,
  generateRegulatorEvidencePack,
  ComplianceRiskInput,
  AdjudicationInput
} from '../services/complianceEngine';

export async function runPhase7Tests(): Promise<{ passed: boolean; results: string[] }> {
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
    // 1. Explainable Compliance Risk Rating & Attribution Test
    // ------------------------------------------------------------------------
    // Executive + Tier 1 PEP (40) + Role (30) + Expired Address >90d (20) = 90 (Critical)
    const highRiskInput: ComplianceRiskInput = {
      roleCategory: 'executive',
      isPep: true,
      pepTier: 1,
      sanctionsMatchStatus: 'none',
      addressDaysRemaining: -15, // Expired 15 days ago
      hasValidId: true,
      hasCriminalClearance: true,
      adverseMediaFlag: false
    };
    const highRiskResult = calculateComplianceRiskScore(highRiskInput);

    // Standard Staff + Non-PEP (0) + Valid Address (0) + Valid ID (0) = 5 (Low)
    const lowRiskInput: ComplianceRiskInput = {
      roleCategory: 'general_staff',
      isPep: false,
      sanctionsMatchStatus: 'none',
      addressDaysRemaining: 75, // Valid
      hasValidId: true,
      hasCriminalClearance: true,
      adverseMediaFlag: false
    };
    const lowRiskResult = calculateComplianceRiskScore(lowRiskInput);

    const riskFormulaValid =
      highRiskResult.totalScore === 90 &&
      highRiskResult.riskTier === 'critical' &&
      highRiskResult.breakdown.roleBaseScore === 30 &&
      highRiskResult.breakdown.pepScore === 40 &&
      highRiskResult.breakdown.addressScore === 20 &&
      lowRiskResult.totalScore === 5 &&
      lowRiskResult.riskTier === 'low';

    logResult('Explainable Compliance Risk Rating & Component Attribution', riskFormulaValid);

    // ------------------------------------------------------------------------
    // 2. Strict Segregation of Duties Enforcement Test
    // ------------------------------------------------------------------------
    const sameUserCheck = validateVerificationSegregation('usr-compliance-1', 'usr-compliance-1');
    const independentUserCheck = validateVerificationSegregation('usr-uploader-emp', 'usr-compliance-officer');

    const sodValid =
      sameUserCheck.allowed === false &&
      sameUserCheck.reason?.includes('Segregation of Duties Violation') &&
      independentUserCheck.allowed === true;

    logResult('Strict Segregation of Duties Enforcement (Four-Eyes Principle)', Boolean(sodValid));

    // ------------------------------------------------------------------------
    // 3. Real Sandbox Watchlist Screening Test (Exact & Fuzzy Matching)
    // ------------------------------------------------------------------------
    // Screen test subject on sanctions list: Viktor Bout (exact match)
    const sanctionsHit = screenAgainstSanctionsWatchlist('Viktor Bout');
    // Screen alias/fuzzy: Carlos Anthony Hill
    const fuzzyHit = screenAgainstSanctionsWatchlist('Carlos Anthony Hill');
    // Clean candidate
    const cleanSubject = screenAgainstSanctionsWatchlist('Tariq Douglas');

    const screeningValid =
      sanctionsHit.hasMatch === true &&
      sanctionsHit.highestMatchScore === 100 &&
      sanctionsHit.hits[0].matchedEntity.listSource === 'OFAC SDN' &&
      fuzzyHit.hasMatch === true &&
      fuzzyHit.hits[0].matchedEntity.name === 'Carlos Hill' &&
      cleanSubject.hasMatch === false &&
      cleanSubject.hits.length === 0;

    logResult('Sandbox Watchlist Screening (OFAC & Jamaica FID Exact/Fuzzy Hits)', screeningValid);

    // ------------------------------------------------------------------------
    // 4. False-Positive Adjudication with Tamper-Evident Audit Fingerprint
    // ------------------------------------------------------------------------
    const adjudicationPayload: AdjudicationInput = {
      eventId: 'evt-scr-101',
      employeeId: 'EMP000',
      officerUserId: 'usr-auditor-1',
      officerName: 'Elena Rostova',
      decision: 'false_positive',
      rationale: 'Verified date of birth (1980 vs 1952) and passport record. Confirmed non-identity match with target.',
      supportingDocumentRef: 'DOC-PASSPORT-VERIFIED-2026.pdf'
    };

    const adjudicated = adjudicateScreeningHit(adjudicationPayload);
    const adjudicationValid =
      adjudicated.decision === 'false_positive' &&
      adjudicated.adjudicatedBy === 'Elena Rostova' &&
      adjudicated.auditFingerprint.length === 64 &&
      typeof adjudicated.auditFingerprint === 'string';

    logResult('Screening Hit False-Positive Adjudication & Cryptographic Audit Hash', adjudicationValid);

    // ------------------------------------------------------------------------
    // 5. Regulator-Ready Evidence Pack Generation Test
    // ------------------------------------------------------------------------
    const verifiedDocs = [
      {
        type: 'National Identification Card',
        verifiedBy: 'Elena Rostova',
        verifiedAt: '2026-06-15T10:00:00Z',
        expiryDate: '2030-01-01',
        status: 'compliant'
      },
      {
        type: 'Utility Bill (Proof of Address)',
        verifiedBy: 'Elena Rostova',
        verifiedAt: '2026-10-01T12:00:00Z',
        expiryDate: '2027-01-01',
        status: 'compliant'
      }
    ];

    const evidencePack = generateRegulatorEvidencePack(
      'EMP001',
      'John Doe',
      'Elena Rostova (Chief Compliance Officer)',
      lowRiskResult,
      [adjudicated],
      verifiedDocs
    );

    const packValid =
      evidencePack.manifestId.startsWith('EP-FID-') &&
      evidencePack.regulatoryIntegrityHash.length === 64 &&
      evidencePack.verifiedDocuments.length === 2 &&
      evidencePack.screeningAdjudications.length === 1;

    logResult('Regulator-Ready Evidence Pack Generation for Central Bank Audits', packValid);

  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : String(err);
    logResult('Phase 7 Test Suite Exception', false, errorMsg);
  }

  return { passed: allPassed, results };
}
