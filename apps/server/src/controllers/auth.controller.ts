import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/auth.service.js';
import { TotpService } from '../services/totp.service.js';
import { createSuccessResponse, createErrorResponse } from '@careercraft/shared';
import { env } from '../config/env.js';
import { prisma } from '../config/prisma.js';
import { ErrorCodes } from '../constants/error-codes.js';

const REFRESH_COOKIE_NAME = 'careercraft_refresh';

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'lax' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
};

export class AuthController {
  static async signup(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.signup(
        req.body,
        req.ip || req.socket.remoteAddress,
        req.headers['user-agent']
      );
      res.status(201).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  static async verifyEmail(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.verifyEmail(
        req.body.token,
        req.ip || req.socket.remoteAddress,
        req.headers['user-agent']
      );
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  static async resendVerification(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.resendVerification(req.body.email);
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  static async login(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.login(
        req.body,
        req.ip || req.socket.remoteAddress,
        req.headers['user-agent']
      );

      if (result.requires2FA) {
        return res.status(200).json(createSuccessResponse({ requires2FA: true }));
      }

      if (result.refreshToken) {
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);
      }

      res.status(200).json(
        createSuccessResponse({
          accessToken: result.accessToken,
          user: result.user,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  static async refresh(req: Request, res: Response, next: NextFunction) {
    try {
      const plainToken = req.cookies[REFRESH_COOKIE_NAME];
      if (!plainToken) {
        return res.status(401).json(
          createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Refresh token cookie missing')
        );
      }

      const result = await AuthService.rotateRefreshToken(
        plainToken,
        req.ip || req.socket.remoteAddress,
        req.headers['user-agent']
      );

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);
      res.status(200).json(createSuccessResponse({ accessToken: result.accessToken }));
    } catch (err) {
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
      next(err);
    }
  }

  static async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const plainToken = req.cookies[REFRESH_COOKIE_NAME];
      if (plainToken) {
        await AuthService.logout(plainToken);
      }
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
      res.status(200).json(createSuccessResponse({ message: 'Logged out successfully' }));
    } catch (err) {
      next(err);
    }
  }

  static async logoutAll(req: Request, res: Response, next: NextFunction) {
    try {
      if (req.user) {
        await AuthService.logoutAll(req.user.id);
      }
      res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/v1/auth' });
      res.status(200).json(createSuccessResponse({ message: 'All sessions logged out successfully' }));
    } catch (err) {
      next(err);
    }
  }

  static async forgotPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.forgotPassword(req.body.email);
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  static async resetPassword(req: Request, res: Response, next: NextFunction) {
    try {
      const result = await AuthService.resetPassword(
        req.body,
        req.ip || req.socket.remoteAddress,
        req.headers['user-agent']
      );
      res.status(200).json(createSuccessResponse(result));
    } catch (err) {
      next(err);
    }
  }

  static async setup2FA(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));

      const { secret, qrCodeUrl } = await TotpService.generateSecret(req.user.email);

      // Temporarily store secret in user record pending verification
      await prisma.user.update({
        where: { id: req.user.id },
        data: { totpSecret: secret },
      });

      res.status(200).json(
        createSuccessResponse({
          secret,
          qrCodeUrl,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  static async verify2FA(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user || !user.totpSecret) {
        return res.status(400).json(
          createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'TOTP setup was not initiated')
        );
      }

      const isValid = TotpService.verifyToken(req.body.code, user.totpSecret);
      if (!isValid) {
        return res.status(400).json(
          createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid 6-digit TOTP code')
        );
      }

      const { plaintextCodes, hashedCodes } = TotpService.generateBackupCodes();

      await prisma.user.update({
        where: { id: user.id },
        data: {
          totpEnabled: true,
          totpBackupCodes: hashedCodes,
        },
      });

      res.status(200).json(
        createSuccessResponse({
          message: 'Two-factor authentication enabled successfully.',
          backupCodes: plaintextCodes,
        })
      );
    } catch (err) {
      next(err);
    }
  }

  static async disable2FA(req: Request, res: Response, next: NextFunction) {
    try {
      if (!req.user) return res.status(401).json(createErrorResponse(ErrorCodes.UNAUTHORIZED, 'Unauthorized'));

      const user = await prisma.user.findUnique({ where: { id: req.user.id } });
      if (!user || !user.totpEnabled) {
        return res.status(400).json(
          createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Two-factor authentication is not enabled')
        );
      }

      if (user.passwordHash) {
        const isValidPassword = await AuthService.verifyPassword(user.passwordHash, req.body.password);
        if (!isValidPassword) {
          return res.status(400).json(
            createErrorResponse(ErrorCodes.INVALID_CREDENTIALS, 'Current password is incorrect')
          );
        }
      }

      let isCodeValid = false;
      if (user.totpSecret) {
        isCodeValid = TotpService.verifyToken(req.body.code, user.totpSecret);
      }
      if (!isCodeValid) {
        const backupCheck = TotpService.verifyBackupCode(req.body.code, user.totpBackupCodes);
        isCodeValid = backupCheck.isValid;
      }

      if (!isCodeValid) {
        return res.status(400).json(
          createErrorResponse(ErrorCodes.VALIDATION_ERROR, 'Invalid TOTP or backup code')
        );
      }

      await prisma.user.update({
        where: { id: user.id },
        data: {
          totpEnabled: false,
          totpSecret: null,
          totpBackupCodes: [],
        },
      });

      res.status(200).json(
        createSuccessResponse({ message: 'Two-factor authentication disabled successfully' })
      );
    } catch (err) {
      next(err);
    }
  }

  static async oauthGoogleCallback(req: Request, res: Response, next: NextFunction) {
    try {
      // Mock/Dev OAuth flow when real Google keys aren't set
      if (!env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) {
        const mockEmail = (req.query.mock_email as string) || 'google.user@example.com';
        const mockName = (req.query.mock_name as string) || 'Google User';
        const mockId = (req.query.mock_id as string) || 'google-sub-12345';

        const result = await AuthService.handleOAuthCallback('GOOGLE', mockId, mockEmail, mockName);
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);
        return res.redirect(`${env.CLIENT_URL}/dashboard?token=${result.accessToken}`);
      }

      const code = req.query.code as string;
      if (!code) {
        const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${env.GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${env.API_URL}/api/v1/auth/oauth/google/callback`)}&response_type=code&scope=openid%20email%20profile`;
        return res.redirect(googleAuthUrl);
      }

      // Exchange code via standard Google OAuth token endpoint
      const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          code,
          client_id: env.GOOGLE_CLIENT_ID,
          client_secret: env.GOOGLE_CLIENT_SECRET,
          redirect_uri: `${env.API_URL}/api/v1/auth/oauth/google/callback`,
          grant_type: 'authorization_code',
        }),
      });

      const tokenData = (await tokenRes.json()) as any;
      if (!tokenRes.ok) throw new Error(tokenData.error_description || 'Google OAuth failed');

      const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
        headers: { Authorization: `Bearer ${tokenData.access_token}` },
      });
      const userData = (await userRes.json()) as any;

      const result = await AuthService.handleOAuthCallback(
        'GOOGLE',
        userData.sub,
        userData.email,
        userData.name || userData.email.split('@')[0],
        userData.picture
      );

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);
      res.redirect(`${env.CLIENT_URL}/dashboard?token=${result.accessToken}`);
    } catch (err: any) {
      console.error('[Google OAuth Callback Error]', err.message);
      res.redirect(`${env.CLIENT_URL}/login?error=OAuthFailed`);
    }
  }

  static async oauthGithubCallback(req: Request, res: Response, next: NextFunction) {
    try {
      // Mock/Dev OAuth flow when real GitHub keys aren't set
      if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
        const mockEmail = (req.query.mock_email as string) || 'github.user@example.com';
        const mockName = (req.query.mock_name as string) || 'GitHub User';
        const mockId = (req.query.mock_id as string) || 'github-sub-67890';

        const result = await AuthService.handleOAuthCallback('GITHUB', mockId, mockEmail, mockName);
        res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);
        return res.redirect(`${env.CLIENT_URL}/dashboard?token=${result.accessToken}`);
      }

      const code = req.query.code as string;
      if (!code) {
        const githubAuthUrl = `https://github.com/login/oauth/authorize?client_id=${env.GITHUB_CLIENT_ID}&redirect_uri=${encodeURIComponent(`${env.API_URL}/api/v1/auth/oauth/github/callback`)}&scope=user:email`;
        return res.redirect(githubAuthUrl);
      }

      const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const tokenData = (await tokenRes.json()) as any;
      if (tokenData.error) throw new Error(tokenData.error_description || 'GitHub OAuth failed');

      const userRes = await fetch('https://api.github.com/user', {
        headers: {
          Authorization: `Bearer ${tokenData.access_token}`,
          'User-Agent': 'CareerCraft-App',
        },
      });
      const userData = (await userRes.json()) as any;

      let email = userData.email;
      if (!email) {
        const emailsRes = await fetch('https://api.github.com/user/emails', {
          headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
            'User-Agent': 'CareerCraft-App',
          },
        });
        const emailsData = (await emailsRes.json()) as any;
        const primary = emailsData.find((e: any) => e.primary && e.verified);
        email = primary?.email || `${userData.login}@users.noreply.github.com`;
      }

      const result = await AuthService.handleOAuthCallback(
        'GITHUB',
        String(userData.id),
        email,
        userData.name || userData.login,
        userData.avatar_url
      );

      res.cookie(REFRESH_COOKIE_NAME, result.refreshToken, COOKIE_OPTIONS);
      res.redirect(`${env.CLIENT_URL}/dashboard?token=${result.accessToken}`);
    } catch (err: any) {
      console.error('[GitHub OAuth Callback Error]', err.message);
      res.redirect(`${env.CLIENT_URL}/login?error=OAuthFailed`);
    }
  }
}
