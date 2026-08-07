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

### In Progress
- [ ] Android APK build #3 (build ID: 39db7844-1f73-4c99-adcc-d9577bf52bfb) — with AdMob 14.7.2 fix
- [ ] iOS IPA build (needs Apple Developer account credentials — user has account)

### Build History
- Build #1 (22b75342): FAILED — Gradle error (before AdMob plugin)
- Build #2 (eabfb53a): FAILED — Gradle error (AdMob 14.11.0 Kotlin incompatibility with SDK 54)
- Build #3 (39db7844): IN PROGRESS — fixed by downgrading to react-native-google-mobile-ads 14.7.2

### Pending
- [ ] Get EXPO_TOKEN secret set in GitHub repo
- [ ] Successful Android APK build + download link
- [ ] Successful iOS IPA build + download link
- [ ] Test background audio on real devices

## Build Configuration

### EAS Build Profiles (eas.json)
- **preview**: internal distribution, Android APK, iOS IPA
- **production**: Android APK

### AdMob Configuration
- App ID: `ca-app-pub-7095033876130680~2642429023`
- Banner Ad Unit ID: `ca-app-pub-7095033876130680/7610704737`
- Plugin: `react-native-google-mobile-ads` added to app.json plugins

### GitHub Actions
- Workflow: `.github/workflows/eas-build.yml`
- Triggers on: push to main, manual dispatch
- Needs: `EXPO_TOKEN` secret in GitHub repo settings

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
- Previous failed Android build: 22b75342-ff74-4a70-b880-26dabfe547a9
