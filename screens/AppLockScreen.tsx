import React, { useState, useEffect } from 'react';
import { View, Text, Alert, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BlurView } from 'expo-blur';
import * as LocalAuthentication from 'expo-local-authentication';
import { useAppLock } from '../contexts/AppLockContext';
import { verifyAppLockPin, verifyAppLockPattern, getAppLockConfig } from '../utils/app-lock';
import { PatternPoint, patternToString } from '../utils/pattern';
import PinInput from '../components/PinInput';
import PatternInput from '../components/PatternInput';

export default function AppLockScreen() {
  const { unlock, lockType } = useAppLock();
  const [failedAttempts, setFailedAttempts] = useState(0);
  const [isLocked, setIsLocked] = useState(false);
  const [cooldownTime, setCooldownTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Auto-prompt biometric on mount if that's the lock type
    if (lockType === 'biometric') {
      handleBiometricAuth();
    }
  }, []);

  useEffect(() => {
    if (cooldownTime > 0) {
      const timer = setTimeout(() => {
        setCooldownTime(cooldownTime - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (isLocked) {
      setIsLocked(false);
      setFailedAttempts(0);
    }
  }, [cooldownTime]);

  const handleFailedAttempt = () => {
    const newAttempts = failedAttempts + 1;
    setFailedAttempts(newAttempts);

    if (newAttempts >= 5) {
      // Lock for 30 seconds after 5 failed attempts
      setIsLocked(true);
      setCooldownTime(30);
      Alert.alert(
        'Too Many Attempts',
        'Please wait 30 seconds before trying again.',
        [{ text: 'OK' }]
      );
    } else {
      Alert.alert(
        'Incorrect',
        `${5 - newAttempts} attempts remaining before lockout.`,
        [{ text: 'OK' }]
      );
    }
  };

  const handlePinComplete = async (pin: string) => {
    if (isLocked) return;

    setIsLoading(true);
    try {
      const isValid = await verifyAppLockPin(pin);
      if (isValid) {
        setFailedAttempts(0);
        unlock();
      } else {
        handleFailedAttempt();
      }
    } catch (error) {
      console.error('Error verifying PIN:', error);
      Alert.alert('Error', 'Failed to verify PIN. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePatternComplete = async (pattern: PatternPoint[]) => {
    if (isLocked) return;

    setIsLoading(true);
    try {
      const patternString = patternToString(pattern);
      const isValid = await verifyAppLockPattern(patternString);
      if (isValid) {
        setFailedAttempts(0);
        unlock();
      } else {
        handleFailedAttempt();
      }
    } catch (error) {
      console.error('Error verifying pattern:', error);
      Alert.alert('Error', 'Failed to verify pattern. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleBiometricAuth = async () => {
    if (isLocked) return;

    try {
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Unlock Authentication App',
        fallbackLabel: 'Use PIN',
        cancelLabel: 'Cancel',
        disableDeviceFallback: false,
      });

      if (result.success) {
        setFailedAttempts(0);
        unlock();
      } else {
        handleFailedAttempt();
      }
    } catch (error) {
      console.error('Biometric auth error:', error);
      Alert.alert('Error', 'Failed to authenticate. Please try again.');
    }
  };

  const renderAuthMethod = () => {
    if (isLocked) {
      return (
        <View style={styles.lockedContainer}>
          <Text style={styles.lockedTitle}>Too Many Attempts</Text>
          <Text style={styles.lockedText}>
            Please wait {cooldownTime} seconds
          </Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4dabf7" />
        </View>
      );
    }

    switch (lockType) {
      case 'pin':
        return (
          <PinInput
            onComplete={handlePinComplete}
            title="Enter PIN"
            subtitle="Enter your PIN to unlock the app"
            showCancel={false}
          />
        );

      case 'pattern':
        return (
          <PatternInput
            onComplete={handlePatternComplete}
            title="Draw Pattern"
            subtitle="Draw your pattern to unlock the app"
            mode="verify"
            showCancel={false}
          />
        );

      case 'biometric':
        return (
          <View style={styles.biometricContainer}>
            <Text style={styles.title}>App Locked</Text>
            <Text style={styles.subtitle}>Use biometric authentication to unlock</Text>
            <TouchableOpacity
              style={styles.biometricButton}
              onPress={handleBiometricAuth}
            >
              <Text style={styles.biometricButtonText}>Unlock with Biometric</Text>
            </TouchableOpacity>
          </View>
        );

      default:
        return (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Lock type not configured</Text>
          </View>
        );
    }
  };

  return (
    <BlurView intensity={100} style={styles.container}>
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
          <Text style={styles.appTitle}>🔒 Authentication App</Text>
        </View>
        {renderAuthMethod()}
        {failedAttempts > 0 && !isLocked && (
          <View style={styles.attemptsContainer}>
            <Text style={styles.attemptsText}>
              Failed attempts: {failedAttempts}/5
            </Text>
          </View>
        )}
      </SafeAreaView>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(26, 26, 46, 0.98)',
  },
  safeArea: {
    flex: 1,
  },
  header: {
    padding: 20,
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  appTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  biometricContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 40,
  },
  biometricButton: {
    backgroundColor: '#4dabf7',
    paddingVertical: 15,
    paddingHorizontal: 30,
    borderRadius: 10,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  biometricButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  lockedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  lockedTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ff6b6b',
    marginBottom: 10,
  },
  lockedText: {
    fontSize: 18,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#ff6b6b',
  },
  attemptsContainer: {
    padding: 20,
    alignItems: 'center',
  },
  attemptsText: {
    fontSize: 14,
    color: '#ff6b6b',
    fontWeight: '600',
  },
});
