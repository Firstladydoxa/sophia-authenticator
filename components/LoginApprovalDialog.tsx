import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import axios from 'axios';
import { loadAccounts } from '../utils/storage';
import { generateTOTP } from '../utils/totp';

const API_URL = 'https://lwtranslationservices.tniglobal.org/api';

interface LoginApprovalDialogProps {
  visible: boolean;
  sessionId: string;
  email: string;
  appName: string;
  expiresAt: string;
  onClose: () => void;
}

export default function LoginApprovalDialog({
  visible,
  sessionId,
  email,
  appName,
  expiresAt,
  onClose,
}: LoginApprovalDialogProps) {
  const [loading, setLoading] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState('');

  useEffect(() => {
    if (!visible) return;

    const interval = setInterval(() => {
      const now = new Date().getTime();
      const expiry = new Date(expiresAt).getTime();
      const diff = expiry - now;

      if (diff <= 0) {
        setTimeRemaining('Expired');
        clearInterval(interval);
      } else {
        const minutes = Math.floor(diff / 60000);
        const seconds = Math.floor((diff % 60000) / 1000);
        setTimeRemaining(`${minutes}:${seconds.toString().padStart(2, '0')}`);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [visible, expiresAt]);

  const findAccountSecret = async (accountEmail: string, accountAppName: string): Promise<string | null> => {
    try {
      const accounts = await loadAccounts();
      
      // Try to find exact match
      let account = accounts.find(
        (acc) => acc.account.toLowerCase() === accountEmail.toLowerCase() && 
                 acc.issuer.toLowerCase() === accountAppName.toLowerCase()
      );

      // If not found, try to find by email only
      if (!account) {
        account = accounts.find(
          (acc) => acc.account.toLowerCase() === accountEmail.toLowerCase()
        );
      }

      if (!account) {
        console.log('No matching account found');
        return null;
      }

      return account.secret;
    } catch (error) {
      console.error('Error finding account:', error);
      return null;
    }
  };

  const handleApprove = async () => {
    setLoading(true);
    try {
      // Get stored MFA secret for this email/app
      const mfaSecret = await findAccountSecret(email, appName);
      
      if (!mfaSecret) {
        Alert.alert(
          'Account Not Found',
          'No matching account found in your authenticator. Please scan the setup QR code first.',
          [{ text: 'OK', onPress: onClose }]
        );
        setLoading(false);
        return;
      }

      // Generate TOTP code with default 30-second time step
      const totpCode = await generateTOTP(mfaSecret);

      console.log('Approving login with TOTP:', totpCode);

      // Verify login with backend
      const response = await axios.post(
        `${API_URL}/centralized-auth/verify`,
        {
          temp_token: sessionId,
          email,
          app_id: `bouquet-app-${email}`,
          auth_method: 'totp',
          totp_code: totpCode,
        }
      );

      if (response.data.success) {
        Alert.alert(
          'Success! ✓',
          'Login approved successfully! You can now proceed on the other device.',
          [{ text: 'OK', onPress: onClose }]
        );
      } else {
        Alert.alert(
          'Error',
          response.data.message || 'Login approval failed. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } catch (error: any) {
      console.error('Error approving login:', error);
      const errorMessage = error.response?.data?.message || 'Failed to approve login. Please try again.';
      Alert.alert('Error', errorMessage, [{ text: 'OK' }]);
    } finally {
      setLoading(false);
      onClose();
    }
  };

  const handleReject = () => {
    Alert.alert(
      'Login Rejected',
      'The login request has been rejected.',
      [{ text: 'OK', onPress: onClose }]
    );
  };

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onClose}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.7}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.icon}>🔐</Text>
          <Text style={styles.title}>Login Request</Text>
        </View>
        
        <View style={styles.content}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>App:</Text>
            <Text style={styles.value}>{appName}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Email:</Text>
            <Text style={styles.value} numberOfLines={1}>{email}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.label}>Expires in:</Text>
            <Text style={[styles.value, styles.timer]}>{timeRemaining}</Text>
          </View>

          <View style={styles.warningContainer}>
            <Text style={styles.warningIcon}>⚠️</Text>
            <Text style={styles.warningText}>
              Only approve if you initiated this login request
            </Text>
          </View>
        </View>

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.rejectButton]}
            onPress={handleReject}
            disabled={loading}
          >
            <Text style={styles.buttonText}>✗ Reject</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.approveButton]}
            onPress={handleApprove}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#fff" />
            ) : (
              <Text style={styles.buttonText}>✓ Approve</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1a1a2e',
    borderRadius: 20,
    padding: 24,
    marginHorizontal: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  icon: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  content: {
    marginBottom: 24,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.1)',
  },
  label: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    fontWeight: '600',
    flex: 1,
  },
  value: {
    fontSize: 14,
    color: '#fff',
    fontWeight: '500',
    flex: 2,
    textAlign: 'right',
  },
  timer: {
    color: '#4dabf7',
    fontSize: 16,
    fontWeight: 'bold',
  },
  warningContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 193, 7, 0.1)',
    padding: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  warningIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  warningText: {
    flex: 1,
    fontSize: 12,
    color: '#ffc107',
    lineHeight: 18,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 50,
  },
  approveButton: {
    backgroundColor: '#10b981',
  },
  rejectButton: {
    backgroundColor: '#ef4444',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});
