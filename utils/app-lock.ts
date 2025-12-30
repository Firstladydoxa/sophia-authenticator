import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { AppState, AppStateStatus } from 'react-native';

const APP_LOCK_ENABLED_KEY = '@app_lock_enabled';
const APP_LOCK_TYPE_KEY = '@app_lock_type';
const APP_LOCK_TIMEOUT_KEY = '@app_lock_timeout';
const LAST_ACTIVITY_KEY = '@last_activity';
const APP_LOCK_PIN_KEY = 'app_lock_pin';
const APP_LOCK_PATTERN_KEY = 'app_lock_pattern';

export type AppLockType = 'pin' | 'pattern' | 'biometric' | 'none';
export type AppLockTimeout = 0 | 30 | 60 | 300 | 900; // seconds: immediate, 30s, 1min, 5min, 15min

export interface AppLockConfig {
  enabled: boolean;
  type: AppLockType;
  timeout: AppLockTimeout;
}

/**
 * Get current app lock configuration
 */
export async function getAppLockConfig(): Promise<AppLockConfig> {
  try {
    const enabled = await AsyncStorage.getItem(APP_LOCK_ENABLED_KEY);
    const type = await AsyncStorage.getItem(APP_LOCK_TYPE_KEY);
    const timeout = await AsyncStorage.getItem(APP_LOCK_TIMEOUT_KEY);

    return {
      enabled: enabled === 'true',
      type: (type as AppLockType) || 'none',
      timeout: timeout ? parseInt(timeout, 10) as AppLockTimeout : 60,
    };
  } catch (error) {
    console.error('Error getting app lock config:', error);
    return {
      enabled: false,
      type: 'none',
      timeout: 60,
    };
  }
}

/**
 * Set app lock configuration
 */
export async function setAppLockConfig(config: Partial<AppLockConfig>): Promise<void> {
  try {
    if (config.enabled !== undefined) {
      await AsyncStorage.setItem(APP_LOCK_ENABLED_KEY, config.enabled.toString());
    }
    if (config.type !== undefined) {
      await AsyncStorage.setItem(APP_LOCK_TYPE_KEY, config.type);
    }
    if (config.timeout !== undefined) {
      await AsyncStorage.setItem(APP_LOCK_TIMEOUT_KEY, config.timeout.toString());
    }
  } catch (error) {
    console.error('Error setting app lock config:', error);
    throw error;
  }
}

/**
 * Store app lock PIN (for app-level security)
 */
export async function setAppLockPin(pin: string): Promise<void> {
  try {
    const crypto = require('expo-crypto');
    const hashedPin = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );
    await SecureStore.setItemAsync(APP_LOCK_PIN_KEY, hashedPin);
  } catch (error) {
    console.error('Error setting app lock PIN:', error);
    throw error;
  }
}

/**
 * Verify app lock PIN
 */
export async function verifyAppLockPin(pin: string): Promise<boolean> {
  try {
    const storedHash = await SecureStore.getItemAsync(APP_LOCK_PIN_KEY);
    if (!storedHash) {
      return false;
    }

    const crypto = require('expo-crypto');
    const hashedPin = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      pin
    );

    return hashedPin === storedHash;
  } catch (error) {
    console.error('Error verifying app lock PIN:', error);
    return false;
  }
}

/**
 * Store app lock pattern (for app-level security)
 */
export async function setAppLockPattern(patternString: string): Promise<void> {
  try {
    const crypto = require('expo-crypto');
    const hashedPattern = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      patternString
    );
    await SecureStore.setItemAsync(APP_LOCK_PATTERN_KEY, hashedPattern);
  } catch (error) {
    console.error('Error setting app lock pattern:', error);
    throw error;
  }
}

/**
 * Verify app lock pattern
 */
export async function verifyAppLockPattern(patternString: string): Promise<boolean> {
  try {
    const storedHash = await SecureStore.getItemAsync(APP_LOCK_PATTERN_KEY);
    if (!storedHash) {
      return false;
    }

    const crypto = require('expo-crypto');
    const hashedPattern = await crypto.digestStringAsync(
      crypto.CryptoDigestAlgorithm.SHA256,
      patternString
    );

    return hashedPattern === storedHash;
  } catch (error) {
    console.error('Error verifying app lock pattern:', error);
    return false;
  }
}

/**
 * Check if app lock credentials are set up
 */
export async function hasAppLockCredentials(type: AppLockType): Promise<boolean> {
  try {
    if (type === 'pin') {
      const pin = await SecureStore.getItemAsync(APP_LOCK_PIN_KEY);
      return !!pin;
    } else if (type === 'pattern') {
      const pattern = await SecureStore.getItemAsync(APP_LOCK_PATTERN_KEY);
      return !!pattern;
    } else if (type === 'biometric') {
      // Biometric uses device credentials, always available if hardware supports it
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error checking app lock credentials:', error);
    return false;
  }
}

/**
 * Update last activity timestamp
 */
export async function updateLastActivity(): Promise<void> {
  try {
    const timestamp = Date.now().toString();
    await AsyncStorage.setItem(LAST_ACTIVITY_KEY, timestamp);
  } catch (error) {
    console.error('Error updating last activity:', error);
  }
}

/**
 * Get last activity timestamp
 */
export async function getLastActivity(): Promise<number> {
  try {
    const timestamp = await AsyncStorage.getItem(LAST_ACTIVITY_KEY);
    return timestamp ? parseInt(timestamp, 10) : Date.now();
  } catch (error) {
    console.error('Error getting last activity:', error);
    return Date.now();
  }
}

/**
 * Check if app should be locked based on timeout
 */
export async function shouldLockApp(): Promise<boolean> {
  try {
    const config = await getAppLockConfig();
    
    if (!config.enabled || config.type === 'none') {
      return false;
    }

    // Immediate lock (timeout = 0)
    if (config.timeout === 0) {
      return true;
    }

    const lastActivity = await getLastActivity();
    const now = Date.now();
    const elapsed = (now - lastActivity) / 1000; // Convert to seconds

    return elapsed >= config.timeout;
  } catch (error) {
    console.error('Error checking if app should lock:', error);
    return false;
  }
}

/**
 * Clear app lock credentials (for disabling app lock)
 */
export async function clearAppLockCredentials(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(APP_LOCK_PIN_KEY);
    await SecureStore.deleteItemAsync(APP_LOCK_PATTERN_KEY);
  } catch (error) {
    console.error('Error clearing app lock credentials:', error);
  }
}

/**
 * Reset app lock (disable and clear all settings)
 */
export async function resetAppLock(): Promise<void> {
  try {
    await AsyncStorage.removeItem(APP_LOCK_ENABLED_KEY);
    await AsyncStorage.removeItem(APP_LOCK_TYPE_KEY);
    await AsyncStorage.removeItem(APP_LOCK_TIMEOUT_KEY);
    await AsyncStorage.removeItem(LAST_ACTIVITY_KEY);
    await clearAppLockCredentials();
  } catch (error) {
    console.error('Error resetting app lock:', error);
    throw error;
  }
}
