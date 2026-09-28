import { authenticator } from 'otplib';
import QRCode from 'qrcode';
import crypto from 'crypto';

export class TotpService {
  /**
   * Generates a new TOTP secret and QR code URI for the user.
   */
  static async generateSecret(email: string): Promise<{ secret: string; qrCodeUrl: string }> {
    const secret = authenticator.generateSecret();
    const otpauth = authenticator.keyuri(email, 'CareerCraft', secret);
    const qrCodeUrl = await QRCode.toDataURL(otpauth);
    return { secret, qrCodeUrl };
  }

  /**
   * Validates a 6-digit TOTP token against a user's secret.
   */
  static verifyToken(token: string, secret: string): boolean {
    return authenticator.verify({ token, secret });
  }

  /**
   * Generates 10 secure random backup codes (8 characters uppercase hex).
   * Returns plaintext codes (for the user) and hashed codes (to store in DB).
   */
  static generateBackupCodes(): { plaintextCodes: string[]; hashedCodes: string[] } {
    const plaintextCodes: string[] = [];
    const hashedCodes: string[] = [];

    for (let i = 0; i < 10; i++) {
      const code = crypto.randomBytes(4).toString('hex').toUpperCase();
      const hashed = crypto.createHash('sha256').update(code).digest('hex');
      plaintextCodes.push(code);
      hashedCodes.push(hashed);
    }

    return { plaintextCodes, hashedCodes };
  }

  /**
   * Verifies if a provided code matches one of the user's hashed backup codes.
   */
  static verifyBackupCode(providedCode: string, hashedCodes: string[]): { isValid: boolean; remainingHashedCodes: string[] } {
    const normalized = providedCode.trim().toUpperCase();
    const hash = crypto.createHash('sha256').update(normalized).digest('hex');

    const index = hashedCodes.indexOf(hash);
    if (index === -1) {
      return { isValid: false, remainingHashedCodes: hashedCodes };
    }

    const remaining = [...hashedCodes];
    remaining.splice(index, 1);
    return { isValid: true, remainingHashedCodes: remaining };
  }
}
