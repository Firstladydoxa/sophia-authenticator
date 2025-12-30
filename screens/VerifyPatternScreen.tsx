import React from 'react';
import { View, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import PatternInput from '../components/PatternInput';
import { verifyPattern, PatternPoint } from '../utils/pattern';

type VerifyPatternRouteProp = RouteProp<RootStackParamList, 'VerifyPattern'>;
type VerifyPatternNavigationProp = NativeStackNavigationProp<RootStackParamList, 'VerifyPattern'>;

export default function VerifyPatternScreen() {
  const navigation = useNavigation<VerifyPatternNavigationProp>();
  const route = useRoute<VerifyPatternRouteProp>();
  const { accountId, onSuccess } = route.params;

  const handlePatternComplete = async (pattern: PatternPoint[]) => {
    const isValid = await verifyPattern(accountId, pattern);
    
    if (isValid) {
      if (onSuccess) {
        // If onSuccess callback provided, call it and go back
        onSuccess();
        navigation.goBack();
      } else {
        // Otherwise show success alert
        Alert.alert('Success', 'Pattern authentication successful!', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } else {
      Alert.alert('Failed', 'Incorrect pattern. Please try again.');
    }
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <PatternInput
        onComplete={handlePatternComplete}
        onCancel={handleCancel}
        title="Draw Pattern"
        subtitle="Draw your pattern to authenticate"
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
