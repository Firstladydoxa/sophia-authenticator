export type AuthMethod = 'totp' | 'biometric' | 'passkey' | 'screenlock' | 'pin' | 'pattern';

export interface Account {
  id: string;
  issuer: string;
  account: string;
  secret: string;
  digits: number;
  period: number;
  createdAt: number;
  authMethods?: AuthMethod[];
  preferredAuthMethod?: AuthMethod;
  // Centralized auth fields
  appId?: string;
  apiUrl?: string;
  isCentralizedAuth?: boolean;
}

export interface StorageData {
  accounts: Account[];
  version: string;
}

export interface AuthRequest {
  request_id: string;
  session_id: string;
  app_id: string;
  app_name: string;
  email: string;
  status: 'pending' | 'authenticated' | 'failed' | 'expired' | 'cancelled';
  available_methods: AuthMethod[];
  metadata?: {
    ip?: string;
    user_agent?: string;
    timestamp?: string;
  };
  expires_at: string;
  requested_at: string;
}
