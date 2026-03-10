import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import { Payment } from '../types/payment';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') {
    // Web doesn't support local notifications in Expo
    return false;
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

function getTimeUntilLabel(days: number): string {
  if (days === 0) return 'today';
  if (days === 1) return 'tomorrow';
  return `in ${days} days`;
}

function getTimingLabel(days: number): string {
  if (days === 0) return 'Payment today';
  if (days === 1) return 'Payment tomorrow';
  return `Payment in ${days} days`;
}

export async function schedulePaymentReminder(
  payment: Payment,
  daysBefore: number
): Promise<string | null> {
  if (Platform.OS === 'web') {
    return null;
  }

  try {
    // Calculate notification date
    const dueDate = new Date(payment.nextDueDate);
    const notificationDate = new Date(dueDate);
    notificationDate.setDate(notificationDate.getDate() - daysBefore);
    notificationDate.setHours(9, 0, 0, 0); // 9 AM

    // Don't schedule if date is in the past
    if (notificationDate.getTime() < Date.now()) {
      return null;
    }

    const title = getTimingLabel(daysBefore);
    const body = `${payment.name} · $${payment.amount.toFixed(2)} hits ${getTimeUntilLabel(daysBefore)}`;

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        sound: true,
      },
      trigger: {
        date: notificationDate,
      },
    });

    return id;
  } catch (error) {
    console.error('Error scheduling notification:', error);
    return null;
  }
}

export async function scheduleAllReminders(
  payments: Payment[],
  isPremium: boolean = false,
  preferences?: { threeDays: boolean; oneDay: boolean; dayOf: boolean }
): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  const prefs = preferences || { threeDays: true, oneDay: true, dayOf: true };

  for (const payment of payments) {
    if (isPremium) {
      // Premium: schedule based on preferences
      if (prefs.threeDays) {
        await schedulePaymentReminder(payment, 3);
      }
      if (prefs.oneDay) {
        await schedulePaymentReminder(payment, 1);
      }
      if (prefs.dayOf) {
        await schedulePaymentReminder(payment, 0);
      }
    } else {
      // Free: day-of only
      await schedulePaymentReminder(payment, 0);
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') {
    return;
  }

  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch (error) {
    console.error('Error canceling notifications:', error);
  }
}

export async function rescheduleAllReminders(
  payments: Payment[],
  isPremium: boolean = false,
  preferences?: { threeDays: boolean; oneDay: boolean; dayOf: boolean }
): Promise<void> {
  await cancelAllReminders();
  await scheduleAllReminders(payments, isPremium, preferences);
}
