import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
  Linking,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../services/contentTranslator';
import { useUITranslation } from '../hooks/useUITranslation';

let _miraclesData: any = null;
function getMiraclesData(): any {
  if (!_miraclesData) {
    _miraclesData = require('../data/scientific_miracles.json');
  }
  return _miraclesData;
}

interface ScientificMiraclesScreenProps {
  onBack: () => void;
}

interface TranslatedMiracle {
  title: string;
  quran: string;
  reference: string;
  science: string;
  source: string;
  ending: string;
}

const ScientificMiraclesScreen: React.FC<ScientificMiraclesScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage, showArabic, showTranslation } = useLanguage();
  const c = colors[theme];
  const isArabicUI = appLanguage === 'ar';
  const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';
  const { ui, translateUI } = useUITranslation(appLanguage);

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      t('scientificMiracles'),
      t('scientificReference'),
    ]);
  }, [appLanguage, needsTranslation]);

  const miraclesData = getMiraclesData();

  const [translatedMiracles, setTranslatedMiracles] = useState<Record<number, TranslatedMiracle>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!needsTranslation) {
      setTranslatedMiracles({});
      setIsTranslating(false);
      return;
    }
    let cancelled = false;
    setIsTranslating(true);

    (async () => {
      const BATCH_SIZE = 10;
      const miracles = miraclesData.miracles;
      const allResults: Record<number, TranslatedMiracle> = {};

      for (let i = 0; i < miracles.length; i += BATCH_SIZE) {
        if (cancelled) return;
        const batch = miracles.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (miracle: typeof miraclesData.miracles[0]) => {
            const [title, quran, reference, science, source] = await Promise.all([
              translateText(miracle.title_en, appLanguage),
              translateText(miracle.quran_en, appLanguage),
              translateText(miracle.reference_en, appLanguage),
              translateText(miracle.science_en, appLanguage),
              translateText(miracle.source_en || '', appLanguage),
            ]);
            return {
              id: miracle.id,
              data: { title, quran, reference, science, source, ending: '' },
            };
          })
        );
        if (cancelled) return;
        for (const r of batchResults) allResults[r.id] = r.data;
        // Still update progressively but without causing scroll jumps
        setTranslatedMiracles((prev) => {
          const updated = { ...prev };
          for (const r of batchResults) updated[r.id] = r.data;
          return updated;
        });
      }

      const endingMsg = await translateText(miraclesData.ending_message_en || '', appLanguage);
      if (cancelled) return;
      allResults[-1] = { title: '', quran: '', reference: '', science: '', source: '', ending: endingMsg };
      setTranslatedMiracles((prev) => ({
        ...prev,
        [-1]: { title: '', quran: '', reference: '', science: '', source: '', ending: endingMsg },
      }));
      setIsTranslating(false);
    })();

    return () => { cancelled = true; };
  }, [appLanguage, needsTranslation]);

  return (
    <View style={[styles.container, { backgroundColor: c.background }]}>
      <StatusBar barStyle="light-content" backgroundColor={c.headerBg} />
      <View style={[styles.header, { backgroundColor: c.headerBg }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
          {isArabicUI ? 'إعجاز علمي' : ui(t('scientificMiracles'))}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={miraclesData.miracles}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={styles.listContent}
        initialNumToRender={6}
        maxToRenderPerBatch={6}
        windowSize={15}
        removeClippedSubviews={false}
        scrollEventThrottle={16}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToTopThreshold: 100,
        }}
        renderItem={({ item }) => (
          <View style={[styles.miracleItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
            <Text style={[styles.miracleTitle, { color: c.primary }]}>
              {isArabicUI ? item.title_ar : (needsTranslation ? (translatedMiracles[item.id]?.title || item.title_en) : item.title_en)}
            </Text>

            {/* Quran verse */}
            <View style={[styles.verseBox, { backgroundColor: c.ayahBg, borderLeftColor: c.primary }]}>
              {showArabic && (
                <Text style={[styles.quranArabic, { color: c.text }]}>{item.quran_ar}</Text>
              )}
              {showTranslation && (
                <Text style={[styles.quranEnglish, { color: c.textSecondary }]}>{`"${needsTranslation ? (translatedMiracles[item.id]?.quran || item.quran_en) : item.quran_en}"`}</Text>
              )}
              <Text style={[styles.reference, { color: c.primary }]}>
                {isArabicUI ? item.reference_ar : (needsTranslation ? (translatedMiracles[item.id]?.reference || item.reference_en) : item.reference_en)}
              </Text>
            </View>

            {/* Science explanation */}
            {showTranslation && (
              <Text style={[styles.scienceText, { color: c.text }]}>{needsTranslation ? (translatedMiracles[item.id]?.science || item.science_en) : item.science_en}</Text>
            )}
            {showArabic && (
              <Text style={[styles.scienceTextAr, { color: c.text }]}>{item.science_ar}</Text>
            )}

            {/* Scientific Source Reference */}
            {showTranslation && item.source_en && (
              <View style={[styles.sourceBox, { backgroundColor: c.ayahBg, borderLeftColor: '#3b82f6' }]}>
                <View style={styles.sourceHeader}>
                  <Ionicons name="document-text" size={14} color="#3b82f6" />
                  <Text style={styles.sourceLabel}>{isArabicUI ? 'المرجع العلمي' : ui(t('scientificReference'))}</Text>
                </View>
                <Text style={[styles.sourceText, { color: c.textSecondary }]}>{needsTranslation ? (translatedMiracles[item.id]?.source || item.source_en) : item.source_en}</Text>
              </View>
            )}
            {showArabic && item.source_ar && (
              <View style={[styles.sourceBox, { backgroundColor: c.ayahBg, borderLeftColor: '#3b82f6' }]}>
                <View style={styles.sourceHeader}>
                  <Ionicons name="document-text" size={14} color="#3b82f6" />
                  <Text style={styles.sourceLabel}>المرجع العلمي</Text>
                </View>
                <Text style={[styles.sourceTextAr, { color: c.textSecondary }]}>{item.source_ar}</Text>
              </View>
            )}
          </View>
        )}
        ListFooterComponent={
          <View style={[styles.endingMessage, { backgroundColor: c.surface }]}>
            <View style={[styles.endingIcon, { backgroundColor: c.primary + '20' }]}>
              <Ionicons name="heart" size={32} color={c.primary} />
            </View>
            {showTranslation && (
              <Text style={[styles.endingText, { color: c.text }]}>
                {needsTranslation ? (translatedMiracles[-1]?.ending || miraclesData.ending_message_en) : miraclesData.ending_message_en}
              </Text>
            )}
            {showArabic && (
              <Text style={[styles.endingTextAr, { color: c.text }]}>
                {miraclesData.ending_message_ar}
              </Text>
            )}
          </View>
        }
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
  miracleItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  miracleTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  verseBox: {
    padding: 14,
    borderRadius: 10,
    borderLeftWidth: 4,
    marginBottom: 12,
  },
  quranArabic: {
    fontSize: 22,
    lineHeight: 38,
    textAlign: 'right',
    marginBottom: 8,
  },
  quranEnglish: {
    fontSize: 15,
    lineHeight: 24,
    fontStyle: 'italic',
    marginBottom: 6,
  },
  reference: { fontSize: 13, fontWeight: '600' },
  scienceText: { fontSize: 15, lineHeight: 24, marginBottom: 8 },
  scienceTextAr: { fontSize: 15, lineHeight: 26, textAlign: 'right', marginBottom: 8 },
  sourceBox: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginTop: 4,
  },
  sourceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 6,
  },
  sourceLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#3b82f6',
  },
  sourceText: {
    fontSize: 12,
    lineHeight: 18,
  },
  sourceTextAr: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
  },
  endingMessage: {
    marginTop: 8,
    marginBottom: 24,
    padding: 24,
    borderRadius: 16,
    alignItems: 'center',
  },
  endingIcon: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  endingText: {
    fontSize: 15,
    lineHeight: 26,
    textAlign: 'center',
  },
  endingTextAr: {
    fontSize: 16,
    lineHeight: 30,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default ScientificMiraclesScreen;
