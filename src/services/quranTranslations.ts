import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage } from '../i18n/translations';

const QURAN_TRANSLATION_PREFIX = '@quran_translation_';
const TRANSLATION_FETCHED_FLAG = '@quran_translation_fetched_';

export const QURAN_EDITIONS: Record<AppLanguage, string | null> = {
  ar: null,
  en: null,
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
  ms: 'msa-abdullahmuhamma',
};

const API_BASE = 'https://cdn.jsdelivr.net/gh/fawazahmed0/quran-api@1/editions';

type TranslationCache = Record<number, string[]>;

function getCacheKey(lang: AppLanguage): string {
  return `${QURAN_TRANSLATION_PREFIX}${lang}`;
}

function getFlagKey(lang: AppLanguage): string {
  return `${TRANSLATION_FETCHED_FLAG}${lang}`;
}

export async function fetchAndCacheSurahTranslation(
  lang: AppLanguage,
  surahNumber: number
): Promise<string[] | null> {
  const edition = QURAN_EDITIONS[lang];
  if (!edition) return null;

  const cacheKey = getCacheKey(lang);

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

  const cacheKey = getCacheKey(lang);

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

export async function isQuranTranslationCached(lang: AppLanguage): Promise<boolean> {
  if (lang === 'ar' || lang === 'en') return true;
  try {
    const flag = await AsyncStorage.getItem(getFlagKey(lang));
    return flag === 'true';
  } catch {
    return false;
  }
}

export async function preloadQuranTranslation(lang: AppLanguage): Promise<void> {
  if (lang === 'ar' || lang === 'en') return;

  // Preload first surah (Al-Fatiha) to verify connectivity and mark as fetched
  try {
    await fetchAndCacheSurahTranslation(lang, 1);
    await AsyncStorage.setItem(getFlagKey(lang), 'true');
  } catch (error) {
    console.error(`Failed to preload Quran translation for ${lang}:`, error);
  }
}
