import React, { useState } from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import PatternInput from '../components/PatternInput';
import { setupPattern, PatternPoint, patternToString } from '../utils/pattern';
import { loadAccounts, updateAccount } from '../utils/storage';

type SetupPatternRouteProp = RouteProp<RootStackParamList, 'SetupPattern'>;
type SetupPatternNavigationProp = NativeStackNavigationProp<RootStackParamList, 'SetupPattern'>;

export default function SetupPatternScreen() {
  const navigation = useNavigation<SetupPatternNavigationProp>();
  const route = useRoute<SetupPatternRouteProp>();
  const { accountId } = route.params;

  const [firstPattern, setFirstPattern] = useState<PatternPoint[] | null>(null);
  const [isConfirming, setIsConfirming] = useState(false);

  const handlePatternComplete = async (pattern: PatternPoint[]) => {
    if (!isConfirming) {
      // First entry
      setFirstPattern(pattern);
      setIsConfirming(true);
    } else {
      // Confirmation entry
      const firstStr = patternToString(firstPattern!);
      const secondStr = patternToString(pattern);
      
      if (firstStr === secondStr) {
        try {
          await setupPattern(accountId, pattern);
          
          // Update account to include Pattern in auth methods
          const accounts = await loadAccounts();
          const account = accounts.find(acc => acc.id === accountId);
          if (account) {
            const authMethods = account.authMethods || ['totp'];
            if (!authMethods.includes('pattern')) {
              authMethods.push('pattern');
              await updateAccount({ ...account, authMethods });
            }
          }

          Alert.alert('Success', 'Pattern has been set up successfully!', [
            { text: 'OK', onPress: () => navigation.goBack() }
          ]);
        } catch (error) {
          Alert.alert('Error', 'Failed to set up pattern. Please try again.');
          setFirstPattern(null);
          setIsConfirming(false);
        }
      } else {
        Alert.alert('Mismatch', 'Patterns do not match. Please try again.');
        setFirstPattern(null);
        setIsConfirming(false);
      }
    }
  };

  const handleCancel = () => {
    if (isConfirming) {
      setFirstPattern(null);
      setIsConfirming(false);
    } else {
      navigation.goBack();
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <PatternInput
        key={isConfirming ? 'confirm' : 'create'} // Reset component when switching modes
        onComplete={handlePatternComplete}
        onCancel={handleCancel}
        title={isConfirming ? 'Confirm Pattern' : 'Create Pattern'}
        subtitle={isConfirming ? 'Draw the same pattern again' : 'Draw a pattern (min 4 points)'}
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
