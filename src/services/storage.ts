import AsyncStorage from '@react-native-async-storage/async-storage';
import { Bookmark, LanguageMode } from '../types';

const BOOKMARKS_KEY = '@quran_bookmarks';
const LANGUAGE_KEY = '@quran_language';
const THEME_KEY = '@quran_theme';
const LAST_SURAH_KEY = '@quran_last_surah';

export async function getBookmarks(): Promise<Bookmark[]> {
  try {
    const data = await AsyncStorage.getItem(BOOKMARKS_KEY);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function saveBookmark(bookmark: Bookmark): Promise<void> {
  try {
    const existing = await getBookmarks();
    const filtered = existing.filter(
      (b) =>
        !(b.surahNumber === bookmark.surahNumber && b.ayahNumber === bookmark.ayahNumber)
    );
    const updated = [...filtered, bookmark];
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export async function removeBookmark(
  surahNumber: number,
  ayahNumber: number
): Promise<void> {
  try {
    const existing = await getBookmarks();
    const updated = existing.filter(
      (b) => !(b.surahNumber === surahNumber && b.ayahNumber === ayahNumber)
    );
    await AsyncStorage.setItem(BOOKMARKS_KEY, JSON.stringify(updated));
  } catch {
    // ignore
  }
}

export async function isBookmarked(
  surahNumber: number,
  ayahNumber: number
): Promise<boolean> {
  try {
    const existing = await getBookmarks();
    return existing.some(
      (b) => b.surahNumber === surahNumber && b.ayahNumber === ayahNumber
    );
  } catch {
    return false;
  }
}

export async function getLanguageMode(): Promise<LanguageMode> {
  try {
    const data = await AsyncStorage.getItem(LANGUAGE_KEY);
    return (data as LanguageMode) || 'both';
  } catch {
    return 'both';
  }
}

export async function saveLanguageMode(mode: LanguageMode): Promise<void> {
  try {
    await AsyncStorage.setItem(LANGUAGE_KEY, mode);
  } catch {
    // ignore
  }
}

export async function getTheme(): Promise<'light' | 'dark'> {
  try {
    const data = await AsyncStorage.getItem(THEME_KEY);
    return (data as 'light' | 'dark') || 'light';
  } catch {
    return 'light';
  }
}

export async function saveTheme(theme: 'light' | 'dark'): Promise<void> {
  try {
    await AsyncStorage.setItem(THEME_KEY, theme);
  } catch {
    // ignore
  }
}

export async function getLastSurah(): Promise<number> {
  try {
    const data = await AsyncStorage.getItem(LAST_SURAH_KEY);
    return data ? parseInt(data, 10) : 1;
  } catch {
    return 1;
  }
}

export async function saveLastSurah(surahNumber: number): Promise<void> {
  try {
    await AsyncStorage.setItem(LAST_SURAH_KEY, String(surahNumber));
  } catch {
    // ignore
  }
}
