import * as FileSystem from 'expo-file-system/legacy';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  getSelectedReciters,
  getDownloadRuqyahSetting,
  getWifiOnlySetting,
  getAutoDownloadSetting,
  getReciterUrls,
  getRuqyahUrls,
  isOnWifi,
} from './audioDownloadSettings';

const CACHE_DIR = `${FileSystem.documentDirectory}audio-cache/`;
const PRELOAD_PROGRESS_KEY = '@audio_preload_progress';
const PRELOAD_DONE_KEY = '@audio_preload_done';

const QURAN_RECITERS = [
  'ar.alafasy',
  'ar.abdulbasitmurattal',
  'ar.husary',
  'ar.minshaimurattal',
  'ar.abdullahbasfar',
  'ar.hanirifai',
  'ar.saoodshuraym',
];

const RUQYAH_URLS = getRuqyahUrls();

export function getAllAudioUrls(): string[] {
  return [...getReciterUrls(QURAN_RECITERS), ...RUQYAH_URLS];
}

async function getUserSelectedUrls(): Promise<string[]> {
  const [reciters, downloadRuqyah] = await Promise.all([
    getSelectedReciters(),
    getDownloadRuqyahSetting(),
  ]);
  const urls = getReciterUrls(reciters);
  if (downloadRuqyah) {
    urls.push(...RUQYAH_URLS);
  }
  return urls;
}

const cacheMap = new Map<string, string>();
let cacheDirInitialized = false;

async function ensureCacheDir(): Promise<void> {
  if (cacheDirInitialized) return;
  try {
    const info = await FileSystem.getInfoAsync(CACHE_DIR);
    if (!info.exists) {
      await FileSystem.makeDirectoryAsync(CACHE_DIR, { intermediates: true });
    }
    cacheDirInitialized = true;
  } catch (e) {
    console.log('Cache dir init error:', e);
  }
}

function urlToCacheKey(url: string): string {
  let hash = 0;
  for (let i = 0; i < url.length; i++) {
    const char = url.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `audio_${Math.abs(hash)}.mp3`;
}

export async function getCachedAudioPath(url: string): Promise<string | null> {
  if (cacheMap.has(url)) {
    const path = cacheMap.get(url)!;
    const info = await FileSystem.getInfoAsync(path);
    if (info.exists) return path;
    cacheMap.delete(url);
  }

  await ensureCacheDir();
  const cacheKey = urlToCacheKey(url);
  const localPath = `${CACHE_DIR}${cacheKey}`;

  const info = await FileSystem.getInfoAsync(localPath);
  if (info.exists && info.size > 0) {
    cacheMap.set(url, localPath);
    return localPath;
  }

  return null;
}

export async function downloadAndCacheAudio(
  url: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  const cached = await getCachedAudioPath(url);
  if (cached) return cached;

  await ensureCacheDir();
  const cacheKey = urlToCacheKey(url);
  const localPath = `${CACHE_DIR}${cacheKey}`;

  const downloadResumable = FileSystem.createDownloadResumable(
    url,
    localPath,
    {},
    (downloadProgress) => {
      if (onProgress && downloadProgress.totalBytesWritten && downloadProgress.totalBytesExpectedToWrite) {
        const pct = (downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite) * 100;
        onProgress(pct);
      }
    }
  );

  const result = await downloadResumable.downloadAsync();
  if (result && result.status === 200) {
    cacheMap.set(url, localPath);
    return localPath;
  }

  throw new Error(`Download failed: ${result?.status || 'unknown'}`);
}

export async function getPlayableAudioUrl(
  url: string,
  onProgress?: (progress: number) => void
): Promise<string> {
  try {
    const cached = await getCachedAudioPath(url);
    if (cached) return cached;

    const localPath = await downloadAndCacheAudio(url, onProgress);
    return localPath;
  } catch (e) {
    console.log('Audio cache error, falling back to remote URL:', e);
    return url;
  }
}

export type PreloadProgress = {
  downloaded: number;
  total: number;
  percentage: number;
  currentFile: string;
};

type PreloadCallback = (progress: PreloadProgress) => void;

let preloading = false;
let preloadCancelled = false;
let priorityUrls = new Set<string>();

export function cancelPreload(): void {
  preloadCancelled = true;
}

export function isPreloading(): boolean {
  return preloading;
}

export async function getPreloadProgress(): Promise<{ downloaded: number; total: number }> {
  try {
    const done = await AsyncStorage.getItem(PRELOAD_DONE_KEY);
    if (done === 'true') {
      const all = getAllAudioUrls();
      return { downloaded: all.length, total: all.length };
    }
    const raw = await AsyncStorage.getItem(PRELOAD_PROGRESS_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as string[];
      const all = getAllAudioUrls();
      return { downloaded: parsed.length, total: all.length };
    }
  } catch {}
  const all = getAllAudioUrls();
  return { downloaded: 0, total: all.length };
}

export async function isPreloadComplete(): Promise<boolean> {
  try {
    const done = await AsyncStorage.getItem(PRELOAD_DONE_KEY);
    return done === 'true';
  } catch {
    return false;
  }
}

async function downloadSingle(url: string): Promise<boolean> {
  try {
    const cached = await getCachedAudioPath(url);
    if (cached) return true;

    await ensureCacheDir();
    const cacheKey = urlToCacheKey(url);
    const localPath = `${CACHE_DIR}${cacheKey}`;

    const result = await FileSystem.downloadAsync(url, localPath, {});
    if (result && result.status === 200) {
      cacheMap.set(url, localPath);
      return true;
    }
    return false;
  } catch (e) {
    console.log('Single download error:', url, e);
    return false;
  }
}

export async function preloadAllAudio(onProgress?: PreloadCallback): Promise<void> {
  if (preloading) return;

  const [autoDownload, wifiOnly, isWifi] = await Promise.all([
    getAutoDownloadSetting(),
    getWifiOnlySetting(),
    isOnWifi(),
  ]);

  if (!autoDownload) return;
  if (wifiOnly && !isWifi) return;

  preloading = true;
  preloadCancelled = false;

  const allUrls = await getUserSelectedUrls();
  const total = allUrls.length;

  if (total === 0) {
    preloading = false;
    return;
  }

  let downloadedSet: Set<string> = new Set();
  try {
    const raw = await AsyncStorage.getItem(PRELOAD_PROGRESS_KEY);
    if (raw) {
      downloadedSet = new Set(JSON.parse(raw) as string[]);
    }
  } catch {}

  const done = await AsyncStorage.getItem(PRELOAD_DONE_KEY);
  if (done === 'true') {
    if (onProgress) {
      onProgress({ downloaded: total, total, percentage: 100, currentFile: '' });
    }
    preloading = false;
    return;
  }

  const remaining = allUrls.filter((u) => !downloadedSet.has(u));

  if (remaining.length === 0) {
    await AsyncStorage.setItem(PRELOAD_DONE_KEY, 'true');
    if (onProgress) {
      onProgress({ downloaded: total, total, percentage: 100, currentFile: '' });
    }
    preloading = false;
    return;
  }

  const CONCURRENCY = 3;
  let completed = downloadedSet.size;
  let index = 0;

  async function worker(): Promise<void> {
    while (index < remaining.length && !preloadCancelled) {
      const currentIndex = index++;
      const url = remaining[currentIndex];

      const isPriority = priorityUrls.has(url);
      const success = await downloadSingle(url);

      if (success) {
        downloadedSet.add(url);
        completed++;

        if (completed % 5 === 0 || isPriority) {
          try {
            await AsyncStorage.setItem(PRELOAD_PROGRESS_KEY, JSON.stringify([...downloadedSet]));
          } catch {}
        }

        if (onProgress) {
          const pct = Math.round((completed / total) * 100);
          const fileName = url.split('/').pop() || url;
          onProgress({ downloaded: completed, total, percentage: pct, currentFile: fileName });
        }
      }
    }
  }

  const workers: Promise<void>[] = [];
  for (let i = 0; i < CONCURRENCY; i++) {
    workers.push(worker());
  }
  await Promise.all(workers);

  try {
    await AsyncStorage.setItem(PRELOAD_PROGRESS_KEY, JSON.stringify([...downloadedSet]));
    if (completed >= total) {
      await AsyncStorage.setItem(PRELOAD_DONE_KEY, 'true');
    }
  } catch {}

  if (onProgress) {
    onProgress({ downloaded: completed, total, percentage: Math.round((completed / total) * 100), currentFile: '' });
  }

  preloading = false;
}

export async function prioritizeAudioDownload(url: string): Promise<void> {
  const cached = await getCachedAudioPath(url);
  if (cached) return;

  if (preloading) {
    priorityUrls.add(url);
  }

  await downloadSingle(url);
}

export async function isAudioCached(url: string): Promise<boolean> {
  const cached = await getCachedAudioPath(url);
  return cached !== null;
}

export async function getCacheSize(): Promise<number> {
  try {
    await ensureCacheDir();
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    let totalSize = 0;
    for (const file of files) {
      const info = await FileSystem.getInfoAsync(`${CACHE_DIR}${file}`);
      if (info.exists && info.size) {
        totalSize += info.size;
      }
    }
    return totalSize;
  } catch {
    return 0;
  }
}

export async function clearAudioCache(): Promise<void> {
  try {
    await ensureCacheDir();
    const files = await FileSystem.readDirectoryAsync(CACHE_DIR);
    for (const file of files) {
      await FileSystem.deleteAsync(`${CACHE_DIR}${file}`, { idempotent: true });
    }
    cacheMap.clear();
  } catch (e) {
    console.log('Clear cache error:', e);
  }
}
