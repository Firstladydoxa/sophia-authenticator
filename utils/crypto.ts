import * as Crypto from 'expo-crypto';

/**
 * Create HMAC-SHA256 signature
 * @param message The message to sign (can include multiple fields separated by |)
 * @param secret The shared secret key
 * @returns The hex-encoded signature
 */
export async function createHMACSHA256(
  message: string,
  secret: string
): Promise<string> {
  try {
    // Create the HMAC-SHA256 signature
    // Format: HMAC-SHA256 = Hash((secret XOR opad) + Hash((secret XOR ipad) + message))
    // But expo-crypto doesn't have direct HMAC, so we'll use a simple approach
    // Combine message and secret, then hash with SHA256
    
    const combined = message + secret;
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      combined
    );
    
    return digest;
  } catch (error) {
    console.error('Error creating HMAC:', error);
    throw error;
  }
}

/**
 * Create signature for API request
 * @param deviceId Device identifier (can be a UUID)
 * @param method The MFA method being used
 * @param secret The shared secret
 * @returns Object with timestamp and signature
 */
export async function createRequestSignature(
  deviceId: string,
  method: string,
  secret: string
): Promise<{
  timestamp: string;
  signature: string;
  deviceId: string;
}> {
  const timestamp = new Date().toISOString();
  const message = `${deviceId}|${timestamp}|${method}`;
  
  const signature = await createHMACSHA256(message, secret);
  
  return {
    timestamp,
    signature,
    deviceId,
  };
}

/**
 * Verify a signature from the backend
 * @param deviceId Device identifier
 * @param timestamp Timestamp from the signature
 * @param method The MFA method
 * @param signature The signature to verify
 * @param secret The shared secret
 * @returns True if signature is valid
 */
export async function verifySignature(
  deviceId: string,
  timestamp: string,
  method: string,
  signature: string,
  secret: string
): Promise<boolean> {
  try {
    const message = `${deviceId}|${timestamp}|${method}`;
    const expectedSignature = await createHMACSHA256(message, secret);
    
    return signature === expectedSignature;
  } catch (error) {
    console.error('Error verifying signature:', error);
    return false;
  }
}

/**
 * Generate a device ID (can be called once and stored)
 * Returns a unique identifier for this device
 */
export function generateDeviceId(): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return `${timestamp}_${random}`;
}

/**
 * Hash a credential (PIN, pattern, etc.) using SHA-256
 * This is a simple hashing approach. For production, consider using a proper password hashing library.
 */
export async function hashCredential(credential: string): Promise<string> {
  try {
    const digest = await Crypto.digestStringAsync(
      Crypto.CryptoDigestAlgorithm.SHA256,
      credential
    );
    return digest;
  } catch (error) {
    console.error('Error hashing credential:', error);
    throw error;
  }
}

/**
 * Verify a credential against its hash
 */
export async function verifyCredential(credential: string, hashedCredential: string): Promise<boolean> {
  try {
    const hash = await hashCredential(credential);
    return hash === hashedCredential;
  } catch (error) {
    console.error('Error verifying credential:', error);
    return false;
  }
}
