import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync, AudioPlayer, AudioStatus } from 'expo-audio';
import { AppState, AppStateStatus } from 'react-native';
import { getPlayableAudioUrl, prioritizeAudioDownload, isAudioCached } from './audioCache';
import { getStreamMode } from './audioDownloadSettings';

export type AudioOwner = 'ruqyah' | 'quran';

export interface AudioMetadata {
  title: string;
  artist: string;
  albumTitle?: string;
  artworkUrl?: string;
}

type PlayStateCallback = (isPlaying: boolean) => void;
type StatusCallback = (status: AudioStatus) => void;

let player: AudioPlayer | null = null;
let currentUrl: string | null = null;
let currentOwner: AudioOwner | null = null;
let currentMetadata: AudioMetadata | null = null;
let playStateCallback: PlayStateCallback | null = null;
let statusListener: { remove: () => void } | null = null;
let wasPlayingBeforeInterruption = false;

function enableLockScreen(metadata: AudioMetadata) {
  if (!player) return;
  try {
    player.setActiveForLockScreen(true, {
      title: metadata.title,
      artist: metadata.artist,
      albumTitle: metadata.albumTitle || 'The Truth - Al Haq',
      artworkUrl: metadata.artworkUrl,
    } as any);
  } catch (e) {
    console.log('Lock screen enable error:', e);
  }
}

function disableLockScreen() {
  if (!player) return;
  try {
    player.setActiveForLockScreen(false);
  } catch (e) {
    console.log('Lock screen disable error:', e);
  }
}

export async function ensureAudioMode() {
  try {
    await setIsAudioActiveAsync(true);
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'doNotMix',
      shouldRouteThroughEarpiece: false,
    } as any);
  } catch (e) {
    console.log('Audio mode setup error:', e);
  }
}

let appStateSubscription: { remove: () => void } | null = null;

function setupAppStateListener() {
  if (appStateSubscription) return;
  appStateSubscription = AppState.addEventListener('change', handleAppStateChange);
}

async function handleAppStateChange(nextAppState: AppStateStatus) {
  if (nextAppState === 'active') {
    await ensureAudioMode();
    if (wasPlayingBeforeInterruption && player) {
      try {
        if (!player.playing) {
          player.play();
        }
      } catch (e) {
        console.log('Resume after background error:', e);
      }
      wasPlayingBeforeInterruption = false;
    }
  } else if (nextAppState === 'background' || nextAppState === 'inactive') {
    if (player) {
      wasPlayingBeforeInterruption = player.playing;
    }
  }
}

function clearStatusListener() {
  if (statusListener) {
    statusListener.remove();
    statusListener = null;
  }
}

function destroyPlayer() {
  if (player) {
    try {
      disableLockScreen();
      player.pause();
      player.remove();
    } catch (e) {
      console.log('Destroy player error:', e);
    }
    player = null;
  }
  clearStatusListener();
}

export function setPlayStateCallback(cb: PlayStateCallback) {
  playStateCallback = cb;
}

export function getCurrentUrl(): string | null {
  return currentUrl;
}

export function isSoundPlaying(): boolean {
  return player !== null && player.playing;
}

export function getCurrentOwner(): AudioOwner | null {
  return currentOwner;
}

export async function playAudio(url: string, owner: AudioOwner = 'ruqyah', loop: boolean = true, metadata?: AudioMetadata): Promise<void> {
  await ensureAudioMode();
  setupAppStateListener();

  if (player) {
    if (currentUrl === url && currentOwner === owner) {
      player.play();
      if (metadata) enableLockScreen(metadata);
      if (playStateCallback) playStateCallback(true);
      return;
    }
    destroyPlayer();
  }

  const mode = await getStreamMode();
  const cached = await isAudioCached(url);
  let playableUrl: string;
  if (cached) {
    playableUrl = await getPlayableAudioUrl(url);
  } else if (mode === 'stream') {
    playableUrl = url;
  } else {
    await prioritizeAudioDownload(url);
    playableUrl = await getPlayableAudioUrl(url);
  }
  player = createAudioPlayer(playableUrl, { keepAudioSessionActive: true, downloadFirst: false });
  player.loop = loop;
  currentUrl = url;
  currentOwner = owner;
  currentMetadata = metadata || null;
  player.play();
  if (metadata) enableLockScreen(metadata);
  if (playStateCallback) playStateCallback(true);
}

export async function playAudioWithStatus(
  url: string,
  owner: AudioOwner,
  onStatus: StatusCallback,
  metadata?: AudioMetadata
): Promise<void> {
  await ensureAudioMode();
  setupAppStateListener();

  if (player) {
    destroyPlayer();
  }

  const mode = await getStreamMode();
  const cached = await isAudioCached(url);
  let playableUrl: string;
  if (cached) {
    playableUrl = await getPlayableAudioUrl(url);
  } else if (mode === 'stream') {
    playableUrl = url;
  } else {
    await prioritizeAudioDownload(url);
    playableUrl = await getPlayableAudioUrl(url);
  }
  player = createAudioPlayer(playableUrl, { keepAudioSessionActive: true });
  player.loop = false;
  currentUrl = url;
  currentOwner = owner;
  currentMetadata = metadata || null;
  statusListener = player.addListener('playbackStatusUpdate', onStatus);
  player.play();
  if (metadata) enableLockScreen(metadata);
  if (playStateCallback) playStateCallback(true);
}

export async function stopAudio(): Promise<void> {
  destroyPlayer();
  currentUrl = null;
  currentOwner = null;
  currentMetadata = null;
  wasPlayingBeforeInterruption = false;
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  try {
    await setIsAudioActiveAsync(false);
  } catch (e) {}
  if (playStateCallback) playStateCallback(false);
}

export async function pauseAudio(): Promise<void> {
  if (player) {
    try {
      player.pause();
    } catch (e) {
      console.log('Pause error:', e);
    }
  }
}

export async function resumeAudio(): Promise<void> {
  if (player) {
    try {
      player.play();
    } catch (e) {
      console.log('Resume error:', e);
    }
  }
}

export function getCurrentMetadata(): AudioMetadata | null {
  return currentMetadata;
}

export async function replaceAudio(url: string, onStatus?: StatusCallback): Promise<void> {
  if (!player) return;
  clearStatusListener();
  player.replace(url);
  currentUrl = url;
  if (onStatus) {
    statusListener = player.addListener('playbackStatusUpdate', onStatus);
  }
  player.play();
}
