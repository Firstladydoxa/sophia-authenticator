import { TOTP } from 'totp-generator';

/**
 * Generate TOTP code based on RFC 6238
 * Using totp-generator which is React Native compatible
 */
export async function generateTOTP(
  secret: string,
  timeStep: number = 30,
  digits: number = 6
): Promise<string> {
  // Generate TOTP using the TOTP class
  const result = await TOTP.generate(secret.replace(/\s/g, '').toUpperCase(), {
    period: timeStep,
    digits: digits,
    algorithm: 'SHA-1'
  });
  
  return result.otp;
}

/**
 * Get remaining seconds in current time window
 */
export function getRemainingSeconds(timeStep: number = 30): number {
  const epoch = Math.floor(Date.now() / 1000);
  return timeStep - (epoch % timeStep);
}

/**
 * Parse TOTP URI (otpauth://totp/...)
 */
export function parseTOTPUri(uri: string): {
  issuer?: string;
  account: string;
  secret: string;
  digits: number;
  period: number;
} | null {
  try {
    if (!uri.startsWith('otpauth://totp/')) {
      return null;
    }

    const url = new URL(uri);
    const pathParts = decodeURIComponent(url.pathname.substring(1)).split(':');
    
    let issuer: string | undefined;
    let account: string;
    
    if (pathParts.length === 2) {
      issuer = pathParts[0];
      account = pathParts[1];
    } else {
      account = pathParts[0];
    }

    const secret = url.searchParams.get('secret');
    if (!secret) {
      return null;
    }

    const digits = parseInt(url.searchParams.get('digits') || '6');
    const period = parseInt(url.searchParams.get('period') || '30');
    
    if (!issuer) {
      issuer = url.searchParams.get('issuer') || undefined;
    }

    return {
      issuer,
      account,
      secret: secret.replace(/\s/g, '').toUpperCase(),
      digits: digits,
      period: period,
    };
  } catch (error) {
    console.error('Error parsing TOTP URI:', error);
    return null;
  }
}

/**
 * Generate random base32 secret
 */
export function generateSecret(length: number = 32): string {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
  let secret = '';
  
  for (let i = 0; i < length; i++) {
    const randomIndex = Math.floor(Math.random() * alphabet.length);
    secret += alphabet[randomIndex];
  }
  
  return secret;
}

/**
 * Generate TOTP URI for QR code generation
 */
export function generateTOTPUri(
  account: string,
  secret: string,
  issuer?: string
): string {
  const label = issuer ? `${issuer}:${account}` : account;
  let uri = `otpauth://totp/${encodeURIComponent(label)}?secret=${secret}`;
  
  if (issuer) {
    uri += `&issuer=${encodeURIComponent(issuer)}`;
  }
  
  return uri;
}
