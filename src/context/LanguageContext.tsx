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
