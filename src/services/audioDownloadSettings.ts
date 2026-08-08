import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

const WIFI_ONLY_KEY = '@audio_download_wifi_only';
const SELECTED_RECITERS_KEY = '@audio_download_selected_reciters';
const DOWNLOAD_RUQYAH_KEY = '@audio_download_ruqyah';
const AUTO_DOWNLOAD_KEY = '@audio_download_auto';
const STREAM_MODE_KEY = '@audio_stream_mode';

export const ALL_RECITERS = [
  { id: 'ar.alafasy', name: 'Mishary Rashid Alafasy', ar: 'مشاري العفاسي' },
  { id: 'ar.abdulbasitmurattal', name: 'Abdul Basit (Murattal)', ar: 'عبد الباسط (مرتل)' },
  { id: 'ar.husary', name: 'Mahmoud Al-Hussary', ar: 'محمود الحصري' },
  { id: 'ar.minshaimurattal', name: 'Al-Minshawi (Murattal)', ar: 'المنشاوي (مرتل)' },
  { id: 'ar.abdullahbasfar', name: 'Abdullah Basfar', ar: 'عبدالله بصفر' },
  { id: 'ar.hanirifai', name: 'Hani Ar-Rifai', ar: 'هاني الرفاعي' },
  { id: 'ar.saoodshuraym', name: 'Saud Ash-Shuraim', ar: 'سعود الشريم' },
];

export const RUQYAH_SHEIKHS = [
  { id: 'mishary', name: 'Sheikh Mishary Rashid Alafasy', ar: 'الشيخ مشاري راشد العفاسي' },
  { id: 'sudais', name: 'Sheikh Abdul Rahman Al-Sudais', ar: 'الشيخ عبد الرحمن السديس' },
  { id: 'maher', name: 'Sheikh Maher Al-Muaiqly', ar: 'الشيخ ماهر المعيقلي' },
];

export async function getWifiOnlySetting(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(WIFI_ONLY_KEY);
    return val === null ? true : val === 'true';
  } catch {
    return true;
  }
}

export async function setWifiOnlySetting(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(WIFI_ONLY_KEY, enabled ? 'true' : 'false');
}

export async function getAutoDownloadSetting(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(AUTO_DOWNLOAD_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setAutoDownloadSetting(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(AUTO_DOWNLOAD_KEY, enabled ? 'true' : 'false');
}

export async function getSelectedReciters(): Promise<string[]> {
  try {
    const val = await AsyncStorage.getItem(SELECTED_RECITERS_KEY);
    if (val) return JSON.parse(val) as string[];
    return [];
  } catch {
    return [];
  }
}

export async function setSelectedReciters(reciterIds: string[]): Promise<void> {
  await AsyncStorage.setItem(SELECTED_RECITERS_KEY, JSON.stringify(reciterIds));
}

export async function getDownloadRuqyahSetting(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(DOWNLOAD_RUQYAH_KEY);
    return val === 'true';
  } catch {
    return false;
  }
}

export async function setDownloadRuqyahSetting(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(DOWNLOAD_RUQYAH_KEY, enabled ? 'true' : 'false');
}

export async function isOnWifi(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return state.type === 'wifi';
  } catch {
    return false;
  }
}

export async function isConnectionExpensive(): Promise<boolean> {
  try {
    const state = await NetInfo.fetch();
    return !!(state.details as any)?.isConnectionExpensive;
  } catch {
    return false;
  }
}

export function getReciterUrls(reciterIds: string[]): string[] {
  const urls: string[] = [];
  for (const reciterId of reciterIds) {
    for (let surah = 1; surah <= 114; surah++) {
      urls.push(`https://cdn.islamic.network/quran/audio-surah/128/${reciterId}/${surah}.mp3`);
    }
  }
  return urls;
}

export function getRuqyahUrls(): string[] {
  return [
    'https://peace.azmza.com/store/storep/scrd/RuqyahShariah/Ruqyah-Shariah-Quran-voice-mishari.mp3',
    'https://peace.azmza.com/store/storep/scrd/RuqyahShariah/Ruqyah-Shariah-Quran-voice-abdul-rehman.mp3',
    'https://archive.org/download/khaled_alridwany_256/%D8%A7%D9%84%D8%B1%D9%82%D9%8A%D9%87%20%D8%A7%D9%84%D8%B4%D8%B1%D8%B9%D9%8A%D9%87%20-%20%D8%A7%D9%84%D8%B4%D9%8A%D8%AE%20%D9%85%D8%A7%D9%87%D8%B1%20%D8%A7%D9%84%D9%85%D8%B9%D9%8A%D9%82%D9%84%D9%8A.mp3',
  ];
}

export type StreamMode = 'stream' | 'offline';

export async function getStreamMode(): Promise<StreamMode> {
  try {
    const val = await AsyncStorage.getItem(STREAM_MODE_KEY);
    return (val as StreamMode) || 'stream';
  } catch {
    return 'stream';
  }
}

export async function setStreamMode(mode: StreamMode): Promise<void> {
  await AsyncStorage.setItem(STREAM_MODE_KEY, mode);
}

export function estimateDownloadSizeMB(reciterIds: string[], includeRuqyah: boolean): number {
  const reciterCount = reciterIds.length;
  const quranSizeMB = reciterCount * 114 * 1.5;
  const ruqyahSizeMB = includeRuqyah ? 150 : 0;
  return Math.round(quranSizeMB + ruqyahSizeMB);
}
