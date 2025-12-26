export type AuthMethod = 'totp' | 'biometric' | 'passkey' | 'screenlock';

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
}

export interface StorageData {
  accounts: Account[];
  version: string;
}
