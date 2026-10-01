import { describe, it, expect, beforeAll, vi } from 'vitest';
import request from 'supertest';
import { createApp } from '../../apps/server/src/app.js';
import { AuthService } from '../../apps/server/src/services/auth.service.js';
import { TotpService } from '../../apps/server/src/services/totp.service.js';
import { prisma } from '../../apps/server/src/config/prisma.js';

describe('Authentication & Security Integration Tests', () => {
  const app = createApp();
  const testEmail = `test.user.${Date.now()}@example.com`;
  const testPassword = 'StrongPassword123!#';
  let verificationToken: string;
  let refreshTokenCookie: string;
  let accessToken: string;
  let userId: string;
  let isDbAvailable = false;

  beforeAll(async () => {
    try {
      await prisma.$connect();
      isDbAvailable = true;
    } catch {
      isDbAvailable = false;
    }
  });

  it('rejects signup with weak password', async () => {
    const res = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Weak Password User',
        email: 'weak@example.com',
        password: 'weak',
      });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('VALIDATION_ERROR');
    expect(res.body.error.fieldErrors?.password).toBeDefined();
  });

  it('successfully creates an unverified account with hashed password', async (ctx) => {
    if (!isDbAvailable) {
      ctx.skip();
      return;
    }
    // Mock email sender
    const signupRes = await request(app)
      .post('/api/v1/auth/signup')
      .send({
        name: 'Test Candidate',
        email: testEmail,
        password: testPassword,
      });

    expect(signupRes.status).toBe(201);
    expect(signupRes.body.success).toBe(true);

    // Verify user in DB is unverified and has Argon2id hash
    const user = await prisma.user.findUnique({
      where: { email: testEmail },
      include: { emailVerifications: true },
    });

    expect(user).toBeDefined();
    expect(user?.isEmailVerified).toBe(false);
    expect(user?.passwordHash).toMatch(/^\$argon2id\$/);

    userId = user!.id;
    // Extract verification token hash record to simulate clicking link
    const tokenRecord = user!.emailVerifications[0];
    expect(tokenRecord).toBeDefined();
  });

  it('prevents unverified users from logging in (403 EMAIL_NOT_VERIFIED)', async (ctx) => {
    if (!isDbAvailable) {
      ctx.skip();
      return;
    }
    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(loginRes.status).toBe(403);
    expect(loginRes.body.success).toBe(false);
    expect(loginRes.body.error.code).toBe('EMAIL_NOT_VERIFIED');
  });

  it('fails email verification when given an invalid token', async (ctx) => {
    if (!isDbAvailable) {
      ctx.skip();
      return;
    }
    const res = await request(app)
      .post('/api/v1/auth/verify-email')
      .send({ token: 'completely-invalid-token' });

    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('TOKEN_EXPIRED');
  });

  it('verifies email and allows login', async (ctx) => {
    if (!isDbAvailable) {
      ctx.skip();
      return;
    }
    // Manually mark verified to test login and session issuance
    await prisma.user.update({
      where: { id: userId },
      data: { isEmailVerified: true },
    });

    const loginRes = await request(app)
      .post('/api/v1/auth/login')
      .send({
        email: testEmail,
        password: testPassword,
      });

    expect(loginRes.status).toBe(200);
    expect(loginRes.body.success).toBe(true);
    expect(loginRes.body.data.accessToken).toBeDefined();
    expect(loginRes.body.data.user.email).toBe(testEmail);

    accessToken = loginRes.body.data.accessToken;

    // Check refresh cookie
    const cookies = loginRes.headers['set-cookie'];
    expect(cookies).toBeDefined();
    const refreshCookie = cookies.find((c: string) => c.startsWith('careercraft_refresh='));
    expect(refreshCookie).toBeDefined();
    refreshTokenCookie = refreshCookie.split(';')[0];
  });

  it('allows access to protected routes with valid Bearer token', async (ctx) => {
    if (!isDbAvailable) {
      ctx.skip();
      return;
    }
    const res = await request(app)
      .get('/api/v1/user/profile')
      .set('Authorization', `Bearer ${accessToken}`);

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.user.email).toBe(testEmail);
  });

  it('denies access to protected routes without token (401 UNAUTHORIZED)', async () => {
    const res = await request(app).get('/api/v1/user/profile');
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
    expect(res.body.error.code).toBe('UNAUTHORIZED');
  });

  it('rotates refresh token and issues new access token', async (ctx) => {
    if (!isDbAvailable) {
      ctx.skip();
      return;
    }
    const refreshRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);

    expect(refreshRes.status).toBe(200);
    expect(refreshRes.body.success).toBe(true);
    expect(refreshRes.body.data.accessToken).toBeDefined();

    // Check new cookie issued
    const newCookies = refreshRes.headers['set-cookie'];
    const newRefreshCookie = newCookies.find((c: string) => c.startsWith('careercraft_refresh='));
    expect(newRefreshCookie).toBeDefined();
  });

  it('detects refresh token reuse and revokes entire session family', async (ctx) => {
    if (!isDbAvailable) {
      ctx.skip();
      return;
    }
    // Attempt to use the OLD (already rotated) refreshTokenCookie
    const reuseRes = await request(app)
      .post('/api/v1/auth/refresh')
      .set('Cookie', [refreshTokenCookie]);

    expect(reuseRes.status).toBe(401);
    expect(reuseRes.body.success).toBe(false);

    // Verify in DB that sessions for this user/family are revoked
    const sessions = await prisma.session.findMany({
      where: { userId },
    });
    expect(sessions.every((s) => s.isRevoked)).toBe(true);
  });

  it('generates 10 backup codes upon 2FA setup and verification', async () => {
    const { secret } = await TotpService.generateSecret(testEmail);
    const { plaintextCodes, hashedCodes } = TotpService.generateBackupCodes();

    expect(plaintextCodes.length).toBe(10);
    expect(hashedCodes.length).toBe(10);

    // Test verifying a valid backup code
    const testCode = plaintextCodes[0];
    const verification = TotpService.verifyBackupCode(testCode, hashedCodes);
    expect(verification.isValid).toBe(true);
    expect(verification.remainingHashedCodes.length).toBe(9);

    // Reusing the same code must fail
    const secondTry = TotpService.verifyBackupCode(testCode, verification.remainingHashedCodes);
    expect(secondTry.isValid).toBe(false);
  });
});
