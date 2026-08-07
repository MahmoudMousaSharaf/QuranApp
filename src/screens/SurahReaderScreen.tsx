import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  ActivityIndicator,
  Share,
  useWindowDimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { SurahData, Bookmark } from '../types';
import { fetchSurah } from '../services/api';
import {
  isBookmarked,
  saveBookmark,
  removeBookmark,
  saveLastSurah,
} from '../services/storage';
import { getQuranTranslation } from '../services/quranTranslations';

interface SurahReaderScreenProps {
  surahNumber: number;
  surahMeta: { englishName: string } | null;
  onBack: () => void;
  onPrevSurah: () => void;
  onNextSurah: () => void;
  hasPrev: boolean;
  hasNext: boolean;
  scrollToAyah?: number | null;
  onScrolledToAyah?: () => void;
}

const SurahReaderScreen: React.FC<SurahReaderScreenProps> = ({
  surahNumber,
  surahMeta,
  onBack,
  onPrevSurah,
  onNextSurah,
  hasPrev,
  hasNext,
  scrollToAyah,
  onScrolledToAyah,
}) => {
  const { theme } = useTheme();
  const { t, appLanguage, showArabic, showTranslation, translationLabel } = useLanguage();
  const c = colors[theme];
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;

  const [data, setData] = useState<SurahData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [bookmarkSet, setBookmarkSet] = useState<Set<string>>(new Set());
  const [translationTexts, setTranslationTexts] = useState<string[] | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const pendingScrollRef = useRef<number | null>(null);

  useEffect(() => {
    if (scrollToAyah != null) {
      pendingScrollRef.current = scrollToAyah;
    }
  }, [scrollToAyah]);

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

  useEffect(() => {
    if (pendingScrollRef.current != null && data && !loading) {
      const targetAyah = pendingScrollRef.current;
      const index = data.arabic.findIndex(a => a.numberInSurah === targetAyah);
      if (index >= 0) {
        const timer = setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index,
            animated: true,
            viewPosition: 0.3,
          });
          pendingScrollRef.current = null;
          if (onScrolledToAyah) onScrolledToAyah();
        }, 300);
        return () => clearTimeout(timer);
      } else {
        pendingScrollRef.current = null;
        if (onScrolledToAyah) onScrolledToAyah();
      }
    }
  }, [data, loading]);

  const toggleBookmark = useCallback(
    async (ayahNumberInSurah: number, text: string) => {
      const key = `${surahNumber}:${ayahNumberInSurah}`;
      const next = new Set(bookmarkSet);
      if (next.has(key)) {
        next.delete(key);
        await removeBookmark(surahNumber, ayahNumberInSurah);
      } else {
        next.add(key);
        const bookmark: Bookmark = {
          surahNumber,
          ayahNumber: ayahNumberInSurah,
          surahName: surahMeta?.englishName || `Surah ${surahNumber}`,
          text: text.substring(0, 100),
        };
        await saveBookmark(bookmark);
      }
      setBookmarkSet(next);
    },
    [bookmarkSet, surahNumber, surahMeta]
  );

  const handleShare = useCallback(
    async (arabicText: string, englishText: string, ayahNum: number) => {
      const shareText = `${arabicText}\n\n"${englishText}"\n\n— Surah ${surahMeta?.englishName || surahNumber}, Ayah ${ayahNum}`;
      try {
        await Share.share({ message: shareText });
      } catch {
        // ignore
      }
    },
    [surahNumber, surahMeta]
  );

  const getTranslationText = (index: number): string => {
    if (appLanguage === 'ar') return '';
    if (appLanguage === 'en') return data?.english[index]?.text || '';
    return translationTexts?.[index] || data?.english[index]?.text || '';
  };

  const getEnglishText = (index: number): string => {
    return data?.english[index]?.text || '';
  };

  // Whether the selected language translation is the primary (big) text
  const isTranslationPrimary = appLanguage !== 'ar';

  const renderAyah = useCallback(
    ({ item, index }: { item: any; index: number }) => {
      const arabicAyah = item;
      const translationText = getTranslationText(index);
      const bookmarkKey = `${surahNumber}:${arabicAyah.numberInSurah}`;
      const isBm = bookmarkSet.has(bookmarkKey);

      return (
        <View style={[styles.ayahContainer, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
          {/* Ayah header */}
          <View style={styles.ayahHeader}>
            <View style={[styles.ayahBadge, { backgroundColor: c.ayahBg }]}>
              <Text style={[styles.ayahBadgeText, { color: c.primary }]}>
                {arabicAyah.numberInSurah}
              </Text>
            </View>
            {arabicAyah.sajda && (
              <View style={[styles.sajdaBadge, { backgroundColor: theme === 'dark' ? '#422006' : '#fef3c7' }]}>
                <Text style={[styles.sajdaText, { color: theme === 'dark' ? '#fbbf24' : '#92400e' }]}>
                  {t('sajda')}
                </Text>
              </View>
            )}
            <View style={styles.ayahActions}>
              <TouchableOpacity
                onPress={() => toggleBookmark(arabicAyah.numberInSurah, translationText || arabicAyah.text)}
                style={styles.actionBtn}
              >
                <Ionicons
                  name={isBm ? 'bookmark' : 'bookmark-outline'}
                  size={18}
                  color={isBm ? c.bookmarkActive : c.textSecondary}
                />
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => handleShare(arabicAyah.text, translationText, arabicAyah.numberInSurah)}
                style={styles.actionBtn}
              >
                <Ionicons name="share-social-outline" size={18} color={c.textSecondary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Primary text (big) + Secondary text (small) */}
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
                <Text
                  style={[
                    styles.arabicTextSecondary,
                    isSmallScreen && styles.arabicTextSecondarySmall,
                    { color: c.textSecondary },
                  ]}
                >
                  {arabicAyah.text}
                </Text>
              )}

              {/* English translation - smaller below Arabic (only for non-EN, non-AR) */}
              {appLanguage !== 'en' && showTranslation && getEnglishText(index) ? (
                <Text style={[styles.englishTextSecondary, { color: c.textSecondary }]}>
                  {getEnglishText(index)}
                </Text>
              ) : null}
            </>
          ) : (
            <>
              {/* Arabic - BIG/primary (for Arabic language mode) */}
              {showArabic && (
                <Text
                  style={[
                    styles.arabicText,
                    isSmallScreen && styles.arabicTextSmall,
                    { color: c.text },
                  ]}
                >
                  {arabicAyah.text}
                  {' '}
                  <Text style={[styles.ayahCircle, { color: c.primary }]}>
                    {arabicAyah.numberInSurah}
                  </Text>
                </Text>
              )}
            </>
          )}
        </View>
      );
    },
    [c, theme, bookmarkSet, surahNumber, showArabic, showTranslation, data, translationTexts, appLanguage, isSmallScreen, isTranslationPrimary, toggleBookmark, handleShare]
  );

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />

      {/* Top bar */}
      <View style={[styles.topBar, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.topBarCenter}>
          <Text style={styles.topBarTitle} numberOfLines={1}>
            {surahMeta?.englishName || `Surah ${surahNumber}`}
          </Text>
          <Text style={styles.topBarSubtitle} numberOfLines={1}>
            {data?.meta
              ? `${data.meta.englishNameTranslation} · ${data.meta.numberOfAyahs} Ayahs`
              : 'Loading...'}
          </Text>
        </View>
        <View style={[styles.langBtn, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
          <Ionicons name="language" size={16} color="#fff" />
          <Text style={styles.langBtnText}>{translationLabel}</Text>
        </View>
      </View>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={c.primary} />
          <Text style={[styles.loadingText, { color: c.textSecondary }]}>
            {t('loadingSurah')}
          </Text>
        </View>
      )}

      {error && (
        <View style={styles.loadingContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={c.error} />
          <Text style={[styles.loadingText, { color: c.error }]}>{error}</Text>
        </View>
      )}

      {!loading && !error && data && (
        <FlatList
          ref={flatListRef}
          data={data.arabic}
          keyExtractor={(item) => String(item.number)}
          renderItem={renderAyah}
          contentContainerStyle={styles.listContent}
          initialNumToRender={10}
          maxToRenderPerBatch={10}
          windowSize={10}
          removeClippedSubviews={true}
          onScrollToIndexFailed={({ index, highestMeasuredFrameIndex }) => {
            flatListRef.current?.scrollToOffset({
              offset: highestMeasuredFrameIndex * 100,
              animated: true,
            });
            setTimeout(() => {
              flatListRef.current?.scrollToIndex({
                index,
                animated: true,
                viewPosition: 0.3,
              });
            }, 200);
          }}
          ListHeaderComponent={
            <View style={[styles.surahBanner, { backgroundColor: c.headerBg }]}>
              <Text style={styles.bannerArabic}>{data.meta.name}</Text>
              <Text style={styles.bannerEnglish}>
                {data.meta.englishName} — {data.meta.englishNameTranslation}
              </Text>
              <View style={styles.bannerMeta}>
                <View style={[styles.bannerPill, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.bannerPillText}>{data.meta.revelationType}</Text>
                </View>
                <View style={[styles.bannerPill, { backgroundColor: 'rgba(255,255,255,0.2)' }]}>
                  <Text style={styles.bannerPillText}>{data.meta.numberOfAyahs} {t('ayahs')}</Text>
                </View>
              </View>
            </View>
          }
          ListFooterComponent={
            <View style={styles.navContainer}>
              <TouchableOpacity
                onPress={onPrevSurah}
                disabled={!hasPrev}
                style={[
                  styles.navBtn,
                  {
                    backgroundColor: hasPrev ? c.primary : c.surfaceAlt,
                    opacity: hasPrev ? 1 : 0.5,
                  },
                ]}
              >
                <Ionicons name="chevron-back" size={18} color="#fff" />
                <Text style={styles.navBtnText}>{t('previous')}</Text>
              </TouchableOpacity>
              <Text style={[styles.navPosition, { color: c.textSecondary }]}>
                {surahNumber} / 114
              </Text>
              <TouchableOpacity
                onPress={onNextSurah}
                disabled={!hasNext}
                style={[
                  styles.navBtn,
                  {
                    backgroundColor: hasNext ? c.primary : c.surfaceAlt,
                    opacity: hasNext ? 1 : 0.5,
                  },
                ]}
              >
                <Text style={styles.navBtnText}>{t('next')}</Text>
                <Ionicons name="chevron-forward" size={18} color="#fff" />
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 12,
  },
  backBtn: {
    padding: 4,
  },
  topBarCenter: {
    flex: 1,
    marginLeft: 12,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#fff',
  },
  topBarSubtitle: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    marginTop: 1,
  },
  langBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  langBtnText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: '600',
    marginLeft: 4,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  listContent: {
    paddingBottom: 30,
  },
  surahBanner: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
    borderRadius: 16,
  },
  bannerArabic: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 6,
  },
  bannerEnglish: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    marginBottom: 10,
  },
  bannerMeta: {
    flexDirection: 'row',
    gap: 8,
  },
  bannerPill: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  bannerPillText: {
    fontSize: 11,
    color: '#fff',
  },
  ayahContainer: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    marginHorizontal: 16,
    marginBottom: 6,
    borderRadius: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  ayahHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  ayahBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  ayahBadgeText: {
    fontSize: 13,
    fontWeight: '700',
  },
  sajdaBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
  },
  sajdaText: {
    fontSize: 10,
    fontWeight: '600',
  },
  ayahActions: {
    flexDirection: 'row',
    marginLeft: 'auto',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
  arabicText: {
    fontSize: 26,
    lineHeight: 48,
    textAlign: 'right',
    marginBottom: 10,
  },
  arabicTextSmall: {
    fontSize: 22,
    lineHeight: 42,
  },
  ayahCircle: {
    fontSize: 16,
    fontWeight: '700',
  },
  englishText: {
    fontSize: 16,
    lineHeight: 26,
  },
  primaryText: {
    fontSize: 22,
    lineHeight: 36,
    marginBottom: 10,
  },
  ayahCirclePrimary: {
    fontSize: 14,
    fontWeight: '700',
  },
  arabicTextSecondary: {
    fontSize: 20,
    lineHeight: 38,
    textAlign: 'right',
    marginBottom: 8,
  },
  arabicTextSecondarySmall: {
    fontSize: 17,
    lineHeight: 32,
  },
  englishTextSecondary: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  navContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    marginTop: 8,
  },
  navBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    gap: 4,
  },
  navBtnText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  navPosition: {
    fontSize: 13,
  },
});

export default SurahReaderScreen;
