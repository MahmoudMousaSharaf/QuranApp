import { SurahMeta, SurahData } from '../types';
import AsyncStorage from '@react-native-async-storage/async-storage';
import surahListData from '../data/quran/surah_list.json';

let _fullQuran: Record<number, any> | null = null;
const _surahCache = new Map<number, SurahData>();
const SURAH_CACHE_PREFIX = '@surah_cache_';

function getFullQuran(): Record<number, any> {
  if (!_fullQuran) {
    _fullQuran = require('../data/quran/full_quran.json');
  }
  return _fullQuran!;
}

export async function fetchAllSurahs(): Promise<SurahMeta[]> {
  return surahListData as SurahMeta[];
}

export async function fetchSurah(surahNumber: number): Promise<SurahData> {
  // 1. Check memory cache first (instant)
  const memCached = _surahCache.get(surahNumber);
  if (memCached) return memCached;

  // 2. Check AsyncStorage cache (fast, persists across app restarts)
  try {
    const stored = await AsyncStorage.getItem(`${SURAH_CACHE_PREFIX}${surahNumber}`);
    if (stored) {
      const parsed: SurahData = JSON.parse(stored);
      _surahCache.set(surahNumber, parsed);
      return parsed;
    }
  } catch {
    // ignore storage errors
  }

  // 3. Parse from bundled JSON (slower, first-time load)
  const fullQuran = getFullQuran();
  const surah = fullQuran[surahNumber];
  if (!surah) {
    throw new Error(`Surah ${surahNumber} not found`);
  }

  const surahData: SurahData = {
    arabic: surah.ayahs.map((a: any) => ({
      number: a.number,
      numberInSurah: a.numberInSurah,
      text: a.text,
    })),
    english: surah.ayahs.map((a: any) => ({
      number: a.number,
      numberInSurah: a.numberInSurah,
      text: a.englishText,
    })),
    meta: {
      number: surah.number,
      name: surah.name,
      englishName: surah.englishName,
      englishNameTranslation: surah.englishNameTranslation,
      numberOfAyahs: surah.numberOfAyahs,
      revelationType: surah.revelationType,
    },
  };

  // Cache in memory and AsyncStorage
  _surahCache.set(surahNumber, surahData);
  try {
    AsyncStorage.setItem(`${SURAH_CACHE_PREFIX}${surahNumber}`, JSON.stringify(surahData));
  } catch {
    // ignore storage errors
  }

  return surahData;
}

export async function searchQuran(
  query: string,
  language: 'ar' | 'en' = 'en'
): Promise<any[]> {
  const fullQuran = getFullQuran();
  const q = query.toLowerCase().trim();
  if (!q) return [];

  const results: any[] = [];
  const field = language === 'ar' ? 'text' : 'englishText';

  for (let i = 1; i <= 114; i++) {
    const surah = fullQuran[i];
    if (!surah) continue;
    for (const ayah of surah.ayahs) {
      if (ayah[field].toLowerCase().includes(q)) {
        results.push({
          surahNumber: surah.number,
          surahName: surah.englishName,
          ayahNumber: ayah.numberInSurah,
          text: language === 'ar' ? ayah.text : ayah.englishText,
          arabicText: ayah.text,
        });
      }
    }
    if (results.length >= 100) break;
  }

  return results;
}
