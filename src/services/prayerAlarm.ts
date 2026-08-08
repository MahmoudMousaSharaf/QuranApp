import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync, AudioPlayer, AudioStatus } from 'expo-audio';
import { AppLanguage } from '../i18n/translations';
import { getPrayerNames } from './contentTranslations';

const ALARM_SETTINGS_KEY = '@prayer_alarm_settings';
const CACHED_LOCATION_KEY = '@cached_prayer_location';
const SCHEDULED_ALARMS_KEY = '@scheduled_prayer_alarm_ids';
const PRAYER_CHANNEL_ID = 'prayer_alarms';
const FAJR_CHANNEL_ID = 'prayer_alarms_fajr';
const STOP_ADHAN_ACTION_ID = 'stop_adhan';
const STOP_ADHAN_RESPONSE_ID = 'stop_adhan_response';

let _audioModeConfigured = false;
let _onPlaybackStatusUpdate: ((status: any) => void) | null = null;
let _statusListener: { remove: () => void } | null = null;

export interface CachedLocation {
  latitude: number;
  longitude: number;
  city: string;
  country: string;
  timestamp: number;
}

export interface PrayerAlarmSettings {
  fajr: boolean;
  dhuhr: boolean;
  asr: boolean;
  maghrib: boolean;
  isha: boolean;
}

const DEFAULT_SETTINGS: PrayerAlarmSettings = {
  fajr: false,
  dhuhr: false,
  asr: false,
  maghrib: false,
  isha: false,
};

const PRAYER_KEYS: (keyof PrayerAlarmSettings)[] = ['fajr', 'dhuhr', 'asr', 'maghrib', 'isha'];

let _player: AudioPlayer | null = null;
let _isLoadingSound = false;
let _lastRescheduleTime = 0;
let _activeNotificationId: string | null = null;
const RESCHEDULE_THROTTLE_MS = 5 * 60 * 1000; // 5 minutes

function getCalculationParams(lat: number, lng: number): any {
  const adhan = require('adhan');
  if (lat > 23 && lat < 32 && lng > 35 && lng < 52) {
    return adhan.CalculationMethod.UmmAlQura();
  } else if (lat > 22 && lat < 27 && lng > 50 && lng < 57) {
    return adhan.CalculationMethod.Dubai();
  } else if (lat > 24 && lat < 27 && lng > 50 && lng < 52) {
    return adhan.CalculationMethod.Qatar();
  } else if (lat > 25 && lat < 40 && lng > 44 && lng < 64) {
    return adhan.CalculationMethod.Tehran();
  } else if (lat > 15 && lat < 40 && lng > 60 && lng < 100) {
    return adhan.CalculationMethod.Karachi();
  } else if (lat > 20 && lat < 32 && lng > 25 && lng < 35) {
    return adhan.CalculationMethod.Egyptian();
  } else if (lat > 24 && lat < 70 && lng > -170 && lng < -50) {
    return adhan.CalculationMethod.NorthAmerica();
  } else {
    return adhan.CalculationMethod.MuslimWorldLeague();
  }
}

function calculatePrayerTimesForDate(date: Date, lat: number, lng: number): {
  fajr: Date | null; dhuhr: Date | null; asr: Date | null; maghrib: Date | null; isha: Date | null;
} {
  const adhan = require('adhan');
  const coordinates = new adhan.Coordinates(lat, lng);
  const params = getCalculationParams(lat, lng);
  const prayerTimes = new adhan.PrayerTimes(coordinates, date, params);
  return {
    fajr: prayerTimes.fajr,
    dhuhr: prayerTimes.dhuhr,
    asr: prayerTimes.asr,
    maghrib: prayerTimes.maghrib,
    isha: prayerTimes.isha,
  };
}

function formatDateId(d: Date): string {
  const y = d.getFullYear();
  const m = (d.getMonth() + 1).toString().padStart(2, '0');
  const day = d.getDate().toString().padStart(2, '0');
  return `${y}-${m}-${day}`;
}

async function saveScheduledAlarmIds(ids: string[]): Promise<void> {
  try {
    await AsyncStorage.setItem(SCHEDULED_ALARMS_KEY, JSON.stringify(ids));
  } catch {
    // ignore
  }
}

async function getScheduledAlarmIds(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(SCHEDULED_ALARMS_KEY);
    if (raw) return JSON.parse(raw);
  } catch {
    // ignore
  }
  return [];
}

export async function cancelAllScheduledPrayerAlarms(): Promise<void> {
  const ids = await getScheduledAlarmIds();
  for (const id of ids) {
    try {
      await Notifications.cancelScheduledNotificationAsync(id);
    } catch {
      // ignore
    }
  }
  await saveScheduledAlarmIds([]);
}

export function isAdhanPlaying(): boolean {
  return _player !== null && _player.playing;
}

export function setOnPlaybackStatusUpdate(callback: ((status: any) => void) | null): void {
  _onPlaybackStatusUpdate = callback;
}

async function configureAudioMode(): Promise<void> {
  if (_audioModeConfigured) return;
  try {
    await setIsAudioActiveAsync(true);
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: false,
    } as any);
    _audioModeConfigured = true;
  } catch (error) {
    console.error('Error configuring audio mode:', error);
  }
}

export async function initPrayerAlarms(): Promise<void> {
  await configureAudioMode();

  // Request notification permissions (required on iOS and Android 13+)
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync({
      ios: {
        allowAlert: true,
        allowBadge: true,
        allowSound: true,
        allowCriticalAlerts: true,
      },
      android: {
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldShowBadge: true,
      },
    });
    finalStatus = status;
  }
  if (finalStatus !== 'granted') {
    console.warn('Notification permissions not granted');
  }

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(PRAYER_CHANNEL_ID, {
      name: 'Prayer Alarms',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0d9488',
      enableVibrate: true,
      sound: 'adhan.mp3',
    });
    // Separate Fajr channel with Fajr-specific azan sound (includes "as-salatu khayrun min an-nawm")
    await Notifications.setNotificationChannelAsync(FAJR_CHANNEL_ID, {
      name: 'Fajr Prayer Alarm',
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#0d9488',
      enableVibrate: true,
      sound: 'adhan_fajr.mp3',
    });
  }

  // Register notification category with Stop action for iOS
  await Notifications.setNotificationCategoryAsync(STOP_ADHAN_ACTION_ID, [
    {
      identifier: STOP_ADHAN_RESPONSE_ID,
      buttonTitle: 'Stop Azan',
      options: { opensAppToForeground: false },
    },
  ]);
}

export async function getAlarmSettings(): Promise<PrayerAlarmSettings> {
  try {
    const raw = await AsyncStorage.getItem(ALARM_SETTINGS_KEY);
    if (raw) {
      return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
    }
  } catch {
    // ignore
  }
  return DEFAULT_SETTINGS;
}

export async function saveAlarmSettings(settings: PrayerAlarmSettings): Promise<void> {
  try {
    await AsyncStorage.setItem(ALARM_SETTINGS_KEY, JSON.stringify(settings));
  } catch {
    // ignore
  }
}

export async function setPrayerAlarmEnabled(
  prayer: keyof PrayerAlarmSettings,
  enabled: boolean,
  prayerTime: Date | null,
  lang: AppLanguage
): Promise<PrayerAlarmSettings> {
  const settings = await getAlarmSettings();
  settings[prayer] = enabled;
  await saveAlarmSettings(settings);

  // Reschedule all alarms for 7 days — force to bypass throttle since user changed settings
  await rescheduleAllAlarms({ fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null }, lang, true);

  return settings;
}

export async function enableAllPrayerAlarms(
  prayerTimes: { fajr: Date | null; dhuhr: Date | null; asr: Date | null; maghrib: Date | null; isha: Date | null },
  lang: AppLanguage
): Promise<PrayerAlarmSettings> {
  const settings: PrayerAlarmSettings = {
    fajr: true,
    dhuhr: true,
    asr: true,
    maghrib: true,
    isha: true,
  };
  await saveAlarmSettings(settings);

  await rescheduleAllAlarms(prayerTimes, lang, true);

  return settings;
}

export async function disableAllPrayerAlarms(): Promise<PrayerAlarmSettings> {
  const settings: PrayerAlarmSettings = { ...DEFAULT_SETTINGS };
  await saveAlarmSettings(settings);

  await cancelAllScheduledPrayerAlarms();

  return settings;
}

async function schedulePrayerAlarm(
  prayer: keyof PrayerAlarmSettings,
  prayerTime: Date,
  lang: AppLanguage,
  dateKey: string
): Promise<string | null> {
  const now = new Date();
  if (prayerTime <= now) return null;

  const prayerNames = getPrayerNames(lang);
  const prayerNameMap: Record<keyof PrayerAlarmSettings, string> = {
    fajr: prayerNames.fajr,
    dhuhr: prayerNames.dhuhr,
    asr: prayerNames.asr,
    maghrib: prayerNames.maghrib,
    isha: prayerNames.isha,
  };

  const notificationId = `prayer_alarm_${prayer}_${dateKey}`;
  const isFajr = prayer === 'fajr';
  const soundFile = isFajr ? 'adhan_fajr.mp3' : 'adhan.mp3';
  const channelId = isFajr ? FAJR_CHANNEL_ID : PRAYER_CHANNEL_ID;

  await Notifications.scheduleNotificationAsync({
    identifier: notificationId,
    content: {
      title: prayerNameMap[prayer],
      body: lang === 'ar' ? `حان وقت صلاة ${prayerNameMap[prayer]}` : `It's time for ${prayerNameMap[prayer]} prayer`,
      sound: soundFile,
      autoDismiss: false,
      priority: Notifications.AndroidNotificationPriority.HIGH,
      data: { prayer, isPrayerAlarm: true },
      categoryIdentifier: STOP_ADHAN_ACTION_ID,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: prayerTime,
      channelId,
    } as any,
  });
  return notificationId;
}

async function cancelPrayerAlarm(prayer: keyof PrayerAlarmSettings): Promise<void> {
  const notificationId = `prayer_alarm_${prayer}`;
  try {
    await Notifications.cancelScheduledNotificationAsync(notificationId);
  } catch {
    // ignore
  }
}

export async function cancelAllPrayerAlarms(): Promise<void> {
  await cancelAllScheduledPrayerAlarms();
}

const SCHEDULE_DAYS = 7;

export async function rescheduleAllAlarms(
  _prayerTimes: { fajr: Date | null; dhuhr: Date | null; asr: Date | null; maghrib: Date | null; isha: Date | null },
  lang: AppLanguage,
  force: boolean = false
): Promise<void> {
  const now = Date.now();
  if (!force && now - _lastRescheduleTime < RESCHEDULE_THROTTLE_MS) return;
  _lastRescheduleTime = now;

  const settings = await getAlarmSettings();
  const cached = await getCachedLocation();
  if (!cached) return;

  await cancelAllScheduledPrayerAlarms();

  const allIds: string[] = [];
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (let dayOffset = 0; dayOffset < SCHEDULE_DAYS; dayOffset++) {
    const date = new Date(today);
    date.setDate(date.getDate() + dayOffset);
    const dateKey = formatDateId(date);
    const times = calculatePrayerTimesForDate(date, cached.latitude, cached.longitude);

    for (const prayer of PRAYER_KEYS) {
      if (settings[prayer] && times[prayer]) {
        const id = await schedulePrayerAlarm(prayer, times[prayer]!, lang, dateKey);
        if (id) allIds.push(id);
      }
    }
  }

  await saveScheduledAlarmIds(allIds);
}

export async function rescheduleAlarmsFromCache(lang: AppLanguage): Promise<void> {
  const cached = await getCachedLocation();
  if (!cached) return;
  const settings = await getAlarmSettings();
  const hasAnyEnabled = PRAYER_KEYS.some(k => settings[k]);
  if (!hasAnyEnabled) return;

  await rescheduleAllAlarms({ fajr: null, dhuhr: null, asr: null, maghrib: null, isha: null }, lang);
}

export async function playAdhanSound(prayer?: keyof PrayerAlarmSettings): Promise<void> {
  try {
    await configureAudioMode();
    if (_player) {
      try { _player.pause(); _player.remove(); } catch {}
      _player = null;
    }
    if (_statusListener) {
      _statusListener.remove();
      _statusListener = null;
    }
    _isLoadingSound = true;
    const isFajr = prayer === 'fajr';
    const soundSource = isFajr
      ? require('../../assets/sounds/adhan_fajr.mp3')
      : require('../../assets/sounds/adhan.mp3');
    const player = createAudioPlayer(soundSource, {
      shouldPlay: true,
      loop: true,
      volume: 1.0,
      keepAudioSessionActive: true,
    });
    if (!_isLoadingSound) {
      try { player.pause(); player.remove(); } catch {}
      return;
    }
    _player = player;
    _statusListener = player.addListener('playbackStatusUpdate', (status: AudioStatus) => {
      if (_onPlaybackStatusUpdate) {
        _onPlaybackStatusUpdate(status);
      }
      if (status.didJustFinish && !status.isLooping) {
        stopAdhanSound();
      }
    });
    player.play();
  } catch (error) {
    console.error('Error playing adhan:', error);
    if (_onPlaybackStatusUpdate) {
      _onPlaybackStatusUpdate({ isPlaying: false, didJustFinish: true });
    }
  } finally {
    _isLoadingSound = false;
  }
}

export function setActiveNotificationId(id: string | null): void {
  _activeNotificationId = id;
}

export async function stopAdhanSound(): Promise<void> {
  _isLoadingSound = false;
  try {
    if (_player) {
      try { _player.pause(); _player.remove(); } catch {}
      _player = null;
    }
    if (_statusListener) {
      _statusListener.remove();
      _statusListener = null;
    }
    // Dismiss the active prayer alarm notification
    if (_activeNotificationId) {
      try {
        await Notifications.dismissNotificationAsync(_activeNotificationId);
      } catch {
        // ignore
      }
      _activeNotificationId = null;
    }
    if (_onPlaybackStatusUpdate) {
      _onPlaybackStatusUpdate({ isPlaying: false, didJustFinish: true });
    }
  } catch {
    // ignore
  }
}

export function getStopAdhanResponseId(): string {
  return STOP_ADHAN_RESPONSE_ID;
}

export async function cacheLocation(loc: CachedLocation): Promise<void> {
  try {
    await AsyncStorage.setItem(CACHED_LOCATION_KEY, JSON.stringify(loc));
  } catch {
    // ignore
  }
}

export async function getCachedLocation(): Promise<CachedLocation | null> {
  try {
    const raw = await AsyncStorage.getItem(CACHED_LOCATION_KEY);
    if (raw) {
      return JSON.parse(raw);
    }
  } catch {
    // ignore
  }
  return null;
}

export async function clearCachedLocation(): Promise<void> {
  try {
    await AsyncStorage.removeItem(CACHED_LOCATION_KEY);
  } catch {
    // ignore
  }
}
