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
import sunnahData from '../data/sunnah.json';

interface SunnahScreenProps {
  onBack: () => void;
}

const SunnahScreen: React.FC<SunnahScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage, showArabic, showTranslation } = useLanguage();
  const c = colors[theme];
  const [selectedCategory, setSelectedCategory] = useState<number | null>(null);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const isArabicUI = appLanguage === 'ar';
  const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';
  const { ui, translateUI } = useUITranslation(appLanguage);

  const categories = sunnahData.categories;

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      t('prophetSunnah'),
      t('sunnahs'),
      'Share',
      'Copy',
      'Copied!',
    ]);
  }, [appLanguage, needsTranslation]);

  const [translatedCategories, setTranslatedCategories] = useState<Record<number, string>>({});
  const [translatedItems, setTranslatedItems] = useState<Record<string, { text: string; source: string }>>({});

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

  useEffect(() => {
    if (!needsTranslation || selectedCategory === null) return;
    let cancelled = false;
    const category = categories.find(cat => cat.id === selectedCategory);
    if (!category) return;
    (async () => {
      const BATCH_SIZE = 10;
      for (let i = 0; i < category.items.length; i += BATCH_SIZE) {
        if (cancelled) return;
        const batch = category.items.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (item: typeof category.items[0], idx: number) => {
            const key = `${selectedCategory}_${i + idx}`;
            const [text, source] = await Promise.all([
              translateText(item.text_en, appLanguage),
              translateText(item.source_en, appLanguage),
            ]);
            return { key, data: { text, source } };
          })
        );
        if (cancelled) return;
        setTranslatedItems(prev => {
          const updated = { ...prev };
          for (const r of batchResults) updated[r.key] = r.data;
          return updated;
        });
      }
    })();
    return () => { cancelled = true; };
  }, [selectedCategory, needsTranslation, appLanguage]);

  const handleShare = useCallback(async (textAr: string, translatedText: string, textEn: string, translatedSource: string, sourceAr: string) => {
    let shareContent = `${translatedText}`;
    if (textAr) shareContent += `\n\n${textAr}`;
    if (textEn && textEn !== translatedText) shareContent += `\n\n"${textEn}"`;
    if (translatedSource) shareContent += `\n\n— ${translatedSource}`;
    if (sourceAr && sourceAr !== translatedSource) shareContent += `\n\n${sourceAr}`;
    try {
      await Share.share({ message: shareContent });
    } catch {
      // ignore
    }
  }, []);

  const handleCopy = useCallback(async (key: string, textAr: string, translatedText: string, textEn: string) => {
    let copyContent = `${translatedText}`;
    if (textAr) copyContent += `\n\n${textAr}`;
    if (textEn && textEn !== translatedText) copyContent += `\n\n${textEn}`;
    try {
      await Clipboard.setStringAsync(copyContent);
      setCopiedKey(key);
      setTimeout(() => setCopiedKey(null), 2000);
    } catch {
      // ignore
    }
  }, []);

  if (selectedCategory !== null) {
    const category = categories.find((cat) => cat.id === selectedCategory);
    if (!category) return null;

    return (
      <View style={[styles.container, { backgroundColor: c.background }]}>
        <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
        <View style={[styles.header, { backgroundColor: c.headerBg }]}>
          <TouchableOpacity onPress={() => setSelectedCategory(null)} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            {isArabicUI ? category.category_ar : (needsTranslation ? (translatedCategories[category.id] || category.category_en) : category.category_en)}
          </Text>
          <View style={{ width: 28 }} />
        </View>

        <FlatList
          key={`sunnah_${selectedCategory}`}
          data={category.items}
          keyExtractor={(item, index) => `${selectedCategory}_${index}`}
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
          renderItem={({ item, index }) => {
            const itemKey = `${selectedCategory}_${index}`;
            const isTranslationPrimary = appLanguage !== 'ar';
            const translatedText = isArabicUI ? item.text_en : (needsTranslation ? (translatedItems[itemKey]?.text || item.text_en) : item.text_en);
            const translatedSource = isArabicUI ? item.source_ar : (needsTranslation ? (translatedItems[itemKey]?.source || item.source_en) : item.source_en);
            return (
            <View style={[styles.sunnahItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
              {/* Action buttons row */}
              <View style={[styles.actionsRow, { borderTopColor: c.border }]}>
                {/* Share */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleShare(item.text_ar, translatedText, item.text_en, translatedSource, item.source_ar)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons name="share-outline" size={18} color={c.textSecondary} />
                  <Text style={[styles.actionLabel, { color: c.textSecondary }]}>
                    {isArabicUI ? 'مشاركة' : ui('Share')}
                  </Text>
                </TouchableOpacity>

                {/* Copy */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() => handleCopy(itemKey, item.text_ar, translatedText, item.text_en)}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Ionicons
                    name={copiedKey === itemKey ? 'checkmark-circle' : 'copy-outline'}
                    size={18}
                    color={copiedKey === itemKey ? '#34C759' : c.textSecondary}
                  />
                  <Text style={[styles.actionLabel, { color: copiedKey === itemKey ? '#34C759' : c.textSecondary }]}>
                    {copiedKey === itemKey
                      ? (isArabicUI ? 'تم النسخ' : ui('Copied!'))
                      : (isArabicUI ? 'نسخ' : ui('Copy'))}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Primary text (big) + Secondary text (small) — same pattern as SurahReaderScreen */}
              {isTranslationPrimary ? (
                <>
                  {/* Selected language translation — BIG/primary */}
                  {showTranslation && translatedText ? (
                    <Text style={[styles.primaryText, { color: c.text }]}>
                      {translatedText}
                    </Text>
                  ) : null}

                  {/* Arabic — smaller below */}
                  {showArabic && (
                    <Text style={[styles.arabicTextSecondary, { color: c.textSecondary }]}>
                      {item.text_ar}
                    </Text>
                  )}

                  {/* English — smaller below (only for non-EN, non-AR) */}
                  {appLanguage !== 'en' && showTranslation && item.text_en ? (
                    <Text style={[styles.englishTextSecondary, { color: c.textSecondary }]}>
                      {item.text_en}
                    </Text>
                  ) : null}
                </>
              ) : (
                <>
                  {/* Arabic — BIG/primary (for Arabic language mode) */}
                  {showArabic && (
                    <Text style={[styles.arabicText, { color: c.text }]}>
                      {item.text_ar}
                    </Text>
                  )}
                </>
              )}

              {/* Source */}
              <View style={[styles.sourceRow, { borderColor: c.border }]}>
                <Ionicons name="book-outline" size={13} color={c.textSecondary} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.sourceText, { color: c.primary }]}>
                    {translatedSource}
                  </Text>
                  {isTranslationPrimary && (
                    <Text style={[styles.sourceArabicText, { color: c.textSecondary }]}>
                      {item.source_ar}
                    </Text>
                  )}
                </View>
              </View>
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
          {isArabicUI ? 'سنن النبي' : ui(t('prophetSunnah'))}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={categories}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.categoryItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}
            onPress={() => setSelectedCategory(item.id)}
            activeOpacity={0.7}
          >
            <View style={[styles.categoryIcon, { backgroundColor: c.ayahBg }]}>
              <Ionicons name="heart-outline" size={24} color={c.primary} />
            </View>
            <View style={styles.categoryInfo}>
              <Text style={[styles.categoryTitle, { color: c.text }]}>
                {isArabicUI ? item.category_ar : (needsTranslation ? (translatedCategories[item.id] || item.category_en) : item.category_en)}
              </Text>
              <Text style={[styles.categoryCount, { color: c.textSecondary }]}>
                {item.items.length} {ui(t('sunnahs'))}
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
  listContent: { padding: 16 },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  categoryIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  categoryInfo: { flex: 1 },
  categoryTitle: { fontSize: 17, fontWeight: '600', marginBottom: 3 },
  categoryCount: { fontSize: 13 },
  sunnahItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 10,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 3,
    paddingHorizontal: 4,
  },
  actionLabel: {
    fontSize: 11,
  },
  arabicText: {
    fontSize: 20,
    lineHeight: 36,
    textAlign: 'right',
    marginBottom: 8,
  },
  englishText: { fontSize: 15, lineHeight: 24, marginBottom: 8 },
  source: { fontSize: 12, fontWeight: '600' },
  primaryText: {
    fontSize: 22,
    lineHeight: 36,
    marginBottom: 10,
  },
  arabicTextSecondary: {
    fontSize: 20,
    lineHeight: 38,
    textAlign: 'right',
    marginBottom: 8,
  },
  englishTextSecondary: {
    fontSize: 14,
    lineHeight: 22,
    fontStyle: 'italic',
    marginBottom: 4,
  },
  sourceRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 5,
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  sourceText: { fontSize: 12, fontWeight: '600' },
  sourceArabicText: {
    fontSize: 11,
    lineHeight: 18,
    marginTop: 2,
    textAlign: 'right',
  },
});

export default SunnahScreen;
