import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../middleware/auth';
import { punchProcessor, WorkSiteLocation } from '../../services/attendance';

export const attendanceRouter = Router();

const defaultSite: WorkSiteLocation = {
  id: 'site-kingston',
  tenantId: 't-apex-financial',
  name: 'Kingston Financial Centre',
  latitude: 18.0179,
  longitude: -76.8099,
  radiusMeters: 250,
};

attendanceRouter.post('/punch', (req: AuthenticatedRequest, res: Response) => {
  const { punchType, latitude, longitude, offlineIdempotencyKey } = req.body;
  const employeeId = req.user?.employeeId || 'EMP001';

  const result = punchProcessor.processPunch({
    id: `p-${Date.now()}`,
    tenantId: req.tenantId || 't-apex-financial',
    employeeId,
    timestamp: new Date().toISOString(),
    type: punchType || 'clock_in',
    offlineIdempotencyKey: offlineIdempotencyKey || `key-${Date.now()}`,
    latitude,
    longitude,
    workSite: defaultSite,
  });

  return res.json({ result });
});

attendanceRouter.get('/records', (req: AuthenticatedRequest, res: Response) => {
  const records = punchProcessor.getDailyAttendance('2026-11-08');
  return res.json({ records });
});
