import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Account } from '../types';
import { generateTOTP, getRemainingSeconds } from '../utils/totp';

interface AccountCardProps {
  account: Account;
  onDelete: (id: string) => void;
}

export default function AccountCard({ account, onDelete }: AccountCardProps) {
  const [code, setCode] = useState<string>('------');
  const [remaining, setRemaining] = useState<number>(30);

  useEffect(() => {
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
    const updateRemaining = () => {
      setRemaining(getRemainingSeconds(account.period));
    };

    updateRemaining();
    const interval = setInterval(updateRemaining, 1000);

    return () => clearInterval(interval);
  }, [account.period]);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', 'Code copied to clipboard');
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Account',
      `Are you sure you want to delete ${account.issuer || account.account}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => onDelete(account.id) },
      ]
    );
  };

  const progress = remaining / account.period;
  const isExpiringSoon = remaining <= 5;

  return (
    <View style={styles.container}>
      <TouchableOpacity style={styles.content} onPress={handleCopy}>
        <View style={styles.header}>
          <Text style={styles.issuer}>{account.issuer || 'Unknown'}</Text>
          <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
            <Text style={styles.deleteText}>✕</Text>
          </TouchableOpacity>
        </View>
        <Text style={styles.account}>{account.account}</Text>
        <Text style={[styles.code, isExpiringSoon && styles.codeExpiring]}>{code}</Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              { width: `${progress * 100}%` },
              isExpiringSoon && styles.progressExpiring,
            ]}
          />
        </View>
        <Text style={styles.remaining}>{remaining}s</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginVertical: 8,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  content: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  issuer: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  deleteButton: {
    padding: 4,
  },
  deleteText: {
    fontSize: 20,
    color: '#888',
  },
  account: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  code: {
    fontSize: 32,
    fontWeight: '700',
    letterSpacing: 4,
    color: '#007AFF',
    textAlign: 'center',
    marginVertical: 12,
    fontFamily: 'monospace',
  },
  codeExpiring: {
    color: '#FF3B30',
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E5EA',
    borderRadius: 2,
    overflow: 'hidden',
    marginTop: 8,
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
    fontSize: 12,
    color: '#888',
    textAlign: 'center',
    marginTop: 4,
  },
});
