# The Truth - Al Haq — Cross-Platform Islamic App (Android & iOS)

A complete Islamic application built with **Expo / React Native** — works on both Android and iPhone, including older devices. Features Quran reading, audio recitations, Ruqyah Sharia, daily task tracker, prayer times, Qibla, Azkar, Hadith, and more.

## Features

- **All 114 Surahs** — Complete Quran with verified Arabic (Uthmani script) and English (Sahih International) translation
- **16 Languages** — English, Arabic, Chinese, Hindi, Russian, Korean, Japanese, German, French, Spanish, Turkish, Urdu, Indonesian, Bengali, Portuguese, Malay
- **Quran Audio** — 7 reciters with full surah playback from Islamic Network CDN
- **Audio Pre-Download** — Background download of all selected audio for instant offline playback (WiFi-only option, per-reciter selection, data usage warnings)
- **Ruqyah Sharia** — Spiritual healing with Quran verses and supplications from 3 sheikhs
- **Daily Islamic Tasks** — 17 authentic daily Sunnah tasks with checklist and 4-hour reminder notifications
- **Prayer Times** — Accurate prayer times for every country with Adhan alarms
- **Qibla** — Live compass that works offline
- **Azkar** — Morning, evening, sleep, and after-prayer supplications with reminders
- **Hadith** — Nawawi, Qudsi, and Sahih collections (works offline)
- **Tasbih** — Digital counter with statistics
- **Dhikr Circles** — Personal dhikr tracker
- **100 Quiz Questions** — Test your Islamic knowledge
- **Progress Tracking** — Track your level, backup/restore data
- **Dream Interpretation** — Contact certified scholars via Telegram
- **AdMob Ads** — Banner ads in Support Us section
- **Dark / Light Theme** — Auto-saved preference
- **Bookmarks** — Save and manage bookmarked ayahs

## Data Source

- **API**: [AlQuran Cloud](https://alquran.cloud/api) — free, verified, open-source
- **Arabic**: `quran-uthmani` edition (Uthmani script)
- **English**: `en.sahih` edition (Saheeh International translation)

## Device Compatibility

- **Android**: minSdkVersion 21 (Android 5.0 Lollipop and above — covers 99%+ of devices)
- **iOS**: iOS 13+ (supports iPhone SE, iPhone 6s and newer)
- **Tablets**: Full tablet support enabled

## Getting Started

### Prerequisites

- Node.js 16+
- Expo CLI: `npm install -g expo-cli`

### Install & Run

```bash
cd E:\quran-app
npm install
npx expo start
```

Then:
- Press `a` to open on Android emulator/device
- Press `i` to open on iOS simulator
- Scan QR code with **Expo Go** app on your phone

### Building for Production

```bash
# Android APK/AAB
eas build --platform android

# iOS
eas build --platform ios
```

## Project Structure

```
E:\quran-app/
├── App.tsx                          # Main app entry, screen routing
├── app.json                         # Expo config (Android/iOS settings)
├── package.json                     # Dependencies
├── babel.config.js                  # Babel config (Reanimated plugin)
├── metro.config.js                  # Metro bundler config
├── tsconfig.json                    # TypeScript config
└── src/
    ├── types/index.ts               # TypeScript interfaces
    ├── services/
    │   ├── api.ts                   # AlQuran Cloud API calls
    │   ├── storage.ts               # AsyncStorage (bookmarks, theme, etc.)
    │   ├── ruqyahAudio.ts           # Audio playback service (expo-audio)
    │   ├── audioCache.ts            # Background pre-download, cache, priority queue (expo-file-system)
    │   ├── audioDownloadSettings.ts # User download preferences, NetInfo network detection
    │   ├── notifications.ts         # Azkar reminder notifications
    │   ├── dailyTaskNotifications.ts # Daily task 4-hour reminder notifications
    │   ├── prayerAlarm.ts           # Prayer time Adhan alarms
    │   └── contentTranslator.ts     # Google Translate for UI content
    ├── i18n/
    │   ├── translations.ts          # Main UI translations (16 languages)
    │   └── dailyTasks.ts            # Daily tasks translations (16 languages)
    ├── context/
    │   ├── ThemeContext.tsx         # Dark/light theme provider
    │   └── LanguageContext.tsx      # Language provider
    └── screens/
        ├── HomeScreen.tsx           # Main menu with all features
        ├── SurahListScreen.tsx      # All 114 surahs list + search
        ├── SurahReaderScreen.tsx    # Ayah display with AR/EN toggle
        ├── QuranAudioScreen.tsx     # Quran audio with 7 reciters
        ├── RuqyahShariaScreen.tsx   # Ruqyah Sharia spiritual healing
        ├── DailyTasksScreen.tsx     # Daily Islamic task tracker
        ├── AudioDownloadSettingsScreen.tsx # Audio download settings (WiFi-only, reciter selection)
        ├── PrayerTimesScreen.tsx    # Prayer times with alarms
        ├── QiblaScreen.tsx          # Qibla compass
        ├── AzkarScreen.tsx          # Morning/evening Azkar
        └── ...                      # And more screens
```

## Tech Stack

- **React Native** 0.81.5 (Expo SDK 54)
- **TypeScript**
- **expo-audio** for audio playback with background support
- **expo-file-system** for audio pre-download and caching
- **@react-native-community/netinfo** for WiFi/cellular network detection
- **expo-notifications** for prayer alarms, Azkar reminders, and daily task reminders
- **react-native-google-mobile-ads** v16.0.0 for AdMob banner ads
- **react-native-reanimated** v4.1.7
- **AsyncStorage** for local persistence
- **AlQuran Cloud API** + Islamic Network CDN for Quran data and audio
