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
- [ ] Android APK build (previous build failed - retrying with AdMob plugin fix)
- [ ] iOS IPA build (needs Apple Developer account credentials)

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
