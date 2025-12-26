import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import AccountAccordion from '../components/AccountAccordion';
import AddAccountModal from '../components/AddAccountModal';
import { Account } from '../types';
import { loadAccounts, addAccount, deleteAccount } from '../utils/storage';
import { RootStackParamList } from '../navigation/types';

type HomeScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'Home'>;

export default function HomeScreen() {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);

  const fetchAccounts = async () => {
    try {
      const data = await loadAccounts();
      setAccounts(data);
    } catch (error) {
      Alert.alert('Error', 'Failed to load accounts');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchAccounts();
    }, [])
  );

  const handleRefresh = () => {
    setRefreshing(true);
    fetchAccounts();
  };

  const handleAddAccount = async (data: {
    issuer: string;
    account: string;
    secret: string;
    digits: number;
    period: number;
  }) => {
    try {
      await addAccount(data);
      await fetchAccounts();
      Alert.alert('Success', 'Account added successfully');
    } catch (error) {
      Alert.alert('Error', 'Failed to add account');
    }
  };

  const handleDeleteAccount = async (id: string) => {
    try {
      await deleteAccount(id);
      await fetchAccounts();
    } catch (error) {
      Alert.alert('Error', 'Failed to delete account');
    }
  };

  const handleScanQR = () => {
    navigation.navigate('ScanQR');
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Authenticator</Text>
        <Text style={styles.headerSubtitle}>
          {accounts.length} {accounts.length === 1 ? 'account' : 'accounts'}
        </Text>
      </View>

      {accounts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyIcon}>🔐</Text>
          <Text style={styles.emptyTitle}>No Accounts Yet</Text>
          <Text style={styles.emptyText}>
            Add your first account to get started with two-factor authentication
          </Text>
        </View>
      ) : (
        <FlatList
          data={accounts}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <AccountAccordion account={item} onDelete={handleDeleteAccount} />
          )}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          contentContainerStyle={styles.listContent}
        />
      )}

      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.fab, styles.scanButton]}
          onPress={handleScanQR}
        >
          <Text style={styles.fabText}>📷 Scan QR</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.fab, styles.addButton]}
          onPress={() => setShowAddModal(true)}
        >
          <Text style={styles.fabText}>+ Add Manual</Text>
        </TouchableOpacity>
      </View>

      <AddAccountModal
        visible={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={handleAddAccount}
      />
    </View>
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
    backgroundColor: '#f5f5f5',
  },
  loadingText: {
    fontSize: 16,
    color: '#666',
  },
  header: {
    backgroundColor: '#007AFF',
    padding: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 32,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    lineHeight: 24,
  },
  listContent: {
    paddingVertical: 16,
    paddingBottom: 140,
  },
  buttonContainer: {
    position: 'absolute',
    bottom: 50,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  fab: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderRadius: 30,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  scanButton: {
    backgroundColor: '#5856D6',
  },
  addButton: {
    backgroundColor: '#007AFF',
  },
  fabText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});
