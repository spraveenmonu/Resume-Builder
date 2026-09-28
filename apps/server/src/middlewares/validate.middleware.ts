import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { createErrorResponse, ApiFieldError } from '@careercraft/shared';
import { ErrorCodes } from '../constants/error-codes.js';

export function validateRequest(schema: ZodSchema, source: 'body' | 'query' | 'params' = 'body') {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      req[source] = parsed;
      next();
    } catch (err) {
      if (err instanceof ZodError) {
        const fieldErrors: ApiFieldError = {};
        for (const issue of err.issues) {
          const path = issue.path.join('.');
          if (!fieldErrors[path]) {
            fieldErrors[path] = [];
          }
          fieldErrors[path].push(issue.message);
        }

        return res.status(400).json(
          createErrorResponse(
            ErrorCodes.VALIDATION_ERROR,
            'Validation failed for request parameters',
            fieldErrors
          )
        );
      }
      next(err);
    }
  };
}
