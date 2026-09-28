import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { createErrorResponse } from '@careercraft/shared';
import { ErrorCodes } from '../constants/error-codes.js';

export interface AuthenticatedUser {
  id: string;
  email: string;
  role: 'USER' | 'ADMIN';
  name: string;
  isEmailVerified: boolean;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export async function requireAuth(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Authentication token missing or invalid')
      );
    }

    const token = authHeader.split(' ')[1];
    let payload: any;
    try {
      payload = jwt.verify(token, env.JWT_ACCESS_SECRET);
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json(
          createErrorResponse(ErrorCodes.TOKEN_EXPIRED, 'Access token has expired')
        );
      }
      return res.status(401).json(
        createErrorResponse(ErrorCodes.TOKEN_INVALID, 'Access token is invalid')
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        name: true,
        isEmailVerified: true,
        deletedAt: true,
      },
    });

    if (!user || user.deletedAt !== null) {
      return res.status(401).json(
        createErrorResponse(ErrorCodes.UNAUTHORIZED, 'User account not found or deactivated')
      );
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role,
      name: user.name,
      isEmailVerified: user.isEmailVerified,
    };

    next();
  } catch (err) {
    next(err);
  }
}
