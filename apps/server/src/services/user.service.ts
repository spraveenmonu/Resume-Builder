import { prisma } from '../config/prisma.js';
import { AuthService } from './auth.service.js';
import { EmailService } from './email.service.js';
import { PwnedService } from './pwned.service.js';
import { StorageService } from './storage.service.js';
import { AuditService } from './audit.service.js';
import { ErrorCodes } from '../constants/error-codes.js';
import crypto from 'crypto';
import {
  UpdateProfileInput,
  ChangePasswordInput,
  ChangeEmailInput,
  DeleteAccountInput,
} from '@careercraft/shared';

export class UserService {
  /**
   * Fetches user profile.
   */
  static async getProfile(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        totpEnabled: true,
        createdAt: true,
      },
    });

    if (!user) {
      const error: any = new Error('User not found');
      error.code = ErrorCodes.NOT_FOUND;
      error.statusCode = 404;
      throw error;
    }

    return {
      ...user,
      createdAt: user.createdAt.toISOString(),
    };
  }

  /**
   * Updates user name.
   */
  static async updateProfile(userId: string, input: UpdateProfileInput) {
    const updated = await prisma.user.update({
      where: { id: userId },
      data: { name: input.name },
      select: {
        id: true,
        email: true,
        name: true,
        avatarUrl: true,
        role: true,
        isEmailVerified: true,
        totpEnabled: true,
        createdAt: true,
      },
    });

    await AuditService.log({
      userId,
      action: 'USER_PROFILE_UPDATED',
      entityType: 'User',
      entityId: userId,
    });

    return {
      ...updated,
      createdAt: updated.createdAt.toISOString(),
    };
  }

  /**
   * Uploads and sets avatar.
   */
  static async updateAvatar(userId: string, fileBuffer: Buffer) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (user.avatarUrl) {
      await StorageService.deleteAvatar(user.avatarUrl);
    }

    const avatarUrl = await StorageService.uploadAvatar(fileBuffer, userId);

    await prisma.user.update({
      where: { id: userId },
      data: { avatarUrl },
    });

    await AuditService.log({
      userId,
      action: 'USER_AVATAR_UPDATED',
      entityType: 'User',
      entityId: userId,
    });

    return { avatarUrl };
  }

  /**
   * Deletes avatar.
   */
  static async deleteAvatar(userId: string) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (user?.avatarUrl) {
      await StorageService.deleteAvatar(user.avatarUrl);
      await prisma.user.update({
        where: { id: userId },
        data: { avatarUrl: null },
      });
    }

    await AuditService.log({
      userId,
      action: 'USER_AVATAR_DELETED',
      entityType: 'User',
      entityId: userId,
    });

    return { message: 'Avatar deleted successfully' };
  }

  /**
   * Changes user password.
   */
  static async changePassword(userId: string, input: ChangePasswordInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      const error: any = new Error('Cannot change password for OAuth-only accounts without password setup');
      error.code = ErrorCodes.FORBIDDEN;
      error.statusCode = 400;
      throw error;
    }

    const isValid = await AuthService.verifyPassword(user.passwordHash, input.currentPassword);
    if (!isValid) {
      const error: any = new Error('Current password is incorrect');
      error.code = ErrorCodes.INVALID_CREDENTIALS;
      error.statusCode = 400;
      throw error;
    }

    const isPwned = await PwnedService.isPasswordPwned(input.newPassword);
    if (isPwned) {
      const error: any = new Error('New password has been exposed in a data breach. Please choose a different password.');
      error.code = ErrorCodes.PASSWORD_PWNED;
      error.statusCode = 400;
      throw error;
    }

    const newHash = await AuthService.hashPassword(input.newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newHash },
    });

    // Revoke other active sessions for security
    await prisma.session.updateMany({
      where: { userId },
      data: { isRevoked: true },
    });

    await AuditService.log({
      userId,
      action: 'USER_PASSWORD_CHANGED',
      entityType: 'User',
      entityId: userId,
    });

    return { message: 'Password updated successfully. Other active sessions have been signed out.' };
  }

  /**
   * Requests email change with verification link.
   */
  static async changeEmail(userId: string, input: ChangeEmailInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.passwordHash) {
      const error: any = new Error('Password verification required to change email');
      error.code = ErrorCodes.FORBIDDEN;
      error.statusCode = 400;
      throw error;
    }

    const isValid = await AuthService.verifyPassword(user.passwordHash, input.password);
    if (!isValid) {
      const error: any = new Error('Password is incorrect');
      error.code = ErrorCodes.INVALID_CREDENTIALS;
      error.statusCode = 400;
      throw error;
    }

    const existing = await prisma.user.findUnique({ where: { email: input.newEmail } });
    if (existing) {
      const error: any = new Error('Email is already registered to another account');
      error.code = ErrorCodes.CONFLICT;
      error.statusCode = 409;
      throw error;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    await prisma.emailVerificationToken.create({
      data: {
        userId,
        tokenHash,
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
    });

    await EmailService.sendVerificationEmail(input.newEmail, user.name, token);

    await AuditService.log({
      userId,
      action: 'USER_EMAIL_CHANGE_REQUESTED',
      entityType: 'User',
      entityId: userId,
      details: { newEmail: input.newEmail },
    });

    return { message: 'A verification link has been sent to your new email address.' };
  }

  /**
   * Returns active sessions for user.
   */
  static async getSessions(userId: string, currentRefreshToken?: string) {
    const sessions = await prisma.session.findMany({
      where: { userId, isRevoked: false, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: 'desc' },
    });

    let currentHash = '';
    if (currentRefreshToken) {
      currentHash = crypto.createHash('sha256').update(currentRefreshToken).digest('hex');
    }

    return sessions.map((s: any) => ({
      id: s.id,
      userAgent: s.userAgent,
      ipAddress: s.ipAddress,
      lastActiveAt: s.lastActiveAt.toISOString(),
      isCurrent: s.refreshTokenHash === currentHash,
    }));
  }

  /**
   * Revokes specific session.
   */
  static async revokeSession(userId: string, sessionId: string) {
    await prisma.session.updateMany({
      where: { id: sessionId, userId },
      data: { isRevoked: true },
    });

    await AuditService.log({
      userId,
      action: 'USER_SESSION_REVOKED',
      entityType: 'Session',
      entityId: sessionId,
    });

    return { message: 'Session revoked successfully' };
  }

  /**
   * Returns connected OAuth accounts.
   */
  static async getConnectedOAuthAccounts(userId: string) {
    const accounts = await prisma.oAuthAccount.findMany({
      where: { userId },
      select: {
        id: true,
        provider: true,
        email: true,
        createdAt: true,
      },
    });

    return accounts.map((a: any) => ({
      ...a,
      createdAt: a.createdAt.toISOString(),
    }));
  }

  /**
   * Unlinks an OAuth account.
   */
  static async unlinkOAuthAccount(userId: string, accountId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { oauthAccounts: true },
    });

    if (!user) throw new Error('User not found');

    if (!user.passwordHash && user.oauthAccounts.length <= 1) {
      const error: any = new Error('Cannot disconnect your only login method without setting a password first');
      error.code = ErrorCodes.FORBIDDEN;
      error.statusCode = 400;
      throw error;
    }

    await prisma.oAuthAccount.deleteMany({
      where: { id: accountId, userId },
    });

    await AuditService.log({
      userId,
      action: 'USER_OAUTH_UNLINKED',
      entityType: 'OAuthAccount',
      entityId: accountId,
    });

    return { message: 'Connected account removed' };
  }

  /**
   * Export all user data as complete JSON archive.
   */
  static async exportUserData(userId: string) {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        resumes: { where: { deletedAt: null } },
        coverLetters: { where: { deletedAt: null } },
        jobApplications: true,
        downloads: true,
        stylePresets: true,
      },
    });

    if (!user) throw new Error('User not found');

    const cleanUser = {
      id: user.id,
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      role: user.role,
      createdAt: user.createdAt,
    };

    await AuditService.log({
      userId,
      action: 'USER_DATA_EXPORTED',
      entityType: 'User',
      entityId: userId,
    });

    return {
      exportedAt: new Date().toISOString(),
      user: cleanUser,
      resumes: user.resumes,
      coverLetters: user.coverLetters,
      jobApplications: user.jobApplications,
      downloads: user.downloads,
      stylePresets: user.stylePresets,
    };
  }

  /**
   * Soft deletes user account with 7-day grace period.
   */
  static async deleteAccount(userId: string, input: DeleteAccountInput) {
    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (user.email.toLowerCase() !== input.emailConfirmation.toLowerCase()) {
      const error: any = new Error('Confirmation email does not match account email');
      error.code = ErrorCodes.VALIDATION_ERROR;
      error.statusCode = 400;
      throw error;
    }

    if (user.passwordHash) {
      const isValid = await AuthService.verifyPassword(user.passwordHash, input.password);
      if (!isValid) {
        const error: any = new Error('Password is incorrect');
        error.code = ErrorCodes.INVALID_CREDENTIALS;
        error.statusCode = 400;
        throw error;
      }
    }

    const scheduledPurgeAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

    await prisma.$transaction([
      prisma.user.update({
        where: { id: userId },
        data: {
          deletedAt: new Date(),
          scheduledPurgeAt,
        },
      }),
      prisma.session.updateMany({
        where: { userId },
        data: { isRevoked: true },
      }),
    ]);

    await AuditService.log({
      userId,
      action: 'USER_ACCOUNT_SOFT_DELETED',
      entityType: 'User',
      entityId: userId,
      details: { purgeScheduled: scheduledPurgeAt },
    });

    return { message: 'Your account has been scheduled for deletion in 7 days.' };
  }
}
