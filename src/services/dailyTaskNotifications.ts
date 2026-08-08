import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage } from '../i18n/translations';
import { getDailyTaskTranslation } from '../i18n/dailyTasks';

const DAILY_TASK_CHANNEL = 'daily_task_reminders';
const DAILY_TASK_REMINDER_IDS_KEY = '@daily_task_reminder_ids';

export async function scheduleDailyTaskReminders(lang: AppLanguage): Promise<void> {
  await initNotifications();

  try {
    const raw = await AsyncStorage.getItem(DAILY_TASK_REMINDER_IDS_KEY);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      }
    }
  } catch {}

  const title = getDailyTaskTranslation(lang, 'dailyTaskReminderTitle');
  const body = getDailyTaskTranslation(lang, 'dailyTaskReminderBody');

  const scheduledIds: string[] = [];

  const triggerHours = [10, 14, 18, 22];

  for (const hour of triggerHours) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title,
        body,
        autoDismiss: true,
        priority: Notifications.AndroidNotificationPriority.LOW,
        data: { isDailyTaskReminder: true },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
        hour,
        minute: 0,
        repeats: true,
        channelId: DAILY_TASK_CHANNEL,
      } as any,
    });
    scheduledIds.push(id);
  }

  await AsyncStorage.setItem(DAILY_TASK_REMINDER_IDS_KEY, JSON.stringify(scheduledIds));
}

let initialized = false;

async function initNotifications(): Promise<void> {
  if (initialized) return;
  initialized = true;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(DAILY_TASK_CHANNEL, {
      name: 'Daily Task Reminders',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0d9488',
      enableVibrate: false,
    });
  }
}
