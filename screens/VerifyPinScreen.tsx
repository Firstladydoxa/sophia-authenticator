import React from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import PinInput from '../components/PinInput';
import { verifyPin } from '../utils/pin';

type VerifyPinRouteProp = RouteProp<RootStackParamList, 'VerifyPin'>;
type VerifyPinNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerifyPin'>;

export default function VerifyPinScreen() {
  const navigation = useNavigation<VerifyPinNavigationProp>();
  const route = useRoute<VerifyPinRouteProp>();
  const { accountId, onSuccess } = route.params;

  const handlePinComplete = async (pin: string) => {
    const isValid = await verifyPin(accountId, pin);
    
    if (isValid) {
      if (onSuccess) {
        // If onSuccess callback provided, call it and go back
        onSuccess();
        navigation.goBack();
      } else {
        // Otherwise show success alert
        Alert.alert('Success', 'PIN authentication successful!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } else {
      Alert.alert('Failed', 'Incorrect PIN. Please try again.');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <PinInput
        onComplete={handlePinComplete}
        onCancel={handleCancel}
        title="Enter PIN"
        subtitle="Enter your PIN to authenticate"
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
