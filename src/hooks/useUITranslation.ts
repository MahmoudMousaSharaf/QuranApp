import { useState, useEffect, useRef } from 'react';
import { translateText } from '../services/contentTranslator';
import { AppLanguage } from '../i18n/translations';

/**
 * Hook to translate hardcoded UI strings for non-AR/non-EN languages.
 * Uses the contentTranslator service with AsyncStorage caching.
 * Returns translated strings keyed by the original English text.
 *
 * Usage:
 *   const { ui } = useUITranslation(appLanguage);
 *   ui('Facing Qibla') // returns translated string or 'Facing Qibla' if EN/AR/loading
 */
export function useUITranslation(appLanguage: AppLanguage) {
  const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const pendingRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!needsTranslation) {
      setTranslations({});
      return;
    }
  }, [appLanguage, needsTranslation]);

  const ui = (englishText: string): string => {
    if (!needsTranslation) return englishText;
    if (translations[englishText]) return translations[englishText];
    return englishText; // fallback while loading
  };

  // Translate a batch of strings and cache them
  const translateUI = async (texts: string[]) => {
    if (!needsTranslation) return;
    const toTranslate = texts.filter(
      (t) => t && t.trim().length > 0 && !translations[t] && !pendingRef.current.has(t)
    );
    if (toTranslate.length === 0) return;

    toTranslate.forEach((t) => pendingRef.current.add(t));

    const newTranslations: Record<string, string> = {};
    for (const text of toTranslate) {
      const translated = await translateText(text, appLanguage);
      newTranslations[text] = translated;
    }

    pendingRef.current.clear();
    setTranslations((prev) => ({ ...prev, ...newTranslations }));
  };

  return { ui, translateUI, needsTranslation };
}
