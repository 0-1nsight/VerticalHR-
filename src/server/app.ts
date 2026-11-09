import { Router, Request, Response } from 'express';
import { authenticateUser } from './middleware/auth';
import { authRouter } from './routes/auth';
import { employeesRouter } from './routes/employees';
import { performanceRouter } from './routes/performance';
import { leaveRouter } from './routes/leave';
import { attendanceRouter } from './routes/attendance';
import { payrollRouter } from './routes/payroll';
import { complianceRouter } from './routes/compliance';
import { auditRouter } from './routes/audit';

export const apiRouter = Router();

// Health check endpoint
apiRouter.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'VerticalHRM Multi-Tenant REST API',
    version: '1.0.0',
    statutoryEngine: 'Jamaica Tax Administration (TAJ) 2026 Compliant',
  });
});

// Documentation index of all available endpoints
apiRouter.get('/docs', (_req: Request, res: Response) => {
  res.json({
    endpoints: [
      { method: 'GET', path: '/api/health', description: 'System health check & engine status' },
      { method: 'POST', path: '/api/auth/login', description: 'Authenticate user & issue session token' },
      { method: 'GET', path: '/api/auth/me', description: 'Get current authenticated identity & tenant context' },
      { method: 'GET', path: '/api/employees', description: 'List employee directory (sanitized for non-HR callers)' },
      { method: 'GET', path: '/api/employees/:id', description: 'Get specific employee details (redacted for non-HR)' },
      { method: 'POST', path: '/api/employees', description: 'Create employee record (HR Admin only)' },
      { method: 'GET', path: '/api/performance/talent-matrix', description: '9-Box talent matrix (RESTRICTED: 403 for regular employees, direct reports only for managers)' },
      { method: 'GET', path: '/api/performance/compensation-bands', description: 'Corporate compensation salary bands (RESTRICTED to HR & Finance)' },
      { method: 'GET', path: '/api/performance/pulse-surveys', description: 'Pulse survey sentiment with k-anonymity (N >= 5)' },
      { method: 'POST', path: '/api/performance/360-score', description: 'Multi-rater 360-degree weighted calibration' },
      { method: 'GET', path: '/api/leave/requests', description: 'List employee leave requests' },
      { method: 'POST', path: '/api/leave/requests', description: 'Submit statutory leave request' },
      { method: 'GET', path: '/api/leave/balances', description: 'Retrieve immutable ledger balances' },
      { method: 'POST', path: '/api/attendance/punch', description: 'Record clock-in/out with GPS Haversine verification' },
      { method: 'GET', path: '/api/attendance/records', description: 'Daily attendance logs' },
      { method: 'POST', path: '/api/payroll/calculate', description: 'Calculate Jamaican statutory deductions (PAYE, NIS, NHT, Ed Tax, HEART)' },
      { method: 'GET', path: '/api/payroll/s01-schedule', description: 'Tax Administration Jamaica monthly S01 return' },
      { method: 'GET', path: '/api/compliance/summary', description: 'FICA / KYC compliance metrics' },
      { method: 'POST', path: '/api/compliance/screen', description: 'Screen individual against OFAC & Jamaica FID sanctions' },
      { method: 'GET', path: '/api/audit/logs', description: 'Query immutable cryptographic audit logs' },
      { method: 'POST', path: '/api/audit/verify', description: 'Verify SHA-256 audit chain integrity' },
    ],
  });
});

// Apply multi-tenant auth context to all downstream routes
apiRouter.use(authenticateUser);

// Mount feature routers
apiRouter.use('/auth', authRouter);
apiRouter.use('/employees', employeesRouter);
apiRouter.use('/performance', performanceRouter);
apiRouter.use('/leave', leaveRouter);
apiRouter.use('/attendance', attendanceRouter);
apiRouter.use('/payroll', payrollRouter);
apiRouter.use('/compliance', complianceRouter);
apiRouter.use('/audit', auditRouter);
