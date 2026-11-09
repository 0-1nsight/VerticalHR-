import { Router, Response } from 'express';
import { AuthenticatedRequest, requireRoles } from '../middleware/auth';

export const employeesRouter = Router();

// Sample dataset
const employeesDb = [
  {
    id: 'emp-000',
    employeeId: 'EMP000',
    firstName: 'Marcus',
    lastName: 'Vance',
    email: 'marcus.vance@verticalhrm.com',
    jobTitle: 'Chief Executive Officer',
    department: 'Executive & Strategy',
    employmentType: 'full_time',
    salary: 1250000,
    bankAccountNumber: '00987654321',
    trn: '123-456-789',
    nis: 'A1234567',
    ficaTier: 'tier_1_enhanced',
  },
  {
    id: 'emp-001',
    employeeId: 'EMP001',
    firstName: 'John',
    lastName: 'Doe',
    email: 'employee@verticalhrm.com',
    jobTitle: 'Senior Software Engineer',
    department: 'Engineering',
    employmentType: 'full_time',
    salary: 450000,
    bankAccountNumber: '00123456789',
    trn: '987-654-321',
    nis: 'B9876543',
    ficaTier: 'tier_2_standard',
  },
  {
    id: 'emp-002',
    employeeId: 'EMP002',
    firstName: 'Patricia',
    lastName: 'Sterling',
    email: 'patricia.sterling@verticalhrm.com',
    jobTitle: 'Human Resources Director',
    department: 'Human Resources',
    employmentType: 'full_time',
    salary: 580000,
    bankAccountNumber: '00456789123',
    trn: '456-789-123',
    nis: 'C4567891',
    ficaTier: 'tier_1_enhanced',
  },
];

/**
 * GET /api/employees
 * Privacy Rule:
 * If caller is 'employee', sensitive banking, TRN, NIS, and salary fields are REDACTED for all other employees!
 */
employeesRouter.get('/', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const isPrivileged = user && ['super_admin', 'hr_admin', 'admin', 'hr_manager', 'auditor'].includes(user.role);

  const sanitized = employeesDb.map(emp => {
    // If privileged or viewing own profile, return complete data
    if (isPrivileged || (user && (user.employeeId === emp.employeeId || user.id === emp.id))) {
      return emp;
    }

    // Otherwise, redact sensitive compensation, banking, and statutory IDs
    return {
      id: emp.id,
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      jobTitle: emp.jobTitle,
      department: emp.department,
      employmentType: emp.employmentType,
      // Redacted fields
      salary: undefined,
      bankAccountNumber: undefined,
      trn: undefined,
      nis: undefined,
      ficaTier: undefined,
    };
  });

  return res.json({ employees: sanitized });
});

employeesRouter.get('/:id', (req: AuthenticatedRequest, res: Response) => {
  const user = req.user;
  const emp = employeesDb.find(e => e.id === req.params.id || e.employeeId === req.params.id);
  if (!emp) {
    return res.status(404).json({ error: 'Employee not found' });
  }

  const isPrivileged = user && ['super_admin', 'hr_admin', 'admin', 'hr_manager', 'auditor'].includes(user.role);
  if (isPrivileged || (user && (user.employeeId === emp.employeeId || user.id === emp.id))) {
    return res.json({ employee: emp });
  }

  // Redacted public profile view
  return res.json({
    employee: {
      id: emp.id,
      employeeId: emp.employeeId,
      firstName: emp.firstName,
      lastName: emp.lastName,
      email: emp.email,
      jobTitle: emp.jobTitle,
      department: emp.department,
      employmentType: emp.employmentType,
    },
  });
});

employeesRouter.post('/', requireRoles(['super_admin', 'hr_admin', 'admin']), (req: AuthenticatedRequest, res: Response) => {
  const newEmp = {
    id: `emp-${Date.now()}`,
    employeeId: `EMP${Math.floor(100 + Math.random() * 900)}`,
    ...req.body,
  };
  employeesDb.push(newEmp);
  return res.status(201).json({ employee: newEmp });
});
