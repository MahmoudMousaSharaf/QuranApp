import { Audio, AVPlaybackStatus } from 'expo-av';
import { AppState, AppStateStatus } from 'react-native';

let soundInstance: Audio.Sound | null = null;
let isInitialized = false;
let currentUrl: string | null = null;
let playStateCallback: ((isPlaying: boolean) => void) | null = null;
let wasPlayingBeforeInterruption = false;

async function ensureAudioMode() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
      interruptionModeAndroid: 1,
      interruptionModeIOS: 1,
    });
    isInitialized = true;
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
    if (wasPlayingBeforeInterruption && soundInstance) {
      try {
        const status = await soundInstance.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await soundInstance.playAsync();
        }
      } catch (e) {
        console.log('Resume after background error:', e);
      }
      wasPlayingBeforeInterruption = false;
    }
  } else if (nextAppState === 'background' || nextAppState === 'inactive') {
    if (soundInstance) {
      try {
        const status = await soundInstance.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          wasPlayingBeforeInterruption = true;
        }
      } catch (e) {
        console.log('Background state check error:', e);
      }
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
  return soundInstance !== null;
}

export async function playAudio(url: string): Promise<void> {
  await ensureAudioMode();
  setupAppStateListener();

  if (soundInstance) {
    if (currentUrl === url) {
      await soundInstance.playAsync();
      return;
    }
    await soundInstance.stopAsync();
    await soundInstance.unloadAsync();
    soundInstance = null;
  }

  const { sound } = await Audio.Sound.createAsync(
    { uri: url },
    { shouldPlay: true, isLooping: true },
    (status: AVPlaybackStatus) => {
      if (!status.isLoaded && status.error) {
        console.log('Playback error:', status.error);
        soundInstance = null;
        currentUrl = null;
        if (playStateCallback) playStateCallback(false);
      }
    }
  );

  soundInstance = sound;
  currentUrl = url;
  if (playStateCallback) playStateCallback(true);
}

export async function stopAudio(): Promise<void> {
  if (soundInstance) {
    try {
      await soundInstance.stopAsync();
      await soundInstance.unloadAsync();
    } catch (e) {
      console.log('Stop error:', e);
    }
    soundInstance = null;
    currentUrl = null;
  }
  wasPlayingBeforeInterruption = false;
  if (appStateSubscription) {
    appStateSubscription.remove();
    appStateSubscription = null;
  }
  if (playStateCallback) playStateCallback(false);
}

export async function pauseAudio(): Promise<void> {
  if (soundInstance) {
    try {
      await soundInstance.pauseAsync();
    } catch (e) {
      console.log('Pause error:', e);
    }
  }
}
