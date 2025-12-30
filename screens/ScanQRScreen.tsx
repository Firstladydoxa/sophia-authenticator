import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';
import { CameraView, Camera } from 'expo-camera';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation/types';
import { parseTOTPUri } from '../utils/totp';
import { parseCentralizedAuthQR, centralizedAuthQRToAccount } from '../utils/centralized-auth';
import { addAccount } from '../utils/storage';
import { initializeApiClient, saveApiClientConfig } from '../utils/api';
import { generateDeviceId } from '../utils/crypto';

type ScanQRScreenNavigationProp = NativeStackNavigationProp<RootStackParamList, 'ScanQR'>;

export default function ScanQRScreen() {
  const navigation = useNavigation<ScanQRScreenNavigationProp>();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);

  useEffect(() => {
    (async () => {
      const { status } = await Camera.requestCameraPermissionsAsync();
      setHasPermission(status === 'granted');
    })();
  }, []);

  const handleBarCodeScanned = async ({ data }: { type: string; data: string }) => {
    if (scanned) return;
    
    setScanned(true);
    
    console.log('[ScanQR] Scanned data:', data);
    
    // Try parsing as JSON first (for centralized auth and login QRs)
    try {
      const parsed = JSON.parse(data);
      console.log('[ScanQR] Parsed JSON:', parsed);
      console.log('[ScanQR] QR Type:', parsed.type);
      
      // Check if it's a login request QR - MUST CHECK THIS FIRST!
      if (parsed.type === 'tni-bouquet-login') {
        console.log('[ScanQR] Detected LOGIN QR');
        await handleLoginQR(parsed);
        return;
      }
      
      // Check if it's a centralized auth setup QR
      if (parsed.type === 'tni-bouquet-account' || parsed.type === 'account') {
        console.log('[ScanQR] Detected SETUP QR');
        const centralizedAuthData = parseCentralizedAuthQR(data);
        if (centralizedAuthData) {
          await handleCentralizedAuthQR(centralizedAuthData);
          return;
        }
      }
      
      // If we get here with JSON but unknown type
      console.log('[ScanQR] Unknown JSON type:', parsed.type);
      Alert.alert('Unknown QR Code', `This QR code type "${parsed.type}" is not recognized.`, [
        { text: 'Scan Again', onPress: () => setScanned(false) },
        { text: 'Cancel', onPress: () => navigation.goBack() },
      ]);
      return;
      
    } catch (e) {
      // Not JSON, continue to TOTP parsing
      console.log('[ScanQR] Not JSON, trying TOTP URI');
    }
    
    // Try parsing as TOTP URI
    const totpData = parseTOTPUri(data);
    
    if (!totpData) {
      Alert.alert('Invalid QR Code', 'This QR code is not recognized. Please scan a valid TOTP or TNI Bouquet authentication QR code.', [
        { text: 'Scan Again', onPress: () => setScanned(false) },
        { text: 'Cancel', onPress: () => navigation.goBack() },
      ]);
      return;
    }

    console.log('[ScanQR] Detected TOTP URI');
    // This is a standard TOTP QR code
    await handleTOTPQR(totpData);
  };

  const handleLoginQR = async (loginData: any) => {
    try {
      console.log('[ScanQR] Processing login QR:', loginData);
      
      const { email, temp_token, app_id, timestamp } = loginData;
      
      if (!email || !temp_token || !app_id) {
        console.error('[ScanQR] Missing required fields:', { email, temp_token, app_id, timestamp });
        throw new Error('Invalid login QR data: Missing required fields');
      }

      console.log('[ScanQR] Navigating to ApproveLogin with:', {
        email,
        tempToken: temp_token,
        appId: app_id,
        timestamp: timestamp || Date.now()
      });

      // Navigate to approval screen
      navigation.navigate('ApproveLogin', {
        email,
        tempToken: temp_token,
        appId: app_id,
        timestamp: timestamp || Date.now(),
      });
    } catch (error) {
      console.error('[ScanQR] Error handling login QR:', error);
      Alert.alert('Error', 'Invalid login QR code. Please make sure you scanned a login request QR code, not an account setup QR code.', [
        { text: 'Try Again', onPress: () => setScanned(false) },
        { text: 'Cancel', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleTOTPQR = async (totpData: any) => {
    try {
      await addAccount({
        issuer: totpData.issuer || '',
        account: totpData.account,
        secret: totpData.secret,
        digits: totpData.digits || 6,
        period: totpData.period || 30,
      });
      
      Alert.alert('Success', 'Account added successfully', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to add account', [
        { text: 'Try Again', onPress: () => setScanned(false) },
        { text: 'Cancel', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleCentralizedAuthQR = async (qrData: any) => {
    try {
      console.log('[ScanQR] Processing centralized auth QR:', qrData);
      
      // Convert QR data to account
      const accountData = centralizedAuthQRToAccount(qrData);
      
      console.log('[ScanQR] Account data to be added:', {
        issuer: accountData.issuer,
        account: accountData.account,
        appId: accountData.appId,
        apiUrl: accountData.apiUrl,
        isCentralizedAuth: accountData.isCentralizedAuth,
        authMethods: accountData.authMethods
      });
      
      // Add the account with ALL centralized auth fields
      await addAccount({
        issuer: accountData.issuer,
        account: accountData.account,
        secret: accountData.secret,
        digits: accountData.digits,
        period: accountData.period,
        appId: accountData.appId,              // ✅ CRITICAL: Include appId
        apiUrl: accountData.apiUrl,            // ✅ CRITICAL: Include apiUrl
        isCentralizedAuth: accountData.isCentralizedAuth,  // ✅ CRITICAL: Mark as centralized
        authMethods: accountData.authMethods || ['totp']
      } as any);

      // Initialize API client for this centralized auth
      const deviceId = generateDeviceId();
      const apiConfig = {
        apiUrl: qrData.apiUrl,
        appId: qrData.app_id,
        secret: qrData.secret,
        deviceId,
      };

      await initializeApiClient(apiConfig);
      await saveApiClientConfig(apiConfig);

      Alert.alert('Success', 'TNI Bouquet account added successfully\n\nYou can now configure your authentication methods', [
        { text: 'OK', onPress: () => navigation.goBack() },
      ]);
    } catch (error) {
      console.error('Error adding centralized auth account:', error);
      Alert.alert('Error', 'Failed to add TNI Bouquet account', [
        { text: 'Try Again', onPress: () => setScanned(false) },
        { text: 'Cancel', onPress: () => navigation.goBack() },
      ]);
    }
  };

  const handleOpenSettings = () => {
    Linking.openSettings();
  };

  if (hasPermission === null) {
    return (
      <View style={styles.container}>
        <Text style={styles.text}>Requesting camera permission...</Text>
      </View>
    );
  }

  if (hasPermission === false) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Camera Permission Required</Text>
        <Text style={styles.text}>
          This app needs camera access to scan QR codes for adding accounts.
        </Text>
        <TouchableOpacity style={styles.button} onPress={handleOpenSettings}>
          <Text style={styles.buttonText}>Open Settings</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.button, styles.secondaryButton]}
          onPress={() => navigation.goBack()}
        >
          <Text style={styles.secondaryButtonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={styles.camera}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
        barcodeScannerSettings={{
          barcodeTypes: ['qr'],
        }}
      >
        <View style={styles.overlay}>
          <View style={styles.topOverlay} />
          <View style={styles.middleRow}>
            <View style={styles.sideOverlay} />
            <View style={styles.scanArea}>
              <View style={[styles.corner, styles.topLeft]} />
              <View style={[styles.corner, styles.topRight]} />
              <View style={[styles.corner, styles.bottomLeft]} />
              <View style={[styles.corner, styles.bottomRight]} />
            </View>
            <View style={styles.sideOverlay} />
          </View>
          <View style={styles.bottomOverlay}>
            <Text style={styles.instructionText}>
              Scan a QR code from your service provider
            </Text>
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </CameraView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  camera: {
    flex: 1,
    width: '100%',
  },
  overlay: {
    flex: 1,
  },
  topOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  middleRow: {
    flexDirection: 'row',
    height: 250,
  },
  sideOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  scanArea: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: '#fff',
  },
  topLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
  },
  topRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
  },
  bottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
  },
  bottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
  },
  bottomOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  instructionText: {
    color: '#fff',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#000',
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#fff',
    marginBottom: 16,
    textAlign: 'center',
  },
  text: {
    fontSize: 16,
    color: '#fff',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 24,
  },
  button: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    width: '100%',
    maxWidth: 300,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#fff',
  },
  secondaryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});
