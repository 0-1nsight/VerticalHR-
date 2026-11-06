/**
 * VerticalHR Phase 5 Acceptance & Verification Test Suite
 * Validates:
 * 1. Cascading Goals & OKRs (Tree alignment & 100% weight validation)
 * 2. 360-Degree Multi-Rater Feedback Scoring & Category Calibration
 * 3. Compensation Bands & Strict RBAC Authorization Protection (Employee blocked)
 * 4. Pulse Surveys with Enforced k-Anonymity (N < 5 threshold masking) & eNPS
 * 5. 9-Box Talent Matrix & Data-Driven Attrition Risk Predictor
 */

import {
  calculateWeightedOkrProgress,
  calculate360ReviewScore,
  getAuthorizedCompensationBands,
  generatePulseSurveyReport,
  assessTalentAndAttritionRisk,
  GoalOkrItem,
  CompensationBand,
  PulseSurveyResponse,
} from '../services/talentEngine';

export async function runPhase5Tests(): Promise<{ passed: boolean; results: string[] }> {
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
    // 1. Cascading Goals & OKRs Weighting & Rollup Test
    // ------------------------------------------------------------------------
    const validGoals: GoalOkrItem[] = [
      {
        id: 'g1',
        tenantId: 't1',
        level: 'individual',
        title: 'Launch Jamaican Payroll Engine',
        metricTarget: 100,
        metricCurrent: 100, // 100% done
        weightPercentage: 40.0,
        status: 'completed',
      },
      {
        id: 'g2',
        tenantId: 't1',
        level: 'individual',
        title: 'Complete 360 Review Implementation',
        metricTarget: 100,
        metricCurrent: 50, // 50% done
        weightPercentage: 35.0,
        status: 'in_progress',
      },
      {
        id: 'g3',
        tenantId: 't1',
        level: 'individual',
        title: 'Attain SOC2 / Security Audit Signoff',
        metricTarget: 100,
        metricCurrent: 20, // 20% done
        weightPercentage: 25.0,
        status: 'in_progress',
      },
    ];

    const validEval = calculateWeightedOkrProgress(validGoals);

    // Expected weighted progress: 40 * 1.0 + 35 * 0.5 + 25 * 0.2 = 40 + 17.5 + 5.0 = 62.5% -> 63%
    const invalidGoals: GoalOkrItem[] = [
      {
        id: 'g4',
        tenantId: 't1',
        level: 'individual',
        title: 'Single unweighted goal',
        metricTarget: 100,
        metricCurrent: 80,
        weightPercentage: 60.0, // only 60% total -> invalid!
        status: 'in_progress',
      },
    ];
    const invalidEval = calculateWeightedOkrProgress(invalidGoals);

    const okrValid =
      validEval.isValidWeighting &&
      validEval.totalWeight === 100.0 &&
      validEval.overallWeightedProgress === 63 &&
      !invalidEval.isValidWeighting;

    logResult('Cascading OKRs Weighting (100% Constraint) & Progress Rollup', okrValid);

    // ------------------------------------------------------------------------
    // 2. 360-Degree Multi-Rater Feedback Composite Scoring Test
    // ------------------------------------------------------------------------
    // Manager: 4.5 (40%), Peer: 4.0 (30%), Direct Report: 4.8 (20%), Self: 4.0 (10%)
    // Weighted Sum: 4.5*0.4 + 4.0*0.3 + 4.8*0.2 + 4.0*0.1 = 1.80 + 1.20 + 0.96 + 0.40 = 4.36
    const feedback360 = calculate360ReviewScore([
      { relationship: 'manager', score: 4.5 },
      { relationship: 'peer', score: 4.0 },
      { relationship: 'direct_report', score: 4.8 },
      { relationship: 'self', score: 4.0 },
    ]);

    const review360Passed =
      feedback360.compositeScore === 4.36 &&
      feedback360.ratingCategory === 'Strong Performer';

    logResult('360-Degree Multi-Rater Feedback Weighted Calibration', review360Passed);

    // ------------------------------------------------------------------------
    // 3. Compensation Bands & Strict RBAC Authorization Protection Test
    // ------------------------------------------------------------------------
    const salaryBands: CompensationBand[] = [
      {
        id: 'band-l4-swe',
        jobFamily: 'Engineering',
        levelCode: 'L4',
        title: 'Senior Software Engineer',
        minSalary: 350000,
        midSalary: 450000,
        maxSalary: 580000,
        currency: 'JMD',
      },
    ];

    // Privileged role test (hr_admin)
    const hrAccess = getAuthorizedCompensationBands('hr_admin', salaryBands);

    // Unprivileged role test (employee, recruiter)
    let unauthorizedBlocked = false;
    try {
      getAuthorizedCompensationBands('employee', salaryBands);
    } catch (err: unknown) {
      if (err instanceof Error && err.message.includes('Access Denied')) {
        unauthorizedBlocked = true;
      }
    }

    const rbacPassed = hrAccess.length === 1 && unauthorizedBlocked;
    logResult('Compensation Bands RBAC Authorization Guard', rbacPassed);

    // ------------------------------------------------------------------------
    // 4. Pulse Surveys with Enforced k-Anonymity (N < 5) & eNPS Test
    // ------------------------------------------------------------------------
    const testResponses: PulseSurveyResponse[] = [
      // Legal department: only 3 responses (< 5 threshold) -> MUST BE MASKED!
      { surveyId: 's1', department: 'Legal', score: 9, feedback: 'Great team' },
      { surveyId: 's1', department: 'Legal', score: 8, feedback: 'Fair work-life balance' },
      { surveyId: 's1', department: 'Legal', score: 4, feedback: 'Too much overtime' },

      // Engineering department: 8 responses (>= 5 threshold) -> SAFE TO AGGREGATE
      { surveyId: 's1', department: 'Engineering', score: 10, feedback: 'Love the tech stack' }, // promoter
      { surveyId: 's1', department: 'Engineering', score: 9, feedback: 'Super collaborative' },  // promoter
      { surveyId: 's1', department: 'Engineering', score: 9, feedback: 'Great culture' },        // promoter
      { surveyId: 's1', department: 'Engineering', score: 9, feedback: 'Empowering leadership' },// promoter
      { surveyId: 's1', department: 'Engineering', score: 8, feedback: 'Solid tooling' },         // passive
      { surveyId: 's1', department: 'Engineering', score: 8, feedback: 'Good sprint pace' },      // passive
      { surveyId: 's1', department: 'Engineering', score: 5, feedback: 'Need more documentation' },// detractor
      { surveyId: 's1', department: 'Engineering', score: 3, feedback: 'Too many meetings' },     // detractor
    ];

    // Case 4A: Legal Department with N=3 responses
    const legalReport = generatePulseSurveyReport(testResponses, 's1', 'Legal', 5);

    // Case 4B: Engineering Department with N=8 responses
    // Promoters: 4 (50%), Passives: 2 (25%), Detractors: 2 (25%) -> eNPS = 50 - 25 = +25.
    // Average score: (10+9+9+9+8+8+5+3)/8 = 61/8 = 7.6.
    const engReport = generatePulseSurveyReport(testResponses, 's1', 'Engineering', 5);

    const surveyAnonymityPassed =
      legalReport.isAnonymityProtected &&
      legalReport.averageScore === undefined &&
      legalReport.anonymizedComments === undefined &&
      Boolean(legalReport.maskReason?.includes('Minimum threshold')) &&
      !engReport.isAnonymityProtected &&
      engReport.totalResponses === 8 &&
      engReport.eNpsScore === 25 &&
      engReport.averageScore === 7.6 &&
      engReport.anonymizedComments?.length === 8;

    logResult(
      'Pulse Survey k-Anonymity (N < 5 Protection) & eNPS Calculation',
      surveyAnonymityPassed
    );

    // ------------------------------------------------------------------------
    // 5. 9-Box Talent Matrix & Attrition Risk Predictor Test
    // ------------------------------------------------------------------------
    // High performer underpaid and stagnant in role -> Critical attrition risk
    const atRiskStar = assessTalentAndAttritionRisk({
      employeeId: 'emp-top-01',
      employeeName: 'Rohan Marley',
      department: 'Engineering',
      performanceScore: 3, // High
      potentialScore: 3,   // High
      tenureYears: 3.5,
      monthsSinceLastPromotionOrRaise: 28, // > 24 months stagnant (+2)
      salaryCompaRatio: 0.82,              // < 90% compa-ratio (+3)
      // Star category (+2) -> Total Risk Score: 7 -> Critical!
    });

    // Solid professional fairly compensated
    const stableProfessional = assessTalentAndAttritionRisk({
      employeeId: 'emp-mid-02',
      employeeName: 'Beverley Manley',
      department: 'Operations',
      performanceScore: 3,
      potentialScore: 1, // Solid professional
      tenureYears: 2.0,
      monthsSinceLastPromotionOrRaise: 10,
      salaryCompaRatio: 1.05, // 105% of midpoint
    });

    const talentPassed =
      atRiskStar.boxCategory === 'star' &&
      atRiskStar.attritionRisk === 'critical' &&
      atRiskStar.attritionDrivers.length >= 2 &&
      stableProfessional.boxCategory === 'solid_professional' &&
      stableProfessional.attritionRisk === 'low';

    logResult('9-Box Talent Matrix & Data-Driven Attrition Risk Predictor', talentPassed);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err);
    results.push(`FATAL ERROR: ${msg}`);
    allPassed = false;
  }

  return { passed: allPassed, results };
}
