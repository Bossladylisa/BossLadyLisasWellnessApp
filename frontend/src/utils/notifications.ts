import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { storage } from './storage';

const REMINDERS_KEY = 'byb_reminders';

export interface Reminder {
  id: string;
  title: string;
  body: string;
  hour: number;
  minute: number;
  days: number[]; // 0 = Sunday, 6 = Saturday
  enabled: boolean;
  emoji: string;
  notificationIds?: string[];
}

/**
 * Detect Expo Go — expo-notifications remote-push functionality was gutted from
 * Expo Go starting SDK 53, and importing it at all crashes on Android.
 * We lazy-load the module only when we know we're in a native/dev build.
 */
export const isExpoGo =
  (Constants as any).appOwnership === 'expo' ||
  (Constants as any).executionEnvironment === 'storeClient';

export const notificationsSupported = Platform.OS !== 'web' && !isExpoGo;

let _notifications: any | null = null;
async function getNotifications(): Promise<any | null> {
  if (!notificationsSupported) return null;
  if (_notifications) return _notifications;
  try {
    _notifications = await import('expo-notifications');
    // Configure notification behavior when app is foregrounded
    _notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
      }),
    });
    return _notifications;
  } catch (e) {
    console.warn('expo-notifications unavailable in this runtime:', e);
    return null;
  }
}

export async function requestPermissions(): Promise<boolean> {
  const N = await getNotifications();
  if (!N) return false;

  const { status: existingStatus } = await N.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await N.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function scheduleReminder(reminder: Reminder): Promise<string[]> {
  const N = await getNotifications();
  if (!N) return [];

  const granted = await requestPermissions();
  if (!granted) return [];

  const notificationIds: string[] = [];

  for (const day of reminder.days) {
    try {
      const id = await N.scheduleNotificationAsync({
        content: {
          title: `${reminder.emoji} ${reminder.title}`,
          body: reminder.body,
          sound: 'default',
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.WEEKLY,
          weekday: day + 1, // expo uses 1-7 (Sunday=1)
          hour: reminder.hour,
          minute: reminder.minute,
        } as any,
      });
      notificationIds.push(id);
    } catch (e) {
      console.error('Failed to schedule notification:', e);
    }
  }

  return notificationIds;
}

export async function cancelReminder(notificationIds: string[]): Promise<void> {
  const N = await getNotifications();
  if (!N) return;
  for (const id of notificationIds) {
    try {
      await N.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.error('Failed to cancel notification:', e);
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  const N = await getNotifications();
  if (!N) return;
  await N.cancelAllScheduledNotificationsAsync();
}

export async function loadReminders(): Promise<Reminder[]> {
  const raw = await storage.getItem(REMINDERS_KEY, '' as string);
  if (!raw) return [];
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

export async function saveReminders(reminders: Reminder[]): Promise<void> {
  await storage.setItem(REMINDERS_KEY, JSON.stringify(reminders));
}

export async function scheduleFocusSession(
  workMinutes: number,
  breakMinutes: number,
  cycles: number
): Promise<string[]> {
  const N = await getNotifications();
  if (!N) return [];

  const granted = await requestPermissions();
  if (!granted) return [];

  const ids: string[] = [];
  const now = Date.now();
  let elapsedMs = 0;

  for (let i = 0; i < cycles; i++) {
    // End of focus period → break notification
    elapsedMs += workMinutes * 60 * 1000;
    try {
      const breakId = await N.scheduleNotificationAsync({
        content: {
          title: '🌿 Time to Breathe',
          body: `Focus cycle ${i + 1} complete. Take a ${breakMinutes} minute pause.`,
          sound: 'default',
        },
        trigger: {
          type: N.SchedulableTriggerInputTypes.DATE,
          date: new Date(now + elapsedMs),
        } as any,
      });
      ids.push(breakId);
    } catch (e) {
      console.error(e);
    }

    // End of break → next focus
    if (i < cycles - 1) {
      elapsedMs += breakMinutes * 60 * 1000;
      try {
        const focusId = await N.scheduleNotificationAsync({
          content: {
            title: '✨ Focus Time',
            body: `Sacred pause complete. Return to focus for ${workMinutes} minutes.`,
            sound: 'default',
          },
          trigger: {
            type: N.SchedulableTriggerInputTypes.DATE,
            date: new Date(now + elapsedMs),
          } as any,
        });
        ids.push(focusId);
      } catch (e) {
        console.error(e);
      }
    }
  }

  // Final completion
  elapsedMs += breakMinutes * 60 * 1000;
  try {
    const doneId = await N.scheduleNotificationAsync({
      content: {
        title: '🦋 Sacred Session Complete',
        body: `You completed ${cycles} focus cycles. Well done, warrior.`,
        sound: 'default',
      },
      trigger: {
        type: N.SchedulableTriggerInputTypes.DATE,
        date: new Date(now + elapsedMs),
      } as any,
    });
    ids.push(doneId);
  } catch (e) {
    console.error(e);
  }

  return ids;
}
