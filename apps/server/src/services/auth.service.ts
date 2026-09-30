import argon2 from 'argon2';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import { prisma } from '../config/prisma.js';
import { env } from '../config/env.js';
import { PwnedService } from './pwned.service.js';
import { EmailService } from './email.service.js';
import { TotpService } from './totp.service.js';
import { AuditService } from './audit.service.js';
import { ErrorCodes } from '../constants/error-codes.js';
import { SignupInput, LoginInput, ResetPasswordInput } from '@careercraft/shared';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export class AuthService {
  /**
   * Hashes password using Argon2id.
   */
  static async hashPassword(password: string): Promise<string> {
    return argon2.hash(password, {
      type: argon2.argon2id,
      memoryCost: 2 ** 16, // 64 MB
      timeCost: 3,
      parallelism: 1,
    });
  }

  /**
   * Verifies password against Argon2id hash.
   */
  static async verifyPassword(hash: string, plain: string): Promise<boolean> {
    try {
      return await argon2.verify(hash, plain);
    } catch {
      return false;
    }
  }

  /**
   * Generates JWT Access Token (15m).
   */
  static generateAccessToken(user: { id: string; email: string; role: string }): string {
    return jwt.sign(
      {
        sub: user.id,
        email: user.email,
        role: user.role,
      },
      env.JWT_ACCESS_SECRET,
      { expiresIn: '15m' }
    );
  }

  /**
   * Generates random refresh token and returns plaintext + sha256 hash.
   */
  static generateRefreshToken(): { plainToken: string; tokenHash: string } {
    const plainToken = crypto.randomBytes(40).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(plainToken).digest('hex');
    return { plainToken, tokenHash };
  }

  /**
   * Signup flow with breach detection and verification email.
   */
  static async signup(input: SignupInput, ipAddress?: string, userAgent?: string) {
    const isPwned = await PwnedService.isPasswordPwned(input.password);
    if (isPwned) {
      const error: any = new Error('This password has been exposed in a data breach. Please choose a different password.');
      error.code = ErrorCodes.PASSWORD_PWNED;
      error.statusCode = 400;
      throw error;
    }

    const existingUser = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (existingUser) {
      const error: any = new Error('An account with this email address already exists');
      error.code = ErrorCodes.CONFLICT;
      error.statusCode = 409;
      throw error;
    }

    const passwordHash = await this.hashPassword(input.password);

    const user = await prisma.user.create({
      data: {
        name: input.name,
        email: input.email,
        passwordHash,
        avatarUrl: input.avatarUrl || null,
        isEmailVerified: false,
      },
    });

    // Create Email Verification Token (24 hours)
    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await EmailService.sendVerificationEmail(user.email, user.name, verificationToken);

    await AuditService.log({
      userId: user.id,
      action: 'AUTH_SIGNUP',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      message: 'Account created successfully. Please check your email to verify your account.',
      email: user.email,
    };
  }

  /**
   * Verify email flow.
   */
  static async verifyEmail(token: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const record = await prisma.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!record || record.expiresAt < new Date()) {
      const error: any = new Error('Verification token is invalid or has expired');
      error.code = ErrorCodes.TOKEN_EXPIRED;
      error.statusCode = 400;
      throw error;
    }

    await prisma.user.update({
      where: { id: record.userId },
      data: {
        isEmailVerified: true,
        emailVerifiedAt: new Date(),
      },
    });

    // Delete token
    await prisma.emailVerificationToken.delete({
      where: { id: record.id },
    });

    await AuditService.log({
      userId: record.userId,
      action: 'AUTH_EMAIL_VERIFIED',
      entityType: 'User',
      entityId: record.userId,
      ipAddress,
      userAgent,
    });

    return {
      message: 'Email verified successfully! You may now log in.',
    };
  }

  /**
   * Resend email verification with 60s cooldown.
   */
  static async resendVerification(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
      include: { emailVerifications: { orderBy: { createdAt: 'desc' }, take: 1 } },
    });

    if (!user || user.isEmailVerified) {
      // Do not disclose user existence
      return { message: 'If this email is registered and unverified, a verification link has been sent.' };
    }

    const latestToken = user.emailVerifications[0];
    if (latestToken && Date.now() - latestToken.createdAt.getTime() < 60 * 1000) {
      const error: any = new Error('Please wait 60 seconds before requesting another verification email.');
      error.code = ErrorCodes.RATE_LIMITED;
      error.statusCode = 429;
      throw error;
    }

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(verificationToken).digest('hex');

    await prisma.emailVerificationToken.create({
      data: {
        userId: user.id,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await EmailService.sendVerificationEmail(user.email, user.name, verificationToken);

    return { message: 'If this email is registered and unverified, a verification link has been sent.' };
  }

  /**
   * Login with brute-force protection and optional TOTP.
   */
  static async login(
    input: LoginInput,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{
    requires2FA?: boolean;
    accessToken?: string;
    refreshToken?: string;
    user?: any;
  }> {
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    // Generic error helper
    const invalidCredentialsError = () => {
      const error: any = new Error('Invalid email or password');
      error.code = ErrorCodes.INVALID_CREDENTIALS;
      error.statusCode = 401;
      return error;
    };

    if (!user || !user.passwordHash || user.deletedAt !== null) {
      throw invalidCredentialsError();
    }

    // Account lockout check
    if (user.lockedUntil && user.lockedUntil > new Date()) {
      const remainingMinutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / (60 * 1000));
      const error: any = new Error(`Account temporarily locked. Please try again in ${remainingMinutes} minute(s).`);
      error.code = ErrorCodes.ACCOUNT_LOCKED;
      error.statusCode = 423;
      throw error;
    }

    const isValidPassword = await this.verifyPassword(user.passwordHash, input.password);
    if (!isValidPassword) {
      const attempts = user.failedLoginAttempts + 1;
      const lockedUntil = attempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      await prisma.user.update({
        where: { id: user.id },
        data: {
          failedLoginAttempts: attempts,
          lockedUntil,
        },
      });

      await AuditService.log({
        userId: user.id,
        action: 'AUTH_FAILED_LOGIN',
        entityType: 'User',
        entityId: user.id,
        details: { attempts },
        ipAddress,
        userAgent,
      });

      throw invalidCredentialsError();
    }

    // Email verification check
    if (!user.isEmailVerified) {
      const error: any = new Error('Please verify your email address before logging in.');
      error.code = ErrorCodes.EMAIL_NOT_VERIFIED;
      error.statusCode = 403;
      throw error;
    }

    // TOTP Check
    if (user.totpEnabled) {
      if (!input.totpCode) {
        return { requires2FA: true };
      }

      let isTotpValid = false;
      if (user.totpSecret) {
        isTotpValid = TotpService.verifyToken(input.totpCode, user.totpSecret);
      }

      if (!isTotpValid) {
        // Try backup code
        const backupCheck = TotpService.verifyBackupCode(input.totpCode, user.totpBackupCodes);
        if (backupCheck.isValid) {
          isTotpValid = true;
          await prisma.user.update({
            where: { id: user.id },
            data: { totpBackupCodes: backupCheck.remainingHashedCodes },
          });
        }
      }

      if (!isTotpValid) {
        const error: any = new Error('Invalid two-factor authentication code or backup code');
        error.code = ErrorCodes.UNAUTHORIZED;
        error.statusCode = 401;
        throw error;
      }
    }

    // Reset failed login attempts on successful login
    if (user.failedLoginAttempts > 0) {
      await prisma.user.update({
        where: { id: user.id },
        data: { failedLoginAttempts: 0, lockedUntil: null },
      });
    }

    // Create session family & tokens
    const familyId = crypto.randomUUID();
    const { plainToken, tokenHash } = this.generateRefreshToken();

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: tokenHash,
        familyId,
        userAgent: userAgent || null,
        ipAddress: ipAddress || null,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
      },
    });

    const accessToken = this.generateAccessToken(user);

    await AuditService.log({
      userId: user.id,
      action: 'AUTH_LOGIN',
      entityType: 'User',
      entityId: user.id,
      ipAddress,
      userAgent,
    });

    return {
      accessToken,
      refreshToken: plainToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        totpEnabled: user.totpEnabled,
      },
    };
  }

  /**
   * Refresh token rotation with reuse detection.
   */
  static async rotateRefreshToken(incomingPlainToken: string, ipAddress?: string, userAgent?: string) {
    const tokenHash = crypto.createHash('sha256').update(incomingPlainToken).digest('hex');

    const session = await prisma.session.findUnique({
      where: { refreshTokenHash: tokenHash },
      include: { user: true },
    });

    // Reuse detection: If token was not found or session was revoked, revoke the whole family!
    if (!session || session.isRevoked || session.expiresAt < new Date()) {
      if (session && session.isRevoked) {
        console.warn(`[AuthService] Refresh token reuse detected for family ${session.familyId}! Revoking all sessions.`);
        await prisma.session.updateMany({
          where: { familyId: session.familyId },
          data: { isRevoked: true },
        });

        await AuditService.log({
          userId: session.userId,
          action: 'AUTH_TOKEN_REUSE_DETECTED',
          entityType: 'Session',
          entityId: session.id,
          details: { familyId: session.familyId },
          ipAddress,
          userAgent,
        });
      }

      const error: any = new Error('Invalid or expired refresh token');
      error.code = ErrorCodes.TOKEN_INVALID;
      error.statusCode = 401;
      throw error;
    }

    // Generate new rotated token in the same session family
    const { plainToken: newPlainToken, tokenHash: newTokenHash } = this.generateRefreshToken();

    await prisma.session.update({
      where: { id: session.id },
      data: {
        refreshTokenHash: newTokenHash,
        lastActiveAt: new Date(),
        ipAddress: ipAddress || session.ipAddress,
        userAgent: userAgent || session.userAgent,
      },
    });

    const accessToken = this.generateAccessToken(session.user);

    return {
      accessToken,
      refreshToken: newPlainToken,
    };
  }

  /**
   * Revoke active session (Logout).
   */
  static async logout(plainRefreshToken: string) {
    if (!plainRefreshToken) return;
    const tokenHash = crypto.createHash('sha256').update(plainRefreshToken).digest('hex');
    await prisma.session.updateMany({
      where: { refreshTokenHash: tokenHash },
      data: { isRevoked: true },
    });
  }

  /**
   * Revoke all sessions for user.
   */
  static async logoutAll(userId: string) {
    await prisma.session.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });
  }

  /**
   * Request password reset token.
   */
  static async forgotPassword(email: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (user && user.deletedAt === null) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const tokenHash = crypto.createHash('sha256').update(resetToken).digest('hex');

      await prisma.passwordResetToken.create({
        data: {
          userId: user.id,
          tokenHash,
          expiresAt: new Date(Date.now() + 60 * 60 * 1000), // 1 hour
        },
      });

      await EmailService.sendPasswordResetEmail(user.email, user.name, resetToken);
    }

    return { message: 'If that email address is in our database, we will send you a password reset link.' };
  }

  /**
   * Reset password with one-time token and revoke all sessions.
   */
  static async resetPassword(input: ResetPasswordInput, ipAddress?: string, userAgent?: string) {
    const tokenHash = crypto.createHash('sha256').update(input.token).digest('hex');

    const resetRecord = await prisma.passwordResetToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!resetRecord || resetRecord.usedAt !== null || resetRecord.expiresAt < new Date()) {
      const error: any = new Error('Password reset link is invalid or has expired');
      error.code = ErrorCodes.TOKEN_EXPIRED;
      error.statusCode = 400;
      throw error;
    }

    const isPwned = await PwnedService.isPasswordPwned(input.newPassword);
    if (isPwned) {
      const error: any = new Error('This password has been exposed in a data breach. Please choose a different password.');
      error.code = ErrorCodes.PASSWORD_PWNED;
      error.statusCode = 400;
      throw error;
    }

    const passwordHash = await this.hashPassword(input.newPassword);

    await prisma.$transaction([
      prisma.user.update({
        where: { id: resetRecord.userId },
        data: { passwordHash, failedLoginAttempts: 0, lockedUntil: null },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetRecord.id },
        data: { usedAt: new Date() },
      }),
      // Revoke all sessions on password reset
      prisma.session.updateMany({
        where: { userId: resetRecord.userId },
        data: { isRevoked: true },
      }),
    ]);

    await AuditService.log({
      userId: resetRecord.userId,
      action: 'AUTH_PASSWORD_RESET_SUCCESS',
      entityType: 'User',
      entityId: resetRecord.userId,
      ipAddress,
      userAgent,
    });

    return { message: 'Password has been reset successfully. You can now log in.' };
  }

  /**
   * Handles Google or GitHub OAuth Account Linking.
   */
  static async handleOAuthCallback(
    provider: 'GOOGLE' | 'GITHUB',
    providerAccountId: string,
    email: string,
    name: string,
    avatarUrl?: string
  ) {
    let user = await prisma.user.findUnique({
      where: { email },
      include: { oauthAccounts: true },
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          email,
          name,
          avatarUrl: avatarUrl || null,
          isEmailVerified: true, // OAuth emails from Google/GitHub are verified
          emailVerifiedAt: new Date(),
          oauthAccounts: {
            create: {
              provider,
              providerAccountId,
              email,
            },
          },
        },
        include: { oauthAccounts: true },
      });
    } else {
      const hasAccount = user.oauthAccounts.some(
        (acc) => acc.provider === provider && acc.providerAccountId === providerAccountId
      );

      if (!hasAccount) {
        await prisma.oAuthAccount.create({
          data: {
            userId: user.id,
            provider,
            providerAccountId,
            email,
          },
        });
      }
    }

    const familyId = crypto.randomUUID();
    const { plainToken, tokenHash } = this.generateRefreshToken();

    await prisma.session.create({
      data: {
        userId: user.id,
        refreshTokenHash: tokenHash,
        familyId,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    const accessToken = this.generateAccessToken(user);

    return {
      accessToken,
      refreshToken: plainToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatarUrl: user.avatarUrl,
        role: user.role,
        isEmailVerified: user.isEmailVerified,
        totpEnabled: user.totpEnabled,
      },
    };
  }
}
