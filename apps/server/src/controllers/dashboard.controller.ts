import { Request, Response, NextFunction } from 'express';
import { DashboardService } from '../services/dashboard.service.js';
import { createSuccessResponse, createErrorResponse } from '@careercraft/shared';
import { ErrorCodes } from '../constants/error-codes.js';

export class DashboardController {
  static async getSummary(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const summary = await DashboardService.getSummary(req.user.id);
      res.status(200).json(createSuccessResponse(summary));
    } catch (err) {
      next(err);
    }
  }
}
