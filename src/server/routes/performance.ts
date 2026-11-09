import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { 
  assessTalentAndAttritionRisk, 
  getAuthorizedTalentAssessments, 
  getAuthorizedCompensationBands,
  generatePulseSurveyReport,
  calculate360ReviewScore,
  CompensationBand,
  PulseSurveyResponse
} from '../../services/talentEngine';

export const performanceRouter = Router();

// Sample in-memory talent pool for API serving
const demoEmployees = [
  { id: 'emp-000', employeeId: 'EMP000', name: 'Marcus Vance', department: 'Executive & Strategy', perf: 3, pot: 3, compa: 0.84, stagnant: 28, reportsTo: undefined },
  { id: 'emp-001', employeeId: 'EMP001', name: 'John Doe', department: 'Engineering', perf: 1, pot: 2, compa: 1.05, stagnant: 12, reportsTo: 'EMP004' },
  { id: 'emp-002', employeeId: 'EMP002', name: 'Patricia Sterling', department: 'Human Resources', perf: 1, pot: 2, compa: 1.02, stagnant: 14, reportsTo: 'EMP003' },
  { id: 'emp-003', employeeId: 'EMP003', name: 'Sarah Smith', department: 'Human Resources', perf: 2, pot: 3, compa: 1.00, stagnant: 10, reportsTo: 'EMP000' },
  { id: 'emp-004', employeeId: 'EMP004', name: 'David Chen', department: 'Engineering', perf: 2, pot: 3, compa: 0.98, stagnant: 16, reportsTo: 'EMP000' },
  { id: 'emp-005', employeeId: 'EMP005', name: 'Maya Lin', department: 'Engineering', perf: 3, pot: 3, compa: 1.04, stagnant: 8, reportsTo: 'EMP004' },
];

/**
 * GET /api/performance/talent-matrix
 * STRICT RBAC & PRIVACY RULE:
 * - Regular employees ('employee', 'contractor') receive 403 Forbidden.
 *   They CANNOT view company-wide 9-Box talent calibrations or attrition flight risks!
 * - Line managers ('line_manager', 'supervisor') receive ONLY their direct reports.
 * - HR Admins, Super Admins, and HR Managers receive full organization calibration.
 */
performanceRouter.get('/talent-matrix', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // 1. Employee Privacy Enforcement
  if (user.role === 'employee' || user.role === 'contractor') {
    return res.status(403).json({
      error: 'Access Denied: Company-wide 9-Box talent matrix assessments and predictive attrition flight risks are strictly confidential to People Managers and HR Administrators.',
      code: 'PRIVACY_PROTECTED_CONFIDENTIAL_METRICS',
    });
  }

  // Build assessment list
  const allAssessments = demoEmployees.map(emp => 
    assessTalentAndAttritionRisk({
      employeeId: emp.id,
      employeeName: emp.name,
      department: emp.department,
      performanceScore: emp.perf as 1 | 2 | 3,
      potentialScore: emp.pot as 1 | 2 | 3,
      tenureYears: 3.0,
      monthsSinceLastPromotionOrRaise: emp.stagnant,
      salaryCompaRatio: emp.compa,
    })
  );

  // Line Managers: resolve their direct subordinates only
  const directReportIds = demoEmployees
    .filter(e => e.reportsTo === user.employeeId || e.reportsTo === user.id)
    .map(e => e.id);

  try {
    const authorized = getAuthorizedTalentAssessments({
      userRole: user.role,
      currentEmployeeId: user.employeeId,
      directReportIds,
      allAssessments,
    });

    return res.json({
      role: user.role,
      totalAccessible: authorized.length,
      assessments: authorized,
    });
  } catch (err: unknown) {
    return res.status(403).json({ error: err instanceof Error ? err.message : String(err) });
  }
});

/**
 * GET /api/performance/compensation-bands
 * Protected by RBAC: Only Super Admin, HR Admin, Finance Director
 */
performanceRouter.get(
  '/compensation-bands',
  requireRoles(['super_admin', 'hr_admin', 'admin']),
  (req: AuthenticatedRequest, res: Response) => {
    const sampleBands: CompensationBand[] = [
      { id: 'b1', jobFamily: 'Engineering', levelCode: 'L3', title: 'Mid Software Engineer', minSalary: 280000, midSalary: 350000, maxSalary: 420000, currency: 'JMD' },
      { id: 'b2', jobFamily: 'Engineering', levelCode: 'L4', title: 'Senior Software Engineer', minSalary: 420000, midSalary: 520000, maxSalary: 650000, currency: 'JMD' },
      { id: 'b3', jobFamily: 'Finance', levelCode: 'L4', title: 'Senior Financial Analyst', minSalary: 380000, midSalary: 470000, maxSalary: 580000, currency: 'JMD' },
      { id: 'b4', jobFamily: 'Human Resources', levelCode: 'L5', title: 'HR Director', minSalary: 600000, midSalary: 750000, maxSalary: 950000, currency: 'JMD' },
    ];

    try {
      const authorized = getAuthorizedCompensationBands(req.user?.role || '', sampleBands);
      return res.json({ bands: authorized });
    } catch (err: unknown) {
      return res.status(403).json({ error: err instanceof Error ? err.message : String(err) });
    }
  }
);

/**
 * GET /api/performance/pulse-surveys
 * Pulse survey sentiment with guaranteed k-anonymity (N >= 5)
 */
performanceRouter.get('/pulse-surveys', (req: AuthenticatedRequest, res: Response) => {
  const department = (req.query.department as string) || 'Engineering';

  const sampleResponses: PulseSurveyResponse[] = [
    { surveyId: 'pulse-q4', department: 'Legal', score: 8, feedback: 'Collaborative team' },
    { surveyId: 'pulse-q4', department: 'Legal', score: 7, feedback: 'Good balance' },
    { surveyId: 'pulse-q4', department: 'Legal', score: 4, feedback: 'Tight deadlines' },
    { surveyId: 'pulse-q4', department: 'Engineering', score: 10, feedback: 'Great leadership' },
    { surveyId: 'pulse-q4', department: 'Engineering', score: 9, feedback: 'Supportive peers' },
    { surveyId: 'pulse-q4', department: 'Engineering', score: 9, feedback: 'Modern tech' },
    { surveyId: 'pulse-q4', department: 'Engineering', score: 9, feedback: 'Autonomous work' },
    { surveyId: 'pulse-q4', department: 'Engineering', score: 8, feedback: 'Good benefits' },
  ];

  const report = generatePulseSurveyReport(sampleResponses, 'pulse-q4', department, 5);
  return res.json({ report });
});

/**
 * POST /api/performance/360-score
 * Computes weighted multi-rater calibration
 */
performanceRouter.post('/360-score', (req: AuthenticatedRequest, res: Response) => {
  const evaluations = req.body?.evaluations || [];
  const result = calculate360ReviewScore(evaluations);
  return res.json(result);
});
