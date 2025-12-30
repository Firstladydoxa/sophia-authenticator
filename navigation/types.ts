export type RootStackParamList = {
  MainTabs: undefined;
  ScanQR: undefined;
  AccountDetails: { accountId: string };
  ApproveLogin: {
    email: string;
    tempToken: string;
    appId: string;
    timestamp: number;
  };
  SetupPin: { accountId: string };
  VerifyPin: { accountId: string; onSuccess?: () => void };
  SetupPattern: { accountId: string };
  VerifyPattern: { accountId: string; onSuccess?: () => void };
};
