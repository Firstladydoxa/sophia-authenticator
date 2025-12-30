import AsyncStorage from '@react-native-async-storage/async-storage';
import { hashCredential, verifyCredential } from './crypto';

const PATTERN_STORAGE_KEY = '@pattern_credentials';

export interface PatternCredential {
  accountId: string;
  hashedPattern: string;
  gridSize: number;
  createdAt: number;
}

export type PatternPoint = {
  row: number;
  col: number;
};

/**
 * Convert pattern points to string
 */
export function patternToString(points: PatternPoint[]): string {
  return points.map(p => `${p.row},${p.col}`).join('-');
}

/**
 * Parse string to pattern points
 */
export function stringToPattern(str: string): PatternPoint[] {
  return str.split('-').map(point => {
    const [row, col] = point.split(',').map(Number);
    return { row, col };
  });
}

/**
 * Validate pattern
 */
export function validatePattern(points: PatternPoint[], gridSize: number = 3): boolean {
  // Must have at least 4 points
  if (points.length < 4) {
    return false;
  }

  // Check for duplicates
  const uniquePoints = new Set(points.map(p => `${p.row},${p.col}`));
  if (uniquePoints.size !== points.length) {
    return false;
  }

  // Check bounds
  return points.every(p => 
    p.row >= 0 && p.row < gridSize && 
    p.col >= 0 && p.col < gridSize
  );
}

/**
 * Set up pattern for an account
 */
export async function setupPattern(
  accountId: string, 
  pattern: PatternPoint[], 
  gridSize: number = 3
): Promise<boolean> {
  try {
    if (!validatePattern(pattern, gridSize)) {
      throw new Error('Invalid pattern. Must have at least 4 unique points within grid bounds.');
    }

    // Get existing credentials
    const existingStr = await AsyncStorage.getItem(PATTERN_STORAGE_KEY);
    const existing: PatternCredential[] = existingStr ? JSON.parse(existingStr) : [];

    // Remove old pattern for this account if exists
    const filtered = existing.filter(c => c.accountId !== accountId);

    // Hash the pattern
    const patternStr = patternToString(pattern);
    const hashedPattern = await hashCredential(patternStr);

    // Add new pattern
    filtered.push({
      accountId,
      hashedPattern,
      gridSize,
      createdAt: Date.now()
    });

    await AsyncStorage.setItem(PATTERN_STORAGE_KEY, JSON.stringify(filtered));
    return true;
  } catch (error) {
    console.error('Error setting up pattern:', error);
    throw error;
  }
}

/**
 * Verify pattern for an account
 */
export async function verifyPattern(accountId: string, pattern: PatternPoint[]): Promise<boolean> {
  try {
    const existingStr = await AsyncStorage.getItem(PATTERN_STORAGE_KEY);
    if (!existingStr) {
      return false;
    }

    const credentials: PatternCredential[] = JSON.parse(existingStr);
    const credential = credentials.find(c => c.accountId === accountId);

    if (!credential) {
      return false;
    }

    const patternStr = patternToString(pattern);
    return await verifyCredential(patternStr, credential.hashedPattern);
  } catch (error) {
    console.error('Error verifying pattern:', error);
    return false;
  }
}

/**
 * Check if pattern is set up for an account
 */
export async function hasPatternSetup(accountId: string): Promise<boolean> {
  try {
    const existingStr = await AsyncStorage.getItem(PATTERN_STORAGE_KEY);
    if (!existingStr) {
      return false;
    }

    const credentials: PatternCredential[] = JSON.parse(existingStr);
    return credentials.some(c => c.accountId === accountId);
  } catch (error) {
    console.error('Error checking pattern setup:', error);
    return false;
  }
}

/**
 * Remove pattern for an account
 */
export async function removePattern(accountId: string): Promise<void> {
  try {
    const existingStr = await AsyncStorage.getItem(PATTERN_STORAGE_KEY);
    if (!existingStr) {
      return;
    }

    const credentials: PatternCredential[] = JSON.parse(existingStr);
    const filtered = credentials.filter(c => c.accountId !== accountId);

    await AsyncStorage.setItem(PATTERN_STORAGE_KEY, JSON.stringify(filtered));
  } catch (error) {
    console.error('Error removing pattern:', error);
    throw error;
  }
}

/**
 * Get grid size for account's pattern
 */
export async function getPatternGridSize(accountId: string): Promise<number> {
  try {
    const existingStr = await AsyncStorage.getItem(PATTERN_STORAGE_KEY);
    if (!existingStr) {
      return 3; // default
    }

    const credentials: PatternCredential[] = JSON.parse(existingStr);
    const credential = credentials.find(c => c.accountId === accountId);

    return credential?.gridSize || 3;
  } catch (error) {
    console.error('Error getting pattern grid size:', error);
    return 3;
  }
}
