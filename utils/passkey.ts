import * as SecureStore from 'expo-secure-store';
import * as Crypto from 'expo-crypto';
import { Alert } from 'react-native';

const PASSKEY_PREFIX = 'passkey_';

export interface Passkey {
  id: string;
  accountId: string;
  name: string;
  hashedKey: string;
  createdAt: number;
}

/**
 * Generate a secure hash for a passkey
 */
async function hashPasskey(passkey: string): Promise<string> {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    passkey
  );
}

/**
 * Create and store a new passkey for an account
 */
export async function createPasskey(
  accountId: string,
  passkey: string,
  name: string = 'My Passkey'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Validate passkey length
    if (passkey.length < 6) {
      return {
        success: false,
        error: 'Passkey must be at least 6 characters long',
      };
    }

    // Hash the passkey
    const hashedKey = await hashPasskey(passkey);

    // Create passkey object
    const passkeyData: Passkey = {
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 9)}`,
      accountId,
      name,
      hashedKey,
      createdAt: Date.now(),
    };

    // Store in secure store
    await SecureStore.setItemAsync(
      `${PASSKEY_PREFIX}${accountId}`,
      JSON.stringify(passkeyData)
    );

    return { success: true };
  } catch (error) {
    console.error('Error creating passkey:', error);
    return {
      success: false,
      error: 'Failed to create passkey',
    };
  }
}

/**
 * Verify a passkey for an account
 */
export async function verifyPasskey(
  accountId: string,
  passkey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // Retrieve stored passkey
    const storedData = await SecureStore.getItemAsync(`${PASSKEY_PREFIX}${accountId}`);

    if (!storedData) {
      return {
        success: false,
        error: 'No passkey found for this account',
      };
    }

    const passkeyData: Passkey = JSON.parse(storedData);

    // Hash the input passkey
    const hashedInput = await hashPasskey(passkey);

    // Compare hashes
    if (hashedInput === passkeyData.hashedKey) {
      return { success: true };
    } else {
      return {
        success: false,
        error: 'Invalid passkey',
      };
    }
  } catch (error) {
    console.error('Error verifying passkey:', error);
    return {
      success: false,
      error: 'Failed to verify passkey',
    };
  }
}

/**
 * Check if a passkey exists for an account
 */
export async function hasPasskey(accountId: string): Promise<boolean> {
  try {
    const storedData = await SecureStore.getItemAsync(`${PASSKEY_PREFIX}${accountId}`);
    return storedData !== null;
  } catch (error) {
    console.error('Error checking passkey:', error);
    return false;
  }
}

/**
 * Get passkey information for an account
 */
export async function getPasskeyInfo(accountId: string): Promise<Passkey | null> {
  try {
    const storedData = await SecureStore.getItemAsync(`${PASSKEY_PREFIX}${accountId}`);
    
    if (!storedData) {
      return null;
    }

    return JSON.parse(storedData);
  } catch (error) {
    console.error('Error getting passkey info:', error);
    return null;
  }
}

/**
 * Delete a passkey for an account
 */
export async function deletePasskey(accountId: string): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(`${PASSKEY_PREFIX}${accountId}`);
  } catch (error) {
    console.error('Error deleting passkey:', error);
    throw error;
  }
}

/**
 * Update an existing passkey
 */
export async function updatePasskey(
  accountId: string,
  oldPasskey: string,
  newPasskey: string
): Promise<{ success: boolean; error?: string }> {
  try {
    // First verify the old passkey
    const verifyResult = await verifyPasskey(accountId, oldPasskey);
    
    if (!verifyResult.success) {
      return {
        success: false,
        error: 'Current passkey is incorrect',
      };
    }

    // Get existing passkey data to preserve name
    const existingData = await getPasskeyInfo(accountId);
    const name = existingData?.name || 'My Passkey';

    // Delete old passkey
    await deletePasskey(accountId);

    // Create new passkey
    return await createPasskey(accountId, newPasskey, name);
  } catch (error) {
    console.error('Error updating passkey:', error);
    return {
      success: false,
      error: 'Failed to update passkey',
    };
  }
}

/**
 * Show a dialog to set up a new passkey
 */
export function showPasskeySetupPrompt(
  accountId: string,
  onSuccess: () => void
): void {
  Alert.prompt(
    'Create Passkey',
    'Enter a secure passkey (minimum 6 characters):',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Create',
        onPress: async (passkey?: string) => {
          if (!passkey) {
            Alert.alert('Error', 'Please enter a passkey');
            return;
          }

          const result = await createPasskey(accountId, passkey);
          
          if (result.success) {
            Alert.alert('Success', 'Passkey created successfully');
            onSuccess();
          } else {
            Alert.alert('Error', result.error || 'Failed to create passkey');
          }
        },
      },
    ],
    'secure-text'
  );
}

/**
 * Show a dialog to authenticate with passkey
 */
export function showPasskeyAuthPrompt(
  accountId: string,
  onSuccess: () => void,
  onError?: (error: string) => void
): void {
  Alert.prompt(
    'Enter Passkey',
    'Enter your passkey to authenticate:',
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {
        text: 'Verify',
        onPress: async (passkey?: string) => {
          if (!passkey) {
            const error = 'Please enter your passkey';
            Alert.alert('Error', error);
            if (onError) onError(error);
            return;
          }

          const result = await verifyPasskey(accountId, passkey);
          
          if (result.success) {
            Alert.alert('Success', 'Passkey verified successfully!');
            onSuccess();
          } else {
            const error = result.error || 'Invalid passkey';
            Alert.alert('Authentication Failed', error);
            if (onError) onError(error);
          }
        },
      },
    ],
    'secure-text'
  );
}
