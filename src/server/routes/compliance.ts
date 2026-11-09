import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { screenAgainstSanctionsWatchlist } from '../../services/complianceEngine';

export const complianceRouter = Router();

complianceRouter.get('/summary', requireRoles(['super_admin', 'hr_admin', 'admin', 'auditor']), (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    complianceRate: 98.4,
    overdueVerifications: 0,
    watchlistAlerts: 0,
    highRiskPersonnelCount: 1,
    lastAuditDate: new Date().toISOString(),
  });
});

complianceRouter.post('/screen', requireRoles(['super_admin', 'hr_admin', 'admin', 'auditor']), (req: AuthenticatedRequest, res: Response) => {
  const { queryName, entityType } = req.body;
  if (!queryName) return res.status(400).json({ error: 'queryName is required' });

  const result = screenAgainstSanctionsWatchlist(queryName, entityType || 'individual');
  return res.json({ result });
});
