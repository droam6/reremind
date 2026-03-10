import { useState, useEffect, useCallback } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestPermissions, rescheduleAllReminders } from '../utils/notifications';
import { Payment } from '../types/payment';

interface NotificationPreferences {
  enabled: boolean;
  threeDays: boolean;
  oneDay: boolean;
  dayOf: boolean;
}

const DEFAULT_PREFS: NotificationPreferences = {
  enabled: false,
  threeDays: true,
  oneDay: true,
  dayOf: true,
};

export function useNotifications() {
  const [permissionGranted, setPermissionGranted] = useState(false);
  const [preferences, setPreferences] = useState<NotificationPreferences>(DEFAULT_PREFS);

  // Load preferences on mount
  useEffect(() => {
    const loadPrefs = async () => {
      try {
        const stored = await AsyncStorage.getItem('@reremind/notificationPrefs');
        if (stored) {
          setPreferences(JSON.parse(stored));
        }
      } catch (error) {
        console.error('Error loading notification prefs:', error);
      }
    };
    loadPrefs();
  }, []);

  // Request permissions on mount (only if not web)
  useEffect(() => {
    if (Platform.OS !== 'web') {
      requestPermissions().then(setPermissionGranted);
    }
  }, []);

  const updatePreferences = useCallback(async (updates: Partial<NotificationPreferences>) => {
    const newPrefs = { ...preferences, ...updates };
    setPreferences(newPrefs);
    try {
      await AsyncStorage.setItem('@reremind/notificationPrefs', JSON.stringify(newPrefs));
    } catch (error) {
      console.error('Error saving notification prefs:', error);
    }
  }, [preferences]);

  const scheduleAll = useCallback(
    async (payments: Payment[], isPremium: boolean = false) => {
      if (preferences.enabled) {
        await rescheduleAllReminders(payments, isPremium, {
          threeDays: preferences.threeDays,
          oneDay: preferences.oneDay,
          dayOf: preferences.dayOf,
        });
      }
    },
    [preferences]
  );

  return {
    permissionGranted,
    preferences,
    updatePreferences,
    scheduleAll,
  };
}
