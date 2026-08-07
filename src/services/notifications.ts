import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage } from '../i18n/translations';

const REMINDER_CHANNELS = {
  morning: 'morning_azkar',
  evening: 'evening_azkar',
  sleep: 'sleep_azkar',
  afterPrayer: 'after_prayer_azkar',
};

const AZKAR_REMINDER_IDS_KEY = '@azkar_reminder_ids';

let _azkarData: any = null;
function getAzkarData(): any {
  if (!_azkarData) {
    _azkarData = require('../data/azkar.json');
  }
  return _azkarData;
}

function getRandomAzkarText(categoryId: number, lang: AppLanguage): string {
  try {
    const data = getAzkarData();
    const category = data.categories.find((c: any) => c.id === categoryId);
    if (!category || !category.items || category.items.length === 0) return '';
    const randomItem = category.items[Math.floor(Math.random() * category.items.length)];
    if (lang === 'ar') return randomItem.text_ar || '';
    return randomItem.text_en || '';
  } catch {
    return '';
  }
}

let initialized = false;

export async function initNotifications(): Promise<void> {
  if (initialized) return;
  initialized = true;

  // Set notification handler for foreground behavior
  Notifications.setNotificationHandler({
    handleNotification: async (notification) => {
      const isPrayerAlarm = notification.request.content.data?.isPrayerAlarm === true;
      return {
        shouldShowAlert: true,
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: false, // Adhan is played via expo-av, not notification sound
        shouldSetBadge: false,
        priority: isPrayerAlarm
          ? Notifications.AndroidNotificationPriority.HIGH
          : Notifications.AndroidNotificationPriority.LOW,
      };
    },
  });

  // Request permissions
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    return;
  }

  // Create Android notification channels
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNELS.morning, {
      name: 'Morning Azkar Reminder',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0d9488',
      enableVibrate: false,
    });
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNELS.evening, {
      name: 'Evening Azkar Reminder',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0d9488',
      enableVibrate: false,
    });
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNELS.sleep, {
      name: 'Sleep Azkar Reminder',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#6366f1',
      enableVibrate: false,
    });
    await Notifications.setNotificationChannelAsync(REMINDER_CHANNELS.afterPrayer, {
      name: 'After Prayer Azkar Reminder',
      importance: Notifications.AndroidImportance.LOW,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0d9488',
      enableVibrate: false,
    });
  }
}

const REMINDER_TITLES: Record<AppLanguage, { morning: string; evening: string; sleep: string; afterPrayer: string }> = {
  ar: { morning: 'أذكار الصباح', evening: 'أذكار المساء', sleep: 'أذكار النوم', afterPrayer: 'أذكار بعد الصلاة' },
  en: { morning: 'Morning Azkar', evening: 'Evening Azkar', sleep: 'Sleep Azkar', afterPrayer: 'After Prayer Azkar' },
  zh: { morning: '晨祷', evening: '晚祷', sleep: '睡前祈祷', afterPrayer: '礼拜后祈祷' },
  hi: { morning: 'सुबह की अज़्कार', evening: 'शाम की अज़्कार', sleep: 'सोने की अज़्कार', afterPrayer: 'नमाज़ के बाद की अज़्कार' },
  ru: { morning: 'Утренние азкары', evening: 'Вечерние азкары', sleep: 'Азкары перед сном', afterPrayer: 'Азкары после молитвы' },
  ko: { morning: '아침 아즈카르', evening: '저녁 아즈카르', sleep: '취침 전 아즈카르', afterPrayer: '기도 후 아즈카르' },
  ja: { morning: '朝のアズカール', evening: '夜のアズカール', sleep: '就寝前のアズカール', afterPrayer: '礼拝後のアズカール' },
  de: { morning: 'Morgendliche Azkar', evening: 'Abendliche Azkar', sleep: 'Azkar vor dem Schlafengehen', afterPrayer: 'Azkar nach dem Gebet' },
  fr: { morning: 'Azkar du matin', evening: 'Azkar du soir', sleep: 'Azkar du coucher', afterPrayer: 'Azkar après la prière' },
  es: { morning: 'Azkar matutino', evening: 'Azkar vespertino', sleep: 'Azkar antes de dormir', afterPrayer: 'Azkar después de la oración' },
  tr: { morning: 'Sabah Zikirleri', evening: 'Akşam Zikirleri', sleep: 'Uyku Zikirleri', afterPrayer: 'Namaz Sonrası Zikirleri' },
  ur: { morning: 'صبح کے اذکار', evening: 'شام کے اذکار', sleep: 'سونے کے اذکار', afterPrayer: 'نماز کے بعد کے اذکار' },
  id: { morning: 'Dzikir Pagi', evening: 'Dzikir Sore', sleep: 'Dzikir Sebelum Tidur', afterPrayer: 'Dzikir Setelah Sholat' },
  bn: { morning: 'সকালের আজকার', evening: 'সন্ধ্যার আজকার', sleep: 'ঘুমানোর আজকার', afterPrayer: 'নামাজের পরের আজকার' },
  pt: { morning: 'Azkar da manhã', evening: 'Azkar da tarde', sleep: 'Azkar antes de dormir', afterPrayer: 'Azkar após a oração' },
  ms: { morning: 'Zikir Pagi', evening: 'Zikir Petang', sleep: 'Zikir Sebelum Tidur', afterPrayer: 'Zikir Selepas Solat' },
};

const REMINDER_BODIES: Record<AppLanguage, { morning: string; evening: string; sleep: string; afterPrayer: string }> = {
  ar: { morning: 'لا تنسَ أذكار الصباح 🌅', evening: 'لا تنسَ أذكار المساء 🌙', sleep: 'لا تنسَ أذكار النوم 🌙', afterPrayer: 'لا تنسَ أذكار بعد الصلاة 🕌' },
  en: { morning: "Don't forget your morning Azkar 🌅", evening: "Don't forget your evening Azkar 🌙", sleep: "Don't forget your sleep Azkar 🌙", afterPrayer: "Don't forget your after-prayer Azkar 🕌" },
  zh: { morning: '别忘了晨祷 🌅', evening: '别忘了晚祷 🌙', sleep: '别忘了睡前祈祷 🌙', afterPrayer: '别忘了礼拜后的祈祷 🕌' },
  hi: { morning: 'अपने सुबह के अज़्कार न भूलें 🌅', evening: 'अपने शाम के अज़्कार न भूलें 🌙', sleep: 'अपने सोने के अज़्कार न भूलें 🌙', afterPrayer: 'नमाज़ के बाद के अज़्कार न भूलें 🕌' },
  ru: { morning: 'Не забудьте утренние азкары 🌅', evening: 'Не забудьте вечерние азкары 🌙', sleep: 'Не забудьте азкары перед сном 🌙', afterPrayer: 'Не забудьте азкары после молитвы 🕌' },
  ko: { morning: '아침 아즈카르를 잊지 마세요 🌅', evening: '저녁 아즈카르를 잊지 마세요 🌙', sleep: '취침 전 아즈카르를 잊지 마세요 🌙', afterPrayer: '기도 후 아즈카르를 잊지 마세요 🕌' },
  ja: { morning: '朝のアズカールを忘れないでください 🌅', evening: '夜のアズカールを忘れないでください 🌙', sleep: '就寝前のアズカールを忘れないでください 🌙', afterPrayer: '礼拝後のアズカールを忘れないでください 🕌' },
  de: { morning: 'Vergiss deine morgendlichen Azkar nicht 🌅', evening: 'Vergiss deine abendlichen Azkar nicht 🌙', sleep: 'Vergiss deine Azkar vor dem Schlafengehen nicht 🌙', afterPrayer: 'Vergiss deine Azkar nach dem Gebet nicht 🕌' },
  fr: { morning: "N'oubliez pas vos azkar du matin 🌅", evening: "N'oubliez pas vos azkar du soir 🌙", sleep: "N'oubliez pas vos azkar du coucher 🌙", afterPrayer: "N'oubliez pas vos azkar après la prière 🕌" },
  es: { morning: 'No olvides tus azkar matutinos 🌅', evening: 'No olvides tus azkar vespertinos 🌙', sleep: 'No olvides tus azkar antes de dormir 🌙', afterPrayer: 'No olvides tus azkar después de la oración 🕌' },
  tr: { morning: 'Sabah zikirlerini unutma 🌅', evening: 'Akşam zikirlerini unutma 🌙', sleep: 'Uyku zikirlerini unutma 🌙', afterPrayer: 'Namazdan sonra zikirlerini unutma 🕌' },
  ur: { morning: 'صبح کے اذکار نہ بھولیں 🌅', evening: 'شام کے اذکار نہ بھولیں 🌙', sleep: 'سونے کے اذکار نہ بھولیں 🌙', afterPrayer: 'نماز کے بعد کے اذکار نہ بھولیں 🕌' },
  id: { morning: 'Jangan lupa dzikir pagi 🌅', evening: 'Jangan lupa dzikir sore 🌙', sleep: 'Jangan lupa dzikir sebelum tidur 🌙', afterPrayer: 'Jangan lupa dzikir setelah sholat 🕌' },
  bn: { morning: 'সকালের আজকার ভুলবেন না 🌅', evening: 'সন্ধ্যার আজকার ভুলবেন না 🌙', sleep: 'ঘুমানোর আজকার ভুলবেন না 🌙', afterPrayer: 'নামাজের পরের আজকার ভুলবেন না 🕌' },
  pt: { morning: 'Não se esqueça dos azkar da manhã 🌅', evening: 'Não se esqueça dos azkar da tarde 🌙', sleep: 'Não se esqueça dos azkar antes de dormir 🌙', afterPrayer: 'Não se esqueça dos azkar após a oração 🕌' },
  ms: { morning: 'Jangan lupa zikir pagi 🌅', evening: 'Jangan lupa zikir petang 🌙', sleep: 'Jangan lupa zikir sebelum tidur 🌙', afterPrayer: 'Jangan lupa zikir selepas solat 🕌' },
};

export async function scheduleAzkarReminders(lang: AppLanguage): Promise<void> {
  await initNotifications();

  // Cancel only existing azkar reminders (not prayer alarms)
  try {
    const raw = await AsyncStorage.getItem(AZKAR_REMINDER_IDS_KEY);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      }
    }
  } catch {
    // ignore
  }

  const titles = REMINDER_TITLES[lang] || REMINDER_TITLES.en;
  const bodies = REMINDER_BODIES[lang] || REMINDER_BODIES.en;

  // Get random azkar text for each category in the selected language
  const morningAzkar = getRandomAzkarText(1, lang);
  const eveningAzkar = getRandomAzkarText(2, lang);
  const sleepAzkar = getRandomAzkarText(4, lang);
  const afterPrayerAzkar = getRandomAzkarText(3, lang);

  const scheduledIds: string[] = [];

  // Morning Azkar - 6:00 AM
  const morningBody = morningAzkar
    ? `${bodies.morning}\n\n${morningAzkar}`
    : bodies.morning;
  const morningId = await Notifications.scheduleNotificationAsync({
    content: {
      title: titles.morning,
      body: morningBody,
      autoDismiss: true,
      priority: Notifications.AndroidNotificationPriority.LOW,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 6,
      minute: 0,
      repeats: true,
      channelId: REMINDER_CHANNELS.morning,
    } as any,
  });
  scheduledIds.push(morningId);

  // Evening Azkar - 5:00 PM
  const eveningBody = eveningAzkar
    ? `${bodies.evening}\n\n${eveningAzkar}`
    : bodies.evening;
  const eveningId = await Notifications.scheduleNotificationAsync({
    content: {
      title: titles.evening,
      body: eveningBody,
      autoDismiss: true,
      priority: Notifications.AndroidNotificationPriority.LOW,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 17,
      minute: 0,
      repeats: true,
      channelId: REMINDER_CHANNELS.evening,
    } as any,
  });
  scheduledIds.push(eveningId);

  // Sleep Azkar - 10:00 PM
  const sleepBody = sleepAzkar
    ? `${bodies.sleep}\n\n${sleepAzkar}`
    : bodies.sleep;
  const sleepId = await Notifications.scheduleNotificationAsync({
    content: {
      title: titles.sleep,
      body: sleepBody,
      autoDismiss: true,
      priority: Notifications.AndroidNotificationPriority.LOW,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 22,
      minute: 0,
      repeats: true,
      channelId: REMINDER_CHANNELS.sleep,
    } as any,
  });
  scheduledIds.push(sleepId);

  // After Prayer Azkar - 1:00 PM (Dhuhr time as representative)
  const afterPrayerBody = afterPrayerAzkar
    ? `${bodies.afterPrayer}\n\n${afterPrayerAzkar}`
    : bodies.afterPrayer;
  const afterPrayerId = await Notifications.scheduleNotificationAsync({
    content: {
      title: titles.afterPrayer,
      body: afterPrayerBody,
      autoDismiss: true,
      priority: Notifications.AndroidNotificationPriority.LOW,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.CALENDAR,
      hour: 13,
      minute: 0,
      repeats: true,
      channelId: REMINDER_CHANNELS.afterPrayer,
    } as any,
  });
  scheduledIds.push(afterPrayerId);

  // Save the IDs so we can cancel only azkar reminders later without affecting prayer alarms
  await AsyncStorage.setItem(AZKAR_REMINDER_IDS_KEY, JSON.stringify(scheduledIds));
}

export async function cancelAzkarReminders(): Promise<void> {
  try {
    const raw = await AsyncStorage.getItem(AZKAR_REMINDER_IDS_KEY);
    if (raw) {
      const ids: string[] = JSON.parse(raw);
      for (const id of ids) {
        await Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
      }
      await AsyncStorage.removeItem(AZKAR_REMINDER_IDS_KEY);
    }
  } catch {
    // ignore
  }
}
