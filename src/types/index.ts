export interface SurahMeta {
  number: number;
  name: string;
  englishName: string;
  englishNameTranslation: string;
  numberOfAyahs: number;
  revelationType: string;
}

export interface Ayah {
  number: number;
  text: string;
  numberInSurah: number;
  juz?: number;
  page?: number;
  sajda?: boolean;
}

export interface SurahData {
  arabic: Ayah[];
  english: Ayah[];
  meta: SurahMeta;
}

export type LanguageMode = 'ar' | 'en' | 'both';

export interface Bookmark {
  surahNumber: number;
  ayahNumber: number;
  surahName: string;
  text: string;
}
