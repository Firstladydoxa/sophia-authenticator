import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as LocalAuthentication from 'expo-local-authentication';
import { setAppLockConfig, setAppLockPin, setAppLockPattern, AppLockType, AppLockTimeout } from '../utils/app-lock';
import { PatternPoint, patternToString, validatePattern } from '../utils/pattern';
import PinInput from '../components/PinInput';
import PatternInput from '../components/PatternInput';

interface OnboardingSetupScreenProps {
  onComplete: () => void;
}

const TIMEOUT_OPTIONS: { label: string; value: AppLockTimeout }[] = [
  { label: 'Immediately', value: 0 },
  { label: 'After 30 seconds', value: 30 },
  { label: 'After 1 minute', value: 60 },
  { label: 'After 5 minutes', value: 300 },
  { label: 'After 15 minutes', value: 900 },
];

export default function OnboardingSetupScreen({ onComplete }: OnboardingSetupScreenProps) {
  const [step, setStep] = useState<'welcome' | 'selectType' | 'setupPin' | 'setupPattern' | 'selectTimeout'>('welcome');
  const [selectedType, setSelectedType] = useState<AppLockType>('none');
  const [selectedTimeout, setSelectedTimeout] = useState<AppLockTimeout>(60);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [setupStep, setSetupStep] = useState<'first' | 'confirm'>('first');
  const [firstPin, setFirstPin] = useState<string>('');
  const [firstPattern, setFirstPattern] = useState<PatternPoint[]>([]);

  React.useEffect(() => {
    checkBiometricAvailability();
  }, []);

  const checkBiometricAvailability = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(hasHardware && isEnrolled);
  };

  const handleSelectType = async (type: AppLockType) => {
    if (type === 'biometric' && !biometricAvailable) {
      Alert.alert(
        'Biometric Not Available',
        'Please set up biometric authentication in your device settings first.',
        [{ text: 'OK' }]
      );
      return;
    }

    setSelectedType(type);

    if (type === 'pin') {
      setStep('setupPin');
    } else if (type === 'pattern') {
      setStep('setupPattern');
    } else if (type === 'biometric') {
      setStep('selectTimeout');
    }
  };

  const handlePinComplete = async (pin: string) => {
    if (setupStep === 'first') {
      setFirstPin(pin);
      setSetupStep('confirm');
    } else {
      if (pin === firstPin) {
        try {
          await setAppLockPin(pin);
          setStep('selectTimeout');
        } catch (error) {
          Alert.alert('Error', 'Failed to set up PIN. Please try again.');
          setSetupStep('first');
          setFirstPin('');
        }
      } else {
        Alert.alert('Mismatch', 'PINs do not match. Please try again.');
        setSetupStep('first');
        setFirstPin('');
      }
    }
  };

  const handlePatternComplete = async (pattern: PatternPoint[]) => {
    if (!validatePattern(pattern)) {
      Alert.alert('Invalid Pattern', 'Pattern must have at least 4 unique points.');
      return;
    }

    if (setupStep === 'first') {
      setFirstPattern(pattern);
      setSetupStep('confirm');
    } else {
      const firstPatternStr = patternToString(firstPattern);
      const currentPatternStr = patternToString(pattern);

      if (currentPatternStr === firstPatternStr) {
        try {
          await setAppLockPattern(currentPatternStr);
          setStep('selectTimeout');
        } catch (error) {
          Alert.alert('Error', 'Failed to set up pattern. Please try again.');
          setSetupStep('first');
          setFirstPattern([]);
        }
      } else {
        Alert.alert('Mismatch', 'Patterns do not match. Please try again.');
        setSetupStep('first');
        setFirstPattern([]);
      }
    }
  };

  const handleTimeoutSelect = async (timeout: AppLockTimeout) => {
    try {
      await setAppLockConfig({
        enabled: true,
        type: selectedType,
        timeout,
      });

      Alert.alert(
        'Setup Complete!',
        'Your authenticator app is now secured. You will need to authenticate when opening the app.',
        [
          {
            text: 'Get Started',
            onPress: onComplete,
          },
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save settings. Please try again.');
    }
  };

  if (step === 'welcome') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.emoji}>🔐</Text>
          <Text style={styles.title}>Welcome to Sophia Authenticator</Text>
          <Text style={styles.description}>
            To keep your accounts secure, you need to set up app protection before getting started.
          </Text>
          <Text style={styles.description}>
            Choose how you'd like to secure your authenticator app.
          </Text>

          <TouchableOpacity
            style={styles.startButton}
            onPress={() => setStep('selectType')}
          >
            <Text style={styles.startButtonText}>Set Up Security</Text>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 'selectType') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Choose Lock Type</Text>
          <Text style={styles.subtitle}>
            This will be required every time you open the app
          </Text>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSelectType('pin')}
          >
            <Text style={styles.optionEmoji}>🔢</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>PIN Code</Text>
              <Text style={styles.optionDescription}>4-6 digit numeric code</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.optionCard}
            onPress={() => handleSelectType('pattern')}
          >
            <Text style={styles.optionEmoji}>🔗</Text>
            <View style={styles.optionContent}>
              <Text style={styles.optionTitle}>Pattern Lock</Text>
              <Text style={styles.optionDescription}>Draw a pattern on a 3x3 grid</Text>
            </View>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionCard,
              !biometricAvailable && styles.optionCardDisabled,
            ]}
            onPress={() => handleSelectType('biometric')}
            disabled={!biometricAvailable}
          >
            <Text style={styles.optionEmoji}>👆</Text>
            <View style={styles.optionContent}>
              <Text
                style={[
                  styles.optionTitle,
                  !biometricAvailable && styles.disabledText,
                ]}
              >
                Biometric
              </Text>
              <Text
                style={[
                  styles.optionDescription,
                  !biometricAvailable && styles.disabledText,
                ]}
              >
                {biometricAvailable
                  ? 'Fingerprint or Face ID'
                  : 'Not available on this device'}
              </Text>
            </View>
          </TouchableOpacity>
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (step === 'setupPin') {
    return (
      <SafeAreaView style={styles.container}>
        <PinInput
          key={setupStep}
          onComplete={handlePinComplete}
          title={setupStep === 'first' ? 'Create PIN' : 'Confirm PIN'}
          subtitle={
            setupStep === 'first'
              ? 'Enter a 4-6 digit PIN'
              : 'Enter your PIN again to confirm'
          }
          showCancel={false}
        />
      </SafeAreaView>
    );
  }

  if (step === 'setupPattern') {
    return (
      <SafeAreaView style={styles.container}>
        <PatternInput
          key={setupStep}
          onComplete={handlePatternComplete}
          title={setupStep === 'first' ? 'Create Pattern' : 'Confirm Pattern'}
          subtitle={
            setupStep === 'first'
              ? 'Draw a pattern with at least 4 points'
              : 'Draw your pattern again to confirm'
          }
          mode="setup"
          showCancel={false}
        />
      </SafeAreaView>
    );
  }

  if (step === 'selectTimeout') {
    return (
      <SafeAreaView style={styles.container}>
        <ScrollView contentContainerStyle={styles.content}>
          <Text style={styles.title}>Auto-Lock Timeout</Text>
          <Text style={styles.subtitle}>
            When should the app lock after inactivity?
          </Text>

          {TIMEOUT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.value}
              style={[
                styles.timeoutOption,
                selectedTimeout === option.value && styles.timeoutOptionSelected,
              ]}
              onPress={() => handleTimeoutSelect(option.value)}
            >
              <Text style={styles.timeoutLabel}>{option.label}</Text>
              {selectedTimeout === option.value && (
                <Text style={styles.checkmark}>✓</Text>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  emoji: {
    fontSize: 80,
    marginTop: 40,
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 32,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 24,
  },
  startButton: {
    backgroundColor: '#4dabf7',
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    marginTop: 32,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  startButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    width: '100%',
  },
  optionCardDisabled: {
    opacity: 0.5,
  },
  optionEmoji: {
    fontSize: 40,
    marginRight: 16,
  },
  optionContent: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  optionDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  disabledText: {
    color: 'rgba(255, 255, 255, 0.4)',
  },
  timeoutOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 10,
    marginBottom: 12,
    width: '100%',
  },
  timeoutOptionSelected: {
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    borderWidth: 2,
    borderColor: '#4dabf7',
  },
  timeoutLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#fff',
  },
  checkmark: {
    fontSize: 20,
    color: '#4dabf7',
    fontWeight: 'bold',
  },
});
