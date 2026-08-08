# Build & Deploy Progress

## Current Status

### Completed
- [x] Quran audio translation to all languages (proper Quran API + Google Translate fallback)
- [x] Quran audio font sizes: selected language big, Arabic small
- [x] Quran audio keeps playing on back navigation (isMountedRef guard)
- [x] Correct expo-audio setAudioModeAsync options (playsInSilentMode, shouldPlayInBackground, interruptionMode)
- [x] Audio session configured at app startup (not tied to screen lifecycle)
- [x] Surah names & details translated to all languages in Quran audio screen
- [x] ASO: keyword-rich app name, iOS CFBundleKeywords, ITSAppUsesNonExemptEncryption
- [x] AdMob plugin added to app.json with real ad unit IDs
- [x] GitHub Actions workflow created for cloud builds
- [x] Quran audio switched to full surah playback (Islamic Network CDN) — matches Ruqyah approach for background playback
- [x] AdMob banner fixed: test ad IDs for internal builds, fallback on load failure
- [x] Switched to bare workflow for Android (committed android/ folder) to fix EAS build
- [x] iOS build succeeded (interactive mode with Apple credentials)
- [x] **v1.1.0 — Audio caching service** (`src/services/audioCache.ts`): on-demand download & cache using expo-file-system
- [x] **v1.1.0 — Fast Quran audio loading**: audio files downloaded to local storage before playback (instant replay on second play)
- [x] **v1.1.0 — iOS audio fix**: local file playback avoids iOS streaming issues with expo-audio
- [x] **v1.1.0 — Offline audio support**: Quran and Ruqyah audio cached for offline playback after first listen
- [x] **v1.1.0 — Daily Islamic Task Tracker** (`src/screens/DailyTasksScreen.tsx`): 17 authentic daily Sunnah tasks with checklist
- [x] **v1.1.0 — 4-hour reminder notifications** for daily tasks, translated in all 16 supported languages
- [x] **v1.1.0 — Daily tasks translations** (`src/i18n/dailyTasks.ts`): all 16 languages (en, ar, zh, hi, ru, ko, ja, de, fr, es, tr, ur, id, bn, pt, ms)
- [x] **v1.2.0 — Background audio pre-download**: All selected audio downloaded on app startup (not on-demand)
- [x] **v1.2.0 — User download settings** (`src/screens/AudioDownloadSettingsScreen.tsx`): WiFi-only toggle, per-reciter selection, Ruqyah toggle, auto-download toggle
- [x] **v1.2.0 — Network detection** (`src/services/audioDownloadSettings.ts`): NetInfo integration for WiFi vs cellular detection
- [x] **v1.2.0 — Data usage warnings**: Cellular download confirmation dialog prevents surprise data charges
- [x] **v1.2.0 — Download progress tracking**: Live progress bar on HomeScreen + settings screen, persisted in AsyncStorage
- [x] **v1.2.0 — Priority download queue**: User-tapped audio jumps the download queue for instant playback
- [x] **v1.2.0 — Download resume**: Skips already-downloaded files on app restart
- [x] **v1.2.0 — Concurrency control**: 3 parallel downloads max to avoid Android OOM
- [x] **v1.2.0 — Cache management**: Clear all downloaded audio button with confirmation dialog

### In Progress
- [ ] Test on real devices: audio pre-download, streaming, background playback, AdMob banners, OTA updates

### Build History
- Build #1 (22b75342): FAILED — Gradle error (before AdMob plugin)
- Build #2 (eabfb53a): FAILED — Gradle error (AdMob 14.11.0 Kotlin incompatibility)
- Build #3 (39db7844): FAILED — Gradle error (known SDK 54 EAS "No matching variant" bug)
- Build #4 (5c1f38d7): FAILED — Same Gradle error (expo-build-properties didn't help)
- Build #5 (396d3203): FAILED — Bare workflow didn't fix it either
- Build #6 (a0ae937e): FAILED — Same error even WITHOUT AdMob (confirmed EAS cloud infrastructure bug)
- GitHub Actions #1-#5: FAILED — Various Gradle errors (AGP pinning, autolinking cache, debug build attempts)
- GitHub Actions #6 (31252672597): **SUCCESS** — Android APK built successfully (56.5 MB)
- iOS Build #1 (f1eb102a): SUCCESS — IPA available at EAS dashboard (old deps)
- iOS Build #2 (52dc0d88): **SUCCESS** — IPA with updated deps (reanimated 4.1.7, ads v16.0.0) — QR code available
- iOS Build #3 (5b01adcd): **SUCCESS** — v1.2.0 IPA with audio pre-download + user controls
- GitHub Actions #18 (31263436487): **SUCCESS** — v1.2.0 Android APK (56 MB)

### Root Cause Analysis (Final)
- **Actual root cause**: Two separate issues caused Android build failures:
  1. `react-native-google-mobile-ads` v14.7.2 used `currentActivity` property which was **removed in React Native 0.81** (Expo SDK 54). Fix: upgraded to v16.0.0.
  2. `react-native-reanimated` v3.18.2 had C++ `ShadowNode` type errors with RN 0.81's Fabric headers. Fix: upgraded to v4.1.7 (SDK 54 compatible).
- **Why iOS worked but Android didn't**: iOS doesn't compile C++/Kotlin native modules the same way Android does. The Kotlin `currentActivity` and C++ `ShadowNode` issues are Android-specific.
- **EAS Build cloud**: Was also failing due to the same dependency issues, not an EAS infrastructure bug as initially suspected.
- **Final fix**: Upgraded `react-native-google-mobile-ads` to v16.0.0 and `react-native-reanimated` to v4.1.7. Build now succeeds on GitHub Actions.

### iOS Build Process (Documented)
1. Run `eas build --platform ios --profile preview` (interactive mode)
2. When prompted "Do you want to log in to your Apple account?" → type Y
3. Enter Apple ID: shegoz.customercare@gmail.com
4. Enter app-specific password (or Apple ID password)
5. EAS auto-creates signing credentials (certificate + provisioning profile)
6. Build runs on EAS macOS cloud builders
7. Download IPA from EAS dashboard or install via TestFlight/internal distribution
- **Note**: iOS build succeeded because it uses Xcode, not Gradle. The "No matching variant" error is Gradle-specific (Android only).

### Pending
- [x] Successful Android APK build on GitHub Actions (run #31252672597)
- [x] Successful iOS IPA rebuild with updated deps (EAS build 52dc0d88)
- [x] **Rebuild Android + iOS with audio pre-download + user controls (v1.2.0)**
- [ ] Test background audio on real devices (Android + iOS)
- [ ] Test audio pre-download (WiFi-only, reciter selection, progress)
- [ ] Test priority download (instant play on user tap)
- [ ] Test daily task tracker + 4-hour reminder notifications
- [ ] Create new app in App Store Connect named "The Truth - Al Haq"
- [ ] Verify OTA updates work
- [ ] Verify ads show in production build

## Build Configuration

### EAS Build Profiles (eas.json)
- **preview**: internal distribution, Android APK, iOS IPA
- **production**: Android APK

### Workflow
- **Android**: GitHub Actions Linux runner — `expo prebuild` + `./gradlew assembleRelease` (bypasses EAS Build cloud bug)
- **iOS**: EAS Build cloud (macOS) — works fine, no Gradle involved

### GitHub Actions
- Workflow: `.github/workflows/android-build.yml`
- Triggers on: push to main (src/app.json/package changes), manual dispatch
- No EXPO_TOKEN needed — builds directly with Gradle on Linux
- APK uploaded as GitHub Actions artifact (30-day retention)

### AdMob Configuration
- App ID: `ca-app-pub-7095033876130680~2642429023`
- Banner Ad Unit ID (production): `ca-app-pub-7095033876130680/7610704737`
- Test Banner Android: `ca-app-pub-3940256099942544/6300978111`
- Test Banner iOS: `ca-app-pub-3940256099942544/2934735716`
- Plugin: `react-native-google-mobile-ads` v16.0.0 (upgraded from v14.7.2 to fix RN 0.81 `currentActivity` removal)
- Internal builds use test ad IDs; production builds use real ad IDs

### Quran Audio Configuration
- Source: Islamic Network CDN (`https://cdn.islamic.network/quran/audio-surah/128/{reciter}/{surah}.mp3`)
- Playback: Full surah (single URL, `loop=false`) — same as Ruqyah
- Background: Works because no JS callbacks needed (native audio session handles background)
- Reciters: Alafasy, Abdul Basit, Hussary, Minshawi, Basfar, Rifai, Shuraim
- **Caching**: Audio files downloaded to `documentDirectory/audio-cache/` on first play, subsequent plays are instant
- **Offline**: Once cached, audio plays without internet connection on both Android and iOS
- **iOS fix**: Local file URI playback avoids expo-audio streaming issues on iOS

### Ruqyah Audio Configuration
- Sources: 3 sheikhs (Mishary Alafasy, Abdul Rahman Al-Sudais, Maher Al-Muaiqly)
- URLs from `ruqyah_sharia.json` `audio_sources` array
- **Caching**: Same audio cache service as Quran audio — offline playback after first listen

### Daily Islamic Task Tracker
- **Screen**: `src/screens/DailyTasksScreen.tsx`
- **Tasks**: 17 authentic daily Sunnah tasks based on Quran and Sunnah:
  1. Fajr Prayer (obligatory)
  2. Sunnah of Fajr (2 Rak'ahs)
  3. Morning Azkar
  4. Duha Prayer
  5. Read Quran
  6. Dhuhr Prayer (obligatory)
  7. Sunnah after Dhuhr (2 Rak'ahs)
  8. Asr Prayer (obligatory)
  9. Evening Azkar
  10. Maghrib Prayer (obligatory)
  11. Sunnah after Maghrib (2 Rak'ahs)
  12. Isha Prayer (obligatory)
  13. Witr Prayer
  14. Sleep Azkar
  15. Tasbih (SubhanAllah, Alhamdulillah, Allahu Akbar x33)
  16. Send blessings on Prophet ﷺ
  17. Istighfar (100 times)
- **Progress tracking**: Daily progress bar, tasks reset at midnight
- **Notifications**: 4-hour reminders at 10:00, 14:00, 18:00, 22:00 (translated in all 16 languages)
- **Translations**: `src/i18n/dailyTasks.ts` — all 16 languages
- **Notification service**: `src/services/dailyTaskNotifications.ts`
- **Storage**: AsyncStorage (`@daily_tasks_progress`, `@daily_tasks_date`)

### Audio Pre-Download Service (v1.2.0)
- **File**: `src/services/audioCache.ts` — fully rewritten for background pre-download
- **Approach**: Background pre-download of ALL selected audio on app startup (not on-demand)
- **Concurrency**: 3 parallel downloads max to avoid Android OOM
- **Cache location**: `documentDirectory/audio-cache/` with hash-based filenames
- **Key functions**:
  - `preloadAllAudio(onProgress)` — downloads all user-selected audio with progress callback
  - `prioritizeAudioDownload(url)` — jumps the queue for instant playback on user tap
  - `getUserSelectedUrls()` — builds URL list from user settings (selected reciters + Ruqyah)
  - `isAudioCached(url)` — fast check if file exists locally
  - `getCacheSize()` — total size of cached audio files
  - `clearAudioCache()` — deletes all cached audio
  - `cancelPreload()` — stops ongoing download
- **Progress tracking**: Persisted in AsyncStorage (`@audio_preload_progress`, `@audio_preload_done`)
- **Resume support**: Skips already-downloaded files on app restart
- **Fallback**: If pre-download hasn't reached a file yet, `prioritizeAudioDownload` downloads it immediately

### Audio Download Settings Service (v1.2.0)
- **File**: `src/services/audioDownloadSettings.ts`
- **User preferences** (stored in AsyncStorage):
  - `@audio_download_wifi_only` — WiFi-only toggle (default: true)
  - `@audio_download_selected_reciters` — array of selected reciter IDs (default: all 7)
  - `@audio_download_ruqyah` — download Ruqyah audio toggle (default: true)
  - `@audio_download_auto` — auto-download on app start (default: false)
- **Network detection**: Uses `@react-native-community/netinfo` for WiFi vs cellular
- **Functions**: `getWifiOnlySetting()`, `setWifiOnlySetting()`, `getSelectedReciters()`, `setSelectedReciters()`, `getDownloadRuqyahSetting()`, `setDownloadRuqyahSetting()`, `getAutoDownloadSetting()`, `setAutoDownloadSetting()`, `isOnWifi()`, `estimateDownloadSizeMB()`
- **Constants**: `ALL_RECITERS` (7 reciters with id/name/ar), `RUQYAH_SHEIKHS` (3 sheikhs)
- **Size estimation**: ~171 MB per reciter (114 surahs), ~150 MB for all 3 Ruqyah sheikhs

### Audio Download Settings Screen (v1.2.0)
- **File**: `src/screens/AudioDownloadSettingsScreen.tsx`
- **Features**:
  - Auto-download toggle (opt-in, default OFF)
  - WiFi-only toggle (default ON — protects user data)
  - Per-reciter checkbox list (7 reciters with Arabic/English names)
  - Ruqyah audio toggle (3 sheikhs)
  - Estimated download size display
  - Start/Stop download button with live progress bar
  - Cellular data warning dialog if not on WiFi
  - Download complete confirmation
  - Clear all cached audio button with confirmation
  - Cache size display

### GitHub Actions
- See Workflow section above

## How to Get EXPO_TOKEN
1. Go to https://expo.dev/accounts/majmod/settings/access-tokens
2. Create new token
3. Go to GitHub repo Settings > Secrets and variables > Actions
4. Add secret named `EXPO_TOKEN` with the token value

## iOS Build Requirements
- Paid Apple Developer account ($99/year)
- Apple Team ID
- EAS will handle credential creation automatically in interactive mode
- Run: `eas build --platform ios --profile preview` (interactive)

## Download Links & QR Codes

### Android APK (v1.2.0 — ready)
- **Direct download** (GitHub login required): https://github.com/MahmoudMousaSharaf/QuranApp/actions/runs/31263436487/artifacts/9023758295
- **Actions page**: https://github.com/MahmoudMousaSharaf/QuranApp/actions/runs/31263436487
  - Click the link, sign in to GitHub, download the `quran-app-apk` artifact (zip, ~54 MB)
  - Unzip and install `app-release.apk` on your Android device (enable "Install from unknown sources")
- **Previous build (v1.0.0)**: https://github.com/MahmoudMousaSharaf/QuranApp/actions/runs/31252672597/artifacts/9020718978

### iOS IPA (v1.2.0 — ready)
- **EAS Build Page (with QR code)**: https://expo.dev/accounts/majmod/projects/the-truth-al-haq/builds/5b01adcd-4489-473c-9176-35521745c601
  - Open this link on your iPhone to see the QR code
  - Or scan the QR code from the EAS dashboard on any device
  - Install via Expo's internal distribution (registered device: iPhone 11 Pro Max)
- **Previous build (v1.1.0)**: https://expo.dev/accounts/majmod/projects/the-truth-al-haq/builds/21ecd94f-b735-451e-8aa3-4942a5e2ce68

### EAS Dashboard
- https://expo.dev/accounts/majmod/projects/the-truth-al-haq/builds
