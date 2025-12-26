import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import * as Clipboard from 'expo-clipboard';
import { Account } from '../types';
import { RootStackParamList } from '../navigation/types';
import { generateTOTP, getRemainingSeconds } from '../utils/totp';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface AccountAccordionProps {
  account: Account;
  onDelete: (id: string) => void;
  isExpanded?: boolean;
}

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function AccountAccordion({ account, onDelete, isExpanded: initialExpanded = false }: AccountAccordionProps) {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [isExpanded, setIsExpanded] = useState(initialExpanded);
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

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsExpanded(!isExpanded);
  };

  const handleCopy = async () => {
    await Clipboard.setStringAsync(code);
    Alert.alert('Copied', 'Code copied to clipboard');
  };

  const handleViewDetails = () => {
    navigation.navigate('AccountDetails', { accountId: account.id });
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
  const enabledMethodsCount = (account.authMethods || ['totp']).length;
  const preferredMethod = account.preferredAuthMethod || 'totp';

  const getMethodDisplay = (method: string) => {
    switch (method) {
      case 'totp':
        return '⏱️ TOTP';
      case 'biometric':
        return '👤 Biometric';
      case 'passkey':
        return '🔑 Passkey';
      case 'screenlock':
        return '🔒 Screen Lock';
      default:
        return method;
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.header} 
        onPress={handleToggle}
        activeOpacity={0.7}
      >
        <View style={styles.headerLeft}>
          <View style={styles.iconContainer}>
            <Text style={styles.icon}>🔐</Text>
          </View>
          <View style={styles.headerInfo}>
            <Text style={styles.issuer}>{account.issuer || 'Unknown'}</Text>
            <Text style={styles.account}>{account.account}</Text>
            <Text style={styles.methodsBadge}>
              {enabledMethodsCount} method{enabledMethodsCount !== 1 ? 's' : ''} • {getMethodDisplay(preferredMethod)}
            </Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <Text style={[styles.expandIcon, isExpanded && styles.expandIconRotated]}>
            ▼
          </Text>
        </View>
      </TouchableOpacity>

      {isExpanded && (
        <View style={styles.content}>
          {/* Quick TOTP Display */}
          <View style={styles.quickCodeSection}>
            <Text style={styles.sectionLabel}>Current Code</Text>
            <TouchableOpacity onPress={handleCopy} style={styles.codeContainer}>
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
            <Text style={styles.remaining}>{remaining}s remaining • Tap code to copy</Text>
          </View>

          {/* Action Buttons */}
          <View style={styles.actions}>
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleViewDetails}
            >
              <Text style={styles.actionIcon}>⚙️</Text>
              <Text style={styles.actionText}>All Login Options</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.deleteButton]}
              onPress={handleDelete}
            >
              <Text style={styles.actionIcon}>🗑️</Text>
              <Text style={[styles.actionText, styles.deleteText]}>Remove</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    marginVertical: 6,
    marginHorizontal: 16,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  icon: {
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  issuer: {
    fontSize: 17,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  account: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  methodsBadge: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  headerRight: {
    marginLeft: 8,
  },
  expandIcon: {
    fontSize: 12,
    color: '#999',
  },
  expandIconRotated: {
    transform: [{ rotate: '180deg' }],
  },
  content: {
    borderTopWidth: 1,
    borderTopColor: '#f0f0f0',
    padding: 16,
    paddingTop: 16,
  },
  quickCodeSection: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  codeContainer: {
    alignItems: 'center',
    paddingVertical: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    marginBottom: 8,
  },
  code: {
    fontSize: 32,
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
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginTop: 8,
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
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginTop: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#007AFF',
    borderRadius: 8,
    gap: 6,
  },
  deleteButton: {
    backgroundColor: '#FF3B30',
  },
  actionIcon: {
    fontSize: 16,
  },
  actionText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  deleteText: {
    color: '#fff',
  },
});
