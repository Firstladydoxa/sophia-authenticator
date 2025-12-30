import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { getApiClient } from '../utils/api';
import { getAccounts } from '../utils/storage';
import { CentralizedAuthAccount } from '../utils/centralized-auth';

type ApproveLoginScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ApproveLogin'>;
type ApproveLoginScreenRouteProp = RouteProp<RootStackParamList, 'ApproveLogin'>;

export default function ApproveLoginScreen() {
  const navigation = useNavigation<ApproveLoginScreenNavigationProp>();
  const route = useRoute<ApproveLoginScreenRouteProp>();
  
  const { email, tempToken, appId, timestamp } = route.params;
  
  const [selectedMethod, setSelectedMethod] = useState<string>('totp');
  const [isLoading, setIsLoading] = useState(false);
  const [availableMethods, setAvailableMethods] = useState<string[]>([]);
  const [accountFound, setAccountFound] = useState(false);
  const [matchedAccountId, setMatchedAccountId] = useState<string>('');

  useEffect(() => {
    checkAccount();
  }, []);

  const checkAccount = async () => {
    try {
      const accounts = await getAccounts();
      
      console.log('[ApproveLogin] Looking for account with:');
      console.log('  Email:', email);
      console.log('  App ID:', appId);
      console.log('[ApproveLogin] All accounts:', accounts.length);
      
      accounts.forEach((acc: any, index: number) => {
        console.log(`[ApproveLogin] Account ${index}:`, {
          id: acc.id,
          account: acc.account,
          issuer: acc.issuer,
          appId: acc.appId,
          isCentralizedAuth: acc.isCentralizedAuth,
          authMethods: acc.authMethods
        });
      });
      
      // Try multiple matching strategies
      let matchingAccount = accounts.find((acc: any) => 
        acc.account === email && 
        acc.appId === appId &&
        acc.isCentralizedAuth === true
      ) as CentralizedAuthAccount | undefined;
      
      // If not found, try matching by email and checking if app_id is in the account.id
      if (!matchingAccount) {
        console.log('[ApproveLogin] Strict match failed, trying flexible match...');
        matchingAccount = accounts.find((acc: any) => 
          acc.account === email && 
          (acc.appId === appId || acc.id?.includes(appId) || appId.includes(acc.appId || ''))
        ) as CentralizedAuthAccount | undefined;
      }
      
      // If still not found, try just by email for centralized auth accounts
      if (!matchingAccount) {
        console.log('[ApproveLogin] Flexible match failed, trying email-only match...');
        matchingAccount = accounts.find((acc: any) => 
          acc.account === email && 
          acc.isCentralizedAuth === true
        ) as CentralizedAuthAccount | undefined;
      }

      if (matchingAccount) {
        console.log('[ApproveLogin] Account found:', matchingAccount.id);
        
        // Initialize API client for this account
        if (matchingAccount.apiUrl && matchingAccount.appId && matchingAccount.secret) {
          const { generateDeviceId } = await import('../utils/crypto');
          const { initializeApiClient } = await import('../utils/api');
          
          const deviceId = generateDeviceId();
          const apiConfig = {
            apiUrl: matchingAccount.apiUrl,
            appId: matchingAccount.appId,
            secret: matchingAccount.secret,
            deviceId,
          };
          
          console.log('[ApproveLogin] Initializing API client:', {
            apiUrl: apiConfig.apiUrl,
            appId: apiConfig.appId,
            deviceId: apiConfig.deviceId
          });
          
          await initializeApiClient(apiConfig);
          console.log('[ApproveLogin] API client initialized successfully');
          
          setAccountFound(true);
          setMatchedAccountId(matchingAccount.id); // Store the matched account ID
          setAvailableMethods(matchingAccount.authMethods || ['totp']);
          setSelectedMethod(matchingAccount.authMethods?.[0] || 'totp');
        } else {
          console.error('[ApproveLogin] Missing required fields for API client:', {
            hasApiUrl: !!matchingAccount.apiUrl,
            hasAppId: !!matchingAccount.appId,
            hasSecret: !!matchingAccount.secret
          });
          
          // Account exists but is incomplete - needs to be re-added
          Alert.alert(
            'Account Needs Update',
            `This account was added with an older version and is missing required information.\n\n` +
            `To fix this:\n` +
            `1. Delete this account from the Authenticator\n` +
            `2. Go to Ambassador App Settings\n` +
            `3. Scan the setup QR code again\n\n` +
            `The account will then work properly for login.`,
            [{ text: 'OK', onPress: () => navigation.goBack() }]
          );
        }
      } else {
        console.error('[ApproveLogin] No matching account found!');
        console.error('[ApproveLogin] Searched for:', { email, appId });
        
        Alert.alert(
          'Account Not Found',
          `This account is not set up in your Authentication App.\n\nLooking for: ${email}\nApp ID: ${appId}\n\nPlease scan the setup QR code from Settings first.`,
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      console.error('[ApproveLogin] Error checking account:', error);
      Alert.alert('Error', 'Failed to verify account', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    }
  };

  const handleApprove = async () => {
    setIsLoading(true);
    
    try {
      // TOTP requires user to confirm the code before approval
      if (selectedMethod === 'totp') {
        const { generateTOTP } = await import('../utils/totp');
        const accounts = await getAccounts();
        const account = accounts.find((a: any) => a.id === matchedAccountId);
        
        if (!account || !account.secret) {
          Alert.alert('Error', 'TOTP not set up for this account');
          setIsLoading(false);
          return;
        }
        
        // Generate current TOTP code (check if it's async)
        let totpCode: string;
        const codeOrPromise = generateTOTP(account.secret);
        if (codeOrPromise instanceof Promise) {
          totpCode = await codeOrPromise;
        } else {
          totpCode = codeOrPromise;
        }
        console.log('[ApproveLogin] Generated TOTP code:', totpCode);
        
        // Show confirmation dialog with the TOTP code
        setIsLoading(false);
        Alert.alert(
          'Confirm TOTP Authentication',
          `Your TOTP code is:\n\n${totpCode}\n\nTap "Approve" to authenticate this login request with this code.`,
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsLoading(false)
            },
            {
              text: 'Approve',
              onPress: async () => {
                setIsLoading(true);
                // Proceed with approval and pass the TOTP code
                await proceedWithApproval(totpCode);
              }
            }
          ],
          { cancelable: false }
        );
        return;
      }
      
      // For PIN and Pattern, we verify locally first
      if (selectedMethod === 'pin') {
        const { verifyPin, hasPinSetup } = await import('../utils/pin');
        console.log('[ApproveLogin] Checking PIN for account ID:', matchedAccountId);
        const hasPin = await hasPinSetup(matchedAccountId);
        if (!hasPin) {
          Alert.alert('Error', 'PIN not set up for this account');
          setIsLoading(false);
          return;
        }
        
        // Navigate to PIN verification screen
        setIsLoading(false);
        navigation.navigate('VerifyPin', { 
          accountId: matchedAccountId,
          onSuccess: () => {
            // After successful PIN verification, proceed with login
            proceedWithApproval();
          }
        });
        return;
      }

      if (selectedMethod === 'pattern') {
        const { hasPatternSetup } = await import('../utils/pattern');
        console.log('[ApproveLogin] Checking Pattern for account ID:', matchedAccountId);
        const hasPattern = await hasPatternSetup(matchedAccountId);
        if (!hasPattern) {
          Alert.alert('Error', 'Pattern not set up for this account');
          setIsLoading(false);
          return;
        }
        
        // Navigate to Pattern verification screen
        setIsLoading(false);
        navigation.navigate('VerifyPattern', { 
          accountId: matchedAccountId,
          onSuccess: () => {
            // After successful Pattern verification, proceed with login
            proceedWithApproval();
          }
        });
        return;
      }
      
      // Screen Lock requires device authentication
      if (selectedMethod === 'screenlock') {
        const { authenticateWithScreenLock } = await import('../utils/screenlock');
        console.log('[ApproveLogin] Authenticating with screen lock');
        
        const result = await authenticateWithScreenLock(
          matchedAccountId,
          'Unlock to approve login request'
        );
        
        if (!result.success) {
          Alert.alert('Error', result.error || 'Screen lock authentication failed');
          setIsLoading(false);
          return;
        }
        
        console.log('[ApproveLogin] Screen lock authentication successful');
        // Proceed with approval after successful authentication
        await proceedWithApproval();
        return;
      }

      // Passkey requires user to enter passkey
      if (selectedMethod === 'passkey') {
        const { verifyPasskey, hasPasskey } = await import('../utils/passkey');
        console.log('[ApproveLogin] Checking passkey for account ID:', matchedAccountId);
        
        const passkeyExists = await hasPasskey(matchedAccountId);
        if (!passkeyExists) {
          Alert.alert('Error', 'Passkey not set up for this account');
          setIsLoading(false);
          return;
        }
        
        // Prompt user to enter their passkey
        setIsLoading(false);
        Alert.prompt(
          'Enter Passkey',
          'Enter your passkey to approve this login request',
          [
            {
              text: 'Cancel',
              style: 'cancel',
              onPress: () => setIsLoading(false)
            },
            {
              text: 'Approve',
              onPress: async (inputPasskey?: string) => {
                if (!inputPasskey || inputPasskey.trim() === '') {
                  Alert.alert('Error', 'Passkey cannot be empty');
                  return;
                }
                
                setIsLoading(true);
                const result = await verifyPasskey(matchedAccountId, inputPasskey);
                
                if (result.success) {
                  console.log('[ApproveLogin] Passkey verification successful');
                  await proceedWithApproval();
                } else {
                  Alert.alert('Error', result.error || 'Invalid passkey');
                  setIsLoading(false);
                }
              }
            }
          ],
          'secure-text'
        );
        return;
      }

      // For other methods (biometric), proceed directly
      await proceedWithApproval();
    } catch (error: any) {
      console.error('[ApproveLogin] Error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to approve login. Please try again.',
        [{ text: 'OK', onPress: () => setIsLoading(false) }]
      );
      setIsLoading(false);
    }
  };

  const proceedWithApproval = async (totpCode?: string) => {
    try {
      const apiClient = getApiClient();
      
      if (!apiClient) {
        throw new Error('API client not initialized');
      }

      console.log('[ApproveLogin] Approving with:', {
        email,
        method: selectedMethod,
        appId,
        hasTotpCode: !!totpCode
      });

      const result = await apiClient.verifyLogin({
        email,
        tempToken,
        method: selectedMethod,
        totpCode
      });

      console.log('[ApproveLogin] Verification result:', result);

      if (result.success) {
        Alert.alert(
          'Success',
          'Login approved successfully! The user can now access their account.',
          [{ text: 'OK', onPress: () => navigation.goBack() }]
        );
      } else {
        throw new Error(result.message || 'Verification failed');
      }
    } catch (error: any) {
      console.error('[ApproveLogin] Error:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to approve login. Please try again.',
        [{ text: 'OK', onPress: () => setIsLoading(false) }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeny = () => {
    Alert.alert(
      'Deny Login',
      'Are you sure you want to deny this login request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Deny',
          style: 'destructive',
          onPress: () => navigation.goBack()
        }
      ]
    );
  };

  const getMethodName = (method: string) => {
    const names: Record<string, string> = {
      totp: 'TOTP Code',
      biometric: 'Biometric',
      passkey: 'Passkey',
      screenlock: 'Screen Lock Pattern',
      pin: 'PIN',
      pattern: 'Pattern Lock'
    };
    return names[method] || method.toUpperCase();
  };

  const getMethodIcon = (method: string) => {
    const icons: Record<string, string> = {
      totp: '🔢',
      biometric: '👆',
      passkey: '🔑',
      screenlock: '🔒',
      pin: '🔢',
      pattern: '🎨'
    };
    return icons[method] || '🔐';
  };

  const formatTimestamp = (ts: number) => {
    const date = new Date(ts);
    return date.toLocaleString();
  };

  if (!accountFound) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Verifying account...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🔐</Text>
        <Text style={styles.title}>Approve Login</Text>
        <Text style={styles.subtitle}>A login request has been received</Text>
      </View>

      {/* Login Details */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Login Details</Text>
        
        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Email:</Text>
          <Text style={styles.detailValue}>{email}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>Requested:</Text>
          <Text style={styles.detailValue}>{formatTimestamp(timestamp)}</Text>
        </View>

        <View style={styles.detailRow}>
          <Text style={styles.detailLabel}>App ID:</Text>
          <Text style={styles.detailValueSmall}>{appId}</Text>
        </View>
      </View>

      {/* Authentication Method Selection */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Select Authentication Method</Text>
        
        {availableMethods.map((method) => (
          <TouchableOpacity
            key={method}
            style={[
              styles.methodButton,
              selectedMethod === method && styles.methodButtonSelected
            ]}
            onPress={() => setSelectedMethod(method)}
          >
            <Text style={styles.methodIcon}>{getMethodIcon(method)}</Text>
            <Text style={[
              styles.methodText,
              selectedMethod === method && styles.methodTextSelected
            ]}>
              {getMethodName(method)}
            </Text>
            {selectedMethod === method && (
              <Text style={styles.checkmark}>✓</Text>
            )}
          </TouchableOpacity>
        ))}
      </View>

      {/* Warning */}
      <View style={styles.warningCard}>
        <Text style={styles.warningIcon}>⚠️</Text>
        <Text style={styles.warningText}>
          Only approve this login if you initiated it. If you didn't request this login, tap Deny.
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actions}>
        <TouchableOpacity
          style={[styles.button, styles.approveButton, isLoading && styles.buttonDisabled]}
          onPress={handleApprove}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.approveButtonText}>✓ Approve Login</Text>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.button, styles.denyButton]}
          onPress={handleDeny}
          disabled={isLoading}
        >
          <Text style={styles.denyButtonText}>✕ Deny</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    padding: 20,
    paddingBottom: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
    paddingTop: 20,
  },
  headerIcon: {
    fontSize: 64,
    marginBottom: 12,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  detailRow: {
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  detailValueSmall: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: '#007AFF',
  },
  methodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    marginBottom: 12,
    backgroundColor: '#fff',
  },
  methodButtonSelected: {
    borderColor: '#007AFF',
    backgroundColor: '#f0f8ff',
  },
  methodIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  methodText: {
    flex: 1,
    fontSize: 16,
    color: '#000',
    fontWeight: '500',
  },
  methodTextSelected: {
    color: '#007AFF',
    fontWeight: '600',
  },
  checkmark: {
    fontSize: 20,
    color: '#007AFF',
    fontWeight: '700',
  },
  warningCard: {
    flexDirection: 'row',
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#ffc107',
  },
  warningIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  warningText: {
    flex: 1,
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  actions: {
    gap: 12,
  },
  button: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  approveButton: {
    backgroundColor: '#28a745',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  denyButton: {
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#dc3545',
  },
  denyButtonText: {
    color: '#dc3545',
    fontSize: 18,
    fontWeight: '700',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
});
