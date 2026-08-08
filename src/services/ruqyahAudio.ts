import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync, AudioPlayer, AudioStatus } from 'expo-audio';
import { AppState, AppStateStatus } from 'react-native';
import { getPlayableAudioUrl } from './audioCache';

export type AudioOwner = 'ruqyah' | 'quran';

type PlayStateCallback = (isPlaying: boolean) => void;
type StatusCallback = (status: AudioStatus) => void;

let player: AudioPlayer | null = null;
let currentUrl: string | null = null;
let currentOwner: AudioOwner | null = null;
let playStateCallback: PlayStateCallback | null = null;
let statusListener: { remove: () => void } | null = null;
let wasPlayingBeforeInterruption = false;

export async function ensureAudioMode() {
  try {
    await setIsAudioActiveAsync(true);
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: true,
      interruptionMode: 'duckOthers',
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

export async function playAudio(url: string, owner: AudioOwner = 'ruqyah', loop: boolean = true): Promise<void> {
  await ensureAudioMode();
  setupAppStateListener();

  if (player) {
    if (currentUrl === url && currentOwner === owner) {
      player.play();
      if (playStateCallback) playStateCallback(true);
      return;
    }
    destroyPlayer();
  }

  const playableUrl = await getPlayableAudioUrl(url);
  player = createAudioPlayer(playableUrl, { keepAudioSessionActive: true, downloadFirst: false });
  player.loop = loop;
  currentUrl = url;
  currentOwner = owner;
  player.play();
  if (playStateCallback) playStateCallback(true);
}

export async function playAudioWithStatus(
  url: string,
  owner: AudioOwner,
  onStatus: StatusCallback
): Promise<void> {
  await ensureAudioMode();
  setupAppStateListener();

  if (player) {
    destroyPlayer();
  }

  const playableUrl = await getPlayableAudioUrl(url);
  player = createAudioPlayer(playableUrl, { keepAudioSessionActive: true });
  player.loop = false;
  currentUrl = url;
  currentOwner = owner;
  statusListener = player.addListener('playbackStatusUpdate', onStatus);
  player.play();
  if (playStateCallback) playStateCallback(true);
}

export async function stopAudio(): Promise<void> {
  destroyPlayer();
  currentUrl = null;
  currentOwner = null;
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
