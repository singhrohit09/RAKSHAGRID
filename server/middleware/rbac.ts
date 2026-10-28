import { Request, Response, NextFunction } from 'express';
import { Permission } from '../../src/types/role.js';
import { hasServerPermission } from '../auth/roles.js';

export function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Authentication required before checking permissions.',
        code: 'UNAUTHENTICATED'
      });
      return;
    }

    if (!hasServerPermission(req.user.role, permission)) {
      res.status(403).json({
        error: `Access denied. Role '${req.user.role}' lacks '${permission}' authorization.`,
        code: 'FORBIDDEN',
        requiredPermission: permission,
        role: req.user.role
      });
      return;
    }

    next();
  };
}
