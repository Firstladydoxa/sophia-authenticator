import messaging from '@react-native-firebase/messaging';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform, PermissionsAndroid, Alert } from 'react-native';

const API_URL = 'https://lwtranslationservices.tniglobal.org/api';
const FCM_TOKEN_KEY = '@fcm_token';

export interface PushNotificationData {
  type: string;
  session_id: string;
  email: string;
  expires_at: string;
  app_name: string;
  click_action?: string;
}

class PushNotificationService {
  private fcmToken: string | null = null;

  /**
   * Initialize push notifications
   */
  async initialize(): Promise<boolean> {
    try {
      // Request permission
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.log('Push notification permission denied');
        return false;
      }

      // Get FCM token
      const token = await this.getToken();
      if (!token) {
        console.log('Failed to get FCM token');
        return false;
      }

      this.fcmToken = token;
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);

      // Listen for token refresh
      messaging().onTokenRefresh(async (newToken: string) => {
        console.log('FCM token refreshed:', newToken);
        this.fcmToken = newToken;
        await AsyncStorage.setItem(FCM_TOKEN_KEY, newToken);
        // Re-register token with backend for all accounts
        await this.syncTokenWithAllAccounts();
      });

      console.log('Push notifications initialized successfully');
      return true;
    } catch (error) {
      console.error('Error initializing push notifications:', error);
      return false;
    }
  }

  /**
   * Request push notification permissions
   */
  async requestPermissions(): Promise<boolean> {
    try {
      // For Android 13+ (API 33+), we need to request POST_NOTIFICATIONS permission
      if (Platform.OS === 'android' && Platform.Version >= 33) {
        console.log('Android 13+ detected, requesting POST_NOTIFICATIONS permission...');
        
        // Check if permission already granted
        const alreadyGranted = await PermissionsAndroid.check(
          PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS
        );

        if (alreadyGranted) {
          console.log('POST_NOTIFICATIONS permission already granted');
          return true;
        }

        // Show a user-friendly alert before requesting
        return new Promise((resolve) => {
          Alert.alert(
            'Enable Push Notifications',
            'This app needs notification permissions to send you login approval requests from Bouquet Apps. You can approve or reject login attempts directly from notifications.',
            [
              {
                text: 'Not Now',
                style: 'cancel',
                onPress: () => {
                  console.log('User declined notification permissions');
                  resolve(false);
                },
              },
              {
                text: 'Enable',
                onPress: async () => {
                  // Request the permission
                  const result = await PermissionsAndroid.request(
                    PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS,
                    {
                      title: 'Notification Permission',
                      message: 'Allow Authenticator to send you notifications?',
                      buttonPositive: 'Allow',
                      buttonNegative: 'Deny',
                    }
                  );

                  const granted = result === PermissionsAndroid.RESULTS.GRANTED;
                  console.log('POST_NOTIFICATIONS permission result:', result, granted);
                  
                  if (!granted) {
                    Alert.alert(
                      'Notifications Disabled',
                      'Push notifications are disabled. You can enable them later in Settings > Apps > Authenticator > Notifications.',
                      [{ text: 'OK' }]
                    );
                  }
                  
                  resolve(granted);
                },
              },
            ],
            { cancelable: false }
          );
        });
      }

      // For iOS and older Android, use Firebase's requestPermission
      console.log('Using Firebase requestPermission...');
      const authStatus = await messaging().requestPermission();
      const enabled =
        authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
        authStatus === messaging.AuthorizationStatus.PROVISIONAL;

      if (enabled) {
        console.log('Push notification permissions granted');
        return true;
      }

      console.log('Push notification permissions denied');
      return false;
    } catch (error) {
      console.error('Error requesting push permissions:', error);
      return false;
    }
  }

  /**
   * Get FCM device token
   */
  async getToken(): Promise<string | null> {
    try {
      // Check if we have a cached token
      if (this.fcmToken) {
        return this.fcmToken;
      }

      // Try to get from storage
      const storedToken = await AsyncStorage.getItem(FCM_TOKEN_KEY);
      if (storedToken) {
        this.fcmToken = storedToken;
        return storedToken;
      }

      // Get new token from Firebase
      const token = await messaging().getToken();
      console.log('FCM Token obtained:', token);
      this.fcmToken = token;
      await AsyncStorage.setItem(FCM_TOKEN_KEY, token);
      return token;
    } catch (error) {
      console.error('Error getting FCM token:', error);
      return null;
    }
  }

  /**
   * Register device token with backend for a specific account
   */
  async registerToken(email: string): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      console.log(`Registering FCM token for email: ${email}`);
      const response = await axios.post(`${API_URL}/push/register-token`, {
        email,
        fcm_token: token,
      });

      if (response.data.success) {
        console.log('Device token registered successfully');
        return true;
      }

      console.log('Failed to register device token:', response.data.message);
      return false;
    } catch (error: any) {
      console.error('Error registering token:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Unregister device token from backend
   */
  async unregisterToken(email: string): Promise<boolean> {
    try {
      const token = await this.getToken();
      if (!token) return false;

      console.log(`Unregistering FCM token for email: ${email}`);
      const response = await axios.post(`${API_URL}/push/unregister-token`, {
        email,
        fcm_token: token,
      });

      return response.data.success;
    } catch (error: any) {
      console.error('Error unregistering token:', error.response?.data || error.message);
      return false;
    }
  }

  /**
   * Get push notification status for an account
   */
  async getPushStatus(email: string): Promise<{ enabled: boolean; deviceCount: number } | null> {
    try {
      const response = await axios.post(`${API_URL}/push/status`, {
        email,
      });

      if (response.data.success) {
        return {
          enabled: response.data.data.push_enabled,
          deviceCount: response.data.data.device_count,
        };
      }

      return null;
    } catch (error: any) {
      console.error('Error getting push status:', error.response?.data || error.message);
      return null;
    }
  }

  /**
   * Sync token with all stored accounts
   */
  private async syncTokenWithAllAccounts(): Promise<void> {
    try {
      // Get all stored accounts
      const accountsStr = await AsyncStorage.getItem('@accounts');
      if (!accountsStr) return;

      const accounts = JSON.parse(accountsStr);
      
      // Register token for each account that has an email
      for (const account of accounts) {
        if (account.account && account.account.includes('@')) {
          await this.registerToken(account.account);
        }
      }
    } catch (error) {
      console.error('Error syncing token with accounts:', error);
    }
  }

  /**
   * Handle foreground message
   */
  onForegroundMessage(handler: (data: PushNotificationData) => void): () => void {
    const unsubscribe = messaging().onMessage(async (remoteMessage: any) => {
      console.log('Foreground message received:', remoteMessage);
      
      if (remoteMessage.data && remoteMessage.data.type === 'login_request') {
        handler(remoteMessage.data as unknown as PushNotificationData);
      }
    });

    return unsubscribe;
  }

  /**
   * Handle notification opened app (background/quit state)
   */
  onNotificationOpenedApp(handler: (data: PushNotificationData) => void): void {
    messaging().onNotificationOpenedApp((remoteMessage: any) => {
      console.log('Notification opened app:', remoteMessage);
      
      if (remoteMessage && remoteMessage.data && remoteMessage.data.type === 'login_request') {
        handler(remoteMessage.data as unknown as PushNotificationData);
      }
    });
  }

  /**
   * Get initial notification (if app was opened from quit state)
   */
  async getInitialNotification(handler: (data: PushNotificationData) => void): Promise<void> {
    const remoteMessage = await messaging().getInitialNotification();
    
    if (remoteMessage && remoteMessage.data && remoteMessage.data.type === 'login_request') {
      console.log('App opened from notification:', remoteMessage);
      handler(remoteMessage.data as unknown as PushNotificationData);
    }
  }
}

export default new PushNotificationService();
