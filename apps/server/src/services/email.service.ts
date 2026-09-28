import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

export class EmailService {
  private static transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: env.SMTP_USER && env.SMTP_PASS ? {
      user: env.SMTP_USER,
      pass: env.SMTP_PASS,
    } : undefined,
  });

  static async sendVerificationEmail(toEmail: string, name: string, token: string): Promise<void> {
    const verificationUrl = `${env.CLIENT_URL}/verify-email?token=${token}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Welcome to CareerCraft, ${name}!</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">
          Thank you for signing up. Please verify your email address to activate your account and start building professional, ATS-optimized resumes.
        </p>
        <div style="margin: 32px 0;">
          <a href="${verificationUrl}" style="background-color: #2563eb; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Verify Email Address
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Or copy and paste this link into your browser: <br/>
          <a href="${verificationUrl}" style="color: #2563eb;">${verificationUrl}</a>
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          If you didn't create an account on CareerCraft, you can safely ignore this email.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: toEmail,
        subject: 'Verify your CareerCraft account',
        html,
      });
    } catch (err: any) {
      console.warn(`[EmailService] Failed to send email to ${toEmail}: ${err.message}`);
      console.log(`[EmailService Dev Fallback] Verification URL: ${verificationUrl}`);
    }
  }

  static async sendPasswordResetEmail(toEmail: string, name: string, token: string): Promise<void> {
    const resetUrl = `${env.CLIENT_URL}/reset-password?token=${token}`;

    const html = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; background: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
        <h2 style="color: #1e3a8a; margin-top: 0;">Password Reset Request</h2>
        <p style="color: #334155; font-size: 16px; line-height: 1.5;">
          Hello ${name}, we received a request to reset your password. This link is valid for 1 hour.
        </p>
        <div style="margin: 32px 0;">
          <a href="${resetUrl}" style="background-color: #dc2626; color: #ffffff; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">
            Reset Password
          </a>
        </div>
        <p style="color: #64748b; font-size: 14px;">
          Or copy and paste this link into your browser: <br/>
          <a href="${resetUrl}" style="color: #2563eb;">${resetUrl}</a>
        </p>
        <p style="color: #94a3b8; font-size: 12px; margin-top: 32px; border-top: 1px solid #f1f5f9; padding-top: 16px;">
          If you didn't request a password reset, no further action is required. Your account remains secure.
        </p>
      </div>
    `;

    try {
      await this.transporter.sendMail({
        from: env.SMTP_FROM,
        to: toEmail,
        subject: 'Reset your CareerCraft password',
        html,
      });
    } catch (err: any) {
      console.warn(`[EmailService] Failed to send password reset email: ${err.message}`);
      console.log(`[EmailService Dev Fallback] Reset URL: ${resetUrl}`);
    }
  }
}
