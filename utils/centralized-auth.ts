import { Account } from '../types';

/**
 * Format for Centralized Auth QR code data
 */
export interface CentralizedAuthQRData {
  type: string;
  issuer: string;
  account: string;
  secret: string;
  app_id: string;
  apiUrl: string;
}

/**
 * Account with centralized auth configuration
 */
export interface CentralizedAuthAccount extends Account {
  appId?: string;
  apiUrl?: string;
  isCentralizedAuth?: boolean;
}

/**
 * Parse centralized auth QR code data
 * QR data should be a JSON string with:
 * {
 *   "type": "tni-bouquet-account",
 *   "issuer": "TNI Bouquet Apps",
 *   "account": "user@example.com",
 *   "secret": "BASE32_ENCODED_SECRET",
 *   "app_id": "tni-bouquet-123-abc12345",
 *   "apiUrl": "https://your-api-url.com"
 * }
 */
export function parseCentralizedAuthQR(qrData: string): CentralizedAuthQRData | null {
  try {
    // Try parsing as JSON first (new centralized auth format)
    const parsed = JSON.parse(qrData);
    
    // Support both 'tni-bouquet-account' and 'account' types for flexibility
    const isValidType = parsed.type === 'tni-bouquet-account' || parsed.type === 'account';
    
    if (
      isValidType &&
      parsed.issuer &&
      parsed.account &&
      parsed.secret &&
      (parsed.app_id || parsed.appId) &&
      parsed.apiUrl
    ) {
      return {
        type: parsed.type,
        issuer: parsed.issuer,
        account: parsed.account,
        secret: parsed.secret.replace(/\s/g, '').toUpperCase(),
        app_id: parsed.app_id || parsed.appId,  // Support both snake_case and camelCase
        apiUrl: parsed.apiUrl,
      };
    }
  } catch (error) {
    // Not JSON, might be TOTP URI
    console.log('Not centralized auth QR format');
  }

  return null;
}

/**
 * Convert centralized auth QR data to account object
 */
export function centralizedAuthQRToAccount(
  qrData: CentralizedAuthQRData
): CentralizedAuthAccount {
  return {
    id: `${qrData.app_id}_${Date.now()}`,
    issuer: qrData.issuer,
    account: qrData.account,
    secret: qrData.secret,
    digits: 6,
    period: 30,
    createdAt: Date.now(),
    appId: qrData.app_id,
    apiUrl: qrData.apiUrl,
    isCentralizedAuth: true,
    authMethods: ['totp'], // Default to TOTP, others can be enabled
  };
}

/**
 * Check if an account is a centralized auth account
 */
export function isCentralizedAuthAccount(account: Account): account is CentralizedAuthAccount {
  return 'isCentralizedAuth' in account && (account as any).isCentralizedAuth === true;
}

/**
 * Generate QR code data from centralized auth account (for display/export)
 */
export function generateCentralizedAuthQRData(account: CentralizedAuthAccount): CentralizedAuthQRData {
  return {
    type: 'tni-bouquet-account',
    issuer: account.issuer,
    account: account.account,
    secret: account.secret,
    app_id: account.appId || '',
    apiUrl: account.apiUrl || '',
  };
}

/**
 * Validate centralized auth account configuration
 */
export function validateCentralizedAuthAccount(account: CentralizedAuthAccount): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];

  if (!account.appId) {
    errors.push('Missing app_id');
  }

  if (!account.apiUrl) {
    errors.push('Missing apiUrl');
  }

  if (!account.secret || account.secret.length < 16) {
    errors.push('Invalid or missing secret');
  }

  if (!account.account || !account.account.includes('@')) {
    errors.push('Invalid account email');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}
