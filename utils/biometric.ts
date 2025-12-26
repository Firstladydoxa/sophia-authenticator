import * as LocalAuthentication from 'expo-local-authentication';
import { Alert, Platform } from 'react-native';

export interface BiometricCapabilities {
  isAvailable: boolean;
  types: LocalAuthentication.AuthenticationType[];
  hasHardware: boolean;
  isEnrolled: boolean;
}

/**
 * Check if biometric authentication is available on the device
 */
export async function checkBiometricCapabilities(): Promise<BiometricCapabilities> {
  try {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    const types = await LocalAuthentication.supportedAuthenticationTypesAsync();
    
    return {
      isAvailable: hasHardware && isEnrolled,
      types,
      hasHardware,
      isEnrolled,
    };
  } catch (error) {
    console.error('Error checking biometric capabilities:', error);
    return {
      isAvailable: false,
      types: [],
      hasHardware: false,
      isEnrolled: false,
    };
  }
}

/**
 * Get a user-friendly name for the biometric type
 */
export function getBiometricTypeName(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    if (Platform.OS === 'ios') {
      return 'Face ID';
    }
    return 'Face Recognition';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    if (Platform.OS === 'ios') {
      return 'Touch ID';
    }
    return 'Fingerprint';
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return 'Iris Recognition';
  }
  return 'Biometric';
}

/**
 * Authenticate user with biometrics
 */
export async function authenticateWithBiometrics(
  promptMessage: string = 'Authenticate to access your account'
): Promise<{ success: boolean; error?: string }> {
  try {
    const capabilities = await checkBiometricCapabilities();
    
    if (!capabilities.isAvailable) {
      const reason = !capabilities.hasHardware
        ? 'Your device does not support biometric authentication'
        : 'No biometric credentials are enrolled on this device';
      
      return {
        success: false,
        error: reason,
      };
    }

    const result = await LocalAuthentication.authenticateAsync({
      promptMessage,
      fallbackLabel: 'Use Passcode',
      cancelLabel: 'Cancel',
      disableDeviceFallback: false,
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
    console.error('Biometric authentication error:', error);
    return {
      success: false,
      error: 'An error occurred during authentication',
    };
  }
}

/**
 * Show appropriate alert based on biometric availability
 */
export async function showBiometricSetupAlert(): Promise<void> {
  const capabilities = await checkBiometricCapabilities();
  
  if (!capabilities.hasHardware) {
    Alert.alert(
      'Not Supported',
      'Your device does not support biometric authentication.',
      [{ text: 'OK' }]
    );
  } else if (!capabilities.isEnrolled) {
    Alert.alert(
      'Setup Required',
      'Please set up biometric authentication in your device settings first.',
      [{ text: 'OK' }]
    );
  }
}

/**
 * Get icon for biometric type
 */
export function getBiometricIcon(types: LocalAuthentication.AuthenticationType[]): string {
  if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) {
    return '👤'; // Face icon
  }
  if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) {
    return '👆'; // Fingerprint icon
  }
  if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) {
    return '👁️'; // Iris icon
  }
  return '🔐';
}
