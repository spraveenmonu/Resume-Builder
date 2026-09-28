import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '@careercraft/shared';
import { ErrorCodes } from '../constants/error-codes.js';

export function requireRole(...allowedRoles: Array<'USER' | 'ADMIN'>) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return res.status(401).json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication required')
      );
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json(
        createErrorResponse(ErrorCodes.FORBIDDEN, 'You do not have permission to access this resource')
      );
    }

    next();
  };
}
