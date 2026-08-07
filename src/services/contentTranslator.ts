import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppLanguage } from '../i18n/translations';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['Translation error', 'Translation API error', 'AdMob']);

const CACHE_VERSION_PREFIX = '@content_translation_v3_';

const LANG_MAP: Record<AppLanguage, string> = {
  ar: 'ar',
  en: 'en',
  zh: 'zh-CN',
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
  ms: 'ms',
};

const GOOGLE_MAX_CHARS = 4500;
const MAX_RETRIES = 3;

function getCacheKey(lang: AppLanguage, text: string): string {
  let hash = 0;
  for (let i = 0; i < text.length; i++) {
    const char = text.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return `${CACHE_VERSION_PREFIX}${lang}_${Math.abs(hash)}`;
}

function splitTextIntoChunks(text: string, maxLen: number): string[] {
  if (text.length <= maxLen) return [text];
  const chunks: string[] = [];
  let remaining = text;
  while (remaining.length > 0) {
    if (remaining.length <= maxLen) {
      chunks.push(remaining);
      break;
    }
    let cutIdx = remaining.lastIndexOf('. ', maxLen);
    if (cutIdx === -1 || cutIdx < maxLen * 0.3) cutIdx = remaining.lastIndexOf('\n', maxLen);
    if (cutIdx === -1 || cutIdx < maxLen * 0.3) cutIdx = remaining.lastIndexOf(' ', maxLen);
    if (cutIdx === -1) cutIdx = maxLen;
    chunks.push(remaining.substring(0, cutIdx + 1).trim());
    remaining = remaining.substring(cutIdx + 1).trim();
  }
  return chunks;
}

function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function translateWithGoogleDirect(
  text: string,
  targetLang: AppLanguage,
  sourceLang: AppLanguage
): Promise<string | null> {
  const tl = LANG_MAP[targetLang];
  const sl = LANG_MAP[sourceLang] || 'en';
  const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(url);
      if (!response.ok) {
        if (attempt < MAX_RETRIES) {
          await delay(1000 * (attempt + 1));
          continue;
        }
        return null;
      }
      const data = await response.json();
      if (Array.isArray(data) && Array.isArray(data[0])) {
        const translatedParts: string[] = [];
        for (const segment of data[0]) {
          if (Array.isArray(segment) && typeof segment[0] === 'string') {
            translatedParts.push(segment[0]);
          }
        }
        const result = translatedParts.join('');
        if (result.trim().length > 0) return result;
      }
      if (attempt < MAX_RETRIES) {
        await delay(1000 * (attempt + 1));
        continue;
      }
      return null;
    } catch {
      if (attempt < MAX_RETRIES) {
        await delay(1000 * (attempt + 1));
        continue;
      }
      return null;
    }
  }
  return null;
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

  try {
    const cached = await AsyncStorage.getItem(cacheKey);
    if (cached !== null) return cached;
  } catch {}

  const chunks = splitTextIntoChunks(text, GOOGLE_MAX_CHARS);
  const translatedParts: string[] = [];

  for (let i = 0; i < chunks.length; i++) {
    const result = await translateWithGoogleDirect(chunks[i], targetLang, sourceLang);
    if (result) {
      translatedParts.push(result);
    } else {
      translatedParts.push(chunks[i]);
    }
  }

  const fullTranslation = translatedParts.join('\n');

  try {
    await AsyncStorage.setItem(cacheKey, fullTranslation);
  } catch {}

  return fullTranslation;
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
