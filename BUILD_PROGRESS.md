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

### In Progress
- [ ] Android APK build via GitHub Actions (local Gradle build on Linux runner)
- [ ] iOS IPA rebuild with latest fixes (Quran audio + AdMob) — previous build succeeded

### Build History
- Build #1 (22b75342): FAILED — Gradle error (before AdMob plugin)
- Build #2 (eabfb53a): FAILED — Gradle error (AdMob 14.11.0 Kotlin incompatibility)
- Build #3 (39db7844): FAILED — Gradle error (known SDK 54 EAS "No matching variant" bug)
- Build #4 (5c1f38d7): FAILED — Same Gradle error (expo-build-properties didn't help)
- Build #5 (396d3203): FAILED — Bare workflow didn't fix it either
- Build #6 (a0ae937e): FAILED — Same error even WITHOUT AdMob (confirmed EAS cloud infrastructure bug)
- iOS Build (f1eb102a): SUCCESS — IPA available at EAS dashboard

### Root Cause Analysis
- **Why iOS worked but Android didn't**: iOS uses Xcode (xcodebuild), Android uses Gradle. The "No matching variant" error is a Gradle-specific issue in EAS Build cloud infrastructure (GitHub issues #42370, #47354, #42730).
- **EAS Build cloud bug**: EAS Build cloud environment has an AGP version mismatch that causes all React Native native module subprojects to produce zero variants. This is a server-side issue, not a project code issue.
- **Fix**: Build Android APK directly on GitHub Actions Linux runner using `expo prebuild` + `./gradlew assembleRelease`, bypassing EAS Build cloud entirely.

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
- [ ] Get EXPO_TOKEN secret set in GitHub repo
- [ ] Successful Android APK build + download link
- [ ] Successful iOS IPA rebuild + download link
- [ ] Test background audio on real devices
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
- Plugin: `react-native-google-mobile-ads` ~14.7.2
- Internal builds use test ad IDs; production builds use real ad IDs

### Quran Audio Configuration
- Source: Islamic Network CDN (`https://cdn.islamic.network/quran/audio-surah/{reciter}/{surah}.mp3`)
- Playback: Full surah (single URL, `loop=false`) — same as Ruqyah
- Background: Works because no JS callbacks needed (native audio session handles background)
- Reciters: Alafasy, Abdul Basit, Hussary, Minshawi, Basfar, Rifai, Shuraim

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

## Build Links
- EAS Dashboard: https://expo.dev/accounts/majmod/projects/the-truth-al-haq/builds
- Android Build #5: https://expo.dev/accounts/majmod/projects/the-truth-al-haq/builds/396d3203-b659-493e-8b8d-2686050b04ae
