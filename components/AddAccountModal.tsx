import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { generateSecret } from '../utils/totp';

interface AddAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: {
    issuer: string;
    account: string;
    secret: string;
    digits: number;
    period: number;
  }) => void;
}

export default function AddAccountModal({
  visible,
  onClose,
  onAdd,
}: AddAccountModalProps) {
  const [issuer, setIssuer] = useState('');
  const [account, setAccount] = useState('');
  const [secret, setSecret] = useState('');
  const [digits, setDigits] = useState('6');
  const [period, setPeriod] = useState('120');

  const handleGenerateSecret = () => {
    const newSecret = generateSecret();
    setSecret(newSecret);
  };

  const handleAdd = () => {
    const trimmedSecret = secret.replace(/\s/g, '').toUpperCase();
    
    if (!issuer.trim()) {
      Alert.alert('Error', 'Please enter an issuer name');
      return;
    }
    
    if (!account.trim()) {
      Alert.alert('Error', 'Please enter an account name');
      return;
    }
    
    if (!trimmedSecret) {
      Alert.alert('Error', 'Please enter or generate a secret key');
      return;
    }
    
    // Validate secret is base32
    if (!/^[A-Z2-7]+=*$/.test(trimmedSecret)) {
      Alert.alert('Error', 'Secret must be a valid base32 string (A-Z, 2-7)');
      return;
    }

    const digitsNum = parseInt(digits);
    const periodNum = parseInt(period);

    if (isNaN(digitsNum) || digitsNum < 6 || digitsNum > 8) {
      Alert.alert('Error', 'Digits must be between 6 and 8');
      return;
    }

    if (isNaN(periodNum) || periodNum < 15 || periodNum > 120) {
      Alert.alert('Error', 'Period must be between 15 and 120 seconds');
      return;
    }

    onAdd({
      issuer: issuer.trim(),
      account: account.trim(),
      secret: trimmedSecret,
      digits: digitsNum,
      period: periodNum,
    });

    // Reset form
    setIssuer('');
    setAccount('');
    setSecret('');
    setDigits('6');
    setPeriod('120');
    onClose();
  };

  const handleCancel = () => {
    setIssuer('');
    setAccount('');
    setSecret('');
    setDigits('6');
    setPeriod('120');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
      statusBarTranslucent={true}
    >
      <View style={styles.modalBackground}>
        <View style={styles.overlay}>
          <View style={styles.container}>
          <ScrollView style={styles.scrollView}>
            <Text style={styles.title}>Add New Account</Text>

            <Text style={styles.label}>Issuer (Company/Service)</Text>
            <TextInput
              style={styles.input}
              value={issuer}
              onChangeText={setIssuer}
              placeholder="e.g., Google, GitHub, AWS"
              autoCapitalize="words"
            />

            <Text style={styles.label}>Account (Email/Username)</Text>
            <TextInput
              style={styles.input}
              value={account}
              onChangeText={setAccount}
              placeholder="e.g., user@example.com"
              autoCapitalize="none"
              keyboardType="email-address"
            />

            <Text style={styles.label}>Secret Key</Text>
            <TextInput
              style={[styles.input, styles.secretInput]}
              value={secret}
              onChangeText={setSecret}
              placeholder="Enter or generate secret"
              autoCapitalize="characters"
              multiline
            />
            <TouchableOpacity
              style={styles.generateButton}
              onPress={handleGenerateSecret}
            >
              <Text style={styles.generateButtonText}>Generate Random Secret</Text>
            </TouchableOpacity>

            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={styles.label}>Digits</Text>
                <TextInput
                  style={styles.input}
                  value={digits}
                  onChangeText={setDigits}
                  keyboardType="number-pad"
                  maxLength={1}
                />
              </View>

              <View style={styles.halfWidth}>
                <Text style={styles.label}>Period (seconds)</Text>
                <TextInput
                  style={styles.input}
                  value={period}
                  onChangeText={setPeriod}
                  keyboardType="number-pad"
                  maxLength={3}
                />
              </View>
            </View>

            <View style={styles.buttonRow}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleCancel}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.button, styles.addButton]}
                onPress={handleAdd}
              >
                <Text style={styles.addButtonText}>Add Account</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </View>
      </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    width: '100%',
    height: '100%',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 9999,
  },
  container: {
    backgroundColor: '#fff',
    borderRadius: 20,
    width: '90%',
    maxHeight: '85%',
    minHeight: '60%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  scrollView: {
    padding: 20,
    paddingBottom: 10,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 20,
    color: '#1a1a1a',
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 12,
    marginBottom: 6,
    color: '#1a1a1a',
  },
  input: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#f9f9f9',
  },
  secretInput: {
    fontFamily: 'monospace',
    minHeight: 60,
  },
  generateButton: {
    backgroundColor: '#007AFF',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    alignItems: 'center',
  },
  generateButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  buttonRow: {
    flexDirection: 'row',
    marginTop: 24,
    marginBottom: 10,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    flex: 1,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelButtonText: {
    color: '#1a1a1a',
    fontSize: 16,
    fontWeight: '600',
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
