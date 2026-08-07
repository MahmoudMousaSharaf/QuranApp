import { createAudioPlayer, setAudioModeAsync, setIsAudioActiveAsync } from 'expo-audio';
import { AppState, AppStateStatus } from 'react-native';

type Player = ReturnType<typeof createAudioPlayer>;

let player: Player | null = null;
let currentUrl: string | null = null;
let playStateCallback: ((isPlaying: boolean) => void) | null = null;
let wasPlayingBeforeInterruption = false;

async function ensureAudioMode() {
  try {
    await setIsAudioActiveAsync(true);
    await setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeAndroid: 1,
      interruptionModeIOS: 1,
    });
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

export function setPlayStateCallback(cb: (isPlaying: boolean) => void) {
  playStateCallback = cb;
}

export function getCurrentUrl(): string | null {
  return currentUrl;
}

export function isSoundPlaying(): boolean {
  return player !== null && player.playing;
}

export async function playAudio(url: string): Promise<void> {
  await ensureAudioMode();
  setupAppStateListener();

  if (player) {
    if (currentUrl === url) {
      player.play();
      return;
    }
    player.pause();
    player.replace(url);
    currentUrl = url;
    player.play();
    if (playStateCallback) playStateCallback(true);
    return;
  }

  player = createAudioPlayer(url, { keepAudioSessionActive: true });
  player.loop = true;
  currentUrl = url;
  player.play();
  if (playStateCallback) playStateCallback(true);
}

export async function stopAudio(): Promise<void> {
  if (player) {
    try {
      player.pause();
      player.remove();
    } catch (e) {
      console.log('Stop error:', e);
    }
    player = null;
    currentUrl = null;
  }
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
