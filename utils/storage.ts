import AsyncStorage from '@react-native-async-storage/async-storage';
import { Account, StorageData } from '../types';
import PushNotificationService from '../services/PushNotificationService';

const STORAGE_KEY = '@authenticator_accounts';
const STORAGE_VERSION = '1.0';

/**
 * Load all accounts from storage
 */
export async function loadAccounts(): Promise<Account[]> {
  try {
    const data = await AsyncStorage.getItem(STORAGE_KEY);
    if (!data) {
      return [];
    }

    const parsed: StorageData = JSON.parse(data);
    return parsed.accounts || [];
  } catch (error) {
    console.error('Error loading accounts:', error);
    return [];
  }
}

/**
 * Save accounts to storage
 */
export async function saveAccounts(accounts: Account[]): Promise<void> {
  try {
    const data: StorageData = {
      accounts,
      version: STORAGE_VERSION,
    };
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error saving accounts:', error);
    throw error;
  }
}

/**
 * Add a new account
 */
export async function addAccount(account: Omit<Account, 'id' | 'createdAt'>): Promise<Account> {
  const accounts = await loadAccounts();
  
  const newAccount: Account = {
    ...account,
    id: generateId(),
    createdAt: Date.now(),
  };

  accounts.push(newAccount);
  await saveAccounts(accounts);
  
  // Register FCM token if account has email
  if (newAccount.account && newAccount.account.includes('@')) {
    try {
      await PushNotificationService.registerToken(newAccount.account);
      console.log('FCM token registered for:', newAccount.account);
    } catch (error) {
      console.error('Error registering FCM token:', error);
      // Don't fail the account creation if FCM registration fails
    }
  }
  
  return newAccount;
}

/**
 * Delete an account by ID
 */
export async function deleteAccount(id: string): Promise<void> {
  const accounts = await loadAccounts();
  const accountToDelete = accounts.find(acc => acc.id === id);
  
  // Unregister FCM token if account has an email (push notifications)
  if (accountToDelete?.account && accountToDelete.account.includes('@')) {
    try {
      await PushNotificationService.unregisterToken(accountToDelete.account);
      console.log('FCM token unregistered for:', accountToDelete.account);
    } catch (error) {
      console.error('Error unregistering FCM token:', error);
      // Continue with deletion even if unregistration fails
    }
  }
  
  const filtered = accounts.filter(acc => acc.id !== id);
  await saveAccounts(filtered);
}

/**
 * Update an account
 */
export async function updateAccount(accountOrId: Account | string, updates?: Partial<Account>): Promise<void> {
  const accounts = await loadAccounts();
  
  if (typeof accountOrId === 'string') {
    // Old signature: updateAccount(id, updates)
    const index = accounts.findIndex(acc => acc.id === accountOrId);
    if (index !== -1 && updates) {
      accounts[index] = { ...accounts[index], ...updates };
      await saveAccounts(accounts);
    }
  } else {
    // New signature: updateAccount(account)
    const index = accounts.findIndex(acc => acc.id === accountOrId.id);
    if (index !== -1) {
      accounts[index] = accountOrId;
      await saveAccounts(accounts);
    }
  }
}

/**
 * Generate a unique ID
 */
function generateId(): string {
  return `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Clear all data (for testing or reset)
 */
export async function clearAllData(): Promise<void> {
  try {
    await AsyncStorage.removeItem(STORAGE_KEY);
  } catch (error) {
    console.error('Error clearing data:', error);
    throw error;
  }
}

/**
 * Alias for backward compatibility
 */
export const getAccounts = loadAccounts;

