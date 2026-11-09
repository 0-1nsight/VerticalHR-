import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRoles } from '../middleware/auth';
import { auditLogService } from '../../services/audit';

export const auditRouter = Router();

// Only Super Admins, HR Admins, and Compliance Auditors can query the immutable audit logs
auditRouter.get('/logs', requireRoles(['super_admin', 'hr_admin', 'admin', 'auditor']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId || 't-apex-financial';
  const logs = auditLogService.getLogs(tenantId);
  return res.json({ logs });
});

auditRouter.post('/verify', requireRoles(['super_admin', 'hr_admin', 'admin', 'auditor']), (req: AuthenticatedRequest, res: Response) => {
  const tenantId = req.tenantId || 't-apex-financial';
  const isValid = auditLogService.verifyChain(tenantId);
  return res.json({
    tenantId,
    chainIntegrityVerified: isValid,
    verifiedAt: new Date().toISOString(),
  });
});
