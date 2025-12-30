import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Switch,
  ActivityIndicator,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { Account, AuthMethod } from '../types';
import { RootStackParamList } from '../navigation/types';
import { generateTOTP, getRemainingSeconds } from '../utils/totp';
import { 
  authenticateWithBiometrics, 
  checkBiometricCapabilities,
  getBiometricTypeName,
  showBiometricSetupAlert,
  getBiometricIcon
} from '../utils/biometric';
import {
  authenticateWithScreenLock,
  checkScreenLockAvailability,
  showScreenLockSetupAlert,
} from '../utils/screenlock';
import {
  hasPasskey,
  getPasskeyInfo,
  showPasskeySetupPrompt,
  showPasskeyAuthPrompt,
  deletePasskey,
} from '../utils/passkey';
import { hasPinSetup, setupPin, verifyPin, removePin } from '../utils/pin';
import { hasPatternSetup, setupPattern, verifyPattern, removePattern, PatternPoint } from '../utils/pattern';
import { loadAccounts, updateAccount } from '../utils/storage';

type AccountDetailsRouteProp = RouteProp<RootStackParamList, 'AccountDetails'>;
type AccountDetailsNavigationProp = NativeStackNavigationProp<RootStackParamList, 'AccountDetails'>;

export default function AccountDetailsScreen() {
  const navigation = useNavigation<AccountDetailsNavigationProp>();
  const route = useRoute<AccountDetailsRouteProp>();
  const { accountId } = route.params;

  const [account, setAccount] = useState<Account | null>(null);
  const [code, setCode] = useState<string>('------');
  const [remaining, setRemaining] = useState<number>(30);
  const [loading, setLoading] = useState(true);
  const [authenticating, setAuthenticating] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricName, setBiometricName] = useState('Biometric');
  const [biometricIcon, setBiometricIcon] = useState('🔐');
  const [screenLockAvailable, setScreenLockAvailable] = useState(false);
  const [passkeyExists, setPasskeyExists] = useState(false);
  const [passkeyName, setPasskeyName] = useState('');
  const [pinExists, setPinExists] = useState(false);
  const [patternExists, setPatternExists] = useState(false);

  useEffect(() => {
    loadAccountData();
    checkBiometricAvailability();
    checkScreenLockAvail();
    checkPasskeyStatus();
    checkPinStatus();
    checkPatternStatus();
  }, [accountId]);

  // Reload PIN/Pattern status when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      checkPinStatus();
      checkPatternStatus();
      loadAccountData(); // Reload account to get updated auth methods
    }, [accountId])
  );

  useEffect(() => {
    if (!account) return;

    const updateCode = async () => {
      try {
        const newCode = await generateTOTP(account.secret, account.period, account.digits);
        setCode(newCode);
      } catch (error) {
        console.error('Error generating TOTP:', error);
        setCode('ERROR');
      }
    };

    updateCode();
    const interval = setInterval(updateCode, 1000);

    return () => clearInterval(interval);
  }, [account]);

  useEffect(() => {
    if (!account) return;

    const updateRemaining = () => {
      setRemaining(getRemainingSeconds(account.period));
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [account]);

  const loadAccountData = async () => {
    try {
      const accounts = await loadAccounts();
      const foundAccount = accounts.find(acc => acc.id === accountId);
      if (foundAccount) {
        setAccount(foundAccount);
      } else {
        Alert.alert('Error', 'Account not found');
        navigation.goBack();
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to load account');
      navigation.goBack();
    } finally {
      setLoading(false);
    }
  };

  const checkBiometricAvailability = async () => {
    const capabilities = await checkBiometricCapabilities();
    setBiometricAvailable(capabilities.isAvailable);
    setBiometricName(getBiometricTypeName(capabilities.types));
    setBiometricIcon(getBiometricIcon(capabilities.types));
  };

  const checkScreenLockAvail = async () => {
    // Screen lock is available if the device has hardware support
    // We'll check at authentication time if credentials are enrolled
    const hasHardware = await checkScreenLockAvailability();
    // Set to true to allow users to try - authentication will fail gracefully if not configured
    setScreenLockAvailable(true);
  };

  const checkPasskeyStatus = async () => {
    if (accountId) {
      const exists = await hasPasskey(accountId);
      setPasskeyExists(exists);
      
      if (exists) {
        const info = await getPasskeyInfo(accountId);
        if (info) {
          setPasskeyName(info.name);
        }
      }
    }
  };

  const checkPinStatus = async () => {
    if (accountId) {
      const exists = await hasPinSetup(accountId);
      setPinExists(exists);
    }
  };

  const checkPatternStatus = async () => {
    if (accountId) {
      const exists = await hasPatternSetup(accountId);
      setPatternExists(exists);
    }
  };

  const handleToggleAuthMethod = async (method: AuthMethod) => {
    if (!account) return;

    const currentMethods = account.authMethods || ['totp'];
    let updatedMethods: AuthMethod[];

    if (currentMethods.includes(method)) {
      // Don't allow removing TOTP, keep at least one method
      if (method === 'totp' || currentMethods.length === 1) {
        Alert.alert('Notice', 'You must keep at least one authentication method enabled.');
        return;
      }
      
      // Special handling for removing passkey
      if (method === 'passkey') {
        Alert.alert(
          'Remove Passkey',
          'This will delete your stored passkey. You can create a new one later.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                await deletePasskey(accountId);
                setPasskeyExists(false);
                updatedMethods = currentMethods.filter(m => m !== method);
                const updatedAccount = { ...account, authMethods: updatedMethods };
                await updateAccount(updatedAccount);
                setAccount(updatedAccount);
              },
            },
          ]
        );
        return;
      }

      // Special handling for removing PIN
      if (method === 'pin') {
        Alert.alert(
          'Remove PIN',
          'This will delete your stored PIN. You can create a new one later.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                await removePin(accountId);
                setPinExists(false);
                updatedMethods = currentMethods.filter(m => m !== method);
                const updatedAccount = { ...account, authMethods: updatedMethods };
                await updateAccount(updatedAccount);
                setAccount(updatedAccount);
              },
            },
          ]
        );
        return;
      }

      // Special handling for removing Pattern
      if (method === 'pattern') {
        Alert.alert(
          'Remove Pattern',
          'This will delete your stored pattern. You can create a new one later.',
          [
            { text: 'Cancel', style: 'cancel' },
            {
              text: 'Remove',
              style: 'destructive',
              onPress: async () => {
                await removePattern(accountId);
                setPatternExists(false);
                updatedMethods = currentMethods.filter(m => m !== method);
                const updatedAccount = { ...account, authMethods: updatedMethods };
                await updateAccount(updatedAccount);
                setAccount(updatedAccount);
              },
            },
          ]
        );
        return;
      }
      
      updatedMethods = currentMethods.filter(m => m !== method);
    } else {
      // Check if method is available before enabling
      if (method === 'biometric' && !biometricAvailable) {
        await showBiometricSetupAlert();
        return;
      }
      
      if (method === 'screenlock' && !screenLockAvailable) {
        await showScreenLockSetupAlert();
        return;
      }
      
      if (method === 'passkey') {
        if (!passkeyExists) {
          // Add method first, then show passkey setup prompt
          updatedMethods = [...currentMethods, method];
          const updatedAccount = { ...account, authMethods: updatedMethods };
          await updateAccount(updatedAccount);
          setAccount(updatedAccount);
          
          // Show passkey setup prompt
          showPasskeySetupPrompt(accountId, async () => {
            await checkPasskeyStatus();
          });
          return;
        }
      }

      // Check PIN/Pattern setup when enabling
      if (method === 'pin') {
        if (!pinExists) {
          // Navigate to PIN setup
          navigation.navigate('SetupPin', { accountId });
          // Don't add to methods yet - will be added in SetupPinScreen after successful setup
          return;
        }
      }

      if (method === 'pattern') {
        if (!patternExists) {
          // Navigate to Pattern setup
          navigation.navigate('SetupPattern', { accountId });
          return;
        }
      }
      
      updatedMethods = [...currentMethods, method];
    }

    const updatedAccount = { ...account, authMethods: updatedMethods };
    await updateAccount(updatedAccount);
    setAccount(updatedAccount);
  };

  const handleSetPreferredMethod = async (method: AuthMethod) => {
    if (!account) return;

    const currentMethods = account.authMethods || ['totp'];
    if (!currentMethods.includes(method)) {
      Alert.alert('Notice', 'Please enable this authentication method first.');
      return;
    }

    const updatedAccount = { ...account, preferredAuthMethod: method };
    await updateAccount(updatedAccount);
    setAccount(updatedAccount);
    Alert.alert('Success', 'Preferred authentication method updated');
  };

  const handleAuthenticateWithBiometric = async () => {
    setAuthenticating(true);
    const result = await authenticateWithBiometrics(
      `Authenticate to access ${account?.issuer || 'account'}`
    );
    setAuthenticating(false);

    if (result.success) {
      Alert.alert('Success', 'Biometric authentication successful!', [
        { text: 'OK' }
      ]);
    } else {
      Alert.alert('Failed', result.error || 'Authentication failed');
    }
  };

  const handleCopyCode = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', 'Code copied to clipboard');
  };

  const handleAuthenticateWithPasskey = () => {
    if (!passkeyExists) {
      Alert.alert('No Passkey', 'Please create a passkey first by enabling this method.');
      return;
    }

    showPasskeyAuthPrompt(
      accountId,
      () => {
        // Success callback - passkey verified
        console.log('Passkey authentication successful');
      },
      (error) => {
        // Error callback
        console.error('Passkey authentication failed:', error);
      }
    );
  };


  const handleAuthenticateWithPin = () => {
    if (!pinExists) {
      Alert.alert('No PIN', 'Please create a PIN first by enabling this method.');
      return;
    }
    navigation.navigate('VerifyPin', { accountId });
  };

  const handleAuthenticateWithPattern = () => {
    if (!patternExists) {
      Alert.alert('No Pattern', 'Please create a pattern first by enabling this method.');
      return;
    }
    navigation.navigate('VerifyPattern', { accountId });
  };
  const handleAuthenticateWithScreenLock = async () => {
    setAuthenticating(true);
    const result = await authenticateWithScreenLock(
      accountId,
      `Unlock to access ${account?.issuer || 'account'}`
    );
    setAuthenticating(false);

    if (result.success) {
      Alert.alert('Success', 'Screen lock authentication successful!', [
        { text: 'OK' }
      ]);
    } else {
      Alert.alert('Failed', result.error || 'Authentication failed');
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
        </View>
      </SafeAreaView>
    );
  }

  if (!account) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>Account not found</Text>
        </View>
      </SafeAreaView>
    );
  }

  const enabledMethods = account.authMethods || ['totp'];
  const isExpiringSoon = remaining <= 5;
  const progress = remaining / account.period;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backText}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Authentication</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content}>
        {/* Account Info */}
        <View style={styles.accountInfoCard}>
          <Text style={styles.issuer}>{account.issuer || 'Unknown'}</Text>
          <Text style={styles.accountName}>{account.account}</Text>
        </View>

        {/* TOTP Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Time-based One-Time Password</Text>
          <View style={styles.methodCard}>
            <View style={styles.methodHeader}>
              <View style={styles.methodInfo}>
                <Text style={styles.methodIcon}>⏱️</Text>
                <Text style={styles.methodName}>TOTP Code</Text>
              </View>
              <Switch
                value={enabledMethods.includes('totp')}
                onValueChange={() => handleToggleAuthMethod('totp')}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            {enabledMethods.includes('totp') && (
              <View style={styles.totpContent}>
                <TouchableOpacity onPress={handleCopyCode} style={styles.codeButton}>
                  <Text style={[styles.code, isExpiringSoon && styles.codeExpiring]}>{code}</Text>
                </TouchableOpacity>
                <View style={styles.progressBar}>
                  <View
                    style={[
                      styles.progressFill,
                      { width: `${progress * 100}%` },
                      isExpiringSoon && styles.progressExpiring,
                    ]}
                  />
                </View>
                <Text style={styles.remaining}>{remaining}s remaining</Text>
                {account.preferredAuthMethod === 'totp' && (
                  <Text style={styles.preferredBadge}>⭐ Preferred</Text>
                )}
                {account.preferredAuthMethod !== 'totp' && (
                  <TouchableOpacity
                    style={styles.setPreferredButton}
                    onPress={() => handleSetPreferredMethod('totp')}
                  >
                    <Text style={styles.setPreferredText}>Set as Preferred</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Biometric Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Biometric Authentication</Text>
          <View style={styles.methodCard}>
            <View style={styles.methodHeader}>
              <View style={styles.methodInfo}>
                <Text style={styles.methodIcon}>{biometricIcon}</Text>
                <Text style={styles.methodName}>{biometricName}</Text>
              </View>
              <Switch
                value={enabledMethods.includes('biometric')}
                onValueChange={() => handleToggleAuthMethod('biometric')}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
                thumbColor="#fff"
                disabled={!biometricAvailable}
              />
            </View>

            {!biometricAvailable && (
              <Text style={styles.unavailableText}>
                Not available on this device
              </Text>
            )}

            {enabledMethods.includes('biometric') && biometricAvailable && (
              <View style={styles.methodContent}>
                <TouchableOpacity
                  style={styles.authenticateButton}
                  onPress={handleAuthenticateWithBiometric}
                  disabled={authenticating}
                >
                  {authenticating ? (
                    <ActivityIndicator color="#fff" />
                  ) : (
                    <Text style={styles.authenticateButtonText}>Authenticate Now</Text>
                  )}
                </TouchableOpacity>
                {account.preferredAuthMethod === 'biometric' && (
                  <Text style={styles.preferredBadge}>⭐ Preferred</Text>
                )}
                {account.preferredAuthMethod !== 'biometric' && (
                  <TouchableOpacity
                    style={styles.setPreferredButton}
                    onPress={() => handleSetPreferredMethod('biometric')}
                  >
                    <Text style={styles.setPreferredText}>Set as Preferred method</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Passkey Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Passkey Authentication</Text>
          <View style={styles.methodCard}>
            <View style={styles.methodHeader}>
              <View style={styles.methodInfo}>
                <Text style={styles.methodIcon}>🔑</Text>
                <Text style={styles.methodName}>Passkey</Text>
              </View>
              <Switch
                value={enabledMethods.includes('passkey')}
                onValueChange={() => handleToggleAuthMethod('passkey')}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            {passkeyExists && (
              <Text style={styles.passkeyInfo}>
                ✓ Passkey configured
              </Text>
            )}

            {enabledMethods.includes('passkey') && (
              <View style={styles.methodContent}>
                {account.preferredAuthMethod === 'passkey' && (
                  <Text style={styles.preferredBadge}>⭐ Preferred</Text>
                )}
                {account.preferredAuthMethod !== 'passkey' && (
                  <TouchableOpacity
                    style={styles.setPreferredButton}
                    onPress={() => handleSetPreferredMethod('passkey')}
                  >
                    <Text style={styles.setPreferredText}>Set as Preferred method</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Screen Lock Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Screen Lock Pattern</Text>
          <View style={styles.methodCard}>
            <View style={styles.methodHeader}>
              <View style={styles.methodInfo}>
                <Text style={styles.methodIcon}>🔒</Text>
                <Text style={styles.methodName}>Device Screen Lock</Text>
              </View>
              <Switch
                value={enabledMethods.includes('screenlock')}
                onValueChange={() => handleToggleAuthMethod('screenlock')}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            {enabledMethods.includes('screenlock') && (
              <View style={styles.methodContent}>
                {account.preferredAuthMethod === 'screenlock' && (
                  <Text style={styles.preferredBadge}>⭐ Preferred</Text>
                )}
                {account.preferredAuthMethod !== 'screenlock' && (
                  <TouchableOpacity
                    style={styles.setPreferredButton}
                    onPress={() => handleSetPreferredMethod('screenlock')}
                  >
                    <Text style={styles.setPreferredText}>Set as Preferred method</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* PIN Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PIN Authentication</Text>
          <View style={styles.methodCard}>
            <View style={styles.methodHeader}>
              <View style={styles.methodInfo}>
                <Text style={styles.methodIcon}>🔢</Text>
                <Text style={styles.methodName}>PIN (4-6 digits)</Text>
              </View>
              <Switch
                value={enabledMethods.includes('pin')}
                onValueChange={() => handleToggleAuthMethod('pin')}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            {pinExists && (
              <Text style={styles.passkeyInfo}>
                ✓ PIN configured
              </Text>
            )}

            {enabledMethods.includes('pin') && (
              <View style={styles.methodContent}>
                <Text style={styles.testNote}>💡 Set your PIN for Authentication</Text>
                <TouchableOpacity
                  style={styles.authenticateButton}
                  onPress={handleAuthenticateWithPin}
                >
                  <Text style={styles.authenticateButtonText}>Set PIN</Text>
                </TouchableOpacity>
                {account.preferredAuthMethod === 'pin' && (
                  <Text style={styles.preferredBadge}>⭐ Preferred</Text>
                )}
                {account.preferredAuthMethod !== 'pin' && (
                  <TouchableOpacity
                    style={styles.setPreferredButton}
                    onPress={() => handleSetPreferredMethod('pin')}
                  >
                    <Text style={styles.setPreferredText}>Set as Preferred method</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        {/* Pattern Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Pattern Lock</Text>
          <View style={styles.methodCard}>
            <View style={styles.methodHeader}>
              <View style={styles.methodInfo}>
                <Text style={styles.methodIcon}>🎨</Text>
                <Text style={styles.methodName}>Pattern (3x3 grid)</Text>
              </View>
              <Switch
                value={enabledMethods.includes('pattern')}
                onValueChange={() => handleToggleAuthMethod('pattern')}
                trackColor={{ false: '#ddd', true: '#007AFF' }}
                thumbColor="#fff"
              />
            </View>

            {patternExists && (
              <Text style={styles.passkeyInfo}>
                ✓ Pattern configured
              </Text>
            )}

            {enabledMethods.includes('pattern') && (
              <View style={styles.methodContent}>
                <Text style={styles.testNote}>💡 Set your pattern for Authentication</Text>
                <TouchableOpacity
                  style={styles.authenticateButton}
                  onPress={handleAuthenticateWithPattern}
                >
                  <Text style={styles.authenticateButtonText}>Set Pattern</Text>
                </TouchableOpacity>
                {account.preferredAuthMethod === 'pattern' && (
                  <Text style={styles.preferredBadge}>⭐ Preferred</Text>
                )}
                {account.preferredAuthMethod !== 'pattern' && (
                  <TouchableOpacity
                    style={styles.setPreferredButton}
                    onPress={() => handleSetPreferredMethod('pattern')}
                  >
                    <Text style={styles.setPreferredText}>Set as Preferred method</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>
        </View>

        <View style={styles.bottomPadding} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  backButton: {
    padding: 4,
  },
  backText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#fff',
  },
  placeholder: {
    width: 50,
  },
  content: {
    flex: 1,
  },
  accountInfoCard: {
    backgroundColor: '#fff',
    padding: 20,
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  issuer: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 4,
  },
  accountName: {
    fontSize: 16,
    color: '#666',
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginHorizontal: 16,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  methodCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  methodHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  methodInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  methodName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  totpContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  codeButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  code: {
    fontSize: 40,
    fontWeight: '700',
    color: '#007AFF',
    letterSpacing: 4,
    fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
  },
  codeExpiring: {
    color: '#FF3B30',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#eee',
    borderRadius: 2,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#007AFF',
    borderRadius: 2,
  },
  progressExpiring: {
    backgroundColor: '#FF3B30',
  },
  remaining: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  methodContent: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  testNote: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
    marginBottom: 12,
    lineHeight: 20,
  },
  authenticateButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  authenticateButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  unavailableText: {
    marginTop: 8,
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
  passkeyInfo: {
    marginTop: 8,
    fontSize: 14,
    color: '#34C759',
    fontWeight: '500',
  },
  comingSoonText: {
    marginTop: 8,
    fontSize: 14,
    color: '#FF9500',
    textAlign: 'center',
    fontStyle: 'italic',
  },
  preferredBadge: {
    marginTop: 12,
    fontSize: 14,
    color: '#FF9500',
    fontWeight: '600',
    textAlign: 'center',
  },
  setPreferredButton: {
    marginTop: 12,
    paddingVertical: 8,
    alignItems: 'center',
  },
  setPreferredText: {
    color: '#007AFF',
    fontSize: 14,
    fontWeight: '500',
  },
  bottomPadding: {
    height: 40,
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
});
