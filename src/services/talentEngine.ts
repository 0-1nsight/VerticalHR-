/**
 * VerticalHR Talent, Performance, Compensation & Engagement Engine
 * Implements:
 * 1. Cascading Goals & OKRs with weighted mathematical rollups
 * 2. 360-Degree Multi-Rater Reviews & Calibration
 * 3. Compensation Bands & Strict RBAC Authorization Protection
 * 4. Pulse Surveys with Enforced k-Anonymity (N < 5 threshold masking) & eNPS
 * 5. 9-Box Talent Matrix & Data-Driven Attrition Risk Predictor
 */

export interface GoalOkrItem {
  id: string;
  tenantId: string;
  parentGoalId?: string;
  level: 'company' | 'department' | 'individual';
  department?: string;
  ownerId?: string;
  title: string;
  metricTarget: number;
  metricCurrent: number;
  weightPercentage: number; // e.g. 25.0
  status: 'not_started' | 'in_progress' | 'at_risk' | 'completed';
}

export interface CompensationBand {
  id: string;
  jobFamily: string;
  levelCode: string;
  title: string;
  minSalary: number;
  midSalary: number;
  maxSalary: number;
  currency: string;
}

export interface PulseSurveyResponse {
  surveyId: string;
  department: string;
  score: number; // 0 to 10
  feedback?: string;
}

export interface PulseSurveyAggregatedReport {
  surveyId: string;
  department: string;
  totalResponses: number;
  isAnonymityProtected: boolean;
  maskReason?: string;
  averageScore?: number;
  eNpsScore?: number; // -100 to +100
  promotersCount?: number;
  passivesCount?: number;
  detractorsCount?: number;
  anonymizedComments?: string[];
}

export interface TalentAssessment {
  employeeId: string;
  employeeName: string;
  department: string;
  performanceScore: 1 | 2 | 3; // 1=Low, 2=Medium, 3=High
  potentialScore: 1 | 2 | 3;   // 1=Low, 2=Medium, 3=High
  boxCategory: 'star' | 'high_performer' | 'solid_professional' | 'high_potential' | 'core_player' | 'effective' | 'enigma' | 'dilemma' | 'underperformer';
  attritionRisk: 'low' | 'medium' | 'high' | 'critical';
  attritionDrivers: string[];
}

/**
 * Validates that an employee's individual OKRs sum up to 100% weight,
 * and computes overall weighted goal achievement.
 */
export function calculateWeightedOkrProgress(goals: GoalOkrItem[]): {
  isValidWeighting: boolean;
  totalWeight: number;
  overallWeightedProgress: number;
} {
  if (goals.length === 0) {
    return { isValidWeighting: true, totalWeight: 0, overallWeightedProgress: 0 };
  }

  const totalWeight = Math.round(goals.reduce((s, g) => s + g.weightPercentage, 0) * 100) / 100;
  const isValidWeighting = Math.abs(totalWeight - 100.0) < 0.01;

  // Calculate weighted progress
  let weightedProgressSum = 0;
  for (const g of goals) {
    const ratio = Math.min(1.0, Math.max(0, g.metricCurrent / g.metricTarget));
    weightedProgressSum += ratio * g.weightPercentage;
  }

  const overallWeightedProgress = totalWeight > 0 ? Math.round((weightedProgressSum / totalWeight) * 100) : 0;

  return {
    isValidWeighting,
    totalWeight,
    overallWeightedProgress,
  };
}

/**
 * Evaluates 360-degree feedback with weighted inputs:
 * Manager (40%), Peers (30%), Direct Reports (20%), Self (10%).
 */
export function calculate360ReviewScore(evaluations: Array<{
  relationship: 'manager' | 'peer' | 'direct_report' | 'self';
  score: number; // 1.0 to 5.0
}>): {
  compositeScore: number;
  ratingCategory: string;
} {
  const weights: Record<string, number> = {
    manager: 0.40,
    peer: 0.30,
    direct_report: 0.20,
    self: 0.10,
  };

  let totalWeight = 0;
  let weightedSum = 0;

  for (const ev of evaluations) {
    const w = weights[ev.relationship] || 0.25;
    weightedSum += ev.score * w;
    totalWeight += w;
  }

  const compositeScore = totalWeight > 0 ? Math.round((weightedSum / totalWeight) * 100) / 100 : 0;

  let ratingCategory = 'Meets Expectations';
  if (compositeScore >= 4.5) ratingCategory = 'Exceeds Expectations (Distinguished)';
  else if (compositeScore >= 3.8) ratingCategory = 'Strong Performer';
  else if (compositeScore >= 2.8) ratingCategory = 'Meets Expectations';
  else if (compositeScore >= 2.0) ratingCategory = 'Needs Improvement';
  else ratingCategory = 'Unsatisfactory';

  return { compositeScore, ratingCategory };
}

/**
 * Access Control Guard for Corporate Compensation & Salary Bands.
 * Only HR Admins, Super Admins, and Finance Directors can read or modify compensation data.
 */
const PRIVILEGED_COMPENSATION_ROLES = new Set(['super_admin', 'hr_admin', 'finance_director']);

export function getAuthorizedCompensationBands(
  userRole: string,
  allBands: CompensationBand[]
): CompensationBand[] {
  if (!PRIVILEGED_COMPENSATION_ROLES.has(userRole)) {
    throw new Error(
      `Access Denied: Role '${userRole}' is not authorized to access confidential salary bands or compensation records.`
    );
  }
  return [...allBands];
}

/**
 * Pulse Survey Anonymity Engine:
 * Strictly enforces k-anonymity (minimum threshold N >= 5).
 * If a department or demographic slice has fewer than 5 respondents, individual responses
 * and feedback MUST be masked to prevent retaliatory de-anonymization.
 */
export function generatePulseSurveyReport(
  responses: PulseSurveyResponse[],
  surveyId: string,
  department: string,
  minThreshold: number = 5
): PulseSurveyAggregatedReport {
  const filtered = responses.filter((r) => r.surveyId === surveyId && r.department === department);
  const totalResponses = filtered.length;

  // k-anonymity guarantee check
  if (totalResponses < minThreshold) {
    return {
      surveyId,
      department,
      totalResponses,
      isAnonymityProtected: true,
      maskReason: `Anonymity Protection Active: Only ${totalResponses} response(s) received for '${department}'. Minimum threshold of ${minThreshold} is required to prevent de-anonymization.`,
    };
  }

  // Calculate eNPS (Net Promoter Score)
  // Promoters: 9-10, Passives: 7-8, Detractors: 0-6
  let promoters = 0;
  let passives = 0;
  let detractors = 0;
  let totalScore = 0;

  for (const r of filtered) {
    totalScore += r.score;
    if (r.score >= 9) promoters++;
    else if (r.score >= 7) passives++;
    else detractors++;
  }

  const averageScore = Math.round((totalScore / totalResponses) * 10) / 10;
  const promoterPct = (promoters / totalResponses) * 100;
  const detractorPct = (detractors / totalResponses) * 100;
  const eNpsScore = Math.round(promoterPct - detractorPct);

  const anonymizedComments = filtered
    .map((r) => r.feedback)
    .filter((f): f is string => Boolean(f && f.trim().length > 0));

  return {
    surveyId,
    department,
    totalResponses,
    isAnonymityProtected: false,
    averageScore,
    eNpsScore,
    promotersCount: promoters,
    passivesCount: passives,
    detractorsCount: detractors,
    anonymizedComments,
  };
}

/**
 * Evaluates 9-Box Talent Grid and calculates attrition flight risk.
 */
export function assessTalentAndAttritionRisk(params: {
  employeeId: string;
  employeeName: string;
  department: string;
  performanceScore: 1 | 2 | 3;
  potentialScore: 1 | 2 | 3;
  tenureYears: number;
  monthsSinceLastPromotionOrRaise: number;
  salaryCompaRatio: number; // e.g. 0.85 = 85% of band midpoint
}): TalentAssessment {
  const {
    employeeId,
    employeeName,
    department,
    performanceScore,
    potentialScore,
    monthsSinceLastPromotionOrRaise,
    salaryCompaRatio,
  } = params;

  // Determine 9-Box Matrix Quadrant
  let boxCategory: TalentAssessment['boxCategory'] = 'core_player';
  if (performanceScore === 3 && potentialScore === 3) boxCategory = 'star';
  else if (performanceScore === 3 && potentialScore === 2) boxCategory = 'high_performer';
  else if (performanceScore === 3 && potentialScore === 1) boxCategory = 'solid_professional';
  else if (performanceScore === 2 && potentialScore === 3) boxCategory = 'high_potential';
  else if (performanceScore === 2 && potentialScore === 2) boxCategory = 'core_player';
  else if (performanceScore === 2 && potentialScore === 1) boxCategory = 'effective';
  else if (performanceScore === 1 && potentialScore === 3) boxCategory = 'enigma';
  else if (performanceScore === 1 && potentialScore === 2) boxCategory = 'dilemma';
  else boxCategory = 'underperformer';

  // Data-driven Attrition Risk calculation
  const attritionDrivers: string[] = [];
  let riskScore = 0;

  if (salaryCompaRatio < 0.90) {
    riskScore += 3;
    attritionDrivers.push(`Undercompensated relative to band midpoint (Compa-Ratio: ${Math.round(salaryCompaRatio * 100)}%)`);
  }

  if (monthsSinceLastPromotionOrRaise > 24) {
    riskScore += 2;
    attritionDrivers.push(`Stagnant career velocity (${monthsSinceLastPromotionOrRaise} months without advancement)`);
  }

  if (boxCategory === 'star' || boxCategory === 'high_performer') {
    // High performers are heavily courted by recruiters
    riskScore += 2;
    attritionDrivers.push('High-value talent susceptible to aggressive executive headhunting');
  }

  let attritionRisk: TalentAssessment['attritionRisk'] = 'low';
  if (riskScore >= 6) attritionRisk = 'critical';
  else if (riskScore >= 4) attritionRisk = 'high';
  else if (riskScore >= 2) attritionRisk = 'medium';

  return {
    employeeId,
    employeeName,
    department,
    performanceScore,
    potentialScore,
    boxCategory,
    attritionRisk,
    attritionDrivers,
  };
}

/**
 * Strict RBAC & Privacy Guard for 9-Box Talent Calibration & Predictive Attrition Data.
 * Non-privileged employees ('employee', 'contractor') must NEVER see company-wide talent
 * assessments, compa-ratios, or attrition flight risks of other employees.
 * - HR Admins, Super Admins, Directors: full access to organization talent pool.
 * - Line Managers / Supervisors: access restricted strictly to their direct subordinates.
 * - Regular Employees: access denied for company-wide data; at most own profile if enabled.
 */
export function getAuthorizedTalentAssessments(params: {
  userRole: string;
  currentEmployeeId?: string;
  directReportIds?: string[];
  allAssessments: TalentAssessment[];
}): TalentAssessment[] {
  const { userRole, directReportIds = [], allAssessments } = params;

  // 1. HR Admins & Executive Leadership: Company-wide talent calibration access
  if (['super_admin', 'hr_admin', 'admin', 'hr_manager', 'finance_director'].includes(userRole)) {
    return [...allAssessments];
  }

  // 2. Line Managers & Supervisors: Restricted exclusively to direct subordinates
  if (['line_manager', 'supervisor'].includes(userRole)) {
    const authorizedIds = new Set(directReportIds);
    return allAssessments.filter(a => authorizedIds.has(a.employeeId));
  }

  // 3. Regular Employees: Strictly BLOCKED from viewing other employees
  if (userRole === 'employee' || userRole === 'contractor') {
    throw new Error(
      `Access Denied: Role '${userRole}' is not authorized to access confidential 9-box talent assessments or attrition flight risk data of other employees.`
    );
  }

  throw new Error(`Access Denied: Role '${userRole}' is not authorized to access confidential talent assessments.`);
}

