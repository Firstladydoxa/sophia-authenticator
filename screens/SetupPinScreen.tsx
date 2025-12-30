import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import PinInput from '../components/PinInput';
import { setupPin } from '../utils/pin';
import { loadAccounts, updateAccount } from '../utils/storage';

type SetupPinRouteProp = RouteProp<RootStackParamList, 'SetupPin'>;
type SetupPinNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SetupPin'>;

export default function SetupPinScreen() {
  const navigation = useNavigation<SetupPinNavigationProp>();
  const route = useRoute<SetupPinRouteProp>();
  const { accountId } = route.params;

  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handlePinComplete = async (pin: string) => {
    if (!isConfirming) {
      // First entry - store it and switch to confirmation mode
      setFirstPin(pin);
      setIsConfirming(true);
      // Auto-clear will happen in PinInput component via key prop
    } else {
      // Confirmation entry
      if (pin === firstPin) {
        try {
          await setupPin(accountId, pin);
          
          // Update account to include PIN in auth methods
          const accounts = await loadAccounts();
          const account = accounts.find(acc => acc.id === accountId);
          if (account) {
            const authMethods = account.authMethods || ['totp'];
            if (!authMethods.includes('pin')) {
              authMethods.push('pin');
              await updateAccount({ ...account, authMethods });
            }
          }

          Alert.alert('Success', 'PIN has been set up successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } catch (error) {
          Alert.alert('Error', 'Failed to set up PIN. Please try again.');
          setFirstPin(null);
          setIsConfirming(false);
        }
      } else {
        Alert.alert('Mismatch', 'PINs do not match. Please try again.');
        setFirstPin(null);
        setIsConfirming(false);
      }
    }
  };

  const handleCancel = () => {
    if (isConfirming) {
      setFirstPin(null);
      setIsConfirming(false);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PinInput
        key={isConfirming ? 'confirm' : 'create'} // Reset component when switching modes
        onComplete={handlePinComplete}
        onCancel={handleCancel}
        title={isConfirming ? 'Confirm PIN' : 'Create PIN'}
        subtitle={isConfirming ? 'Enter your PIN again to confirm' : 'Enter a 4-6 digit PIN'}
        isConfirm={isConfirming}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
});
