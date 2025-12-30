import AsyncStorage from '@react-native-async-storage/async-storage';
import { hashCredential, verifyCredential } from './crypto';

const PIN_STORAGE_KEY = '@pin_credentials';

export interface PinCredential {
  accountId: string;
  hashedPin: string;
  createdAt: number;
}

/**
 * Set up PIN for an account
 */
export async function setupPin(accountId: string, pin: string): Promise<boolean> {
  try {
    if (!pin || pin.length < 4 || pin.length > 6) {
      throw new Error('PIN must be 4-6 digits');
    }

    if (!/^\d+$/.test(pin)) {
      throw new Error('PIN must contain only digits');
    }

    // Get existing credentials
    const existingStr = await AsyncStorage.getItem(PIN_STORAGE_KEY);
    const existing: PinCredential[] = existingStr ? JSON.parse(existingStr) : [];

    // Remove old PIN for this account if exists
    const filtered = existing.filter(c => c.accountId !== accountId);

    // Hash the PIN
    const hashedPin = await hashCredential(pin);

    // Add new PIN
    filtered.push({
      accountId,
      hashedPin,
      createdAt: Date.now()
    });

    await AsyncStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error setting up PIN:', error);
    throw error;
  }
}

/**
 * Verify PIN for an account
 */
export async function verifyPin(accountId: string, pin: string): Promise<boolean> {
  try {
    const existingStr = await AsyncStorage.getItem(PIN_STORAGE_KEY);
    if (!existingStr) {
      return false;
    }

    const credentials: PinCredential[] = JSON.parse(existingStr);
    const credential = credentials.find(c => c.accountId === accountId);

    if (!credential) {
      return false;
    }

    return await verifyCredential(pin, credential.hashedPin);
  } catch (error) {
    console.error('Error verifying PIN:', error);
    return false;
  }
}

/**
 * Check if PIN is set up for an account
 */
export async function hasPinSetup(accountId: string): Promise<boolean> {
  try {
    const existingStr = await AsyncStorage.getItem(PIN_STORAGE_KEY);
    if (!existingStr) {
      return false;
    }

    const credentials: PinCredential[] = JSON.parse(existingStr);
    return credentials.some(c => c.accountId === accountId);
  } catch (error) {
    console.error('Error checking PIN setup:', error);
    return false;
  }
}

/**
 * Remove PIN for an account
 */
export async function removePin(accountId: string): Promise<void> {
  try {
    const existingStr = await AsyncStorage.getItem(PIN_STORAGE_KEY);
    if (!existingStr) {
      return;
    }

    const credentials: PinCredential[] = JSON.parse(existingStr);
    const filtered = credentials.filter(c => c.accountId !== accountId);

    await AsyncStorage.setItem(PIN_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing PIN:', error);
    throw error;
  }
}
