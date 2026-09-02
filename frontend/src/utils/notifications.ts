import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
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

// Configure notification behavior when app is foregrounded
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export async function requestPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  return finalStatus === 'granted';
}

export async function scheduleReminder(reminder: Reminder): Promise<string[]> {
  if (Platform.OS === 'web') return [];

  const granted = await requestPermissions();
  if (!granted) return [];

  const notificationIds: string[] = [];

  for (const day of reminder.days) {
    try {
      const id = await Notifications.scheduleNotificationAsync({
        content: {
          title: `${reminder.emoji} ${reminder.title}`,
          body: reminder.body,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
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
  if (Platform.OS === 'web') return;

  for (const id of notificationIds) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch (e) {
      console.error('Failed to cancel notification:', e);
    }
  }
}

export async function cancelAllReminders(): Promise<void> {
  if (Platform.OS === 'web') return;
  await Notifications.cancelAllScheduledNotificationsAsync();
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
  if (Platform.OS === 'web') return [];

  const granted = await requestPermissions();
  if (!granted) return [];

  const ids: string[] = [];
  const now = Date.now();
  let elapsedMs = 0;

  for (let i = 0; i < cycles; i++) {
    // End of focus period → break notification
    elapsedMs += workMinutes * 60 * 1000;
    try {
      const breakId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🌿 Time to Breathe',
          body: `Focus cycle ${i + 1} complete. Take a ${breakMinutes} minute pause.`,
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
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
        const focusId = await Notifications.scheduleNotificationAsync({
          content: {
            title: '✨ Focus Time',
            body: `Sacred pause complete. Return to focus for ${workMinutes} minutes.`,
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
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
    const doneId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🦋 Sacred Session Complete',
        body: `You completed ${cycles} focus cycles. Well done, warrior.`,
        sound: 'default',
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: new Date(now + elapsedMs),
      } as any,
    });
    ids.push(doneId);
  } catch (e) {
    console.error(e);
  }

  return ids;
}
