import { Router } from 'express';
import { AuthController } from '../controllers/auth.controller.js';
import { validateRequest } from '../middlewares/validate.middleware.js';
import { requireAuth } from '../middlewares/auth.middleware.js';
import { authRateLimiter } from '../middlewares/rate-limit.middleware.js';
import {
  signupSchema,
  loginSchema,
  verifyEmailSchema,
  resendVerificationSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  totpVerifySchema,
  totpDisableSchema,
} from '@careercraft/shared';

const router = Router();

// Public auth routes
router.post('/signup', authRateLimiter, validateRequest(signupSchema), AuthController.signup);
router.post('/verify-email', validateRequest(verifyEmailSchema), AuthController.verifyEmail);
router.post('/resend-verification', authRateLimiter, validateRequest(resendVerificationSchema), AuthController.resendVerification);
router.post('/login', authRateLimiter, validateRequest(loginSchema), AuthController.login);
router.post('/refresh', AuthController.refresh);
router.post('/forgot-password', authRateLimiter, validateRequest(forgotPasswordSchema), AuthController.forgotPassword);
router.post('/reset-password', validateRequest(resetPasswordSchema), AuthController.resetPassword);

// OAuth
router.get('/oauth/google/callback', AuthController.oauthGoogleCallback);
router.get('/oauth/github/callback', AuthController.oauthGithubCallback);

// Authenticated session & 2FA routes
router.post('/logout', requireAuth, AuthController.logout);
router.post('/logout-all', requireAuth, AuthController.logoutAll);
router.post('/2fa/setup', requireAuth, AuthController.setup2FA);
router.post('/2fa/verify', requireAuth, validateRequest(totpVerifySchema), AuthController.verify2FA);
router.post('/2fa/disable', requireAuth, validateRequest(totpDisableSchema), AuthController.disable2FA);

export const authRoutes = router;
