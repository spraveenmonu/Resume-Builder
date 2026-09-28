import crypto from 'crypto';

export class PwnedService {
  /**
   * Checks if a password has appeared in known data breaches using HaveIBeenPwned's k-anonymity API.
   * Returns true if breached, false if safe.
   */
  static async isPasswordPwned(password: string): Promise<boolean> {
    try {
      const sha1 = crypto.createHash('sha1').update(password).digest('hex').toUpperCase();
      const prefix = sha1.substring(0, 5);
      const suffix = sha1.substring(5);

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3-second timeout

      const response = await fetch(`https://api.pwnedpasswords.com/range/${prefix}`, {
        signal: controller.signal,
        headers: {
          'Add-Padding': 'true',
          'User-Agent': 'CareerCraft-Password-Auditor',
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        console.warn('PwnedPasswords API returned non-200, bypassing check.');
        return false;
      }

      const text = await response.text();
      const lines = text.split('\r\n');

      for (const line of lines) {
        const [hashSuffix, count] = line.split(':');
        if (hashSuffix === suffix) {
          return parseInt(count, 10) > 0;
        }
      }

      return false;
    } catch (err: any) {
      console.warn('Pwned password check failed or timed out:', err.message);
      // Fail safe in offline/dev environments
      return false;
    }
  }
}
