import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { calculateWorkingDays } from '../../services/leaveEngine';

export const leaveRouter = Router();

const leaveRequestsDb = [
  { id: 'lr-1', employeeId: 'EMP001', leaveType: 'annual', startDate: '2026-12-20', endDate: '2026-12-24', days: 5, status: 'approved' },
  { id: 'lr-2', employeeId: 'EMP002', leaveType: 'sick', startDate: '2026-11-01', endDate: '2026-11-02', days: 2, status: 'completed' },
];

leaveRouter.get('/requests', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  if (!user) return res.status(401).json({ error: 'Unauthorized' });

  // Employees only see their own requests
  if (user.role === 'employee') {
    const ownRequests = leaveRequestsDb.filter(r => r.employeeId === user.employeeId || r.employeeId === user.id);
    return res.json({ requests: ownRequests });
  }

  return res.json({ requests: leaveRequestsDb });
});

leaveRouter.post('/requests', (req: AuthenticatedRequest, res: Response) => {
  const { leaveType, startDate, endDate, reason } = req.body;
  if (!leaveType || !startDate || !endDate) {
    return res.status(400).json({ error: 'Missing mandatory leave fields' });
  }

  const workDays = calculateWorkingDays(startDate, endDate);

  const newRequest = {
    id: `lr-${Date.now()}`,
    employeeId: req.user?.employeeId || 'EMP001',
    leaveType,
    startDate,
    endDate,
    days: workDays,
    reason,
    status: 'pending',
  };

  leaveRequestsDb.push(newRequest);
  return res.status(201).json({ request: newRequest });
});

leaveRouter.get('/balances', (req: AuthenticatedRequest, res: Response) => {
  return res.json({
    annual: { total: 15, used: 5, balance: 10 },
    sick: { total: 10, used: 2, balance: 8 },
    maternity: { total: 60, used: 0, balance: 60 },
  });
});
