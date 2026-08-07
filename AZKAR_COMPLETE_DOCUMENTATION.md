# AZKAR COMPLETE DOCUMENTATION — Everything You Need to Know

> **Purpose**: This document contains 100% of everything related to the Azkar feature in this Quran app. Any developer (even one with zero prior context) can read this file and fully understand the entire Azkar system — data structure, code, UI rendering, translation pipeline, ordering logic, prefix handling, performance, and all changes made.

---

## Table of Contents

1. [Project Overview](#1-project-overview)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Project File Structure](#3-project-file-structure)
4. [Azkar Data Structure (`azkar.json`)](#4-azkar-data-structure-azkarjson)
5. [AzkarScreen.tsx — Full Component Documentation](#5-azkarscreenttsx--full-component-documentation)
6. [Translation Pipeline](#6-translation-pipeline)
7. [Prefix Handling — Bismillah & Ta'awwudh](#7-prefix-handling--bismillah--taawwudh)
8. [Evening Azkar (أذكار المساء) — Complete Item List](#8-evening-azkar-أذكار-المساء--complete-item-list)
9. [Sleeping Azkar (أذكار النوم) — Complete Item List](#9-sleeping-azkar-أذكار-النوم--complete-item-list)
10. [All Other Azkar Categories](#10-all-other-azkar-categories)
11. [Counter & Favorites System](#11-counter--favorites-system)
12. [Performance Architecture](#12-performance-architecture)
13. [All Changes Made (Chronological)](#13-all-changes-made-chronological)
14. [Verification & Testing](#14-verification--testing)
15. [How to Run the App](#15-how-to-run-the-app)
16. [How to Add New Azkar (Step-by-Step Guide)](#16-how-to-add-new-azkar-step-by-step-guide)

---

## 1. Project Overview

This is a **React Native (Expo)** Islamic app called "Quran App" that includes:

- **Quran reading** with translations in 16 languages
- **Azkar (supplications)** — morning, evening, sleep, after prayer, etc.
- **Prayer times** with adhan alarms
- **Qibla compass**
- **Hadith collection**
- **Tasbih counter**
- **Dhikr circles**
- **Scientific miracles**
- **Q&A for non-Muslims**
- **Sunnah guidance**
- **Islamic months info**

The **Azkar feature** is one of the core features. It displays categorized Islamic supplications with Arabic text, translations, repetition counters, sources, favorites, and search.

---

## 2. Tech Stack & Dependencies

### Core Framework
- **React Native**: 0.72.10
- **Expo**: ~49.0.23
- **React**: 18.2.0
- **TypeScript**: ^5.1.3

### Key Libraries
| Library | Version | Purpose |
|---------|---------|---------|
| `@react-native-async-storage/async-storage` | 1.18.2 | Local persistence (counters, favorites, language, theme) |
| `@react-navigation/native` | ^6.1.9 | Navigation |
| `@react-navigation/native-stack` | ^6.9.17 | Stack navigation |
| `expo-notifications` | ~0.20.1 | Prayer alarm notifications |
| `expo-av` | ~13.4.1 | Adhan audio playback |
| `expo-clipboard` | ~4.3.1 | Copy azkar text |
| `expo-location` | ~16.1.0 | Prayer times location |
| `expo-sensors` | ~12.3.0 | Qibla compass |
| `expo-linear-gradient` | ~12.3.0 | UI gradients |
| `@expo/vector-icons` | ^13.0.0 | Icons (Ionicons) |
| `react-native-reanimated` | ~3.3.0 | Animations |
| `react-native-gesture-handler` | ~2.12.0 | Gesture handling |
| `adhan` | ^4.4.4 | Prayer time calculations |

### TypeScript Config (`tsconfig.json`)
```json
{
  "extends": "expo/tsconfig.base",
  "compilerOptions": {
    "strict": true,
    "jsx": "react-jsx",
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "baseUrl": "./",
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["**/*.ts", "**/*.tsx", "App.tsx"]
}
```

> **`resolveJsonModule: true`** is critical — it allows importing `azkar.json` directly in TypeScript.

---

## 3. Project File Structure

```
E:\quran-app\
├── App.tsx                          # Root app component, screen routing
├── app.json                         # Expo config
├── babel.config.js                  # Babel config
├── eas.json                         # EAS build config
├── index.js                         # Entry point
├── metro.config.js                  # Metro bundler config
├── package.json                     # Dependencies & scripts
├── tsconfig.json                    # TypeScript config
├── README.md                        # Project readme
├── PROGRESS.md                      # Progress tracking
├── TASK_TRACKER.md                  # Task tracking
├── TRANSLATION_DOCUMENTATION.md     # Translation docs (67KB)
├── TRANSLATION_FIX_DOCUMENTATION.md # Fix docs (84KB)
├── AZKAR_COMPLETE_DOCUMENTATION.md  # THIS FILE
├── assets/                          # Audio files (adhan.mp3, adhan_fajr.mp3)
├── scripts/                         # Build scripts
├── src/
│   ├── components/
│   │   └── LanguagePickerModal.tsx  # Language selection modal
│   ├── context/
│   │   ├── LanguageContext.tsx      # Language provider (16 languages)
│   │   └── ThemeContext.tsx         # Theme provider (light/dark)
│   ├── data/
│   │   ├── azkar.json               # ★ AZKAR DATA (102KB, 17 categories)
│   │   ├── countries.json           # Country list for prayer times
│   │   ├── hadith_offline.json      # Offline hadith data
│   │   ├── islamic_months.json      # Islamic months data
│   │   ├── qa_non_muslims.json      # Q&A data
│   │   ├── scientific_miracles.json # Scientific miracles data
│   │   ├── sunnah.json              # Sunnah guidance data
│   │   └── quran/                   # Quran data files
│   ├── hooks/
│   │   └── useUITranslation.ts      # UI string translation hook
│   ├── i18n/
│   │   └── translations.ts          # UI translations (16 languages, 75KB)
│   ├── screens/
│   │   ├── AzkarScreen.tsx          # ★ AZKAR SCREEN (26KB, 719 lines)
│   │   ├── HomeScreen.tsx           # Home dashboard
│   │   ├── SurahListScreen.tsx      # Quran surah list
│   │   ├── SurahReaderScreen.tsx    # Quran reader
│   │   ├── BookmarksScreen.tsx      # Bookmarks
│   │   ├── PrayerTimesScreen.tsx    # Prayer times
│   │   ├── QiblaScreen.tsx          # Qibla compass
│   │   ├── HadithScreen.tsx         # Hadith browser
│   │   ├── TasbihScreen.tsx         # Tasbih counter
│   │   ├── QuranAudioScreen.tsx     # Quran audio player
│   │   ├── DhikrCirclesScreen.tsx   # Dhikr circles
│   │   ├── ScientificMiraclesScreen.tsx
│   │   ├── QAScreen.tsx
│   │   ├── SunnahScreen.tsx
│   │   ├── IslamicMonthsScreen.tsx
│   │   ├── AboutUsScreen.tsx
│   │   └── SupportUsScreen.tsx
│   ├── services/
│   │   ├── contentTranslator.ts     # ★ Google Translate API for content
│   │   ├── contentTranslations.ts   # Content translation helpers
│   │   ├── prayerAlarm.ts           # Prayer alarm scheduling
│   │   ├── notifications.ts         # Notification scheduling
│   │   ├── api.ts                   # Quran API calls
│   │   ├── quranTranslations.ts     # Quran translation preloading
│   │   └── storage.ts               # AsyncStorage helpers
│   ├── types/
│   │   └── index.ts                 # TypeScript interfaces
│   └── utils/
│       ├── hijri.ts                 # Hijri date conversion
│       ├── magneticDeclination.ts   # Qibla magnetic declination
│       └── qiblaCalc.ts             # Qibla direction calculation
```

---

## 4. Azkar Data Structure (`azkar.json`)

### File Location
`E:\quran-app\src\data\azkar.json`

### Top-Level Structure
```json
{
  "categories": [
    {
      "id": 1,
      "category_ar": "أذكار الصباح",
      "category_en": "Morning Azkar",
      "items": [ ... ]
    },
    ...
  ]
}
```

### Item Structure
Each item in the `items` array has exactly these 5 fields:

| Field | Type | Description |
|-------|------|-------------|
| `text_ar` | string | Arabic text of the supplication. May start with `أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ` (Ta'awwudh) and/or `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ` (Bismillah) — these are auto-extracted by the UI for special display |
| `text_en` | string | English translation. Used as source for dynamic translation to other languages |
| `count` | number | How many times the supplication should be repeated (1, 3, 4, 7, 10, 33, 34, 100) |
| `source_en` | string | English source reference (e.g., "Sahih al-Bukhari 6320") |
| `source_ar` | string | Arabic source reference (e.g., "صحيح البخاري ٦٣٢٠") |

### All 17 Categories

| ID | category_ar | category_en | Items | Icon | Icon Color |
|----|-------------|-------------|-------|------|------------|
| 1 | أذكار الصباح | Morning Azkar | 20 | sunny-outline | #FF9500 |
| 2 | أذكار المساء | Evening Azkar | 25 | moon-outline | #5B7FFF |
| 3 | أذكار بعد الصلاة | After Prayer Azkar | 12 | checkmark-circle-outline | #34C759 |
| 4 | أذكار النوم | Sleep Azkar | 15 | bed-outline | #5856D6 |
| 5 | دعاء الاستيقاظ | Waking Up Dua | 2 | alarm-outline | #FF2D55 |
| 6 | أذكار السفر | Travel Azkar | 8 | airplane-outline | #00C7BE |
| 7 | أذكار الطعام والشراب | Food & Drink Azkar | 8 | restaurant-outline | #FF9500 |
| 8 | أدعية الكرب والقلق | Distress & Anxiety Duas | 10 | heart-outline | #FF3B30 |
| 9 | أذكار المنزل | Home Azkar | 5 | home-outline | #007AFF |
| 10 | أذكار المرض والرقية | Sickness & Ruqyah Azkar | 6 | medkit-outline | #FF2D55 |
| 11 | التسبيح والاستغفار | Tasbeeh & Istighfar | 7 | star-outline | #AF52DE |
| 12 | أذكار متنوعة | Miscellaneous Azkar | 6 | ellipsis-horizontal-circle-outline | #8E8E93 |
| 13 | أذكار الأذان | Adhan Azkar | 3 | volume-high-outline | #FF9500 |
| 14 | أذكار الوضوء | Wudu Azkar | 4 | water-outline | #00C7BE |
| 15 | أذكار المسجد | Mosque Azkar | 5 | business-outline | #34C759 |
| 16 | أذكار الخلاء | Bathroom Azkar | 3 | walk-outline | #8E8E93 |
| 17 | أذكار الصلاة | Prayer Azkar | 7 | hand-left-outline | #AF52DE |

---

## 5. AzkarScreen.tsx — Full Component Documentation

### File Location
`E:\quran-app\src\screens\AzkarScreen.tsx` (719 lines)

### Imports
```typescript
import React, { useState, useMemo, useEffect, useCallback, useRef } from 'react';
import { View, Text, TouchableOpacity, FlatList, StyleSheet, StatusBar, TextInput, Share, Vibration, Animated, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../services/contentTranslator';
import { useUITranslation } from '../hooks/useUITranslation';
import azkarData from '../data/azkar.json';
```

### Constants

```typescript
const BISMILLAH_AR = 'بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ';
const TAAWWUDH_AR = 'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ';
const COUNTERS_KEY = '@azkar_counters_v1';
const FAVORITES_KEY = '@azkar_favorites_v1';
```

- `BISMILLAH_AR`: The Arabic Bismillah text. Used to detect and extract from item text for special display.
- `TAAWWUDH_AR`: The Arabic Ta'awwudh (I seek refuge in Allah from Satan). Used the same way.
- `COUNTERS_KEY`: AsyncStorage key for persisting counter state.
- `FAVORITES_KEY`: AsyncStorage key for persisting favorites.

### Category Icons Mapping
```typescript
const CATEGORY_ICONS: Record<number, { icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  1: { icon: 'sunny-outline', bg: '#FF9500' },
  2: { icon: 'moon-outline', bg: '#5B7FFF' },
  3: { icon: 'checkmark-circle-outline', bg: '#34C759' },
  4: { icon: 'bed-outline', bg: '#5856D6' },
  5: { icon: 'alarm-outline', bg: '#FF2D55' },
  6: { icon: 'airplane-outline', bg: '#00C7BE' },
  7: { icon: 'restaurant-outline', bg: '#FF9500' },
  8: { icon: 'heart-outline', bg: '#FF3B30' },
  9: { icon: 'home-outline', bg: '#007AFF' },
  10: { icon: 'medkit-outline', bg: '#FF2D55' },
  11: { icon: 'star-outline', bg: '#AF52DE' },
  12: { icon: 'ellipsis-horizontal-circle-outline', bg: '#8E8E93' },
  13: { icon: 'volume-high-outline', bg: '#FF9500' },
  14: { icon: 'water-outline', bg: '#00C7BE' },
  15: { icon: 'business-outline', bg: '#34C759' },
  16: { icon: 'walk-outline', bg: '#8E8E93' },
  17: { icon: 'hand-left-outline', bg: '#AF52DE' },
};
```

### Component Props
```typescript
interface AzkarScreenProps {
  onBack: () => void;
}
```

### State Variables
| Variable | Type | Purpose |
|----------|------|---------|
| `selectedCategory` | `number \| null` | Currently selected category ID. `null` = showing category list |
| `searchQuery` | `string` | Search input text |
| `counters` | `Record<string, number>` | Maps `"categoryIndex_itemIndex"` to remaining count |
| `favorites` | `Set<string>` | Set of favorite item keys |
| `copiedKey` | `string \| null` | Currently copied item key (for "Copied!" feedback) |
| `scaleAnims` | `useRef<Record<string, Animated.Value>>` | Ripple animation values per counter button |
| `translatedCategories` | `Record<number, string>` | Translated category names (for non-AR/non-EN) |
| `translatedItems` | `Record<string, {text, source, category}>` | Translated item content (for non-AR/non-EN) |

### Derived Values
```typescript
const isArabicUI = appLanguage === 'ar';
const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';
const categories = azkarData.categories;
```

### Key Functions

#### `extractBismillah(text)` — Prefix Extraction
This is the **core function** that handles Ta'awwudh and Bismillah display.

```typescript
const extractBismillah = useCallback((text: string): {
  bismillah: string | null;
  taawwudh: string | null;
  rest: string
} => {
  let taawwudh: string | null = null;
  let rest = text;
  // Extract Ta'awwudh first (comes before Bismillah)
  if (rest.startsWith(TAAWWUDH_AR)) {
    taawwudh = TAAWWUDH_AR;
    rest = rest.substring(TAAWWUDH_AR.length).replace(/^[.،\s]+/, '');
  }
  // Extract Bismillah
  let bismillah: string | null = null;
  if (rest.startsWith(BISMILLAH_AR)) {
    bismillah = BISMILLAH_AR;
    rest = rest.substring(BISMILLAH_AR.length).replace(/^[.،\s]+/, '');
  } else {
    const prefix = BISMILLAH_AR + '.';
    if (rest.startsWith(prefix)) {
      bismillah = BISMILLAH_AR;
      rest = rest.substring(prefix.length).replace(/^[.،\s]+/, '');
    }
  }
  return { bismillah, taawwudh, rest };
}, []);
```

**How it works:**
1. Checks if `text` starts with Ta'awwudh (`أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ`). If yes, extracts it and strips trailing punctuation/whitespace.
2. Then checks if the remaining text starts with Bismillah (`بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ`). If yes, extracts it.
3. Returns `{ bismillah, taawwudh, rest }` where `rest` is the main supplication text without the prefixes.

**Example:**
- Input: `"أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. اللَّهُ لَا إِلَهَ..."`
- Output: `{ taawwudh: "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ", bismillah: "بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ", rest: "اللَّهُ لَا إِلَهَ..." }`

#### `handleCounterPress(categoryKey, itemIndex, totalCount)`
- Decrements the counter for an item
- Triggers haptic feedback (Vibration)
- Plays ripple animation (scale 1 → 1.15 → 1)
- When counter reaches 0, shows checkmark
- When counter is 0 and pressed again, resets to original count
- Persists to AsyncStorage

#### `handleShare(textAr, translatedText, textEn, source, sourceAr)`
- Shares Arabic + translated text + English + source via `Share.share()`

#### `handleCopy(key, textAr, translatedText, textEn)`
- Copies Arabic + translated text + English to clipboard
- Shows "Copied!" feedback for 2 seconds

#### `handleFavorite(key)`
- Toggles favorite status for an item
- Persists to AsyncStorage

### Rendering Logic

#### Two Views

**1. Category List View** (when `selectedCategory === null`):
- Shows search bar
- FlatList of category cards, each with icon, title, item count
- Tapping a category sets `selectedCategory`

**2. Items View** (when `selectedCategory !== null`):
- Back button + category title header
- Search bar (searches within category items)
- FlatList of azkar item cards

#### Item Card Rendering (lines 334-468)

Each item card contains:

1. **Ta'awwudh & Bismillah section** (if present and `showArabic` is true):
```tsx
{(taawwudh || bismillah) && showArabic && (
  <View style={styles.bismillahContainer}>
    {taawwudh && (
      <Text style={[styles.bismillahText, { color: c.primary }]}>{TAAWWUDH_AR}</Text>
    )}
    {taawwudh && bismillah && <View style={{ height: 6 }} />}
    {bismillah && (
      <Text style={[styles.bismillahText, { color: c.primary }]}>{BISMILLAH_AR}</Text>
    )}
  </View>
)}
```
- Both Ta'awwudh and Bismillah are displayed in the **same special styling**: `c.primary` color, centered, fontSize 20, fontWeight 600, with a bottom border separator.
- If both exist, Ta'awwudh appears first, then a 6px spacer, then Bismillah.

2. **Primary text** (depends on language mode):
  - If `isTranslationPrimary` (non-Arabic): Shows translated text as BIG primary, Arabic as smaller secondary, English as smaller tertiary (only for non-EN languages)
  - If Arabic UI: Shows Arabic text as BIG primary only
  - When prefixes exist, Arabic text shows `textRest` (without prefixes) since prefixes are shown separately above

3. **Source row**: Shows source reference with book icon

4. **Action buttons row**: Share, Copy, Favorite, Counter button
  - Counter button: Circular, shows remaining count, turns green with checkmark when completed
  - Animated scale on press

5. **Completed badge**: Shows "تم بحمد الله ✓" (Arabic) or "Completed ✓" when counter reaches 0

### Styles (Key Styles)

```typescript
bismillahContainer: {
  alignItems: 'center',
  paddingBottom: 10,
  marginBottom: 10,
  borderBottomWidth: StyleSheet.hairlineWidth,
  borderBottomColor: 'rgba(0,0,0,0.08)',
},
bismillahText: {
  fontSize: 20,
  fontWeight: '600',
  textAlign: 'center',
},
arabicText: {
  fontSize: 22,
  lineHeight: 40,
  textAlign: 'right',
  marginBottom: 8,
},
primaryText: {
  fontSize: 22,
  lineHeight: 36,
  marginBottom: 10,
},
arabicTextSecondary: {
  fontSize: 20,
  lineHeight: 38,
  textAlign: 'right',
  marginBottom: 8,
},
azkarCard: {
  borderRadius: 16,
  marginBottom: 12,
  padding: 16,
  overflow: 'hidden',
  elevation: 2,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 1 },
  shadowOpacity: 0.1,
  shadowRadius: 4,
},
counterBtn: {
  width: 52,
  height: 52,
  borderRadius: 26,
  justifyContent: 'center',
  alignItems: 'center',
  elevation: 3,
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 2 },
  shadowOpacity: 0.2,
  shadowRadius: 4,
},
```

---

## 6. Translation Pipeline

### Supported Languages (16 total)

| Code | Language | Native Name | RTL |
|------|----------|-------------|-----|
| en | English | English | No |
| ar | Arabic | العربية | Yes |
| zh | Chinese | 中文 | No |
| hi | Hindi | हिन्दी | No |
| ru | Russian | Русский | No |
| ko | Korean | 한국어 | No |
| ja | Japanese | 日本語 | No |
| de | German | Deutsch | No |
| fr | French | Français | No |
| es | Spanish | Español | No |
| tr | Turkish | Türkçe | No |
| ur | Urdu | اردو | Yes |
| id | Indonesian | Indonesia | No |
| bn | Bengali | বাংলা | No |
| pt | Portuguese | Português | No |
| ms | Malay | Bahasa Melayu | No |

### How Azkar Translation Works

1. **Arabic (`ar`)**: Shows `text_ar` as primary. No translation needed.
2. **English (`en`)**: Shows `text_en` as primary. No translation needed.
3. **All other languages** (zh, hi, ru, ko, ja, de, fr, es, tr, ur, id, bn, pt, ms):
   - `text_en` is sent to `translateText()` function in `contentTranslator.ts`
   - `translateText()` calls Google Translate API (`translate.googleapis.com`)
   - Results are cached in AsyncStorage with key `@content_translation_v3_{lang}_{hash}`
   - Translations are loaded in batches of 10 when a category is selected
   - A cancellation mechanism prevents stale translations when switching categories

### Translation Service (`contentTranslator.ts`)

Key details:
- **API**: Google Translate free endpoint (`translate.googleapis.com/translate_a/single`)
- **Cache**: AsyncStorage with version prefix `@content_translation_v3_`
- **Chunking**: Texts > 4500 chars are split at sentence boundaries
- **Retries**: Up to 3 retries with exponential backoff (1s, 2s, 3s)
- **Batch**: `translateBatch()` processes texts sequentially

### Category Name Translation
Category names (`category_en`) are translated separately when the component mounts (for non-AR/non-EN languages). Results stored in `translatedCategories` state.

### UI String Translation
UI strings (Search, Share, Copy, etc.) are translated via `useUITranslation` hook which uses the same `translateText` service.

---

## 7. Prefix Handling — Bismillah & Ta'awwudh

### The Concept

In Islamic tradition, Quranic verses and supplications often begin with:
1. **Ta'awwudh** (`أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ`) — "I seek refuge in Allah from the accursed Satan"
2. **Bismillah** (`بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ`) — "In the name of Allah, the Most Gracious, the Most Merciful"

These are displayed **separately** at the top of the azkar card with special styling (primary color, centered, larger font, with a divider line below), rather than being part of the main text body.

### How It Works in Code

1. **In `azkar.json`**: The `text_ar` field includes the prefixes inline, e.g.:
   ```
   "أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. اللَّهُ لَا إِلَهَ..."
   ```

2. **In `AzkarScreen.tsx`**: The `extractBismillah()` function:
   - Detects if `text_ar` starts with Ta'awwudh and/or Bismillah
   - Extracts them into separate variables
   - Returns the remaining text as `rest`

3. **In rendering**:
   - Ta'awwudh and Bismillah are displayed in the `bismillahContainer` with `c.primary` color
   - The main text body shows only `textRest` (the remaining text without prefixes)
   - This applies to both Arabic-primary and translation-primary modes

4. **In translations**: The `text_en` field does NOT include the prefixes — it only contains the translation of the main supplication text. The prefixes are always shown in Arabic regardless of the app language.

### Items With Both Prefixes (Ta'awwudh + Bismillah)

These items have `text_ar` starting with both prefixes:

**Evening Azkar:**
- Item 1: Ayat al-Kursi
- Item 2: Last two verses of Surah Al-Baqarah

**Sleeping Azkar:**
- Item 1: Ayat al-Kursi
- Item 3: Last two verses of Surah Al-Baqarah

### Items With Only Bismillah

**Evening Azkar:**
- Item 3: Surah Al-Ikhlas
- Item 4: Surah Al-Falaq
- Item 5: Surah An-Nas

**Sleeping Azkar:**
- Item 4: Al-Mu'awwidhatayn (Ikhlas + Falaq + Nas combined)
- Item 12: Surah Al-Kafirun

---

## 8. Evening Azkar (أذكار المساء) — Complete Item List

**Category ID**: 2
**Total Items**: 25
**Order**: As specified by the user — Ayat al-Kursi first, then last two verses of Al-Baqarah, then the three Quls, then the rest.

| # | Description | Count | Source | Has Ta'awwudh | Has Bismillah |
|---|-------------|-------|--------|---------------|---------------|
| 1 | Ayat al-Kursi (Quran 2:255) | 1 | Sahih al-Bukhari 2311 | Yes | Yes |
| 2 | Last two verses of Surah Al-Baqarah (285-286) | 1 | Sahih al-Bukhari 5009 | Yes | Yes |
| 3 | Surah Al-Ikhlas (Quran 112) | 3 | Quran 112 | No | Yes |
| 4 | Surah Al-Falaq (Quran 113) | 3 | Quran 113 | No | Yes |
| 5 | Surah An-Nas (Quran 114) | 3 | Quran 114 | No | Yes |
| 6 | أمسينا وأمسى الملك لله | 1 | Sahih Muslim 2723 | No | No |
| 7 | اللهم بك أمسينا وبك أصبحنا | 1 | Sunan at-Tirmidhi 3391 | No | No |
| 8 | اللهم إني أسألك العفو والعافية (full version with استر عوراتي) | 1 | Sunan Abi Dawud 5075, Ibn Majah 3871 | No | No |
| 9 | أعوذ بكلمات الله التامات من شر ما خلق | 3 | Sahih Muslim 2709 | No | No |
| 10 | بسم الله الذي لا يضر مع اسمه شيء | 3 | Sunan at-Tirmidhi 3388, Abu Dawud 5088 | No | No |
| 11 | اللهم إني أسألك الجنة وأعوذ بك من النار | 3 | Sunan Abu Dawud, Tirmidhi | No | No |
| 12 | سبحان الله وبحمده عدد خلقه | 3 | Sahih Muslim 2726 | No | No |
| 13 | لا إله إلا الله وحده لا شريك له | 10 | Sahih Muslim 2691 | No | No |
| 14 | Sayyid al-Istighfar (سيد الاستغفار) | 1 | Sahih al-Bukhari 6306 | No | No |
| 15 | رضيت بالله ربًا | 3 | Sunan Abi Dawud 5072, Tirmidhi 3389 | No | No |
| 16 | اللهم إني أمسيت أشهدك (دعاء الشهادة) | 4 | Sunan Abi Dawud 5069 | No | No |
| 17 | اللهم ما أمسى بي من نعمة (دعاء النعمة) | 1 | Sunan an-Nasa'i, Abu Dawud 5073 | No | No |
| 18 | حسبي الله لا إله إلا هو | 7 | Sunan Abi Dawud 5081 | No | No |
| 19 | أمسينا على فطرة الإسلام | 1 | Musnad Ahmad 26755 | No | No |
| 20 | اللهم عافني في بدني (دعاء العافية) | 3 | Sunan Abi Dawud 5090 | No | No |
| 21 | أستغفر الله العظيم الذي لا إله إلا هو الحي القيوم | 100 | Mustadrak al-Hakim 1868 | No | No |
| 22 | يا رب لك الحمد كما ينبغي لجلال وجهك | 3 | Sahih Ibn Hibban 871 | No | No |
| 23 | يا حي يا قيوم برحمتك أستغيث | 1 | Mustadrak al-Hakim 1:545 | No | No |
| 24 | اللهم عالم الغيب والشهادة | 1 | Sunan at-Tirmidhi 3383 | No | No |
| 25 | سبحان الله وبحمده (100 times) | 100 | Sahih Muslim 2692 | No | No |

---

## 9. Sleeping Azkar (أذكار النوم) — Complete Item List

**Category ID**: 4
**Total Items**: 15
**Order**: As specified by the user — Ayat al-Kursi first, then باسمك ربي وضعت جنبي, then last two verses of Al-Baqarah, then المعوذات (the three Quls), then the rest.

| # | Description | Count | Source | Has Ta'awwudh | Has Bismillah |
|---|-------------|-------|--------|---------------|---------------|
| 1 | Ayat al-Kursi (Quran 2:255) | 1 | Sahih al-Bukhari 2311 | Yes | Yes |
| 2 | باسمك ربي وضعت جنبي | 1 | Sahih al-Bukhari 6320, Muslim 2714 | No | No |
| 3 | Last two verses of Surah Al-Baqarah (285-286) | 1 | Sahih al-Bukhari 5009, Muslim 808 | Yes | Yes |
| 4 | المعوذات — Al-Ikhlas + Al-Falaq + An-Nas (recite & wipe 3x) | 3 | Sahih al-Bukhari 5017, Muslim 2192 | No | Yes |
| 5 | باسمك اللهم أموت وأحيا | 1 | Sahih al-Bukhari 6324 | No | No |
| 6 | اللهم قني عذابك يوم تبعث عبادك | 3 | Sunan Abu Dawud 5045 | No | No |
| 7 | سبحان الله | 33 | Sahih al-Bukhari 3705 | No | No |
| 8 | الحمد لله | 33 | Sahih al-Bukhari 3705 | No | No |
| 9 | الله أكبر | 34 | Sahih al-Bukhari 3705 | No | No |
| 10 | اللهم أسلمت نفسي إليك | 1 | Sahih al-Bukhari 6313, Muslim 2714 | No | No |
| 11 | اللهم إنك خلقت نفسي وأنت تتوفاها | 1 | Sahih Muslim 2712 | No | No |
| 12 | Surah Al-Kafirun | 1 | Sunan Abi Dawud 5050, Tirmidhi 3403 | No | Yes |
| 13 | اللهم رب السماوات السبع (dua of Abu Huraira) | 1 | Sahih Muslim 2713 | No | No |
| 14 | الحمد لله الذي أطعمنا وسقانا وكفانا وآوانا | 1 | Sahih Muslim 2715 | No | No |
| 15 | اللهم عالم الغيب والشهادة | 1 | Sunan at-Tirmidhi 3383 | No | No |

---

## 10. All Other Azkar Categories

### Morning Azkar (ID: 1) — 20 items
Includes: Ayat al-Kursi, three Quls, morning remembrances, Sayyid al-Istighfar, etc.

### After Prayer Azkar (ID: 3) — 12 items
Includes: Ayat al-Kursi, Mu'awwidhatayn, tasbeeh (33x), tahmeed (33x), takbeer (34x), etc.

### Waking Up Dua (ID: 5) — 2 items
### Travel Azkar (ID: 6) — 8 items
### Food & Drink Azkar (ID: 7) — 8 items
### Distress & Anxiety Duas (ID: 8) — 10 items
### Home Azkar (ID: 9) — 5 items
### Sickness & Ruqyah Azkar (ID: 10) — 6 items
### Tasbeeh & Istighfar (ID: 11) — 7 items
### Miscellaneous Azkar (ID: 12) — 6 items
### Adhan Azkar (ID: 13) — 3 items
### Wudu Azkar (ID: 14) — 4 items
### Mosque Azkar (ID: 15) — 5 items
### Bathroom Azkar (ID: 16) — 3 items
### Prayer Azkar (ID: 17) — 7 items

---

## 11. Counter & Favorites System

### Counter System
- **Storage key**: `@azkar_counters_v1`
- **Format**: `Record<string, number>` where key is `"categoryId_itemIndex"`
- **Behavior**:
  - Initial value = item's `count` field
  - Each tap decrements by 1
  - Haptic feedback on each tap (vibration)
  - Ripple animation (scale 1 → 1.15 → 1)
  - When count reaches 0: button turns green with checkmark icon, "Completed" badge appears
  - Tapping a completed counter resets it to original count (with longer vibration)
- **Persistence**: Saved to AsyncStorage on every change

### Favorites System
- **Storage key**: `@azkar_favorites_v1`
- **Format**: `string[]` (array of keys) in AsyncStorage, `Set<string>` in state
- **Behavior**:
  - Heart icon toggles between outline (not favorited) and filled red (favorited)
  - Tapping toggles favorite status
- **Persistence**: Saved to AsyncStorage on every change

---

## 12. Performance Architecture

### FlatList Optimization
```tsx
<FlatList
  data={filteredItems}
  keyExtractor={(item, index) => `${selectedCategory}_${index}`}
  initialNumToRender={8}
  maxToRenderPerBatch={8}
  windowSize={15}
  removeClippedSubviews={false}
  scrollEventThrottle={16}
  maintainVisibleContentPosition={{
    minIndexForVisible: 0,
    autoscrollToTopThreshold: 100,
  }}
/>
```

- `initialNumToRender={8}`: Renders 8 items initially for fast first paint
- `maxToRenderPerBatch={8}`: Renders 8 more items per batch when scrolling
- `windowSize={15}`: Keeps 15 screens worth of items in memory
- `removeClippedSubviews={false}`: Disabled to avoid issues with RTL text
- `scrollEventThrottle={16}`: Smooth scrolling at ~60fps
- `maintainVisibleContentPosition`: Prevents scroll jumps when items load

### Translation Performance
- Translations are loaded in **batches of 10** to avoid blocking the UI
- Results are cached in AsyncStorage with a hash key for O(1) lookup
- Cancellation mechanism prevents stale translations when switching categories quickly
- Category names are translated once on mount, not on every render

### Data Loading
- `azkar.json` is imported directly (no async loading needed)
- `resolveJsonModule: true` in tsconfig enables JSON imports in TypeScript
- The JSON file is ~102KB — loaded into memory at app start, no lazy loading needed

### No Performance Impact from Changes
- Adding new items to `azkar.json` does not change the rendering logic
- The FlatList only renders visible items, so more items = slightly more scroll content but no impact on initial load
- TypeScript compilation time is unaffected (JSON is not type-checked in detail)

---

## 13. All Changes Made (Chronological)

### Phase 1: Initial Azkar Content Expansion

**Files modified**: `src/data/azkar.json`

**Evening Azkar (ID: 2)**: Added 13 new items (12 → 25 total):
1. Last two verses of Surah Al-Baqarah (285-286) — count: 1
2. Sayyid al-Istighfar — count: 1
3. رضيت بالله ربًا — count: 3
4. دعاء الشهادة — count: 4
5. دعاء النعمة — count: 1
6. حسبي الله — count: 7
7. الفطرة — count: 1
8. دعاء العافية — count: 3
9. أستغفر الله العظيم — count: 100
10. يا رب لك الحمد — count: 3
11. يا حي يا قيوم — count: 1
12. اللهم عالم الغيب والشهادة — count: 1
13. سبحان الله وبحمده (100x) — count: 100

Also updated: العفو والعافية expanded to full version with "اللهم استر عوراتي وآمن روعاتي"

**Sleeping Azkar (ID: 4)**: Added 8 new items (7 → 15 total):
1. باسمك ربي وضعت جنبي — count: 1
2. المعوذات (Ikhlas + Falaq + Nas, recite & wipe) — count: 3
3. Ayat al-Kursi — count: 1
4. Last two verses of Al-Baqarah — count: 1
5. Surah Al-Kafirun — count: 1
6. دعاء أبو هريرة (رب السماوات السبع) — count: 1
7. الحمد لله الذي أطعمنا — count: 1
8. اللهم عالم الغيب والشهادة — count: 1

### Phase 2: Ta'awwudh & Bismillah Display Support

**Files modified**: `src/screens/AzkarScreen.tsx`

1. Added `TAAWWUDH_AR` constant: `'أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ'`
2. Updated `extractBismillah()` function:
   - **Before**: Only extracted Bismillah, returned `{ bismillah, rest }`
   - **After**: Extracts both Ta'awwudh and Bismillah, returns `{ bismillah, taawwudh, rest }`
   - Ta'awwudh is extracted first (it comes before Bismillah in the text)
   - Both are stripped with trailing punctuation/whitespace removal
3. Updated rendering in `renderItem`:
   - Added `hasPrefix` variable: `const hasPrefix = bismillah || taawwudh;`
   - Replaced Bismillah-only display with combined Ta'awwudh + Bismillah display
   - Both shown with same `bismillahText` style (`c.primary` color, fontSize 20, fontWeight 600)
   - 6px spacer between Ta'awwudh and Bismillah when both present
4. Updated all text display references from `bismillah ? textRest : item.text_ar` to `hasPrefix ? textRest : item.text_ar`

### Phase 3: Evening Azkar Reordering & Prefix Addition

**Files modified**: `src/data/azkar.json`

1. **Ayat al-Kursi** (item 1):
   - `text_ar`: Added both `أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ.` and `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ.` prefixes
   - `text_en`: Updated to full translation (was abbreviated "Ayat al-Kursi (Quran 2:255) — Allah! There is no deity except Him...")

2. **Last two verses of Al-Baqarah**: 
   - Moved from position 14 to **position 2** (right after Ayat al-Kursi)
   - Added both Ta'awwudh and Bismillah prefixes to `text_ar`
   - Removed the old duplicate entry from its previous position

### Phase 4: Sleeping Azkar Reordering & Prefix Addition

**Files modified**: `src/data/azkar.json`

Reordered the entire sleeping azkar items array to:

1. **Ayat al-Kursi** — with both Ta'awwudh + Bismillah prefixes (was previously at position 10, moved to position 1)
2. **باسمك ربي وضعت جنبي** — moved from position 8 to position 2
3. **Last two verses of Al-Baqarah** — with both Ta'awwudh + Bismillah prefixes (was at position 11, moved to position 3)
4. **المعوذات** (Ikhlas + Falaq + Nas) — moved from position 9 to position 4
5. باسمك اللهم أموت وأحيا — was position 1, now position 5
6. اللهم قني عذابك — was position 2, now position 6
7. سبحان الله (33x) — was position 3, now position 7
8. الحمد لله (33x) — was position 4, now position 8
9. الله أكبر (34x) — was position 5, now position 9
10. اللهم أسلمت نفسي إليك — was position 6, now position 10
11. اللهم إنك خلقت نفسي — was position 7, now position 11
12. Surah Al-Kafirun — was position 12, stays at position 12
13. اللهم رب السماوات السبع — was position 13, stays at position 13
14. الحمد لله الذي أطعمنا — was position 14, stays at position 14
15. اللهم عالم الغيب والشهادة — was position 15, stays at position 15

---

## 14. Verification & Testing

### JSON Validation
```bash
node -e "const d=require('./src/data/azkar.json'); console.log('Valid JSON'); console.log('Categories:', d.categories.length); d.categories.forEach(c => console.log('  id:', c.id, c.category_en, '- items:', c.items.length));"
```

**Result**: Valid JSON, 17 categories, Evening Azkar = 25 items, Sleep Azkar = 15 items.

### TypeScript Compilation
```bash
npx tsc --noEmit
```

**Result**: 0 errors, exit code 0.

### Evening Azkar Order Verification
```
1: أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. بِ...  (Ayat al-Kursi)
2: أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. بِ...  (Last two verses Al-Baqarah)
3: بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ هُوَ ال...  (Al-Ikhlas)
4: بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ أَعُوذُ...  (Al-Falaq)
5: بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ أَعُوذُ...  (An-Nas)
6-25: Remaining evening azkar
```

### Sleeping Azkar Order Verification
```
1: أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. بِ...  (Ayat al-Kursi)
2: بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي...                    (باسمك ربي وضعت جنبي)
3: أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. بِ...  (Last two verses Al-Baqarah)
4: بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ قُلْ هُوَ ال...  (المعوذات)
5-15: Remaining sleeping azkar
```

### Duplicate Check
All new items were cross-referenced against existing azkar. No duplicates found.

### Performance Verification
- No code architecture changes — new items load from same JSON file
- FlatList renders only visible items — no impact from more items
- Translation pipeline unchanged — new items translated same way
- App launch time unaffected — JSON is imported at module level (same as before)

---

## 15. How to Run the App

### Prerequisites
- Node.js installed
- Expo CLI installed (`npm install -g expo-cli`)
- Android Studio (for Android emulator) or Xcode (for iOS simulator)

### Commands
```bash
# Install dependencies
cd E:\quran-app
npm install

# Start Expo dev server
npx expo start

# Run on Android
npx expo start --android

# Run on iOS
npx expo start --ios

# Run on web
npx expo start --web

# TypeScript check (no emit)
npx tsc --noEmit

# Build for Android
expo build:android

# Build for iOS
expo build:ios
```

### Testing the Azkar Feature
1. Launch the app
2. From the Home screen, tap the Azkar button
3. Browse the 17 categories
4. Tap any category (e.g., "Evening Azkar" or "Sleep Azkar")
5. Scroll through the items — verify Ta'awwudh and Bismillah appear at top of Quranic items
6. Tap the counter button to decrement repetitions
7. Tap the heart icon to favorite an item
8. Tap Share or Copy to test sharing/copying
9. Use the search bar to search within categories
10. Change app language to verify translations work

---

## 16. How to Add New Azkar (Step-by-Step Guide)

### Step 1: Edit `azkar.json`
Open `E:\quran-app\src\data\azkar.json` and find the category you want to add to.

### Step 2: Add a new item
Add a new object to the `items` array:
```json
{
  "text_ar": "Arabic text here (with أعوذ بالله and/or بسم الله prefixes if applicable)",
  "text_en": "English translation here (WITHOUT the prefixes — only the main supplication translation)",
  "count": 3,
  "source_en": "Source reference in English",
  "source_ar": "Source reference in Arabic"
}
```

### Step 3: Prefix rules
- If the item is a Quranic verse, start `text_ar` with: `أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. ` followed by the verse text
- If the item is a surah, start `text_ar` with: `بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ ` followed by the surah text
- If the item is a regular dua, no prefix needed
- **Never** include the prefixes in `text_en` — they are always displayed in Arabic only

### Step 4: Verify
```bash
# Validate JSON
node -e "const d=require('./src/data/azkar.json'); console.log('Valid');"

# Check TypeScript
npx tsc --noEmit
```

### Step 5: Test
Run the app and navigate to the Azkar screen to verify the new item displays correctly.

---

## Appendix A: Full Evening Azkar Arabic Texts (First 5 Items)

### Item 1: Ayat al-Kursi
```
أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ
```

### Item 2: Last Two Verses of Al-Baqarah
```
أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ وَقَالُوا سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ، لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ
```

### Item 3: Surah Al-Ikhlas
```
بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ هُوَ اللَّهُ أَحَدٌ. اللَّهُ الصَّمَدُ. لَمْ يَلِدْ وَلَمْ يُولَدْ. وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ
```

### Item 4: Surah Al-Falaq
```
بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ. مِنْ شَرِّ مَا خَلَقَ. وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ. وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ. وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ
```

### Item 5: Surah An-Nas
```
بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. قُلْ أَعُوذُ بِرَبِّ النَّاسِ. مَلِكِ النَّاسِ. إِلَهِ النَّاسِ. مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ. الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ. مِنَ الْجِنَّةِ وَالنَّاسِ
```

---

## Appendix B: Full Sleeping Azkar Arabic Texts (First 4 Items)

### Item 1: Ayat al-Kursi
```
أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. اللَّهُ لَا إِلَهَ إِلَّا هُوَ الْحَيُّ الْقَيُّومُ لَا تَأْخُذُهُ سِنَةٌ وَلَا نَوْمٌ لَهُ مَا فِي السَّمَاوَاتِ وَمَا فِي الْأَرْضِ مَنْ ذَا الَّذِي يَشْفَعُ عِنْدَهُ إِلَّا بِإِذْنِهِ يَعْلَمُ مَا بَيْنَ أَيْدِيهِمْ وَمَا خَلْفَهُمْ وَلَا يُحِيطُونَ بِشَيْءٍ مِنْ عِلْمِهِ إِلَّا بِمَا شَاءَ وَسِعَ كُرْسِيُّهُ السَّمَاوَاتِ وَالْأَرْضَ وَلَا يَئُودُهُ حِفْظُهُمَا وَهُوَ الْعَلِيُّ الْعَظِيمُ
```

### Item 2: باسمك ربي وضعت جنبي
```
بِاسْمِكَ رَبِّي وَضَعْتُ جَنْبِي، وَبِكَ أَرْفَعُهُ، فَإِنْ أَمْسَكْتَ نَفْسِي فَارْحَمْهَا، وَإِنْ أَرْسَلْتَهَا فَاحْفَظْهَا بِمَا تَحْفَظُ بِهِ عِبَادَكَ الصَّالِحِينَ
```

### Item 3: Last Two Verses of Al-Baqarah
```
أَعُوذُ بِاللَّهِ مِنَ الشَّيْطَانِ الرَّجِيمِ. بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ. آمَنَ الرَّسُولُ بِمَا أُنْزِلَ إِلَيْهِ مِنْ رَبِّهِ وَالْمُؤْمِنُونَ كُلٌّ آمَنَ بِاللَّهِ وَمَلَائِكَتِهِ وَكُتُبِهِ وَرُسُلِهِ لَا نُفَرِّقُ بَيْنَ أَحَدٍ مِنْ رُسُلِهِ وَقَالُوا سَمِعْنَا وَأَطَعْنَا غُفْرَانَكَ رَبَّنَا وَإِلَيْكَ الْمَصِيرُ، لَا يُكَلِّفُ اللَّهُ نَفْسًا إِلَّا وُسْعَهَا لَهَا مَا كَسَبَتْ وَعَلَيْهَا مَا اكْتَسَبَتْ رَبَّنَا لَا تُؤَاخِذْنَا إِنْ نَسِينَا أَوْ أَخْطَأْنَا رَبَّنَا وَلَا تَحْمِلْ عَلَيْنَا إِصْرًا كَمَا حَمَلْتَهُ عَلَى الَّذِينَ مِنْ قَبْلِنَا رَبَّنَا وَلَا تُحَمِّلْنَا مَا لَا طَاقَةَ لَنَا بِهِ وَاعْفُ عَنَّا وَاغْفِرْ لَنَا وَارْحَمْنَا أَنْتَ مَوْلَانَا فَانْصُرْنَا عَلَى الْقَوْمِ الْكَافِرِينَ
```

### Item 4: المعوذات (Al-Ikhlas + Al-Falaq + An-Nas)
```
بِسْمِ اللَّهِ الرَّحْمَنِ الرَّحِيمِ قُلْ هُوَ اللَّهُ أَحَدٌ اللَّهُ الصَّمَدُ لَمْ يَلِدْ وَلَمْ يُولَدْ وَلَمْ يَكُنْ لَهُ كُفُوًا أَحَدٌ. قُلْ أَعُوذُ بِرَبِّ الْفَلَقِ مِنْ شَرِّ مَا خَلَقَ وَمِنْ شَرِّ غَاسِقٍ إِذَا وَقَبَ وَمِنْ شَرِّ النَّفَّاثَاتِ فِي الْعُقَدِ وَمِنْ شَرِّ حَاسِدٍ إِذَا حَسَدَ. قُلْ أَعُوذُ بِرَبِّ النَّاسِ مَلِكِ النَّاسِ إِلَهِ النَّاسِ مِنْ شَرِّ الْوَسْوَاسِ الْخَنَّاسِ الَّذِي يُوَسْوِسُ فِي صُدُورِ النَّاسِ مِنَ الْجِنَّةِ وَالنَّاسِ
```

---

## Appendix C: Key Code Snippets

### extractBismillah Function (Full)
```typescript
const extractBismillah = useCallback((text: string): {
  bismillah: string | null;
  taawwudh: string | null;
  rest: string
} => {
  let taawwudh: string | null = null;
  let rest = text;
  // Extract Ta'awwudh first (comes before Bismillah)
  if (rest.startsWith(TAAWWUDH_AR)) {
    taawwudh = TAAWWUDH_AR;
    rest = rest.substring(TAAWWUDH_AR.length).replace(/^[.،\s]+/, '');
  }
  // Extract Bismillah
  let bismillah: string | null = null;
  if (rest.startsWith(BISMILLAH_AR)) {
    bismillah = BISMILLAH_AR;
    rest = rest.substring(BISMILLAH_AR.length).replace(/^[.،\s]+/, '');
  } else {
    const prefix = BISMILLAH_AR + '.';
    if (rest.startsWith(prefix)) {
      bismillah = BISMILLAH_AR;
      rest = rest.substring(prefix.length).replace(/^[.،\s]+/, '');
    }
  }
  return { bismillah, taawwudh, rest };
}, []);
```

### Prefix Display Rendering (Full)
```tsx
{/* Ta'awwudh & Bismillah on top */}
{(taawwudh || bismillah) && showArabic && (
  <View style={styles.bismillahContainer}>
    {taawwudh && (
      <Text style={[styles.bismillahText, { color: c.primary }]}>{TAAWWUDH_AR}</Text>
    )}
    {taawwudh && bismillah && <View style={{ height: 6 }} />}
    {bismillah && (
      <Text style={[styles.bismillahText, { color: c.primary }]}>{BISMILLAH_AR}</Text>
    )}
  </View>
)}
```

### Text Display with Prefix Handling
```tsx
// For translation-primary mode (non-Arabic):
{showArabic && (
  <Text style={[styles.arabicTextSecondary, { color: c.textSecondary }]}>
    {hasPrefix ? textRest : item.text_ar}
  </Text>
)}

// For Arabic-primary mode:
{showArabic && (
  <Text style={[styles.arabicText, { color: c.text }]}>
    {hasPrefix ? textRest : item.text_ar}
  </Text>
)}
```

### Counter Button Rendering
```tsx
<Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
  <TouchableOpacity
    style={[
      styles.counterBtn,
      { backgroundColor: isCompleted ? '#34C759' : c.primary },
    ]}
    onPress={() => handleCounterPress(String(selectedCategory), index, item.count)}
    activeOpacity={0.7}
  >
    {isCompleted ? (
      <Ionicons name="checkmark" size={26} color="#fff" />
    ) : (
      <Text style={styles.counterBtnText}>{remaining}</Text>
    )}
  </TouchableOpacity>
</Animated.View>
```

---

## Appendix D: Translation Service Details

### `contentTranslator.ts` Key Functions

#### `translateText(text, targetLang, sourceLang = 'en')`
1. If `targetLang === 'en'` or `targetLang === sourceLang`, return text as-is
2. Check AsyncStorage cache (`@content_translation_v3_{lang}_{hash}`)
3. If cached, return cached translation
4. Split text into chunks (max 4500 chars each, split at sentence boundaries)
5. For each chunk, call `translateWithGoogleDirect()`
6. Join translated chunks
7. Cache result in AsyncStorage
8. Return translation

#### `translateWithGoogleDirect(text, targetLang, sourceLang)`
1. Build URL: `https://translate.googleapis.com/translate_a/single?client=gtx&sl={source}&tl={target}&dt=t&q={encodedText}`
2. Fetch with up to 3 retries (exponential backoff: 1s, 2s, 3s)
3. Parse response: `data[0]` is array of segments, each `segment[0]` is translated text
4. Join all translated segments
5. Return result or `null` on failure

#### `translateBatch(texts, targetLang, sourceLang)`
- Sequentially calls `translateText` for each text
- Returns array of translated strings

### Language Code Mapping
```typescript
const LANG_MAP: Record<AppLanguage, string> = {
  ar: 'ar', en: 'en', zh: 'zh-CN', hi: 'hi', ru: 'ru',
  ko: 'ko', ja: 'ja', de: 'de', fr: 'fr', es: 'es',
  tr: 'tr', ur: 'ur', id: 'id', bn: 'bn', pt: 'pt', ms: 'ms',
};
```

---

## Date
August 4, 2026

---

> **End of documentation.** This file contains everything needed to understand, maintain, and extend the Azkar feature in this Quran app.
