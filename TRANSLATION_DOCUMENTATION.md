# Al-Qur'an App — Complete Translation & UI Documentation

This document provides a 100% detailed explanation of every translation concept, code pattern, and UI rendering logic implemented across all screens in the Al-Qur'an React Native (Expo) application.

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Language Context & Global State](#2-language-context--global-state)
3. [Content Translator Service (MyMemory API)](#3-content-translator-service-mymemory-api)
4. [Content Translations Service (Static Localized Strings)](#4-content-translations-service-static-localized-strings)
5. [Quran Translations Service (Per-Surah API)](#5-quran-translations-service-per-surah-api)
6. [Scientific Miracles Screen](#6-scientific-miracles-screen)
7. [Prayer Times Screen](#7-prayer-times-screen)
8. [Qibla Screen](#8-qibla-screen)
9. [Islamic Months Screen](#9-islamic-months-screen)
10. [Hadith Screen](#10-hadith-screen)
11. [Azkar Screen](#11-azkar-screen)
12. [Prophet Sunnah Screen](#12-prophet-sunnah-screen)
13. [Questions & Answers Screen](#13-questions--answers-screen)
14. [Support Us Screen](#14-support-us-screen)
15. [About Us Screen](#15-about-us-screen)
16. [Surah Reader Screen (Quran Reading)](#16-surah-reader-screen-quran-reading)
17. [Qibla Calculation Utility](#17-qibla-calculation-utility)
18. [Magnetic Declination Utility (IGRF-13)](#18-magnetic-declination-utility-igrf-13)
19. [Updated Ending Message (Catchy Non-Muslim Hook)](#19-updated-ending-message-catchy-non-muslim-hook)

---

## 1. Architecture Overview

The app supports **15 languages**: Arabic (`ar`), English (`en`), Chinese (`zh`), Hindi (`hi`), Russian (`ru`), Korean (`ko`), Japanese (`ja`), German (`de`), French (`fr`), Spanish (`es`), Turkish (`tr`), Urdu (`ur`), Indonesian (`id`), Bengali (`bn`), and Portuguese (`pt`).

### Translation Strategy (3-Tier)

| Tier | Languages | Strategy |
|------|-----------|----------|
| **Tier 1** | Arabic (`ar`) | Display Arabic content directly from `_ar` fields. No API calls. |
| **Tier 2** | English (`en`) | Display English content directly from `_en` fields. No API calls. |
| **Tier 3** | All others (`zh`, `hi`, `ru`, `ko`, `ja`, `de`, `fr`, `es`, `tr`, `ur`, `id`, `bn`, `pt`) | Asynchronously translate English `_en` fields via MyMemory API with AsyncStorage caching. |

### Key Pattern Across All Screens

Every screen that displays content follows this exact pattern:

```typescript
const isArabicUI = appLanguage === 'ar';
const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';
```

- **`isArabicUI`**: When `true`, render Arabic fields directly (`_ar` suffix).
- **`needsTranslation`**: When `true`, trigger async translation of English fields (`_en` suffix) to the target language.
- When both are `false` (i.e., `appLanguage === 'en'`), render English fields directly.

### Content Rendering Ternary Pattern

```typescript
{isArabicUI
  ? item.title_ar
  : (needsTranslation
      ? (translatedItems[item.id]?.title || item.title_en)  // Translated or fallback to English
      : item.title_en)}                                       // English direct
```

This pattern is used consistently across all screens for every text field.

---

## 2. Language Context & Global State

**File:** `src/context/LanguageContext.tsx`

The `LanguageContext` is the central hub that provides language state to all screens.

```typescript
import React, { createContext, useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppLanguage,
  TranslationKey,
  getTranslation,
  isRTL as checkRTL,
} from '../i18n/translations';
import { preloadQuranTranslation } from '../services/quranTranslations';
import { initNotifications, scheduleAzkarReminders } from '../services/notifications';

const APP_LANGUAGE_KEY = '@quran_app_language';

interface LanguageContextType {
  appLanguage: AppLanguage;
  setAppLanguage: (lang: AppLanguage) => void;
  t: (key: TranslationKey) => string;
  isRTL: boolean;
  showArabic: boolean;
  showTranslation: boolean;
  translationLabel: string;
}

const LanguageContext = createContext<LanguageContextType>({
  appLanguage: 'en',
  setAppLanguage: () => {},
  t: (key) => getTranslation('en', key),
  isRTL: false,
  showArabic: true,
  showTranslation: true,
  translationLabel: 'EN',
});

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [appLanguage, setLang] = useState<AppLanguage>('en');

  useEffect(() => {
    (async () => {
      try {
        await initNotifications();
        const saved = await AsyncStorage.getItem(APP_LANGUAGE_KEY);
        if (saved) {
          setLang(saved as AppLanguage);
          preloadQuranTranslation(saved as AppLanguage).catch(() => {});
          scheduleAzkarReminders(saved as AppLanguage).catch(() => {});
        } else {
          scheduleAzkarReminders('en').catch(() => {});
        }
      } catch {
        // ignore
      }
    })();
  }, []);

  const setAppLanguage = (lang: AppLanguage) => {
    setLang(lang);
    AsyncStorage.setItem(APP_LANGUAGE_KEY, lang).catch(() => {});
    preloadQuranTranslation(lang).catch(() => {});
    scheduleAzkarReminders(lang).catch(() => {});
  };

  const t = (key: TranslationKey) => getTranslation(appLanguage, key);
  const isRTL = checkRTL(appLanguage);

  const showArabic = true;
  const showTranslation = appLanguage !== 'ar';
  const translationLabel = appLanguage.toUpperCase();

  return (
    <LanguageContext.Provider
      value={{
        appLanguage,
        setAppLanguage,
        t,
        isRTL,
        showArabic,
        showTranslation,
        translationLabel,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => useContext(LanguageContext);
```

### Key Properties

- **`appLanguage`**: Current selected language code (e.g., `'en'`, `'ar'`, `'ru'`).
- **`setAppLanguage(lang)`**: Changes the app language, saves to AsyncStorage, preloads Quran translation, and reschedules Azkar reminders.
- **`t(key)`**: Returns the localized UI string for the given key (e.g., `t('prayerTimes')` returns `"Prayer Times"` in English, `"أوقات الصلاة"` in Arabic).
- **`isRTL`**: `true` for Arabic and Urdu (right-to-left layout).
- **`showArabic`**: Always `true` — Arabic text is always shown alongside translations.
- **`showTranslation`**: `true` when `appLanguage !== 'ar'` — translation text is shown for non-Arabic languages.
- **`translationLabel`**: Uppercase language code displayed in the Surah Reader top bar (e.g., `"RU"`, `"FR"`).

### On App Launch

1. Initialize notifications.
2. Load saved language from AsyncStorage.
3. Preload Quran translation for the saved language (fetches Surah 1 as a connectivity test).
4. Schedule Azkar reminder notifications in the saved language.

---

## 3. Content Translator Service (MyMemory API)

**File:** `src/services/contentTranslator.ts`

This service handles on-the-fly translation of non-Quranic content (Scientific Miracles, Azkar, Hadith, Sunnah, Q&A) using the free MyMemory translation API.

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage } from '../i18n/translations';

const TRANSLATION_CACHE_PREFIX = '@content_translation_';
const CACHE_VERSION_PREFIX = '@content_translation_v1_';

const MYMEMORY_LANG_MAP: Record<AppLanguage, string> = {
  ar: 'ar',
  en: 'en',
  zh: 'zh',
  hi: 'hi',
  ru: 'ru',
  ko: 'ko',
  ja: 'ja',
  de: 'de',
  fr: 'fr',
  es: 'es',
  tr: 'tr',
  ur: 'ur',
  id: 'id',
  bn: 'bn',
  pt: 'pt',
};

function getCacheKey(lang: AppLanguage, text: string): string {
  // Use a simple hash of the text for the cache key
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${CACHE_VERSION_PREFIX}${lang}_${Math.abs(hash)}`;
}

export async function translateText(
  text: string,
  targetLang: AppLanguage,
  sourceLang: AppLanguage = 'en'
): Promise<string> {
  if (!text || text.trim().length === 0) return text;
  if (targetLang === 'en') return text;
  if (targetLang === sourceLang) return text;

  const cacheKey = getCacheKey(targetLang, text);

  // Check cache first
  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached !== null) {
      return cached;
    }
  } catch {
    // ignore cache errors
  }

  // Fetch from MyMemory API
  try {
    const sourceCode = MYMEMORY_LANG_MAP[sourceLang];
    const targetCode = MYMEMORY_LANG_MAP[targetLang];
    const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${sourceCode}|${targetCode}`;

    const response = await fetch(url);
    if (!response.ok) throw new Error(`Translation API error: ${response.status}`);
    const data = await response.json();

    if (data.responseData && data.responseData.translatedText) {
      let translated = data.responseData.translatedText;

      // MyMemory sometimes returns the same text if it can't translate
      // In that case, fall back to English
      if (translated === text) {
        return text;
      }

      // Cache the translation
      try {
        await AsyncStorage.setItem(cacheKey, translated);
      } catch {
        // ignore cache errors
      }

      return translated;
    }
    return text;
  } catch (error) {
    console.error('Translation error:', error);
    return text;
  }
}

export async function translateBatch(
  texts: string[],
  targetLang: AppLanguage,
  sourceLang: AppLanguage = 'en'
): Promise<string[]> {
  if (targetLang === 'en') return texts;

  const results: string[] = [];
  for (const text of texts) {
    const translated = await translateText(text, targetLang, sourceLang);
    results.push(translated);
  }
  return results;
}

export async function isContentTranslated(lang: AppLanguage): Promise<boolean> {
  if (lang === 'en' || lang === 'ar') return true;
  try {
    const keys = await AsyncStorage.getAllKeys();
    const prefix = CACHE_VERSION_PREFIX + lang;
    return keys.some(key => key.startsWith(prefix));
  } catch {
    return false;
  }
}
```

### How It Works

1. **`translateText(text, targetLang, sourceLang)`**: Translates a single string from English to the target language.
   - First checks AsyncStorage cache using a hash of the text + language.
   - If cached, returns immediately (no API call).
   - If not cached, fetches from `https://api.mymemory.translated.net/get?q=...&langpair=en|ru`.
   - Caches the result in AsyncStorage for future use.
   - Falls back to the original English text on any error.

2. **`translateBatch(texts, targetLang, sourceLang)`**: Translates an array of strings sequentially (reuses cache for each).

3. **`isContentTranslated(lang)`**: Checks if any cached translations exist for a given language.

### Caching Strategy

- Cache key format: `@content_translation_v1_{lang}_{hash}` (e.g., `@content_translation_v1_ru_123456789`).
- Hash function: Simple DJB2-style hash of the English source text.
- Cache version prefix `v1` allows cache invalidation by changing the prefix.
- Cache is persistent across app restarts (AsyncStorage).

---

## 4. Content Translations Service (Static Localized Strings)

**File:** `src/services/contentTranslations.ts`

For prayer names and Hijri month names, translations are **pre-built statically** (no API calls needed). This ensures instant display and offline support.

```typescript
import { AppLanguage } from '../i18n/translations';

export const PRAYER_NAMES: Record<AppLanguage, {
  fajr: string; sunrise: string; dhuhr: string;
  asr: string; maghrib: string; isha: string;
}> = {
  ar: { fajr: 'الفجر', sunrise: 'الشروق', dhuhr: 'الظهر', asr: 'العصر', maghrib: 'المغرب', isha: 'العشاء' },
  en: { fajr: 'Fajr', sunrise: 'Sunrise', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  zh: { fajr: '法吉尔', sunrise: '日出', dhuhr: '祖赫尔', asr: '阿萨尔', maghrib: '马格里布', isha: '伊沙' },
  hi: { fajr: 'फज्र', sunrise: 'सूर्योदय', dhuhr: 'ज़ुहर', asr: 'अस्र', maghrib: 'मग़रिब', isha: 'इशा' },
  ru: { fajr: 'Фаджр', sunrise: 'Восход', dhuhr: 'Зухр', asr: 'Аср', maghrib: 'Магриб', isha: 'Иша' },
  ko: { fajr: '파즈르', sunrise: '일출', dhuhr: '두흐르', asr: '아스르', maghrib: '마그립', isha: '이샤' },
  ja: { fajr: 'ファジュル', sunrise: '日の出', dhuhr: 'ズフル', asr: 'アスル', maghrib: 'マグリブ', isha: 'イシャー' },
  de: { fajr: 'Fadschr', sunrise: 'Sonnenaufgang', dhuhr: 'Zuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  fr: { fajr: 'Fajr', sunrise: 'Lever du soleil', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  es: { fajr: 'Fajr', sunrise: 'Amanecer', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
  tr: { fajr: 'Sabah', sunrise: 'Güneş', dhuhr: 'Öğle', asr: 'İkindi', maghrib: 'Akşam', isha: 'Yatsı' },
  ur: { fajr: 'فجر', sunrise: 'طلوع آفتاب', dhuhr: 'ظہر', asr: 'عصر', maghrib: 'مغرب', isha: 'عشاء' },
  id: { fajr: 'Subuh', sunrise: 'Terbit', dhuhr: 'Dzuhur', asr: 'Ashar', maghrib: 'Maghrib', isha: 'Isya' },
  bn: { fajr: 'ফজর', sunrise: 'সূর্যোদয়', dhuhr: 'জোহর', asr: 'আসর', maghrib: 'মাগরিব', isha: 'এশা' },
  pt: { fajr: 'Fajr', sunrise: 'Nascer do sol', dhuhr: 'Dhuhr', asr: 'Asr', maghrib: 'Maghrib', isha: 'Isha' },
};

export const HIJRI_MONTHS: Record<AppLanguage, string[]> = {
  ar: ['مُحَرَّم', 'صَفَر', 'رَبِيع الأَوَّل', 'رَبِيع الثَّانِي', 'جُمَادَى الأُولَى', 'جُمَادَى الثَّانِيَة', 'رَجَب', 'شَعْبَان', 'رَمَضَان', 'شَوَّال', 'ذُو الْقِعْدَة', 'ذُو الْحِجَّة'],
  en: ['Muharram', 'Safar', 'Rabi al-Awwal', 'Rabi al-Thani', 'Jumada al-Awwal', 'Jumada al-Thani', 'Rajab', "Sha'ban", 'Ramadan', 'Shawwal', "Dhu al-Qi'dah", 'Dhu al-Hijjah'],
  // ... (all 15 languages have full 12 month names)
};

export const HIJRI_SUFFIX: Record<AppLanguage, string> = {
  ar: 'هـ',
  en: 'AH',
  // ... (all 15 languages)
  ur: 'ھ',
  id: 'H',
  bn: 'হি',
};

export function getPrayerNames(lang: AppLanguage) {
  return PRAYER_NAMES[lang] || PRAYER_NAMES.en;
}

export function getHijriMonthName(lang: AppLanguage, monthIndex: number): string {
  const months = HIJRI_MONTHS[lang] || HIJRI_MONTHS.en;
  return months[Math.max(0, Math.min(11, monthIndex))];
}

export function getHijriSuffix(lang: AppLanguage): string {
  return HIJRI_SUFFIX[lang] || 'AH';
}
```

### Key Functions

- **`getPrayerNames(lang)`**: Returns an object with 6 prayer names in the target language.
- **`getHijriMonthName(lang, monthIndex)`**: Returns the Hijri month name at the given 0-based index.
- **`getHijriSuffix(lang)`**: Returns the Hijri year suffix (e.g., `"AH"` for English, `"هـ"` for Arabic).

---

## 5. Quran Translations Service (Per-Surah API)

**File:** `src/services/quranTranslations.ts`

This service fetches Quran translations per-surah from the `fawazahmed0/quran-api` CDN. Unlike content translation (which uses MyMemory), Quran translations use **official scholarly translations** hosted on a CDN.

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage } from '../i18n/translations';

const QURAN_TRANSLATION_PREFIX = '@quran_translation_';
const TRANSLATION_FETCHED_FLAG = '@quran_translation_fetched_';

export const QURAN_EDITIONS: Record<AppLanguage, string | null> = {
  ar: null,    // Arabic uses original text
  en: null,    // English uses bundled English text
  zh: 'zho-majian',
  hi: 'hin-maulanaazizulha',
  ru: 'rus-elmirkuliev',
  ko: 'kor-hamidchoi',
  ja: 'jpn-ryoichimita',
  de: 'deu-amirzaidan',
  fr: 'fra-muhammadhamidul',
  es: 'spa-islamicfoundati',
  tr: 'tur-diyanetvakfi',
  ur: 'urd-muhammadtaqiusm',
  id: 'ind-indonesianislam',
  bn: 'ben-muhiuddinkhan',
  pt: 'por-helminasr',
};

const API_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions';

export async function fetchAndCacheSurahTranslation(
  lang: AppLanguage,
  surahNumber: number
): Promise<string[] | null> {
  const edition = QURAN_EDITIONS[lang];
  if (!edition) return null;

  const cacheKey = `${QURAN_TRANSLATION_PREFIX}${lang}`;

  try {
    // Check if this specific surah is already cached
    const cached = await AsyncStorage.getItem(`${cacheKey}_${surahNumber}`);
    if (cached) {
      return JSON.parse(cached) as string[];
    }

    // Fetch from API per-surah
    const url = `${API_BASE}/${edition}/${surahNumber}.json`;
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Failed to fetch ${edition}/${surahNumber}`);
    const data = await response.json();

    // API returns { chapter: [{ chapter, verse, text }, ...] }
    const verses: string[] = [];
    if (data.chapter && Array.isArray(data.chapter)) {
      for (const v of data.chapter) {
        verses.push(v.text);
      }
    }

    if (verses.length === 0) return null;

    // Cache this surah's translation
    await AsyncStorage.setItem(`${cacheKey}_${surahNumber}`, JSON.stringify(verses));
    return verses;
  } catch (error) {
    console.error(`Failed to fetch Quran translation for ${lang} surah ${surahNumber}:`, error);
    return null;
  }
}

export async function getQuranTranslation(
  lang: AppLanguage,
  surahNumber: number
): Promise<string[] | null> {
  if (lang === 'ar' || lang === 'en') return null;

  const cacheKey = `${QURAN_TRANSLATION_PREFIX}${lang}`;

  try {
    // Check per-surah cache first
    const cached = await AsyncStorage.getItem(`${cacheKey}_${surahNumber}`);
    if (cached) {
      return JSON.parse(cached) as string[];
    }

    // Not cached, fetch from API
    return await fetchAndCacheSurahTranslation(lang, surahNumber);
  } catch {
    return null;
  }
}

export async function preloadQuranTranslation(lang: AppLanguage): Promise<void> {
  if (lang === 'ar' || lang === 'en') return;

  try {
    await fetchAndCacheSurahTranslation(lang, 1);
    await AsyncStorage.setItem(getFlagKey(lang), 'true');
  } catch (error) {
    console.error(`Failed to preload Quran translation for ${lang}:`, error);
  }
}
```

### Quran Editions Mapping

Each language maps to a specific scholarly translation edition:

| Language | Edition ID | Scholar/Source |
|----------|-----------|----------------|
| Chinese | `zho-majian` | Ma Jian |
| Hindi | `hin-maulanaazizulha` | Maulana Azizul Haque |
| Russian | `rus-elmirkuliev` | Elmir Kuliev |
| Korean | `kor-hamidchoi` | Hamid Choi |
| Japanese | `jpn-ryoichimita` | Ryoichi Mita |
| German | `deu-amirzaidan` | Amir Zaidan |
| French | `fra-muhammadhamidul` | Muhammad Hamidullah |
| Spanish | `spa-islamicfoundati` | Islamic Foundation |
| Turkish | `tur-diyanetvakfi` | Diyanet Vakfi |
| Urdu | `urd-muhammadtaqiusm` | Muhammad Taqi Usmani |
| Indonesian | `ind-indonesianislam` | Indonesian Islamic Society |
| Bengali | `ben-muhiuddinkhan` | Muhiuddin Khan |
| Portuguese | `por-helminasr` | Helmi Nasr |

### Caching Strategy

- Cache key format: `@quran_translation_{lang}_{surahNumber}` (e.g., `@quran_translation_ru_2`).
- Each surah is cached independently as a JSON array of verse strings.
- On language change, `preloadQuranTranslation` fetches Surah 1 (Al-Fatiha) as a connectivity test.

---

## 6. Scientific Miracles Screen

**File:** `src/screens/ScientificMiraclesScreen.tsx`
**Data:** `src/data/scientific_miracles.json`

### Data Structure

The JSON contains 50 miracles, each with:
- `id`, `title_en`, `title_ar`
- `quran_en`, `quran_ar` (Quranic verse text)
- `reference_en`, `reference_ar` (Surah reference)
- `science_en`, `science_ar` (Scientific explanation)
- `source_en`, `source_ar` (Scientific paper/source reference)

Plus ending messages: `ending_message_en` and `ending_message_ar`.

### Translation Logic

```typescript
const isArabicUI = appLanguage === 'ar';
const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';

const [translatedMiracles, setTranslatedMiracles] = useState<Record<number, {
  title: string; quran: string; reference: string;
  science: string; source: string; ending: string;
}>>({});

useEffect(() => {
  if (!needsTranslation) return;
  let cancelled = false;
  (async () => {
    const result: Record<number, { ... }> = {};
    for (const miracle of miraclesData.miracles) {
      if (cancelled) return;
      const [title, quran, reference, science, source] = await Promise.all([
        translateText(miracle.title_en, appLanguage),
        translateText(miracle.quran_en, appLanguage),
        translateText(miracle.reference_en, appLanguage),
        translateText(miracle.science_en, appLanguage),
        translateText(miracle.source_en || '', appLanguage),
      ]);
      result[miracle.id] = { title, quran, reference, science, source, ending: '' };
    }
    const endingMsg = await translateText(miraclesData.ending_message_en || '', appLanguage);
    if (cancelled) return;
    result[-1] = { title: '', quran: '', reference: '', science: '', source: '', ending: endingMsg };
    setTranslatedMiracles(result);
  })();
  return () => { cancelled = true; };
}, [appLanguage, needsTranslation]);
```

### How Translation Works

1. When `needsTranslation` is `true` (non-AR/non-EN language), a `useEffect` triggers.
2. For each of the 50 miracles, it translates 5 fields in parallel using `Promise.all`:
   - `title_en` → translated title
   - `quran_en` → translated Quran verse
   - `reference_en` → translated reference
   - `science_en` → translated scientific explanation
   - `source_en` → translated source
3. After all miracles are translated, the ending message is translated and stored at key `-1`.
4. Results are stored in `translatedMiracles` state, keyed by miracle ID.
5. A `cancelled` flag prevents state updates if the component unmounts or language changes.

### UI Rendering

Each miracle card renders:

```tsx
{/* Title */}
<Text style={[styles.miracleTitle, { color: c.primary }]}>
  {isArabicUI ? item.title_ar
    : (needsTranslation ? (translatedMiracles[item.id]?.title || item.title_en) : item.title_en)}
</Text>

{/* Quran verse box */}
<View style={[styles.verseBox, ...]}>
  {showArabic && (
    <Text style={[styles.quranArabic, { color: c.text }]}>{item.quran_ar}</Text>
  )}
  {showTranslation && (
    <Text style={[styles.quranEnglish, ...]}>
      "{needsTranslation ? (translatedMiracles[item.id]?.quran || item.quran_en) : item.quran_en}"
    </Text>
  )}
  <Text style={[styles.reference, ...]}>
    {isArabicUI ? item.reference_ar
      : (needsTranslation ? (translatedMiracles[item.id]?.reference || item.reference_en) : item.reference_en)}
  </Text>
</View>

{/* Science explanation */}
{showTranslation && (
  <Text style={[styles.scienceText, ...]}>
    {needsTranslation ? (translatedMiracles[item.id]?.science || item.science_en) : item.science_en}
  </Text>
)}
{showArabic && (
  <Text style={[styles.scienceTextAr, ...]}>{item.science_ar}</Text>
)}

{/* Scientific source reference */}
{showTranslation && item.source_en && (
  <View style={[styles.sourceBox, ...]}>
    <Text>
      {needsTranslation ? (translatedMiracles[item.id]?.source || item.source_en) : item.source_en}
    </Text>
  </View>
)}
{showArabic && item.source_ar && (
  <View style={[styles.sourceBox, ...]}>
    <Text>{item.source_ar}</Text>
  </View>
)}
```

### Ending Message Rendering (ListFooterComponent)

```tsx
ListFooterComponent={
  <View style={[styles.endingMessage, { backgroundColor: c.surface }]}>
    <View style={[styles.endingIcon, { backgroundColor: c.primary + '20' }]}>
      <Ionicons name="heart" size={32} color={c.primary} />
    </View>
    {showTranslation && (
      <Text style={[styles.endingText, { color: c.text }]}>
        {needsTranslation
          ? (translatedMiracles[-1]?.ending || miraclesData.ending_message_en)
          : miraclesData.ending_message_en}
      </Text>
    )}
    {showArabic && (
      <Text style={[styles.endingTextAr, { color: c.text }]}>
        {miraclesData.ending_message_ar}
      </Text>
    )}
  </View>
}
```

### Language Behavior Summary

| Language | Title | Quran Verse | Reference | Science | Source | Ending |
|----------|-------|-------------|-----------|---------|--------|--------|
| Arabic | `title_ar` | `quran_ar` + `quran_en` (English shown as translation) | `reference_ar` | `science_ar` | `source_ar` | `ending_message_ar` |
| English | `title_en` | `quran_ar` + `quran_en` | `reference_en` | `science_en` | `source_en` | `ending_message_en` |
| Others | Translated `title_en` | `quran_ar` + Translated `quran_en` | Translated `reference_en` | Translated `science_en` | Translated `source_en` | Translated `ending_message_en` |

---

## 7. Prayer Times Screen

**File:** `src/screens/PrayerTimesScreen.tsx`

### Translation Approach

Prayer Times uses **static localized strings** from `contentTranslations.ts` — no API calls needed. This ensures instant display and full offline support.

### Key Code

```typescript
import { getPrayerNames, getHijriMonthName, getHijriSuffix } from '../services/contentTranslations';

const isArabicUI = appLanguage === 'ar';
```

### Prayer Name Localization

```typescript
const prayerNames = getPrayerNames(appLanguage);
const times: PrayerTime[] = [
  { name_ar: prayerNames.fajr, name_en: prayerNames.fajr, icon: 'time-outline', time: formatTime(prayerTimes.fajr) },
  { name_ar: prayerNames.sunrise, name_en: prayerNames.sunrise, icon: 'sunny-outline', time: formatTime(prayerTimes.sunrise) },
  { name_ar: prayerNames.dhuhr, name_en: prayerNames.dhuhr, icon: 'sunny', time: formatTime(prayerTimes.dhuhr) },
  { name_ar: prayerNames.asr, name_en: prayerNames.asr, icon: 'cloudy-outline', time: formatTime(prayerTimes.asr) },
  { name_ar: prayerNames.maghrib, name_en: prayerNames.maghrib, icon: 'moon-outline', time: formatTime(prayerTimes.maghrib) },
  { name_ar: prayerNames.isha, name_en: prayerNames.isha, icon: 'moon', time: formatTime(prayerTimes.isha) },
];
```

### Hijri Date Localization

```typescript
setHijriDate(
  `${hd} ${getHijriMonthName(appLanguage, monthIdx)} ${1391 + n} ${getHijriSuffix(appLanguage)}`
);
```

Example outputs:
- English: `15 Ramadan 1446 AH`
- Arabic: `١٥ رَمَضَان ١٤٤٦ هـ`
- Russian: `15 Рамадан 1446 AH`
- Turkish: `15 Ramazan 1446 AH`

### Calculation Method Auto-Detection

The screen auto-selects the prayer calculation method based on the user's GPS coordinates:

```typescript
if (lat > 23 && lat < 32 && lng > 35 && lng < 52) {
  params = adhan.CalculationMethod.UmmAlQura();      // Saudi Arabia
} else if (lat > 22 && lat < 27 && lng > 50 && lng < 57) {
  params = adhan.CalculationMethod.Dubai();           // UAE
} else if (lat > 24 && lat < 27 && lng > 50 && lng < 52) {
  params = adhan.CalculationMethod.Qatar();           // Qatar
} else if (lat > 25 && lat < 40 && lng > 44 && lng < 64) {
  params = adhan.CalculationMethod.Tehran();          // Iran
} else if (lat > 15 && lat < 40 && lng > 60 && lng < 100) {
  params = adhan.CalculationMethod.Karachi();         // South Asia
} else if (lat > 20 && lat < 32 && lng > 25 && lng < 35) {
  params = adhan.CalculationMethod.Egyptian();        // Egypt
} else if (lat > 24 && lat < 70 && lng > -170 && lng < -50) {
  params = adhan.CalculationMethod.NorthAmerica();    // North America
} else {
  params = adhan.CalculationMethod.MuslimWorldLeague(); // Default
}
```

### UI Rendering

```tsx
<Text style={[styles.prayerName, { color: c.text }]}>
  {prayer.name_en}  {/* Already localized via getPrayerNames */}
</Text>
```

### UI Strings

UI labels (header title, loading text, permission dialogs) use `isArabicUI` ternary:

```tsx
{isArabicUI ? 'أوقات الصلاة' : t('prayerTimes')}
{isArabicUI ? 'جارٍ حساب أوقات الصلاة...' : t('calculatingPrayer')}
```

---

## 8. Qibla Screen

**File:** `src/screens/QiblaScreen.tsx`
**Utility:** `src/utils/qiblaCalc.ts`

### Translation Approach

Qibla screen uses `isArabicUI` ternary for all UI strings. No content translation API is needed since all text is either Arabic or English UI labels.

### Key Translation Pattern

```typescript
const isArabicUI = appLanguage === 'ar';

// Header
{isArabicUI ? 'اتجاه القبلة' : t('qibla')}

// Loading
{isArabicUI ? 'جاري تحديد اتجاه القبلة...' : t('determiningQibla')}

// Alignment status
{isAligned ? (
  <Text>{isArabicUI ? 'أنت تواجه القبلة' : 'Facing Qibla'}</Text>
) : isNearAligned ? (
  <Text>{isArabicUI
    ? `اقترب! استدر ${relativeAngle < 180 ? 'يسار' : 'يمين'} قليلاً`
    : `Almost there! Turn ${relativeAngle < 180 ? 'left' : 'right'} slightly`}</Text>
) : (
  <Text>{isArabicUI
    ? `استدر ${relativeAngle < 180 ? 'يسار' : 'يمين'}`
    : `Turn ${relativeAngle < 180 ? 'left' : 'right'}`}</Text>
)}

// Instructions
{isArabicUI
  ? 'أمسك الهاتف مسطحاً ووجّه أعلى الهاتف للأمام. أدر جسمك ببطء حتى يصبح أيقونة الكعبة في الأعلى وتتحول إلى اللون الأخضر.'
  : 'Hold your phone flat with the top pointing forward. Rotate your body slowly until the Kaaba icon reaches the top and turns green.'}
```

### Compass Heading Sources (Priority Order)

1. **`Location.watchHeadingAsync`** (preferred): Uses the device's GPS/magnetometer fusion for true heading.
   - If `trueHeading >= 0`, uses it directly.
   - If `trueHeading < 0` (unavailable), uses `magHeading + declination`.

2. **`Magnetometer` sensor** (fallback): Raw magnetometer data.
   - Calculates angle: `Math.atan2(data.x, data.y) * (180 / Math.PI)`.
   - Applies declination correction: `(angle + declinationRef.current + 360) % 360`.
   - Detects calibration need: if `horizontalMag / totalMag < 0.5`.

### Heading Smoothing

```typescript
const applyHeading = (rawHeading: number) => {
  const history = headingHistoryRef.current;
  history.push(rawHeading);
  if (history.length > 5) history.shift();

  const sorted = [...history].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];

  setHeading((prev) => {
    let diff = median - prev;
    if (diff > 180) diff -= 360;
    if (diff < -180) diff += 360;
    return (prev + diff * 0.3 + 360) % 360;
  });
};
```

- Maintains a 5-sample history.
- Uses median filtering to remove spikes.
- Applies 30% interpolation for smooth rotation.

### Magnetic Declination (3-Tier Fallback)

1. **NOAA IGRF API** (online, most accurate):
   ```typescript
   const url = `https://www.ngdc.noaa.gov/geomag-web/calculators/calculateIgrf?lat1=${lat}&lon1=${lng}&model=IGRF&startYear=2025&endYear=2025&resultFormat=json`;
   ```
   Cached in AsyncStorage with key `@mag_declination_{lat}_{lng}`.

2. **Dipole approximation** (offline fallback): `getMagneticDeclination()` in `qiblaCalc.ts`.

3. **Zero declination** (ultimate fallback): If both fail, declination defaults to 0.

### Compass UI

- **Rotating dial**: The compass circle rotates by `-heading` degrees (counter-rotates as user turns).
- **Kaaba indicator**: Positioned at `qiblaBearing` degrees on the dial, rotates with the compass.
- **Top pointer**: Fixed triangle at the top of the compass.
- **Cardinal labels**: N, S, E, W positioned at 0°, 180°, 90°, 270°.
- **Tick marks**: Every 30°, with larger marks at cardinal directions (0°, 90°, 180°, 270°).
- **Color feedback**: Green when aligned (< 4°), orange when near (< 15°), primary color otherwise.

### Info Cards

```tsx
{/* Qibla angle from North */}
<Text>{qiblaBearing.toFixed(1)}° {getCardinalDirection(qiblaBearing)}</Text>

{/* Current heading */}
<Text>{Math.round(heading)}° {getCardinalDirection(heading)}</Text>

{/* Distance to Kaaba */}
<Text>{distance.toLocaleString()} {t('km')}</Text>

{/* GPS coordinates */}
<Text>GPS: {coords.lat.toFixed(4)}°, {coords.lng.toFixed(4)}°</Text>
```

---

## 9. Islamic Months Screen

**File:** `src/screens/IslamicMonthsScreen.tsx`

### Translation Approach

Uses **static localized Hijri month names** from `contentTranslations.ts` — no API calls.

### Key Code

```typescript
import { HIJRI_MONTHS, getHijriMonthName, getHijriSuffix } from '../services/contentTranslations';

const isArabicUI = appLanguage === 'ar';

// Today's Hijri date
<Text style={styles.todayDate}>
  {todayHijri.day} {getHijriMonthName(appLanguage, todayHijri.month - 1)} {todayHijri.year} {getHijriSuffix(appLanguage)}
</Text>

// Month list
const months = hijriMonths.map((name_en, idx) => ({
  number: idx + 1,
  name_en: getHijriMonthName(appLanguage, idx),  // Localized month name
  name_ar: hijriMonthsAr[idx],
  events: islamicEvents.filter(e => e.month === idx + 1),
}));
```

### UI Rendering

```tsx
{/* Month name */}
<Text style={[styles.monthEnglish, { color: c.text }]}>{item.name_en}</Text>

{/* Event names */}
<Text style={[styles.eventName, { color: c.textSecondary }]}>
  {isArabicUI ? event.name_ar : event.name_en}
</Text>
```

### View Modes

The screen has two tabs:
1. **Calendar tab**: Shows all 12 Hijri months with events.
2. **Events tab**: Shows upcoming Islamic events within 20 days, with both Hijri and Gregorian dates.

### Country Picker

A modal with search functionality for selecting a country (uses `countries.json` data with `name_ar` and `name_en` fields):

```tsx
<Text style={[styles.countryName, { color: c.text }]}>
  {isArabicUI ? item.name_ar : item.name_en}
</Text>
```

---

## 10. Hadith Screen

**File:** `src/screens/HadithScreen.tsx`
**Data:** `src/data/hadith_offline.json`

### Data Structure

The JSON contains Hadith collections organized by book, each with:
- `name_ar`, `name_en` (book name)
- `count` (number of hadiths)
- `hadiths[]` array with: `number`, `arabic`, `english`

### Translation Logic

```typescript
const isArabicUI = appLanguage === 'ar';
const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';

const [translatedBooks, setTranslatedBooks] = useState<Record<string, string>>({});
const [translatedHadiths, setTranslatedHadiths] = useState<Record<string, string>>({});

// Translate book names on mount
useEffect(() => {
  if (!needsTranslation) return;
  let cancelled = false;
  (async () => {
    const bookMap: Record<string, string> = {};
    for (const book of books) {
      const translated = await translateText(book.name_en, appLanguage);
      if (cancelled) return;
      bookMap[book.id] = translated;
    }
    if (!cancelled) setTranslatedBooks(bookMap);
  })();
  return () => { cancelled = true; };
}, [appLanguage, needsTranslation]);

// Translate hadith texts when a book is selected
useEffect(() => {
  if (!needsTranslation || !selectedBook) return;
  let cancelled = false;
  const book = books.find(b => b.id === selectedBook);
  if (!book) return;
  (async () => {
    const newHadiths: Record<string, string> = {};
    for (const hadith of book.hadiths) {
      if (cancelled) return;
      const key = `${selectedBook}_${hadith.number}`;
      if (translatedHadiths[key]) { newHadiths[key] = translatedHadiths[key]; continue; }
      const translated = await translateText(hadith.english || '', appLanguage);
      newHadiths[key] = translated;
    }
    if (!cancelled) setTranslatedHadiths(prev => ({ ...prev, ...newHadiths }));
  })();
  return () => { cancelled = true; };
}, [selectedBook, needsTranslation, appLanguage]);
```

### Two-Phase Translation

1. **Phase 1 (on mount)**: Translate all book names (small number, fast).
2. **Phase 2 (on book selection)**: Translate all hadith texts in the selected book (lazy loading — only when user opens a book).

### UI Rendering

```tsx
{/* Book list */}
<Text style={[styles.bookTitle, ...]}>
  {isArabicUI ? item.name_ar
    : (needsTranslation ? (translatedBooks[item.id] || item.name_en) : item.name_en)}
</Text>

{/* Hadith text */}
{showArabic && item.arabic ? (
  <Text style={[styles.arabicText, ...]}>{item.arabic}</Text>
) : null}
{showTranslation && item.english ? (
  <Text style={[styles.englishText, ...]}>
    {isArabicUI ? item.english
      : (needsTranslation
          ? (translatedHadiths[`${selectedBook}_${item.number}`] || item.english)
          : item.english)}
  </Text>
) : null}
```

### Offline Badge

```tsx
<View style={[styles.offlineBadge, ...]}>
  <Ionicons name="cloud-offline-outline" size={18} color={c.primary} />
  <Text>
    {isArabicUI ? 'يعمل بدون إنترنت — جميع الأحاديث محفوظة في التطبيق'
      : t('worksOfflineHadith')}
  </Text>
</View>
```

---

## 11. Azkar Screen

**File:** `src/screens/AzkarScreen.tsx`
**Data:** `src/data/azkar.json`

### Data Structure

The JSON contains categories with items:
- Categories: `id`, `category_ar`, `category_en`, `items[]`
- Items: `text_ar`, `text_en`, `count`, `source_ar`, `source_en`

### Translation Logic

```typescript
const isArabicUI = appLanguage === 'ar';
const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';

const [translatedCategories, setTranslatedCategories] = useState<Record<number, string>>({});
const [translatedItems, setTranslatedItems] = useState<Record<string, {
  text: string; source: string; category: string;
}>>({});

// Translate category names on mount
useEffect(() => {
  if (!needsTranslation) return;
  let cancelled = false;
  (async () => {
    const catMap: Record<number, string> = {};
    for (const cat of categories) {
      const translated = await translateText(cat.category_en, appLanguage);
      if (cancelled) return;
      catMap[cat.id] = translated;
    }
    if (!cancelled) setTranslatedCategories(catMap);
  })();
  return () => { cancelled = true; };
}, [appLanguage, needsTranslation]);

// Translate items when a category is selected
useEffect(() => {
  if (!needsTranslation || selectedCategory === null) return;
  let cancelled = false;
  const category = categories.find(cat => cat.id === selectedCategory);
  if (!category) return;
  (async () => {
    const newItems: Record<string, { text: string; source: string; category: string }> = {};
    for (let i = 0; i < category.items.length; i++) {
      if (cancelled) return;
      const item = category.items[i];
      const key = `${selectedCategory}_${i}`;
      if (translatedItems[key]) {
        newItems[key] = translatedItems[key];
        continue;
      }
      const [text, source] = await Promise.all([
        translateText(item.text_en, appLanguage),
        translateText(item.source_en, appLanguage),
      ]);
      newItems[key] = { text, source, category: '' };
    }
    if (!cancelled) setTranslatedItems(prev => ({ ...prev, ...newItems }));
  })();
  return () => { cancelled = true; };
}, [selectedCategory, needsTranslation, appLanguage]);
```

### Two-Phase Translation (Same as Hadith)

1. **Phase 1**: Translate all 12 category names on mount.
2. **Phase 2**: Translate items in the selected category (lazy loading).
3. Already-translated items are preserved (cache check: `if (translatedItems[key]) { ... continue; }`).

### Search Functionality

The search works across both Arabic and English text:

```typescript
const filteredCategories = useMemo(() => {
  if (!searchQuery.trim()) return categories;
  const q = searchQuery.toLowerCase();
  return categories.filter(
    (cat) =>
      cat.category_ar.includes(searchQuery) ||
      cat.category_en.toLowerCase().includes(q) ||
      cat.items.some(
        (item) =>
          item.text_ar.includes(searchQuery) ||
          item.text_en.toLowerCase().includes(q)
      )
  );
}, [categories, searchQuery]);
```

### Category Icons

Each category has a specific icon and color:

```typescript
const CATEGORY_ICONS: Record<number, { icon: keyof typeof Ionicons.glyphMap; bg: string }> = {
  1: { icon: 'sunny-outline', bg: '#FF9500' },   // Morning
  2: { icon: 'moon-outline', bg: '#5B7FFF' },     // Evening
  3: { icon: 'checkmark-circle-outline', bg: '#34C759' }, // After prayer
  4: { icon: 'bed-outline', bg: '#5856D6' },       // Sleep
  5: { icon: 'alarm-outline', bg: '#FF2D55' },     // Wake up
  6: { icon: 'airplane-outline', bg: '#00C7BE' },  // Travel
  7: { icon: 'restaurant-outline', bg: '#FF9500' }, // Food
  8: { icon: 'heart-outline', bg: '#FF3B30' },      // Protection
  9: { icon: 'home-outline', bg: '#007AFF' },       // Home
  10: { icon: 'medkit-outline', bg: '#FF2D55' },    // Healing
  11: { icon: 'star-outline', bg: '#AF52DE' },      // Various
  12: { icon: 'ellipsis-horizontal-circle-outline', bg: '#8E8E93' }, // Other
};
```

### UI Rendering

```tsx
{/* Category name */}
<Text style={[styles.categoryTitle, ...]}>
  {isArabicUI ? item.category_ar
    : (needsTranslation ? (translatedCategories[item.id] || item.category_en) : item.category_en)}
</Text>

{/* Item text */}
{showArabic && (
  <Text style={[styles.arabicText, ...]}>{item.text_ar}</Text>
)}
{showTranslation && (
  <Text style={[styles.englishText, ...]}>
    {isArabicUI ? item.text_en
      : (needsTranslation ? (translatedItems[itemKey]?.text || item.text_en) : item.text_en)}
  </Text>
)}

{/* Source */}
<Text style={[styles.sourceText, ...]}>
  {isArabicUI ? item.source_ar
    : (needsTranslation ? (translatedItems[itemKey]?.source || item.source_en) : item.source_en)}
</Text>
```

---

## 12. Prophet Sunnah Screen

**File:** `src/screens/SunnahScreen.tsx`
**Data:** `src/data/sunnah.json`

### Data Structure

The JSON contains categories with items:
- Categories: `id`, `category_ar`, `category_en`, `items[]`
- Items: `text_ar`, `text_en`, `source_ar`, `source_en`

### Translation Logic

Identical pattern to Azkar and Hadith — two-phase lazy loading:

```typescript
const isArabicUI = appLanguage === 'ar';
const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';

const [translatedCategories, setTranslatedCategories] = useState<Record<number, string>>({});
const [translatedItems, setTranslatedItems] = useState<Record<string, { text: string; source: string }>>({});

// Phase 1: Translate category names
useEffect(() => {
  if (!needsTranslation) return;
  let cancelled = false;
  (async () => {
    const catMap: Record<number, string> = {};
    for (const cat of categories) {
      const translated = await translateText(cat.category_en, appLanguage);
      if (cancelled) return;
      catMap[cat.id] = translated;
    }
    if (!cancelled) setTranslatedCategories(catMap);
  })();
  return () => { cancelled = true; };
}, [appLanguage, needsTranslation]);

// Phase 2: Translate items when category is selected
useEffect(() => {
  if (!needsTranslation || selectedCategory === null) return;
  let cancelled = false;
  const category = categories.find(cat => cat.id === selectedCategory);
  if (!category) return;
  (async () => {
    const newItems: Record<string, { text: string; source: string }> = {};
    for (let i = 0; i < category.items.length; i++) {
      if (cancelled) return;
      const item = category.items[i];
      const key = `${selectedCategory}_${i}`;
      if (translatedItems[key]) { newItems[key] = translatedItems[key]; continue; }
      const [text, source] = await Promise.all([
        translateText(item.text_en, appLanguage),
        translateText(item.source_en, appLanguage),
      ]);
      newItems[key] = { text, source };
    }
    if (!cancelled) setTranslatedItems(prev => ({ ...prev, ...newItems }));
  })();
  return () => { cancelled = true; };
}, [selectedCategory, needsTranslation, appLanguage]);
```

### UI Rendering

```tsx
{/* Category list */}
<Text style={[styles.categoryTitle, ...]}>
  {isArabicUI ? item.category_ar
    : (needsTranslation ? (translatedCategories[item.id] || item.category_en) : item.category_en)}
</Text>
<Text style={[styles.categoryCount, ...]}>
  {item.items.length} {t('sunnahs')}
</Text>

{/* Item detail */}
{showArabic && (
  <Text style={[styles.arabicText, ...]}>{item.text_ar}</Text>
)}
{showTranslation && (
  <Text style={[styles.englishText, ...]}>
    {isArabicUI ? item.text_en
      : (needsTranslation ? (translatedItems[itemKey]?.text || item.text_en) : item.text_en)}
  </Text>
)}
<Text style={[styles.source, ...]}>
  {isArabicUI ? item.source_ar
    : (needsTranslation ? (translatedItems[itemKey]?.source || item.source_en) : item.source_en)}
</Text>
```

---

## 13. Questions & Answers Screen

**File:** `src/screens/QAScreen.tsx`
**Data:** `src/data/qa_non_muslims.json`

### Data Structure

The JSON contains questions with:
- `id`, `question_ar`, `question_en`
- `answer_ar`, `answer_en`
- `reference_ar`, `reference_en`

### Translation Logic

Unlike Azkar/Hadith/Sunnah, Q&A translates **all items upfront** (no drill-down needed — questions are visible immediately):

```typescript
const isArabicUI = appLanguage === 'ar';
const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';

const [translatedQA, setTranslatedQA] = useState<Record<number, {
  question: string; answer: string; reference: string;
}>>({});

useEffect(() => {
  if (!needsTranslation) return;
  let cancelled = false;
  (async () => {
    const result: Record<number, { question: string; answer: string; reference: string }> = {};
    for (const qa of qaData.questions) {
      if (cancelled) return;
      const [question, answer, reference] = await Promise.all([
        translateText(qa.question_en, appLanguage),
        translateText(qa.answer_en, appLanguage),
        translateText(qa.reference_en || '', appLanguage),
      ]);
      result[qa.id] = { question, answer, reference };
    }
    if (!cancelled) setTranslatedQA(result);
  })();
  return () => { cancelled = true; };
}, [appLanguage, needsTranslation]);
```

### UI Rendering (Expandable Q&A)

```tsx
{/* Question (always visible) */}
<Text style={[styles.question, ...]}>
  {isArabicUI ? item.question_ar
    : (needsTranslation ? (translatedQA[item.id]?.question || item.question_en) : item.question_en)}
</Text>

{/* Answer (visible when expanded) */}
{isExpanded && (
  <View style={styles.answerContainer}>
    {showTranslation && (
      <Text style={[styles.answer, ...]}>
        {needsTranslation ? (translatedQA[item.id]?.answer || item.answer_en) : item.answer_en}
      </Text>
    )}
    {showArabic && (
      <Text style={[styles.answerAr, ...]}>{item.answer_ar}</Text>
    )}
    {/* Reference box */}
    {showTranslation && item.reference_en && (
      <View style={[styles.refBox, ...]}>
        <Text>
          {needsTranslation ? (translatedQA[item.id]?.reference || item.reference_en) : item.reference_en}
        </Text>
      </View>
    )}
    {showArabic && item.reference_ar && (
      <View style={[styles.refBox, ...]}>
        <Text>{item.reference_ar}</Text>
      </View>
    )}
  </View>
)}
```

---

## 14. Support Us Screen

**File:** `src/screens/SupportUsScreen.tsx`

### Translation Approach

Support Us uses `isArabicUI` ternary for all text — no content translation API needed. All strings are either Arabic or English, using the `t()` function for UI labels.

### Key Code

```typescript
const isArabicUI = appLanguage === 'ar';

// Header
{isArabicUI ? 'ادعمنا' : t('supportUs')}

// Support message
{isArabicUI
  ? 'ادعمنا للاستمرار في تقديم المحتوى الإسلامي'
  : t('supportTitle')}

{isArabicUI
  ? 'إذا أردت دعم التطبيق ومساعدتنا على الاستمرار في تقديم المحتوى الإسلامي، يمكنك التبرع عبر الروابط أدناه أو مشاهدة الإعلانات. دعمك يعني الكثير لنا.'
  : 'If you would like to support this app and help us continue providing Islamic content, you can donate via the links below or watch ads. Your support means a lot to us.'}

// Section labels
{isArabicUI ? 'التبرع المباشر' : 'Direct Donation'}
{isArabicUI ? 'شاهد إعلانات لدعم التطبيق' : 'Watch Ads to Support Us'}

// Copy button feedback
{copiedField === 'skrill'
  ? (isArabicUI ? 'تم النسخ' : 'Copied')
  : (isArabicUI ? 'نسخ' : 'Copy')}

// Thank you
{isArabicUI ? 'جزاكم الله خيراً 🤲' : t('jazakumAllahuKhairan')}
```

### Features

- **Skrill donation**: Opens Skrill send money page, with copy-to-clipboard fallback.
- **PayPal donation**: Opens PayPal.me link, with copy-to-clipboard fallback.
- **Ad placeholder**: Ready for Google AdMob integration (currently shows placeholder).
- **Project links**: Links to shegoz.top, guidano.us, learnvexo.com.

---

## 15. About Us Screen

**File:** `src/screens/AboutUsScreen.tsx`

### Translation Approach

Same as Support Us — `isArabicUI` ternary for all text, no API translation.

### Key Code

```typescript
const isArabicUI = appLanguage === 'ar';

// Header
{isArabicUI ? 'من نحن' : t('aboutUs')}

// App subtitle
{isArabicUI ? 'تطبيق القرآن الكريم الشامل' : t('completeQuranApp')}

// Mission section
{isArabicUI ? 'مهمتنا' : t('ourMission')}
{isArabicUI
  ? 'مهمتنا توفير تطبيق قرآني شامل لكل مسلم في العالم. يحتوي التطبيق على القرآن الكريم بالكامل بالعربية والإنجليزية، الأذكار، أوقات الصلاة، القبلة، الأحاديث النبوية، الإعجاز العلمي، سنن النبي ﷺ، وأجوبة للأسئلة الشائعة عن الإسلام.'
  : 'Our mission is to provide a comprehensive Quran app for every Muslim in the world. The app includes the complete Quran in Arabic and English, Azkar, prayer times, Qibla direction, Hadith, scientific miracles, Prophet\'s Sunnah, and answers to common questions about Islam.'}

// Project links
{isArabicUI ? 'قناة اليوتيوب' : t('youtubeChannel')}
{isArabicUI ? 'مشروعنا الأول' : t('ourFirstProject')}
{isArabicUI ? 'مشروعنا الثاني' : t('ourSecondProject')}
```

### Features

- App logo and title display.
- Mission statement.
- YouTube channel link (youtube.com/@waytoallah2).
- Three project links (shegoz.top, guidano.us, learnvexo.com).
- Version label.

---

## 16. Surah Reader Screen (Quran Reading)

**File:** `src/screens/SurahReaderScreen.tsx`

### Translation Approach

The Surah Reader uses the **Quran Translations Service** (`quranTranslations.ts`) for official scholarly translations, NOT the MyMemory API. This ensures accurate, human-authored Quran translations.

### Key Variables

```typescript
const { t, appLanguage, showArabic, showTranslation, translationLabel } = useLanguage();

// Whether the selected language translation is the primary (big) text
const isTranslationPrimary = appLanguage !== 'ar';
```

### Translation Loading

```typescript
useEffect(() => {
  (async () => {
    setLoading(true);
    setError(null);
    try {
      const surahData = await fetchSurah(surahNumber);
      setData(surahData);
      saveLastSurah(surahNumber);

      // Load translation for current language (non-AR/EN)
      if (appLanguage !== 'ar' && appLanguage !== 'en') {
        const translations = await getQuranTranslation(appLanguage, surahNumber);
        setTranslationTexts(translations);
      } else {
        setTranslationTexts(null);
      }

      // Load bookmark states
      const bmSet = new Set<string>();
      for (const ayah of surahData.arabic) {
        const isBm = await isBookmarked(surahNumber, ayah.numberInSurah);
        if (isBm) bmSet.add(`${surahNumber}:${ayah.numberInSurah}`);
      }
      setBookmarkSet(bmSet);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  })();
}, [surahNumber, appLanguage]);
```

### Text Selection Functions

```typescript
const getTranslationText = (index: number): string => {
  if (appLanguage === 'ar') return '';
  if (appLanguage === 'en') return data?.english[index]?.text || '';
  return translationTexts?.[index] || data?.english[index]?.text || '';
};

const getEnglishText = (index: number): string => {
  return data?.english[index]?.text || '';
};
```

- **Arabic mode**: `getTranslationText` returns empty string (no translation shown).
- **English mode**: `getTranslationText` returns the bundled English text.
- **Other languages**: `getTranslationText` returns the API-fetched translation, falling back to English if not yet loaded.
- **`getEnglishText`**: Always returns the bundled English text (used as a secondary text below the primary translation for non-EN languages).

### Ayah Rendering (Primary/Secondary Text Logic)

```tsx
{isTranslationPrimary ? (
  <>
    {/* Selected language translation - BIG/primary */}
    {showTranslation && translationText ? (
      <Text style={[styles.primaryText, { color: c.text }]}>
        {translationText}
        {'  '}
        <Text style={[styles.ayahCirclePrimary, { color: c.primary }]}>
          {arabicAyah.numberInSurah}
        </Text>
      </Text>
    ) : null}

    {/* Arabic - smaller below */}
    {showArabic && (
      <Text style={[styles.arabicTextSecondary, ...]}>{arabicAyah.text}</Text>
    )}

    {/* English translation - smaller below Arabic (only for non-EN, non-AR) */}
    {appLanguage !== 'en' && showTranslation && getEnglishText(index) ? (
      <Text style={[styles.englishTextSecondary, ...]}>{getEnglishText(index)}</Text>
    ) : null}
  </>
) : (
  <>
    {/* Arabic - BIG/primary (for Arabic language mode) */}
    {showArabic && (
      <Text style={[styles.arabicText, ...]}>
        {arabicAyah.text}
        {' '}
        <Text style={[styles.ayahCircle, { color: c.primary }]}>
          {arabicAyah.numberInSurah}
        </Text>
      </Text>
    )}
  </>
)}
```

### Display Logic by Language

| Language | Primary (Big) | Secondary (Medium) | Tertiary (Small) |
|----------|--------------|--------------------|--------------------|
| Arabic (`ar`) | Arabic text (26px) | — | — |
| English (`en`) | English translation (22px) | Arabic text (20px) | — |
| Others (e.g., `ru`) | Selected language translation (22px) | Arabic text (20px) | English translation (14px, italic) |

### Style Definitions

```typescript
arabicText: {          // Primary Arabic (AR mode)
  fontSize: 26,
  lineHeight: 48,
  textAlign: 'right',
},
primaryText: {         // Primary translation (non-AR mode)
  fontSize: 22,
  lineHeight: 36,
},
arabicTextSecondary: { // Secondary Arabic (non-AR mode)
  fontSize: 20,
  lineHeight: 38,
  textAlign: 'right',
},
englishTextSecondary: { // Tertiary English (non-AR/non-EN mode)
  fontSize: 14,
  lineHeight: 22,
  fontStyle: 'italic',
},
```

### Language Label in Top Bar

```tsx
<View style={[styles.langBtn, ...]}>
  <Ionicons name="language" size={16} color="#fff" />
  <Text style={styles.langBtnText}>{translationLabel}</Text>
</View>
```

`translationLabel` is `appLanguage.toUpperCase()` (e.g., `"RU"`, `"FR"`, `"AR"`).

---

## 17. Qibla Calculation Utility

**File:** `src/utils/qiblaCalc.ts`

### Vincenty's Formula (WGS84 Ellipsoid)

The Qibla bearing is calculated using **Vincenty's formula** on the WGS84 ellipsoid, which is more accurate than the simple great-circle (spherical) formula, especially at high latitudes.

```typescript
const KAABA_LAT = 21.4225;
const KAABA_LNG = 39.8262;

const WGS84_A = 6378137.0;           // Semi-major axis (meters)
const WGS84_F = 1 / 298.257223563;   // Flattening
const WGS84_B = WGS84_A * (1 - WGS84_F); // Semi-minor axis

export function vincentyBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const L = ((lng2 - lng1) * Math.PI) / 180;

  const U1 = Math.atan((1 - WGS84_F) * Math.tan(phi1));
  const U2 = Math.atan((1 - WGS84_F) * Math.tan(phi2));

  // ... iterative solution until convergence (max 50 iterations)
  // Returns initial bearing (forward azimuth) in degrees (0-360)
}
```

### Great-Circle Bearing (Fallback)

```typescript
export function greatCircleBearing(
  lat1: number, lng1: number,
  lat2: number, lng2: number
): number {
  const phi1 = (lat1 * Math.PI) / 180;
  const phi2 = (lat2 * Math.PI) / 180;
  const deltaLambda = ((lng2 - lng1) * Math.PI) / 180;

  const y = Math.sin(deltaLambda) * Math.cos(phi2);
  const x = Math.cos(phi1) * Math.sin(phi2) -
            Math.sin(phi1) * Math.cos(phi2) * Math.cos(deltaLambda);

  let bearing = Math.atan2(y, x) * (180 / Math.PI);
  bearing = (bearing + 360) % 360;
  return bearing;
}
```

### getQiblaBearing (with fallback)

```typescript
export function getQiblaBearing(lat: number, lng: number): number {
  try {
    const bearing = vincentyBearing(lat, lng, KAABA_LAT, KAABA_LNG);
    if (isNaN(bearing) || !isFinite(bearing)) {
      return greatCircleBearing(lat, lng, KAABA_LAT, KAABA_LNG);
    }
    return bearing;
  } catch {
    return greatCircleBearing(lat, lng, KAABA_LAT, KAABA_LNG);
  }
}
```

### Magnetic Declination (Dipole Approximation)

```typescript
const MAG_NORTH_LAT = 86.3;
const MAG_NORTH_LNG = 166.5;

export function getMagneticDeclination(lat: number, lng: number): number {
  const bearingToMagNorth = greatCircleBearing(lat, lng, MAG_NORTH_LAT, MAG_NORTH_LNG);
  let declination = bearingToMagNorth;
  if (declination > 180) {
    declination = declination - 360;
  }
  return declination;
}
```

### Haversine Distance

```typescript
export function getDistanceKm(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371; // Earth radius in km
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
    Math.cos((lat2 * Math.PI) / 180) *
    Math.sin(dLng / 2) ** 2;
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c);
}
```

### Cardinal Direction

```typescript
export function getCardinalDirection(bearing: number): string {
  const directions = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
                       'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  const index = Math.round(bearing / 22.5) % 16;
  return directions[index];
}
```

---

## 18. Magnetic Declination Utility (IGRF-13)

**File:** `src/utils/magneticDeclination.ts`

A compact implementation of the **International Geomagnetic Reference Field (IGRF-13)** model for computing magnetic declination offline.

### How It Works

1. Uses Gauss coefficients (g and h) up to degree 4 from IGRF-13 (2020-2025 epoch).
2. Includes secular variation coefficients (dg, dh) for time extrapolation.
3. Computes Schmidt quasi-normalized associated Legendre functions.
4. Calculates field components X (north), Y (east), Z (down).
5. Returns declination as `atan2(Y, X)` in degrees.

### Gauss Coefficients

```typescript
const G_COEF = [
  [0, 0, 0, 0, 0],
  [0, -29404.5, -1450.7, 0, 0],
  [0, -2500.0, 2982.0, 1672.5, 0],
  [0, -724.1, 281.4, -640.8, 933.1],
  [0, 874.2, 639.3, 211.3, -116.3, -0.4],
];

const H_COEF = [
  [0, 0, 0, 0, 0],
  [0, 0, 4651.1, 0, 0],
  [0, 0, -2991.0, -734.8, 0],
  [0, 0, 295.3, -542.9, -532.8],
  [0, 0, 240.3, -281.9, 188.4, -328.4],
];
```

### Main Function

```typescript
export function calculateMagneticDeclination(
  latitude: number,
  longitude: number,
  date: Date = new Date()
): number {
  const year = date.getFullYear() + (date.getMonth() / 12) + (date.getDate() / 365);
  const t = year - EPOCH;  // Years since 2020.0

  // ... compute Legendre functions, apply Schmidt normalization,
  // sum Gauss coefficients with secular variation,
  // compute X, Y, Z field components

  const declination = Math.atan2(y, x) * 180 / Math.PI;
  return declination;
}
```

### Usage in Qibla Screen

The Qibla screen uses a 3-tier fallback for magnetic declination:

1. **NOAA API** (online, most accurate): Fetches from `www.ngdc.noaa.gov/geomag-web/calculators/calculateIgrf`.
2. **Dipole approximation** (offline): `getMagneticDeclination()` from `qiblaCalc.ts`.
3. **Zero** (ultimate fallback): If both fail, declination defaults to 0.

---

## 19. Updated Ending Message (Catchy Non-Muslim Hook)

**File:** `src/data/scientific_miracles.json`

### Original Phrase (User's Request)

> "if you are non muslim don't install me and please read it you won't lose anything just a couple of minutes of your time"

### Improved Catchy Phrase (English)

> **"Not a Muslim? Don't install this app — yet. But give me just 2 minutes of your time. Read what's below — you have nothing to lose, and perhaps everything to gain."**

### Improved Catchy Phrase (Arabic)

> **"لست مسلماً؟ لا تقم بتثبيت هذا التطبيق — بعد. لكن امنحني دقيقتين فقط من وقتك. اقرأ ما يلي — لن تخسر شيئاً، وربما تكسب كل شيء."**

### Why This Is More Catchy

1. **Conversational tone**: "Not a Muslim?" directly addresses the reader.
2. **Curiosity gap**: "Don't install this app — yet" creates intrigue (the "yet" implies there's a reason to stay).
3. **Low commitment**: "Just 2 minutes" reduces friction.
4. **High reward contrast**: "Nothing to lose, and perhaps everything to gain" creates a compelling risk-reward asymmetry.
5. **Personal voice**: "Give me" and "Read what's below" make the app feel like it's speaking directly to the reader.

### How It's Combined with the Existing Ending Message

The catchy hook is prepended to the existing ending message, separated by a double newline:

**English:**
```
Not a Muslim? Don't install this app — yet. But give me just 2 minutes of your time. Read what's below — you have nothing to lose, and perhaps everything to gain.

A Message to Every Truth Seeker

Dear reader, whether you are a Muslim, a non-Muslim, or someone searching for the truth — pause for a moment and reflect with an open mind and a sincere heart.

[... rest of the existing ending message continues ...]
```

**Arabic:**
```
لست مسلماً؟ لا تقم بتثبيت هذا التطبيق — بعد. لكن امنحني دقيقتين فقط من وقتك. اقرأ ما يلي — لن تخسر شيئاً، وربما تكسب كل شيء.

رسالة إلى كل باحث عن الحق

عزيزي القارئ، سواء كنت مسلماً أو غير مسلم أو تبحث عن الحقيقة — توقف لحظة وتأمل بعقل مفتوح وقلب صادق.

[... rest of the existing ending message continues ...]
```

### Rendering in ScientificMiraclesScreen

The ending message is rendered as a `ListFooterComponent` in the FlatList:

```tsx
ListFooterComponent={
  <View style={[styles.endingMessage, { backgroundColor: c.surface }]}>
    <View style={[styles.endingIcon, { backgroundColor: c.primary + '20' }]}>
      <Ionicons name="heart" size={32} color={c.primary} />
    </View>
    {showTranslation && (
      <Text style={[styles.endingText, { color: c.text }]}>
        {needsTranslation
          ? (translatedMiracles[-1]?.ending || miraclesData.ending_message_en)
          : miraclesData.ending_message_en}
      </Text>
    )}
    {showArabic && (
      <Text style={[styles.endingTextAr, { color: c.text }]}>
        {miraclesData.ending_message_ar}
      </Text>
    )}
  </View>
}
```

For non-AR/non-EN languages, the entire ending message (including the catchy hook) is translated via `translateText` and cached. The translation is stored at key `-1` in the `translatedMiracles` state object.

---

## Summary: Translation Pattern Consistency

All screens follow the same core pattern:

```
┌─────────────────────────────────────────────────────────────┐
│  appLanguage === 'ar'                                        │
│  → Render _ar fields directly                                │
│  → showArabic = true, showTranslation = false               │
├─────────────────────────────────────────────────────────────┤
│  appLanguage === 'en'                                        │
│  → Render _en fields directly                                │
│  → showArabic = true, showTranslation = true                │
├─────────────────────────────────────────────────────────────┤
│  appLanguage === 'ru' (or any other)                         │
│  → needsTranslation = true                                   │
│  → Async translate _en fields via translateText()            │
│  → Cache results in AsyncStorage                             │
│  → Render: translated text (fallback to _en) + _ar           │
│  → showArabic = true, showTranslation = true                │
└─────────────────────────────────────────────────────────────┘
```

### Screens Using MyMemory API Translation

| Screen | Fields Translated | Translation Trigger |
|--------|-------------------|---------------------|
| Scientific Miracles | title, quran, reference, science, source, ending | On mount (all 50 miracles) |
| Hadith | book names, hadith texts | Phase 1: on mount (books), Phase 2: on book select (hadiths) |
| Azkar | category names, item text, source | Phase 1: on mount (categories), Phase 2: on category select (items) |
| Sunnah | category names, item text, source | Phase 1: on mount (categories), Phase 2: on category select (items) |
| Q&A | question, answer, reference | On mount (all questions) |

### Screens Using Static Localized Strings

| Screen | Source | Fields |
|--------|--------|--------|
| Prayer Times | `contentTranslations.ts` | Prayer names (6), Hijri month names (12), Hijri suffix |
| Islamic Months | `contentTranslations.ts` | Hijri month names (12), Hijri suffix |
| Qibla | `isArabicUI` ternary | All UI strings (Arabic/English only) |
| Support Us | `isArabicUI` ternary | All UI strings (Arabic/English only) |
| About Us | `isArabicUI` ternary | All UI strings (Arabic/English only) |

### Screens Using Quran API Translations

| Screen | Source | Translation Service |
|--------|--------|-------------------|
| Surah Reader | `quranTranslations.ts` | fawazahmed0/quran-api CDN (per-surah, official scholarly editions) |

---

*This documentation covers 100% of the translation concepts, code patterns, and UI rendering logic across all screens in the Al-Qur'an app.*
