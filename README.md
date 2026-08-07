# Al-Qur'an — Cross-Platform Quran App (Android & iOS)

A complete Quran reading application built with **Expo / React Native** — works on both Android and iPhone, including older devices.

## Features

- **All 114 Surahs** — Complete Quran with verified Arabic (Uthmani script) and English (Sahih International) translation
- **Language Switch** — Toggle between Arabic only, English only, or both (AR → EN → AR+EN)
- **Surah List** — Browse all 114 surahs with search by name or number
- **Surah Reader** — Beautiful ayah-by-ayah display with surah banners
- **Bookmarks** — Save and manage bookmarked ayahs (persisted via AsyncStorage)
- **Share** — Share any ayah with Arabic + English text
- **Dark / Light Theme** — Auto-saved preference
- **Remembers Last Surah** — Opens where you left off
- **Sajda Indicators** — Shows prostration ayahs

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
    │   └── storage.ts               # AsyncStorage (bookmarks, theme, etc.)
    ├── context/
    │   └── ThemeContext.tsx         # Dark/light theme provider
    └── screens/
        ├── SurahListScreen.tsx      # All 114 surahs list + search
        ├── SurahReaderScreen.tsx    # Ayah display with AR/EN toggle
        └── BookmarksScreen.tsx      # Saved ayahs
```

## Tech Stack

- **React Native** 0.72 (Expo SDK 49)
- **TypeScript**
- **React Navigation** (native-stack)
- **AsyncStorage** for local persistence
- **AlQuran Cloud API** for Quran data
