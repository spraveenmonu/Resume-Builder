import { Request, Response, NextFunction } from 'express';
import { createErrorResponse } from '@careercraft/shared';
import { ErrorCodes } from '../constants/error-codes.js';

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('[CareerCraft Error]', err);

  if (err.name === 'UnauthorizedError') {
    return res.status(401).json(
      createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Invalid or expired token')
    );
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json(
      createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Malformed JSON payload')
    );
  }

  const statusCode = err.statusCode || err.status || 500;
  const message = statusCode === 500 && process.env.NODE_ENV === 'production'
    ? 'An unexpected internal error occurred'
    : err.message || 'Internal server error';

  res.status(statusCode).json(
    createErrorResponse(
      err.code || ErrorCodes.INTERNAL_ERROR,
      message,
      err.fieldErrors
    )
  );
}
