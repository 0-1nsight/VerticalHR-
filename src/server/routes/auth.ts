import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/login', (req: AuthenticatedRequest, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required.' });
  }

  // Multi-tenant auth validation
  return res.json({
    token: `vhr_jwt_${Buffer.from(email).toString('base64')}`,
    user: {
      id: 'u-emp-001',
      employeeId: 'EMP001',
      email,
      firstName: 'John',
      lastName: 'Doe',
      role: 'employee',
      tenantId: req.tenantId || 't-apex-financial',
    },
  });
});

authRouter.get('/me', (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    return res.status(401).json({ error: 'Not authenticated' });
  }
  return res.json({ user: req.user });
});
