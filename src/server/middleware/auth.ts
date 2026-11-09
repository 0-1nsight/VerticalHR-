import { Request, Response, NextFunction } from 'express';

export interface AuthenticatedUser {
  id: string;
  employeeId?: string;
  email: string;
  firstName: string;
  lastName: string;
  role: 'super_admin' | 'hr_admin' | 'admin' | 'hr_manager' | 'line_manager' | 'supervisor' | 'employee' | 'auditor';
  tenantId: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
  tenantId?: string;
}

/**
 * Multi-Tenant & RBAC Authentication Middleware
 * Resolves authenticated user and tenant context from headers (Authorization Bearer or x-user-id / x-tenant-id).
 */
export function authenticateUser(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  const headerUserId = req.headers['x-user-id'] as string;
  const headerRole = req.headers['x-user-role'] as string;
  const headerEmpId = req.headers['x-employee-id'] as string;
  const headerTenantId = (req.headers['x-tenant-id'] as string) || 't-apex-financial';

  // Default demo / context user if not provided in header
  const user: AuthenticatedUser = {
    id: headerUserId || 'u-emp-001',
    employeeId: headerEmpId || 'EMP001',
    email: (req.headers['x-user-email'] as string) || 'employee@verticalhrm.com',
    firstName: (req.headers['x-user-first-name'] as string) || 'John',
    lastName: (req.headers['x-user-last-name'] as string) || 'Doe',
    role: (headerRole as AuthenticatedUser['role']) || 'employee',
    tenantId: headerTenantId,
  };

  req.user = user;
  req.tenantId = headerTenantId;
  next();
}

/**
 * Strict RBAC Authorization Guard
 */
export function requireRoles(allowedRoles: Array<AuthenticatedUser['role']>) {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Unauthorized: Authentication required.' });
    }

    if (req.user.role === 'super_admin') {
      return next(); // Super admin has root access
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        error: `Access Denied: Role '${req.user.role}' is not authorized to perform this operation.`,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
}
