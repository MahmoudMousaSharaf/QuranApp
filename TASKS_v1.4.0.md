# v1.4.0 Task Tracker — Audio Speed Fix + Media Notification Controls

## Brainstorm

### Problem 1: Slow Quran Audio Loading
- Current: `playAudio` in `ruqyahAudio.ts` calls `isAudioCached()` → `getPlayableAudioUrl()` which may download the full file before playing
- Even in "stream" mode, `createAudioPlayer` with `downloadFirst: false` should stream, but the `isAudioCached` check + `getPlayableAudioUrl` adds latency
- Fix: In stream mode, skip cache check entirely and pass remote URL directly to `createAudioPlayer` — let expo-audio handle streaming/buffering natively
- Also: use `preferredForwardBufferDuration` to minimize initial buffer wait

### Problem 2: No Media Notification Controls (pause/resume from lock screen)
- expo-audio has built-in `setActiveForLockScreen(active, metadata, options)` API
- Requires `enableBackgroundPlayback: true` in app.json expo-audio plugin config
- Requires `interruptionMode: 'doNotMix'` in `setAudioModeAsync`
- Must call `player.setActiveForLockScreen(true, { title, artist, albumTitle, artworkUrl })` when playback starts
- Must call `player.setActiveForLockScreen(false)` when playback stops
- Works on both Android (media notification) and iOS (Control Center + lock screen)

### Research Sources
- https://docs.expo.dev/versions/latest/sdk/audio — expo-audio docs
- `setActiveForLockScreen(active, metadata, options)` — enables lock screen controls
- `AudioMetadata` type: `{ title, artist, albumTitle, artworkUrl }`
- `AudioLockScreenOptions`: `{ isLiveStream?, seekBackward?, seekForward? }`
- `enableBackgroundPlayback: true` in plugin config — adds foreground service + permissions
- `interruptionMode: 'doNotMix'` required for lock screen controls to work correctly

## Spec

### Feature 1: Fast Audio Loading (Stream Mode)
- When stream mode is 'stream' and audio is NOT cached: pass remote URL directly to `createAudioPlayer` with `downloadFirst: false`
- Remove the `isAudioCached` check overhead in stream mode — go straight to streaming
- Set `preferredForwardBufferDuration: 1` to minimize initial buffer (iOS)
- This means audio starts playing in 1-3 seconds instead of waiting for full download

### Feature 2: Media Notification Controls
- When any audio (Quran or Ruqyah) starts playing:
  - Call `player.setActiveForLockScreen(true, { title, artist, albumTitle })`
  - Title: Surah name or Ruqyah track name
  - Artist: Reciter name or Sheikh name
  - Album: "The Truth - Al Haq"
- When audio stops:
  - Call `player.setActiveForLockScreen(false)`
- User can pause/resume from notification center / lock screen on both platforms
- Requires updating `app.json` expo-audio plugin to include `enableBackgroundPlayback: true`
- Requires changing `interruptionMode` from `'duckOthers'` to `'doNotMix'`

### Files to Modify
1. `app.json` — Add `enableBackgroundPlayback: true` to expo-audio plugin
2. `src/services/ruqyahAudio.ts` — Add lock screen controls + fast streaming
3. `src/screens/QuranAudioScreen.tsx` — Pass metadata (surah name, reciter) to playAudio
4. `src/screens/RuqyahShariaScreen.tsx` — Pass metadata (track name, sheikh) to playAudio

## Plan

- [x] Brainstorm + research
- [x] Spec written
- [ ] Implement: Update app.json expo-audio plugin config
- [ ] Implement: Update ruqyahAudio.ts — fast streaming + lock screen controls
- [ ] Implement: Update QuranAudioScreen — pass metadata
- [ ] Implement: Update RuqyahShariaScreen — pass metadata
- [ ] Verify: Re-read all modified files
- [ ] Cross-check: Ensure no regressions
- [ ] Security audit: Check token/key exposure
- [ ] Ship: Commit, push, trigger builds, update MD files

## Verify

### Files Re-read and Confirmed:
1. **app.json** (line 97-102): `expo-audio` plugin has `enableBackgroundPlayback: true` ✅
2. **ruqyahAudio.ts** (line 55): `interruptionMode: 'doNotMix'` ✅
3. **ruqyahAudio.ts** (line 26-47): `enableLockScreen()` and `disableLockScreen()` helper functions ✅
4. **ruqyahAudio.ts** (line 127): `playAudio` accepts `metadata?: AudioMetadata` param ✅
5. **ruqyahAudio.ts** (line 141-147): Stream mode check first, skip cache check if streaming ✅
6. **ruqyahAudio.ts** (line 158): `enableLockScreen(metadata)` called on play ✅
7. **ruqyahAudio.ts** (line 100): `disableLockScreen()` called in `destroyPlayer` ✅
8. **QuranAudioScreen.tsx** (line 29): `AudioMetadata` imported ✅
9. **QuranAudioScreen.tsx** (line 160-164): Metadata with surah name + reciter passed to `playAudio` ✅
10. **RuqyahShariaScreen.tsx** (line 19): `AudioMetadata` imported ✅
11. **RuqyahShariaScreen.tsx** (line 121-125): Metadata with track name + sheikh passed to `playAudio` ✅
12. **prayerAlarm.ts** (line 141): `interruptionMode: 'doNotMix'` for consistency ✅

## Cross-check

- No regressions: `playAudio` signature is backward-compatible (metadata is optional) ✅
- `playAudioWithStatus` also updated with metadata param ✅
- `stopAudio` clears `currentMetadata` ✅
- `getCurrentMetadata()` export added for potential future use ✅
- Lock screen controls enabled on play, disabled on stop/destroy ✅
- Stream mode optimization: check `getStreamMode()` before `isAudioCached()` to skip cache overhead ✅
- Both Quran and Ruqyah screens pass metadata ✅
- Adhan (prayerAlarm) uses `doNotMix` for consistency ✅

## Security audit

- No API keys or tokens in code ✅
- GitHub token shared in chat was NOT committed to any file ✅
- No hardcoded credentials ✅
- CDN URLs (cdn.islamic.network) are public/free, no auth needed ✅
- AdMob app IDs are public identifiers, not secrets ✅
- No user data exposed ✅
