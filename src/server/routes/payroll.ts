import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { calculateJamaicanStatutoryDeductions, generateTajS01MonthlySchedule } from '../../services/payrollEngine';

export const payrollRouter = Router();

// Payroll calculations restricted to HR and Finance Admins
payrollRouter.post('/calculate', requireRoles(['super_admin', 'hr_admin', 'admin', 'hr_manager', 'auditor']), (req: AuthenticatedRequest, res: Response) => {
  const { grossSalaryCents, year } = req.body;
  if (!grossSalaryCents || typeof grossSalaryCents !== 'number') {
    return res.status(400).json({ error: 'grossSalaryCents is required as an integer in minor units (cents)' });
  }

  const result = calculateJamaicanStatutoryDeductions(grossSalaryCents, year || 2026);
  return res.json({ result });
});

payrollRouter.get('/s01-schedule', requireRoles(['super_admin', 'hr_admin', 'admin', 'auditor']), (req: AuthenticatedRequest, res: Response) => {
  const sampleItems = [
    { employeeId: 'EMP001', name: 'John Doe', trn: '987-654-321', nis: 'B9876543', deductions: calculateJamaicanStatutoryDeductions(45000000, 2026) },
    { employeeId: 'EMP002', name: 'Patricia Sterling', trn: '456-789-123', nis: 'C4567891', deductions: calculateJamaicanStatutoryDeductions(58000000, 2026) },
  ];

  const s01 = generateTajS01MonthlySchedule('t-apex-financial', '2026-11', sampleItems);
  return res.json({ s01 });
});
