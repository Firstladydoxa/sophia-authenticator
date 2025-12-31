import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { Text } from 'react-native';
import messaging from '@react-native-firebase/messaging';
import { RootStackParamList } from './navigation/types';
import { AppLockProvider, useAppLock } from './contexts/AppLockContext';
import HomeScreen from './screens/HomeScreen';
import ScanQRScreen from './screens/ScanQRScreen';
import AccountDetailsScreen from './screens/AccountDetailsScreen';
import ApproveLoginScreen from './screens/ApproveLoginScreen';
import SetupPinScreen from './screens/SetupPinScreen';
import VerifyPinScreen from './screens/VerifyPinScreen';
import SetupPatternScreen from './screens/SetupPatternScreen';
import VerifyPatternScreen from './screens/VerifyPatternScreen';
import SecuritySettingsScreen from './screens/SecuritySettingsScreen';
import AppLockScreen from './screens/AppLockScreen';
import OnboardingSetupScreen from './screens/OnboardingSetupScreen';
import LoginApprovalDialog from './components/LoginApprovalDialog';
import PushNotificationService, { PushNotificationData } from './services/PushNotificationService';

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator
function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#4dabf7',
        tabBarInactiveTintColor: '#999',
        tabBarStyle: {
          backgroundColor: '#1a1a2e',
          borderTopWidth: 1,
          borderTopColor: 'rgba(255, 255, 255, 0.1)',
          paddingBottom: 8,
          paddingTop: 8,
          height: 70,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.3,
          shadowRadius: 5,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
          marginBottom: 2,
        },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Home',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>🏠</Text>
          ),
        }}
      />
      <Tab.Screen
        name="SettingsTab"
        component={SecuritySettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, size }) => (
            <Text style={{ fontSize: 24 }}>⚙️</Text>
          ),
        }}
      />
    </Tab.Navigator>
  );
}

function AppNavigator() {
  const { isLocked, isFirstLaunch, completeOnboarding } = useAppLock();
  const [loginRequest, setLoginRequest] = useState<PushNotificationData | null>(null);

  useEffect(() => {
    // Initialize push notifications
    initializePushNotifications();

    // Set up background message handler
    messaging().setBackgroundMessageHandler(async (remoteMessage) => {
      console.log('Background message received:', remoteMessage);
    });
  }, []);

  const initializePushNotifications = async () => {
    try {
      // Initialize the service
      const initialized = await PushNotificationService.initialize();
      
      if (!initialized) {
        console.log('Push notifications not initialized');
        return;
      }

      // Handle foreground messages
      PushNotificationService.onForegroundMessage(handleLoginRequest);

      // Handle notification that opened the app
      PushNotificationService.onNotificationOpenedApp(handleLoginRequest);

      // Check if app was opened from a notification
      await PushNotificationService.getInitialNotification(handleLoginRequest);
    } catch (error) {
      console.error('Error initializing push notifications:', error);
    }
  };

  const handleLoginRequest = (data: PushNotificationData) => {
    console.log('Login request received:', data);
    setLoginRequest(data);
  };

  const closeLoginRequest = () => {
    setLoginRequest(null);
  };

  // Show onboarding for first-time users
  if (isFirstLaunch) {
    return <OnboardingSetupScreen onComplete={completeOnboarding} />;
  }

  // Show lock screen if app is locked
  if (isLocked) {
    return <AppLockScreen />;
  }

  return (
    <>
      <NavigationContainer>
        <Stack.Navigator
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen name="MainTabs" component={TabNavigator} />
          <Stack.Screen 
            name="ScanQR" 
            component={ScanQRScreen}
            options={{
              presentation: 'fullScreenModal',
            }}
          />
          <Stack.Screen 
            name="AccountDetails" 
            component={AccountDetailsScreen}
          />
          <Stack.Screen 
            name="ApproveLogin" 
            component={ApproveLoginScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="SetupPin" 
            component={SetupPinScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="VerifyPin" 
            component={VerifyPinScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="SetupPattern" 
            component={SetupPatternScreen}
            options={{
              presentation: 'modal',
            }}
          />
          <Stack.Screen 
            name="VerifyPattern" 
            component={VerifyPatternScreen}
            options={{
              presentation: 'modal',
            }}
          />
        </Stack.Navigator>
      </NavigationContainer>

      {/* Login Approval Dialog */}
      {loginRequest && (
        <LoginApprovalDialog
          visible={true}
          sessionId={loginRequest.session_id}
          email={loginRequest.email}
          appName={loginRequest.app_name}
          expiresAt={loginRequest.expires_at}
          onClose={closeLoginRequest}
        />
      )}
    </>
  );
}

export default function App() {
  return (
    <AppLockProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </AppLockProvider>
  );
}
