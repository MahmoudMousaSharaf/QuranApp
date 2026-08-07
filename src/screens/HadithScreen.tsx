import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Share,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../services/contentTranslator';
import { useUITranslation } from '../hooks/useUITranslation';

let _hadithData: any = null;
function getHadithData(): any {
  if (!_hadithData) {
    _hadithData = require('../data/hadith_offline.json');
  }
  return _hadithData;
}

interface HadithScreenProps {
  onBack: () => void;
}

const HadithScreen: React.FC<HadithScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage, showArabic, showTranslation } = useLanguage();
  const c = colors[theme];
  const isArabicUI = appLanguage === 'ar';
  const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';
  const { ui, translateUI } = useUITranslation(appLanguage);

  const [selectedBook, setSelectedBook] = useState<string | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [translatedBooks, setTranslatedBooks] = useState<Record<string, string>>({});
  const [translatedHadiths, setTranslatedHadiths] = useState<Record<string, { text: string; title: string; narrator: string; source: string }>>({});

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      'No results found',
      'hadiths',
    ]);
  }, [appLanguage, needsTranslation]);

  const hadithData = getHadithData();
  const books = Object.entries(hadithData).map(([id, data]: [string, any]) => ({
    id,
    name_ar: data.name_ar,
    name_en: data.name_en,
    count: data.count,
    hadiths: data.hadiths,
  }));

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

  useEffect(() => {
    if (!needsTranslation || !selectedBook) return;
    let cancelled = false;
    const book = books.find(b => b.id === selectedBook);
    if (!book) return;
    (async () => {
      const BATCH_SIZE = 5;
      for (let i = 0; i < book.hadiths.length; i += BATCH_SIZE) {
        if (cancelled) return;
        const batch = book.hadiths.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (hadith: typeof book.hadiths[0]) => {
            const key = `${selectedBook}_${hadith.number}`;
            const [text, title, narrator, source] = await Promise.all([
              translateText(hadith.english || '', appLanguage),
              translateText(hadith.title || '', appLanguage),
              translateText(hadith.narrator || '', appLanguage),
              translateText(hadith.source || '', appLanguage),
            ]);
            return { key, data: { text, title, narrator, source } };
          })
        );
        if (cancelled) return;
        setTranslatedHadiths(prev => {
          const updated = { ...prev };
          for (const r of batchResults) updated[r.key] = r.data;
          return updated;
        });
      }
    })();
    return () => { cancelled = true; };
  }, [selectedBook, needsTranslation, appLanguage]);

  const handleShare = useCallback(async (arabicText: string, translatedText: string, englishText: string, title: string, narrator: string, source: string) => {
    let shareContent = `${title}`;
    if (narrator) shareContent += `\n${narrator}`;
    shareContent += `\n\n${translatedText}`;
    if (arabicText) shareContent += `\n\n${arabicText}`;
    if (englishText && englishText !== translatedText) shareContent += `\n\n"${englishText}"`;
    if (source) shareContent += `\n\n— ${source}`;
    try {
      await Share.share({ message: shareContent });
    } catch {
      // ignore
    }
  }, []);

  const handleCopy = useCallback(async (key: string, arabicText: string, translatedText: string, englishText: string, title: string) => {
    let copyContent = title ? `${title}\n\n` : '';
    copyContent += translatedText;
    if (arabicText) copyContent += `\n\n${arabicText}`;
    if (englishText && englishText !== translatedText) copyContent += `\n\n${englishText}`;
    try {
      await Clipboard.setStringAsync(copyContent);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore
    }
  }, []);

  if (selectedBook) {
    const book = books.find(b => b.id === selectedBook);
    if (!book) return null;

    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
        <View style={[styles.header, { backgroundColor: c.headerBg }]}>
          <TouchableOpacity onPress={() => setSelectedBook(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isArabicUI ? book.name_ar : (needsTranslation ? (translatedBooks[book.id] || book.name_en) : book.name_en)}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <FlatList
          key={`hadiths_${selectedBook}`}
          data={book.hadiths}
          keyExtractor={(item) => String(item.number)}
          contentContainerStyle={styles.listContent}
          initialNumToRender={8}
          maxToRenderPerBatch={8}
          windowSize={15}
          removeClippedSubviews={false}
          scrollEventThrottle={16}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
            autoscrollToTopThreshold: 100,
          }}
          renderItem={({ item }) => {
            const hadithKey = `${selectedBook}_${item.number}`;
            const isTranslationPrimary = appLanguage !== 'ar';
            const translatedData = translatedHadiths[hadithKey];
            const translatedText = isArabicUI ? item.english : (needsTranslation ? (translatedData?.text || item.english) : item.english);
            const translatedTitle = isArabicUI ? item.title : (needsTranslation ? (translatedData?.title || item.title) : item.title);
            const translatedNarrator = isArabicUI ? item.narrator : (needsTranslation ? (translatedData?.narrator || item.narrator) : item.narrator);
            const translatedSource = isArabicUI ? item.source : (needsTranslation ? (translatedData?.source || item.source) : item.source);
            return (
            <View style={[styles.hadithItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
              <View style={styles.hadithHeaderRow}>
                <View style={[styles.hadithNumber, { backgroundColor: c.primary }]}>
                  <Text style={styles.hadithNumberText}>{item.number}</Text>
                </View>
                <View style={styles.hadithActions}>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleShare(item.arabic, translatedText, item.english, translatedTitle, translatedNarrator, translatedSource)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons name="share-outline" size={18} color={c.textSecondary} />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.actionBtn}
                    onPress={() => handleCopy(hadithKey, item.arabic, translatedText, item.english, translatedTitle)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <Ionicons
                      name={copiedKey === hadithKey ? 'checkmark-circle' : 'copy-outline'}
                      size={18}
                      color={copiedKey === hadithKey ? '#34C759' : c.textSecondary}
                    />
                  </TouchableOpacity>
                </View>
              </View>

              {isTranslationPrimary ? (
                <>
                  {/* Selected language — BIG/primary */}
                  {translatedTitle ? (
                    <Text style={[styles.primaryTitle, { color: c.text }]}>
                      {translatedTitle}
                    </Text>
                  ) : null}
                  {translatedNarrator ? (
                    <Text style={[styles.primaryNarrator, { color: c.textSecondary }]}>
                      {translatedNarrator}
                    </Text>
                  ) : null}
                  {showTranslation && translatedText ? (
                    <Text style={[styles.primaryText, { color: c.text }]}>
                      {translatedText}
                    </Text>
                  ) : null}

                  {/* Arabic — smaller below */}
                  {showArabic && item.arabic ? (
                    <Text style={[styles.arabicTextSecondary, { color: c.textSecondary }]}>
                      {item.arabic}
                    </Text>
                  ) : null}

                  {/* English — smaller below (only for non-EN, non-AR) */}
                  {appLanguage !== 'en' && showTranslation && item.english ? (
                    <Text style={[styles.englishTextSecondary, { color: c.textSecondary }]}>
                      {item.english}
                    </Text>
                  ) : null}
                </>
              ) : (
                <>
                  {/* Arabic — BIG/primary (for Arabic language mode) */}
                  {showArabic && item.arabic ? (
                    <Text style={[styles.arabicText, { color: c.text }]}>
                      {item.arabic}
                    </Text>
                  ) : null}
                  {/* English title/narrator as secondary in Arabic mode */}
                  {item.title ? (
                    <Text style={[styles.englishTextSecondary, { color: c.textSecondary }]}>
                      {item.title}
                    </Text>
                  ) : null}
                </>
              )}

              {/* Source */}
              {translatedSource ? (
                <View style={[styles.sourceRow, { borderTopColor: c.border }]}>
                  <Ionicons name="book-outline" size={13} color={c.textSecondary} />
                  <Text style={[styles.sourceText, { color: c.textSecondary }]}>
                    {translatedSource}
                  </Text>
                </View>
              ) : null}
            </View>
          );
          }}
        />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isArabicUI ? 'كتب الحديث' : ui(t('hadithCollections'))}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <View style={[styles.offlineBadge, { backgroundColor: c.ayahBg, borderLeftColor: c.primary }]}>
        <Ionicons name="cloud-offline-outline" size={18} color={c.primary} />
        <Text style={[styles.offlineText, { color: c.textSecondary }]}>
          {isArabicUI ? 'يعمل بدون إنترنت — جميع الأحاديث محفوظة في التطبيق' : ui(t('worksOfflineHadith'))}
        </Text>
      </View>

      <FlatList
        data={books}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.bookItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}
            onPress={() => setSelectedBook(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.bookIcon, { backgroundColor: c.ayahBg }]}>
              <Ionicons name="library" size={24} color={c.primary} />
            </View>
            <View style={styles.bookInfo}>
              <Text style={[styles.bookTitle, { color: c.text }]}>
                {isArabicUI ? item.name_ar : (needsTranslation ? (translatedBooks[item.id] || item.name_en) : item.name_en)}
              </Text>
              <Text style={[styles.bookCount, { color: c.textSecondary }]}>
                {item.count} {isArabicUI ? 'حديث' : ui('hadiths')}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={c.textSecondary} />
          </TouchableOpacity>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50,
    paddingHorizontal: 12,
    paddingBottom: 14,
  },
  backBtn: { padding: 4 },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 18, fontWeight: 'bold', color: '#fff' },
  offlineBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    gap: 8,
  },
  offlineText: { fontSize: 12, flex: 1 },
  listContent: { padding: 16 },
  bookItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  bookIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  bookInfo: { flex: 1 },
  bookTitle: { fontSize: 17, fontWeight: '600', marginBottom: 3 },
  bookCount: { fontSize: 13 },
  hadithItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  hadithHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  hadithActions: {
    flexDirection: 'row',
    gap: 4,
  },
  actionBtn: {
    padding: 6,
  },
  hadithNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  hadithNumberText: { color: '#fff', fontSize: 13, fontWeight: '700' },
  arabicText: {
    fontSize: 18,
    lineHeight: 34,
    textAlign: 'right',
    marginBottom: 10,
  },
  englishText: { fontSize: 14, lineHeight: 22 },
  primaryTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  primaryNarrator: {
    fontSize: 14,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  primaryText: {
    fontSize: 17,
    lineHeight: 28,
    marginBottom: 10,
  },
  arabicTextSecondary: {
    fontSize: 16,
    lineHeight: 30,
    textAlign: 'right',
    marginBottom: 8,
  },
  englishTextSecondary: {
    fontSize: 13,
    lineHeight: 21,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sourceText: { fontSize: 12, flex: 1 },
});

export default HadithScreen;
