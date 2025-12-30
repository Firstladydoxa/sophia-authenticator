import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  getAppLockConfig,
  shouldLockApp,
  updateLastActivity,
  AppLockType,
  AppLockTimeout,
} from '../utils/app-lock';

interface AppLockContextType {
  isLocked: boolean;
  lockType: AppLockType;
  isFirstLaunch: boolean;
  unlock: () => void;
  lock: () => void;
  updateActivity: () => void;
  refreshConfig: () => Promise<void>;
  completeOnboarding: () => void;
}

const AppLockContext = createContext<AppLockContextType | undefined>(undefined);

export function AppLockProvider({ children }: { children: React.ReactNode }) {
  const [isLocked, setIsLocked] = useState(false);
  const [lockType, setLockType] = useState<AppLockType>('none');
  const [lockEnabled, setLockEnabled] = useState(false);
  const [lockTimeout, setLockTimeout] = useState<AppLockTimeout>(60);
  const [isFirstLaunch, setIsFirstLaunch] = useState(true);
  const appState = useRef(AppState.currentState);
  const activityTimer = useRef<any>(null);

  // Load initial configuration
  useEffect(() => {
    loadConfig();
  }, []);

  // Monitor app state changes (background/foreground)
  useEffect(() => {
    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
      if (activityTimer.current) {
        clearTimeout(activityTimer.current);
      }
    };
  }, [lockEnabled, lockTimeout]);

  const loadConfig = async () => {
    try {
      const config = await getAppLockConfig();
      setLockEnabled(config.enabled);
      setLockType(config.type);
      setLockTimeout(config.timeout);

      // Check if this is first launch (no lock configured)
      if (!config.enabled || config.type === 'none') {
        setIsFirstLaunch(true);
        return;
      }

      setIsFirstLaunch(false);

      // Check if app should be locked on startup
      const shouldLock = await shouldLockApp();
      setIsLocked(shouldLock);
    } catch (error) {
      console.error('Error loading app lock config:', error);
    }
  };

  const handleAppStateChange = async (nextAppState: AppStateStatus) => {
    // App is going to background
    if (appState.current.match(/active/) && nextAppState.match(/inactive|background/)) {
      await updateLastActivity();
    }

    // App is coming to foreground
    if (appState.current.match(/inactive|background/) && nextAppState === 'active') {
      if (lockEnabled && lockType !== 'none') {
        const shouldLock = await shouldLockApp();
        if (shouldLock) {
          setIsLocked(true);
        } else {
          // App is not locked, start activity timer
          startActivityTimer();
        }
      }
    }

    appState.current = nextAppState;
  };

  const startActivityTimer = () => {
    if (!lockEnabled || lockType === 'none') {
      return;
    }

    // Clear existing timer
    if (activityTimer.current) {
      clearTimeout(activityTimer.current);
    }

    // Set new timer if timeout is not immediate (0)
    if (lockTimeout > 0) {
      activityTimer.current = setTimeout(() => {
        console.log('Activity timer expired, locking app');
        setIsLocked(true);
      }, lockTimeout * 1000);
    }
  };

  const updateActivity = async () => {
    if (!lockEnabled || lockType === 'none') {
      return;
    }

    await updateLastActivity();
    startActivityTimer();
  };

  const unlock = () => {
    setIsLocked(false);
    updateActivity();
  };

  const lock = () => {
    setIsLocked(true);
  };

  const refreshConfig = async () => {
    await loadConfig();
  };

  const completeOnboarding = () => {
    setIsFirstLaunch(false);
    loadConfig();
  };

  return (
    <AppLockContext.Provider
      value={{
        isLocked,
        lockType,
        isFirstLaunch,
        unlock,
        lock,
        updateActivity,
        refreshConfig,
        completeOnboarding,
      }}
    >
      {children}
    </AppLockContext.Provider>
  );
}

export function useAppLock() {
  const context = useContext(AppLockContext);
  if (context === undefined) {
    throw new Error('useAppLock must be used within an AppLockProvider');
  }
  return context;
}
