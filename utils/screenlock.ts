import * as LocalAuthentication from 'expo-local-authentication';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Alert } from 'react-native';

const SCREEN_LOCK_ENABLED_KEY = '@screenlock_enabled_';

/**
 * Check if device has a screen lock (PIN, pattern, password) set up
 */
export async function checkScreenLockAvailability(): Promise<boolean> {
  try {
    // Check if device has authentication hardware
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    
    // Return true if hardware is available - we'll let the authentication
    // attempt handle whether credentials are actually enrolled
    return hasHardware;
  } catch (error) {
    console.error('Error checking screen lock availability:', error);
    return false;
  }
}

/**
 * Authenticate using device screen lock (PIN, pattern, password, or biometric)
 */
export async function authenticateWithScreenLock(
  accountId: string,
  promptMessage: string = 'Unlock to access your account'
): Promise<{ success: boolean; error?: string }> {
  try {
    // Authenticate with any available method (biometric or device passcode)
    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use PIN/Password',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false, // Allow fallback to device password/PIN
    });

    if (result.success) {
      return { success: true };
    } else {
      return {
        success: false,
        error: result.error || 'Authentication failed',
      };
    }
  } catch (error) {
    console.error('Screen lock authentication error:', error);
    return {
      success: false,
      error: 'An error occurred during authentication',
    };
  }
}

/**
 * Enable screen lock for an account
 */
export async function enableScreenLockForAccount(accountId: string): Promise<void> {
  try {
    await AsyncStorage.setItem(`${SCREEN_LOCK_ENABLED_KEY}${accountId}`, 'true');
  } catch (error) {
    console.error('Error enabling screen lock:', error);
    throw error;
  }
}

/**
 * Disable screen lock for an account
 */
export async function disableScreenLockForAccount(accountId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(`${SCREEN_LOCK_ENABLED_KEY}${accountId}`);
  } catch (error) {
    console.error('Error disabling screen lock:', error);
    throw error;
  }
}

/**
 * Check if screen lock is enabled for an account
 */
export async function isScreenLockEnabledForAccount(accountId: string): Promise<boolean> {
  try {
    const enabled = await AsyncStorage.getItem(`${SCREEN_LOCK_ENABLED_KEY}${accountId}`);
    return enabled === 'true';
  } catch (error) {
    console.error('Error checking screen lock status:', error);
    return false;
  }
}

/**
 * Show setup alert if screen lock is not available
 */
export async function showScreenLockSetupAlert(): Promise<void> {
  const isAvailable = await checkScreenLockAvailability();
  
  if (!isAvailable) {
    Alert.alert(
      'Setup Required',
      'Please set up a screen lock (PIN, pattern, or password) in your device settings first.',
      [{ text: 'OK' }]
    );
  }
}
