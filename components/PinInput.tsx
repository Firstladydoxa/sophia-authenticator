import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Vibration,
} from 'react-native';

interface PinInputProps {
  length?: number;
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  isConfirm?: boolean;
  showCancel?: boolean;
}

export default function PinInput({
  length = 6,
  onComplete,
  onCancel,
  title = 'Enter PIN',
  subtitle,
  isConfirm = false,
  showCancel = true,
}: PinInputProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');

  const handleNumberPress = (num: number) => {
    if (pin.length < length) {
      const newPin = pin + num;
      setPin(newPin);
      setError('');

      if (newPin.length === length) {
        onComplete(newPin);
      }
    }
  };

  const handleBackspace = () => {
    setPin(pin.slice(0, -1));
    setError('');
  };

  const handleClear = () => {
    setPin('');
    setError('');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      {/* PIN Display */}
      <View style={styles.pinDisplay}>
        {Array.from({ length }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.pinDot,
              pin.length > index && styles.pinDotFilled,
            ]}
          />
        ))}
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Number Pad */}
      <View style={styles.numberPad}>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
          <TouchableOpacity
            key={num}
            style={styles.numberButton}
            onPress={() => handleNumberPress(num)}
          >
            <Text style={styles.numberText}>{num}</Text>
          </TouchableOpacity>
        ))}
        
        <TouchableOpacity
          style={styles.numberButton}
          onPress={handleClear}
        >
          <Text style={styles.actionText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.numberButton}
          onPress={() => handleNumberPress(0)}
        >
          <Text style={styles.numberText}>0</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.numberButton}
          onPress={handleBackspace}
        >
          <Text style={styles.actionText}>⌫</Text>
        </TouchableOpacity>
      </View>

      {showCancel && onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelText}>Cancel</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#aaa',
    marginBottom: 32,
    textAlign: 'center',
  },
  pinDisplay: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 40,
  },
  pinDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#555',
    marginHorizontal: 8,
  },
  pinDotFilled: {
    backgroundColor: '#4a90e2',
    borderColor: '#4a90e2',
  },
  error: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 20,
  },
  numberPad: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    width: '100%',
    maxWidth: 300,
  },
  numberButton: {
    width: 80,
    height: 80,
    margin: 8,
    backgroundColor: '#2a2a4a',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberText: {
    fontSize: 32,
    color: '#fff',
    fontWeight: '600',
  },
  actionText: {
    fontSize: 20,
    color: '#4a90e2',
    fontWeight: '600',
  },
  cancelButton: {
    marginTop: 20,
    padding: 15,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
});
