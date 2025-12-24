export interface Account {
  id: string;
  issuer: string;
  account: string;
  secret: string;
  digits: number;
  period: number;
  createdAt: number;
}

export interface StorageData {
  accounts: Account[];
  version: string;
}
