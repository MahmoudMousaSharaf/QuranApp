import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme, colors } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { translateText } from '../services/contentTranslator';
import { useUITranslation } from '../hooks/useUITranslation';

let _qaData: any = null;
function getQAData(): any {
  if (!_qaData) {
    _qaData = require('../data/qa_non_muslims.json');
  }
  return _qaData;
}

interface QAScreenProps {
  onBack: () => void;
}

interface TranslatedQA {
  question: string;
  answer: string;
  reference: string;
}

const QAScreen: React.FC<QAScreenProps> = ({ onBack }) => {
  const { theme } = useTheme();
  const { t, appLanguage, showArabic, showTranslation } = useLanguage();
  const c = colors[theme];
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const isArabicUI = appLanguage === 'ar';
  const needsTranslation = appLanguage !== 'ar' && appLanguage !== 'en';
  const { ui, translateUI } = useUITranslation(appLanguage);

  const qaData = getQAData();

  useEffect(() => {
    if (!needsTranslation) return;
    translateUI([
      t('questionsAnswers'),
      t('reference'),
    ]);
  }, [appLanguage, needsTranslation]);

  const [translatedQA, setTranslatedQA] = useState<Record<number, TranslatedQA>>({});
  const [isTranslating, setIsTranslating] = useState(false);

  useEffect(() => {
    if (!needsTranslation) {
      setTranslatedQA({});
      setIsTranslating(false);
      return;
    }
    let cancelled = false;
    setIsTranslating(true);

    (async () => {
      const BATCH_SIZE = 10;
      const questions = qaData.questions;

      for (let i = 0; i < questions.length; i += BATCH_SIZE) {
        if (cancelled) return;
        const batch = questions.slice(i, i + BATCH_SIZE);
        const batchResults = await Promise.all(
          batch.map(async (qa: typeof questions[0]) => {
            const [question, answer, reference] = await Promise.all([
              translateText(qa.question_en, appLanguage),
              translateText(qa.answer_en, appLanguage),
              translateText(qa.reference_en || '', appLanguage),
            ]);
            return {
              id: qa.id,
              data: { question, answer, reference } as TranslatedQA,
            };
          })
        );
        if (cancelled) return;
        setTranslatedQA((prev) => {
          const updated = { ...prev };
          for (const r of batchResults) updated[r.id] = r.data;
          return updated;
        });
      }
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
          {isArabicUI ? 'أسئلة وأجوبة' : ui(t('questionsAnswers'))}
        </Text>
        <View style={{ width: 28 }} />
      </View>

      <FlatList
        data={qaData.questions}
        keyExtractor={(item) => String(item.id)}
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
          const isExpanded = expandedId === item.id;
          return (
            <View style={[styles.qaItem, { backgroundColor: c.surface, borderBottomColor: c.border }]}>
              <TouchableOpacity
                onPress={() => setExpandedId(isExpanded ? null : item.id)}
                style={styles.qaHeader}
                activeOpacity={0.7}
              >
                <Text style={[styles.question, { color: c.text }]}>
                  {isArabicUI ? item.question_ar : (needsTranslation ? (translatedQA[item.id]?.question || item.question_en) : item.question_en)}
                </Text>
                <Ionicons
                  name={isExpanded ? 'chevron-up' : 'chevron-down'}
                  size={20}
                  color={c.primary}
                />
              </TouchableOpacity>
              {isExpanded && (
                <View style={styles.answerContainer}>
                  {showTranslation && (
                    <Text style={[styles.answer, { color: c.textSecondary }]}>{needsTranslation ? (translatedQA[item.id]?.answer || item.answer_en) : item.answer_en}</Text>
                  )}
                  {showArabic && (
                    <Text style={[styles.answerAr, { color: c.textSecondary }]}>{item.answer_ar}</Text>
                  )}
                  {showTranslation && item.reference_en && (
                    <View style={[styles.refBox, { backgroundColor: c.ayahBg, borderLeftColor: c.primary }]}>
                      <View style={styles.refHeader}>
                        <Ionicons name="bookmarks" size={14} color={c.primary} />
                        <Text style={[styles.refLabel, { color: c.primary }]}>{isArabicUI ? 'المرجع' : ui(t('reference'))}</Text>
                      </View>
                      <Text style={[styles.refText, { color: c.textSecondary }]}>{needsTranslation ? (translatedQA[item.id]?.reference || item.reference_en) : item.reference_en}</Text>
                    </View>
                  )}
                  {showArabic && item.reference_ar && (
                    <View style={[styles.refBox, { backgroundColor: c.ayahBg, borderLeftColor: c.primary }]}>
                      <View style={styles.refHeader}>
                        <Ionicons name="bookmarks" size={14} color={c.primary} />
                        <Text style={[styles.refLabel, { color: c.primary }]}>المرجع</Text>
                      </View>
                      <Text style={[styles.refTextAr, { color: c.textSecondary }]}>{item.reference_ar}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>
          );
        }}
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
  qaItem: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderRadius: 12,
    marginBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  qaHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  question: { fontSize: 16, fontWeight: '600', flex: 1, marginRight: 8 },
  answerContainer: { marginTop: 12 },
  answer: { fontSize: 14, lineHeight: 22, marginBottom: 8 },
  answerAr: { fontSize: 14, lineHeight: 24, textAlign: 'right', marginBottom: 8 },
  refBox: {
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 3,
    marginTop: 8,
  },
  refHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  refLabel: {
    fontSize: 12,
    fontWeight: '700',
  },
  refText: {
    fontSize: 12,
    lineHeight: 18,
  },
  refTextAr: {
    fontSize: 12,
    lineHeight: 20,
    textAlign: 'right',
  },
});

export default QAScreen;
