import rateLimit from 'express-rate-limit';
import { createErrorResponse } from '@careercraft/shared';
import { ErrorCodes } from '../constants/error-codes.js';

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => {
    const ip = req.ip || req.socket.remoteAddress || 'unknown';
    const email = req.body?.email ? String(req.body.email).toLowerCase() : '';
    return `${ip}:${email}`;
  },
  handler: (req, res) => {
    res.status(429).json(
      createErrorResponse(
        ErrorCodes.RATE_LIMITED,
        'Too many attempts. Please try again in 15 minutes.'
      )
    );
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    res.status(429).json(
      createErrorResponse(
        ErrorCodes.RATE_LIMITED,
        'Too many requests. Please slow down.'
      )
    );
  },
});
