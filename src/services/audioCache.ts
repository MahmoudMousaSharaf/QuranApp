import * as FileSystem from 'expo-file-system/legacy';

const CACHE_DIR = `${FileSystem.documentDirectory}audio-cache/`;

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
