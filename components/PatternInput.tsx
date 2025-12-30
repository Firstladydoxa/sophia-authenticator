import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Vibration,
} from 'react-native';
import { PatternPoint } from '../utils/pattern';

interface PatternInputProps {
  gridSize?: number;
  onComplete: (pattern: PatternPoint[]) => void;
  onCancel?: () => void;
  title?: string;
  subtitle?: string;
  isConfirm?: boolean;
  mode?: 'setup' | 'verify';
  showCancel?: boolean;
}

const { width } = Dimensions.get('window');
const DOT_SIZE = 60; // Much larger for better touch
const GRID_SIZE_PX = Math.min(width - 60, 380);

export default function PatternInput({
  gridSize = 3,
  onComplete,
  onCancel,
  title = 'Draw Pattern',
  subtitle,
  isConfirm = false,
  mode = 'verify',
  showCancel = true,
}: PatternInputProps) {
  const [pattern, setPattern] = useState<PatternPoint[]>([]);
  const [error, setError] = useState('');

  const addDotToPattern = (row: number, col: number) => {
    // Check if already in pattern
    const alreadySelected = pattern.some(p => p.row === row && p.col === col);
    if (alreadySelected) {
      return;
    }

    const newPattern = [...pattern, { row, col }];
    setPattern(newPattern);
    setError('');
    Vibration.vibrate(10);
    console.log('[PatternInput] Added dot:', { row, col }, 'Total:', newPattern.length);
  };

  const handleComplete = (patternToSubmit?: PatternPoint[]) => {
    const finalPattern = patternToSubmit || pattern;
    if (finalPattern.length < 4) {
      setError('Pattern must have at least 4 points');
      Vibration.vibrate([0, 100, 50, 100]);
      return;
    }

    onComplete(finalPattern);
  };

  const handleClear = () => {
    setPattern([]);
    setError('');
  };

  const isDotSelected = (row: number, col: number): boolean => {
    return pattern.some(p => p.row === row && p.col === col);
  };

  const getDotOrder = (row: number, col: number): number => {
    const index = pattern.findIndex(p => p.row === row && p.col === col);
    return index !== -1 ? index + 1 : 0;
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{title}</Text>
      {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}

      <Text style={styles.info}>
        Tap dots in sequence (min 4, max 9)
      </Text>
      <Text style={styles.info}>
        Selected: {pattern.length}/9 {pattern.length >= 4 && '✓ Ready to confirm'}
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      {/* Pattern Grid - tap or tap-and-drag */}
      <View style={styles.gridContainer}>
        {Array.from({ length: gridSize }).map((_, row) => (
          <View key={row} style={styles.gridRow}>
            {Array.from({ length: gridSize }).map((_, col) => {
              const isSelected = isDotSelected(row, col);
              const order = getDotOrder(row, col);

              return (
                <TouchableOpacity
                  key={`${row}-${col}`}
                  style={styles.dotContainer}
                  onPress={() => addDotToPattern(row, col)}
                  activeOpacity={0.7}
                >
                  <View
                    style={[
                      styles.dot,
                      isSelected && styles.dotSelected,
                    ]}
                  >
                    {isSelected && (
                      <Text style={styles.dotNumber}>{order}</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={[styles.button, styles.clearButton]}
          onPress={handleClear}
        >
          <Text style={styles.buttonText}>Clear</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.button,
            styles.confirmButton,
            pattern.length < 4 && styles.buttonDisabled,
          ]}
          onPress={() => handleComplete()}
          disabled={pattern.length < 4}
        >
          <Text style={styles.buttonText}>Confirm</Text>
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
    marginBottom: 16,
    textAlign: 'center',
  },
  info: {
    fontSize: 14,
    color: '#888',
    marginBottom: 20,
  },
  error: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 10,
  },
  gridContainer: {
    width: GRID_SIZE_PX,
    height: GRID_SIZE_PX,
    backgroundColor: '#2a2a4a',
    borderRadius: 20,
    padding: 15,
    marginBottom: 30,
  },
  gridRow: {
    flex: 1,
    flexDirection: 'row',
  },
  dotContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5, // Extra padding for easier touch
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: '#444',
    borderWidth: 3,
    borderColor: '#666',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dotSelected: {
    backgroundColor: '#4a90e2',
    borderColor: '#61a8ff',
    borderWidth: 4,
    transform: [{ scale: 1.1 }],
  },
  dotNumber: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 15,
    marginBottom: 20,
  },
  button: {
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 25,
    minWidth: 120,
  },
  clearButton: {
    backgroundColor: '#555',
  },
  confirmButton: {
    backgroundColor: '#4a90e2',
  },
  buttonDisabled: {
    backgroundColor: '#333',
    opacity: 0.5,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButton: {
    marginTop: 10,
    padding: 15,
  },
  cancelText: {
    color: '#888',
    fontSize: 16,
  },
});
