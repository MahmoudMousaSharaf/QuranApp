import { Audio, AVPlaybackStatus } from 'expo-av';

let soundInstance: Audio.Sound | null = null;
let isInitialized = false;
let currentUrl: string | null = null;
let playStateCallback: ((isPlaying: boolean) => void) | null = null;

async function ensureAudioMode() {
  if (isInitialized) return;
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
      shouldDuckAndroid: true,
      playThroughEarpieceAndroid: false,
    });
    isInitialized = true;
  } catch (e) {
    console.log('Audio mode setup error:', e);
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
