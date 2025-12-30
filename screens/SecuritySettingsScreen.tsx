import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import * as LocalAuthentication from 'expo-local-authentication';
import {
  getAppLockConfig,
  setAppLockConfig,
  setAppLockPin,
  setAppLockPattern,
  hasAppLockCredentials,
  resetAppLock,
  AppLockType,
  AppLockTimeout,
} from '../utils/app-lock';
import { useAppLock } from '../contexts/AppLockContext';
import { PatternPoint, patternToString, validatePattern } from '../utils/pattern';
import PinInput from '../components/PinInput';
import PatternInput from '../components/PatternInput';

type SecuritySettingsNavigationProp = NativeStackNavigationProp<RootStackParamList>;

const TIMEOUT_OPTIONS: { label: string; value: AppLockTimeout }[] = [
  { label: 'Immediately', value: 0 },
  { label: 'After 30 seconds', value: 30 },
  { label: 'After 1 minute', value: 60 },
  { label: 'After 5 minutes', value: 300 },
  { label: 'After 15 minutes', value: 900 },
];

export default function SecuritySettingsScreen() {
  const navigation = useNavigation<SecuritySettingsNavigationProp>();
  const { refreshConfig } = useAppLock();
  
  const [enabled, setEnabled] = useState(false);
  const [lockType, setLockType] = useState<AppLockType>('none');
  const [timeout, setTimeout] = useState<AppLockTimeout>(60);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [setupMode, setSetupMode] = useState<'pin' | 'pattern' | null>(null);
  const [setupStep, setSetupStep] = useState<'first' | 'confirm'>('first');
  const [firstPin, setFirstPin] = useState<string>('');
  const [firstPattern, setFirstPattern] = useState<PatternPoint[]>([]);

  useEffect(() => {
    loadConfig();
    checkBiometricAvailability();
  }, []);

  const loadConfig = async () => {
    const config = await getAppLockConfig();
    setEnabled(config.enabled);
    setLockType(config.type);
    setTimeout(config.timeout);
  };

  const checkBiometricAvailability = async () => {
    const hasHardware = await LocalAuthentication.hasHardwareAsync();
    const isEnrolled = await LocalAuthentication.isEnrolledAsync();
    setBiometricAvailable(hasHardware && isEnrolled);
  };

  const handleToggleEnabled = async (value: boolean) => {
    if (value && lockType === 'none') {
      Alert.alert(
        'Select Lock Type',
        'Please select a lock type before enabling app lock.',
        [{ text: 'OK' }]
      );
      return;
    }

    if (value && lockType !== 'biometric') {
      const hasCredentials = await hasAppLockCredentials(lockType);
      if (!hasCredentials) {
        Alert.alert(
          'Setup Required',
          `Please set up your ${lockType === 'pin' ? 'PIN' : 'pattern'} first.`,
          [{ text: 'OK' }]
        );
        return;
      }
    }

    setEnabled(value);
    await setAppLockConfig({ enabled: value });
    await refreshConfig();
  };

  const handleSelectLockType = async (type: AppLockType) => {
    if (type === 'biometric' && !biometricAvailable) {
      Alert.alert(
        'Biometric Not Available',
        'Please set up biometric authentication in your device settings first.',
        [{ text: 'OK' }]
      );
      return;
    }

    // If switching from one type to another while enabled, prompt setup
    if (enabled && (type === 'pin' || type === 'pattern')) {
      const hasCredentials = await hasAppLockCredentials(type);
      if (!hasCredentials) {
        setSetupMode(type);
        return;
      }
    }

    setLockType(type);
    await setAppLockConfig({ type });
    await refreshConfig();
  };

  const handleSelectTimeout = async (value: AppLockTimeout) => {
    setTimeout(value);
    await setAppLockConfig({ timeout: value });
    await refreshConfig();
  };

  const handleSetupPin = (mode: 'pin') => {
    setSetupMode(mode);
    setSetupStep('first');
  };

  const handleSetupPattern = (mode: 'pattern') => {
    setSetupMode(mode);
    setSetupStep('first');
  };

  const handlePinComplete = async (pin: string) => {
    if (setupStep === 'first') {
      setFirstPin(pin);
      setSetupStep('confirm');
    } else {
      if (pin === firstPin) {
        try {
          await setAppLockPin(pin);
          setLockType('pin');
          await setAppLockConfig({ type: 'pin' });
          await refreshConfig();
          setSetupMode(null);
          setSetupStep('first');
          setFirstPin('');
          Alert.alert('Success', 'PIN has been set up successfully!');
        } catch (error) {
          Alert.alert('Error', 'Failed to set up PIN. Please try again.');
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
          setLockType('pattern');
          await setAppLockConfig({ type: 'pattern' });
          await refreshConfig();
          setSetupMode(null);
          setSetupStep('first');
          setFirstPattern([]);
          Alert.alert('Success', 'Pattern has been set up successfully!');
        } catch (error) {
          Alert.alert('Error', 'Failed to set up pattern. Please try again.');
        }
      } else {
        Alert.alert('Mismatch', 'Patterns do not match. Please try again.');
        setSetupStep('first');
        setFirstPattern([]);
      }
    }
  };

  const handleCancelSetup = () => {
    setSetupMode(null);
    setSetupStep('first');
    setFirstPin('');
    setFirstPattern([]);
  };

  const handleResetLock = () => {
    Alert.alert(
      'Reset App Lock',
      'This will disable app lock and clear all security settings. Are you sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            try {
              await resetAppLock();
              setEnabled(false);
              setLockType('none');
              setTimeout(60);
              await refreshConfig();
              Alert.alert('Success', 'App lock has been reset.');
            } catch (error) {
              Alert.alert('Error', 'Failed to reset app lock.');
            }
          },
        },
      ]
    );
  };

  if (setupMode) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancelSetup}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {setupMode === 'pin' ? 'Setup PIN' : 'Setup Pattern'}
          </Text>
          <View style={{ width: 60 }} />
        </View>
        {setupMode === 'pin' ? (
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
        ) : (
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
        )}
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Security Settings</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Enable/Disable App Lock */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>App Lock</Text>
          </View>
          <View style={styles.settingRow}>
            <View style={styles.settingInfo}>
              <Text style={styles.settingLabel}>Enable App Lock</Text>
              <Text style={styles.settingDescription}>
                Require authentication to access the app
              </Text>
            </View>
            <Switch
              value={enabled}
              onValueChange={handleToggleEnabled}
              trackColor={{ false: '#767577', true: '#4dabf7' }}
              thumbColor={enabled ? '#fff' : '#f4f3f4'}
            />
          </View>
        </View>

        {/* Lock Type Selection */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Lock Type</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.optionRow, lockType === 'pin' && styles.optionRowSelected]}
            onPress={() => handleSelectLockType('pin')}
          >
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>PIN Code</Text>
              <Text style={styles.optionDescription}>4-6 digit numeric code</Text>
            </View>
            {lockType === 'pin' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.optionRow, lockType === 'pattern' && styles.optionRowSelected]}
            onPress={() => handleSelectLockType('pattern')}
          >
            <View style={styles.optionInfo}>
              <Text style={styles.optionLabel}>Pattern Lock</Text>
              <Text style={styles.optionDescription}>Draw a pattern on a 3x3 grid</Text>
            </View>
            {lockType === 'pattern' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.optionRow,
              lockType === 'biometric' && styles.optionRowSelected,
              !biometricAvailable && styles.optionRowDisabled,
            ]}
            onPress={() => handleSelectLockType('biometric')}
            disabled={!biometricAvailable}
          >
            <View style={styles.optionInfo}>
              <Text style={[styles.optionLabel, !biometricAvailable && styles.disabledText]}>
                Biometric
              </Text>
              <Text style={[styles.optionDescription, !biometricAvailable && styles.disabledText]}>
                {biometricAvailable
                  ? 'Fingerprint or Face ID'
                  : 'Not available on this device'}
              </Text>
            </View>
            {lockType === 'biometric' && <Text style={styles.checkmark}>✓</Text>}
          </TouchableOpacity>

          {(lockType === 'pin' || lockType === 'pattern') && (
            <TouchableOpacity
              style={styles.setupButton}
              onPress={() =>
                lockType === 'pin' ? handleSetupPin('pin') : handleSetupPattern('pattern')
              }
            >
              <Text style={styles.setupButtonText}>
                Change {lockType === 'pin' ? 'PIN' : 'Pattern'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Auto-Lock Timeout */}
        {enabled && lockType !== 'none' && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Auto-Lock Timeout</Text>
            </View>
            {TIMEOUT_OPTIONS.map((option) => (
              <TouchableOpacity
                key={option.value}
                style={[styles.optionRow, timeout === option.value && styles.optionRowSelected]}
                onPress={() => handleSelectTimeout(option.value)}
              >
                <Text style={styles.optionLabel}>{option.label}</Text>
                {timeout === option.value && <Text style={styles.checkmark}>✓</Text>}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Reset */}
        {enabled && (
          <View style={styles.section}>
            <TouchableOpacity style={styles.resetButton} onPress={handleResetLock}>
              <Text style={styles.resetButtonText}>Reset App Lock</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            App lock adds an extra layer of security to your authentication app. When enabled,
            you'll need to authenticate every time you open the app or after the specified timeout.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  backButton: {
    fontSize: 16,
    color: '#4dabf7',
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
    color: '#4dabf7',
    fontWeight: '600',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    flex: 1,
  },
  section: {
    marginTop: 20,
    paddingHorizontal: 16,
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 10,
  },
  settingInfo: {
    flex: 1,
    marginRight: 16,
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    padding: 16,
    borderRadius: 10,
    marginBottom: 8,
  },
  optionRowSelected: {
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    borderWidth: 1,
    borderColor: '#4dabf7',
  },
  optionRowDisabled: {
    opacity: 0.5,
  },
  optionInfo: {
    flex: 1,
  },
  optionLabel: {
    fontSize: 16,
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
  checkmark: {
    fontSize: 20,
    color: '#4dabf7',
    fontWeight: 'bold',
  },
  setupButton: {
    backgroundColor: 'rgba(77, 171, 247, 0.2)',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  setupButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4dabf7',
  },
  resetButton: {
    backgroundColor: 'rgba(255, 107, 107, 0.2)',
    padding: 16,
    borderRadius: 10,
    alignItems: 'center',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ff6b6b',
  },
  infoSection: {
    marginTop: 20,
    marginBottom: 40,
    paddingHorizontal: 16,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    lineHeight: 20,
    textAlign: 'center',
  },
});
