# Subh App — Task Tracker

## STRICT RULES
1. NEVER use C drive. ONLY use E drive.
2. Test all code — no guessing, assuming, or faking.
3. Be honest — don't claim something works if it hasn't been tested.
4. Keep improving until it's the best of the best (100%).

## Tasks

### Task 1: Fix ending message — "Don't uninstall" not "Don't install"
- **Status**: ✅ COMPLETED
- **File**: `src/data/scientific_miracles.json`
- **Changes**:
  - EN: Change "Don't install this app — yet" → "Don't uninstall this app — yet"
  - AR: Change "لا تقم بتثبيت هذا التطبيق — بعد" → "لا تقم بإلغاء تثبيت هذا التطبيق — بعد"
- **Verify**: JSON still valid after edit

### Task 2: Rename app from "Al-Qur'an" to "Subh App" everywhere
- **Status**: ✅ COMPLETED
- **Files**:
  - `src/i18n/translations.ts` — appTitle for all 15 languages
  - `src/screens/AboutUsScreen.tsx` — hardcoded "Al-Qur'an" on line 46
  - `app.json` — scheme "alquran" → "subh", bundleIdentifier "com.alquran.app" → "com.subh.app", package "com.alquran.app" → "com.subh.app"
  - `TRANSLATION_DOCUMENTATION.md` — title references
- **Verify**: No remaining "Al-Qur'an" or "alquran" references in source

### Task 3: Add AdMob banner to Support Us screen
- **Status**: ✅ COMPLETED
- **File**: `src/screens/SupportUsScreen.tsx`
- **AdMob IDs**:
  - App ID: `ca-app-pub-7095033876130680~2642429023`
  - Banner Ad Unit ID: `ca-app-pub-7095033876130680/7610704737`
- **Changes**:
  - Install `react-native-google-mobile-ads` package
  - Configure app.json plugin
  - Replace placeholder with real AdMob BannerAd component
  - Add fallback for Expo Go (placeholder shows in Expo Go, real ads in standalone)
- **Verify**: TypeScript compiles, no crashes

### Task 4: Reorder home screen — move Q&A and Support Us up
- **Status**: ✅ COMPLETED
- **File**: `src/screens/HomeScreen.tsx`
- **New order**:
  1. Quran
  2. Quran Audio
  3. Scientific Miracles
  4. Q&A (moved up from #11)
  5. Support Us (moved up from #13)
  6. Prayer Times
  7. Qibla
  8. Islamic Months
  9. Hadith
  10. Azkar
  11. Tasbih
  12. Prophet Sunnah
  13. Bookmarks
  14. About Us
- **Verify**: Visual check of order

### Task 5: Double-check all screen content translations work when language changes
- **Status**: ✅ COMPLETED — All 11 screens verified correct
- **Screens to verify**:
  - ScientificMiraclesScreen — 5 fields × 50 miracles + ending message
  - HadithScreen — book names + hadith texts (two-phase)
  - AzkarScreen — category names + item text/source (two-phase)
  - SunnahScreen — category names + item text/source (two-phase)
  - QAScreen — question/answer/reference (all upfront)
  - PrayerTimesScreen — static localized prayer names + Hijri months
  - IslamicMonthsScreen — static localized Hijri month names
  - QiblaScreen — isArabicUI ternary for all UI strings
  - SupportUsScreen — isArabicUI ternary for all UI strings
  - AboutUsScreen — isArabicUI ternary for all UI strings
  - SurahReaderScreen — Quran translations from CDN
- **Verify**: Code review of translation ternary patterns

### Task 6: Modernize home screen UI with bubble/modern art style
- **Status**: ✅ COMPLETED
- **File**: `src/screens/HomeScreen.tsx`
- **Changes**:
  - Gradient header with bubble effect
  - Modern card design with shadows, rounded corners
  - Bubble-like circular icons
  - Enhanced visual hierarchy
- **Verify**: Visual check, TypeScript compiles

### Task 7: Test everything — TypeScript compilation
- **Status**: ✅ COMPLETED — `npx tsc --noEmit` passes with 0 errors

### Task 8: UTF-8 Encoding Fixes (translations, quiz files, content)
- **Status**: ✅ COMPLETED
- **Files**:
  - `src/i18n/translations.ts` — Rebuilt from 16 JSON files, all 16 languages clean
  - `src/data/contentTranslations.ts` — Fixed PRAYER_NAMES, HIJRI_MONTHS, HIJRI_SUFFIX
  - `src/data/quiz/` — Rebuilt 6 corrupted quiz JSON files (de, es, fr, pt, tr, zh)
  - `src/data/quiz/index.ts` — Static imports replace dynamic import()
- **Verify**: No U+FFFD characters in any file

### Task 9: App Icon & Splash Screen Generation
- **Status**: ✅ COMPLETED
- **Files**: `assets/icon.png`, `assets/adaptive-icon.png`, `assets/splash.png`, `assets/favicon.png`
- Generated from `icon of app/6025910030953025040.jpg` using sharp library
- **Verify**: Images exist with correct dimensions

### Task 10: Scientific Miracles — Arabic Uthmani Script Correction
- **Status**: ✅ COMPLETED
- **File**: `src/data/scientific_miracles.json`
- **Changes**:
  - Fixed id=3 (23:12-14) to match standard Uthmani Quran script
  - Audited and corrected all 50 verses for Uthmani script accuracy
  - Updated English translation of id=3 to Sahih International
  - Key fixes: shadda additions, sukoon removals, hamza corrections across 25+ verses
- **Verify**: JSON validated, 50 miracles intact

### Task 11: User Name Greeting on Home Screen
- **Status**: ✅ COMPLETED
- **Files**: `src/screens/HomeScreen.tsx`, `src/i18n/translations.ts`
- **Changes**:
  - Load user name from AsyncStorage (`@user_name`) on HomeScreen mount
  - Display "Hello, {name}" and "May Allah bless you" below app subtitle
  - Added `greetingHello` and `greetingBlessing` translation keys in all 16 languages
- **Verify**: Greeting appears when user has set name in Progress Tracking

### Task 12: Dream Interpretation Tab
- **Status**: ✅ COMPLETED
- **Files**: `src/screens/DreamInterpretationScreen.tsx` (new), `src/screens/HomeScreen.tsx`, `App.tsx`, `src/i18n/translations.ts`
- **Changes**:
  - New DreamInterpretationScreen with modern purple-themed UI
  - Telegram deep link: `tg://resolve?domain=Tafsirkom` (opens Telegram app directly)
  - Fallback: `https://t.me/Tafsirkom` (web URL if app not installed)
  - Tab positioned below Azkar in home screen grid
  - 7 new translation keys in all 16 languages
  - Hadith quote from Sahih Bukhari about dream interpretation
- **Verify**: Tab appears below Azkar, Telegram link opens correctly

### Task 13: Fix Apostrophe SyntaxError in translations.ts
- **Status**: ✅ COMPLETED
- **File**: `src/i18n/translations.ts`
- **Issue**: Unescaped apostrophes in single-quoted strings (French, Turkish, Indonesian)
- **Fixed**: 6 lines escaped with backslash (`Qu\'Allah`, `l\'interprétation`, `Kur\'an`, `Sünnet\'e`, `Telegram\'da`, `Telegram\'ı`, `Al-Qur\'an`)
- **Verify**: Babel TypeScript parser confirms file parses OK

### Task 14: OTA Update System with Code Signing
- **Status**: ✅ COMPLETED
- **Files**: `app.json`, `eas.json`, `.github/workflows/ota-update.yml`, `scripts/generate-keys.js`, `keys/update-public-key.pem`, `UPDATE_SECURITY.md`, `.gitignore`, `package.json`
- **Changes**:
  - Configured `expo-updates` in app.json with code signing
  - Added update channels (production, preview) in eas.json
  - GitHub Action auto-deploys OTA update on push to main branch
  - Key generation script for signing key pair
  - Full documentation in UPDATE_SECURITY.md
  - Security: Private key in GitHub Secrets, public key in app build
- **Verify**: Read UPDATE_SECURITY.md for setup instructions

### Task 15: App Icon Not Showing in Expo Go
- **Status**: ✅ EXPECTED BEHAVIOR (no fix needed)
- Expo Go always shows its own icon, not the app's custom icon
- Custom icon displays only in standalone builds (EAS Build / app store)
- This is by design and cannot be changed

### Task 16: Ruqyah Sharia Tab (الرقية الشرعية)
- **Status**: ✅ COMPLETED
- **Files**: `src/screens/RuqyahShariaScreen.tsx` (new), `src/data/ruqyah_sharia.json` (new), `src/screens/HomeScreen.tsx`, `App.tsx`, `src/i18n/translations.ts`
- **Changes**:
  - 22 Quran verses for Ruqyah with Arabic text + English translation + references
  - 3 supplications from authentic Hadith (Ibn Majah, Bukhari, Muslim)
  - 3 sheikh audio sources (Mishary Alafasy, Sudais, Shuraim) with free MP3 URLs
  - Background audio playback — continues even if app is closed, loops until Stop
  - Uses expo-av with staysActiveInBackground: true
  - Modern teal-themed UI with gradient header, sheikh selector, tab switcher
  - Tab positioned below Dream Interpretation in home screen grid
  - 10 new translation keys in all 16 languages
- **Verify**: Expo server running, QR code displayed

### Task 17: GitHub Repository & OTA Secrets Setup
- **Status**: ✅ COMPLETED
- **Repo**: https://github.com/MahmoudMousaSharaf/QuranApp
- **Changes**:
  - Git initialized, remote origin set to GitHub repo
  - `UPDATE_CODE_SIGNING_PRIVATE_KEY` secret set via GitHub API (libsodium encryption)
  - Key generated: `npm run gen-keys` (stored in .keys/update-key.txt, gitignored)
  - Still needed: `EXPO_TOKEN` secret (user must create Expo access token)
- **Verify**: Secret verified via GitHub API GET request (status 200)
