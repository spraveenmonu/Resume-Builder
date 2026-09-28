import { Request, Response, NextFunction } from 'express';
import { UserService } from '../services/user.service.js';
import { createSuccessResponse, createErrorResponse } from '@careercraft/shared';
import { ErrorCodes } from '../constants/error-codes.js';

export class UserController {
  static async getProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const profile = await UserService.getProfile(req.user.id);
      res.status(200).json(createSuccessResponse({ user: profile }));
    } catch (err) {
      next(err);
    }
  }

  static async updateProfile(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const updated = await UserService.updateProfile(req.user.id, req.body);
      res.status(200).json(createSuccessResponse({ user: updated }));
    } catch (err) {
      next(err);
    }
  }

  static async uploadAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      if (!req.file) {
        return res.status(400).json(
          createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'No image file provided')
        );
      }

      const validMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
      if (!validMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json(
          createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Only JPG, PNG, and WebP images are allowed')
        );
      }

      const result = await UserService.updateAvatar(req.user.id, req.file.buffer);
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  static async deleteAvatar(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const result = await UserService.deleteAvatar(req.user.id);
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  static async changePassword(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const result = await UserService.changePassword(req.user.id, req.body);
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  static async changeEmail(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const result = await UserService.changeEmail(req.user.id, req.body);
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  static async getSessions(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const currentRefresh = req.cookies['careercraft_refresh'];
      const sessions = await UserService.getSessions(req.user.id, currentRefresh);
      res.status(200).json(createSuccessResponse({ sessions }));
    } catch (err) {
      next(err);
    }
  }

  static async revokeSession(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const result = await UserService.revokeSession(req.user.id, req.params.id);
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  static async getOAuthAccounts(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const accounts = await UserService.getConnectedOAuthAccounts(req.user.id);
      res.status(200).json(createSuccessResponse({ accounts }));
    } catch (err) {
      next(err);
    }
  }

  static async unlinkOAuthAccount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const result = await UserService.unlinkOAuthAccount(req.user.id, req.params.id);
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  static async exportData(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const data = await UserService.exportUserData(req.user.id);

      res.setHeader('Content-Type', 'application/json');
      res.setHeader('Content-Disposition', `attachment; filename=careercraft-user-data-${req.user.id}.json`);
      res.status(200).send(JSON.stringify(data, null, 2));
    } catch (err) {
      next(err);
    }
  }

  static async deleteAccount(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));
      const result = await UserService.deleteAccount(req.user.id, req.body);
      res.clearCookie('careercraft_refresh', { path: '/api/v1/auth' });
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }
}
